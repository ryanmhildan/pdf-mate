import type { EditObject, FontFamily, LineObject } from "@/lib/pdf/edit";

export type Tool = "select" | "text" | "image" | "rect" | "ellipse" | "line" | "highlight" | "draw" | "whiteout";

export type Style = {
  color: string;
  strokeWidth: number;
  fontSize: number;
  font: FontFamily;
  bold: boolean;
  fill: string | null;
  highlight: string;
};

export const defaultStyle: Style = {
  color: "#111827",
  strokeWidth: 2,
  fontSize: 16,
  font: "helvetica",
  bold: false,
  fill: null,
  highlight: "#fde047",
};

export const COLORS = ["#111827", "#e11d48", "#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#ffffff"];
export const HIGHLIGHTS = ["#fde047", "#86efac", "#f9a8d4", "#93c5fd"];
export const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64, 72];
export const STROKES = [1, 2, 3, 4, 6, 8];

export const CSS_FONT: Record<FontFamily, string> = {
  helvetica: 'Arial, Helvetica, "Liberation Sans", sans-serif',
  times: '"Times New Roman", Times, "Liberation Serif", serif',
  courier: '"Courier New", Courier, "Liberation Mono", monospace',
};

export const FONT_LABEL: Record<FontFamily, string> = {
  helvetica: "Sans (Helvetica)",
  times: "Serif (Times)",
  courier: "Mono (Courier)",
};

export type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export const newId = () => crypto.randomUUID();

/** Tools that stay active after drawing one object (users usually do several in a row). */
export const STICKY_TOOLS: Tool[] = ["draw", "highlight"];

export function moveBy<T extends EditObject>(o: T, dx: number, dy: number): T {
  if (o.kind === "line") {
    const l = o as LineObject;
    return { ...l, x1: l.x1 + dx, y1: l.y1 + dy, x2: l.x2 + dx, y2: l.y2 + dy } as T;
  }
  return { ...o, x: (o as { x: number }).x + dx, y: (o as { y: number }).y + dy };
}

type Box = { x: number; y: number; w: number; h: number };

const MIN = 4;

/** New box after dragging a resize handle by (dx, dy). keepRatio locks the aspect ratio (images). */
export function resizeBox(start: Box, handle: Handle, dx: number, dy: number, keepRatio: boolean): Box {
  let { x, y, w, h } = start;
  if (handle.includes("w")) {
    x = start.x + dx;
    w = start.w - dx;
  }
  if (handle.includes("e")) w = start.w + dx;
  if (handle.includes("n")) {
    y = start.y + dy;
    h = start.h - dy;
  }
  if (handle.includes("s")) h = start.h + dy;

  if (keepRatio && handle.length === 2 && start.w > 0 && start.h > 0) {
    const ratio = start.w / start.h;
    // Follow whichever side moved more, then fit the other one.
    if (Math.abs(w - start.w) / start.w > Math.abs(h - start.h) / start.h) {
      const nh = w / ratio;
      if (handle.includes("n")) y = start.y + start.h - nh;
      h = nh;
    } else {
      const nw = h * ratio;
      if (handle.includes("w")) x = start.x + start.w - nw;
      w = nw;
    }
  }

  // Never collapse or flip.
  if (w < MIN) {
    if (handle.includes("w")) x = start.x + start.w - MIN;
    w = MIN;
  }
  if (h < MIN) {
    if (handle.includes("n")) y = start.y + start.h - MIN;
    h = MIN;
  }
  return { x, y, w, h };
}

/** Normalizes a drag from (x0, y0) to (x1, y1) into a box. */
export function boxFromPoints(x0: number, y0: number, x1: number, y1: number): Box {
  return { x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) };
}

/** Reads an image file; formats PDF can't embed directly (WebP, GIF, …) are converted to PNG. */
export async function readImage(file: File) {
  const toBytes = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const size = { w: img.naturalWidth, h: img.naturalHeight };
    if (file.type === "image/png" || file.type === "image/jpeg") {
      return { bytes: await toBytes(file), mime: file.type as "image/png" | "image/jpeg", ...size };
    }
    const canvas = document.createElement("canvas");
    canvas.width = size.w;
    canvas.height = size.h;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (!blob) throw new Error("convert failed");
    return { bytes: await toBytes(blob), mime: "image/png" as const, ...size };
  } finally {
    URL.revokeObjectURL(url);
  }
}
