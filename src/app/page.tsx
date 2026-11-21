import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/hero";
import { ToolGrid } from "@/components/tool-grid";
import { AdSlot } from "@/components/ad-slot";
import { Reveal } from "@/components/motion";
import { StackingFeatures } from "@/components/stacking-features";

export default function Home() {
  return (
    <>
      <Hero />

      <section id="alat" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Alat</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Pilih alat, selesaikan kerjaan
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Alat berlabel &ldquo;Segera&rdquo; sedang kami siapkan.
            </p>
          </Reveal>
          <ToolGrid />
          <AdSlot className="mt-14" />
        </div>
      </section>

      <StackingFeatures />

      {/* Pro CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <Reveal className="bg-brand-gradient relative overflow-hidden rounded-[2rem] px-8 py-14 text-center text-white sm:px-14">
          <div aria-hidden className="bg-grid absolute inset-0 opacity-40 invert" />
          <div aria-hidden className="animate-blob absolute -left-16 -top-16 size-72 rounded-full bg-pink-400/40 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Kerja lebih lancar dengan PDF Mate Pro
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
              Tanpa iklan, file lebih besar, pemrosesan tanpa batas, dan alat Pro seperti PDF ke Word.
            </p>
            <Link
              href="/harga"
              className="group mt-8 inline-flex min-h-13 items-center gap-2 rounded-2xl bg-white px-7 font-semibold text-primary shadow-xl transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              Lihat paket Pro
              <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
