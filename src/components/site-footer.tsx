import Link from "next/link";
import { categories, tools } from "@/lib/tools";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Alat PDF serba bisa yang berjalan di browsermu. Cepat, gratis, dan file tetap di perangkatmu.
          </p>
        </div>

        {categories.slice(0, 3).map((cat) => (
          <div key={cat.id}>
            <h2 className="mb-4 text-sm font-bold text-foreground">{cat.label}</h2>
            <ul className="space-y-2.5">
              {tools
                .filter((t) => t.category === cat.id)
                .map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/${t.slug}`}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="mb-4 text-sm font-bold text-foreground">PDF Mate</h2>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link href="/harga" className="transition-colors hover:text-primary">Harga</Link></li>
            <li><Link href="/privasi" className="transition-colors hover:text-primary">Privasi</Link></li>
            <li><Link href="/syarat" className="transition-colors hover:text-primary">Syarat layanan</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p
          aria-hidden
          className="select-none bg-linear-to-b from-indigo-100 to-transparent bg-clip-text text-center font-display text-[clamp(4rem,16vw,12rem)] font-extrabold leading-none tracking-tighter text-transparent"
        >
          PDF Mate
        </p>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-muted-foreground sm:px-6">
          © 2026 PDF Mate. Hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
