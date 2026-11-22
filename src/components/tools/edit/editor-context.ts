"use client";

import { createContext, useContext } from "react";
import type { EditObject } from "@/lib/pdf/edit";
import type { History } from "./use-history";
import type { Style, Tool } from "./model";

export type PendingImage = { bytes: Uint8Array; mime: "image/png" | "image/jpeg"; src: string; w: number; h: number };

export type EditorApi = {
  zoom: number;
  tool: Tool;
  setTool: (t: Tool) => void;
  style: Style;
  history: History;
  selectedId: string | null;
  select: (id: string | null) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  pendingImage: PendingImage | null;
  placeImage: (page: number, x: number, y: number, pageWidth: number) => void;
  /** Renders a page (1-based) at a CSS width; calls are queued so only one renders at a time. */
  renderPage: (pageNumber: number, cssWidth: number) => Promise<string | null>;
  objectsOnPage: (page: number) => EditObject[];
};

export const EditorContext = createContext<EditorApi | null>(null);

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside EditorContext");
  return ctx;
}

/**
 * Tracks a pointer drag on the window. `onMove` receives the offset from the start in CSS pixels;
 * `onFirstMove` fires once, before the first `onMove` (used to create an undo checkpoint).
 */
export function startDrag(
  e: React.PointerEvent,
  handlers: { onFirstMove?: () => void; onMove: (dx: number, dy: number, ev: PointerEvent) => void; onEnd?: (moved: boolean) => void },
) {
  const sx = e.clientX;
  const sy = e.clientY;
  let moved = false;
  const move = (ev: PointerEvent) => {
    if (!moved) {
      if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return;
      moved = true;
      handlers.onFirstMove?.();
    }
    handlers.onMove(ev.clientX - sx, ev.clientY - sy, ev);
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    handlers.onEnd?.(moved);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
}
