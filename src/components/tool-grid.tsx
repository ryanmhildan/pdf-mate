"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { categories, tools, type CategoryId } from "@/lib/tools";
import { ToolCard } from "./tool-card";
import { easeOut } from "./motion";

type Filter = "all" | CategoryId;

export function ToolGrid() {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = filter === "all" ? tools : tools.filter((t) => t.category === filter);

  const options: { id: Filter; label: string }[] = [
    { id: "all", label: "Semua" },
    ...categories.map((c) => ({ id: c.id, label: c.label })),
  ];

  return (
    <div>
      <div
        role="group"
        aria-label="Saring kategori alat"
        className="glass mx-auto mb-10 flex w-fit max-w-full flex-wrap justify-center gap-1 rounded-2xl p-1.5 shadow-sm"
      >
        {options.map((o) => {
          const active = filter === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(o.id)}
              className={`relative min-h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold transition-colors duration-200 ${
                active ? "text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="filter-pill"
                  className="bg-brand-gradient absolute inset-0 rounded-xl shadow-md shadow-indigo-500/30"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{o.label}</span>
            </button>
          );
        })}
      </div>

      <motion.ul layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {visible.map((tool, i) => (
            <motion.li
              key={tool.slug}
              layout
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: Math.min(i, 8) * 0.05, ease: easeOut }}
            >
              <ToolCard slug={tool.slug} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
