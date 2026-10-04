import { alive, db } from '../db/db';
import { audit, create, currentActor, patch, remove, save } from '../db/write';
import { getSetting } from '../db/settings';
import { STATUS_LABEL, reschedule, themeByKey } from '../domain/calendar';
import { fmtIsoDate } from '../lib/time';
import type { Approval, Comment, Idea, Post, PostStatus, Snippet } from '../db/types';

const NO_APPROVAL: Approval = { state: 'none', by: null, at: null, note: '' };

export function blankPost(fields: Partial<Post> = {}): Omit<Post, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: '',
    date: null,
    time: '',
    themeKey: '',
    format: '',
    brief: '',
    status: 'todo',
    assignees: [],
    clientId: null,
    campaignId: null,
    funnelStage: null,
    series: '',
    platforms: [],
    hook: '',
    caption: '',
    captions: {},
    hashtags: '',
    cta: '',
    assetLink: '',
    links: {},
    postedAt: null,
    checklist: {},
    approval: NO_APPROVAL,
    ideaId: null,
    sort: 0,
    note: '',
    ...fields,
  };
}

export async function createPost(fields: Partial<Post> & { title: string }): Promise<Post> {
  const cadence = await getSetting('cadence');
  const base = blankPost({ platforms: [...cadence.platforms], ...fields });
  if (base.date && !fields.time) base.time = cadence.defaultTimes[base.platforms[0] ?? 'facebook'] ?? '';
  const sameDay = base.date ? await db.posts.where('date').equals(base.date).count() : 0;
  const p = await create<Post>(db.posts, { ...base, sort: fields.sort ?? sameDay });
  if (p.ideaId) await patch(db.ideas, p.ideaId, { status: 'scheduled', postId: p.id });
  await audit('create', 'post', p.id, `Added “${p.title || 'Untitled post'}”${p.date ? ` for ${fmtIsoDate(p.date)}` : ' to the backlog'}`);
  return p;
}

export async function savePost(next: Post): Promise<Post> {
  const prev = await db.posts.get(next.id);
  const out = { ...next };
  if (out.status === 'posted' && !out.postedAt) out.postedAt = Date.now();
  const saved = await save(db.posts, out);
  if (prev && prev.status !== saved.status) await audit('status', 'post', saved.id, `“${saved.title}”: ${STATUS_LABEL[prev.status]} → ${STATUS_LABEL[saved.status]}`);
  else if (prev && prev.date !== saved.date) await audit('move', 'post', saved.id, `Moved “${saved.title}” to ${saved.date ? fmtIsoDate(saved.date) : 'the backlog'}`);
  return saved;
}

export async function setStatus(id: string, status: PostStatus): Promise<void> {
  const p = await db.posts.get(id);
  if (!p || p.status === status) return;
  await patch(db.posts, id, { status, ...(status === 'posted' && !p.postedAt ? { postedAt: Date.now() } : {}) });
  await audit('status', 'post', id, `“${p.title}”: ${STATUS_LABEL[p.status]} → ${STATUS_LABEL[status]}`);
}

export async function movePost(id: string, date: string | null): Promise<void> {
  const p = await db.posts.get(id);
  if (!p || p.date === date) return;
  const cadence = await getSetting('cadence');
  const theme = date ? cadence.themes.find((t) => t.active && t.dow === new Date(`${date}T00:00:00`).getDay()) : undefined;
  // Keep the theme unless the post had none and the new day has one.
  await patch(db.posts, id, { date, ...(p.themeKey ? {} : theme ? { themeKey: theme.key } : {}) });
  await audit('move', 'post', id, `Moved “${p.title}” to ${date ? fmtIsoDate(date) : 'the backlog'}`);
}

export async function deletePost(id: string): Promise<void> {
  const p = await db.posts.get(id);
  await remove(db.posts, id);
  if (p?.ideaId) await patch(db.ideas, p.ideaId, { status: 'idea', postId: null });
  await audit('delete', 'post', id, `Deleted “${p?.title ?? 'a post'}”`);
}

export async function duplicatePost(id: string): Promise<Post | null> {
  const p = await db.posts.get(id);
  if (!p) return null;
  const { id: _id, createdAt: _c, updatedAt: _u, _sync, _dev, deleted: _d, ...rest } = p;
  void _id; void _c; void _u; void _sync; void _dev; void _d;
  return createPost({ ...rest, title: `${p.title} (copy)`, status: p.status === 'posted' ? 'todo' : p.status, links: {}, postedAt: null, approval: NO_APPROVAL });
}

// ----- comments and approvals -----

// Comments made in the same millisecond still keep their order.
let lastCommentAt = 0;

export async function addComment(postId: string, text: string, kind: Comment['kind'] = 'comment'): Promise<void> {
  if (!text.trim() && kind === 'comment') return;
  lastCommentAt = Math.max(Date.now(), lastCommentAt + 1);
  await create<Comment>(db.comments, { postId, authorId: currentActor(), text: text.trim(), at: lastCommentAt, kind });
}

export async function requestApproval(postId: string, note = ''): Promise<void> {
  const p = await db.posts.get(postId);
  if (!p) return;
  await patch(db.posts, postId, { approval: { state: 'requested', by: currentActor(), at: Date.now(), note }, status: p.status === 'ready' || p.status === 'scheduled' ? p.status : 'review' });
  await addComment(postId, note || 'Ready for review.', 'request');
  await audit('review', 'post', postId, `Asked for review: “${p.title}”`);
}

