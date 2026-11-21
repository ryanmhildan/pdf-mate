import Link from "next/link";
import { Reveal } from "./motion";
import { PageBackdrop } from "./page-backdrop";

export function PlaceholderPage({ title, text }: { title: string; text: string }) {
  return (
    <section className="relative isolate">
      <PageBackdrop />
      <Reveal className="mx-auto max-w-2xl px-4 py-28 text-center sm:px-6">
        <h1 className="font-display text-5xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{text}</p>
        <Link
          href="/"
          className="bg-brand-gradient mt-8 inline-flex min-h-12 items-center rounded-2xl px-6 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-[1.03]"
        >
          Kembali ke beranda
        </Link>
      </Reveal>
    </section>
  );
}
