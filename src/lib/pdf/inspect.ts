"use client";

import type { Matrix } from "./matrix";

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

type PdfjsDocument = Awaited<ReturnType<Pdfjs["getDocument"]>["promise"]>;

async function renderToUrl(doc: PdfjsDocument, pageNumber: number, width: number): Promise<string | null> {
  try {
    const page = await doc.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const scale = (width * Math.min(window.devicePixelRatio || 1, 2)) / base.width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    return blob ? URL.createObjectURL(blob) : null;
  } catch {
    // A broken preview shouldn't block processing; callers fall back to an icon.
    return null;
  }
}

export type OpenedPdf = {
  pageCount: number;
  /** Renders one page (1-based) to a PNG object URL — revoke it when no longer needed. */
  renderPage: (pageNumber: number, width?: number) => Promise<string | null>;
  /** Displayed size (points, after rotation) and the pdf.js PDF→screen transform at scale 1. */
  getPageGeometry: (pageNumber: number) => Promise<{ width: number; height: number; transform: Matrix }>;
  close: () => Promise<void>;
};

/** Opens a PDF once so several pages can be rendered on demand. Call close() when done. */
export async function openPdf(data: ArrayBuffer): Promise<OpenedPdf> {
  const pdfjs = await loadPdfjs();
  // pdf.js transfers the buffer to its worker, so hand it a copy and keep the original intact.
  const task = pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) });

  let doc: PdfjsDocument;
  try {
    doc = await task.promise;
  } catch (err) {
    await task.destroy().catch(() => {});
    const name = (err as Error)?.name;
    throw new PdfInspectError(name === "PasswordException" ? "locked" : "invalid");
  }

  return {
    pageCount: doc.numPages,
    renderPage: (n, width = 160) => renderToUrl(doc, n, width),
    getPageGeometry: async (n) => {
      const vp = (await doc.getPage(n)).getViewport({ scale: 1 });
      return { width: vp.width, height: vp.height, transform: vp.transform as Matrix };
    },
    close: () => task.destroy(),
  };
}

/** Reads the page count and renders a small preview of the first page. */
export async function inspectPdf(data: ArrayBuffer, thumbWidth = 160): Promise<PdfInfo> {
  const pdf = await openPdf(data);
  try {
    return { pageCount: pdf.pageCount, thumbnail: await pdf.renderPage(1, thumbWidth) };
  } finally {
    await pdf.close();
  }
}
