"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, Reorder, motion, useDragControls } from "motion/react";
import { ArrowDown, ArrowDownAZ, ArrowUp, FileText, GripVertical, Loader2, Lock, TriangleAlert, X } from "lucide-react";
import { UploadArea } from "../upload-area";
import { easeOut } from "../motion";
import { formatSize, toPdfFileName } from "@/lib/format";
import { inspectPdf, PdfInspectError } from "@/lib/pdf/inspect";
import { mergePdfs } from "@/lib/pdf/merge";
import { DoneCard, Notice, ProgressOverlay } from "./shared";

const MAX_FILES = 20;
const MAX_SIZE_MB = 50;

type ItemStatus = "loading" | "ready" | "locked" | "invalid";

type Item = {
  id: string;
  file: File;
  buffer: ArrayBuffer | null;
  status: ItemStatus;
  pageCount: number;
  thumb: string | null;
};

type Result = { url: string; name: string; size: number; pageCount: number };

type Phase = { kind: "edit" } | { kind: "merging"; done: number; total: number } | { kind: "done"; result: Result };

export function MergeTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: "edit" });
  const [notice, setNotice] = useState<string | null>(null);
  const [fileName, setFileName] = useState("gabungan");
  const [announce, setAnnounce] = useState("");
  const nameId = useId();

  // Keep track of object URLs so they're released when the tool unmounts.
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const set = urls.current;
    return () => set.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function update(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function load(item: Item) {
    try {
      const buffer = await item.file.arrayBuffer();
      const info = await inspectPdf(buffer);
      if (info.thumbnail) urls.current.add(info.thumbnail);
      update(item.id, { buffer, status: "ready", pageCount: info.pageCount, thumb: info.thumbnail });
    } catch (err) {
      update(item.id, { status: err instanceof PdfInspectError && err.problem === "locked" ? "locked" : "invalid" });
    }
  }

  function addFiles(files: File[]) {
    const room = MAX_FILES - items.length;
    const accepted = files.slice(0, Math.max(room, 0));
    if (files.length > accepted.length) {
      setNotice(`Maksimal ${MAX_FILES} file sekaligus. ${files.length - accepted.length} file tidak ditambahkan.`);
    }
    const next: Item[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      buffer: null,
      status: "loading",
      pageCount: 0,
      thumb: null,
    }));
    setItems((prev) => [...prev, ...next]);
    setAnnounce(`${next.length} file ditambahkan.`);
    next.forEach(load);
  }

  function remove(id: string) {
    const item = items.find((it) => it.id === id);
    if (item?.thumb) {
      URL.revokeObjectURL(item.thumb);
      urls.current.delete(item.thumb);
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (item) setAnnounce(`${item.file.name} dihapus.`);
  }

  function move(id: string, dir: -1 | 1) {
    const i = items.findIndex((it) => it.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    setAnnounce(`${items[i].file.name} dipindah ke posisi ${j + 1}.`);
  }

  function sortByName() {
    setItems((prev) => [...prev].sort((a, b) => a.file.name.localeCompare(b.file.name, "id", { numeric: true })));
    setAnnounce("File diurutkan berdasarkan nama.");
  }

  const loading = items.some((it) => it.status === "loading");
  const broken = items.filter((it) => it.status === "locked" || it.status === "invalid");
  const ready = items.filter((it) => it.status === "ready");
  const totalPages = ready.reduce((sum, it) => sum + it.pageCount, 0);
  const totalSize = items.reduce((sum, it) => sum + it.file.size, 0);
  const canMerge = items.length >= 2 && !loading && broken.length === 0;

  async function merge() {
    if (!canMerge) return;
    const sources = items.map((it) => it.buffer!);
    setPhase({ kind: "merging", done: 0, total: sources.length });
    setAnnounce("Menggabungkan file…");
    try {
      const out = await mergePdfs(sources, (done, total) => setPhase({ kind: "merging", done, total }));
      const blob = new Blob([out.bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      urls.current.add(url);
      setPhase({
        kind: "done",
        result: { url, name: toPdfFileName(fileName), size: blob.size, pageCount: out.pageCount },
      });
      setAnnounce(`Selesai. ${out.pageCount} halaman siap diunduh.`);
    } catch {
      setPhase({ kind: "edit" });
      setNotice("Maaf, terjadi kesalahan saat menggabungkan. Coba hapus file yang bermasalah lalu ulangi.");
    }
  }

  function backToEdit() {
    if (phase.kind === "done") {
      URL.revokeObjectURL(phase.result.url);
      urls.current.delete(phase.result.url);
    }
    setPhase({ kind: "edit" });
  }

  function startOver() {
    backToEdit();
    items.forEach((it) => it.thumb && URL.revokeObjectURL(it.thumb));
    setItems([]);
    setNotice(null);
    setFileName("gabungan");
  }

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <AnimatePresence mode="wait">
        {phase.kind === "done" ? (
          <DoneCard
            key="done"
            title="PDF berhasil digabung"
            meta={
              <>
                <span className="font-semibold text-foreground">{phase.result.name}</span> · {phase.result.pageCount}{" "}
                halaman · {formatSize(phase.result.size)}
              </>
            }
            href={phase.result.url}
            downloadName={phase.result.name}
            downloadLabel="Unduh PDF"
            backLabel="Ubah urutan file"
            onBack={backToEdit}
            startOverLabel="Gabung file lain"
            onStartOver={startOver}
          />
        ) : items.length === 0 ? (
          <motion.div key="empty" exit={{ opacity: 0, y: -8 }}>
            <UploadArea
              accept="application/pdf"
              acceptLabel="PDF"
              multiple
              maxSizeMb={MAX_SIZE_MB}
              onFiles={addFiles}
              onReject={setNotice}
            />
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="relative space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                <span className="hidden sm:inline">
                  Seret <GripVertical className="inline size-4 align-text-bottom" aria-hidden /> atau pakai tombol
                  panah untuk mengubah urutan.
                </span>
                <span className="sm:hidden">Pakai tombol panah untuk mengubah urutan.</span> File paling atas jadi
                halaman pertama.
              </p>
              <button
                type="button"
                onClick={sortByName}
                disabled={items.length < 2}
                className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm font-semibold transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowDownAZ className="size-4" aria-hidden /> Urutkan A–Z
              </button>
            </div>

            <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2.5">
              <AnimatePresence initial={false}>
                {items.map((item, i) => (
                  <MergeRow
                    key={item.id}
                    item={item}
                    index={i}
                    count={items.length}
                    onRemove={() => remove(item.id)}
                    onMove={(dir) => move(item.id, dir)}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>

            {items.length < MAX_FILES && (
              <UploadArea
                compact
                accept="application/pdf"
                acceptLabel="PDF"
                multiple
                maxSizeMb={MAX_SIZE_MB}
                onFiles={addFiles}
                onReject={setNotice}
              />
            )}

            <div className="glass mt-6 space-y-4 rounded-3xl p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">{items.length}</strong> file
                </span>
                <span>
                  <strong className="text-foreground">{totalPages}</strong> halaman
                </span>
                <span>
                  <strong className="text-foreground">{formatSize(totalSize)}</strong>
                </span>
              </div>

              <div>
                <label htmlFor={nameId} className="mb-1.5 block text-sm font-semibold">
                  Nama file hasil
                </label>
                <div className="flex items-center rounded-xl border border-border bg-card focus-within:border-primary">
                  <input
                    id={nameId}
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="min-h-11 w-full rounded-xl bg-transparent px-3 outline-none"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <span className="pr-3 text-sm text-muted-foreground">.pdf</span>
                </div>
              </div>

              {(broken.length > 0 || items.length < 2) && (
                <p className="flex items-start gap-2 text-sm font-medium text-amber-700">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {broken.length > 0
                    ? "Hapus file yang terkunci atau rusak sebelum menggabungkan."
                    : "Tambahkan minimal 2 file PDF untuk digabung."}
                </p>
              )}

              <motion.button
                type="button"
                onClick={merge}
                disabled={!canMerge}
                whileHover={canMerge ? { scale: 1.02 } : undefined}
                whileTap={canMerge ? { scale: 0.98 } : undefined}
                className="bg-brand-gradient inline-flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-7 text-lg font-semibold text-white shadow-xl shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden /> Membaca file…
                  </>
                ) : (
                  "Gabungkan PDF"
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {phase.kind === "merging" && (
                <ProgressOverlay
                  title="Menggabungkan PDF…"
                  detail={`File ${Math.min(phase.done + 1, phase.total)} dari ${phase.total}`}
                  pct={(phase.done / phase.total) * 100}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notice && <Notice message={notice} onClose={() => setNotice(null)} />}
      </AnimatePresence>
    </div>
  );
}

function MergeRow({
  item,
  index,
  count,
  onRemove,
  onMove,
}: {
  item: Item;
  index: number;
  count: number;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const controls = useDragControls();
  const problem = item.status === "locked" ? "Terkunci kata sandi" : item.status === "invalid" ? "Bukan PDF yang valid" : null;

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
      whileDrag={{ scale: 1.03, boxShadow: "0 20px 40px -12px rgb(79 70 229 / 0.35)", zIndex: 10 }}
      transition={{ duration: 0.3, ease: easeOut }}
      className={`relative flex items-center gap-3 rounded-2xl border bg-card p-2.5 pr-3 ${
        problem ? "border-red-200 bg-red-50/60" : "border-border"
      }`}
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        aria-label={`Seret untuk memindah ${item.file.name}`}
        className="hidden size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl text-muted-foreground hover:bg-muted active:cursor-grabbing sm:inline-flex"
      >
        <GripVertical className="size-5" aria-hidden />
      </button>

      <span className="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">{index + 1}</span>

      <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
        {item.status === "loading" ? (
          <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
        ) : item.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={item.thumb} alt="" className="h-full w-full object-contain" />
        ) : item.status === "locked" ? (
          <Lock className="size-5 text-red-500" aria-hidden />
        ) : (
          <FileText className="size-5 text-muted-foreground" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.file.name}</p>
        <p className={`text-xs ${problem ? "font-semibold text-red-600" : "text-muted-foreground"}`}>
          {problem ??
            (item.status === "loading"
              ? "Membaca…"
              : `${item.pageCount} halaman · ${formatSize(item.file.size)}`)}
        </p>
      </div>

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label={`Pindah ${item.file.name} ke atas`}
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUp className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === count - 1}
          aria-label={`Pindah ${item.file.name} ke bawah`}
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowDown className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Hapus ${item.file.name}`}
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
    </Reorder.Item>
  );
}
