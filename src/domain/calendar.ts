import { addDays, daysFrom, fmtIsoDate, isoOf, lastMondayOfMonth, mondayOf, weekdayOf } from '../lib/time';
import { holidayName, isHoliday, nextWindow, seasonOfText } from './seasons';
import type { CadenceSettings, Idea, Member, PostStatus, ThemeDef } from '../db/types';

/**
 * The posting rhythm from the JoshWorks content planner: four themed days a
 * week (Wednesday is a flex slot), and one break week a month — the week that
 * starts on the month's last Monday — for batching, DMs and reposting winners.
 */
export const DEFAULT_THEMES: ThemeDef[] = [
  {
    key: 'mon-edu',
    dow: 1,
    name: 'Educational',
    short: 'Edu',
    description: 'Teach the audience: logos, colour, type, print, motion. Builds authority, saves and shares.',
    flex: false,
    active: true,
  },
  {
    key: 'tue-portfolio',
    dow: 2,
    name: 'Portfolio Tuesday',
    short: 'Portfolio',
    description: 'One client project or concept: the work and the thinking behind it. Builds trust and sales.',
    flex: false,
    active: true,
  },
  {
    key: 'wed-flex',
    dow: 3,
    name: 'Flex',
    short: 'Flex',
    description: 'Open on purpose. Use only when needed: urgent client posts, announcements, reposting a top performer, a Concept Drop teaser.',
    flex: true,
    active: true,
  },
  {
    key: 'thu-designer',
    dow: 4,
    name: 'Designer Expertise',
    short: 'Designer',
    description: 'Spotlight one designer and how they work. Promotes the team and humanizes the studio.',
    flex: false,
    active: true,
  },
  {
    key: 'fri-behind',
    dow: 5,
    name: 'Behind JoshWorks',
    short: 'Behind',
    description: 'Rotates BTS/Process → Freebie → Client Love → Fun. Reach, leads, social proof and personality.',
    flex: false,
    active: true,
  },
];

export const DEFAULT_FRIDAY_ROTATION = ['BTS / Process', 'Freebie Friday', 'Client Love', 'Fun / Engagement'];

export const DEFAULT_CADENCE: CadenceSettings = {
  themes: DEFAULT_THEMES,
  fridayRotation: DEFAULT_FRIDAY_ROTATION,
  breakRule: true,
  skipHolidays: true,
  breaks: [],
  resumeOn: '',
  defaultTimes: { facebook: '19:00', instagram: '21:00', tiktok: '18:00', threads: '20:00', x: '12:00', youtube: '18:00', linkedin: '08:00', reddit: '21:00' },
  platforms: ['facebook', 'instagram', 'tiktok'],
};

export const STATUS_LABEL: Record<PostStatus, string> = {
  idea: 'Idea',
  todo: 'To do',
  doing: 'In progress',
  review: 'For review',
  ready: 'Ready',
  scheduled: 'Scheduled',
  posted: 'Posted',
  skipped: 'Skipped',
};

export const STATUS_ORDER: PostStatus[] = ['idea', 'todo', 'doing', 'review', 'ready', 'scheduled', 'posted', 'skipped'];

/** Board columns (Skipped stays off the board). */
export const BOARD_COLUMNS: PostStatus[] = ['idea', 'todo', 'doing', 'review', 'ready', 'scheduled', 'posted'];

export const isDone = (s: PostStatus) => s === 'posted' || s === 'skipped';

export function themeByKey(cadence: CadenceSettings, key: string): ThemeDef | undefined {
  return cadence.themes.find((t) => t.key === key);
}

/** The active theme for a day of the week. */
export function themeForDate(cadence: CadenceSettings, iso: string): ThemeDef | undefined {
  const dow = weekdayOf(iso);
  return cadence.themes.find((t) => t.active && t.dow === dow);
}

/** Is this day inside a break week (rule or an explicit range)? */
export function isBreak(cadence: CadenceSettings, iso: string): boolean {
  if (cadence.breaks.some((b) => b.start <= iso && iso <= b.end)) return true;
  if (!cadence.breakRule) return false;
  const mon = mondayOf(iso);
  const [y, m] = mon.split('-').map(Number);
  return lastMondayOfMonth(y, m) === mon;
}

export interface WeekInfo {
  monday: string;
  isBreak: boolean;
  /** 1-based count of working weeks in the Monday's month; 0 for a break week. */
  number: number;
  label: string;
  /** This week's Friday focus from the rotation. */
  friday: string;
}

