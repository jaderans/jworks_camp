import { sha256Bytes } from '../lib/hash';

/**
 * Link checks for asset and post links. One of them guards against
 * clipboard-hijacking malware, which swaps anything that looks like a crypto
 * wallet address (Google Drive folder IDs often do) for an attacker's address.
 * A wallet address carries a checksum, so a real Drive ID never passes it.
 */

const BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function bech32Valid(s: string): boolean {
  const lower = s.toLowerCase();
  if (s !== lower && s !== s.toUpperCase()) return false;
  const pos = lower.lastIndexOf('1');
  if (pos < 1 || pos + 7 > lower.length) return false;
  const hrp = lower.slice(0, pos);
  const data = [...lower.slice(pos + 1)].map((c) => BECH32.indexOf(c));
  if (data.some((d) => d < 0)) return false;
  const values = [...[...hrp].map((c) => c.charCodeAt(0) >> 5), 0, ...[...hrp].map((c) => c.charCodeAt(0) & 31), ...data];
  let chk = 1;
  for (const v of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >> i) & 1) chk ^= GEN[i];
  }
  return chk === 1 || chk === 0x2bc830a3;
}

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58CheckValid(s: string): boolean {
  let n = 0n;
  for (const c of s) {
    const v = B58.indexOf(c);
    if (v < 0) return false;
    n = n * 58n + BigInt(v);
  }
  const bytes: number[] = [];
  while (n > 0n) {
    bytes.unshift(Number(n % 256n));
    n /= 256n;
  }
  for (const c of s) {
    if (c !== '1') break;
    bytes.unshift(0);
  }
  if (bytes.length < 5) return false;
  const payload = Uint8Array.from(bytes.slice(0, -4));
  const check = bytes.slice(-4);
  const h = sha256Bytes(sha256Bytes(payload));
  return check.every((b, i) => b === h[i]);
}

/** Does this text contain a checksum-valid crypto wallet address? */
export function containsWalletAddress(text: string): boolean {
  const tokens = text.split(/[^A-Za-z0-9]+/).filter((t) => t.length >= 25 && t.length <= 90);
  for (const t of tokens) {
    if (/^(bc1|tb1|ltc1)[a-z0-9]{8,87}$/i.test(t) && bech32Valid(t)) return true;
    if (/^[13LMT][1-9A-HJ-NP-Za-km-z]{24,34}$/.test(t) && base58CheckValid(t)) return true;
  }
  return /\b0x[0-9a-fA-F]{40}\b/.test(text);
}

export const isUrl = (s: string): boolean => {
  try {
    const u = new URL(s.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};

export const isDriveLink = (s: string): boolean => /^https?:\/\/(drive|docs)\.google\.com\//i.test(s.trim());

export interface LinkCheck {
  level: 'bad' | 'warn';
  text: string;
}

/** Problems with a link someone pasted, or null when it looks fine. */
export function checkLink(s: string): LinkCheck | null {
  const v = s.trim();
  if (!v) return null;
  if (containsWalletAddress(v)) {
    return {
      level: 'bad',
      text: 'This link contains a crypto wallet address, not a folder ID. Clipboard-hijacking malware does this: re-copy the link from Drive on a clean device and scan the computer it was pasted from.',
    };
  }
  if (!isUrl(v)) return { level: 'warn', text: 'That doesn’t look like a web link (it should start with https://).' };
  return null;
}
