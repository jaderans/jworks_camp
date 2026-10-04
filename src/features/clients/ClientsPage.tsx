import { useMemo, useState, type DragEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bot, Briefcase, CalendarDays, FileDown, FileSignature, FileText, Loader2, Megaphone, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Badge, Button, Callout, EmptyState, PageHeader, Segmented } from '../../components/ui';
import { Check, Field, Select, TextArea, TextInput } from '../../components/form';
import { Dialog } from '../../components/Dialog';
import { StatusBadge } from '../../components/people';
import { useClients, useContracts, useMetrics, usePackages, usePosts, useProposals, useSettingRows } from '../../hooks/data';
import { settingValue } from '../../db/settings';
import { MONTHLY_CYCLE, PIPELINE, PIPELINE_BOARD, STAGE_LABEL, stageProgress } from '../../domain/clients';
import { PLATFORMS, PLATFORM_ORDER } from '../../domain/platforms';
import { blankClient, deleteClient, saveClient, setClientStage, toggleClientCheck } from '../../services/clients';
import { getApiKey, streamChat } from '../../ai/claude';
import { RECIPES, buildContext, buildSystemPrompt } from '../../ai/prompts';
import { buildApprovalPdf, buildReportPdf } from '../../reports/docs';
import { deliverPdf } from '../../reports/pdf';
import { peso } from '../../lib/money';
import { fmtIsoDate, fmtIsoWeekday, fmtMonth, todayISO } from '../../lib/time';
import { safeFileName } from '../../lib/files';
import type { Client, ClientStage, Persona, PlatformKey } from '../../db/types';

