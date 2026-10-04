import { stripStyles } from '../domain/captions';

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'your', 'you', 'our', 'we', 'is', 'are', 'how', 'what', 'why', 'it', 'that', 'this', 'from', 'vs', 'i', 'my']);

/** Lower-case words without punctuation or styled letters, minus filler words. */
export function words(text: string): string[] {
  return stripStyles(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/** 0–1: how alike two titles are (shared words over all words). */
export function similarity(a: string, b: string): number {
  const A = new Set(words(a));
  const B = new Set(words(b));
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / (A.size + B.size - shared);
}

/** The best match above a threshold, or null. */
export function bestMatch<T>(needle: string, items: readonly T[], textOf: (t: T) => string, threshold = 0.34): T | null {
  let best: T | null = null;
  let score = threshold;
  for (const it of items) {
    const s = similarity(needle, textOf(it));
    if (s >= score) {
      score = s;
      best = it;
    }
  }
  return best;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
