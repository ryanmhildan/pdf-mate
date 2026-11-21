"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X, Sparkles } from "lucide-react";
import { Logo } from "./logo";
import { easeOut } from "./motion";

const nav = [
  { href: "/#alat", label: "Semua alat" },
  { href: "/gabung-pdf", label: "Gabung PDF" },
  { href: "/edit-pdf", label: "Edit PDF" },
  { href: "/harga", label: "Harga" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const pathname = usePathname();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: easeOut }}
        className={`mx-auto max-w-6xl rounded-2xl transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled || open ? "glass shadow-lg shadow-indigo-500/5" : "border border-transparent"
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-4 px-4">
          <Logo />

          <nav aria-label="Navigasi utama" className="hidden md:block" onMouseLeave={() => setHovered(null)}>
            <ul className="flex items-center gap-1">
              {nav.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href} className="relative" onMouseEnter={() => setHovered(item.href)}>
                    {hovered === item.href && (
                      <motion.span
                        layoutId="nav-hover"
                        className="absolute inset-0 rounded-xl bg-primary-soft"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative block rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors duration-150 ${
                        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/masuk"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-primary-soft"
            >
              Masuk
            </Link>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/harga"
                className="bg-brand-gradient inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25"
              >
                <Sparkles className="size-4" aria-hidden />
                Coba Pro
              </Link>
            </motion.div>
          </div>

          <button
            type="button"
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xl text-foreground hover:bg-primary-soft md:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "x" : "menu"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              id="menu-mobile"
              aria-label="Navigasi seluler"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: easeOut }}
              className="overflow-hidden md:hidden"
            >
              <ul className="flex flex-col gap-1 px-3 pb-4">
                {nav.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.25 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-3 font-semibold text-foreground hover:bg-primary-soft"
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
                <li className="mt-2 grid grid-cols-2 gap-2">
                  <Link
                    href="/masuk"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-border bg-card px-4 py-3 text-center font-semibold"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/harga"
                    onClick={() => setOpen(false)}
                    className="bg-brand-gradient rounded-xl px-4 py-3 text-center font-semibold text-white"
                  >
                    Coba Pro
                  </Link>
                </li>
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
}
