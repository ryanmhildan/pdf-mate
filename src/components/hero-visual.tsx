"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { Combine, FileText, Download, ShieldCheck, Zap } from "lucide-react";
import { easeOut } from "./motion";

const files = [
  { name: "laporan-q3.pdf", size: "2,4 MB", color: "bg-indigo-500" },
  { name: "lampiran.pdf", size: "860 KB", color: "bg-violet-500" },
  { name: "kontrak-final.pdf", size: "1,1 MB", color: "bg-pink-500" },
];

const LOOP = 6; // seconds per cycle

/** Decorative looping demo of the merge flow. Hidden from assistive tech. */
type Props = { mx: MotionValue<number>; my: MotionValue<number>; still: boolean };

export function HeroVisual({ mx, my, still }: Props) {
  // 3D tilt of the window and counter-movement of the badges, driven by the cursor.
  const rotateY = useTransform(mx, [-1, 1], [-12, 12]);
  const rotateX = useTransform(my, [-1, 1], [10, -10]);
  const badgeAX = useTransform(mx, [-1, 1], [-26, 26]);
  const badgeAY = useTransform(my, [-1, 1], [-20, 20]);
  const badgeBX = useTransform(mx, [-1, 1], [30, -30]);
  const badgeBY = useTransform(my, [-1, 1], [22, -22]);
  const glareX = useTransform(mx, [-1, 1], ["0%", "100%"]);

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, y: 40, rotate: 2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: easeOut }}
      className="relative mx-auto w-full max-w-md [perspective:1200px]"
    >
      {/* Main window */}
      <motion.div
        style={still ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="glass relative overflow-hidden rounded-3xl p-5 shadow-2xl shadow-indigo-500/15"
      >
        {!still && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(105deg, transparent 35%, rgb(255 255 255 / 0.55) 50%, transparent 65%)",
              backgroundSize: "250% 100%",
              backgroundPositionX: glareX,
            }}
          />
        )}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-brand-gradient inline-flex size-8 items-center justify-center rounded-lg text-white">
              <Combine className="size-4" />
            </span>
            <span className="font-display font-bold">Gabung PDF</span>
          </div>
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-slate-300" />
            <span className="size-2.5 rounded-full bg-slate-300" />
            <span className="size-2.5 rounded-full bg-slate-300" />
          </div>
        </div>

        <ul className="space-y-2.5">
          {files.map((f, i) => (
            <motion.li
              key={f.name}
              animate={{ opacity: [0, 1, 1, 0], x: [-24, 0, 0, 0], y: [0, 0, 0, -8] }}
              transition={{
                duration: LOOP,
                times: [0, 0.12, 0.78, 0.9],
                delay: i * 0.25,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white px-3 py-2.5"
            >
              <span className={`inline-flex size-9 items-center justify-center rounded-xl text-white ${f.color}`}>
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.size}</p>
              </div>
            </motion.li>
          ))}
        </ul>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="bg-brand-gradient h-full origin-left rounded-full"
            animate={{ scaleX: [0, 0, 1, 1, 0] }}
            transition={{ duration: LOOP, times: [0, 0.3, 0.65, 0.95, 1], repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.9, 0.9, 1, 1, 0.95] }}
          transition={{ duration: LOOP, times: [0, 0.62, 0.7, 0.92, 1], repeat: Infinity }}
          className="mt-4 flex items-center justify-between rounded-2xl bg-foreground px-4 py-3 text-white"
        >
          <span className="text-sm font-semibold">hasil-gabungan.pdf</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold">
            <Download className="size-3.5" /> Unduh
          </span>
        </motion.div>
      </motion.div>

      {/* Floating badges */}
      <motion.div
        style={still ? undefined : { x: badgeAX, y: badgeAY }}
        className="absolute -left-2 -top-6 sm:-left-12"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="glass flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold shadow-lg"
        >
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <ShieldCheck className="size-4" />
          </span>
          100% di browser
        </motion.div>
      </motion.div>
      <motion.div
        style={still ? undefined : { x: badgeBX, y: badgeBY }}
        className="absolute -bottom-6 -right-2 sm:-right-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="glass flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold shadow-lg"
        >
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Zap className="size-4" />
          </span>
          Selesai dalam 2 detik
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
