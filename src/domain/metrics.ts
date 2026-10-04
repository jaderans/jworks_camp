import { mondayOf, weekdayOf } from '../lib/time';
import type { Metric, PlatformKey } from '../db/types';

/**
 * Results maths. Saves predict how valuable a post is, shares (sends) predict
 * reach to new people — Instagram's head called sends one of its biggest
 * ranking signals in 2026 — so both are ranked on their own, not only likes.
 */

export const METRIC_KEYS = ['views', 'reach', 'likes', 'comments', 'saves', 'shares', 'follows', 'clicks', 'leads'] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

export const METRIC_LABEL: Record<MetricKey, string> = {
  views: 'Views',
  reach: 'Reach',
  likes: 'Likes',
  comments: 'Comments',
  saves: 'Saves',
  shares: 'Shares',
  follows: 'Follows',
  clicks: 'Link clicks',
  leads: 'Leads (DMs, inquiries)',
};

const n = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export const engagementOf = (m: Pick<Metric, 'likes' | 'comments' | 'saves' | 'shares'>): number => n(m.likes) + n(m.comments) + n(m.saves) + n(m.shares);

/** Per-reach rates as percentages (null when reach is unknown). */
export function ratesOf(m: Metric): { engagement: number | null; save: number | null; share: number | null } {
  const reach = n(m.reach);
  if (!reach) return { engagement: null, save: null, share: null };
  return { engagement: (engagementOf(m) / reach) * 100, save: (n(m.saves) / reach) * 100, share: (n(m.shares) / reach) * 100 };
}

export interface Totals {
  posts: number;
  views: number;
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  follows: number;
  leads: number;
  engagement: number;
  /** Engagement per reach, % (null without reach). */
  engagementRate: number | null;
}

export function totals(rows: Metric[]): Totals {
  const t = { posts: rows.length, views: 0, reach: 0, likes: 0, comments: 0, saves: 0, shares: 0, follows: 0, leads: 0, engagement: 0 };
  for (const m of rows) {
    t.views += n(m.views);
    t.reach += n(m.reach);
    t.likes += n(m.likes);
    t.comments += n(m.comments);
    t.saves += n(m.saves);
    t.shares += n(m.shares);
    t.follows += n(m.follows);
    t.leads += n(m.leads);
    t.engagement += engagementOf(m);
  }
  return { ...t, engagementRate: t.reach ? (t.engagement / t.reach) * 100 : null };
}

const median = (values: number[]): number => {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export interface Outlier {
  id: string;
  /** How many times the platform's median views. */
  ratio: number;
}

/**
 * Posts that did far better than usual: views at least `factor` × the median
 * for the same platform. Needs a handful of posts to judge against.
 */
export function outliers(rows: Metric[], opts: { factor?: number; minSamples?: number } = {}): Map<string, Outlier> {
  const factor = opts.factor ?? 2;
  const minSamples = opts.minSamples ?? 4;
  const byPlatform = new Map<PlatformKey, Metric[]>();
  for (const m of rows) if (n(m.views) > 0) byPlatform.set(m.platform, [...(byPlatform.get(m.platform) ?? []), m]);
  const out = new Map<string, Outlier>();
  for (const list of byPlatform.values()) {
    if (list.length < minSamples) continue;
    const med = median(list.map((m) => n(m.views)));
    if (!med) continue;
    for (const m of list) {
      const ratio = n(m.views) / med;
      if (ratio >= factor) out.set(m.id, { id: m.id, ratio });
    }
  }
  return out;
}

export interface GroupRow {
  key: string;
  label: string;
  posts: number;
  views: number;
  reach: number;
  saves: number;
  shares: number;
  engagement: number;
  avgViews: number;
  /** Saves per 100 reached. */
  saveRate: number | null;
  shareRate: number | null;
}

/** Roll results up by any key (designer, theme, format, weekday, platform). A row can belong to several groups. */
export function groupBy(rows: Metric[], keysOf: (m: Metric) => string[], labelOf: (key: string) => string = (k) => k): GroupRow[] {
  const map = new Map<string, Metric[]>();
  for (const m of rows) for (const k of keysOf(m)) if (k) map.set(k, [...(map.get(k) ?? []), m]);
  return [...map.entries()]
    .map(([key, list]) => {
      const t = totals(list);
      return {
        key,
        label: labelOf(key),
        posts: list.length,
        views: t.views,
        reach: t.reach,
        saves: t.saves,
        shares: t.shares,
        engagement: t.engagement,
        avgViews: list.length ? t.views / list.length : 0,
        saveRate: t.reach ? (t.saves / t.reach) * 100 : null,
        shareRate: t.reach ? (t.shares / t.reach) * 100 : null,
      };
    })
    .sort((a, b) => b.avgViews - a.avgViews);
}

export const WEEKDAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'];

export const weekdayKey = (m: Metric): string[] => (m.date ? [String(weekdayOf(m.date))] : []);

/** One value per week (Monday dates), oldest first, including empty weeks in between. */
export function weeklySeries(rows: Metric[], key: MetricKey): { week: string; value: number; posts: number }[] {
  const map = new Map<string, { value: number; posts: number }>();
  for (const m of rows) {
    if (!m.date) continue;
    const w = mondayOf(m.date);
    const cur = map.get(w) ?? { value: 0, posts: 0 };
    cur.value += n(m[key]);
    cur.posts += 1;
    map.set(w, cur);
  }
  const weeks = [...map.keys()].sort();
  if (!weeks.length) return [];
  const out: { week: string; value: number; posts: number }[] = [];
  const start = new Date(`${weeks[0]}T00:00:00`);
  const end = new Date(`${weeks[weeks.length - 1]}T00:00:00`);
  for (let d = start; d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({ week: iso, ...(map.get(iso) ?? { value: 0, posts: 0 }) });
  }
  return out;
}

/** "1.2K", "12.9K", "3.4M" */
export function compactNumber(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (a >= 1_000) return `${(v / 1_000).toFixed(a >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return String(Math.round(v));
}
