import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Clock } from "lucide-react";
import { getCategory, getTool, tools } from "@/lib/tools";
import { FileDropzone } from "@/components/file-dropzone";
import { ToolCard } from "@/components/tool-card";
import { AdSlot } from "@/components/ad-slot";
import { Reveal } from "@/components/motion";
import { PageBackdrop } from "@/components/page-backdrop";

export function generateStaticParams() {
  return tools.map((t) => ({ tool: t.slug }));
}

export async function generateMetadata(props: PageProps<"/[tool]">): Promise<Metadata> {
  const { tool: slug } = await props.params;
  const tool = getTool(slug);
  if (!tool) return {};
  return { title: tool.name, description: tool.description };
}

export default async function ToolPage(props: PageProps<"/[tool]">) {
  const { tool: slug } = await props.params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const Icon = tool.icon;
  const cat = getCategory(tool.category);
  const related = tools.filter((t) => t.category === tool.category && t.slug !== tool.slug).slice(0, 4);

  return (
    <>
      <section className="relative isolate">
        <PageBackdrop />
        <div className="mx-auto max-w-3xl px-4 pb-14 pt-8 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-10 text-sm text-muted-foreground">
            <ol className="flex items-center gap-1">
              <li>
                <Link href="/" className="hover:text-primary">Beranda</Link>
              </li>
              <ChevronRight className="size-4" aria-hidden />
              <li>
                <Link href="/#alat" className="hover:text-primary">{cat.label}</Link>
              </li>
              <ChevronRight className="size-4" aria-hidden />
              <li aria-current="page" className="font-semibold text-foreground">{tool.name}</li>
            </ol>
          </nav>

          <Reveal className="mb-10 text-center">
            <span className={`mb-5 inline-flex size-16 items-center justify-center rounded-2xl ${cat.tile}`}>
              <Icon className="size-8" aria-hidden />
            </span>
            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{tool.name}</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{tool.description}</p>
          </Reveal>

          <Reveal delay={0.1}>
            {tool.status === "soon" ? (
              <div className="glass flex flex-col items-center gap-3 rounded-3xl px-6 py-14 text-center shadow-sm">
                <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Clock className="size-7" aria-hidden />
                </span>
                <p className="font-display text-xl font-bold">Alat ini segera hadir</p>
                <p className="max-w-md text-muted-foreground">
                  Kami sedang menyiapkannya. Sementara itu, coba alat lain yang sudah tersedia.
                </p>
                <Link
                  href="/#alat"
                  className="bg-brand-gradient mt-3 inline-flex min-h-11 items-center rounded-xl px-6 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-[1.03]"
                >
                  Lihat semua alat
                </Link>
              </div>
            ) : (
              <FileDropzone
                accept={tool.accept}
                acceptLabel={tool.acceptLabel}
                multiple={tool.multiple}
                actionLabel={tool.actionLabel}
              />
            )}
          </Reveal>

          <p className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-600" aria-hidden />
            Diproses di perangkatmu. File tidak diunggah ke server.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdSlot />
      </div>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Reveal>
            <h2 className="mb-8 font-display text-2xl font-bold">Alat lain di {cat.label}</h2>
          </Reveal>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t, i) => (
              <li key={t.slug}>
                <Reveal delay={i * 0.06} className="h-full">
                  <ToolCard slug={t.slug} />
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
