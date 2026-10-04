import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, ExternalLink, Eye, EyeOff, KeyRound, Trash2 } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Badge, Button, Callout, Segmented, Toggle } from '../../components/ui';
import { Field, NumberInput, TextInput } from '../../components/form';
import { useReports, useSettingRows } from '../../hooks/data';
import { setSetting, settingValue } from '../../db/settings';
import { MODELS, getApiKey, setApiKey, testKey } from '../../ai/claude';
import { fmtIsoDate } from '../../lib/time';
import type { AiSettings } from '../../db/types';

export function AiSection() {
  const app = useApp();
  const ai = settingValue(useSettingRows(), 'ai');
  const reports = useReports();
  const feed = reports?.find((r) => r.source === 'feed');
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    getApiKey().then((k) => {
      setSaved(!!k);
      setKey(k);
    });
  }, []);
  const owner = app.role === 'owner';
  const update = async (patch: Partial<AiSettings>) => {
    if (!owner) return;
    await setSetting('ai', { ...ai, ...patch });
  };
  return (
    <section id="s-ai" className="card pad-lg" style={{ scrollMarginTop: 80 }}>
      <div className="card-head">
        <h2 className="row" style={{ gap: 8 }}>
          <Bot size={22} className="teal" /> Assistant (Claude)
        </h2>
        <Badge tone={saved ? 'good' : undefined}>{saved ? 'Connected on this device' : 'Not connected'}</Badge>
      </div>
      <p className="sub">
        The assistant writes captions, hooks and scripts in JoshWorks’ voice, plans campaigns, drafts client reports and searches the web for current trends. It uses your own Claude API key, which stays on this device only (it never syncs to the team).
      </p>
      <ol className="small" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
        <li>
          Go to{' '}
          <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noreferrer noopener">
            the Claude Console <ExternalLink size={12} />
          </a>
          , sign in, add a little credit under Billing, and set a monthly spend limit.
        </li>
        <li>Create an API key and paste it here. To use it on another phone, paste it there too (or let that person use their own).</li>
      </ol>
      <Field label="API key" htmlFor="ai-key" error={error || undefined}>
        <div className="row">
          <TextInput id="ai-key" type={show ? 'text' : 'password'} autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-…" />
          <button type="button" className="icon-btn" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide the key' : 'Show the key'}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Field>
      <div className="actions">
        <Button
          variant="primary"
          disabled={busy || !key.trim()}
          onClick={async () => {
            setBusy(true);
            setError('');
            const problem = await testKey(key, ai.model);
            setBusy(false);
            if (problem) {
              setError(problem);
              return;
            }
            await setApiKey(key);
            setSaved(true);
            app.toast('Claude is connected on this device', { tone: 'good' });
          }}
        >
          <KeyRound size={16} /> {busy ? 'Checking…' : 'Check and save'}
        </Button>
        {saved ? (
          <Button
            variant="ghost"
            onClick={async () => {
              await setApiKey('');
              setKey('');
              setSaved(false);
            }}
          >
            <Trash2 size={16} /> Remove from this device
          </Button>
        ) : null}
      </div>
      <div className="form-grid">
        <Field label="Model" htmlFor="ai-model" hint={owner ? 'Applies to everyone on the team.' : 'The owner chooses the model.'}>
          <select id="ai-model" className="select" value={ai.model} disabled={!owner} onChange={(e) => update({ model: e.target.value })}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} · {m.note} (${m.input}/${m.output} per million tokens)
              </option>
            ))}
          </select>
        </Field>
        <Field label="How hard it thinks">
          <Segmented<AiSettings['effort']>
            label="Effort"
            value={ai.effort}
            disabled={!owner}
            onChange={(v) => update({ effort: v })}
            options={[
              { value: 'low', label: 'Quick' },
              { value: 'medium', label: 'Balanced' },
              { value: 'high', label: 'Thorough' },
            ]}
          />
        </Field>
        <Field label="Monthly budget reminder (USD)" htmlFor="ai-budget" hint="Set the real limit in the Claude Console.">
          <NumberInput id="ai-budget" prefix="$" value={ai.monthlyBudgetUsd} disabled={!owner} onChange={(v) => update({ monthlyBudgetUsd: v ?? 0 })} />
        </Field>
        <Field label="Web search">
          <Toggle id="ai-web" checked={ai.webSearch} disabled={!owner} onChange={(v) => update({ webSearch: v })} label="Allow searching the web for trends" />
        </Field>
      </div>
      <Callout tone="info" title="What it costs">
        A set of captions is about 1–3 US cents (a peso or two); a full trend report with web search is about 10–30 cents. Web search adds $10 per 1,000 searches. Each answer shows its cost.
      </Callout>
      <section className="stack tight">
        <h3>Weekly trend report</h3>
        <p className="small">
          A scheduled Claude routine can research trends every Monday and publish them with the app, so everyone sees them on the dashboard without a key. Setup steps are in <span className="mono">docs/TREND_REPORT.md</span>.
        </p>
        {feed ? (
          <span className="small row">
            <CheckCircle2 size={16} className="good" /> Latest weekly report: week of {fmtIsoDate(feed.weekOf)}
          </span>
        ) : (
          <span className="small muted">No weekly report published yet.</span>
        )}
      </section>
    </section>
  );
}
