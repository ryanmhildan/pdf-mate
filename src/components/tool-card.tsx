"use client";

import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { getCategory, getTool } from "@/lib/tools";

export function ToolCard({ slug }: { slug: string }) {
  const tool = getTool(slug)!;
  const Icon = tool.icon;
  const cat = getCategory(tool.category);
  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);
  const spotlight = useMotionTemplate`radial-gradient(240px circle at ${mx}px ${my}px, rgb(99 102 241 / 0.12), transparent 70%)`;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      onMouseLeave={() => {
        mx.set(-200);
        my.set(-200);
      }}
      className="group relative h-full rounded-3xl border border-border bg-card transition-[border-color,box-shadow] duration-300 hover:border-border-strong hover:shadow-xl hover:shadow-indigo-500/10"
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl" style={{ background: spotlight }} />
      <Link href={`/${tool.slug}`} className="relative flex h-full flex-col gap-4 rounded-3xl p-6">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`inline-flex size-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${cat.tile}`}
          >
            <Icon className="size-6" aria-hidden />
          </span>
          <div className="flex items-center gap-1">
            {tool.pro && (
              <span className="bg-brand-gradient rounded-full px-2.5 py-0.5 text-xs font-semibold text-white">Pro</span>
            )}
            {tool.status === "soon" && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                Segera
              </span>
            )}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold text-foreground">{tool.name}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:opacity-100">
          Buka alat <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </Link>
    </motion.div>
  );
}
