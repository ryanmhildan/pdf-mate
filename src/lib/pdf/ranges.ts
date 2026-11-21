/** A group of pages that becomes one output file. Page numbers are 1-based and inclusive. */
export type PageRange = { from: number; to: number };

export type ParseResult = { ok: true; ranges: PageRange[] } | { ok: false; error: string };

/**
 * Parses user input like "1-3, 5, 8-10" into page ranges.
 * Accepts "-", "–" or "—" as separators, spaces anywhere, and reversed ranges ("5-3").
 */
export function parseRanges(input: string, pageCount: number): ParseResult {
  const parts = input
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return { ok: false, error: "Isi rentang halaman, misalnya 1-3, 5." };

  const ranges: PageRange[] = [];
  for (const part of parts) {
    const m = part.match(/^(\d+)\s*(?:[-–—]\s*(\d+))?$/);
    if (!m) return { ok: false, error: `"${part}" bukan rentang yang valid. Contoh: 1-3, 5, 8-10.` };

    let from = Number(m[1]);
    let to = m[2] ? Number(m[2]) : from;
    if (from > to) [from, to] = [to, from];

    if (from < 1) return { ok: false, error: "Nomor halaman dimulai dari 1." };
    if (to > pageCount) {
      return { ok: false, error: `Halaman ${to} tidak ada. Dokumen ini hanya punya ${pageCount} halaman.` };
    }
    ranges.push({ from, to });
  }
  return { ok: true, ranges };
}

/** Splits the document into chunks of `size` pages: 1-3, 4-6, … */
export function chunkRanges(pageCount: number, size: number): PageRange[] {
  const n = Math.max(1, Math.floor(size));
  const out: PageRange[] = [];
  for (let from = 1; from <= pageCount; from += n) {
    out.push({ from, to: Math.min(from + n - 1, pageCount) });
  }
  return out;
}

/** Turns selected page numbers into compact ranges: {1,2,3,7} → 1-3, 7. */
export function selectionToRanges(selected: Iterable<number>): PageRange[] {
  const pages = [...new Set(selected)].sort((a, b) => a - b);
  const out: PageRange[] = [];
  for (const p of pages) {
    const last = out[out.length - 1];
    if (last && p === last.to + 1) last.to = p;
    else out.push({ from: p, to: p });
  }
  return out;
}

/** 1-based inclusive range → 0-based page indices. */
export function rangeToIndices({ from, to }: PageRange): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
}

export function formatRange({ from, to }: PageRange) {
  return from === to ? `${from}` : `${from}–${to}`;
}
