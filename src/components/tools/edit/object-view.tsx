"use client";

import { useEffect, useRef } from "react";
import type { EditObject, LineObject, TextObject } from "@/lib/pdf/edit";
import { LINE_HEIGHT } from "@/lib/pdf/edit";
import { useEditor, startDrag } from "./editor-context";
import { CSS_FONT, moveBy, resizeBox, type Handle } from "./model";

const HANDLES: { h: Handle; cls: string; cursor: string }[] = [
  { h: "nw", cls: "-left-1.5 -top-1.5", cursor: "nwse-resize" },
  { h: "n", cls: "left-1/2 -top-1.5 -translate-x-1/2", cursor: "ns-resize" },
  { h: "ne", cls: "-right-1.5 -top-1.5", cursor: "nesw-resize" },
  { h: "e", cls: "-right-1.5 top-1/2 -translate-y-1/2", cursor: "ew-resize" },
  { h: "se", cls: "-right-1.5 -bottom-1.5", cursor: "nwse-resize" },
  { h: "s", cls: "left-1/2 -bottom-1.5 -translate-x-1/2", cursor: "ns-resize" },
  { h: "sw", cls: "-left-1.5 -bottom-1.5", cursor: "nesw-resize" },
  { h: "w", cls: "-left-1.5 top-1/2 -translate-y-1/2", cursor: "ew-resize" },
];

const handleCls =
  "absolute size-3 rounded-full border-2 border-primary bg-white shadow touch-none [@media(pointer:coarse)]:size-5";

export function ObjectView({ object: o }: { object: EditObject }) {
  const ed = useEditor();
  const { zoom: z, tool, history } = ed;
  const selected = ed.selectedId === o.id;
  const interactive = tool === "select";

  /** Selects the object and starts moving it. */
  function onBodyPointerDown(e: React.PointerEvent) {
    if (!interactive || e.button !== 0) return;
    e.stopPropagation();
    if (ed.editingId === o.id) return; // let the textarea handle the pointer
    ed.select(o.id);
    if (ed.editingId) ed.setEditingId(null);
    const start = o;
    startDrag(e, {
      onFirstMove: history.checkpoint,
      onMove: (dx, dy) => history.replace(o.id, moveBy(start, dx / z, dy / z)),
    });
  }

  if (o.kind === "line") return <LineView o={o} selected={selected} interactive={interactive} onBody={onBodyPointerDown} />;

  if (o.kind === "text") return <TextView o={o} selected={selected} interactive={interactive} onBody={onBodyPointerDown} />;

  function onHandlePointerDown(e: React.PointerEvent, handle: Handle) {
    e.stopPropagation();
    e.preventDefault();
    const start = o as Extract<EditObject, { w: number }>;
    startDrag(e, {
      onFirstMove: history.checkpoint,
      onMove: (dx, dy) =>
        history.update(o.id, resizeBox(start, handle, dx / z, dy / z, o.kind === "image")),
    });
  }

  const box = o as Extract<EditObject, { w: number }>;
  const style: React.CSSProperties = {
    left: box.x * z,
    top: box.y * z,
    width: box.w * z,
    height: box.h * z,
  };

  let content: React.ReactNode = null;
  switch (o.kind) {
    case "whiteout":
      content = <div className={`h-full w-full bg-white ${selected ? "" : "outline outline-1 outline-dashed outline-slate-300/70"}`} />;
      break;
    case "highlight":
      content = <div className="h-full w-full mix-blend-multiply" style={{ background: o.color, opacity: 0.4 }} />;
      break;
    case "image":
      // eslint-disable-next-line @next/next/no-img-element -- local blob preview
      content = <img src={o.src} alt="" draggable={false} className="h-full w-full select-none" />;
      break;
    case "rect":
    case "ellipse": {
      const sw = o.strokeWidth * z;
      content = (
        <svg className="h-full w-full overflow-visible" aria-hidden>
          {o.kind === "rect" ? (
            <rect x={0} y={0} width={o.w * z} height={o.h * z} fill={o.fill ?? "none"} stroke={o.stroke} strokeWidth={sw} />
          ) : (
            <ellipse cx={(o.w * z) / 2} cy={(o.h * z) / 2} rx={(o.w * z) / 2} ry={(o.h * z) / 2} fill={o.fill ?? "none"} stroke={o.stroke} strokeWidth={sw} />
          )}
        </svg>
      );
      break;
    }
    case "draw":
      content = (
        <svg className="h-full w-full overflow-visible" aria-hidden>
          <polyline
            points={o.points.map(([px, py]) => `${px * o.w * z},${py * o.h * z}`).join(" ")}
            fill="none"
            stroke={o.color}
            strokeWidth={o.strokeWidth * z}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
      break;
  }

  return (
    <div
      onPointerDown={onBodyPointerDown}
      className={`absolute ${interactive ? "cursor-move" : "pointer-events-none"}`}
      style={{ ...style, touchAction: interactive ? "none" : undefined }}
    >
      {content}
      {selected && interactive && (
        <>
          <div className="pointer-events-none absolute -inset-px outline-2 outline-offset-2 outline-primary" style={{ outlineStyle: "solid" }} />
          {HANDLES.map(({ h, cls, cursor }) => (
            <span
              key={h}
              onPointerDown={(e) => onHandlePointerDown(e, h)}
              className={`${handleCls} ${cls}`}
              style={{ cursor }}
            />
          ))}
        </>
      )}
    </div>
  );
}

function LineView({
  o,
  selected,
  interactive,
  onBody,
}: {
  o: LineObject;
  selected: boolean;
  interactive: boolean;
  onBody: (e: React.PointerEvent) => void;
}) {
  const ed = useEditor();
  const { zoom: z, history } = ed;

  function onEnd(e: React.PointerEvent, which: 1 | 2) {
    e.stopPropagation();
    e.preventDefault();
    const start = o;
    startDrag(e, {
      onFirstMove: history.checkpoint,
      onMove: (dx, dy) =>
        history.update(
          o.id,
          (which === 1
            ? { x1: start.x1 + dx / z, y1: start.y1 + dy / z }
            : { x2: start.x2 + dx / z, y2: start.y2 + dy / z }) as Partial<LineObject>,
        ),
    });
  }

  const pts = { x1: o.x1 * z, y1: o.y1 * z, x2: o.x2 * z, y2: o.y2 * z };
  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <line {...pts} stroke={o.color} strokeWidth={o.strokeWidth * z} strokeLinecap="round" />
        {interactive && (
          <line
            {...pts}
            stroke="transparent"
            strokeWidth={Math.max(14, o.strokeWidth * z + 10)}
            strokeLinecap="round"
            className="pointer-events-auto cursor-move"
            style={{ touchAction: "none" }}
            onPointerDown={onBody}
          />
        )}
        {selected && interactive && (
          <line {...pts} stroke="var(--color-primary)" strokeWidth={1} strokeDasharray="4 3" className="pointer-events-none" />
        )}
      </svg>
      {selected && interactive &&
        ([1, 2] as const).map((w) => (
          <span
            key={w}
            onPointerDown={(e) => onEnd(e, w)}
            className={`${handleCls} -translate-x-1/2 -translate-y-1/2 cursor-crosshair`}
            style={{ left: (w === 1 ? o.x1 : o.x2) * z, top: (w === 1 ? o.y1 : o.y2) * z }}
          />
        ))}
    </>
  );
}

