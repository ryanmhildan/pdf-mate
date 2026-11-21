import type { LucideIcon } from "lucide-react";
import {
  Combine,
  Scissors,
  RotateCw,
  LayoutGrid,
  FileImage,
  Image as ImageIcon,
  FileText,
  FileType,
  PenLine,
  Signature,
  Stamp,
  ListOrdered,
  Minimize2,
  Lock,
  LockOpen,
} from "lucide-react";

export type CategoryId = "organize" | "convert" | "edit" | "optimize" | "security";

export type Category = {
  id: CategoryId;
  label: string;
  /** Tailwind classes for the icon tile */
  tile: string;
};

export const categories: Category[] = [
  { id: "organize", label: "Atur PDF", tile: "bg-cat-organize/10 text-cat-organize" },
  { id: "convert", label: "Konversi", tile: "bg-cat-convert/10 text-cat-convert" },
  { id: "edit", label: "Edit & Tanda Tangan", tile: "bg-cat-edit/10 text-cat-edit" },
  { id: "optimize", label: "Optimasi", tile: "bg-cat-optimize/10 text-cat-optimize" },
  { id: "security", label: "Keamanan", tile: "bg-cat-security/10 text-cat-security" },
];

/**
 * status:
 *  - "mvp"   → planned for the first release (processed in the browser)
 *  - "soon"  → later release (may need server processing)
 */
export type ToolStatus = "mvp" | "soon";

export type Tool = {
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  icon: LucideIcon;
  status: ToolStatus;
  /** Requires Pro plan */
  pro?: boolean;
  /** Accepted input for the upload zone */
  accept: string;
  acceptLabel: string;
  multiple: boolean;
  actionLabel: string;
};

const PDF = "application/pdf";

export const tools: Tool[] = [
  {
    slug: "gabung-pdf",
    name: "Gabung PDF",
    description: "Satukan beberapa file PDF menjadi satu dengan urutan sesukamu.",
    category: "organize",
    icon: Combine,
    status: "mvp",
    accept: PDF,
    acceptLabel: "PDF",
    multiple: true,
    actionLabel: "Gabungkan PDF",
  },
  {
    slug: "pisah-pdf",
    name: "Pisah PDF",
    description: "Pisahkan halaman tertentu atau pecah PDF menjadi beberapa file.",
    category: "organize",
    icon: Scissors,
    status: "mvp",
    accept: PDF,
    acceptLabel: "PDF",
    multiple: false,
    actionLabel: "Pisahkan PDF",
  },
  {
    slug: "atur-halaman",
    name: "Atur Halaman",
    description: "Urutkan ulang, hapus, atau duplikasi halaman dengan drag & drop.",
    category: "organize",
    icon: LayoutGrid,
    status: "mvp",
    accept: PDF,
    acceptLabel: "PDF",
    multiple: false,
    actionLabel: "Simpan perubahan",
  },
  {
    slug: "putar-pdf",
    name: "Putar PDF",
    description: "Putar satu halaman atau semua halaman PDF sekaligus.",
    category: "organize",
    icon: RotateCw,
    status: "mvp",
    accept: PDF,
    acceptLabel: "PDF",
    multiple: true,
    actionLabel: "Putar PDF",
  },
  {
    slug: "gambar-ke-pdf",
    name: "Gambar ke PDF",
    description: "Ubah JPG, PNG, atau WebP menjadi satu dokumen PDF.",
    category: "convert",
    icon: FileImage,
    status: "mvp",
    accept: "image/jpeg,image/png,image/webp",
    acceptLabel: "JPG, PNG, WebP",
    multiple: true,
    actionLabel: "Buat PDF",
  },
  {
    slug: "pdf-ke-gambar",
    name: "PDF ke Gambar",
    description: "Simpan setiap halaman PDF sebagai gambar JPG atau PNG.",
    category: "convert",
    icon: ImageIcon,
    status: "mvp",
    accept: PDF,
    acceptLabel: "PDF",
    multiple: false,
    actionLabel: "Konversi ke gambar",
  },
  {
    slug: "word-ke-pdf",
    name: "Word ke PDF",
    description: "Konversi dokumen DOC dan DOCX menjadi PDF yang rapi.",
    category: "convert",
    icon: FileText,
    status: "soon",
    accept: ".doc,.docx",
    acceptLabel: "DOC, DOCX",
    multiple: true,
    actionLabel: "Konversi ke PDF",
  },
  {
    slug: "pdf-ke-word",
    name: "PDF ke Word",
    description: "Ubah PDF menjadi dokumen Word yang bisa diedit.",
    category: "convert",
    icon: FileType,
    status: "soon",
    pro: true,
    accept: PDF,
    acceptLabel: "PDF",
    multiple: false,
    actionLabel: "Konversi ke Word",
  },
  {
    slug: "edit-pdf",
    name: "Edit PDF",
    description: "Tambahkan teks, gambar, bentuk, highlight, dan whiteout ke PDF.",
    category: "edit",
    icon: PenLine,
    status: "mvp",
    accept: PDF,
    acceptLabel: "PDF",
    multiple: false,
    actionLabel: "Buka editor",
  },
  {
    slug: "tanda-tangan-pdf",
    name: "Tanda Tangan PDF",
    description: "Gambar atau unggah tanda tanganmu lalu tempel di dokumen.",
    category: "edit",
    icon: Signature,
    status: "mvp",
    accept: PDF,
    acceptLabel: "PDF",
    multiple: false,
    actionLabel: "Tanda tangani",
  },
  {
    slug: "watermark-pdf",
    name: "Watermark",
    description: "Cap teks atau logo di atas halaman PDF.",
    category: "edit",
    icon: Stamp,
    status: "soon",
    accept: PDF,
    acceptLabel: "PDF",
    multiple: false,
    actionLabel: "Tambah watermark",
  },
  {
    slug: "nomor-halaman",
    name: "Nomor Halaman",
    description: "Beri nomor halaman dengan posisi dan format pilihanmu.",
    category: "edit",
    icon: ListOrdered,
    status: "soon",
    accept: PDF,
    acceptLabel: "PDF",
    multiple: false,
    actionLabel: "Tambah nomor",
  },
  {
    slug: "kompres-pdf",
    name: "Kompres PDF",
    description: "Perkecil ukuran file PDF tanpa mengorbankan kualitas terlalu jauh.",
    category: "optimize",
    icon: Minimize2,
    status: "soon",
    accept: PDF,
    acceptLabel: "PDF",
    multiple: true,
    actionLabel: "Kompres PDF",
  },
  {
    slug: "kunci-pdf",
    name: "Kunci PDF",
    description: "Lindungi PDF dengan kata sandi agar tidak dibuka sembarang orang.",
    category: "security",
    icon: Lock,
    status: "soon",
    pro: true,
    accept: PDF,
    acceptLabel: "PDF",
    multiple: false,
    actionLabel: "Kunci PDF",
  },
  {
    slug: "buka-kunci-pdf",
    name: "Buka Kunci PDF",
    description: "Hapus kata sandi dari PDF milikmu yang sudah kamu ketahui sandinya.",
    category: "security",
    icon: LockOpen,
    status: "soon",
    pro: true,
    accept: PDF,
    acceptLabel: "PDF",
    multiple: false,
    actionLabel: "Buka kunci",
  },
];

export function getTool(slug: string) {
  return tools.find((t) => t.slug === slug);
}

export function getCategory(id: CategoryId) {
  return categories.find((c) => c.id === id)!;
}
