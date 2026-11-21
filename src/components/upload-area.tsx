"use client";

import { useId, useState } from "react";
import { motion } from "motion/react";
import { FileUp, Plus } from "lucide-react";

type Props = {
  accept: string;
  acceptLabel: string;
  multiple: boolean;
  /** Max size per file in MB (free plan) */
  maxSizeMb?: number;
  /** Receives only files that pass the type/size check. */
  onFiles: (files: File[]) => void;
  /** Called with a message when some files were rejected, or null when all passed. */
  onReject?: (message: string | null) => void;
  /** Small "add more" button style instead of the big drop zone. */
  compact?: boolean;
};

export function matchesAccept(file: File, accept: string) {
  return accept.split(",").some((rule) => {
    const r = rule.trim().toLowerCase();
    if (r.startsWith(".")) return file.name.toLowerCase().endsWith(r);
    // Some browsers report an empty type for PDFs; fall back to the extension.
    if (r === "application/pdf" && !file.type) return file.name.toLowerCase().endsWith(".pdf");
    return file.type === r;
  });
}

export function UploadArea({ accept, acceptLabel, multiple, maxSizeMb = 50, onFiles, onReject, compact }: Props) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);

  function handle(list: FileList | null) {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    const valid = incoming.filter((f) => matchesAccept(f, accept) && f.size <= maxSizeMb * 1024 * 1024);
    onReject?.(
      valid.length < incoming.length
        ? `Beberapa file dilewati. Gunakan ${acceptLabel} dengan ukuran maksimal ${maxSizeMb} MB.`
        : null,
    );
    if (valid.length) onFiles(multiple ? valid : valid.slice(0, 1));
  }

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handle(e.dataTransfer.files);
    },
  };

  const input = (
    <input
      id={inputId}
      type="file"
      accept={accept}
      multiple={multiple}
      className="sr-only"
      onChange={(e) => {
        handle(e.target.files);
        e.target.value = "";
      }}
    />
  );

  if (compact) {
    return (
      <label
        htmlFor={inputId}
        {...dropHandlers}
        className={`flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 text-sm font-semibold transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${
          dragging
            ? "border-primary bg-primary-soft text-primary"
            : "border-border-strong text-muted-foreground hover:border-primary hover:text-primary"
        }`}
      >
        <Plus className="size-5" aria-hidden />
        {dragging ? "Lepaskan untuk menambah" : "Tambah file lagi atau seret ke sini"}
        {input}
      </label>
    );
  }

  return (
    <motion.label
      htmlFor={inputId}
      animate={{ scale: dragging ? 1.02 : 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      {...dropHandlers}
      className={`group relative flex cursor-pointer flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl border-2 border-dashed px-6 py-16 text-center transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-primary ${
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
      {input}
    </motion.label>
  );
}
