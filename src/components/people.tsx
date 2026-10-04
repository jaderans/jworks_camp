import { useMemo } from 'react';
import { useMembers } from '../hooks/data';
import { STATUS_LABEL } from '../domain/calendar';
import type { Member, PostStatus } from '../db/types';

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2)).toUpperCase();
};

/** A team member's colour dot with initials; the colour follows the person. */
export function MemberDot({ member, size }: { member: Pick<Member, 'name' | 'color'>; size?: 'lg' }) {
  return (
    <span className={`mdot c${((member.color % 8) + 8) % 8} ${size ?? ''}`} title={member.name} aria-hidden="true">
      {initials(member.name)}
    </span>
  );
}

export function MemberDots({ ids, members, max = 3 }: { ids: string[]; members: Map<string, Member>; max?: number }) {
  const list = ids.map((id) => members.get(id)).filter((m): m is Member => !!m);
  if (!list.length) return null;
  return (
    <span className="mdots" aria-label={list.map((m) => m.name).join(', ')} role="img">
      {list.slice(0, max).map((m) => (
        <MemberDot key={m.id} member={m} />
      ))}
      {list.length > max ? <span className="mdot" style={{ background: 'var(--line-strong)', color: 'var(--ink)' }}>+{list.length - max}</span> : null}
    </span>
  );
}

export function useMemberMap(): Map<string, Member> {
  const members = useMembers();
  return useMemo(() => new Map((members ?? []).map((m) => [m.id, m])), [members]);
}

/** Pick people by tapping chips. */
export function MemberPicker({ value, onChange, members, label = 'People' }: { value: string[]; onChange: (ids: string[]) => void; members: Member[]; label?: string }) {
  return (
    <div className="chip-row" role="group" aria-label={label}>
      {members
        .filter((m) => m.active === 1 || value.includes(m.id))
        .map((m) => {
          const on = value.includes(m.id);
          return (
            <button key={m.id} type="button" className="chip" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== m.id) : [...value, m.id])}>
              <MemberDot member={m} /> {m.name}
            </button>
          );
        })}
      {members.length === 0 ? <span className="muted small">Add people in Team first.</span> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: PostStatus }) {
  const tone = status === 'posted' || status === 'ready' ? 'good' : status === 'review' ? 'yellow' : status === 'doing' || status === 'scheduled' ? 'teal' : undefined;
  return (
    <span className={`badge ${tone ?? ''}`}>
      <span className={`sdot ${status}`} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}
