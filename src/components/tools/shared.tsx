"use client";

import { motion } from "motion/react";
import { CheckCircle2, Download, Loader2, RotateCcw, X } from "lucide-react";
import { easeOut } from "../motion";

/** Covers the workspace while a file is being processed. Place inside a `relative` parent. */
export function ProgressOverlay({ title, detail, pct }: { title: string; detail: string; pct: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute -inset-2 z-20 flex flex-col items-center justify-center gap-5 rounded-3xl bg-white/85 backdrop-blur-sm"
      role="status"
    >
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        className="bg-brand-gradient inline-flex size-14 items-center justify-center rounded-2xl text-white shadow-xl shadow-indigo-500/30"
      >
        <Loader2 className="size-7" aria-hidden />
      </motion.span>
      <div className="w-64 text-center">
        <p className="font-display text-lg font-bold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="bg-brand-gradient h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(pct)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

type DoneCardProps = {
  title: string;
  meta: React.ReactNode;
  href: string;
  downloadName: string;
  downloadLabel: string;
  backLabel: string;
  onBack: () => void;
  startOverLabel: string;
  onStartOver: () => void;
  children?: React.ReactNode;
};

/** Success state with the main download button. */
export function DoneCard({
  title,
  meta,
  href,
  downloadName,
  downloadLabel,
  backLabel,
  onBack,
  startOverLabel,
  onStartOver,
  children,
}: DoneCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="glass flex flex-col items-center gap-5 rounded-3xl px-6 py-12 text-center shadow-sm"
    >
      <motion.span
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
        className="inline-flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
      >
        <CheckCircle2 className="size-9" aria-hidden />
      </motion.span>
      <div>
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-muted-foreground">{meta}</p>
      </div>
      <motion.a
        href={href}
        download={downloadName}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="bg-brand-gradient inline-flex min-h-13 items-center gap-2 rounded-2xl px-8 text-lg font-semibold text-white shadow-xl shadow-indigo-500/30"
      >
        <Download className="size-5" aria-hidden /> {downloadLabel}
      </motion.a>
      {children}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 cursor-pointer rounded-xl border border-border bg-card px-4 text-sm font-semibold transition-colors hover:border-primary"
        >
          {backLabel}
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-4" aria-hidden /> {startOverLabel}
        </button>
      </div>
    </motion.div>
  );
}

/** Dismissible error banner. */
export function Notice({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup pesan"
        className="-m-1 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-red-100"
      >
        <X className="size-4" aria-hidden />
      </button>
    </motion.div>
  );
}
