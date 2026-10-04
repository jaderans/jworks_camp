import { addDays, isoOf, nthWeekdayOfMonth } from '../lib/time';
import type { ServiceKey } from '../db/types';

/**
 * Seasons that matter to an Iloilo design studio and its clients. A season has
 * a window each year: content about it only makes sense inside that window
 * (a Halloween post in December, an intramurals shirt in January).
 * Exact festival dates follow their rules (Dinagyang: 4th Sunday of January).
 */
export interface Season {
  id: string;
  name: string;
  /** Words in a post's title or brief that tie it to this season. */
  match: RegExp;
  window: (year: number) => { start: string; end: string };
  services: ServiceKey[];
  idea: string;
}

export const SEASONS: Season[] = [
  {
    id: 'dinagyang',
    name: 'Dinagyang (Iloilo)',
    match: /dinagyang|kasadyahan/i,
    window: (y) => ({ start: isoOf(y, 1, 2), end: nthWeekdayOfMonth(y, 1, 0, 4) }),
    services: ['merch', 'stickers', 'illustration'],
    idea: 'Festival pride merch, sticker packs and mascot concepts; Iloilo businesses want festive posts.',
  },
  {
    id: 'cny',
    name: 'Chinese New Year',
    match: /chinese new year|lunar new year|kung hei/i,
    window: (y) => ({ start: isoOf(y, 1, 20), end: isoOf(y, 2, 10) }),
    services: ['illustration', 'packaging'],
    idea: 'Red-and-gold packaging refreshes and greeting artwork for Chinese-Filipino businesses.',
  },
  {
    id: 'valentines',
    name: 'Valentine’s season',
    match: /valentine|hearts? day/i,
    window: (y) => ({ start: isoOf(y, 1, 25), end: isoOf(y, 2, 14) }),
    services: ['stickers', 'illustration', 'packaging'],
    idea: 'Couple sticker sets, custom portraits, gift packaging for small food and flower shops.',
  },
  {
    id: 'graduation',
    name: 'Graduation and batch shirts',
    match: /graduat|moving up|batch (shirt|tee)/i,
    window: (y) => ({ start: isoOf(y, 2, 1), end: isoOf(y, 4, 30) }),
    services: ['merch', 'illustration'],
    idea: 'Batch shirts, class logos and grad tokens; reach class officers before they order.',
  },
  {
    id: 'summer',
    name: 'Summer',
    match: /summer/i,
    window: (y) => ({ start: isoOf(y, 3, 25), end: isoOf(y, 5, 31) }),
    services: ['branding', 'packaging', 'merch'],
    idea: 'Resort and café rebrands, summer menu boards, outing shirts.',
  },
  {
    id: 'school',
    name: 'Back to school',
    match: /back.to.school|school year|enrol+ment|org merch/i,
    window: (y) => ({ start: isoOf(y, 5, 15), end: isoOf(y, 7, 15) }),
    services: ['merch', 'stickers', 'branding'],
    idea: 'Student org logos, org shirts and lanyards (ID laces), sticker packs for new semesters.',
  },
  {
    id: 'intrams',
    name: 'Intramurals and foundation days',
    match: /intram|sports ?fest|foundation day|team shirt/i,
    window: (y) => ({ start: isoOf(y, 8, 1), end: isoOf(y, 10, 31) }),
    services: ['merch', 'branding'],
    idea: 'Team shirts and sports-fest identities; DM-for-quote posts aimed at org officers.',
  },
  {
    id: 'charter',
    name: 'Iloilo City Charter Day',
    match: /charter day/i,
    window: (y) => ({ start: isoOf(y, 8, 10), end: isoOf(y, 8, 25) }),
    services: ['illustration'],
    idea: 'Local-pride illustration and “made in Iloilo” posts.',
  },
  {
    id: 'masskara',
    name: 'MassKara (Bacolod)',
    match: /masskara/i,
    window: (y) => ({ start: isoOf(y, 10, 1), end: nthWeekdayOfMonth(y, 10, 0, 4) }),
    services: ['illustration', 'merch'],
    idea: 'Mask-inspired illustration and festival merch for Negros clients.',
  },
  {
    id: 'halloween',
    name: 'Halloween and Undas',
    match: /halloween|undas|spooky|horror|aswang|tikbalang|kapre|mythical/i,
    window: (y) => ({ start: isoOf(y, 10, 15), end: isoOf(y, 11, 2) }),
    services: ['illustration'],
    idea: 'Filipino mythical creatures as cute mascots; spooky-season humor.',
  },
  {
    id: 'christmas',
    name: 'Christmas (Paskua) and giveaways',
    match: /christmas|paskua|pasko|holiday|noche|simbang|giveaway|12\.12/i,
    window: (y) => ({ start: isoOf(y, 10, 15), end: isoOf(y, 12, 20) }),
    services: ['merch', 'packaging', 'stickers', 'motion'],
    idea: 'Corporate giveaways, holiday merch, gift packaging and animated greetings. Orders need lead time: post early November.',
  },
  {
    id: 'yearend',
    name: 'Year-end recap',
    match: /year.?end|year.in.review|recap|highlights|wrapped/i,
    window: (y) => ({ start: isoOf(y, 11, 20), end: isoOf(y, 12, 31) }),
    services: ['motion'],
    idea: 'Year-in-review reels and “thank you, clients” posts; book next year’s rebrands.',
  },
  {
    id: 'newyear',
    name: 'New Year',
    match: /new year|bagong taon/i,
    window: (y) => ({ start: isoOf(y, 12, 26), end: isoOf(y + 1, 1, 10) }),
    services: ['branding', 'web'],
    idea: '“New year, new brand” rebrand and website offers.',
  },
];