export function weekInfo(cadence: CadenceSettings, iso: string): WeekInfo {
  const monday = mondayOf(iso);
  const brk = isBreak(cadence, monday);
  const [y, m] = monday.split('-').map(Number);
  let n = 0;
  for (let d = Number(monday.slice(8)); d > 0; d -= 7) {
    const mon = isoOf(y, m, d);
    if (!isBreak(cadence, mon)) n++;
  }
  const rotation = cadence.fridayRotation.length ? cadence.fridayRotation : DEFAULT_FRIDAY_ROTATION;
  return {
    monday,
    isBreak: brk,
    number: brk ? 0 : n,
    label: brk ? 'Break week' : `Week ${n}`,
    friday: brk ? '' : rotation[(Math.max(1, n) - 1) % rotation.length],
  };
}

export interface Slot {
  date: string;
  dow: number;
  themeKey: string;
  flex: boolean;
}

/** Themed posting days from `from` to `to` (inclusive), skipping break weeks and (if set) public holidays. */
export function themedSlots(cadence: CadenceSettings, from: string, to: string, opts: { includeFlex?: boolean } = {}): Slot[] {
  const out: Slot[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (isBreak(cadence, d)) continue;
    if (cadence.skipHolidays !== false && isHoliday(d)) continue;
    const t = themeForDate(cadence, d);
    if (!t || (t.flex && !opts.includeFlex)) continue;
    out.push({ date: d, dow: t.dow, themeKey: t.key, flex: t.flex });
  }
  return out;
}

/** The day posting actually resumes: the restart date, or the next posting day when that one is a holiday or in a break week. */
export function restartDay(cadence: CadenceSettings): string {
  if (!cadence.resumeOn) return '';
  return themedSlots(cadence, cadence.resumeOn, addDays(cadence.resumeOn, 60), { includeFlex: true })[0]?.date ?? cadence.resumeOn;
}

/** The first posting day on or after `from` with nothing planned (flex days count), or null within `maxDays`. */
export function firstFreeDay(cadence: CadenceSettings, from: string, taken: ReadonlySet<string>, maxDays = 90): string | null {
  return themedSlots(cadence, from, addDays(from, maxDays), { includeFlex: true }).find((s) => !taken.has(s.date))?.date ?? null;
}

/**
 * Move planned posts off days that already have a post. In date order, each
 * feed post takes the first free posting day on or after its date (and after
 * the post before it), so a campaign keeps its sequence. A story never needs
 * its own day: it sits beside a feed post.
 */
export function spreadToFreeDays<T extends { date: string; include: boolean; format: string }>(rows: readonly T[], taken: ReadonlySet<string>, cadence: CadenceSettings): T[] {
  const used = new Set(taken);
  const out = [...rows];
  const order = rows
    .map((_, i) => i)
    .filter((i) => rows[i].include)
    .sort((a, b) => rows[a].date.localeCompare(rows[b].date) || a - b);
  let floor = '';
  for (const i of order) {
    const r = rows[i];
    const story = r.format === 'Story';
    let date = r.date > floor ? r.date : floor;
    if (!story && used.has(date)) date = firstFreeDay(cadence, date, used) ?? date;
    if (!story) used.add(date);
    floor = date;
    if (date !== r.date) out[i] = { ...r, date };
  }
  return out;
}

// ----- rescheduling a backlog -----

export interface ReschedulePost {
  id: string;
  /** The date it was planned for (used for order, weekday and season). */
  date: string | null;
  themeKey: string;
  title: string;
  brief: string;
  sort: number;
}

export interface Placement {
  id: string;
  date: string;
  note: string;
}

export interface RescheduleResult {
  placed: Placement[];
  unplaced: { id: string; reason: string }[];
}

/**
 * Give a backlog new dates from `start`:
 * - each original week moves as a block to the next working week, every post
 *   on its own weekday (so a themed week like "Shirt Week" stays together);
 * - break weeks, public holidays and days that already have a post are skipped,
 *   and the Wednesday flex slot stays open, unless a holiday falls on a post's
 *   day: then it takes that week's flex day (so a week keeps its four posts);
 * - seasonal posts stay inside their season (Paskua in Nov–Dec, Dinagyang in
 *   January), on their weekday; one whose season is over is left for you;
 * - a post whose day is taken by a seasonal post fills the next gap on its
 *   weekday, so weeks never go above the usual four posts;
 * - posts that shared a day keep sharing their new day.
 */
