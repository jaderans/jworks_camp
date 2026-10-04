import { peso } from '../lib/money';
import { fmtIsoDate } from '../lib/time';
import { PLATFORMS } from './platforms';
import type { BusinessSettings, Client, ContractSection, Package } from '../db/types';

/**
 * The social media management agreement. Its sections follow the checklist
 * social media managers are taught to never work without (parties, scope,
 * client duties, payment, revisions, confidentiality, communication, IP,
 * results disclaimer, termination, law), written for the Philippines.
 * A starting point, not legal advice.
 */

export interface ContractField {
  key: string;
  label: string;
  hint?: string;
  long?: boolean;
}

export const CONTRACT_FIELDS: ContractField[] = [
  { key: 'studio.name', label: 'Your business name' },
  { key: 'studio.registration', label: 'DTI / SEC registration no.' },
  { key: 'studio.address', label: 'Your address' },
  { key: 'studio.signatory', label: 'Signing for JoshWorks', hint: 'Name and title, e.g. Joshua, Creative Director' },
  { key: 'client.name', label: 'Client’s legal or business name' },
  { key: 'client.contact', label: 'Client representative', hint: 'Name and title of the person signing' },
  { key: 'client.address', label: 'Client’s address' },
  { key: 'effectiveDate', label: 'Start date' },
  { key: 'termMonths', label: 'Term (months)' },
  { key: 'platforms', label: 'Platforms' },
  { key: 'deliverables', label: 'Monthly deliverables', hint: 'One per line', long: true },
  { key: 'engagement', label: 'Community replies', hint: 'e.g. 15 minutes every weekday' },
  { key: 'meetings', label: 'Meetings', hint: 'e.g. 1 strategy call a month' },
  { key: 'reportDay', label: 'Monthly report due', hint: 'e.g. the 5th of the following month' },
  { key: 'postingTool', label: 'Posting tool', hint: 'e.g. Meta Business Suite' },
  { key: 'approvalHours', label: 'Client approves within (hours)' },
  { key: 'fee', label: 'Monthly fee' },
  { key: 'paymentSplit', label: 'How it’s paid', hint: 'e.g. two payments of ₱3,750 on the 1st and 15th' },
  { key: 'dueDays', label: 'Invoices due within (days)' },
  { key: 'lateFeePct', label: 'Late fee (% a month)' },
  { key: 'paymentMethods', label: 'Payment methods' },
  { key: 'revisions', label: 'Revisions per post' },
  { key: 'channel', label: 'Where requests go', hint: 'e.g. our Messenger group chat or email' },
  { key: 'hours', label: 'Business hours' },
  { key: 'noticeDays', label: 'Notice to end (days)' },
  { key: 'venue', label: 'Courts of', hint: 'City for disputes' },
];

export const DEFAULT_CONTRACT_SECTIONS: ContractSection[] = [
  {
    id: 'parties',
    title: 'Parties and start date',
    on: true,
    body: 'This Social Media Management Agreement starts on {{effectiveDate}} and is made between {{studio.name}} ({{studio.registration}}), {{studio.address}} ("JoshWorks"), and {{client.name}}, represented by {{client.contact}}, {{client.address}} ("the Client").',
  },
  {
    id: 'scope',
    title: 'Scope of services',
    on: true,
    body: 'JoshWorks will manage the Client’s {{platforms}} for {{termMonths}} months. Each month includes:\n{{deliverables}}\n- Community replies: {{engagement}}\n- Meetings: {{meetings}}\n- A monthly analytics report, delivered by {{reportDay}}\n- Scheduling through {{postingTool}}, after the Client approves the content',
  },
  {
    id: 'client',
    title: 'Client responsibilities',
    on: true,
    body: 'The Client will:\n- provide brand assets, current offers and prices, photos and videos;\n- approve or comment on content within {{approvalHours}} hours (content not answered in time may move to a later date);\n- give page access through Meta Business Suite partner access, or each platform’s equivalent, instead of sharing passwords;\n- make sure the prices, claims, promos and permits mentioned in posts are accurate and lawful.',
  },
  {
    id: 'payment',
    title: 'Payment terms',
    on: true,
    body: 'The monthly fee is {{fee}}, paid as {{paymentSplit}}. Invoices are due within {{dueDays}} days. A late fee of {{lateFeePct}}% of the overdue amount applies for each month it stays unpaid. Payment is by {{paymentMethods}}; transfer fees are paid by the Client. JoshWorks may pause work while a payment is overdue. Fees for work already delivered are not refundable.',
  },
  {
    id: 'revisions',
    title: 'Revisions and extra work',
    on: true,
    body: 'Each post includes up to {{revisions}} rounds of revisions. Extra revision rounds, requests outside the scope above, and rush requests (delivery within 24 hours) are quoted before work starts and billed separately.',
  },
  {
    id: 'confidentiality',
    title: 'Confidentiality and data privacy',
    on: true,
    body: 'Both parties keep each other’s non-public information, logins, documents and customer data confidential, during this agreement and after it ends. Personal data is handled in line with the Data Privacy Act of 2012 (Republic Act No. 10173) and used only to carry out this agreement.',
  },
  {
    id: 'communication',
    title: 'Communication and approvals',
    on: true,
    body: 'Requests and approvals go through {{channel}} during business hours ({{hours}}). Messages after hours are answered the next business day. Each party names one person who approves content.',
  },
  {
    id: 'ip',
    title: 'Intellectual property',
    on: true,
    body: 'The Client owns the final approved content once it is fully paid. JoshWorks keeps its templates, workflows, unused concepts and working files, and may show published work in its portfolio unless the Client asks otherwise in writing. Stock photos, fonts and music stay under their own licenses.',
  },
  {
    id: 'results',
    title: 'Results disclaimer',
    on: true,
    body: 'Social media results depend on platform algorithms, the market and the Client’s participation. JoshWorks does not guarantee a number of followers, views, leads or sales.',
  },
  {
    id: 'termination',
    title: 'Term and termination',
    on: true,
    body: 'This agreement runs for {{termMonths}} months and then continues month to month until either party ends it. Either party may end it with {{noticeDays}} days’ written notice; the Client pays for work completed and any balance due up to the end date. Either party may end it immediately if the other breaches it, including by not paying.',
  },
  {
    id: 'law',
    title: 'Governing law and disputes',
    on: true,
    body: 'This agreement is governed by the laws of the Republic of the Philippines. The parties will first try to settle any dispute in good faith. If that fails, the courts of {{venue}} will decide it.',
  },
];

