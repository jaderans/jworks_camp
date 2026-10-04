import { strFromU8, unzipSync } from 'fflate';

/**
 * A small .xlsx reader: enough for planners exported from Google Sheets or
 * Excel — cell text, numbers, formula results and hyperlinks. It runs on the
 * device, so a planner with private links never has to be uploaded anywhere.
 */

export interface Cell {
  /** Displayed value: text, a number, true/false, or null. */
  v: string | number | boolean | null;
  /** Hyperlink target, when the cell links somewhere. */
  link?: string;
}

export interface Sheet {
  name: string;
  /** row number (1-based) → column number (1-based) → cell */
  rows: Map<number, Map<number, Cell>>;
  maxRow: number;
}

const ENTITY: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function decodeXml(s: string): string {
  return s
    .replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, e: string) =>
      e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENTITY[e],
    )
    .replace(/_x([0-9A-Fa-f]{4})_/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
}

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([\w:.-]+)\s*=\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) out[m[1]] = decodeXml(m[2]);
  return out;
}

/** All text in <t> elements, skipping phonetic runs. */
function textOf(xml: string): string {
  const clean = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
  let out = '';
  const re = /<t\b[^>]*>([\s\S]*?)<\/t>|<t\b[^>]*\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) out += decodeXml(m[1] ?? '');
  return out;
}

/** "AB12" → { col: 28, row: 12 } */
export function parseRef(ref: string): { col: number; row: number } {
  const m = /^([A-Z]+)(\d+)$/.exec(ref.toUpperCase());
  if (!m) return { col: 0, row: 0 };
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col, row: Number(m[2]) };
}

function resolveTarget(base: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1);
  const parts = base.split('/').slice(0, -1);
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

function rels(files: Record<string, Uint8Array>, path: string): Map<string, { target: string; external: boolean }> {
  const out = new Map<string, { target: string; external: boolean }>();
  const f = files[path];
  if (!f) return out;
  const re = /<Relationship\b([^>]*?)\/?>/g;
  const xml = strFromU8(f);
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const a = attrs(m[1]);
    if (a.Id) out.set(a.Id, { target: a.Target ?? '', external: a.TargetMode === 'External' });
  }
  return out;
}

export function readXlsx(data: Uint8Array): Sheet[] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(data);
  } catch {
    throw new Error('That file isn’t an Excel workbook (.xlsx). In Google Sheets use File → Download → Microsoft Excel.');
  }
  const wb = files['xl/workbook.xml'];
  if (!wb) throw new Error('That file isn’t an Excel workbook (.xlsx).');

  const shared: string[] = [];
  const ss = files['xl/sharedStrings.xml'];
  if (ss) {
    const re = /<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g;
    const xml = strFromU8(ss);
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml))) shared.push(textOf(m[1] ?? ''));
  }

  const wbRels = rels(files, 'xl/_rels/workbook.xml.rels');
  const sheets: Sheet[] = [];
  const sheetRe = /<sheet\b([^>]*?)\/?>/g;
  const wbXml = strFromU8(wb);
  let sm: RegExpExecArray | null;
  while ((sm = sheetRe.exec(wbXml))) {
    const a = attrs(sm[1]);
    const rid = a['r:id'] ?? Object.entries(a).find(([k]) => k.endsWith(':id'))?.[1];
    const rel = rid ? wbRels.get(rid) : undefined;
    if (!rel) continue;
    const path = resolveTarget('xl/workbook.xml', rel.target);
    const file = files[path];
    if (!file) continue;
    const xml = strFromU8(file);
    const rows = new Map<number, Map<number, Cell>>();
    let maxRow = 0;
    const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cm: RegExpExecArray | null;
    while ((cm = cellRe.exec(xml))) {
      const ca = attrs(cm[1]);
      const body = cm[2] ?? '';
      const { col, row } = parseRef(ca.r ?? '');
      if (!row || !col) continue;
      const t = ca.t ?? 'n';
      const vRaw = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body)?.[1];
      let v: Cell['v'] = null;
      if (t === 's') v = vRaw !== undefined ? (shared[Number(vRaw)] ?? '') : null;
      else if (t === 'inlineStr') v = textOf(/<is\b[^>]*>([\s\S]*?)<\/is>/.exec(body)?.[1] ?? '');
      else if (t === 'str') v = vRaw !== undefined ? decodeXml(vRaw) : null;
      else if (t === 'b') v = vRaw === '1';
      else if (t === 'e') v = null;
      else if (vRaw !== undefined && vRaw !== '') {
        const num = Number(vRaw);
        v = Number.isFinite(num) ? num : decodeXml(vRaw);
      }
      if (v === null || v === '') continue;
      if (!rows.has(row)) rows.set(row, new Map());
      rows.get(row)!.set(col, { v });
      maxRow = Math.max(maxRow, row);
    }
    // Hyperlinks live in a separate list and point to the sheet's relationships.
    const sheetRels = rels(files, resolveTarget(path, `_rels/${path.split('/').pop()}.rels`));
    const linkRe = /<hyperlink\b([^>]*?)\/?>/g;
    let lm: RegExpExecArray | null;
    while ((lm = linkRe.exec(xml))) {
      const la = attrs(lm[1]);
      const rid2 = la['r:id'] ?? Object.entries(la).find(([k]) => k.endsWith(':id'))?.[1];
      const target = rid2 ? sheetRels.get(rid2)?.target : undefined;
      if (!target || !la.ref) continue;
      const [from, to] = la.ref.split(':');
      const a1 = parseRef(from);
      const a2 = to ? parseRef(to) : a1;
      for (let r = a1.row; r <= a2.row; r++) {
        for (let c = a1.col; c <= a2.col; c++) {
          if (!rows.has(r)) rows.set(r, new Map());
          const cur = rows.get(r)!.get(c);
          rows.get(r)!.set(c, { v: cur?.v ?? target, link: target });
          maxRow = Math.max(maxRow, r);
        }
      }
    }
    sheets.push({ name: a.name ?? `Sheet ${sheets.length + 1}`, rows, maxRow });
  }
  if (!sheets.length) throw new Error('No sheets were found in that workbook.');
  return sheets;
}

/** Cell text, trimmed ('' when empty). */
export function cellText(sheet: Sheet, row: number, col: number): string {
  const v = sheet.rows.get(row)?.get(col)?.v;
  return v === null || v === undefined ? '' : String(v).trim();
}

export const cellLink = (sheet: Sheet, row: number, col: number): string => sheet.rows.get(row)?.get(col)?.link ?? '';
