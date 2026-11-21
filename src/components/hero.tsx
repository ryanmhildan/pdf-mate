"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowRight, Check, Sparkles, FileText, Scissors, PenLine, Stamp, Lock, Image as ImageIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { easeOut } from "./motion";
import { HeroVisual } from "./hero-visual";

const headline = ["Semua", "alat", "PDF-mu,"];
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
const item = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: easeOut } },
};

/** Small icons scattered around the hero. depth = how strongly they follow the cursor. */
const shapes: { icon: LucideIcon; className: string; depth: number; tile: string }[] = [
  { icon: FileText, className: "left-[4%] top-[22%]", depth: 28, tile: "bg-indigo-100 text-indigo-600" },
  { icon: Scissors, className: "left-[10%] bottom-[14%]", depth: -22, tile: "bg-violet-100 text-violet-600" },
  { icon: PenLine, className: "left-[44%] top-[8%]", depth: 18, tile: "bg-pink-100 text-pink-600" },
  { icon: Stamp, className: "right-[3%] top-[12%]", depth: -30, tile: "bg-amber-100 text-amber-700" },
  { icon: ImageIcon, className: "right-[6%] bottom-[10%]", depth: 24, tile: "bg-sky-100 text-sky-600" },
  { icon: Lock, className: "left-[48%] bottom-[6%]", depth: -16, tile: "bg-rose-100 text-rose-600" },
];

function FloatingShape({
  mx,
  my,
  depth,
  icon: Icon,
  className,
  tile,
  index,
}: (typeof shapes)[number] & { mx: MotionValue<number>; my: MotionValue<number>; index: number }) {
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform(my, (v) => v * depth);
  const rotate = useTransform(mx, (v) => v * depth * 0.4);
  return (
    <motion.div style={{ x, y, rotate }} className={`absolute hidden lg:block ${className}`}>
      <motion.span
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{
          opacity: { delay: 0.6 + index * 0.08, duration: 0.5 },
          scale: { delay: 0.6 + index * 0.08, duration: 0.5, ease: easeOut },
          y: { duration: 4 + index * 0.6, repeat: Infinity, ease: "easeInOut" },
        }}
        className={`glass inline-flex size-12 items-center justify-center rounded-2xl shadow-lg shadow-indigo-500/10 ${tile}`}
      >
        <Icon className="size-5" />
      </motion.span>
    </motion.div>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Cursor position, normalized to -1..1 (center = 0), smoothed with a spring.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 90, damping: 18, mass: 0.6 });
  const my = useSpring(rawY, { stiffness: 90, damping: 18, mass: 0.6 });
  // Cursor position in px for the spotlight glow.
  const px = useMotionValue(-1000);
  const py = useMotionValue(-1000);
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${px}px ${py}px, rgb(124 58 237 / 0.14), transparent 65%)`;

  // Background blobs drift with the cursor.
  const blobAX = useTransform(mx, [-1, 1], [-50, 50]);
  const blobBX = useTransform(mx, [-1, 1], [40, -40]);

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    rawX.set((x / r.width) * 2 - 1);
    rawY.set((y / r.height) * 2 - 1);
    px.set(x);
    py.set(y);
  }

  function onPointerLeave() {
    rawX.set(0);
    rawY.set(0);
    px.set(-1000);
    py.set(-1000);
  }

  const still = Boolean(reduce);

  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative isolate -mt-[76px] overflow-hidden pt-[76px]"
    >
      {/* Background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0" />
        <motion.div style={still ? undefined : { x: blobAX }} className="absolute -left-32 top-10">
          <div className="animate-blob size-[28rem] rounded-full bg-indigo-400/30 blur-3xl" />
        </motion.div>
        <motion.div style={still ? undefined : { x: blobBX }} className="absolute -right-24 top-40">
          <div className="animate-blob size-[26rem] rounded-full bg-violet-400/25 blur-3xl [animation-delay:-6s]" />
        </motion.div>
        <div className="animate-blob absolute bottom-0 left-1/3 size-[22rem] rounded-full bg-pink-300/25 blur-3xl [animation-delay:-12s]" />
        <motion.div className="absolute inset-0" style={{ background: spotlight }} />
      </div>

      {/* Cursor-reactive floating icons */}
      {!still && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-[5]">
          {shapes.map((s, i) => (
            <FloatingShape key={i} {...s} mx={mx} my={my} index={i} />
          ))}
        </div>
      )}

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-20">
        <div>
          <motion.div variants={container} initial="hidden" animate="show" className="text-center lg:text-left">
            <motion.div variants={item}>
              <Link
                href="/edit-pdf"
                className="glass group inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-semibold text-foreground shadow-sm"
              >
                <span className="bg-brand-gradient inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs text-white">
                  <Sparkles className="size-3" aria-hidden />
                  Baru
                </span>
                Editor PDF langsung di browser
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
              </Link>
            </motion.div>

            <h1 className="mt-7 font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              {headline.map((word) => (
                <motion.span key={word} variants={item} className="mr-[0.25em] inline-block">
                  {word}
                </motion.span>
              ))}
              <motion.span variants={item} className="text-gradient inline-block">
                satu tempat.
              </motion.span>
            </h1>

            <motion.p
              variants={item}
              className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground lg:mx-0"
            >
              Gabung, pisah, edit, tanda tangani, dan konversi PDF dalam hitungan detik. Gratis, tanpa daftar, dan
              file tetap di perangkatmu.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="#alat"
                  className="bg-brand-gradient group inline-flex min-h-13 items-center gap-2 rounded-2xl px-7 font-semibold text-white shadow-xl shadow-indigo-500/30"
                >
                  Mulai sekarang, gratis
                  <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/gabung-pdf"
                  className="glass inline-flex min-h-13 items-center rounded-2xl px-7 font-semibold text-foreground shadow-sm"
                >
                  Coba Gabung PDF
                </Link>
              </motion.div>
            </motion.div>

            <motion.ul
              variants={item}
              className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground lg:justify-start"
            >
              {["Tanpa watermark", "Tanpa instal", "Diproses di browser"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                  {t}
                </li>
              ))}
            </motion.ul>
          </motion.div>
        </div>

        <HeroVisual mx={mx} my={my} still={still} />
      </div>
    </section>
  );
}
