import type { Cents } from '../lib/money';

/**
 * Every record that syncs between devices carries these fields.
 * Records are never hard-deleted: `deleted: 1` is a tombstone so a delete
 * made on one device also reaches the others.
 */
export interface Syncable {
  id: string;
  createdAt: number;
  updatedAt: number;
  deleted?: 0 | 1;
  /** 1 = changed on this device and not uploaded yet. */
  _sync?: 0 | 1;
  /** Device that last wrote the record. */
  _dev?: string;
}

/** owner: everything. manager: everything except team, settings and money. designer: content work. */
export type AppRole = 'owner' | 'manager' | 'designer';

export type PlatformKey = 'facebook' | 'instagram' | 'tiktok' | 'threads' | 'x' | 'youtube' | 'linkedin' | 'reddit' | 'pinterest';

export type PostStatus = 'idea' | 'todo' | 'doing' | 'review' | 'ready' | 'scheduled' | 'posted' | 'skipped';

export type FunnelStage = 'awareness' | 'interest' | 'decision' | 'action' | 'loyalty';

export type ServiceKey = 'branding' | 'packaging' | 'merch' | 'stickers' | 'illustration' | 'motion' | 'web' | 'smm' | 'other';

export interface Member extends Syncable {
  name: string;
  email: string;
  appRole: AppRole;
  /** What they do, e.g. "Illustrator & Character Design". */
  roleLabel: string;
  /** Services they lead, used to suggest who takes a post. */
  skills: ServiceKey[];
  /** Fixed categorical colour slot (0–7). It follows the person, never their rank. */
  color: number;
  active: 0 | 1;
  notes: string;
}

export interface Approval {
  state: 'none' | 'requested' | 'approved' | 'changes';
  by: string | null;
  at: number | null;
  note: string;
}

/** One piece of content on the calendar (for JoshWorks or for a client). */
export interface Post extends Syncable {
  title: string;
  /** Planned day, YYYY-MM-DD. null = in the backlog, not on the calendar yet. */
  date: string | null;
  /** Planned time, HH:MM ('' = not set). */
  time: string;
  /** Weekly theme key (see cadence settings); '' = none. */
  themeKey: string;
  format: string;
  brief: string;
  status: PostStatus;
  assignees: string[];
  /** null = JoshWorks' own pages. */
  clientId: string | null;
  campaignId: string | null;
  funnelStage: FunnelStage | null;
  /** e.g. WHAT IF, Concept Drop, Freebie Friday. */
  series: string;
  platforms: PlatformKey[];
  /** First line / first three seconds. */
  hook: string;
  caption: string;
  /** Per-platform caption when it differs from the main one. */
  captions: Partial<Record<PlatformKey, string>>;
  hashtags: string;
  cta: string;
  assetLink: string;
  /** Where it was published, per platform. */
  links: Partial<Record<PlatformKey, string>>;
  postedAt: number | null;
  /** Premium design check: item id → done. */
  checklist: Record<string, boolean>;
  approval: Approval;
  ideaId: string | null;
  /** Order among posts on the same day. */
  sort: number;
  /** Free notes the importer or a reschedule leaves (e.g. "Season passed: Halloween"). */
  note: string;
}

export interface Comment extends Syncable {
  postId: string;
  authorId: string | null;
  text: string;
  at: number;
  kind: 'comment' | 'approval' | 'changes' | 'request';
}

export interface Persona {
  name: string;
  who: string;
  pains: string;
  wants: string;
  objections: string;
  whereTheyAre: string;
  triggers: string;
}

export type CampaignGoal = 'awareness' | 'engagement' | 'leads' | 'sales' | 'launch' | 'community';

export interface Kpi {
  metric: 'reach' | 'views' | 'saves' | 'shares' | 'comments' | 'follows' | 'leads' | 'sales';
  target: number;
}

export interface Campaign extends Syncable {
  name: string;
  clientId: string | null;
  status: 'draft' | 'active' | 'paused' | 'done';
  goal: CampaignGoal;
  service: ServiceKey | '';
  templateId: string;
  startDate: string;
  endDate: string;
  audience: Persona;
  offer: string;
  keyMessage: string;
  /** Word people DM or comment, e.g. LOGO, MERCH. */
  ctaKeyword: string;
  leadMagnet: string;
  channels: PlatformKey[];
  /** Ad spend, if any. */
  budget: Cents | null;
  kpis: Kpi[];
  funnelId: string | null;
  notes: string;
}

export interface FunnelStageDef {
  key: FunnelStage;
  goal: string;
  content: string;
  offer: string;
  cta: string;
  channel: string;
  kpi: string;
  target: number | null;
}

