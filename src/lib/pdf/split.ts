import { PDFDocument } from "pdf-lib";
import { zipSync } from "fflate";

/**
 * Creates one new PDF per group of page indices (0-based), in the given order.
 * Runs entirely in the browser (or Node); nothing is uploaded.
 */
export async function splitPdf(
  source: ArrayBuffer,
  groups: number[][],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array[]> {
  if (groups.length === 0) throw new Error("Tidak ada halaman yang dipilih.");

  const src = await PDFDocument.load(source);
  const outputs: Uint8Array[] = [];

  for (let i = 0; i < groups.length; i++) {
    const doc = await PDFDocument.create({ updateMetadata: false });
    const pages = await doc.copyPages(src, groups[i]);
    for (const page of pages) doc.addPage(page);
    doc.setProducer("PDF Mate");
    doc.setCreator("PDF Mate");
    outputs.push(await doc.save());

    onProgress?.(i + 1, groups.length);
    // Yield so the progress UI can repaint between files.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return outputs;
}

/** Bundles files into a ZIP. PDFs are already compressed, so they're stored as-is (level 0). */
export function zipFiles(files: { name: string; bytes: Uint8Array }[]): Uint8Array {
  const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
  for (const f of files) entries[uniqueName(f.name, entries)] = [f.bytes, { level: 0 }];
  return zipSync(entries);
}

function uniqueName(name: string, taken: Record<string, unknown>) {
  if (!(name in taken)) return name;
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let i = 2;
  while (`${base} (${i})${ext}` in taken) i++;
  return `${base} (${i})${ext}`;
}