/** The season a post belongs to, judged from its title and brief. */
export function seasonOfText(text: string): Season | null {
  for (const s of SEASONS) if (s.match.test(text)) return s;
  return null;
}

/** The first window of this season that hasn't ended by `fromIso` (this year's or next year's). */
export function nextWindow(season: Season, fromIso: string): { start: string; end: string } {
  const y = Number(fromIso.slice(0, 4));
  for (const year of [y - 1, y, y + 1]) {
    const w = season.window(year);
    if (w.end >= fromIso) return w;
  }
  return season.window(y + 1);
}

export interface NotableDate {
  date: string;
  name: string;
  kind: 'holiday' | 'festival' | 'shopping' | 'payday' | 'culture';
  idea: string;
}

/**
 * Fixed dates for 2026–2027. Philippine holidays per Proclamation No. 1006 (2026) and No. 1427 (2027).
 * Shopping double-days and paydays repeat every year.
 */
const FIXED: NotableDate[] = [
  { date: '2026-10-31', name: 'Halloween', kind: 'culture', idea: 'Spooky-season humor; mythical-creature mascots.' },
  { date: '2026-11-01', name: 'All Saints’ Day (Undas)', kind: 'holiday', idea: 'Keep it respectful; a quiet day for posting.' },
  { date: '2026-11-02', name: 'All Souls’ Day (Undas)', kind: 'holiday', idea: 'End of the Undas long weekend; people are at cemeteries or travelling. Skip posting.' },
  { date: '2026-11-30', name: 'Bonifacio Day', kind: 'holiday', idea: '' },
  { date: '2026-12-08', name: 'Feast of the Immaculate Conception', kind: 'holiday', idea: '' },
  { date: '2026-12-24', name: 'Christmas Eve', kind: 'holiday', idea: 'Animated greeting for clients.' },
  { date: '2026-12-25', name: 'Christmas Day', kind: 'holiday', idea: '' },
  { date: '2026-12-30', name: 'Rizal Day', kind: 'holiday', idea: '' },
  { date: '2026-12-31', name: 'New Year’s Eve', kind: 'holiday', idea: 'Year-in-review reel.' },
  { date: '2027-01-01', name: 'New Year’s Day', kind: 'holiday', idea: '“New year, new brand” offer.' },
  { date: '2027-01-23', name: 'Kasadyahan (Dinagyang)', kind: 'festival', idea: '' },
  { date: '2027-01-24', name: 'Dinagyang Festival', kind: 'festival', idea: 'Festival pride drop; mascot WHAT IF.' },
  { date: '2027-02-06', name: 'Chinese New Year', kind: 'culture', idea: '' },
  { date: '2027-02-14', name: 'Valentine’s Day', kind: 'culture', idea: 'Couple stickers and custom portraits.' },
  { date: '2027-03-25', name: 'Maundy Thursday', kind: 'holiday', idea: 'Pause promotional posts over Holy Week.' },
  { date: '2027-03-26', name: 'Good Friday', kind: 'holiday', idea: '' },
  { date: '2027-04-09', name: 'Araw ng Kagitingan', kind: 'holiday', idea: '' },
  { date: '2027-05-01', name: 'Labor Day', kind: 'holiday', idea: '' },
  { date: '2027-06-12', name: 'Independence Day', kind: 'holiday', idea: 'Local-pride typography.' },
  { date: '2027-08-21', name: 'Ninoy Aquino Day', kind: 'holiday', idea: '' },
  { date: '2027-08-25', name: 'Iloilo City Charter Day', kind: 'festival', idea: 'Made-in-Iloilo feature.' },
  { date: '2027-08-30', name: 'National Heroes Day', kind: 'holiday', idea: '' },
  { date: '2027-10-31', name: 'Halloween', kind: 'culture', idea: '' },
  { date: '2027-11-01', name: 'All Saints’ Day (Undas)', kind: 'holiday', idea: '' },
  { date: '2027-11-30', name: 'Bonifacio Day', kind: 'holiday', idea: '' },
  { date: '2027-12-08', name: 'Feast of the Immaculate Conception', kind: 'holiday', idea: '' },
  { date: '2027-12-25', name: 'Christmas Day', kind: 'holiday', idea: '' },
  { date: '2027-12-30', name: 'Rizal Day', kind: 'holiday', idea: '' },
  { date: '2027-12-31', name: 'New Year’s Eve', kind: 'holiday', idea: '' },
];

