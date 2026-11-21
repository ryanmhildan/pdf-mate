"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileText, X } from "lucide-react";
import { easeOut } from "./motion";
import { UploadArea } from "./upload-area";
import { formatSize } from "@/lib/format";

type Props = {
  accept: string;
  acceptLabel: string;
  multiple: boolean;
  actionLabel: string;
  maxSizeMb?: number;
};

type Item = { id: string; file: File };

/** Placeholder workspace for tools whose processing isn't built yet. */
export function FileDropzone({ accept, acceptLabel, multiple, actionLabel, maxSizeMb = 50 }: Props) {
  const hintId = useId();
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  function addFiles(files: File[]) {
    const next = files.map((file) => ({ id: crypto.randomUUID(), file }));
    setItems((prev) => (multiple ? [...prev, ...next] : next));
  }

  return (
    <div className="space-y-4">
      {items.length === 0 || !multiple ? (
        <UploadArea
          accept={accept}
          acceptLabel={acceptLabel}
          multiple={multiple}
          maxSizeMb={maxSizeMb}
          onFiles={addFiles}
          onReject={setError}
        />
      ) : null}

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

          {multiple && (
            <UploadArea
              compact
              accept={accept}
              acceptLabel={acceptLabel}
              multiple
              maxSizeMb={maxSizeMb}
              onFiles={addFiles}
              onReject={setError}
            />
          )}

          <div className="flex justify-end">
            <button
              type="button"
              disabled
              aria-describedby={hintId}
              className="bg-brand-gradient min-h-12 rounded-xl px-7 font-semibold text-white opacity-60"
            >
              {actionLabel}
            </button>
          </div>
          <p id={hintId} className="text-right text-sm text-muted-foreground">
            Pemrosesan alat ini sedang dibangun.
          </p>
        </div>
      )}
    </div>
  );
}
