import type { Metadata } from "next";
import Link from "next/link";
import SWRewards from "@/components/SWRewards";

export const metadata: Metadata = {
  title: "Shadow War Rewards — Ninja Saga Tools",
  description:
    "Lihat reward Shadow War per season. Data diambil dari API dan disimpan per season secara otomatis.",
};

export default function SWRewardsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-600 mb-8">
        <Link href="/" className="hover:text-slate-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-400">Shadow War Rewards</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">⚔️</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Shadow War
              <span className="text-red-500"> Rewards</span>
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Data reward Shadow War per season. Klik &quot;Cek Season Baru&quot;
              untuk fetch data terbaru dari API.
            </p>
          </div>
        </div>

        {/* Info strip */}
        <div className="flex flex-wrap gap-4 mt-5 text-xs">
          <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2">
            <span className="text-slate-500">Sumber</span>
            <span className="font-bold text-white">ninjasage.id API</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2">
            <span className="text-slate-500">Kategori</span>
            <span className="font-bold text-white">
              Squad, Winner Squad, Top Global, League
            </span>
          </div>
        </div>
      </div>

      {/* Main component */}
      <SWRewards />
    </div>
  );
}