export async function decideApproval(postId: string, approved: boolean, note = ''): Promise<void> {
  const p = await db.posts.get(postId);
  if (!p) return;
  await patch(db.posts, postId, {
    approval: { state: approved ? 'approved' : 'changes', by: currentActor(), at: Date.now(), note },
    status: approved ? (p.status === 'review' || p.status === 'doing' || p.status === 'todo' ? 'ready' : p.status) : 'doing',
  });
  await addComment(postId, note || (approved ? 'Approved.' : 'Needs changes.'), approved ? 'approval' : 'changes');
  await audit(approved ? 'approve' : 'changes', 'post', postId, `${approved ? 'Approved' : 'Asked for changes on'} “${p.title}”`);
}

// ----- rescheduling -----

/**
 * Give unposted posts new dates from `start` (see domain/calendar reschedule).
 * Days that already have other posts are left alone. Returns what moved and what needs a decision.
 */
export async function previewReschedule(ids: string[], start: string): Promise<ReturnType<typeof reschedule>> {
  const cadence = await getSetting('cadence');
  const all = alive(await db.posts.toArray());
  const moving = all.filter((p) => ids.includes(p.id));
  const busy = new Set(all.filter((p) => !ids.includes(p.id) && p.date && p.date >= start && p.status !== 'skipped').map((p) => p.date as string));
  return reschedule(
    moving.map((p) => ({ id: p.id, date: p.date, themeKey: p.themeKey, title: p.title, brief: p.brief, sort: p.sort })),
    start,
    cadence,
    { busy },
  );
}

export async function applyReschedule(result: ReturnType<typeof reschedule>): Promise<void> {
  await db.transaction('rw', db.posts, db.audit, async () => {
    for (const x of result.placed) await patch(db.posts, x.id, { date: x.date, note: x.note });
    for (const u of result.unplaced) await patch(db.posts, u.id, { date: null, note: u.reason });
    await audit('reschedule', 'post', null, `Rescheduled ${result.placed.length} post${result.placed.length === 1 ? '' : 's'}${result.unplaced.length ? `; ${result.unplaced.length} left for a decision` : ''}`);
  });
}

// ----- ideas -----

export async function saveIdea(idea: Partial<Idea> & { title: string; kind: Idea['kind'] }): Promise<Idea> {
  if (idea.id) {
    const prev = await db.ideas.get(idea.id);
    if (prev) return save(db.ideas, { ...prev, ...idea } as Idea);
  }
  const count = await db.ideas.count();
  return create<Idea>(db.ideas, {
    kind: idea.kind,
    title: idea.title,
    category: idea.category ?? '',
    bestFor: idea.bestFor ?? [],
    bestForText: idea.bestForText ?? '',
    format: idea.format ?? '',
    angle: idea.angle ?? '',
    timing: idea.timing ?? '',
    subject: idea.subject ?? '',
    status: idea.status ?? 'idea',
    postId: idea.postId ?? null,
    slides: idea.slides ?? [],
    tags: idea.tags ?? [],
    notes: idea.notes ?? '',
    sort: idea.sort ?? count,
  });
}

export async function deleteIdea(id: string): Promise<void> {
  await remove(db.ideas, id);
}

/** Put an idea on the calendar as a post and link the two. */
export async function scheduleIdea(id: string, date: string | null, themeKey?: string): Promise<Post | null> {
  const idea = await db.ideas.get(id);
  if (!idea) return null;
  const cadence = await getSetting('cadence');
  const theme = themeKey ? themeByKey(cadence, themeKey) : date ? cadence.themes.find((t) => t.active && t.dow === new Date(`${date}T00:00:00`).getDay()) : undefined;
  const brief = [idea.angle, idea.subject && idea.kind !== 'idea' ? `Subject: ${idea.subject}` : '', idea.slides.length ? `Script: ${idea.slides.length} slides (see the idea)` : '', idea.notes].filter(Boolean).join('\n');
  const post = await createPost({
    title: idea.title,
    date,
    themeKey: theme?.key ?? '',
    format: idea.format,
    brief,
    assignees: idea.bestFor,
    series: idea.kind === 'whatif' ? 'WHAT IF' : idea.kind === 'concept' ? 'Concept Drop' : '',
    ideaId: idea.id,
    status: 'todo',
  });
  await patch(db.ideas, id, { status: 'scheduled', postId: post.id });
  return post;
}

// ----- snippets -----

export async function saveSnippet(s: Partial<Snippet> & { label: string; text: string; kind: Snippet['kind'] }): Promise<void> {
  if (s.id) {
    const prev = await db.snippets.get(s.id);
    if (prev) {
      await save(db.snippets, { ...prev, ...s } as Snippet);
      return;
    }
  }
  const count = await db.snippets.count();
  await create<Snippet>(db.snippets, { kind: s.kind, label: s.label, text: s.text, useFor: s.useFor ?? '', notes: s.notes ?? '', sort: s.sort ?? count });
}

export async function deleteSnippet(id: string): Promise<void> {
  await remove(db.snippets, id);
}
