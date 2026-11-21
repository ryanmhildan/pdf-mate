"use client";

import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileUp, FileText, X, Plus } from "lucide-react";
import { easeOut } from "./motion";

type Props = {
  accept: string;
  acceptLabel: string;
  multiple: boolean;
  actionLabel: string;
  /** Max size per file in MB (free plan) */
  maxSizeMb?: number;
};

type Item = { id: string; file: File };

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function matchesAccept(file: File, accept: string) {
  return accept.split(",").some((rule) => {
    const r = rule.trim().toLowerCase();
    if (r.startsWith(".")) return file.name.toLowerCase().endsWith(r);
    return file.type === r;
  });
}

export function FileDropzone({ accept, acceptLabel, multiple, actionLabel, maxSizeMb = 50 }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const valid = incoming.filter((f) => matchesAccept(f, accept) && f.size <= maxSizeMb * 1024 * 1024);
    setError(
      valid.length < incoming.length
        ? `Beberapa file dilewati. Gunakan ${acceptLabel} dengan ukuran maksimal ${maxSizeMb} MB.`
        : null,
    );
    const next = valid.map((file) => ({ id: crypto.randomUUID(), file }));
    setItems((prev) => (multiple ? [...prev, ...next] : next.slice(0, 1)));
  }

  return (
    <div className="space-y-4">
      <motion.label
        htmlFor={inputId}
        animate={{ scale: dragging ? 1.02 : 1 }}
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl border-2 border-dashed px-6 py-16 text-center transition-colors duration-200 ${
          dragging ? "border-primary bg-primary-soft" : "glass border-border-strong hover:border-primary"
        }`}
      >
        <motion.span
          animate={{ y: dragging ? -6 : [0, -6, 0] }}
          transition={dragging ? { duration: 0.2 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="bg-brand-gradient inline-flex size-16 items-center justify-center rounded-2xl text-white shadow-xl shadow-indigo-500/30"
        >
          <FileUp className="size-8" aria-hidden />
        </motion.span>
        <span>
          <span className="block font-display text-xl font-bold text-foreground">
            {dragging ? "Lepaskan di sini" : `${multiple ? "Pilih file" : "Pilih satu file"} atau seret ke sini`}
          </span>
          <span className="mt-1.5 block text-sm text-muted-foreground">
            {acceptLabel} · maks. {maxSizeMb} MB per file
          </span>
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </motion.label>

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm font-medium text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {items.length > 0 && (
        <div className="space-y-4">
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map(({ id, file }) => (
                <motion.li
                  key={id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <FileText className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{file.name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">{formatSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((it) => it.id !== id))}
                    aria-label={`Hapus ${file.name}`}
                    className="inline-flex size-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            {multiple ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-5 font-semibold transition-colors hover:border-primary"
              >
                <Plus className="size-4" aria-hidden /> Tambah file
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              disabled
              aria-describedby={`${inputId}-hint`}
              className="bg-brand-gradient min-h-12 rounded-xl px-7 font-semibold text-white opacity-60"
            >
              {actionLabel}
            </button>
          </div>
          <p id={`${inputId}-hint`} className="text-right text-sm text-muted-foreground">
            Pemrosesan alat ini sedang dibangun.
          </p>
        </div>
      )}
    </div>
  );
}