function TextView({
  o,
  selected,
  interactive,
  onBody,
}: {
  o: TextObject;
  selected: boolean;
  interactive: boolean;
  onBody: (e: React.PointerEvent) => void;
}) {
  const ed = useEditor();
  const { zoom: z, history } = ed;
  const editing = ed.editingId === o.id;
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      const el = areaRef.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  function stopEditing() {
    ed.setEditingId(null);
    // An empty text box is useless — drop it.
    if (!o.text.trim()) {
      history.remove(o.id);
      ed.select(null);
    }
  }

  const font: React.CSSProperties = {
    fontFamily: CSS_FONT[o.font],
    fontSize: o.fontSize * z,
    lineHeight: LINE_HEIGHT,
    fontWeight: o.bold ? 700 : 400,
    color: o.color,
    whiteSpace: "pre",
  };

  return (
    <div
      onPointerDown={onBody}
      onDoubleClick={() => {
        if (!interactive) return;
        history.checkpoint();
        ed.setEditingId(o.id);
      }}
      className={`absolute ${interactive ? (editing ? "cursor-text" : "cursor-move") : "pointer-events-none"}`}
      style={{ left: o.x * z, top: o.y * z, touchAction: interactive && !editing ? "none" : undefined }}
    >
      {/* The mirror sizes the box; while editing it's hidden behind the textarea. */}
      <div style={{ ...font, visibility: editing ? "hidden" : "visible", minWidth: editing ? o.fontSize * z * 2 : undefined }}>
        {o.text || (editing ? "" : " ")}
        {"​"}
      </div>
      {editing && (
        <textarea
          ref={areaRef}
          value={o.text}
          aria-label="Teks"
          onChange={(e) => history.update(o.id, { text: e.target.value } as Partial<TextObject>)}
          onBlur={stopEditing}
          onKeyDown={(e) => {
            if (e.key === "Escape") e.currentTarget.blur();
          }}
          spellCheck={false}
          className="absolute inset-0 resize-none overflow-hidden border-0 bg-transparent p-0 outline-none"
          style={{ ...font, caretColor: o.color === "#ffffff" ? "#111827" : o.color }}
        />
      )}
      {(selected || editing) && interactive && (
        <div
          className="pointer-events-none absolute -inset-1 rounded-sm outline-2 outline-primary"
          style={{ outlineStyle: editing ? "dashed" : "solid" }}
        />
      )}
    </div>
  );
}
