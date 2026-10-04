import { useMemo, useState, type DragEvent } from 'react';
import { CalendarPlus } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Button, PageHeader, Segmented } from '../../components/ui';
import { MemberPicker, useMemberMap } from '../../components/people';
import { useMembers, usePosts } from '../../hooks/data';
import { BOARD_COLUMNS, STATUS_LABEL } from '../../domain/calendar';
import { setStatus } from '../../services/content';
import { addDays, todayISO } from '../../lib/time';
import { PostCard } from '../calendar/CalendarPage';
import { PostDialog } from '../calendar/PostDialog';
import type { Post, PostStatus } from '../../db/types';

/** The team's working board: drag a post to change its status. */
export default function BoardPage() {
  const app = useApp();
  const posts = usePosts();
  const members = useMembers() ?? [];
  const memberMap = useMemberMap();
  const [who, setWho] = useState<string[]>(() => (app.role === 'designer' && app.member ? [app.member.id] : []));
  const [range, setRange] = useState<'month' | 'quarter' | 'all'>('month');
  const [open, setOpen] = useState<{ id: string | null } | null>(null);
  const today = todayISO();
  const horizon = range === 'month' ? addDays(today, 31) : range === 'quarter' ? addDays(today, 92) : '9999-12-31';

  const cols = useMemo(() => {
    const out = new Map<PostStatus, Post[]>(BOARD_COLUMNS.map((s) => [s, []]));
    for (const p of posts ?? []) {
      if (!app.inScope(p.clientId) || p.status === 'skipped') continue;
      if (who.length && !p.assignees.some((a) => who.includes(a))) continue;
      // Posted work only for the last two weeks; future work up to the horizon.
      if (p.status === 'posted' && (p.date ?? '') < addDays(today, -14)) continue;
      if (p.date && p.date > horizon) continue;
      out.get(p.status)?.push(p);
    }
    return out;
  }, [posts, app, who, today, horizon]);

  const onDrop = async (e: DragEvent, status: PostStatus) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drop');
    const id = e.dataTransfer.getData('text/post-id');
    if (!id) return;
    if (status === 'ready' || status === 'scheduled') {
      const p = (posts ?? []).find((x) => x.id === id);
      const done = p ? Object.values(p.checklist).filter(Boolean).length : 0;
      if (p && done === 0) app.toast('Tip: run the premium check before marking it ready.', { tone: 'info' });
    }
    await setStatus(id, status);
  };

  return (
    <div className="page" style={{ maxWidth: 1600 }}>
      <PageHeader
        title="Board"
        subtitle="Drag a post across as it moves. Review means it waits for the owner or manager to approve."
        actions={
          <Button variant="primary" onClick={() => setOpen({ id: null })}>
            <CalendarPlus size={18} /> New post
          </Button>
        }
      />
      <div className="filter-row">
        <Segmented
          label="How far ahead"
          value={range}
          onChange={setRange}
          options={[
            { value: 'month', label: 'Next 30 days' },
            { value: 'quarter', label: '3 months' },
            { value: 'all', label: 'Everything' },
          ]}
        />
      </div>
      {members.length ? <MemberPicker value={who} onChange={setWho} members={members} label="Show posts by" /> : null}
      <div className="board">
        {BOARD_COLUMNS.map((s) => {
          const list = (cols.get(s) ?? []).sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
          return (
            <section
              key={s}
              className="bcol"
              aria-label={STATUS_LABEL[s]}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes('text/post-id')) {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).classList.add('drop');
                }
              }}
              onDragLeave={(e) => (e.currentTarget as HTMLElement).classList.remove('drop')}
              onDrop={(e) => void onDrop(e, s)}
            >
              <div className="bcol-head">
                <span className={`sdot ${s}`} aria-hidden="true" />
                {STATUS_LABEL[s]}
                <span className="count">{list.length}</span>
              </div>
              {list.map((p) => (
                <PostCard key={p.id} p={p} memberMap={memberMap} onOpen={() => setOpen({ id: p.id })} />
              ))}
              {list.length === 0 ? <p className="tiny muted" style={{ padding: '0 4px' }}>Drop a post here.</p> : null}
            </section>
          );
        })}
      </div>
      <p className="tiny muted">On a phone, open a post and change its status there.</p>
      <PostDialog open={!!open} postId={open?.id ?? null} onClose={() => setOpen(null)} />
    </div>
  );
}