export function reschedule(posts: ReschedulePost[], start: string, cadence: CadenceSettings, opts: { busy?: ReadonlySet<string>; weeks?: number } = {}): RescheduleResult {
  const ordered = [...posts].sort((a, b) => (a.date ?? '9999-12-31').localeCompare(b.date ?? '9999-12-31') || a.sort - b.sort);
  // Companions: later posts on the same original day follow the first one.
  const leads: ReschedulePost[] = [];
  const companions = new Map<string, ReschedulePost[]>();
  const leadOfDate = new Map<string, ReschedulePost>();
  for (const p of ordered) {
    const lead = p.date ? leadOfDate.get(p.date) : undefined;
    if (lead) companions.set(lead.id, [...(companions.get(lead.id) ?? []), p]);
    else {
      leads.push(p);
      if (p.date) leadOfDate.set(p.date, p);
    }
  }

  const weeks = opts.weeks ?? Math.max(30, Math.ceil(leads.length / 2) + 26);
  const slots = themedSlots(cadence, start, addDays(start, weeks * 7), { includeFlex: true }).filter((s) => !opts.busy?.has(s.date));
  const taken = new Set<string>();
  const placed: Placement[] = [];
  const unplaced: { id: string; reason: string }[] = [];

  const dowOf = (p: ReschedulePost): number | null => {
    const t = themeByKey(cadence, p.themeKey);
    if (t) return t.dow;
    return p.date ? weekdayOf(p.date) : null;
  };
  const free = (s: Slot) => !taken.has(s.date);
  const take = (p: ReschedulePost, s: Slot, note: string) => {
    taken.add(s.date);
    placed.push({ id: p.id, date: s.date, note });
    for (const c of companions.get(p.id) ?? []) placed.push({ id: c.id, date: s.date, note: 'Same day as the post it was paired with' });
  };

  // 1. Seasonal posts first, so evergreen posts flow around them.
  const evergreen: ReschedulePost[] = [];
  for (const p of leads) {
    const season = seasonOfText(`${p.title} ${p.brief}`);
    if (!season) {
      evergreen.push(p);
      continue;
    }
    const w = nextWindow(season, start);
    const lo = w.start > start ? w.start : start;
    if (daysFrom(start, w.start) > 120) {
      unplaced.push({ id: p.id, reason: `${season.name} season is over for now; it comes back ${fmtIsoDate(w.start)}.` });
      continue;
    }
    const dow = dowOf(p);
    const candidates = slots.filter((s) => free(s) && s.date >= lo && s.date <= w.end && (dow === null || s.dow === dow));
    if (!candidates.length) {
      unplaced.push({ id: p.id, reason: `${season.name} season ends ${fmtIsoDate(w.end)}; no free ${dow === null ? '' : 'matching '}day left in it.` });
      continue;
    }
    // Aim for the same calendar day as planned when it falls in this season, else the middle of the window.
    const shifted = p.date ? `${w.start.slice(0, 4)}${p.date.slice(4)}` : null;
    const shiftedNext = p.date ? `${w.end.slice(0, 4)}${p.date.slice(4)}` : null;
    const inWindow = (d: string | null) => !!d && d >= lo && d <= w.end;
    const mid = addDays(lo, Math.floor(daysFrom(lo, w.end) / 2));
    const target = inWindow(shifted) ? (shifted as string) : inWindow(shiftedNext) ? (shiftedNext as string) : mid;
    const after = candidates.find((s) => s.date >= target);
    const best = after ?? candidates[candidates.length - 1];
    take(p, best, `Kept in ${season.name} season`);
  }

  // 2. Everything else, week by week in the original order, each post on its weekday.
  const weekKeys: string[] = [];
  const weekSlots = new Map<string, Slot[]>();
  for (const s of slots) {
    const k = mondayOf(s.date);
    if (!weekSlots.has(k)) {
      weekSlots.set(k, []);
      weekKeys.push(k);
    }
    weekSlots.get(k)!.push(s);
  }
  const groups: ReschedulePost[][] = [];
  const loose: ReschedulePost[] = [];
  let groupKey = '';
  for (const p of evergreen) {
    if (!p.date) {
      loose.push(p);
      continue;
    }
    const k = mondayOf(p.date);
    if (k !== groupKey) {
      groups.push([]);
      groupKey = k;
    }
    groups[groups.length - 1].push(p);
  }
  const bumped: ReschedulePost[] = [];
  let wi = 0;
  for (const g of groups) {
    while (wi < weekKeys.length && !weekSlots.get(weekKeys[wi])!.some((s) => free(s) && !s.flex)) wi++;
    if (wi >= weekKeys.length) {
      bumped.push(...g);
      continue;
    }
    const week = weekSlots.get(weekKeys[wi])!;
    for (const p of g) {
      const dow = dowOf(p);
      const slot = week.find((s) => free(s) && s.dow === dow);
      if (slot) {
        take(p, slot, '');
        continue;
      }
      // A holiday on its day: post it on the week's open flex day instead.
      const holiday = dow === null ? null : holidayName(addDays(weekKeys[wi], dow - 1));
      const flex = holiday && cadence.skipHolidays !== false ? week.find((s) => free(s) && s.flex) : undefined;
      if (flex) take(p, flex, `${holiday} falls on its day, so it moves to the flex day`);
      else bumped.push(p);
    }
    wi++;
  }
  // 3. Posts whose day was taken fill the earliest gap on their weekday; undated ones any themed gap.
  for (const p of [...bumped, ...loose]) {
    const dow = p.date ? dowOf(p) : null;
    const slot = slots.find((s) => free(s) && (dow === null ? !s.flex : s.dow === dow));
    if (slot) take(p, slot, p.date ? 'Moved to the next free day for its theme' : '');
    else unplaced.push({ id: p.id, reason: 'No free day left in the planning window.' });
  }

  placed.sort((a, b) => a.date.localeCompare(b.date));
  return { placed, unplaced };
}

