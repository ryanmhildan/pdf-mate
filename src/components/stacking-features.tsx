"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import {
  ShieldCheck,
  Zap,
  Laptop,
  Tablet,
  Smartphone,
  BadgeCheck,
  Upload,
  MousePointerClick,
  Download,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "./motion";

type Card = {
  eyebrow: string;
  title: string;
  text: string;
  icon: LucideIcon;
  /** Card surface */
  surface: string;
  /** Icon tile */
  tile: string;
  /** Secondary text color */
  sub: string;
  visual: React.ReactNode;
};

const steps = [
  { icon: Upload, title: "Pilih file" },
  { icon: MousePointerClick, title: "Atur sesukamu" },
  { icon: Download, title: "Unduh hasilnya" },
];

const cards: Card[] = [
  {
    eyebrow: "Privasi",
    title: "File tetap di perangkatmu",
    text: "Sebagian besar alat memproses PDF langsung di browser. Dokumen penting seperti kontrak atau slip gaji tidak pernah dikirim ke server kami.",
    icon: ShieldCheck,
    surface: "bg-foreground text-white",
    tile: "bg-white/10 text-white",
    sub: "text-white/70",
    visual: (
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title }, i) => (
          <li key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/60">
              <span>0{i + 1}</span>
              <Icon className="size-4" aria-hidden />
            </div>
            <p className="mt-2 font-semibold">{title}</p>
          </li>
        ))}
      </ol>
    ),
  },
  {
    eyebrow: "Kecepatan",
    title: "Cepat, tanpa antre",
    text: "Tidak ada proses unggah dan unduh yang lama. Karena dikerjakan di perangkatmu sendiri, hasilnya siap dalam hitungan detik.",
    icon: Zap,
    surface: "bg-brand-gradient text-white",
    tile: "bg-white/15 text-white",
    sub: "text-white/80",
    visual: (
      <div className="flex items-end gap-3">
        <span className="font-display text-7xl font-bold leading-none tracking-tight">2</span>
        <span className="pb-2 text-lg font-semibold text-white/80">detik rata-rata untuk menggabung 3 file</span>
      </div>
    ),
  },
  {
    eyebrow: "Fleksibel",
    title: "Jalan di semua perangkat",
    text: "Pakai di laptop, tablet, atau ponsel. Tidak perlu memasang aplikasi apa pun, cukup buka browser.",
    icon: Laptop,
    surface: "bg-card text-foreground border border-border",
    tile: "bg-sky-100 text-sky-700",
    sub: "text-muted-foreground",
    visual: (
      <ul className="flex gap-3">
        {[
          { icon: Laptop, label: "Laptop" },
          { icon: Tablet, label: "Tablet" },
          { icon: Smartphone, label: "Ponsel" },
        ].map(({ icon: Icon, label }) => (
          <li key={label} className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-sky-50 py-5 text-sky-700">
            <Icon className="size-7" aria-hidden />
            <span className="text-sm font-semibold">{label}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    eyebrow: "Gratis",
    title: "Tanpa watermark, tanpa daftar",
    text: "Semua alat dasar bisa dipakai gratis. Hasilmu bersih tanpa tanda air, dan kamu tidak perlu membuat akun.",
    icon: BadgeCheck,
    surface: "bg-rose-50 text-foreground border border-rose-100",
    tile: "bg-rose-100 text-rose-600",
    sub: "text-muted-foreground",
    visual: (
      <div className="flex items-end gap-3">
        <span className="font-display text-7xl font-bold leading-none tracking-tight text-rose-600">Rp0</span>
        <span className="pb-2 text-lg font-semibold text-muted-foreground">untuk semua alat dasar</span>
      </div>
    ),
  },
];

function StackCard({
  card,
  index,
  total,
  progress,
  still,
}: {
  card: Card;
  index: number;
  total: number;
  progress: MotionValue<number>;
  still: boolean;
}) {
  // Each card shrinks a little once the cards after it start covering it.
  const targetScale = 1 - (total - 1 - index) * 0.05;
  const scale = useTransform(progress, [index / total, 1], [1, targetScale]);
  const Icon = card.icon;

  return (
    <li
      className="sticky mb-[18vh] last:mb-0"
      style={{ top: `calc(7rem + ${index * 1.25}rem)` }}
    >
      <motion.article
        style={still ? undefined : { scale }}
        className={`flex min-h-[420px] origin-top flex-col justify-between gap-10 overflow-hidden rounded-[2rem] p-8 shadow-2xl shadow-indigo-950/10 sm:p-10 ${card.surface}`}
      >
        <div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex size-12 items-center justify-center rounded-2xl ${card.tile}`}>
              <Icon className="size-6" aria-hidden />
            </span>
            <span className={`text-sm font-bold uppercase tracking-widest ${card.sub}`}>{card.eyebrow}</span>
          </div>
          <h3 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">{card.title}</h3>
          <p className={`mt-3 max-w-lg text-lg leading-relaxed ${card.sub}`}>{card.text}</p>
        </div>
        {card.visual}
      </motion.article>
    </li>
  );
}

export function StackingFeatures() {
  const ref = useRef<HTMLUListElement>(null);
  const still = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 sm:px-6 lg:grid-cols-[1fr_1.5fr]">
      <div className="lg:sticky lg:top-32 lg:self-start">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Kenapa PDF Mate</p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Cepat, aman, dan tanpa ribet
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
            Dibuat untuk menyelesaikan urusan PDF secepat mungkin, tanpa mengorbankan privasimu.
          </p>
        </Reveal>
      </div>

      <ul ref={ref}>
        {cards.map((card, i) => (
          <StackCard
            key={card.title}
            card={card}
            index={i}
            total={cards.length}
            progress={scrollYProgress}
            still={still}
          />
        ))}
      </ul>
    </section>
  );
}
