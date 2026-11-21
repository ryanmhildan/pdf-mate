import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionProvider } from "@/components/motion";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PDF Mate — Alat PDF online gratis",
    template: "%s · PDF Mate",
  },
  description:
    "Gabung, pisah, edit, tanda tangani, dan konversi PDF langsung di browser. Cepat, gratis, dan file tetap di perangkatmu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} ${sora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
        >
          Lewati ke konten
        </a>
        <MotionProvider>
          <SiteHeader />
          <main id="konten" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
