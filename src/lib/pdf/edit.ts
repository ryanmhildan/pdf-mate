import {
  BlendMode,
  LineCapStyle,
  PDFDocument,
  StandardFonts,
  concatTransformationMatrix,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  type PDFFont,
  type PDFImage,
} from "pdf-lib";
import type { Matrix } from "./matrix";

/*
 * Editor objects are stored in "view space": points, origin at the TOP-left of the page as the
 * user sees it, y pointing down. That matches the DOM, so the editor can use them directly.
 */

export type FontFamily = "helvetica" | "times" | "courier";

type Base = { id: string; /** 0-based page index */ page: number };
type Box = { x: number; y: number; w: number; h: number };

export type TextObject = Base &
  Box & { kind: "text"; text: string; fontSize: number; color: string; font: FontFamily; bold: boolean };
export type ShapeObject = Base & Box & { kind: "rect" | "ellipse"; stroke: string; strokeWidth: number; fill: string | null };
export type HighlightObject = Base & Box & { kind: "highlight"; color: string };
export type WhiteoutObject = Base & Box & { kind: "whiteout" };
export type ImageObject = Base & Box & { kind: "image"; bytes: Uint8Array; mime: "image/png" | "image/jpeg"; src: string };
/** Freehand stroke. Points are normalized to 0..1 inside the box so the drawing scales with it. */
export type DrawObject = Base & Box & { kind: "draw"; points: [number, number][]; color: string; strokeWidth: number };
export type LineObject = Base & { kind: "line"; x1: number; y1: number; x2: number; y2: number; color: string; strokeWidth: number };

export type EditObject =
  | TextObject
  | ShapeObject
  | HighlightObject
  | WhiteoutObject
  | ImageObject
  | DrawObject
  | LineObject;

export type PageGeometry = {
  /** Size of the page as displayed (after rotation), in points. */
  width: number;
  height: number;
  /** Maps drawing space (bottom-left origin, y up, as displayed) → PDF user space. See matrix.ts. */
  toPdf: Matrix;
};

export const LINE_HEIGHT = 1.2;

/**
 * Distance from the top of a text line box to its baseline, as a fraction of the font size.
 * Matches how browsers lay out Arial / Times New Roman / Courier New with line-height 1.2,
 * so text lands where the user placed it in the editor.
 */
export const BASELINE: Record<FontFamily, number> = { helvetica: 0.946, times: 0.938, courier: 0.867 };

const FONT_NAMES: Record<FontFamily, [StandardFonts, StandardFonts]> = {
  helvetica: [StandardFonts.Helvetica, StandardFonts.HelveticaBold],
  times: [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold],
  courier: [StandardFonts.Courier, StandardFonts.CourierBold],
};

export function hexToRgb(hex: string) {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return rgb(0, 0, 0);
  return rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255);
}

/** Standard PDF fonts only cover Latin (WinAnsi). Replace anything else so saving never fails. */
function makeSafe(font: PDFFont) {
  const cache = new Map<string, boolean>();
  return (text: string) =>
    [...text.replace(/\t/g, "    ")]
      .map((ch) => {
        if (!cache.has(ch)) {
          try {
            font.encodeText(ch);
            cache.set(ch, true);
          } catch {
            cache.set(ch, false);
          }
        }
        return cache.get(ch) ? ch : "?";
      })
      .join("");
}