/** Replace {{placeholders}}; unknown or empty ones become a visible blank. */
export function fillTemplate(text: string, fields: Record<string, string>): string {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k: string) => {
    const v = fields[k]?.trim();
    return v ? v : '________';
  });
}

/** Placeholders used by the active sections that still have no value. */
export function missingFields(sections: ContractSection[], fields: Record<string, string>): string[] {
  const used = new Set<string>();
  for (const s of sections.filter((x) => x.on)) for (const m of s.body.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)) used.add(m[1]);
  return [...used].filter((k) => !fields[k]?.trim());
}

const list = (items: string[]) => items.map((i) => `- ${i}`).join('\n');

/** "Facebook", "Facebook and Instagram", "Facebook, Instagram and TikTok". */
const andList = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

/** Pre-fill a contract from the business settings, the client and their package. */
export function fieldsFor(business: BusinessSettings, client: Client | null, pkg: Package | null, opts: { start?: string; signatory?: string } = {}): Record<string, string> {
  const start = opts.start ?? client?.startDate ?? '';
  const fee = pkg ? pkg.price : 0;
  const half = Math.round(fee / 2);
  return {
    'studio.name': business.name,
    'studio.registration': business.registration,
    'studio.address': business.address,
    'studio.signatory': opts.signatory ?? '',
    'client.name': client?.name ?? '',
    'client.contact': client?.contactName ?? '',
    'client.address': client?.location ?? '',
    effectiveDate: start ? fmtIsoDate(start) : '',
    termMonths: String(pkg?.minTermMonths || 3),
    platforms: andList((pkg?.platforms.length ? pkg.platforms : client?.platforms ?? []).map((p) => PLATFORMS[p].label)),
    deliverables: pkg ? list(pkg.includes.filter((i) => !/^(facebook|instagram|tiktok)\b/i.test(i))) : '',
    engagement: pkg?.deliverables.find((x) => /repl/i.test(x.label))?.label.replace(/^community replies,?\s*/i, '') ?? 'not included',
    meetings: pkg?.deliverables.some((x) => /call/i.test(x.label)) ? '1 strategy call a month' : 'check-ins by chat',
    reportDay: 'the 5th of the following month',
    postingTool: 'Meta Business Suite',
    approvalHours: String(client?.approvalHours || 48),
    fee: fee ? `${peso(fee)} a month` : '',
    paymentSplit: fee ? `two payments of ${peso(half)} on the 1st and the 15th of each month` : '',
    dueDays: '7',
    lateFeePct: '5',
    paymentMethods: business.paymentDetails || 'GCash or bank transfer',
    revisions: String(pkg?.revisionsPerPost ?? 2),
    channel: 'our shared Messenger chat or email',
    hours: 'Monday to Friday, 9 AM to 6 PM',
    noticeDays: '30',
    venue: 'Iloilo City',
  };
}
