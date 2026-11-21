"use client";

type Pdfjs = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<Pdfjs> | null = null;

/** Loads pdf.js on demand (browser only). The worker is copied to /public on install. */
export function loadPdfjs(): Promise<Pdfjs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return lib;
    });
  }
  return pdfjsPromise;
}

export type PdfInfo = {
  pageCount: number;
  /** Object URL of a PNG preview of page 1 — revoke it when no longer needed. */
  thumbnail: string | null;
};

export type PdfProblem = "locked" | "invalid";

export class PdfInspectError extends Error {
  constructor(public problem: PdfProblem) {
    super(problem);
  }
}

/** Reads the page count and renders a small preview of the first page. */
export async function inspectPdf(data: ArrayBuffer, thumbWidth = 160): Promise<PdfInfo> {
  const pdfjs = await loadPdfjs();
  // pdf.js transfers the buffer to its worker, so hand it a copy and keep the original intact.
  const task = pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) });

  let doc;
  try {
    doc = await task.promise;
  } catch (err) {
    const name = (err as Error)?.name;
    throw new PdfInspectError(name === "PasswordException" ? "locked" : "invalid");
  }

  try {
    let thumbnail: string | null = null;
    try {
      const page = await doc.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const scale = (thumbWidth * Math.min(window.devicePixelRatio || 1, 2)) / base.width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      thumbnail = blob ? URL.createObjectURL(blob) : null;
    } catch {
      // A broken preview shouldn't block merging; fall back to an icon.
      thumbnail = null;
    }
    return { pageCount: doc.numPages, thumbnail };
  } finally {
    await task.destroy();
  }
}
