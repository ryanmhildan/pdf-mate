"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, FileText, Loader2, RefreshCw, Scissors } from "lucide-react";
import { UploadArea } from "../upload-area";
import { easeOut } from "../motion";
import { DoneCard, Notice, ProgressOverlay } from "./shared";
import { formatSize } from "@/lib/format";
import { openPdf, PdfInspectError, type OpenedPdf } from "@/lib/pdf/inspect";
import {
  chunkRanges,
  formatRange,
  parseRanges,
  rangeToIndices,
  selectionToRanges,
  type PageRange,
} from "@/lib/pdf/ranges";
import { splitPdf, zipFiles } from "@/lib/pdf/split";

const MAX_SIZE_MB = 50;

type Mode = "ranges" | "every" | "select";

const modes: { id: Mode; label: string; hint: string }[] = [
  { id: "ranges", label: "Rentang halaman", hint: "Tulis rentang sendiri, misalnya 1-3, 5, 8-10." },
  { id: "every", label: "Setiap N halaman", hint: "Pecah dokumen menjadi bagian dengan jumlah halaman yang sama." },
  { id: "select", label: "Pilih halaman", hint: "Klik halaman yang ingin diambil." },
];

/** Colors used to show which output file each page belongs to. */
const groupColors = [
  { ring: "ring-indigo-500", badge: "bg-indigo-500" },
  { ring: "ring-pink-500", badge: "bg-pink-500" },
  { ring: "ring-amber-500", badge: "bg-amber-500" },
  { ring: "ring-emerald-500", badge: "bg-emerald-500" },
  { ring: "ring-sky-500", badge: "bg-sky-500" },
  { ring: "ring-violet-500", badge: "bg-violet-500" },
];

type OutputFile = { name: string; indices: number[]; label: string };

type Loaded = { id: string; file: File; buffer: ArrayBuffer; pdf: OpenedPdf; base: string };

type Result = {
  download: { url: string; name: string; size: number };
  files: { url: string; name: string; size: number; label: string }[];
};

type Phase = { kind: "edit" } | { kind: "working"; done: number; total: number } | { kind: "done"; result: Result };

