import type { Metadata } from "next";
import Link from "next/link";
import Encyclopedia from "@/components/Encyclopedia";

export const metadata: Metadata = {
  title: "Encyclopedia — Ninja Saga Tools",
  description:
    "Lihat semua Skills, Talents, dan Senjutsu di Ninja Saga. Cari, filter berdasarkan tipe, level, dan harga.",
};

export default function EncyclopediaPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-600 mb-8">
        <Link href="/" className="hover:text-slate-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-400">Encyclopedia</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">📖</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Ninja Saga
              <span className="text-red-500"> Encyclopedia</span>
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Database lengkap Skills, Talents, dan Senjutsu. Cari dan filter sesuai kebutuhanmu.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <Encyclopedia />
    </div>
  );
}
