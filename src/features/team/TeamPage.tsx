import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Link2, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Badge, Button, Callout, IconButton, Loading, PageHeader, Segmented } from '../../components/ui';
import { Field, TextArea, TextInput } from '../../components/form';
import { Dialog } from '../../components/Dialog';
import { MemberDot } from '../../components/people';
import { useMembers, usePosts } from '../../hooks/data';
import { useSyncStatus } from '../../sync/useSync';
import { ROLE_HINT, ROLE_LABEL, deleteMember, saveMember, setMemberActive, skillsFromRole } from '../../services/team';
import { SERVICE_LABEL } from '../../domain/campaignTemplates';
import { copyText } from '../../lib/text';
import { todayISO } from '../../lib/time';
import type { AccessRow } from '../../sync/cloud';
import type { AppRole, Member, ServiceKey } from '../../db/types';

export default function TeamPage() {
  const app = useApp();
  const members = useMembers();
  const posts = usePosts() ?? [];
  const sync = useSyncStatus();
  const cloudOwner = sync.access?.role === 'owner';
  const [editing, setEditing] = useState<Partial<Member> | null>(null);
  const [access, setAccess] = useState<AccessRow[] | null>(null);
  const month = todayISO().slice(0, 7);

  const loadAccess = useCallback(async () => {
    if (!cloudOwner) return;
    try {
      const { listAccess } = await import('../../sync/cloud');
      setAccess(await listAccess());
    } catch {
      setAccess(null);
    }
  }, [cloudOwner]);
  useEffect(() => {
    void loadAccess();
  }, [loadAccess, members]);

  const invite = async (m: Member) => {
    const { getCloudConfig } = await import('../../sync/cloud');
    const { inviteLink } = await import('../../sync/config');
    const cfg = await getCloudConfig();
    if (!cfg) return;
    const text = `Hi ${m.name}! Join JoshWorks Campaigns: open this link on your phone and sign in with ${m.email}.\n${inviteLink(cfg, m.email, m.name)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'JoshWorks Campaigns invite', text });
        return;
      }
    } catch {
      /* cancelled; fall back to copy */
    }
    app.toast((await copyText(text)) ? 'Invite copied. Paste it in Messenger or Viber.' : 'Couldn’t copy the invite.', { tone: 'good' });
  };

  if (!members) return <Loading />;
  const accessByEmail = new Map((access ?? []).map((a) => [a.email, a]));
  return (
    <div className="page">
      <PageHeader
        title="Team"
        subtitle="Who makes the content. Their colour follows them on the calendar, the board and the results."
        actions={
          <Button variant="primary" onClick={() => setEditing({ appRole: 'designer', skills: [] })}>
            <UserPlus size={18} /> Add person
          </Button>
        }
      />
      {!sync.enabled ? (
        <Callout tone="info" title="Connect the team’s phones">
          Turn on cloud sync in <Link to="/settings#s-sync">Settings → Cloud sync</Link> (your own free Firebase project). Then add each person’s email here and send them an invite link: their posts, comments and statuses sync live.
        </Callout>
      ) : !cloudOwner ? (
        <Callout tone="warn">Sign in as the owner (Settings → Cloud sync) to send invites.</Callout>
      ) : null}
      <div className="card flush">
        <div className="list">
          {members.map((m) => {
            const mine = posts.filter((p) => p.assignees.includes(m.id) && (p.date ?? '').startsWith(month));
            const acc = m.email ? accessByEmail.get(m.email) : undefined;
            return (
              <div key={m.id} className="list-item" style={m.active ? undefined : { opacity: 0.55 }}>
                <MemberDot member={m} size="lg" />
                <span className="main-text">
                  <b>
                    {m.name} {m.active ? null : <Badge>Inactive</Badge>}
                  </b>
                  <span>
                    {m.roleLabel || ROLE_LABEL[m.appRole]}
                    {m.skills.length ? ` · ${m.skills.map((s) => SERVICE_LABEL[s]).join(', ')}` : ''}
                  </span>
                </span>
                <span className="small muted hide-phone">{mine.length} posts this month</span>
                <Badge tone={m.appRole === 'owner' ? 'yellow' : m.appRole === 'manager' ? 'teal' : undefined}>{ROLE_LABEL[m.appRole]}</Badge>
                {cloudOwner ? (
                  !m.email ? (
                    <span className="muted small hide-phone">No email</span>
                  ) : acc ? (
                    <Badge tone={acc.active ? 'good' : undefined}>{acc.active ? 'Can sign in' : 'Paused'}</Badge>
                  ) : (
                    <Badge tone="warn">Not invited</Badge>
                  )
                ) : null}
                {cloudOwner && m.email && m.appRole !== 'owner' ? (
                  <IconButton label={`Send ${m.name} an invite link`} size="sm" onClick={() => invite(m)}>
                    <Link2 size={16} />
                  </IconButton>
                ) : null}
                <IconButton label={`Edit ${m.name}`} size="sm" plain onClick={() => setEditing(m)}>
                  <Pencil size={16} />
                </IconButton>
              </div>
            );
          })}
        </div>
      </div>
      <MemberDialog
        value={editing}
        onClose={() => setEditing(null)}
        onSaved={async (saved, oldEmail) => {
          if (!cloudOwner) return;
          try {
            const { grantAccess, revokeAccess } = await import('../../sync/cloud');
            if (oldEmail && oldEmail !== saved.email) await revokeAccess(oldEmail).catch(() => undefined);
            if (saved.email) await grantAccess(saved);
            await loadAccess();
          } catch (e) {
            app.toast(e instanceof Error ? e.message : 'Could not update their access', { tone: 'bad' });
          }
        }}
      />
    </div>
  );
}

function MemberDialog({ value, onClose, onSaved }: { value: Partial<Member> | null; onClose: () => void; onSaved: (m: Member, oldEmail: string) => Promise<void> }) {
  const app = useApp();
  const [m, setM] = useState<Partial<Member>>({});
  const [key, setKey] = useState<string | null>(null);
  if (value && key !== (value.id ?? 'new')) {
    setM({ skills: [], ...value });
    setKey(value.id ?? 'new');
  }
  if (!value && key !== null) setKey(null);
  const skills = m.skills ?? [];
  return (
    <Dialog
      open={!!value}
      onClose={onClose}
      title={value?.id ? `Edit ${value.name}` : 'Add person'}
      footer={
        <>
          {value?.id ? (
            <>
              <Button
                variant="danger"
                onClick={async () => {
                  if (!(await app.confirm({ title: `Remove ${value.name}?`, message: 'If they have posts, mark them inactive instead.', confirmLabel: 'Remove', tone: 'danger' }))) return;
                  try {
                    await deleteMember(value.id as string);
                    if (value.email) {
                      const { revokeAccess } = await import('../../sync/cloud');
                      await revokeAccess(value.email).catch(() => undefined);
                    }
                    onClose();
                  } catch (e) {
                    app.toast(e instanceof Error ? e.message : 'Could not remove', { tone: 'bad' });
                  }
                }}
              >
                <Trash2 size={16} /> Remove
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  try {
                    await setMemberActive(value.id as string, value.active !== 1);
                    onClose();
                  } catch (e) {
                    app.toast(e instanceof Error ? e.message : 'Could not change', { tone: 'bad' });
                  }
                }}
              >
                {value.active === 1 ? 'Mark inactive' : 'Make active'}
              </Button>
            </>
          ) : null}
          <span className="grow" />
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!m.name?.trim()}
            onClick={async () => {
              try {
                const oldEmail = value?.email ?? '';
                const saved = await saveMember({ ...(m as Member), name: m.name!.trim() });
                await onSaved(saved, oldEmail);
                app.toast('Saved', { tone: 'good' });
                onClose();
              } catch (e) {
                app.toast(e instanceof Error ? e.message : 'Could not save', { tone: 'bad' });
              }
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Name" htmlFor="tm-name">
          <TextInput id="tm-name" value={m.name ?? ''} onChange={(e) => setM({ ...m, name: e.target.value })} />
        </Field>
        <Field label="What they do" htmlFor="tm-role" hint="e.g. Illustrator & Character Design">
          <TextInput
            id="tm-role"
            value={m.roleLabel ?? ''}
            onChange={(e) => setM({ ...m, roleLabel: e.target.value, skills: (m.skills ?? []).length ? m.skills : skillsFromRole(e.target.value) })}
          />
        </Field>
        <Field label="Email (for their phone)" htmlFor="tm-email" className="span-2" hint="The address they’ll sign in with when you invite them.">
          <TextInput id="tm-email" type="email" value={m.email ?? ''} onChange={(e) => setM({ ...m, email: e.target.value })} />
        </Field>
      </div>
      <Field label="Access">
        <Segmented<AppRole>
          label="Access"
          value={m.appRole ?? 'designer'}
          onChange={(v) => setM({ ...m, appRole: v })}
          options={(['designer', 'manager', 'owner'] as AppRole[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
        />
        <span className="hint">{ROLE_HINT[m.appRole ?? 'designer']}</span>
      </Field>
      <Field label="Leads on">
        <div className="chip-row">
          {(Object.keys(SERVICE_LABEL) as ServiceKey[]).map((s) => {
            const on = skills.includes(s);
            return (
              <button key={s} type="button" className="chip" aria-pressed={on} onClick={() => setM({ ...m, skills: on ? skills.filter((x) => x !== s) : [...skills, s] })}>
                {SERVICE_LABEL[s]}
              </button>
            );
          })}
        </div>
      </Field>
      {value?.id ? (
        <Field label="Colour">
          <div className="chip-row">
            {Array.from({ length: 8 }, (_, i) => (
              <button key={i} type="button" className="chip" aria-pressed={m.color === i} onClick={() => setM({ ...m, color: i })} aria-label={`Colour ${i + 1}`}>
                <MemberDot member={{ name: m.name ?? '?', color: i }} />
              </button>
            ))}
          </div>
        </Field>
      ) : null}
      <Field label="Notes" htmlFor="tm-notes">
        <TextArea id="tm-notes" rows={2} value={m.notes ?? ''} onChange={(e) => setM({ ...m, notes: e.target.value })} />
      </Field>
      <p className="tiny muted">
        <Plus size={12} /> Designers see the calendar, board, ideas, trends and results. Only owners and managers see prices, proposals and contracts.
      </p>
    </Dialog>
  );
}
