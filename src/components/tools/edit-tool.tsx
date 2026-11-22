"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { UploadArea } from "../upload-area";
import { DoneCard, Notice, ProgressOverlay } from "./shared";
import { formatSize } from "@/lib/format";
import { openPdf, PdfInspectError, type OpenedPdf } from "@/lib/pdf/inspect";
import { applyEdits, type EditObject, type PageGeometry } from "@/lib/pdf/edit";
import { drawingToPdf } from "@/lib/pdf/matrix";
import { useHistory } from "./edit/use-history";
import { EditorContext, type EditorApi, type PendingImage } from "./edit/editor-context";
import { EditPage } from "./edit/edit-page";
import { TOOLS, Toolbar } from "./edit/toolbar";
import { defaultStyle, moveBy, newId, readImage, type Style, type Tool } from "./edit/model";

const MAX_SIZE_MB = 50;
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5];

type Loaded = { id: string; file: File; buffer: ArrayBuffer; pdf: OpenedPdf; pages: PageGeometry[]; base: string };
type Result = { url: string; name: string; size: number };

function baseName(fileName: string) {
  return fileName.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim().slice(0, 80) || "dokumen";
}

export function EditTool() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const history = useHistory();
  const { objects } = history;
  const [tool, setToolState] = useState<Tool>("select");
  const [style, setStyle] = useState<Style>(defaultStyle);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  // ---- zoom: "fit" follows the container width until the user picks a value
  const [areaWidth, setAreaWidth] = useState(800);
  const [zoomChoice, setZoomChoice] = useState<number | "fit">("fit");
  // Callback ref: the page area mounts after the upload view's exit animation, so observe it on mount.
  const areaRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setAreaWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setAreaWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const maxPageWidth = useMemo(() => Math.max(1, ...(loaded?.pages.map((p) => p.width) ?? [1])), [loaded]);
  const fitZoom = Math.min(2, Math.max(0.3, (areaWidth - 32) / maxPageWidth));
  const zoom = zoomChoice === "fit" ? fitZoom : zoomChoice;

  function changeZoom(dir: -1 | 1 | 0) {
    if (dir === 0) return setZoomChoice("fit");
    const next =
      dir > 0 ? ZOOM_STEPS.find((z) => z > zoom + 0.01) : [...ZOOM_STEPS].reverse().find((z) => z < zoom - 0.01);
    if (next) setZoomChoice(next);
  }

  // ---- object URLs + pdf.js document cleanup
  const urls = useRef(new Set<string>());
  const loadedRef = useRef<Loaded | null>(null);
  useEffect(() => {
    loadedRef.current = loaded;
  }, [loaded]);
  useEffect(() => {
    const set = urls.current;
    return () => {
      set.forEach((u) => URL.revokeObjectURL(u));
      loadedRef.current?.pdf.close();
    };
  }, []);

  // Page renders run one at a time so scrolling a long document stays smooth.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const renderPage = useCallback((n: number, cssWidth: number) => {
    const pdf = loadedRef.current?.pdf;
    if (!pdf) return Promise.resolve(null);
    const job = queue.current.then(() => pdf.renderPage(n, cssWidth));
    queue.current = job.catch(() => null);
    return job;
  }, []);

  // Warn before leaving with unsaved edits.
  const dirty = objects.length > 0 && !result;
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  async function addFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    setLoading(true);
    setNotice(null);
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await openPdf(buffer);
      const pages = await Promise.all(
        Array.from({ length: pdf.pageCount }, async (_, i) => {
          const g = await pdf.getPageGeometry(i + 1);
          return { width: g.width, height: g.height, toPdf: drawingToPdf(g.transform, g.height) };
        }),
      );
      loadedRef.current?.pdf.close();
      history.reset();
      setSelectedId(null);
      setEditingId(null);
      setZoomChoice("fit");
      setLoaded({ id: newId(), file, buffer, pdf, pages, base: baseName(file.name) });
    } catch (err) {
      setNotice(
        err instanceof PdfInspectError && err.problem === "locked"
          ? "PDF ini terkunci kata sandi. Buka kuncinya dulu, lalu coba lagi."
          : "File ini bukan PDF yang valid atau rusak.",
      );
    } finally {
      setLoading(false);
    }
  }

  function setTool(t: Tool) {
    if (t === "image") {
      imageInput.current?.click();
      return;
    }
    setPendingImage(null);
    setToolState(t);
    if (t !== "select") {
      setSelectedId(null);
      setEditingId(null);
    }
  }

  async function onImagePicked(file: File | undefined) {
    if (!file) return;
    try {
      const img = await readImage(file);
      const src = URL.createObjectURL(new Blob([img.bytes as BlobPart], { type: img.mime }));
      urls.current.add(src);
      setPendingImage({ ...img, src });
      setToolState("image");
      setSelectedId(null);
    } catch {
      setNotice("Gambar tidak bisa dibaca. Gunakan JPG, PNG, atau WebP.");
    }
  }

  const selected = objects.find((o) => o.id === selectedId) ?? null;

  /** Applies a style change to the defaults and, if something is selected, to that object. */
  function applyStyle(patch: Partial<Style>) {
    setStyle((s) => ({ ...s, ...patch }));
    if (!selected) return;
    const o = selected;
    const p: Record<string, unknown> = {};
    if (patch.color !== undefined) {
      if (o.kind === "rect" || o.kind === "ellipse") p.stroke = patch.color;
      else if (o.kind === "text" || o.kind === "line" || o.kind === "draw") p.color = patch.color;
    }
    if (patch.strokeWidth !== undefined && "strokeWidth" in o) p.strokeWidth = patch.strokeWidth;
    if (o.kind === "text") {
      if (patch.fontSize !== undefined) p.fontSize = patch.fontSize;
      if (patch.font !== undefined) p.font = patch.font;
      if (patch.bold !== undefined) p.bold = patch.bold;
    }
    if (patch.fill !== undefined && "fill" in o) p.fill = patch.fill;
    if (patch.highlight !== undefined && o.kind === "highlight") p.color = patch.highlight;
    if (Object.keys(p).length) {
      history.checkpoint();
      history.update(o.id, p as Partial<EditObject>);
    }
  }

  function remove() {
    if (!selected) return;
    history.checkpoint();
    history.remove(selected.id);
    setSelectedId(null);
    setEditingId(null);
  }

  function duplicate() {
    if (!selected) return;
    const copy = { ...moveBy(selected, 12, 12), id: newId() } as EditObject;
    history.checkpoint();
    history.add(copy);
    setSelectedId(copy.id);
  }

  // ---- keyboard shortcuts
  const keyState = useRef({ selected, tool, editingId, remove, duplicate, history, setTool });
  useEffect(() => {
    keyState.current = { selected, tool, editingId, remove, duplicate, history, setTool };
  });
  useEffect(() => {
    if (!loaded) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
      const k = keyState.current;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) k.history.redo();
        else k.history.undo();
      } else if (mod && key === "y") {
        e.preventDefault();
        k.history.redo();
      } else if (mod && key === "d") {
        e.preventDefault();
        k.duplicate();
      } else if ((e.key === "Delete" || e.key === "Backspace") && k.selected) {
        e.preventDefault();
        k.remove();
      } else if (e.key === "Escape") {
        setSelectedId(null);
        k.setTool("select");
      } else if (e.key === "Enter" && k.selected?.kind === "text") {
        e.preventDefault();
        k.history.checkpoint();
        setEditingId(k.selected.id);
      } else if (e.key.startsWith("Arrow") && k.selected) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        k.history.checkpoint();
        k.history.replace(k.selected.id, moveBy(k.selected, dx, dy));
      } else if (!mod && !e.altKey) {
        const match = TOOLS.find((x) => x.key.toLowerCase() === key);
        if (match) k.setTool(match.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loaded]);

  async function save() {
    if (!loaded) return;
    setEditingId(null);
    setSelectedId(null);
    setSaving(true);
    try {
      const bytes = await applyEdits(loaded.buffer, loaded.pages, objects);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      urls.current.add(url);
      setResult({ url, name: `${loaded.base}-diedit.pdf`, size: blob.size });
    } catch {
      setNotice("Maaf, PDF gagal disimpan. Coba lagi, atau hapus objek terakhir yang ditambahkan.");
    } finally {
      setSaving(false);
    }
  }

  function backToEdit() {
    if (result) {
      URL.revokeObjectURL(result.url);
      urls.current.delete(result.url);
    }
    setResult(null);
  }

  function startOver() {
    if (dirty && !window.confirm("Perubahan yang belum disimpan akan hilang. Lanjutkan?")) return;
    backToEdit();
    loaded?.pdf.close();
    setLoaded(null);
    history.reset();
    setSelectedId(null);
    setEditingId(null);
    setToolState("select");
  }

  const api: EditorApi = {
    zoom,
    tool,
    setTool,
    style,
    history,
    selectedId,
    select: setSelectedId,
    editingId,
    setEditingId,
    pendingImage,
    placeImage: (page, x, y, pageWidth) => {
      if (!pendingImage) return;
      const w = Math.min(200, pageWidth * 0.4, pendingImage.w);
      const h = w * (pendingImage.h / pendingImage.w);
      const id = newId();
      history.checkpoint();
      history.add({
        id,
        page,
        kind: "image",
        x: x - w / 2,
        y: y - h / 2,
        w,
        h,
        bytes: pendingImage.bytes,
        mime: pendingImage.mime,
        src: pendingImage.src,
      });
      setPendingImage(null);
      setToolState("select");
      setSelectedId(id);
    },
    renderPage,
    objectsOnPage: (page) => objects.filter((o) => o.page === page),
  };

  return (
    <div>
      <input
        ref={imageInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          onImagePicked(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div key="done" className="mx-auto max-w-3xl">
            <DoneCard
              title="PDF berhasil disimpan"
              meta={
                <>
                  <span className="font-semibold text-foreground">{result.name}</span> · {formatSize(result.size)}
                </>
              }
              href={result.url}
              downloadName={result.name}
              downloadLabel="Unduh PDF"
              backLabel="Lanjut mengedit"
              onBack={backToEdit}
              startOverLabel="Edit file lain"
              onStartOver={startOver}
            />
          </motion.div>
        ) : !loaded ? (
          <motion.div key="empty" exit={{ opacity: 0, y: -8 }} className="relative mx-auto max-w-3xl">
            <UploadArea
              accept="application/pdf"
              acceptLabel="PDF"
              multiple={false}
              maxSizeMb={MAX_SIZE_MB}
              onFiles={addFiles}
              onReject={setNotice}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-3xl bg-white/80 font-semibold backdrop-blur-sm">
                <Loader2 className="size-5 animate-spin text-primary" aria-hidden /> Membuka PDF…
              </div>
            )}
          </motion.div>
        ) : (
          <EditorContext.Provider value={api}>
            <motion.div key="edit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-5 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{loaded.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {loaded.pages.length} halaman · {formatSize(loaded.file.size)} · {objects.length} perubahan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startOver}
                  className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <RefreshCw className="size-4" aria-hidden /> Ganti file
                </button>
              </div>

              <Toolbar
                tool={tool}
                onTool={setTool}
                style={style}
                selected={selected}
                onStyle={applyStyle}
                canUndo={history.canUndo}
                canRedo={history.canRedo}
                onUndo={() => {
                  setEditingId(null);
                  history.undo();
                }}
                onRedo={() => history.redo()}
                onDelete={remove}
                onDuplicate={duplicate}
                zoom={zoom}
                onZoom={changeZoom}
                onSave={save}
                canSave={objects.length > 0 && !saving}
              />

              <div ref={areaRef} className="overflow-x-auto rounded-3xl bg-slate-100 py-6">
                <div className="flex min-w-fit flex-col items-center gap-6 px-4">
                  {loaded.pages.map((g, i) => (
                    <EditPage key={`${loaded.id}-${i}`} index={i} geom={g} />
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {saving && <ProgressOverlay title="Menyimpan PDF…" detail="Menanam perubahan ke dalam file" pct={70} />}
              </AnimatePresence>
            </motion.div>
          </EditorContext.Provider>
        )}
      </AnimatePresence>

      <AnimatePresence>{notice && <Notice message={notice} onClose={() => setNotice(null)} />}</AnimatePresence>
    </div>
  );
}
