import { PLATFORMS } from './platforms';
import type { PlatformKey, Post } from '../db/types';

/**
 * Captions: per-platform text, hashtag limits, and the Unicode "bold" headline
 * style JoshWorks already uses (𝗕𝗼𝗹𝗱 sans, 𝙄𝙩𝙖𝙡𝙞𝙘 sans, 𝐒𝐞𝐫𝐢𝐟 bold).
 */

// ----- Unicode styled letters -----

export type TextStyle = 'boldSans' | 'boldItalicSans' | 'boldSerif' | 'italicSans';

const STYLE_BASE: Record<TextStyle, { upper: number; lower: number; digit: number | null }> = {
  boldSans: { upper: 0x1d5d4, lower: 0x1d5ee, digit: 0x1d7ec },
  boldItalicSans: { upper: 0x1d63c, lower: 0x1d656, digit: 0x1d7ec },
  boldSerif: { upper: 0x1d400, lower: 0x1d41a, digit: 0x1d7ce },
  italicSans: { upper: 0x1d608, lower: 0x1d622, digit: null },
};

export const STYLE_LABEL: Record<TextStyle, string> = {
  boldSans: 'Bold',
  boldItalicSans: 'Bold italic',
  boldSerif: 'Serif bold',
  italicSans: 'Italic',
};

/** Turn A–Z, a–z and 0–9 into a styled Unicode version; everything else stays. */
export function styleText(text: string, style: TextStyle): string {
  const base = STYLE_BASE[style];
  let out = '';
  for (const ch of stripStyles(text)) {
    const c = ch.codePointAt(0) as number;
    if (c >= 65 && c <= 90) out += String.fromCodePoint(base.upper + c - 65);
    else if (c >= 97 && c <= 122) out += String.fromCodePoint(base.lower + c - 97);
    else if (c >= 48 && c <= 57 && base.digit !== null) out += String.fromCodePoint(base.digit + c - 48);
    else out += ch;
  }
  return out;
}

const STRIP = new Map<number, string>();
for (const base of Object.values(STYLE_BASE)) {
  for (let i = 0; i < 26; i++) {
    STRIP.set(base.upper + i, String.fromCharCode(65 + i));
    STRIP.set(base.lower + i, String.fromCharCode(97 + i));
  }
  if (base.digit !== null) for (let i = 0; i < 10; i++) STRIP.set(base.digit + i, String.fromCharCode(48 + i));
}

/** Back to plain letters (for search, hashtags and screen readers). */
export function stripStyles(text: string): string {
  let out = '';
  for (const ch of text) {
    const plain = STRIP.get(ch.codePointAt(0) as number);
    out += plain ?? ch;
  }
  return out;
}

export const hasStyledLetters = (text: string): boolean => [...text].some((ch) => STRIP.has(ch.codePointAt(0) as number));

/** Style only the first line (the hook) — the readable way to use it. */
export function styleFirstLine(text: string, style: TextStyle): string {
  const i = text.indexOf('\n');
  return i === -1 ? styleText(text, style) : styleText(text.slice(0, i), style) + text.slice(i);
}

// ----- hashtags -----

const TAG = /#[\p{L}\p{N}_]+/gu;

export const hashtagsOf = (text: string): string[] => text.match(TAG) ?? [];

