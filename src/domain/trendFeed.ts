import type { PlatformKey, TrendItem, TrendReport } from '../db/types';

/**
 * The weekly trend report as a JSON file (public/trends/latest.json). A
 * scheduled Claude routine rewrites it every Monday; the in-app assistant can
 * write the same shape. Anything malformed is dropped, never trusted.
 */

const PLATFORMS: (PlatformKey | 'any')[] = ['any', 'facebook', 'instagram', 'tiktok', 'threads', 'x', 'youtube', 'linkedin', 'reddit', 'pinterest'];

const str = (v: unknown, max = 2000): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isoOrNull = (v: unknown): string | null => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const safeUrl = (v: unknown): string => {
  const s = str(v, 600);
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : '';
  } catch {
    return '';
  }
};
const sources = (v: unknown): { title: string; url: string }[] =>
  Array.isArray(v)
    ? v
        .map((s) => ({ title: str((s as { title?: unknown })?.title, 200), url: safeUrl((s as { url?: unknown })?.url) }))
        .filter((s) => s.url)
        .slice(0, 8)
    : [];

export type FeedReport = Omit<TrendReport, 'id' | 'createdAt' | 'updatedAt' | 'deleted' | '_sync' | '_dev'>;

export function parseTrendFeed(data: unknown, source: TrendReport['source'] = 'feed'): FeedReport | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const weekOf = isoOrNull(d.weekOf);
  if (!weekOf || !Array.isArray(d.items)) return null;
  const items: TrendItem[] = d.items
    .map((raw, i): TrendItem | null => {
      if (!raw || typeof raw !== 'object') return null;
      const r = raw as Record<string, unknown>;
      const title = str(r.title, 200);
      if (!title) return null;
      const platform = PLATFORMS.includes(r.platform as PlatformKey) ? (r.platform as PlatformKey | 'any') : 'any';
      const idea = r.postIdea && typeof r.postIdea === 'object' ? (r.postIdea as Record<string, unknown>) : null;
      return {
        id: str(r.id, 80) || `${weekOf}-${i}`,
        title,
        platform,
        kind: str(r.kind, 40) || 'trend',
        what: str(r.what),
        why: str(r.why),
        howJoshWorks: str(r.howJoshWorks),
        postIdea: idea && str(idea.title, 200) ? { title: str(idea.title, 200), format: str(idea.format, 40), themeKey: str(idea.themeKey, 40) } : null,
        expires: isoOrNull(r.expires),
        sources: sources(r.sources),
      };
    })
    .filter((x): x is TrendItem => !!x)
    .slice(0, 20);
  const dates = Array.isArray(d.dates)
    ? d.dates
        .map((x) => ({ date: isoOrNull((x as { date?: unknown })?.date), name: str((x as { name?: unknown })?.name, 120), idea: str((x as { idea?: unknown })?.idea, 400) }))
        .filter((x): x is { date: string; name: string; idea: string } => !!x.date && !!x.name)
        .slice(0, 20)
    : [];
  const generatedAt = typeof d.generatedAt === 'string' && !Number.isNaN(Date.parse(d.generatedAt)) ? Date.parse(d.generatedAt) : Date.now();
  return { weekOf, source, generatedAt, summary: str(d.summary, 3000), items, dates, sources: sources(d.sources) };
}