export interface Funnel extends Syncable {
  name: string;
  clientId: string | null;
  campaignId: string | null;
  templateId: string;
  stages: FunnelStageDef[];
  notes: string;
}

export interface Slide {
  label: string;
  text: string;
}

export type IdeaKind = 'idea' | 'whatif' | 'concept' | 'script';

export interface Idea extends Syncable {
  kind: IdeaKind;
  title: string;
  /** Educational (Mon), Video / Reel, Fun / Engagement (Fri)… */
  category: string;
  bestFor: string[];
  /** "Joshua/Harvey" as written in the planner, kept when a name isn't on the team. */
  bestForText: string;
  format: string;
  angle: string;
  timing: string;
  /** WHAT IF / Concept Drop subject. */
  subject: string;
  status: 'idea' | 'scheduled' | 'used' | 'archived';
  postId: string | null;
  slides: Slide[];
  tags: string[];
  notes: string;
  sort: number;
}

export interface Snippet extends Syncable {
  kind: 'hashtags' | 'cta' | 'disclaimer' | 'caption';
  label: string;
  text: string;
  useFor: string;
  notes: string;
  sort: number;
}

export type TrendStatus = 'watching' | 'trying' | 'used' | 'expired' | 'skipped';

export interface Trend extends Syncable {
  kind: 'trend' | 'outlier' | 'sound' | 'format';
  title: string;
  platform: PlatformKey | 'any';
  url: string;
  creator: string;
  whyItWorks: string;
  howWeUseIt: string;
  hook: string;
  views: number | null;
  /** The creator's usual views, so we can see how far above normal this one went. */
  creatorAvgViews: number | null;
  status: TrendStatus;
  expiresOn: string | null;
  savedBy: string | null;
  source: 'manual' | 'claude' | 'feed';
  tags: string[];
}

export interface Hook extends Syncable {
  text: string;
  pattern: string;
  sourceUrl: string;
  whyItWorks: string;
  /** Our version of it. */
  rewrite: string;
  memberId: string | null;
  /** Set when this was the day's "rewrite one hook" practice. */
  practiceDate: string | null;
  tags: string[];
}

/** Numbers for one post on one platform, logged 48–72 h after publishing. */
export interface Metric extends Syncable {
  postId: string | null;
  clientId: string | null;
  date: string;
  title: string;
  series: string;
  format: string;
  memberIds: string[];
  /** As written in an imported sheet, kept when the name isn't on the team. */
  designerText: string;
  platform: PlatformKey;
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  shares: number | null;
  follows: number | null;
  clicks: number | null;
  leads: number | null;
  notes: string;
}

export type ClientStage = 'lead' | 'discovery' | 'proposal' | 'contract' | 'onboarding' | 'strategy' | 'active' | 'paused' | 'ended' | 'lost';

export interface Client extends Syncable {
  name: string;
  industry: string;
  contactName: string;
  email: string;
  phone: string;
  location: string;
  stage: ClientStage;
  source: string;
  platforms: PlatformKey[];
  handles: Partial<Record<PlatformKey, string>>;
  brandKitLink: string;
  packageId: string | null;
  startDate: string;
  renewalDate: string;
  /** How long the client takes to approve content. */
  approvalHours: number;
  goals: string;
  persona: Persona;
  /** Onboarding and monthly checklist: item id → done. */
  checklist: Record<string, boolean>;
  notes: string;
}

export interface Deliverable {
  label: string;
  qty: number;
  /** Hours each, for the margin check. */
  hours: number;
  /** Role whose rate those hours cost. */
  role: string;
}

export interface Package extends Syncable {
  kind: 'smm' | 'design' | 'addon';
  name: string;
  tagline: string;
  price: Cents;
  unit: 'month' | 'project' | 'piece' | 'hour' | 'percent';
  platforms: PlatformKey[];
  deliverables: Deliverable[];
  includes: string[];
  revisionsPerPost: number;
  minTermMonths: number;
  service: ServiceKey | '';
  active: 0 | 1;
  sort: number;
  notes: string;
}

export interface ProposalItem {
  packageId: string | null;
  label: string;
  qty: number;
  unitPrice: Cents;
  unit: Package['unit'];
  /** Months for monthly items. */
  months: number;
}

export interface Proposal extends Syncable {
  number: string;
  clientId: string | null;
  clientName: string;
  date: string;
  validUntil: string;
  items: ProposalItem[];
  /** Introductory discount, percent of monthly items for the first `discountMonths`. */
  discountPct: number;
  discountMonths: number;
  discountLabel: string;
  vat: boolean;
  ewt: boolean;
  status: 'draft' | 'sent' | 'won' | 'lost';
  intro: string;
  notes: string;
}

