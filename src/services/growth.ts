import { alive, db } from '../db/db';
import { audit, create, currentActor, patch, remove, save } from '../db/write';
import { parseTrendFeed, type FeedReport } from '../domain/trendFeed';
import { todayISO } from '../lib/time';
import type { Hook, Metric, Trend, TrendItem, TrendReport } from '../db/types';

// ----- trends -----

export async function saveTrend(t: Partial<Trend> & { title: string }): Promise<Trend> {
  if (t.id) {
    const prev = await db.trends.get(t.id);
    if (prev) return save(db.trends, { ...prev, ...t } as Trend);
  }
  return create<Trend>(db.trends, {
    kind: t.kind ?? 'trend',
    title: t.title,
    platform: t.platform ?? 'any',
    url: t.url ?? '',
    creator: t.creator ?? '',
    whyItWorks: t.whyItWorks ?? '',
    howWeUseIt: t.howWeUseIt ?? '',
    hook: t.hook ?? '',
    views: t.views ?? null,
    creatorAvgViews: t.creatorAvgViews ?? null,
    status: t.status ?? 'watching',
    expiresOn: t.expiresOn ?? null,
    savedBy: t.savedBy ?? currentActor(),
    source: t.source ?? 'manual',
    tags: t.tags ?? [],
  });
}

export async function deleteTrend(id: string): Promise<void> {
  await remove(db.trends, id);
}

/** Save a trend from a weekly report to the team's board. */
export async function saveTrendItem(item: TrendItem, source: Trend['source']): Promise<Trend> {
  return saveTrend({
    kind: /sound|audio/i.test(item.kind) ? 'sound' : /format/i.test(item.kind) ? 'format' : 'trend',
    title: item.title,
    platform: item.platform,
    url: item.sources[0]?.url ?? '',
    whyItWorks: [item.what, item.why].filter(Boolean).join('\n\n'),
    howWeUseIt: item.howJoshWorks,
    expiresOn: item.expires,
    source,
    status: 'watching',
  });
}

/** Mark trends whose expiry date has passed. */
export async function expireTrends(today = todayISO()): Promise<number> {
  const stale = alive(await db.trends.toArray()).filter((t) => t.expiresOn && t.expiresOn < today && (t.status === 'watching' || t.status === 'trying'));
  for (const t of stale) await patch(db.trends, t.id, { status: 'expired' });
  return stale.length;
}

// ----- weekly reports -----

/** Store a report; one per week and source (a newer one replaces it). */
export async function storeReport(r: FeedReport): Promise<TrendReport> {
  const id = `${r.source}:${r.weekOf}`;
  const prev = await db.reports.get(id);
  if (prev && prev.deleted !== 1 && prev.generatedAt >= r.generatedAt) return prev;
  const rec: TrendReport = { ...(prev ?? { createdAt: Date.now() }), ...r, id, updatedAt: Date.now(), deleted: 0 } as TrendReport;
  await save(db.reports, rec);
  if (!prev) await audit('trends', 'report', id, `New weekly trend report for the week of ${r.weekOf}`);
  return rec;
}

/** Fetch the report the weekly Claude routine publishes with the app. */
export async function fetchFeed(): Promise<TrendReport | null> {
  try {
    const res = await fetch(`./trends/latest.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const parsed = parseTrendFeed(await res.json(), 'feed');
    return parsed ? storeReport(parsed) : null;
  } catch {
    return null;
  }
}

// ----- hooks -----

export async function saveHook(h: Partial<Hook> & { text: string }): Promise<Hook> {
  if (h.id) {
    const prev = await db.hooks.get(h.id);
    if (prev) return save(db.hooks, { ...prev, ...h } as Hook);
  }
  return create<Hook>(db.hooks, {
    text: h.text,
    pattern: h.pattern ?? '',
    sourceUrl: h.sourceUrl ?? '',
    whyItWorks: h.whyItWorks ?? '',
    rewrite: h.rewrite ?? '',
    memberId: h.memberId ?? currentActor(),
    practiceDate: h.practiceDate ?? null,
    tags: h.tags ?? [],
  });
}

export async function deleteHook(id: string): Promise<void> {
  await remove(db.hooks, id);
}

// ----- results -----

export function blankMetric(fields: Partial<Metric> = {}): Omit<Metric, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    postId: null,
    clientId: null,
    date: todayISO(),
    title: '',
    series: '',
    format: '',
    memberIds: [],
    designerText: '',
    platform: 'facebook',
    views: null,
    reach: null,
    likes: null,
    comments: null,
    saves: null,
    shares: null,
    follows: null,
    clicks: null,
    leads: null,
    notes: '',
    ...fields,
  };
}

export async function saveMetric(m: Partial<Metric> & { platform: Metric['platform'] }): Promise<Metric> {
  if (m.id) {
    const prev = await db.metrics.get(m.id);
    if (prev) return save(db.metrics, { ...prev, ...m } as Metric);
  }
  const rec = await create<Metric>(db.metrics, blankMetric(m));
  await audit('results', 'metric', rec.id, `Logged results for “${rec.title || 'a post'}” on ${rec.platform}`);
  return rec;
}

export async function deleteMetric(id: string): Promise<void> {
  await remove(db.metrics, id);
}
