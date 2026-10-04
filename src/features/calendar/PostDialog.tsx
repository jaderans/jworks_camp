import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bot, CheckCircle2, Copy, ExternalLink, MessageSquare, Send, Sparkles, ThumbsUp, Trash2, CopyPlus, XCircle } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Dialog } from '../../components/Dialog';
import { Badge, Button, Callout } from '../../components/ui';
import { Check, Field, Select, TextArea, TextInput } from '../../components/form';
import { MemberPicker, StatusBadge, useMemberMap } from '../../components/people';
import { useCampaigns, useClients, useComments, useIdeas, useMembers, useMetrics, usePost, useSettingRows, useSnippets } from '../../hooks/data';
import { settingValue } from '../../db/settings';
import { STATUS_LABEL, STATUS_ORDER } from '../../domain/calendar';
import { STYLE_LABEL, checkCaption, composeCaption, hashtagsOf, styleFirstLine, type TextStyle } from '../../domain/captions';
import { checklistScore } from '../../domain/checklist';
import { STAGES, STAGE_META } from '../../domain/funnel';
import { checkLink } from '../../domain/links';
import { METRIC_KEYS, METRIC_LABEL, type MetricKey } from '../../domain/metrics';
import { FORMATS, PLATFORMS, PLATFORM_ORDER, platformOfUrl } from '../../domain/platforms';
import { addComment, blankPost, createPost, decideApproval, deletePost, duplicatePost, requestApproval, savePost } from '../../services/content';
import { saveMetric } from '../../services/growth';
import { copyText } from '../../lib/text';
import { fmtDateTime, relativeTime, todayISO } from '../../lib/time';
import type { Metric, PlatformKey, Post } from '../../db/types';

type Tab = 'details' | 'captions' | 'check' | 'publish' | 'talk';

type Draft = Omit<Post, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: number; updatedAt?: number };

