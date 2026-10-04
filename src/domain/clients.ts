import type { ClientStage } from '../db/types';

/**
 * The SMM client process: discovery call → contract → onboarding → strategy,
 * then a monthly cycle of create → approve → schedule → run → report.
 * Each stage has the checklist that keeps nothing from slipping.
 */
export interface StageDef {
  key: ClientStage;
  label: string;
  hint: string;
  checklist: { id: string; label: string }[];
}

export const PIPELINE: StageDef[] = [
  {
    key: 'lead',
    label: 'Lead',
    hint: 'They messaged, commented a keyword, or were referred.',
    checklist: [
      { id: 'lead-reply', label: 'Replied within the day' },
      { id: 'lead-book', label: 'Offered a discovery call time' },
    ],
  },
  {
    key: 'discovery',
    label: 'Discovery call',
    hint: 'Understand the business before quoting.',
    checklist: [
      { id: 'disc-goals', label: 'Goals and what success looks like in 3 months' },
      { id: 'disc-audience', label: 'Who their customers are' },
      { id: 'disc-platforms', label: 'Current platforms, followers and what they post' },
      { id: 'disc-competitors', label: 'Competitors and accounts they admire' },
      { id: 'disc-budget', label: 'Budget range and decision maker' },
      { id: 'disc-timeline', label: 'When they want to start' },
    ],
  },
  {
    key: 'proposal',
    label: 'Proposal',
    hint: 'Recommend one package; offer one step up and one step down.',
    checklist: [
      { id: 'prop-made', label: 'Proposal made from a package' },
      { id: 'prop-sent', label: 'Proposal sent' },
      { id: 'prop-follow', label: 'Followed up after 2 days' },
    ],
  },
  {
    key: 'contract',
    label: 'Contract',
    hint: 'Never start without a signed agreement and the first payment.',
    checklist: [
      { id: 'con-made', label: 'Contract generated and checked' },
      { id: 'con-signed', label: 'Signed copy saved' },
      { id: 'con-paid', label: 'First payment received' },
    ],
  },
  {
    key: 'onboarding',
    label: 'Onboarding',
    hint: 'Collect everything once, so month one runs smoothly.',
    checklist: [
      { id: 'onb-kit', label: 'Brand kit: logo files, colours, fonts' },
      { id: 'onb-offers', label: 'Offers, prices, FAQs and promos' },
      { id: 'onb-media', label: 'Shared folder of photos and videos' },
      { id: 'onb-access', label: 'Page access via Meta Business Suite partner access (never passwords)' },
      { id: 'onb-approver', label: 'Who approves content, and how fast' },
      { id: 'onb-tools', label: 'Posting tool and approval flow agreed' },
    ],
  },
  {
    key: 'strategy',
    label: 'Strategy',
    hint: 'Present the plan before making content.',
    checklist: [
      { id: 'str-persona', label: 'Audience persona written' },
      { id: 'str-pillars', label: 'Content pillars and weekly rhythm' },
      { id: 'str-funnel', label: 'Funnel mapped (awareness → loyalty)' },
      { id: 'str-calendar', label: 'First month’s calendar drafted' },
      { id: 'str-presented', label: 'Strategy presented and approved' },
    ],
  },
  {
    key: 'active',
    label: 'Active',
    hint: 'The monthly cycle.',
    checklist: [],
  },
  { key: 'paused', label: 'Paused', hint: 'On hold; check back.', checklist: [] },
  { key: 'ended', label: 'Ended', hint: 'Finished working together.', checklist: [] },
  { key: 'lost', label: 'Lost', hint: 'Didn’t go ahead; note why.', checklist: [] },
];

/** Board columns, in order. */
export const PIPELINE_BOARD: ClientStage[] = ['lead', 'discovery', 'proposal', 'contract', 'onboarding', 'strategy', 'active'];

export const STAGE_LABEL = Object.fromEntries(PIPELINE.map((s) => [s.key, s.label])) as Record<ClientStage, string>;

/** The monthly cycle for active clients; ids get the month appended (e.g. cyc-create:2026-11). */
export const MONTHLY_CYCLE = [
  { id: 'cyc-create', label: 'Content created' },
  { id: 'cyc-approve', label: 'Approved by the client' },
  { id: 'cyc-schedule', label: 'Scheduled' },
  { id: 'cyc-engage', label: 'Replies and engagement done' },
  { id: 'cyc-report', label: 'Monthly report sent' },
  { id: 'cyc-invoice', label: 'Invoice sent and paid' },
];

export function stageProgress(stage: ClientStage, checklist: Record<string, boolean>): { done: number; total: number } {
  const def = PIPELINE.find((s) => s.key === stage);
  const items = def?.checklist ?? [];
  return { done: items.filter((i) => checklist[i.id]).length, total: items.length };
}
