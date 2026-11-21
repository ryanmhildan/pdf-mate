import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 text-foreground" aria-label="PDF Mate, beranda">
      <svg viewBox="0 0 32 32" className="size-9 transition-transform duration-300 group-hover:-rotate-6" aria-hidden="true">
        <defs>
          <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4f46e5" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#logo-g)" />
        <rect x="12" y="7" width="12" height="15" rx="2" fill="#fff" opacity="0.45" />
        <rect x="8" y="10" width="12" height="15" rx="2" fill="#fff" />
        <path d="M11 18.5l2.2 2.2 4-4.4" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight">
        PDF<span className="text-primary">Mate</span>
      </span>
    </Link>
  );
}