function repeating(year: number): NotableDate[] {
  const out: NotableDate[] = [];
  for (const m of [9, 10, 11, 12]) out.push({ date: isoOf(year, m, m), name: `${m}.${m} sale`, kind: 'shopping', idea: 'Shoppers are browsing: run a limited bundle or a free-shipping merch drop.' });
  for (let m = 1; m <= 12; m++) {
    const last = new Date(year, m, 0).getDate();
    out.push({ date: isoOf(year, m, 15), name: 'Payday', kind: 'payday', idea: 'Post offers the evening before and on payday.' });
    out.push({ date: isoOf(year, m, Math.min(30, last)), name: 'Payday', kind: 'payday', idea: 'Post offers the evening before and on payday.' });
  }
  return out;
}

const HOLIDAYS = new Set(FIXED.filter((d) => d.kind === 'holiday').map((d) => d.date));

/** Philippine regular and special non-working days (2026–2027), when the team is off. */
export const isHoliday = (iso: string): boolean => HOLIDAYS.has(iso);

export const holidayName = (iso: string): string | null => FIXED.find((d) => d.date === iso && d.kind === 'holiday')?.name ?? null;

/** Notable dates from `fromIso` for the next `days` days, soonest first. Paydays are left out unless asked. */
export function upcomingDates(fromIso: string, days = 60, opts: { paydays?: boolean } = {}): NotableDate[] {
  const end = addDays(fromIso, days);
  const y = Number(fromIso.slice(0, 4));
  const all = [...FIXED, ...repeating(y), ...repeating(y + 1)].filter((d) => d.date >= fromIso && d.date <= end && (opts.paydays || d.kind !== 'payday'));
  const seen = new Set<string>();
  return all
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((d) => {
      const k = `${d.date}|${d.name}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}
