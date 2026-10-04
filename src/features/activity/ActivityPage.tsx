import { useState } from 'react';
import { Badge, EmptyState, Loading, PageHeader } from '../../components/ui';
import { SearchInput } from '../../components/form';
import { useAudit, useMembers } from '../../hooks/data';
import { fmtDateTime } from '../../lib/time';
import { ACTIVITY_LABELS, activityTone } from './labels';

export default function ActivityPage() {
  const audit = useAudit(1000);
  const members = useMembers();
  const [q, setQ] = useState('');
  if (!audit) return <Loading />;
  const names = new Map((members ?? []).map((m) => [m.id, m.name]));
  const shown = audit.filter((a) => !q.trim() || `${a.summary} ${names.get(a.actorId ?? '') ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="page narrow">
      <PageHeader title="Activity" subtitle="Who added, moved, approved or changed what, and when." />
      <SearchInput value={q} onChange={setQ} placeholder="Search activity" />
      {shown.length === 0 ? (
        <EmptyState title="Nothing yet" />
      ) : (
        <div className="card flush">
          <div className="list">
            {shown.map((a) => (
              <div key={a.id} className="list-item">
                <Badge tone={activityTone(a.action)}>{ACTIVITY_LABELS[a.action] ?? a.action}</Badge>
                <span className="main-text">
                  <b style={{ whiteSpace: 'normal' }}>{a.summary}</b>
                  <span>
                    {fmtDateTime(a.at)}
                    {a.actorId ? ` · ${names.get(a.actorId) ?? 'someone'}` : ''}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