function baseName(fileName: string) {
  return (
    fileName
      .replace(/\.pdf$/i, "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .trim()
      .slice(0, 80) || "dokumen"
  );
}

function defaultRanges(pageCount: number) {
  if (pageCount < 2) return "1";
  const half = Math.ceil(pageCount / 2);
  return `1-${half}, ${half + 1}-${pageCount}`.replace(/(\d+)-\1(?!\d)/g, "$1");
}

export function SplitTool() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "edit" });
  const [announce, setAnnounce] = useState("");

  const [mode, setMode] = useState<Mode>("ranges");
  const [rangeInput, setRangeInput] = useState("");
  const [mergeRanges, setMergeRanges] = useState(false);
  const [everyN, setEveryN] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectAsOne, setSelectAsOne] = useState(true);

  const rangeId = useId();
  const everyId = useId();

  // Object URLs (thumbnails + results) are released on unmount.
  const urls = useRef(new Set<string>());
  const track = useCallback((u: string) => {
    urls.current.add(u);
    return u;
  }, []);

  // The open pdf.js document is closed when it's replaced (see addFiles/startOver) or on unmount.
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

  async function addFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    setLoading(true);
    setNotice(null);
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await openPdf(buffer);
      loadedRef.current?.pdf.close();
      setLoaded({ id: crypto.randomUUID(), file, buffer, pdf, base: baseName(file.name) });
      setRangeInput(defaultRanges(pdf.pageCount));
      setEveryN(1);
      setSelected(new Set());
      setMergeRanges(false);
      setAnnounce(`${file.name} dibuka, ${pdf.pageCount} halaman.`);
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

  const pageCount = loaded?.pdf.pageCount ?? 0;
  const parsed = useMemo(
    () => (mode === "ranges" && pageCount ? parseRanges(rangeInput, pageCount) : null),
    [mode, rangeInput, pageCount],
  );

  /** The files that will be produced with the current settings. */
  const outputs: OutputFile[] = useMemo(() => {
    if (!loaded) return [];
    const b = loaded.base;
    const fromRanges = (ranges: PageRange[]) =>
      ranges.map((r) => ({
        name: `${b}-hal-${r.from === r.to ? r.from : `${r.from}-${r.to}`}.pdf`,
        indices: rangeToIndices(r),
        label: `Hal. ${formatRange(r)}`,
      }));

    if (mode === "ranges") {
      if (!parsed?.ok) return [];
      if (mergeRanges) {
        return [
          {
            name: `${b}-terpilih.pdf`,
            indices: parsed.ranges.flatMap(rangeToIndices),
            label: `Hal. ${parsed.ranges.map(formatRange).join(", ")}`,
          },
        ];
      }
      return fromRanges(parsed.ranges);
    }
    if (mode === "every") return fromRanges(chunkRanges(pageCount, everyN));

    if (selected.size === 0) return [];
    const ranges = selectionToRanges(selected);
    if (selectAsOne) {
      return [
        {
          name: `${b}-terpilih.pdf`,
          indices: ranges.flatMap(rangeToIndices),
          label: `Hal. ${ranges.map(formatRange).join(", ")}`,
        },
      ];
    }
    return [...selected]
      .sort((x, y) => x - y)
      .map((p) => ({ name: `${b}-hal-${p}.pdf`, indices: [p - 1], label: `Hal. ${p}` }));
  }, [loaded, mode, parsed, mergeRanges, pageCount, everyN, selected, selectAsOne]);

  /** page number → index of the output file it lands in (first match). */
  const pageGroup = useMemo(() => {
    const map = new Map<number, number>();
    outputs.forEach((o, g) => o.indices.forEach((i) => !map.has(i + 1) && map.set(i + 1, g)));
    return map;
  }, [outputs]);

  function toggle(page: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(page)) next.delete(page);
      else next.add(page);
      return next;
    });
  }

  async function run() {
    if (!loaded || outputs.length === 0) return;
    setPhase({ kind: "working", done: 0, total: outputs.length });
    setAnnounce("Memisahkan PDF…");
    try {
      const bytes = await splitPdf(
        loaded.buffer,
        outputs.map((o) => o.indices),
        (done, total) => setPhase({ kind: "working", done, total }),
      );
      const files = bytes.map((b, i) => {
        const blob = new Blob([b as BlobPart], { type: "application/pdf" });
        return { url: track(URL.createObjectURL(blob)), name: outputs[i].name, size: blob.size, label: outputs[i].label };
      });

      let download = files[0];
      if (files.length > 1) {
        const zip = zipFiles(bytes.map((b, i) => ({ name: outputs[i].name, bytes: b })));
        const blob = new Blob([zip as BlobPart], { type: "application/zip" });
        download = { url: track(URL.createObjectURL(blob)), name: `${loaded.base}-pisah.zip`, size: blob.size, label: "" };
      }
      setPhase({ kind: "done", result: { download, files } });
      setAnnounce(`Selesai. ${files.length} file siap diunduh.`);
    } catch {
      setPhase({ kind: "edit" });
      setNotice("Maaf, terjadi kesalahan saat memisahkan PDF. Coba lagi atau gunakan file lain.");
    }
  }

  function releaseResult() {
    if (phase.kind !== "done") return;
    const { download, files } = phase.result;
    for (const u of [download.url, ...files.map((f) => f.url)]) {
      URL.revokeObjectURL(u);
      urls.current.delete(u);
    }
  }

  function backToEdit() {
    releaseResult();
    setPhase({ kind: "edit" });
  }

  function startOver() {
    releaseResult();
    setPhase({ kind: "edit" });
    loaded?.pdf.close();
    setLoaded(null);
    setNotice(null);
  }

  const rangeError = parsed && !parsed.ok ? parsed.error : null;
  const canRun = outputs.length > 0 && phase.kind === "edit";

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <AnimatePresence mode="wait">
        {phase.kind === "done" ? (
          <motion.div key="done" className="mx-auto max-w-3xl">
          <DoneCard
            title="PDF berhasil dipisah"
            meta={
              <>
                <span className="font-semibold text-foreground">{phase.result.download.name}</span> ·{" "}
                {phase.result.files.length} file · {formatSize(phase.result.download.size)}
              </>
            }
            href={phase.result.download.url}
            downloadName={phase.result.download.name}
            downloadLabel={phase.result.files.length > 1 ? "Unduh semua (ZIP)" : "Unduh PDF"}
            backLabel="Ubah pengaturan"
            onBack={backToEdit}
            startOverLabel="Pisah file lain"
            onStartOver={startOver}
          >
            {phase.result.files.length > 1 && (
              <details className="w-full max-w-md text-left">
                <summary className="cursor-pointer text-center text-sm font-semibold text-primary">
                  Atau unduh satu per satu
                </summary>
                <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
                  {phase.result.files.map((f) => (
                    <li key={f.url}>
                      <a
                        href={f.url}
                        download={f.name}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:border-primary"
                      >
                        <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                        <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
                        <span className="shrink-0 text-muted-foreground">{formatSize(f.size)}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </DoneCard>
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
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="relative grid items-start gap-6 lg:grid-cols-[1fr_340px]"
          >
            {/* Pages */}
            <div className="order-2 lg:order-1">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-5 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{loaded.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pageCount} halaman · {formatSize(loaded.file.size)}
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

              {mode === "select" && (
                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-muted-foreground">{selected.size} halaman dipilih</span>
                  <button
                    type="button"
                    onClick={() => setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)))}
                    className="min-h-9 cursor-pointer rounded-lg border border-border bg-card px-3 font-semibold hover:border-primary"
                  >
                    Pilih semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    disabled={selected.size === 0}
                    className="min-h-9 cursor-pointer rounded-lg px-3 font-semibold text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Kosongkan
                  </button>
                </div>
              )}

              <PageGrid
                key={loaded.id}
                pdf={loaded.pdf}
                pageCount={pageCount}
                selectable={mode === "select"}
                selected={selected}
                onToggle={toggle}
                pageGroup={pageGroup}
                track={track}
              />
            </div>

            {/* Options */}
            <div className="glass order-1 space-y-5 rounded-3xl p-5 shadow-sm lg:sticky lg:top-24 lg:order-2">
              <div role="radiogroup" aria-label="Cara memisah" className="grid gap-1 rounded-2xl bg-muted p-1">
                {modes.map((m) => {
                  const active = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMode(m.id)}
                      className={`relative min-h-11 cursor-pointer rounded-xl px-3 text-left text-sm font-semibold transition-colors ${
                        active ? "text-white" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="split-mode"
                          className="bg-brand-gradient absolute inset-0 rounded-xl shadow-md shadow-indigo-500/30"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      <span className="relative">{m.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">{modes.find((m) => m.id === mode)!.hint}</p>

              {mode === "ranges" && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor={rangeId} className="mb-1.5 block text-sm font-semibold">
                      Rentang halaman
                    </label>
                    <input
                      id={rangeId}
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      placeholder="Contoh: 1-3, 5, 8-10"
                      aria-invalid={!!rangeError}
                      aria-describedby={rangeError ? `${rangeId}-err` : undefined}
                      autoComplete="off"
                      spellCheck={false}
                      className={`min-h-11 w-full rounded-xl border bg-card px-3 outline-none focus:border-primary ${
                        rangeError ? "border-red-400" : "border-border"
                      }`}
                    />
                    {rangeError && (
                      <p id={`${rangeId}-err`} className="mt-1.5 text-sm font-medium text-red-600">
                        {rangeError}
                      </p>
                    )}
                  </div>
                  <Toggle checked={mergeRanges} onChange={setMergeRanges} label="Gabungkan semua rentang jadi satu PDF" />
                </div>
              )}

              {mode === "every" && (
                <div>
                  <label htmlFor={everyId} className="mb-1.5 block text-sm font-semibold">
                    Jumlah halaman per file
                  </label>
                  <input
                    id={everyId}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={pageCount}
                    value={everyN}
                    onChange={(e) =>
                      setEveryN(Math.min(Math.max(1, Number(e.target.value) || 1), Math.max(pageCount, 1)))
                    }
                    className="min-h-11 w-full rounded-xl border border-border bg-card px-3 outline-none focus:border-primary"
                  />
                </div>
              )}

              {mode === "select" && (
                <Toggle checked={selectAsOne} onChange={setSelectAsOne} label="Simpan halaman terpilih jadi satu PDF" />
              )}

              <div className="rounded-2xl border border-border bg-card p-3">
                <p className="text-sm font-semibold">
                  Hasil: {outputs.length} file{outputs.length > 1 ? " (diunduh sebagai ZIP)" : ""}
                </p>
                {outputs.length > 0 ? (
                  <ul className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                    {outputs.slice(0, 40).map((o, i) => (
                      <li
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs font-medium"
                      >
                        <span className={`size-2 rounded-full ${groupColors[i % groupColors.length].badge}`} />
                        {o.label}
                      </li>
                    ))}
                    {outputs.length > 40 && (
                      <li className="px-2 py-1 text-xs text-muted-foreground">+{outputs.length - 40} lagi</li>
                    )}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mode === "select" ? "Belum ada halaman yang dipilih." : "Perbaiki rentang halaman dulu."}
                  </p>
                )}
              </div>

              <motion.button
                type="button"
                onClick={run}
                disabled={!canRun}
                whileHover={canRun ? { scale: 1.02 } : undefined}
                whileTap={canRun ? { scale: 0.98 } : undefined}
                className="bg-brand-gradient inline-flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 text-lg font-semibold text-white shadow-xl shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <Scissors className="size-5" aria-hidden /> Pisahkan PDF
              </motion.button>
            </div>

            <AnimatePresence>
              {phase.kind === "working" && (
                <ProgressOverlay
                  title="Memisahkan PDF…"
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

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium">
      {label}
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function PageGrid({
  pdf,
  pageCount,
  selectable,
  selected,
  onToggle,
  pageGroup,
  track,
}: {
  pdf: OpenedPdf;
  pageCount: number;
  selectable: boolean;
  selected: Set<number>;
  onToggle: (page: number) => void;
  pageGroup: Map<number, number>;
  track: (url: string) => string;
}) {
  const [thumbs, setThumbs] = useState<Record<number, string | null>>({});
  const queue = useRef<Promise<void>>(Promise.resolve());
  const requested = useRef(new Set<number>());

  // Render thumbnails one at a time, only for pages that scroll into view.
  const request = useCallback(
    (page: number) => {
      if (requested.current.has(page)) return;
      requested.current.add(page);
      queue.current = queue.current.then(async () => {
        const url = await pdf.renderPage(page, 150);
        setThumbs((t) => ({ ...t, [page]: url ? track(url) : null }));
      });
    },
    [pdf, track],
  );

  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
        <PageThumb
          key={page}
          page={page}
          thumb={thumbs[page]}
          onVisible={request}
          selectable={selectable}
          isSelected={selected.has(page)}
          onToggle={onToggle}
          group={pageGroup.get(page)}
        />
      ))}
    </ul>
  );
}

function PageThumb({
  page,
  thumb,
  onVisible,
  selectable,
  isSelected,
  onToggle,
  group,
}: {
  page: number;
  thumb: string | null | undefined;
  onVisible: (page: number) => void;
  selectable: boolean;
  isSelected: boolean;
  onToggle: (page: number) => void;
  group: number | undefined;
}) {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onVisible(page);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [page, onVisible]);

  const included = group !== undefined;
  const color = included ? groupColors[group % groupColors.length] : null;

  const body = (
    <>
      <div
        className={`relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border bg-white transition-all duration-200 ${
          included ? `ring-2 ring-offset-2 ${color!.ring} border-transparent` : "border-border"
        } ${!included && !selectable ? "opacity-40" : ""}`}
      >
        {thumb === undefined ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
        ) : thumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={thumb} alt="" className="h-full w-full object-contain" />
        ) : (
          <FileText className="size-6 text-muted-foreground" aria-hidden />
        )}
        {selectable && (
          <span
            className={`absolute right-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-full border-2 transition-colors ${
              isSelected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white/90"
            }`}
          >
            {isSelected && <Check className="size-3.5" aria-hidden />}
          </span>
        )}
        {included && !selectable && (
          <span
            className={`absolute bottom-1.5 right-1.5 rounded-md px-1.5 text-[11px] font-bold text-white ${color!.badge}`}
          >
            {group + 1}
          </span>
        )}
      </div>
      <span className="mt-1.5 block text-center text-xs font-semibold text-muted-foreground">{page}</span>
    </>
  );

  return (
    <li ref={ref}>
      {selectable ? (
        <button
          type="button"
          onClick={() => onToggle(page)}
          aria-pressed={isSelected}
          aria-label={`Halaman ${page}`}
          className="block w-full cursor-pointer rounded-xl"
        >
          {body}
        </button>
      ) : (
        <div aria-label={`Halaman ${page}${included ? `, masuk file ${group + 1}` : ", tidak diambil"}`}>{body}</div>
      )}
    </li>
  );
}