/** Bakes the editor objects into the PDF and returns the new file. */
export async function applyEdits(
  source: ArrayBuffer,
  pages: PageGeometry[],
  objects: EditObject[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(source, { updateMetadata: false });
  const pdfPages = doc.getPages();

  const fonts = new Map<string, { font: PDFFont; safe: (t: string) => string }>();
  async function getFont(family: FontFamily, bold: boolean) {
    const key = `${family}-${bold}`;
    if (!fonts.has(key)) {
      const font = await doc.embedFont(FONT_NAMES[family][bold ? 1 : 0]);
      fonts.set(key, { font, safe: makeSafe(font) });
    }
    return fonts.get(key)!;
  }

  const images = new Map<string, PDFImage>();
  async function getImage(o: ImageObject) {
    if (!images.has(o.id)) {
      images.set(o.id, o.mime === "image/png" ? await doc.embedPng(o.bytes) : await doc.embedJpg(o.bytes));
    }
    return images.get(o.id)!;
  }

  const byPage = new Map<number, EditObject[]>();
  for (const o of objects) {
    if (o.page < 0 || o.page >= pdfPages.length) continue;
    byPage.set(o.page, [...(byPage.get(o.page) ?? []), o]);
  }

  for (const [index, list] of byPage) {
    const page = pdfPages[index];
    const { height: H, toPdf } = pages[index];

    // Isolate the original content so an unbalanced graphics state in it can't shift our drawing.
    const start = doc.context.register(doc.context.contentStream([pushGraphicsState()]));
    const end = doc.context.register(doc.context.contentStream([popGraphicsState()]));
    page.node.wrapContentStreams(start, end);

    // From here on we draw in "drawing space": the page as displayed, origin bottom-left.
    page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...toPdf));

    for (const o of list) {
      switch (o.kind) {
        case "whiteout":
          page.drawRectangle({ x: o.x, y: H - o.y - o.h, width: o.w, height: o.h, color: rgb(1, 1, 1) });
          break;

        case "highlight":
          page.drawRectangle({
            x: o.x,
            y: H - o.y - o.h,
            width: o.w,
            height: o.h,
            color: hexToRgb(o.color),
            opacity: 0.4,
            blendMode: BlendMode.Multiply,
          });
          break;

        case "rect":
          page.drawRectangle({
            x: o.x,
            y: H - o.y - o.h,
            width: o.w,
            height: o.h,
            borderColor: hexToRgb(o.stroke),
            borderWidth: o.strokeWidth,
            color: o.fill ? hexToRgb(o.fill) : undefined,
          });
          break;

        case "ellipse":
          page.drawEllipse({
            x: o.x + o.w / 2,
            y: H - o.y - o.h / 2,
            xScale: o.w / 2,
            yScale: o.h / 2,
            borderColor: hexToRgb(o.stroke),
            borderWidth: o.strokeWidth,
            color: o.fill ? hexToRgb(o.fill) : undefined,
          });
          break;

        case "line":
          page.drawLine({
            start: { x: o.x1, y: H - o.y1 },
            end: { x: o.x2, y: H - o.y2 },
            thickness: o.strokeWidth,
            color: hexToRgb(o.color),
            lineCap: LineCapStyle.Round,
          });
          break;

        case "draw": {
          if (o.points.length < 2) break;
          // drawSvgPath uses SVG's y-down coordinates relative to (x, y).
          const d = o.points
            .map(([px, py], i) => `${i ? "L" : "M"}${(px * o.w).toFixed(2)} ${(py * o.h).toFixed(2)}`)
            .join(" ");
          page.drawSvgPath(d, {
            x: o.x,
            y: H - o.y,
            borderColor: hexToRgb(o.color),
            borderWidth: o.strokeWidth,
            borderLineCap: LineCapStyle.Round,
          });
          break;
        }

        case "image":
          page.drawImage(await getImage(o), { x: o.x, y: H - o.y - o.h, width: o.w, height: o.h });
          break;

        case "text": {
          const { font, safe } = await getFont(o.font, o.bold);
          const color = hexToRgb(o.color);
          o.text.split("\n").forEach((line, i) => {
            if (!line) return;
            const baseline = o.y + (i * LINE_HEIGHT + BASELINE[o.font]) * o.fontSize;
            page.drawText(safe(line), { x: o.x, y: H - baseline, size: o.fontSize, font, color });
          });
          break;
        }
      }
    }

    page.pushOperators(popGraphicsState());
  }

  doc.setProducer("PDF Mate");
  doc.setModificationDate(new Date());
  return doc.save();
}
