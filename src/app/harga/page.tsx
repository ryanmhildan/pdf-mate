import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Reveal } from "@/components/motion";
import { PageBackdrop } from "@/components/page-backdrop";

export const metadata: Metadata = {
  title: "Harga",
  description: "Pakai PDF Mate gratis, atau upgrade ke Pro untuk tanpa iklan dan fitur lebih lengkap.",
};

const plans = [
  {
    name: "Gratis",
    price: "Rp0",
    period: "selamanya",
    description: "Untuk kebutuhan PDF sehari-hari.",
    features: ["Semua alat dasar", "File hingga 50 MB", "Diproses di perangkat", "Didukung iklan"],
    cta: { label: "Mulai sekarang", href: "/#alat" },
    highlight: false,
  },
  {
    name: "Pro",
    price: "Rp49.000",
    period: "per bulan",
    description: "Untuk kamu yang sering bekerja dengan PDF.",
    features: [
      "Tanpa iklan",
      "File hingga 500 MB",
      "Pemrosesan tanpa batas",
      "Alat Pro: PDF ke Word, Kunci PDF, OCR",
      "Dukungan prioritas",
    ],
    cta: { label: "Upgrade ke Pro", href: "/masuk" },
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <section className="relative isolate">
      <PageBackdrop />
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-14 sm:px-6">
        <Reveal className="mb-14 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Harga</p>
          <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
            Pilih paket yang <span className="text-gradient">pas</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">Mulai gratis. Upgrade kapan saja, batalkan kapan saja.</p>
        </Reveal>

        <div className="grid items-stretch gap-6 md:grid-cols-2">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.12} className="h-full">
              <div
                className={`relative flex h-full flex-col rounded-[2rem] p-8 transition-transform duration-300 hover:-translate-y-1 ${
                  p.highlight
                    ? "bg-foreground text-white shadow-2xl shadow-indigo-500/25"
                    : "glass shadow-sm"
                }`}
              >
                {p.highlight && (
                  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
                    <div className="animate-blob absolute -right-16 -top-16 size-64 rounded-full bg-indigo-500/40 blur-3xl" />
                    <div className="animate-blob absolute -bottom-20 -left-10 size-56 rounded-full bg-violet-500/30 blur-3xl [animation-delay:-7s]" />
                  </div>
                )}
                <div className="relative flex h-full flex-col">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold">{p.name}</h2>
                    {p.highlight && (
                      <span className="bg-brand-gradient inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white">
                        <Sparkles className="size-3" aria-hidden /> Paling populer
                      </span>
                    )}
                  </div>
                  <p className={`mt-2 ${p.highlight ? "text-white/70" : "text-muted-foreground"}`}>{p.description}</p>
                  <p className="mt-8">
                    <span className="font-display text-5xl font-extrabold">{p.price}</span>{" "}
                    <span className={p.highlight ? "text-white/70" : "text-muted-foreground"}>/ {p.period}</span>
                  </p>
                  <ul className="mt-8 flex-1 space-y-3.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full ${
                            p.highlight ? "bg-white/15 text-white" : "bg-primary-soft text-primary"
                          }`}
                        >
                          <Check className="size-3.5" aria-hidden />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={p.cta.href}
                    className={`mt-10 inline-flex min-h-13 items-center justify-center rounded-2xl px-6 font-semibold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                      p.highlight
                        ? "bg-brand-gradient text-white shadow-lg shadow-indigo-500/40"
                        : "border border-border bg-card text-foreground hover:border-primary"
                    }`}
                  >
                    {p.cta.label}
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Harga masih contoh dan bisa berubah sebelum peluncuran.
        </p>
      </div>
    </section>
  );
}
