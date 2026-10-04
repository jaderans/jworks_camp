import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { PenLine } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Badge, EmptyState, PageHeader, Stat } from '../../components/ui';
import { useMemberMap } from '../../components/people';
import { useHooks, useMetrics, usePosts } from '../../hooks/data';
import { isDone } from '../../domain/calendar';
import { compactNumber, totals } from '../../domain/metrics';
import { streak } from '../../domain/hooks';
import { addDays, todayISO } from '../../lib/time';
import { PostCard } from '../calendar/CalendarPage';
import { PostDialog } from '../calendar/PostDialog';
import type { Post } from '../../db/types';

/** One person's queue: what's late, what's this week, what's waiting on them. */
export default function MyTasksPage() {
  const app = useApp();
  const posts = usePosts() ?? [];
  const metrics = useMetrics() ?? [];
  const hooks = useHooks() ?? [];
  const memberMap = useMemberMap();
  const [open, setOpen] = useState<string | null>(null);
  const today = todayISO();
  const me = app.member;
  const mine = useMemo(() => posts.filter((p) => me && p.assignees.includes(me.id)), [posts, me]);
  if (!me) {
    return (
      <div className="page narrow">
        <EmptyState title="Who are you?">Pick yourself from the profile menu at the top right (Switch person).</EmptyState>
      </div>
    );
  }
  const open_ = mine.filter((p) => !isDone(p.status));
  const groups: { title: string; list: Post[]; tone?: 'warn' }[] = [
    { title: 'Changes asked', list: open_.filter((p) => p.approval.state === 'changes'), tone: 'warn' },
    { title: 'Late', list: open_.filter((p) => p.date && p.date < today && p.status !== 'scheduled'), tone: 'warn' },
    { title: 'This week', list: open_.filter((p) => p.date && p.date >= today && p.date <= addDays(today, 7)) },
    { title: 'Next two weeks', list: open_.filter((p) => p.date && p.date > addDays(today, 7) && p.date <= addDays(today, 21)) },
    { title: 'Waiting for review', list: open_.filter((p) => p.approval.state === 'requested') },
    { title: 'Later', list: open_.filter((p) => p.date && p.date > addDays(today, 21)) },
    { title: 'No date yet', list: open_.filter((p) => !p.date) },
  ];
  const t = totals(metrics.filter((m) => m.memberIds.includes(me.id) && m.date >= addDays(today, -30)));
  const s = streak(hooks.filter((h) => h.memberId === me.id && h.practiceDate).map((h) => h.practiceDate as string), today);
  return (
    <div className="page">
      <PageHeader eyebrow={me.roleLabel || 'Designer'} title={`${me.name}’s tasks`} subtitle="Open a post to write the caption, run the premium check, ask for review or mark it posted." />
      <div className="stats">
        <Stat label="Open posts" value={open_.length} hint={`${mine.filter((p) => p.status === 'posted').length} posted so far`} />
        <Stat label="Views, last 30 days" value={compactNumber(t.views)} hint={`${t.saves} saves · ${t.shares} shares`} />
        <Stat
          label="Hook streak"
          value={`${s.current} day${s.current === 1 ? '' : 's'}`}
          hint={
            <Link to="/trends/hooks" className="small">
              <PenLine size={12} /> Today’s hook
            </Link>
          }
        />
      </div>
      {open_.length === 0 ? <EmptyState title="Nothing assigned to you">When a post is given to you it shows up here.</EmptyState> : null}
      {groups
        .filter((g) => g.list.length)
        .map((g) => (
          <section key={g.title} className="stack">
            <h2 className="row" style={{ gap: 8 }}>
              {g.title} <Badge tone={g.tone}>{g.list.length}</Badge>
            </h2>
            <div className="trend-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {g.list.map((p) => (
                <PostCard key={p.id} p={p} memberMap={memberMap} onOpen={() => setOpen(p.id)} showNote />
              ))}
            </div>
          </section>
        ))}
      <PostDialog open={!!open} postId={open} onClose={() => setOpen(null)} />
    </div>
  );
}