export interface ContractSection {
  id: string;
  title: string;
  body: string;
  on: boolean;
}

export interface Contract extends Syncable {
  number: string;
  clientId: string | null;
  proposalId: string | null;
  packageId: string | null;
  status: 'draft' | 'sent' | 'signed' | 'ended';
  /** Values the template's {{placeholders}} are filled with. */
  fields: Record<string, string>;
  sections: ContractSection[];
  signedAt: number | null;
  notes: string;
}

/** A weekly trend report: from the scheduled Claude routine (feed) or written in the app. */
export interface TrendReport extends Syncable {
  weekOf: string;
  source: 'feed' | 'assistant';
  generatedAt: number;
  summary: string;
  items: TrendItem[];
  dates: { date: string; name: string; idea: string }[];
  sources: { title: string; url: string }[];
}

export interface TrendItem {
  id: string;
  title: string;
  platform: PlatformKey | 'any';
  kind: string;
  what: string;
  why: string;
  howJoshWorks: string;
  postIdea: { title: string; format: string; themeKey: string } | null;
  expires: string | null;
  sources: { title: string; url: string }[];
}

export interface AuditEntry extends Syncable {
  at: number;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
}

export interface SettingRow extends Syncable {
  value: unknown;
}

// ----- settings values -----

export interface BusinessSettings {
  name: string;
  tagline: string;
  /** DTI business name registration no., shown on proposals and contracts. */
  registration: string;
  address: string;
  contact: string;
  email: string;
  website: string;
  handles: Partial<Record<PlatformKey, string>>;
  /** Where client payments go, printed on proposals: "GCash 09xx…, BPI …". */
  paymentDetails: string;
}

export interface BrandVoice {
  tone: string;
  audience: string;
  doSay: string;
  dontSay: string;
  emoji: 'none' | 'light' | 'expressive';
  boldHeadline: boolean;
  language: string;
  defaultCta: string;
  baseHashtags: string;
}

export interface ThemeDef {
  key: string;
  /** 1 = Monday … 5 = Friday (0 Sunday, 6 Saturday allowed). */
  dow: number;
  name: string;
  short: string;
  description: string;
  /** A flex slot is only used when needed. */
  flex: boolean;
  active: boolean;
}

export interface CadenceSettings {
  themes: ThemeDef[];
  /** Friday rotation, week 1–4 of each month's cycle. */
  fridayRotation: string[];
  /** Break week: the week that starts on the last Monday of each month. */
  breakRule: boolean;
  /** Leave Philippine public holidays free when planning. */
  skipHolidays: boolean;
  /** Extra break ranges (YYYY-MM-DD to YYYY-MM-DD). */
  breaks: { start: string; end: string; label: string }[];
  /** Posting picks up again on this day (a pause before it shows on the dashboard). */
  resumeOn: string;
  defaultTimes: Partial<Record<PlatformKey, string>>;
  platforms: PlatformKey[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  hint: string;
  on: boolean;
}

export interface RoleRate {
  name: string;
  rate: Cents;
  covers: string;
}

export interface RateSettings {
  roles: RoleRate[];
  overheadPct: number;
  targetMarginPct: number;
  minMarginPct: number;
  vatPct: number;
  ewtPct: number;
  rushPct: number;
  revisionPct: number;
}

export interface AiSettings {
  model: string;
  effort: 'low' | 'medium' | 'high';
  webSearch: boolean;
  /** Reminder only: the real limit is set in the Claude Console. */
  monthlyBudgetUsd: number;
}

export interface SecuritySettings {
  pinHash: string | null;
  pinSalt: string | null;
}

export type SettingKey = 'business' | 'voice' | 'cadence' | 'checklist' | 'rates' | 'ai' | 'contract' | 'security';

// ----- device-only -----

export interface LocalRow {
  key: string;
  value: unknown;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  at: number;
  /** Web pages the answer used. */
  sources?: { title: string; url: string }[];
  usage?: { input: number; output: number; cacheRead: number; searches: number; costUsd: number; model: string };
  error?: string;
}

export interface Chat {
  id: string;
  title: string;
  recipe: string;
  createdAt: number;
  updatedAt: number;
  /** What the chat is about: a post, campaign or client. */
  context: { kind: 'post' | 'campaign' | 'client' | 'none'; id: string | null; label: string };
  /** Background sent with the first message (today, the calendar, the post…). */
  contextText?: string;
  messages: ChatMessage[];
}
