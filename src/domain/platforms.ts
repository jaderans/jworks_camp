import type { PlatformKey } from '../db/types';

/**
 * What each platform allows and where to post. Limits and habits as of 2026:
 * Instagram caps feed posts and Reels at 5 hashtags (Dec 2025; caption and
 * first comment count together), Threads allows one topic tag, TikTok captions
 * run to 4,000 characters. Best times are Philippine time from 2026 studies;
 * your own Results page beats them once you have a few weeks of numbers.
 */
export interface PlatformInfo {
  key: PlatformKey;
  label: string;
  short: string;
  /** Hard caption limit (characters). */
  maxChars: number;
  /** Characters shown before "…more". */
  previewChars: number;
  /** Most hashtags the platform accepts (hard) or that still help (soft). */
  maxHashtags: number;
  hashtagRule: 'hard' | 'soft';
  /** Clickable links in captions? */
  linksWork: boolean;
  bestTime: string;
  bestTimeNote: string;
  /** Where to open the composer (text is pre-filled where the platform supports it). */
  composer: (text: string) => string;
  composerLabel: string;
  /** Matches post links from this platform. */
  host: RegExp;
}

const enc = encodeURIComponent;

export const PLATFORMS: Record<PlatformKey, PlatformInfo> = {
  facebook: {
    key: 'facebook',
    label: 'Facebook',
    short: 'FB',
    maxChars: 63_206,
    previewChars: 125,
    maxHashtags: 3,
    hashtagRule: 'soft',
    linksWork: true,
    bestTime: '19:00',
    bestTimeNote: '6–8 PM PHT; lunch break is a second peak.',
    composer: () => 'https://business.facebook.com/latest/composer',
    composerLabel: 'Meta Business Suite',
    host: /(^|\.)(facebook\.com|fb\.com|fb\.watch)$/i,
  },
  instagram: {
    key: 'instagram',
    label: 'Instagram',
    short: 'IG',
    maxChars: 2_200,
    previewChars: 125,
    maxHashtags: 5,
    hashtagRule: 'hard',
    linksWork: false,
    bestTime: '21:00',
    bestTimeNote: '8–10 PM PHT. Watch time, likes and sends (DM shares) rank posts.',
    composer: () => 'https://business.facebook.com/latest/composer',
    composerLabel: 'Meta Business Suite',
    host: /(^|\.)(instagram\.com|instagr\.am)$/i,
  },
  tiktok: {
    key: 'tiktok',
    label: 'TikTok',
    short: 'TT',
    maxChars: 4_000,
    previewChars: 100,
    maxHashtags: 5,
    hashtagRule: 'soft',
    linksWork: false,
    bestTime: '18:00',
    bestTimeNote: 'Evenings (5–7 PM) and weekend late mornings. Say the topic out loud and on screen: TikTok search reads captions and text overlays.',
    composer: () => 'https://www.tiktok.com/tiktokstudio/upload',
    composerLabel: 'TikTok Studio',
    host: /(^|\.)(tiktok\.com)$/i,
  },
  threads: {
    key: 'threads',
    label: 'Threads',
    short: 'TH',
    maxChars: 500,
    previewChars: 500,
    maxHashtags: 1,
    hashtagRule: 'hard',
    linksWork: true,
    bestTime: '20:00',
    bestTimeNote: 'Evenings. One topic tag per post.',
    composer: (t) => `https://www.threads.com/intent/post?text=${enc(t)}`,
    composerLabel: 'Threads',
    host: /(^|\.)(threads\.net|threads\.com)$/i,
  },
  x: {
    key: 'x',
    label: 'X',
    short: 'X',
    maxChars: 280,
    previewChars: 280,
    maxHashtags: 2,
    hashtagRule: 'soft',
    linksWork: true,
    bestTime: '12:00',
    bestTimeNote: 'Late morning to lunch.',
    composer: (t) => `https://x.com/intent/post?text=${enc(t)}`,
    composerLabel: 'X',
    host: /(^|\.)(x\.com|twitter\.com)$/i,
  },
  youtube: {
    key: 'youtube',
    label: 'YouTube Shorts',
    short: 'YT',
    maxChars: 5_000,
    previewChars: 100,
    maxHashtags: 3,
    hashtagRule: 'soft',
    linksWork: true,
    bestTime: '18:00',
    bestTimeNote: 'Evenings. The title (max 100 characters) matters most.',
    composer: () => 'https://studio.youtube.com/',
    composerLabel: 'YouTube Studio',
    host: /(^|\.)(youtube\.com|youtu\.be)$/i,
  },
  linkedin: {
    key: 'linkedin',
    label: 'LinkedIn',
    short: 'IN',
    maxChars: 3_000,
    previewChars: 210,
    maxHashtags: 3,
    hashtagRule: 'soft',
    linksWork: true,
    bestTime: '08:00',
    bestTimeNote: 'Weekday mornings. Good for corporate and school clients.',
    composer: (t) => `https://www.linkedin.com/feed/?shareActive=true&text=${enc(t)}`,
    composerLabel: 'LinkedIn',
    host: /(^|\.)(linkedin\.com|lnkd\.in)$/i,
  },
  reddit: {
    key: 'reddit',
    label: 'Reddit',
    short: 'RD',
    maxChars: 40_000,
    previewChars: 300,
    maxHashtags: 0,
    hashtagRule: 'hard',
    linksWork: true,
    bestTime: '21:00',
    bestTimeNote: 'Follow each subreddit’s rules; most ban self-promotion. Lead with value.',
    composer: (t) => `https://www.reddit.com/submit?title=${enc(t.split('\n')[0].slice(0, 300))}`,
    composerLabel: 'Reddit',
    host: /(^|\.)(reddit\.com|redd\.it)$/i,
  },
  pinterest: {
    key: 'pinterest',
    label: 'Pinterest',
    short: 'PN',
    maxChars: 500,
    previewChars: 100,
    maxHashtags: 0,
    hashtagRule: 'soft',
    linksWork: true,
    bestTime: '20:00',
    bestTimeNote: 'Evenings and weekends. Keywords beat hashtags.',
    composer: () => 'https://www.pinterest.com/pin-creation-tool/',
    composerLabel: 'Pinterest',
    host: /(^|\.)(pinterest\.com|pin\.it)$/i,
  },
};

export const PLATFORM_ORDER: PlatformKey[] = ['facebook', 'instagram', 'tiktok', 'threads', 'x', 'youtube', 'linkedin', 'reddit', 'pinterest'];

/** The platforms JoshWorks' planner tracks. */
export const DEFAULT_PLATFORMS: PlatformKey[] = ['facebook', 'instagram', 'tiktok', 'reddit', 'x'];

export const platformLabel = (k: PlatformKey | 'any'): string => (k === 'any' ? 'Any platform' : PLATFORMS[k]?.label ?? k);

/** Which platform a link belongs to, if any. */
export function platformOfUrl(url: string): PlatformKey | null {
  try {
    const host = new URL(url.trim()).hostname;
    for (const k of PLATFORM_ORDER) if (PLATFORMS[k].host.test(host)) return k;
  } catch {
    /* not a URL */
  }
  return null;
}

export const FORMATS = ['Carousel', 'Reel', 'Single image', 'Story', 'Video', 'Live', 'Text post', 'Poll', 'Reel + Carousel'] as const;