export function PostDialog({ open, postId, draft, onClose }: { open: boolean; postId: string | null; draft?: Partial<Post>; onClose: () => void }) {
  const app = useApp();
  const navigate = useNavigate();
  const stored = usePost(open ? postId : null);
  const rows = useSettingRows();
  const cadence = settingValue(rows, 'cadence');
  const checklist = settingValue(rows, 'checklist');
  const members = useMembers() ?? [];
  const memberMap = useMemberMap();
  const clients = useClients() ?? [];
  const campaigns = useCampaigns() ?? [];
  const snippets = useSnippets() ?? [];
  const ideas = useIdeas() ?? [];
  const [tab, setTab] = useState<Tab>('details');
  const [p, setP] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  // Load the post (or a new draft) when the dialog opens.
  useEffect(() => {
    if (!open) {
      setP(null);
      setDirty(false);
      setTab('details');
      return;
    }
    if (postId) {
      if (stored && (!p || p.id !== stored.id)) setP({ ...stored });
    } else if (!p) {
      setP({ ...blankPost({ platforms: [...cadence.platforms], clientId: app.scope !== 'all' && app.scope !== 'own' ? app.scope : null, ...draft }) });
    }
  }, [open, postId, stored]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setP((cur) => (cur ? { ...cur, [k]: v } : cur));
    setDirty(true);
  };

  const close = async () => {
    if (dirty && !(await app.confirm({ title: 'Discard your changes?', message: 'You have edits that aren’t saved yet.', confirmLabel: 'Discard', tone: 'danger' }))) return;
    onClose();
  };

  const save = async (andClose = true) => {
    if (!p) return;
    if (!p.title.trim()) {
      app.toast('Give the post a title first.', { tone: 'bad' });
      setTab('details');
      return;
    }
    setBusy(true);
    try {
      if (p.id) await savePost(p as Post);
      else {
        const created = await createPost(p as Post);
        setP({ ...created });
      }
      setDirty(false);
      app.toast('Saved', { tone: 'good' });
      if (andClose) onClose();
    } catch (e) {
      app.toast(e instanceof Error ? e.message : 'Could not save', { tone: 'bad' });
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  if (!p) return null;

  const theme = cadence.themes.find((t) => t.key === p.themeKey);
  const score = checklistScore(checklist, p.checklist);
  const script = p.ideaId ? ideas.find((i) => i.id === p.ideaId) : undefined;
  const clientCampaigns = campaigns.filter((c) => c.clientId === p.clientId);
  const canDecide = app.role === 'owner' || app.role === 'manager';

  return (
    <Dialog
      open={open}
      onClose={close}
      size="xwide"
      fullPhone
      title={
        <span className="row" style={{ gap: 10, minWidth: 0 }}>
          <span className="ellipsis">{p.id ? p.title || 'Untitled post' : 'New post'}</span>
          <StatusBadge status={p.status} />
        </span>
      }
      footer={
        <>
          {p.id ? (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  if (!(await app.confirm({ title: 'Delete this post?', message: `“${p.title}” and its comments are removed from every device.`, confirmLabel: 'Delete', tone: 'danger' }))) return;
                  await deletePost(p.id as string);
                  app.toast('Post deleted');
                  onClose();
                }}
              >
                <Trash2 size={16} /> Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const copy = await duplicatePost(p.id as string);
                  if (copy) app.toast(`Copied to “${copy.title}”`, { tone: 'good' });
                }}
              >
                <CopyPlus size={16} /> Duplicate
              </Button>
            </>
          ) : null}
          <span className="grow" />
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={() => save(true)} disabled={busy}>
            Save
          </Button>
        </>
      }
    >
      <nav className="tabs" aria-label="Post sections">
        {(
          [
            ['details', 'Details'],
            ['captions', 'Captions'],
            ['check', `Premium check ${score.done}/${score.total}`],
            ['publish', 'Publish & results'],
            ['talk', 'Comments'],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button key={k} type="button" aria-selected={tab === k} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </nav>

      {p.note ? <Callout tone="info">{p.note}</Callout> : null}

      {tab === 'details' ? (
        <div className="editor-grid">
          <div className="stack">
            <Field label="Title" htmlFor="pd-title">
              <TextInput id="pd-title" value={p.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. 5 Signs Your Brand Needs a Rebrand" />
            </Field>
            <div className="form-grid">
              <Field label="Date" htmlFor="pd-date" hint={p.date ? undefined : 'No date: it waits in the backlog.'}>
                <div className="row">
                  <input id="pd-date" type="date" className="input" value={p.date ?? ''} onChange={(e) => set('date', e.target.value || null)} />
                  {p.date ? (
                    <Button size="sm" variant="ghost" onClick={() => set('date', null)}>
                      Backlog
                    </Button>
                  ) : null}
                </div>
              </Field>
              <Field label="Time" htmlFor="pd-time" hint={p.platforms[0] ? `Best on ${PLATFORMS[p.platforms[0]].label}: ${PLATFORMS[p.platforms[0]].bestTimeNote.split('.')[0]}.` : undefined}>
                <input id="pd-time" type="time" className="input" value={p.time} onChange={(e) => set('time', e.target.value)} />
              </Field>
              <Field label="Weekly theme" htmlFor="pd-theme" hint={theme?.description}>
                <Select id="pd-theme" value={p.themeKey} onChange={(e) => set('themeKey', e.target.value)}>
                  <option value="">No theme</option>
                  {cadence.themes.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Format" htmlFor="pd-format">
                <TextInput id="pd-format" list="pd-formats" value={p.format} onChange={(e) => set('format', e.target.value)} placeholder="Carousel, Reel…" />
                <datalist id="pd-formats">
                  {FORMATS.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </Field>
              <Field label="Status" htmlFor="pd-status">
                <Select id="pd-status" value={p.status} onChange={(e) => set('status', e.target.value as Post['status'])}>
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Series" htmlFor="pd-series" hint="WHAT IF, Concept Drop, Freebie Friday…">
                <TextInput id="pd-series" list="pd-series-list" value={p.series} onChange={(e) => set('series', e.target.value)} />
                <datalist id="pd-series-list">
                  {['WHAT IF', 'Concept Drop', 'Freebie Friday', 'Client Love', 'Fun Friday', 'BTS', 'Portfolio Tuesday'].map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </Field>
              <Field label="Brand" htmlFor="pd-client">
                <Select id="pd-client" value={p.clientId ?? ''} onChange={(e) => set('clientId', e.target.value || null)}>
                  <option value="">JoshWorks (our pages)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Campaign" htmlFor="pd-camp">
                <Select id="pd-camp" value={p.campaignId ?? ''} onChange={(e) => set('campaignId', e.target.value || null)}>
                  <option value="">None</option>
                  {clientCampaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Funnel stage" htmlFor="pd-stage" hint={p.funnelStage ? STAGE_META[p.funnelStage].question : 'Where this post moves people.'}>
                <Select id="pd-stage" value={p.funnelStage ?? ''} onChange={(e) => set('funnelStage', (e.target.value || null) as Post['funnelStage'])}>
                  <option value="">Not set</option>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_META[s].label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Who’s making it">
              <MemberPicker value={p.assignees} onChange={(v) => set('assignees', v)} members={members} />
            </Field>
            <Field label="Hook" htmlFor="pd-hook" hint="The first line, first slide or first 3 seconds. Say the topic out loud and on screen (TikTok search reads both).">
              <TextInput id="pd-hook" value={p.hook} onChange={(e) => set('hook', e.target.value)} placeholder="e.g. Your logo might be hurting your brand — and you don’t even know it." />
            </Field>
            <Field label="Brief" htmlFor="pd-brief">
              <TextArea id="pd-brief" rows={4} value={p.brief} onChange={(e) => set('brief', e.target.value)} placeholder="Angle, slides, what to show, references…" />
            </Field>
            <AssetLink value={p.assetLink} onChange={(v) => set('assetLink', v)} />
          </div>
          <aside className="side-panel">
            <div className="card">
              <span className="eyebrow">Platforms</span>
              <div className="chip-row">
                {PLATFORM_ORDER.map((k) => {
                  const on = p.platforms.includes(k);
                  return (
                    <button key={k} type="button" className="chip" aria-pressed={on} onClick={() => set('platforms', on ? p.platforms.filter((x) => x !== k) : [...p.platforms, k])}>
                      {PLATFORMS[k].label}
                    </button>
                  );
                })}
              </div>
            </div>
            {script ? (
              <div className="card">
                <span className="eyebrow">{script.kind === 'script' ? 'Script' : 'From the idea bank'}</span>
                <b>{script.title}</b>
                {script.slides.length ? (
                  <ol className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
                    {script.slides.map((s, i) => (
                      <li key={i}>
                        <b>{s.label}:</b> {s.text}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="small muted">{script.angle || script.notes || 'No script yet.'}</p>
                )}
              </div>
            ) : null}
            <Button
              onClick={() => {
                if (!p.id) {
                  app.toast('Save the post first, then ask the assistant.', { tone: 'info' });
                  return;
                }
                navigate(`/assistant?post=${p.id}&recipe=captions`);
              }}
            >
              <Bot size={16} /> Ask Claude about this post
            </Button>
          </aside>
        </div>
      ) : null}

      {tab === 'captions' ? <CaptionsTab p={p} set={set} snippets={snippets} /> : null}

      {tab === 'check' ? (
        <div className="stack">
          <p className="muted small">Before you mark it Ready: fundamentals first, then edit down. Tick what’s true for this post.</p>
          <div className="check-list">
            {checklist
              .filter((i) => i.on)
              .map((i) => (
                <Check key={i.id} id={`ck-${i.id}`} checked={!!p.checklist[i.id]} onChange={(v) => set('checklist', { ...p.checklist, [i.id]: v })} label={<b>{i.label}</b>} sub={i.hint} />
              ))}
          </div>
          <div className="row between wrap">
            <span className="strong">
              {score.done} of {score.total} done
            </span>
            <Button size="sm" onClick={() => set('checklist', Object.fromEntries(checklist.map((i) => [i.id, true])))}>
              <CheckCircle2 size={16} /> All checked
            </Button>
          </div>
        </div>
      ) : null}

      {tab === 'publish' ? <PublishTab p={p} set={set} /> : null}

      {tab === 'talk' ? (
        p.id ? (
          <TalkTab postId={p.id} canDecide={canDecide} approval={p.approval} names={memberMap} />
        ) : (
          <p className="muted">Save the post first to start a conversation about it.</p>
        )
      ) : null}
    </Dialog>
  );
}

function AssetLink({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const warn = checkLink(value);
  return (
    <Field label="Asset folder" htmlFor="pd-asset" hint={warn ? undefined : 'Google Drive folder with the files.'} error={warn?.level === 'bad' ? warn.text : undefined}>
      <div className="row">
        <TextInput id="pd-asset" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://drive.google.com/…" />
        {value && !warn ? (
          <a className="icon-btn" href={value} target="_blank" rel="noreferrer noopener" aria-label="Open the folder" title="Open the folder">
            <ExternalLink size={16} />
          </a>
        ) : null}
      </div>
      {warn?.level === 'warn' ? <span className="link-warn">{warn.text}</span> : null}
    </Field>
  );
}

function CaptionsTab({ p, set, snippets }: { p: Draft; set: <K extends keyof Draft>(k: K, v: Draft[K]) => void; snippets: { id: string; kind: string; label: string; text: string }[] }) {
  const app = useApp();
  const platforms = p.platforms.length ? p.platforms : (['facebook', 'instagram'] as PlatformKey[]);
  const [pf, setPf] = useState<PlatformKey>(platforms[0]);
  const active = platforms.includes(pf) ? pf : platforms[0];
  const own = p.captions[active];
  const composed = composeCaption({ caption: p.caption, captions: p.captions, cta: p.cta, hashtags: p.hashtags }, active);
  const checks = checkCaption(composed, active, { series: p.series });
  const len = [...p.caption].length;
  const tags = hashtagsOf(p.hashtags);
  const ctas = snippets.filter((s) => s.kind === 'cta' || s.kind === 'disclaimer');
  const sets = snippets.filter((s) => s.kind === 'hashtags');
  return (
    <div className="editor-grid">
      <div className="stack">
        <Field label="Caption" htmlFor="pd-cap" hint={<span className={`counter ${len > 2200 ? 'over' : ''}`}>{len.toLocaleString()} characters</span>}>
          <TextArea id="pd-cap" rows={9} value={p.caption} onChange={(e) => set('caption', e.target.value)} placeholder="Start with the hook. Tell the story. End with one ask." />
        </Field>
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="small muted">Style the first line:</span>
          {(Object.keys(STYLE_LABEL) as TextStyle[]).map((s) => (
            <Button key={s} size="sm" variant="ghost" onClick={() => set('caption', styleFirstLine(p.caption, s))} disabled={!p.caption.trim()}>
              {STYLE_LABEL[s]}
            </Button>
          ))}
        </div>
        <div className="form-grid">
          <Field label="Call to action" htmlFor="pd-cta" hint="Added at the end if it isn’t in the caption.">
            <TextInput id="pd-cta" value={p.cta} onChange={(e) => set('cta', e.target.value)} placeholder="DM us “LOGO” 📩" />
          </Field>
          <Field label="Hashtags" htmlFor="pd-tags" hint={`${tags.length} tags. Instagram uses the first ${PLATFORMS.instagram.maxHashtags}.`}>
            <TextInput id="pd-tags" value={p.hashtags} onChange={(e) => set('hashtags', e.target.value)} placeholder="#JoshWorks #LogoDesign" />
          </Field>
        </div>
        {ctas.length || sets.length ? (
          <div className="stack tight">
            <span className="eyebrow">From the caption bank</span>
            <div className="chip-row">
              {sets.map((s) => (
                <button key={s.id} type="button" className="chip" onClick={() => set('hashtags', [...new Set([...hashtagsOf(p.hashtags), ...hashtagsOf(s.text)])].join(' '))}>
                  # {s.label}
                </button>
              ))}
              {ctas.map((s) => (
                <button key={s.id} type="button" className="chip" onClick={() => (s.kind === 'disclaimer' ? set('caption', `${p.caption.trim()}\n\n${s.text}`.trim()) : set('cta', s.text))}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <aside className="side-panel">
        <div className="card">
          <div className="seg" role="group" aria-label="Platform">
            {platforms.map((k) => (
              <button key={k} type="button" aria-pressed={active === k} onClick={() => setPf(k)}>
                {PLATFORMS[k].short}
              </button>
            ))}
          </div>
          <Check
            id={`own-${active}`}
            checked={own !== undefined}
            onChange={(v) => {
              const next = { ...p.captions };
              if (v) next[active] = p.caption;
              else delete next[active];
              set('captions', next);
            }}
            label={`A separate caption for ${PLATFORMS[active].label}`}
          />
          {own !== undefined ? <TextArea rows={6} value={own} onChange={(e) => set('captions', { ...p.captions, [active]: e.target.value })} aria-label={`${PLATFORMS[active].label} caption`} /> : null}
          <span className="eyebrow">What gets posted</span>
          <div className="cap-preview">{composed || <span className="muted">Nothing yet.</span>}</div>
          <div className="stack tight">
            {checks.map((c, i) => (
              <span key={i} className={`small strong ${c.level === 'bad' ? 'bad' : c.level === 'warn' ? 'warn' : 'good'}`}>
                {c.level === 'good' ? '✓' : c.level === 'bad' ? '✕' : '!'} {c.text}
              </span>
            ))}
          </div>
          <div className="actions">
            <Button
              size="sm"
              variant="teal"
              disabled={!composed}
              onClick={async () => app.toast((await copyText(composed)) ? `Copied for ${PLATFORMS[active].label}` : 'Couldn’t copy. Select the text and copy it.', { tone: 'good' })}
            >
              <Copy size={16} /> Copy
            </Button>
            <a className="btn sm" href={PLATFORMS[active].composer(composed)} target="_blank" rel="noreferrer noopener">
              <ExternalLink size={16} /> {PLATFORMS[active].composerLabel}
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}

function PublishTab({ p, set }: { p: Draft; set: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  const app = useApp();
  const metrics = (useMetrics() ?? []).filter((m) => p.id && m.postId === p.id);
  const platforms = [...new Set([...(p.platforms.length ? p.platforms : []), ...(Object.keys(p.links) as PlatformKey[])])];
  return (
    <div className="stack loose">
      <section className="stack">
        <h3>Where it’s live</h3>
        <p className="muted small">Paste each post’s link after publishing. It goes in the team’s record and the results table.</p>
        {platforms.map((k) => {
          const v = p.links[k] ?? '';
          const wrong = v && platformOfUrl(v) && platformOfUrl(v) !== k;
          return (
            <Field key={k} label={PLATFORMS[k].label} htmlFor={`ln-${k}`} error={wrong ? `That looks like a ${PLATFORMS[platformOfUrl(v) as PlatformKey].label} link.` : undefined}>
              <div className="row">
                <TextInput id={`ln-${k}`} value={v} onChange={(e) => set('links', { ...p.links, [k]: e.target.value.trim() })} placeholder={`https://…`} />
                {v ? (
                  <a className="icon-btn" href={v} target="_blank" rel="noreferrer noopener" aria-label={`Open on ${PLATFORMS[k].label}`}>
                    <ExternalLink size={16} />
                  </a>
                ) : null}
              </div>
            </Field>
          );
        })}
        <div className="actions">
          {p.status !== 'posted' ? (
            <Button
              variant="primary"
              onClick={() => {
                set('status', 'posted');
                set('postedAt', Date.now());
                if (!p.date) set('date', todayISO());
                app.toast('Marked as posted. Save to keep it. Log results in 2–3 days.', { tone: 'good' });
              }}
            >
              <Send size={16} /> Mark as posted
            </Button>
          ) : (
            <Badge tone="good">Posted {p.postedAt ? fmtDateTime(p.postedAt) : ''}</Badge>
          )}
        </div>
      </section>
      <section className="stack">
        <h3>Results</h3>
        <p className="muted small">Log the numbers 48–72 hours after posting. Saves show value; shares (sends) show reach to new people.</p>
        {metrics.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Platform</th>
                  {(['views', 'reach', 'likes', 'comments', 'saves', 'shares'] as MetricKey[]).map((k) => (
                    <th key={k} className="r">
                      {METRIC_LABEL[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.id}>
                    <td>{PLATFORMS[m.platform].label}</td>
                    {(['views', 'reach', 'likes', 'comments', 'saves', 'shares'] as MetricKey[]).map((k) => (
                      <td key={k} className="r">
                        {m[k] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {p.id ? <LogResults post={p as Post} /> : <p className="muted small">Save the post first.</p>}
      </section>
    </div>
  );
}

function LogResults({ post }: { post: Post }) {
  const app = useApp();
  const [platform, setPlatform] = useState<PlatformKey>(post.platforms[0] ?? 'facebook');
  const [vals, setVals] = useState<Partial<Record<MetricKey, string>>>({});
  const save = async () => {
    const nums = Object.fromEntries(METRIC_KEYS.map((k) => [k, vals[k] && vals[k]!.trim() !== '' ? Number(vals[k]!.replace(/[,\s]/g, '')) : null])) as Partial<Metric>;
    if (!Object.values(nums).some((v) => typeof v === 'number' && Number.isFinite(v))) {
      app.toast('Type at least one number.', { tone: 'bad' });
      return;
    }
    await saveMetric({ ...nums, platform, postId: post.id, clientId: post.clientId, date: post.date ?? todayISO(), title: post.title, series: post.series, format: post.format, memberIds: post.assignees });
    setVals({});
    app.toast('Results saved', { tone: 'good' });
  };
  return (
    <div className="card">
      <div className="row wrap">
        <Field label="Platform" htmlFor="lr-pf">
          <Select id="lr-pf" value={platform} onChange={(e) => setPlatform(e.target.value as PlatformKey)}>
            {PLATFORM_ORDER.map((k) => (
              <option key={k} value={k}>
                {PLATFORMS[k].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid-4">
        {METRIC_KEYS.map((k) => (
          <Field key={k} label={METRIC_LABEL[k]} htmlFor={`lr-${k}`}>
            <input id={`lr-${k}`} className="input num" inputMode="numeric" value={vals[k] ?? ''} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />
          </Field>
        ))}
      </div>
      <div>
        <Button variant="teal" onClick={save}>
          Save results
        </Button>
      </div>
    </div>
  );
}

function TalkTab({ postId, canDecide, approval, names }: { postId: string; canDecide: boolean; approval: Post['approval']; names: Map<string, { name: string }> }) {
  const app = useApp();
  const comments = useComments(postId) ?? [];
  const [text, setText] = useState('');
  const sorted = useMemo(() => comments, [comments]);
  return (
    <div className="stack">
      <div className="row wrap">
        <span className="strong">Approval:</span>
        <Badge tone={approval.state === 'approved' ? 'good' : approval.state === 'changes' ? 'warn' : approval.state === 'requested' ? 'yellow' : undefined}>
          {approval.state === 'none' ? 'Not asked yet' : approval.state === 'requested' ? 'Waiting for review' : approval.state === 'approved' ? 'Approved' : 'Changes asked'}
        </Badge>
        {approval.at ? <span className="muted small">{relativeTime(approval.at)}</span> : null}
        <span className="grow" />
        <Button size="sm" onClick={() => requestApproval(postId, text).then(() => setText(''))}>
          <Sparkles size={16} /> Ask for review
        </Button>
        {canDecide ? (
          <>
            <Button size="sm" variant="teal" onClick={() => decideApproval(postId, true, text).then(() => setText(''))}>
              <ThumbsUp size={16} /> Approve
            </Button>
            <Button size="sm" variant="danger" onClick={() => decideApproval(postId, false, text).then(() => setText(''))}>
              <XCircle size={16} /> Ask for changes
            </Button>
          </>
        ) : null}
      </div>
      <div className="stack tight">
        {sorted.length === 0 ? <p className="muted small">No comments yet.</p> : null}
        {sorted.map((c) => (
          <div key={c.id} className={`comment ${c.kind}`}>
            <span className="small strong">
              {c.authorId ? (names.get(c.authorId)?.name ?? 'Someone') : 'Someone'}
              <span className="muted"> · {relativeTime(c.at)}</span>
            </span>
            <span style={{ whiteSpace: 'pre-wrap' }}>{c.text}</span>
          </div>
        ))}
      </div>
      <Field label="Comment" htmlFor="pd-comment">
        <TextArea id="pd-comment" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Feedback, a question, or a note for whoever posts it" />
      </Field>
      <div>
        <Button
          variant="primary"
          disabled={!text.trim()}
          onClick={async () => {
            await addComment(postId, text);
            setText('');
            app.toast('Comment added', { tone: 'good' });
          }}
        >
          <MessageSquare size={16} /> Comment
        </Button>
      </div>
    </div>
  );
}
