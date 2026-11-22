"use client";

import { motion } from "motion/react";
import {
  Bold,
  Circle,
  Copy,
  Download,
  Eraser,
  Highlighter,
  ImagePlus,
  Minus,
  MousePointer2,
  Pencil,
  Plus,
  Redo2,
  Square,
  Trash2,
  Type,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import type { EditObject, FontFamily } from "@/lib/pdf/edit";
import { COLORS, FONT_LABEL, FONT_SIZES, HIGHLIGHTS, STROKES, type Style, type Tool } from "./model";

export const TOOLS: { id: Tool; label: string; icon: LucideIcon; key: string }[] = [
  { id: "select", label: "Pilih & geser", icon: MousePointer2, key: "V" },
  { id: "text", label: "Teks", icon: Type, key: "T" },
  { id: "image", label: "Gambar", icon: ImagePlus, key: "I" },
  { id: "rect", label: "Kotak", icon: Square, key: "R" },
  { id: "ellipse", label: "Elips", icon: Circle, key: "E" },
  { id: "line", label: "Garis", icon: Minus, key: "L" },
  { id: "highlight", label: "Highlight", icon: Highlighter, key: "H" },
  { id: "draw", label: "Coret bebas", icon: Pencil, key: "D" },
  { id: "whiteout", label: "Whiteout (tutup)", icon: Eraser, key: "W" },
];

const FILLS: (string | null)[] = [null, "#ffffff", "#fde68a", "#bfdbfe", "#bbf7d0", "#fecdd3", "#111827"];

const HINTS: Record<Tool, string> = {
  select: "Klik objek untuk memilih, seret untuk memindah. Klik dua kali pada teks untuk mengubahnya.",
  text: "Klik di halaman untuk menambah teks.",
  image: "Klik di halaman untuk menempatkan gambar.",
  rect: "Seret di halaman untuk menggambar kotak.",
  ellipse: "Seret di halaman untuk menggambar elips.",
  line: "Seret di halaman untuk menggambar garis.",
  highlight: "Seret di atas teks yang ingin ditandai.",
  draw: "Tahan dan gerakkan untuk mencoret bebas.",
  whiteout: "Seret untuk menutup bagian halaman dengan warna putih. Cocok dipadukan dengan teks baru.",
};

type Props = {
  tool: Tool;
  onTool: (t: Tool) => void;
  style: Style;
  selected: EditObject | null;
  onStyle: (patch: Partial<Style>) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  zoom: number;
  onZoom: (dir: -1 | 1 | 0) => void;
  onSave: () => void;
  canSave: boolean;
};

export function Toolbar(p: Props) {
  // What the property panel edits: the selected object, or the defaults of the active tool.
  const target: Tool | EditObject["kind"] = p.selected?.kind ?? p.tool;
  const s = p.selected;
  const value = {
    color:
      s && "color" in s ? s.color : s && "stroke" in s ? s.stroke : p.style.color,
    strokeWidth: s && "strokeWidth" in s ? s.strokeWidth : p.style.strokeWidth,
    fontSize: s?.kind === "text" ? s.fontSize : p.style.fontSize,
    font: s?.kind === "text" ? s.font : p.style.font,
    bold: s?.kind === "text" ? s.bold : p.style.bold,
    fill: s && "fill" in s ? s.fill : p.style.fill,
    highlight: s?.kind === "highlight" ? s.color : p.style.highlight,
  };

  const iconBtn =
    "inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="glass sticky top-[84px] z-30 rounded-2xl shadow-lg shadow-indigo-500/5">
      {/* Row 1: tools + actions */}
      <div className="flex items-center gap-1 p-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        <div role="toolbar" aria-label="Alat edit" className="flex items-center gap-0.5">
          {TOOLS.map((t) => {
            const active = p.tool === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => p.onTool(t.id)}
                aria-pressed={active}
                aria-label={`${t.label} (${t.key})`}
                title={`${t.label} (${t.key})`}
                className={`relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors ${
                  active ? "text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="edit-tool"
                    className="bg-brand-gradient absolute inset-0 rounded-xl shadow-md shadow-indigo-500/30"
                    transition={{ type: "spring", stiffness: 450, damping: 34 }}
                  />
                )}
                <Icon className="relative size-5" aria-hidden />
              </button>
            );
          })}
        </div>

        <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden />

        <button type="button" onClick={p.onUndo} disabled={!p.canUndo} aria-label="Urungkan (Ctrl+Z)" title="Urungkan (Ctrl+Z)" className={iconBtn}>
          <Undo2 className="size-5" aria-hidden />
        </button>
        <button type="button" onClick={p.onRedo} disabled={!p.canRedo} aria-label="Ulangi (Ctrl+Y)" title="Ulangi (Ctrl+Y)" className={iconBtn}>
          <Redo2 className="size-5" aria-hidden />
        </button>

        <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden />

        <button type="button" onClick={() => p.onZoom(-1)} aria-label="Perkecil" title="Perkecil" className={iconBtn}>
          <Minus className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => p.onZoom(0)}
          title="Pas dengan lebar layar"
          className="min-h-10 shrink-0 cursor-pointer rounded-xl px-2 text-sm font-semibold tabular-nums text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {Math.round(p.zoom * 100)}%
        </button>
        <button type="button" onClick={() => p.onZoom(1)} aria-label="Perbesar" title="Perbesar" className={iconBtn}>
          <Plus className="size-4" aria-hidden />
        </button>
        </div>

        <div className="shrink-0 pl-1">
          <motion.button
            type="button"
            onClick={p.onSave}
            disabled={!p.canSave}
            whileHover={p.canSave ? { scale: 1.03 } : undefined}
            whileTap={p.canSave ? { scale: 0.97 } : undefined}
            className="bg-brand-gradient inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <Download className="size-4" aria-hidden /> Simpan<span className="hidden sm:inline"> PDF</span>
          </motion.button>
        </div>
      </div>

      {/* Row 2: properties for the selection / active tool */}
      <div className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-3 py-2 text-sm">
        {target === "text" && (
          <>
            <label className="flex items-center gap-2">
              <span className="sr-only">Jenis huruf</span>
              <select
                value={value.font}
                onChange={(e) => p.onStyle({ font: e.target.value as FontFamily })}
                className="min-h-9 cursor-pointer rounded-lg border border-border bg-card px-2"
              >
                {(Object.keys(FONT_LABEL) as FontFamily[]).map((f) => (
                  <option key={f} value={f}>
                    {FONT_LABEL[f]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="sr-only">Ukuran huruf</span>
              <select
                value={value.fontSize}
                onChange={(e) => p.onStyle({ fontSize: Number(e.target.value) })}
                className="min-h-9 cursor-pointer rounded-lg border border-border bg-card px-2 tabular-nums"
              >
                {FONT_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n} pt
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              aria-pressed={value.bold}
              aria-label="Tebal"
              onClick={() => p.onStyle({ bold: !value.bold })}
              className={`inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border ${
                value.bold ? "border-primary bg-primary-soft text-primary" : "border-border bg-card"
              }`}
            >
              <Bold className="size-4" aria-hidden />
            </button>
            <Swatches label="Warna" colors={COLORS} value={value.color} onPick={(c) => p.onStyle({ color: c! })} />
          </>
        )}

        {(target === "rect" || target === "ellipse") && (
          <>
            <Swatches label="Garis" colors={COLORS} value={value.color} onPick={(c) => p.onStyle({ color: c! })} />
            <Stroke value={value.strokeWidth} onPick={(n) => p.onStyle({ strokeWidth: n })} />
            <Swatches label="Isi" colors={FILLS} value={value.fill} onPick={(c) => p.onStyle({ fill: c })} />
          </>
        )}

        {(target === "line" || target === "draw") && (
          <>
            <Swatches label="Warna" colors={COLORS} value={value.color} onPick={(c) => p.onStyle({ color: c! })} />
            <Stroke value={value.strokeWidth} onPick={(n) => p.onStyle({ strokeWidth: n })} />
          </>
        )}

        {target === "highlight" && (
          <Swatches label="Warna" colors={HIGHLIGHTS} value={value.highlight} onPick={(c) => p.onStyle({ highlight: c! })} />
        )}

        {(!p.selected || target === "image" || target === "whiteout") && (
          <p className="text-muted-foreground">{HINTS[p.selected ? (target as Tool) : p.tool] ?? HINTS.select}</p>
        )}

        {p.selected && (
          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={p.onDuplicate} aria-label="Duplikat (Ctrl+D)" title="Duplikat (Ctrl+D)" className={iconBtn}>
              <Copy className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={p.onDelete}
              aria-label="Hapus objek (Delete)"
              title="Hapus objek (Delete)"
              className={`${iconBtn} hover:bg-red-50 hover:text-destructive`}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Swatches({
  label,
  colors,
  value,
  onPick,
}: {
  label: string;
  colors: (string | null)[];
  value: string | null;
  onPick: (c: string | null) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1.5">
      <span className="mr-0.5 font-medium text-muted-foreground">{label}</span>
      {colors.map((c) => {
        const active = (value ?? null) === c;
        return (
          <button
            key={c ?? "none"}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={c ?? "Tanpa isi"}
            title={c ?? "Tanpa isi"}
            onClick={() => onPick(c)}
            className={`relative size-7 cursor-pointer rounded-full border transition-transform hover:scale-110 ${
              active ? "ring-2 ring-primary ring-offset-2" : ""
            } ${c === "#ffffff" || c === null ? "border-slate-300" : "border-transparent"}`}
            style={{ background: c ?? "white" }}
          >
            {c === null && <span className="absolute inset-1 rotate-45 border-t-2 border-red-500" style={{ top: "45%" }} aria-hidden />}
          </button>
        );
      })}
      {colors !== HIGHLIGHTS && (
        <label className="relative size-7 cursor-pointer overflow-hidden rounded-full border border-slate-300" title="Warna lain">
          <span className="sr-only">Warna lain untuk {label}</span>
          <span className="absolute inset-0 bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]" aria-hidden />
          <input
            type="color"
            value={value ?? "#ffffff"}
            onChange={(e) => onPick(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      )}
    </div>
  );
}

function Stroke({ value, onPick }: { value: number; onPick: (n: number) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="font-medium text-muted-foreground">Tebal</span>
      <select
        value={value}
        onChange={(e) => onPick(Number(e.target.value))}
        className="min-h-9 cursor-pointer rounded-lg border border-border bg-card px-2 tabular-nums"
      >
        {STROKES.map((n) => (
          <option key={n} value={n}>
            {n} pt
          </option>
        ))}
      </select>
    </label>
  );
}