// ----- filling a month from the idea bank -----

/** Which ideas suit which theme. */
export function themeForIdea(idea: Pick<Idea, 'kind' | 'category' | 'format'>): string {
  const c = idea.category.toLowerCase();
  if (idea.kind === 'whatif' || idea.kind === 'concept') return 'tue-portfolio';
  if (c.includes('educ') || c.includes('mon')) return 'mon-edu';
  if (c.includes('fun') || c.includes('engage') || c.includes('fri')) return 'fri-behind';
  if (c.includes('video') || c.includes('reel')) return 'thu-designer';
  if (c.includes('portfolio')) return 'tue-portfolio';
  return 'mon-edu';
}

export interface MonthPlanRow {
  date: string;
  themeKey: string;
  ideaId: string | null;
  title: string;
  format: string;
  assignees: string[];
}

/**
 * Suggest a post for every free themed day in a month: an unused idea that fits
 * the theme, given to whoever the idea is best for and has the fewest posts.
 */
export function planMonth(
  cadence: CadenceSettings,
  month: string,
  opts: { busyDates: ReadonlySet<string>; ideas: Idea[]; members: Member[]; load: Map<string, number> },
): MonthPlanRow[] {
  const [y, m] = month.split('-').map(Number);
  const first = isoOf(y, m, 1);
  const last = isoOf(y, m, new Date(y, m, 0).getDate());
  const slots = themedSlots(cadence, first, last).filter((s) => !opts.busyDates.has(s.date));
  const pool = opts.ideas.filter((i) => i.status === 'idea' && i.deleted !== 1);
  const used = new Set<string>();
  const load = new Map(opts.load);
  const active = opts.members.filter((mb) => mb.active === 1);
  const pickPerson = (prefer: string[]): string[] => {
    const candidates = (prefer.length ? active.filter((mb) => prefer.includes(mb.id)) : active).sort((a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0) || a.name.localeCompare(b.name));
    const who = candidates[0] ?? active.sort((a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0))[0];
    if (!who) return [];
    load.set(who.id, (load.get(who.id) ?? 0) + 1);
    return [who.id];
  };
  return slots.map((s) => {
    const idea = pool.find((i) => !used.has(i.id) && themeForIdea(i) === s.themeKey);
    if (idea) used.add(idea.id);
    const theme = themeByKey(cadence, s.themeKey);
    return {
      date: s.date,
      themeKey: s.themeKey,
      ideaId: idea?.id ?? null,
      title: idea?.title ?? `${theme?.name ?? 'Post'} (topic to pick)`,
      format: idea?.format || (s.themeKey === 'mon-edu' ? 'Carousel' : ''),
      assignees: pickPerson(idea?.bestFor ?? []),
    };
  });
}