export default function ClientsPage() {
  const [params, setParams] = useSearchParams();
  const clients = useClients();
  const packages = usePackages() ?? [];
  const [view, setView] = useState<'pipeline' | 'all'>('pipeline');
  const [openId, setOpenId] = useState<string | null>(() => params.get('id'));
  const [creating, setCreating] = useState(() => params.get('new') === '1');
  const pkgName = (id: string | null) => packages.find((p) => p.id === id)?.name ?? '';

  const onDrop = async (e: DragEvent, stage: ClientStage) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drop');
    const id = e.dataTransfer.getData('text/client-id');
    if (id) await setClientStage(id, stage);
  };

  if (!clients) return null;
  return (
    <div className="page" style={{ maxWidth: 1600 }}>
      <PageHeader
        title="SMM clients"
        subtitle="Discovery call → contract → onboarding → strategy, then every month: create → approve → schedule → run → report."
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus size={18} /> Add a client
          </Button>
        }
      />
      <Callout tone="warn" title="Never store client passwords here">
        Send clients JoshWorks’ business portfolio ID and ask them to add it as a partner in Meta’s Business settings (Users → Partners → Add → Give a partner access to your assets), and in TikTok Business Center (Partners → Add partner). You get access without their password, and they can remove it any time.
      </Callout>
      <Segmented
        label="View"
        value={view}
        onChange={setView}
        options={[
          { value: 'pipeline', label: 'Pipeline' },
          { value: 'all', label: 'All clients' },
        ]}
      />
      {clients.length === 0 ? (
        <EmptyState icon={<Briefcase size={40} />} title="No clients yet" action={<Button variant="primary" onClick={() => setCreating(true)}>Add your first client</Button>}>
          Add leads as soon as they message. The pipeline keeps every next step in view.
        </EmptyState>
      ) : view === 'pipeline' ? (
        <div className="pipeline">
          {PIPELINE_BOARD.map((stage) => {
            const list = clients.filter((c) => c.stage === stage);
            return (
              <section
                key={stage}
                className="bcol"
                aria-label={STAGE_LABEL[stage]}
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes('text/client-id')) {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).classList.add('drop');
                  }
                }}
                onDragLeave={(e) => (e.currentTarget as HTMLElement).classList.remove('drop')}
                onDrop={(e) => void onDrop(e, stage)}
              >
                <div className="bcol-head">
                  {STAGE_LABEL[stage]}
                  <span className="count">{list.length}</span>
                </div>
                {list.map((c) => {
                  const prog = stageProgress(c.stage, c.checklist);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className="pcard"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/client-id', c.id)}
                      onClick={() => setOpenId(c.id)}
                    >
                      <span className="title">{c.name}</span>
                      <span className="meta">
                        {c.industry ? <span>{c.industry}</span> : null}
                        {c.packageId ? <Badge tone="teal">{pkgName(c.packageId)}</Badge> : null}
                      </span>
                      {prog.total ? (
                        <>
                          <div className="prog">
                            <span style={{ width: `${(prog.done / prog.total) * 100}%` }} />
                          </div>
                          <span className="tiny muted">
                            {prog.done}/{prog.total} done
                          </span>
                        </>
                      ) : null}
                    </button>
                  );
                })}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Stage</th>
                <th>Package</th>
                <th>Contact</th>
                <th>Since</th>
                <th>Renews</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="click" onClick={() => setOpenId(c.id)}>
                  <td>
                    <b>{c.name}</b>
                    <div className="tiny muted">{c.industry}</div>
                  </td>
                  <td>
                    <Badge tone={c.stage === 'active' ? 'good' : c.stage === 'lost' || c.stage === 'ended' ? undefined : 'teal'}>{STAGE_LABEL[c.stage]}</Badge>
                  </td>
                  <td>{pkgName(c.packageId)}</td>
                  <td className="small">{[c.contactName, c.phone || c.email].filter(Boolean).join(' · ')}</td>
                  <td className="nowrap">{c.startDate ? fmtIsoDate(c.startDate) : '—'}</td>
                  <td className="nowrap">{c.renewalDate ? fmtIsoDate(c.renewalDate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <NewClientDialog
        open={creating}
        onClose={(id) => {
          setCreating(false);
          if (params.get('new')) setParams({}, { replace: true });
          if (id) setOpenId(id);
        }}
      />
      <ClientDialog
        id={openId}
        onClose={() => {
          setOpenId(null);
          if (params.get('id')) setParams({}, { replace: true });
        }}
      />
    </div>
  );
}

function NewClientDialog({ open, onClose }: { open: boolean; onClose: (id?: string) => void }) {
  const app = useApp();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contact, setContact] = useState('');
  const [source, setSource] = useState('');
  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      title="Add a client"
      footer={
        <>
          <Button onClick={() => onClose()}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!name.trim()}
            onClick={async () => {
              const c = await saveClient({ name: name.trim(), industry, contactName: contact, source, stage: 'lead' });
              app.toast(`${c.name} added as a lead`, { tone: 'good' });
              setName('');
              setIndustry('');
              setContact('');
              setSource('');
              onClose(c.id);
            }}
          >
            Add
          </Button>
        </>
      }
    >
      <Field label="Business name" htmlFor="nc-name">
        <TextInput id="nc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kape Ilonggo" />
      </Field>
      <div className="form-grid">
        <Field label="Industry" htmlFor="nc-ind">
          <TextInput id="nc-ind" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Café, salon, school org…" />
        </Field>
        <Field label="Contact person" htmlFor="nc-contact">
          <TextInput id="nc-contact" value={contact} onChange={(e) => setContact(e.target.value)} />
        </Field>
      </div>
      <Field label="How they found us" htmlFor="nc-src">
        <TextInput id="nc-src" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Commented “START”, referral, booth…" />
      </Field>
    </Dialog>
  );
}

type DTab = 'overview' | 'checklist' | 'content' | 'documents' | 'report';

function ClientDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const app = useApp();
  const navigate = useNavigate();
  const clients = useClients() ?? [];
  const packages = (usePackages() ?? []).filter((p) => p.kind === 'smm');
  const stored = clients.find((c) => c.id === id) ?? null;
  const [tab, setTab] = useState<DTab>('overview');
  const [c, setC] = useState<Client | null>(null);
  const [dirty, setDirty] = useState(false);
  if (stored && (!c || c.id !== stored.id)) {
    setC({ ...blankClient(), ...stored });
    setDirty(false);
    setTab('overview');
  }
  if (!id && c) setC(null);
  if (!c || !stored) return null;
  const set = <K extends keyof Client>(k: K, v: Client[K]) => {
    setC({ ...c, [k]: v });
    setDirty(true);
  };
  const setPersona = (k: keyof Persona, v: string) => set('persona', { ...c.persona, [k]: v });
  const save = async () => {
    await saveClient(c);
    setDirty(false);
    app.toast('Saved', { tone: 'good' });
  };
  return (
    <Dialog
      open={!!id}
      onClose={async () => {
        if (dirty && !(await app.confirm({ title: 'Discard your changes?', confirmLabel: 'Discard', tone: 'danger' }))) return;
        onClose();
      }}
      size="xwide"
      fullPhone
      title={
        <span className="row" style={{ gap: 10 }}>
          {c.name} <Badge tone={c.stage === 'active' ? 'good' : 'teal'}>{STAGE_LABEL[c.stage]}</Badge>
        </span>
      }
      footer={
        <>
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              if (!(await app.confirm({ title: `Delete ${c.name}?`, message: 'Their unposted posts are deleted too. To keep history, set the stage to Ended instead.', confirmLabel: 'Delete', tone: 'danger' }))) return;
              try {
                await deleteClient(c.id);
                onClose();
              } catch (e) {
                app.toast(e instanceof Error ? e.message : 'Could not delete', { tone: 'bad' });
              }
            }}
          >
            <Trash2 size={16} /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/assistant?client=${c.id}&recipe=proposal`)}>
            <Bot size={16} /> Ask Claude
          </Button>
          <span className="grow" />
          <Select aria-label="Stage" style={{ width: 'auto' }} value={c.stage} onChange={(e) => set('stage', e.target.value as ClientStage)}>
            {PIPELINE.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
          <Button variant="primary" onClick={save} disabled={!dirty}>
            Save
          </Button>
        </>
      }
    >
      <nav className="tabs" aria-label="Client sections">
        {(
          [
            ['overview', 'Overview'],
            ['checklist', 'Checklist'],
            ['content', 'Content'],
            ['documents', 'Proposals & contracts'],
            ['report', 'Monthly report'],
          ] as [DTab, string][]
        ).map(([k, label]) => (
          <button key={k} type="button" aria-selected={tab === k} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </nav>
      {tab === 'overview' ? (
        <div className="stack loose">
          <div className="form-grid">
            <Field label="Business name" htmlFor="cl-name">
              <TextInput id="cl-name" value={c.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Industry" htmlFor="cl-ind">
              <TextInput id="cl-ind" value={c.industry} onChange={(e) => set('industry', e.target.value)} />
            </Field>
            <Field label="Contact person" htmlFor="cl-contact">
              <TextInput id="cl-contact" value={c.contactName} onChange={(e) => set('contactName', e.target.value)} />
            </Field>
            <Field label="Phone" htmlFor="cl-phone">
              <TextInput id="cl-phone" value={c.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" />
            </Field>
            <Field label="Email" htmlFor="cl-email">
              <TextInput id="cl-email" value={c.email} onChange={(e) => set('email', e.target.value)} type="email" />
            </Field>
            <Field label="Address" htmlFor="cl-loc">
              <TextInput id="cl-loc" value={c.location} onChange={(e) => set('location', e.target.value)} />
            </Field>
            <Field label="Package" htmlFor="cl-pkg">
              <Select id="cl-pkg" value={c.packageId ?? ''} onChange={(e) => set('packageId', e.target.value || null)}>
                <option value="">Not chosen yet</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {peso(p.price)}/month
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Approves content within (hours)" htmlFor="cl-appr">
              <input id="cl-appr" className="input num" inputMode="numeric" value={c.approvalHours} onChange={(e) => set('approvalHours', Number(e.target.value.replace(/\D/g, '')) || 0)} />
            </Field>
            <Field label="Started" htmlFor="cl-start">
              <input id="cl-start" type="date" className="input" value={c.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </Field>
            <Field label="Renews" htmlFor="cl-renew">
              <input id="cl-renew" type="date" className="input" value={c.renewalDate} onChange={(e) => set('renewalDate', e.target.value)} />
            </Field>
            <Field label="Brand kit folder" htmlFor="cl-kit" className="span-2">
              <TextInput id="cl-kit" value={c.brandKitLink} onChange={(e) => set('brandKitLink', e.target.value)} placeholder="Google Drive link with logos, fonts, photos" />
            </Field>
          </div>
          <Field label="Platforms">
            <div className="chip-row">
              {PLATFORM_ORDER.slice(0, 7).map((k) => {
                const on = c.platforms.includes(k);
                return (
                  <button key={k} type="button" className="chip" aria-pressed={on} onClick={() => set('platforms', on ? c.platforms.filter((x) => x !== k) : [...c.platforms, k])}>
                    {PLATFORMS[k].label}
                  </button>
                );
              })}
            </div>
          </Field>
          {c.platforms.length ? (
            <div className="form-grid">
              {c.platforms.map((k) => (
                <Field key={k} label={`${PLATFORMS[k].label} page or handle`} htmlFor={`cl-h-${k}`}>
                  <TextInput id={`cl-h-${k}`} value={c.handles[k] ?? ''} onChange={(e) => set('handles', { ...c.handles, [k as PlatformKey]: e.target.value })} />
                </Field>
              ))}
            </div>
          ) : null}
          <Field label="Goals (what success looks like in 3 months)" htmlFor="cl-goals">
            <TextArea id="cl-goals" rows={2} value={c.goals} onChange={(e) => set('goals', e.target.value)} />
          </Field>
          <section className="stack">
            <h3>Their customers</h3>
            <div className="form-grid">
              {(
                [
                  ['who', 'Who they are'],
                  ['pains', 'What frustrates them'],
                  ['wants', 'What they want'],
                  ['objections', 'What makes them hesitate'],
                  ['whereTheyAre', 'Where they are online'],
                  ['triggers', 'When they buy'],
                ] as [keyof Persona, string][]
              ).map(([k, label]) => (
                <Field key={k} label={label} htmlFor={`cl-p-${k}`}>
                  <TextArea id={`cl-p-${k}`} rows={2} value={c.persona[k]} onChange={(e) => setPersona(k, e.target.value)} />
                </Field>
              ))}
            </div>
          </section>
          <Field label="Notes" htmlFor="cl-notes">
            <TextArea id="cl-notes" rows={3} value={c.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </div>
      ) : null}
      {tab === 'checklist' ? <ClientChecklist client={stored} /> : null}
      {tab === 'content' ? <ClientContent client={stored} /> : null}
      {tab === 'documents' ? <ClientDocuments client={stored} /> : null}
      {tab === 'report' ? <ClientReport client={stored} /> : null}
    </Dialog>
  );
}

function ClientChecklist({ client }: { client: Client }) {
  const month = todayISO().slice(0, 7);
  const current = PIPELINE.find((s) => s.key === client.stage);
  const done = (id: string) => !!client.checklist[id];
  return (
    <div className="stack loose">
      {client.stage === 'active' ? (
        <section className="card stack">
          <h3>This month ({fmtMonth(month)})</h3>
          {MONTHLY_CYCLE.map((i) => (
            <Check key={i.id} id={`cyc-${i.id}`} checked={done(`${i.id}:${month}`)} onChange={(v) => toggleClientCheck(client.id, `${i.id}:${month}`, v)} label={i.label} />
          ))}
        </section>
      ) : null}
      {PIPELINE.filter((s) => s.checklist.length).map((s) => (
        <section key={s.key} className="card stack" style={s.key === current?.key ? { borderColor: 'var(--teal)' } : undefined}>
          <div className="row between">
            <h3>{s.label}</h3>
            {s.key === current?.key ? <Badge tone="teal">Now</Badge> : null}
          </div>
          <p className="small muted">{s.hint}</p>
          {s.checklist.map((i) => (
            <Check key={i.id} id={`ck-${i.id}`} checked={done(i.id)} onChange={(v) => toggleClientCheck(client.id, i.id, v)} label={i.label} />
          ))}
        </section>
      ))}
    </div>
  );
}

function ClientContent({ client }: { client: Client }) {
  const app = useApp();
  const navigate = useNavigate();
  const posts = (usePosts() ?? []).filter((p) => p.clientId === client.id);
  const business = settingValue(useSettingRows(), 'business');
  const [month, setMonth] = useState(() => todayISO().slice(0, 7));
  const [busy, setBusy] = useState(false);
  const upcoming = posts.filter((p) => !p.date || p.date >= todayISO()).slice(0, 30);
  return (
    <div className="stack loose">
      <div className="actions">
        <Button
          onClick={() => {
            app.setScope(client.id);
            navigate('/calendar');
          }}
        >
          <CalendarDays size={16} /> Open their calendar
        </Button>
        <Button
          onClick={() => {
            app.setScope(client.id);
            navigate('/campaigns?new=1');
          }}
        >
          <Megaphone size={16} /> Plan a campaign
        </Button>
      </div>
      <section className="card stack">
        <h3>Content plan for approval</h3>
        <p className="small muted">A PDF of the month’s posts with each caption, for the client to approve or comment on.</p>
        <div className="row wrap">
          <input type="month" className="input" style={{ width: 'auto' }} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month" />
          <Button
            variant="teal"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const list = posts.filter((p) => p.date?.startsWith(month));
                if (!list.length) {
                  app.toast(`No posts for ${client.name} in ${fmtMonth(month)} yet.`, { tone: 'bad' });
                  return;
                }
                await deliverPdf(await buildApprovalPdf({ business, client, month, posts: list }), `${safeFileName(client.name)} content plan ${month}.pdf`, true);
              } finally {
                setBusy(false);
              }
            }}
          >
            <FileDown size={16} /> Approval PDF
          </Button>
        </div>
      </section>
      <section className="stack">
        <h3>Coming up</h3>
        {upcoming.length === 0 ? <p className="muted small">No posts yet. Plan a campaign or add posts on their calendar.</p> : null}
        <div className="card flush">
          <div className="list">
            {upcoming.map((p) => (
              <button key={p.id} type="button" className="list-item click" style={{ border: 0, borderBottom: '1px solid var(--line)', background: 'none', textAlign: 'left', width: '100%' }} onClick={() => navigate(`/calendar?post=${p.id}`)}>
                <span className="main-text">
                  <b>{p.title}</b>
                  <span>{p.date ? fmtIsoWeekday(p.date) : 'No date'}</span>
                </span>
                <StatusBadge status={p.status} />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ClientDocuments({ client }: { client: Client }) {
  const navigate = useNavigate();
  const proposals = (useProposals() ?? []).filter((p) => p.clientId === client.id);
  const contracts = (useContracts() ?? []).filter((c) => c.clientId === client.id);
  return (
    <div className="stack loose">
      <section className="stack">
        <div className="row between">
          <h3>Proposals</h3>
          <Button size="sm" onClick={() => navigate(`/packages/proposals?client=${client.id}`)}>
            <FileText size={16} /> New proposal
          </Button>
        </div>
        {proposals.length === 0 ? <p className="muted small">None yet.</p> : null}
        {proposals.map((p) => (
          <div key={p.id} className="row between card">
            <span>
              <b>{p.number}</b> · {fmtIsoDate(p.date)}
            </span>
            <Badge tone={p.status === 'won' ? 'good' : p.status === 'sent' ? 'yellow' : undefined}>{p.status}</Badge>
          </div>
        ))}
      </section>
      <section className="stack">
        <div className="row between">
          <h3>Contracts</h3>
          <Button size="sm" onClick={() => navigate(`/contracts?client=${client.id}`)}>
            <FileSignature size={16} /> New contract
          </Button>
        </div>
        {contracts.length === 0 ? <p className="muted small">None yet. Never start work without a signed agreement and the first payment.</p> : null}
        {contracts.map((c) => (
          <div key={c.id} className="row between card">
            <span>
              <b>{c.number}</b> · {c.fields.effectiveDate || 'no start date'}
            </span>
            <Badge tone={c.status === 'signed' ? 'good' : c.status === 'sent' ? 'yellow' : undefined}>{c.status}</Badge>
          </div>
        ))}
      </section>
    </div>
  );
}

function ClientReport({ client }: { client: Client }) {
  const app = useApp();
  const metrics = useMetrics() ?? [];
  const posts = usePosts() ?? [];
  const business = settingValue(useSettingRows(), 'business');
  const ai = settingValue(useSettingRows(), 'ai');
  const hasKey = useLiveQuery(() => getApiKey().then((k) => !!k), []);
  const [month, setMonth] = useState(() => todayISO().slice(0, 7));
  const [worked, setWorked] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const mine = useMemo(() => metrics.filter((m) => m.clientId === client.id && m.date.startsWith(month)), [metrics, client.id, month]);
  const monthPosts = posts.filter((p) => p.clientId === client.id && p.date?.startsWith(month));
  const draft = async () => {
    setBusy(true);
    try {
      const context = await buildContext({ kind: 'client', id: client.id }, { includeResults: true });
      const recipe = RECIPES.find((r) => r.id === 'report')!;
      const res = await streamChat({
        system: await buildSystemPrompt(),
        turns: [{ role: 'user', text: `${context}\n\n---\n\n${recipe.prompt.replace('{topic}', ` Only use ${fmtMonth(month)}'s numbers. Reply in two parts headed exactly "What worked" and "Next month", plain sentences, no tables.`)}` }],
        model: ai.model,
        effort: 'low',
        webSearch: false,
        onText: () => undefined,
      });
      const [, a = '', b = ''] = /what worked[^\n]*\n([\s\S]*?)\n[#*\s]*next month[^\n]*\n([\s\S]*)/i.exec(res.text) ?? [];
      setWorked((a || res.text).replace(/[#*]/g, '').trim());
      setNext(b.replace(/[#*]/g, '').trim());
    } catch (e) {
      app.toast(e instanceof Error ? e.message : 'Could not draft it', { tone: 'bad' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack">
      <div className="row wrap">
        <input type="month" className="input" style={{ width: 'auto' }} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month" />
        <span className="muted small">
          {mine.length} result{mine.length === 1 ? '' : 's'} logged · {monthPosts.filter((p) => p.status === 'posted').length} posts published
        </span>
      </div>
      {mine.length === 0 ? <Callout tone="info">Log results on {client.name}’s posted posts (open a post → Publish &amp; results), then come back for the report.</Callout> : null}
      <Field label="What worked" htmlFor="rp-worked">
        <TextArea id="rp-worked" rows={4} value={worked} onChange={(e) => setWorked(e.target.value)} placeholder="Which posts got saved and shared, and why." />
      </Field>
      <Field label="Next month" htmlFor="rp-next">
        <TextArea id="rp-next" rows={4} value={next} onChange={(e) => setNext(e.target.value)} placeholder="Three things we’ll do next month." />
      </Field>
      <div className="actions">
        {hasKey ? (
          <Button onClick={draft} disabled={busy || !mine.length}>
            {busy ? <Loader2 size={16} className="spin" /> : <Bot size={16} />} Draft with Claude
          </Button>
        ) : null}
        <Button
          variant="primary"
          disabled={!mine.length}
          onClick={async () => deliverPdf(await buildReportPdf({ business, clientName: client.name, month, metrics: mine, posts: monthPosts, worked, next }), `${safeFileName(client.name)} report ${month}.pdf`, true)}
        >
          <FileDown size={16} /> Report PDF
        </Button>
      </div>
      <p className="tiny muted">
        <ShieldAlert size={12} /> The report shows only this client’s numbers.
      </p>
    </div>
  );
}
