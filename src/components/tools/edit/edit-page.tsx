"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { EditObject, PageGeometry } from "@/lib/pdf/edit";
import { useEditor, startDrag } from "./editor-context";
import { ObjectView } from "./object-view";
import { STICKY_TOOLS, boxFromPoints, newId } from "./model";

const DEFAULT_SIZE = {
  rect: { w: 120, h: 80 },
  ellipse: { w: 120, h: 80 },
  whiteout: { w: 120, h: 24 },
  highlight: { w: 150, h: 16 },
} as const;

/** One PDF page with its editable overlay. */
export function EditPage({ index, geom }: { index: number; geom: PageGeometry }) {
  const ed = useEditor();
  const { zoom, tool, style, history } = ed;
  const W = geom.width;
  const H = geom.height;

  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [img, setImg] = useState<{ url: string | null; zoom: number } | null>(null);
  const [draft, setDraft] = useState<[number, number][] | null>(null);

  // Only render pages near the viewport.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // (Re)render the page image when it becomes visible or the zoom changes.
  const { renderPage } = ed;
  useEffect(() => {
    if (!visible || img?.zoom === zoom) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const url = await renderPage(index + 1, W * zoom);
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      setImg((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return { url, zoom };
      });
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [visible, zoom, img?.zoom, index, W, renderPage]);

  useEffect(() => () => void (img?.url && URL.revokeObjectURL(img.url)), [img?.url]);

  const objects = ed.objectsOnPage(index);

  function toPoint(e: { clientX: number; clientY: number }): [number, number] {
    const r = ref.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / zoom, (e.clientY - r.top) / zoom];
  }

  function finish(id: string) {
    ed.select(id);
    if (!STICKY_TOOLS.includes(tool)) ed.setTool("select");
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const [px, py] = toPoint(e);

    if (tool === "select") {
      if (e.target === e.currentTarget) {
        ed.select(null);
        ed.setEditingId(null);
      }
      return;
    }
    e.preventDefault();

    if (tool === "image") {
      ed.placeImage(index, px, py, W);
      return;
    }

    if (tool === "text") {
      const id = newId();
      history.checkpoint();
      history.add({
        id,
        page: index,
        kind: "text",
        text: "",
        x: px,
        y: Math.max(0, py - style.fontSize * 0.6),
        w: 0,
        h: 0,
        fontSize: style.fontSize,
        color: style.color,
        font: style.font,
        bold: style.bold,
      });
      ed.select(id);
      ed.setEditingId(id);
      ed.setTool("select");
      return;
    }

    if (tool === "draw") {
      const points: [number, number][] = [[px, py]];
      setDraft(points);
      startDrag(e, {
        onMove: (_dx, _dy, ev) => {
          points.push(toPoint(ev));
          setDraft([...points]);
        },
        onEnd: () => {
          setDraft(null);
          if (points.length < 2) return;
          const xs = points.map((p) => p[0]);
          const ys = points.map((p) => p[1]);
          const x = Math.min(...xs);
          const y = Math.min(...ys);
          const w = Math.max(Math.max(...xs) - x, 1);
          const h = Math.max(Math.max(...ys) - y, 1);
          const id = newId();
          history.checkpoint();
          history.add({
            id,
            page: index,
            kind: "draw",
            x,
            y,
            w,
            h,
            points: points.map(([a, b]) => [(a - x) / w, (b - y) / h]),
            color: style.color,
            strokeWidth: style.strokeWidth,
          });
          ed.select(null);
        },
      });
      return;
    }

    const id = newId();
    history.checkpoint();

    if (tool === "line") {
      history.add({ id, page: index, kind: "line", x1: px, y1: py, x2: px, y2: py, color: style.color, strokeWidth: style.strokeWidth });
      let moved = false;
      startDrag(e, {
        onMove: (_dx, _dy, ev) => {
          moved = true;
          const [x2, y2] = toPoint(ev);
          history.update(id, { x2, y2 } as Partial<EditObject>);
        },
        onEnd: () => {
          if (!moved) history.update(id, { x2: px + 120, y2: py } as Partial<EditObject>);
          finish(id);
        },
      });
      return;
    }

    // Box tools: rect, ellipse, highlight, whiteout
    const base = { id, page: index, x: px, y: py, w: 0, h: 0 };
    const obj: EditObject =
      tool === "rect" || tool === "ellipse"
        ? { ...base, kind: tool, stroke: style.color, strokeWidth: style.strokeWidth, fill: style.fill }
        : tool === "highlight"
          ? { ...base, kind: "highlight", color: style.highlight }
          : { ...base, kind: "whiteout" };
    history.add(obj);
    let moved = false;
    startDrag(e, {
      onMove: (_dx, _dy, ev) => {
        moved = true;
        const [x1, y1] = toPoint(ev);
        history.update(id, boxFromPoints(px, py, x1, y1));
      },
      onEnd: () => {
        const size = DEFAULT_SIZE[tool as keyof typeof DEFAULT_SIZE];
        if (!moved && size) {
          history.update(id, { x: px, y: py - (tool === "highlight" || tool === "whiteout" ? size.h / 2 : 0), ...size });
        }
        finish(id);
      },
    });
  }

  const creating = tool !== "select";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={ref}
        data-page={index}
        onPointerDown={onPointerDown}
        className={`relative overflow-hidden bg-white shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5 ${
          creating ? (tool === "text" ? "cursor-text" : "cursor-crosshair") : ""
        }`}
        style={{ width: W * zoom, height: H * zoom, touchAction: creating ? "none" : "pan-x pan-y" }}
      >
        {img?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob render of the page
          <img src={img.url} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-slate-300" aria-hidden />
          </div>
        )}

        {objects.map((o) => (
          <ObjectView key={o.id} object={o} />
        ))}

        {draft && draft.length > 1 && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <polyline
              points={draft.map(([x, y]) => `${x * zoom},${y * zoom}`).join(" ")}
              fill="none"
              stroke={style.color}
              strokeWidth={style.strokeWidth * zoom}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span className="text-xs font-semibold text-slate-500">
        Halaman {index + 1}
      </span>
    </div>
  );
}
