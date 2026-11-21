import { PDFDocument } from "pdf-lib";

export type MergeResult = {
  bytes: Uint8Array;
  pageCount: number;
};

/**
 * Merges PDFs in the given order into a single document.
 * Runs entirely in the browser (or Node); nothing is uploaded.
 */
export async function mergePdfs(
  sources: ArrayBuffer[],
  onProgress?: (done: number, total: number) => void,
): Promise<MergeResult> {
  if (sources.length === 0) throw new Error("Tidak ada file untuk digabung.");

  // updateMetadata: false keeps pdf-lib from overwriting our Producer/Creator on save.
  const output = await PDFDocument.create({ updateMetadata: false });

  for (let i = 0; i < sources.length; i++) {
    const source = await PDFDocument.load(sources[i]);
    const pages = await output.copyPages(source, source.getPageIndices());
    for (const page of pages) output.addPage(page);

    onProgress?.(i + 1, sources.length);
    // Yield to the event loop so the progress UI can repaint between files.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  output.setProducer("PDF Mate");
  output.setCreator("PDF Mate");

  const bytes = await output.save();
  return { bytes, pageCount: output.getPageCount() };
}