export function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>();
  return tags.filter((t) => {
    const k = stripStyles(t).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ----- composing a caption for one platform -----

export function captionBody(post: Pick<Post, 'caption' | 'captions'>, platform: PlatformKey): string {
  const own = post.captions?.[platform];
  return (own && own.trim() ? own : post.caption).trim();
}

/**
 * The text to paste: the caption, then the CTA (if it isn't already in it),
 * then hashtags trimmed to what the platform takes.
 */
export function composeCaption(post: Pick<Post, 'caption' | 'captions' | 'cta' | 'hashtags'>, platform: PlatformKey): string {
  const info = PLATFORMS[platform];
  let body = captionBody(post, platform);
  const cta = post.cta.trim();
  if (cta && !body.toLowerCase().includes(cta.toLowerCase())) body = body ? `${body}\n\n${cta}` : cta;
  const already = hashtagsOf(body).length;
  const room = Math.max(0, info.maxHashtags - already);
  const extra = uniqueTags(hashtagsOf(post.hashtags)).filter((t) => !body.toLowerCase().includes(t.toLowerCase())).slice(0, room);
  return extra.length ? `${body}\n\n${extra.join(' ')}` : body;
}

export interface CaptionCheck {
  level: 'bad' | 'warn' | 'good';
  text: string;
}

export function checkCaption(text: string, platform: PlatformKey, opts: { series?: string } = {}): CaptionCheck[] {
  const info = PLATFORMS[platform];
  const out: CaptionCheck[] = [];
  const t = text.trim();
  if (!t) return [{ level: 'warn', text: 'No caption yet.' }];
  const len = [...t].length;
  if (len > info.maxChars) out.push({ level: 'bad', text: `${len.toLocaleString()} characters; ${info.label} allows ${info.maxChars.toLocaleString()}.` });
  const tags = hashtagsOf(t);
  if (tags.length > info.maxHashtags) {
    out.push(
      info.hashtagRule === 'hard'
        ? { level: 'bad', text: info.maxHashtags === 0 ? `${info.label} doesn’t use hashtags; remove them.` : `${tags.length} hashtags; ${info.label} allows ${info.maxHashtags}${platform === 'instagram' ? ' (caption and first comment together). The post won’t go through.' : '.'}` }
        : { level: 'warn', text: `${tags.length} hashtags; ${info.maxHashtags} or fewer work better on ${info.label}.` },
    );
  }
  if (tags.some(hasStyledLetters)) out.push({ level: 'bad', text: 'A hashtag uses styled (bold/italic) letters, so it won’t link. Keep hashtags plain.' });
  const first = t.split('\n')[0];
  if ([...first].length > info.previewChars && info.previewChars < info.maxChars) out.push({ level: 'warn', text: `The first line is cut after about ${info.previewChars} characters. Put the hook first and keep it short.` });
  if (!info.linksWork && /https?:\/\//i.test(t)) out.push({ level: 'warn', text: `Links aren’t clickable in ${info.label} captions. Use a DM keyword or “link in bio”.` });
  const styledCount = [...t].filter((ch) => STRIP.has(ch.codePointAt(0) as number)).length;
  if (styledCount > 120) out.push({ level: 'warn', text: 'Lots of styled letters: screen readers spell them out and search can’t read them. Keep the style to the headline.' });
  if (/what ?if/i.test(opts.series ?? '') && !/unofficial|not affiliated|fan (re)?design|concept only/i.test(t)) {
    out.push({ level: 'bad', text: 'WHAT IF posts need the disclaimer: unofficial concept, not affiliated with or commissioned by the brand.' });
  }
  if (!out.some((c) => c.level !== 'good')) out.push({ level: 'good', text: `Good to go on ${info.label}.` });
  return out;
}

// ----- the planner's "Facebook: … Instagram: …" captions -----

const MARKER = /^\s*(facebook|fb|instagram|ig|tiktok|threads|x|twitter|linkedin|youtube|reddit)\s*:\s*$/i;
const MARKER_KEY: Record<string, PlatformKey> = {
  facebook: 'facebook', fb: 'facebook', instagram: 'instagram', ig: 'instagram', tiktok: 'tiktok', threads: 'threads', x: 'x', twitter: 'x', linkedin: 'linkedin', youtube: 'youtube', reddit: 'reddit',
};

/** Split a caption cell that holds one block per platform. Text before the first marker is the main caption. */
export function splitPlatformCaptions(raw: string): { main: string; perPlatform: Partial<Record<PlatformKey, string>> } {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n');
  const perPlatform: Partial<Record<PlatformKey, string>> = {};
  let current: PlatformKey | null = null;
  const pre: string[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (current) perPlatform[current] = tidy(buf.join('\n'));
    buf = [];
  };
  for (const line of lines) {
    const m = MARKER.exec(line);
    if (m) {
      flush();
      current = MARKER_KEY[m[1].toLowerCase()];
      continue;
    }
    if (current) buf.push(line);
    else pre.push(line);
  }
  flush();
  const keys = Object.keys(perPlatform) as PlatformKey[];
  // With platform blocks, the first block (usually Facebook) becomes the main caption.
  if (keys.length && !tidy(pre.join('\n'))) {
    const main = perPlatform[keys[0]] as string;
    return { main, perPlatform: Object.fromEntries(keys.slice(1).filter((k) => perPlatform[k] !== main).map((k) => [k, perPlatform[k]])) as Partial<Record<PlatformKey, string>> };
  }
  return { main: tidy(pre.join('\n')), perPlatform };
}

/** Trim, and collapse runs of blank lines to one. */
export function tidy(text: string): string {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
