import type { Metadata } from "next";
import Link from "next/link";
import ExpCalculator from "@/components/ExpCalculator";
import { MIN_LEVEL, MAX_LEVEL } from "@/data/levels";

export const metadata: Metadata = {
  title: "EXP Calculator — Ninja Saga Tools",
  description:
    "Hitung berapa XP yang dibutuhkan untuk naik dari level berapa ke level berapa, dan estimasi hari berdasarkan XP harian kamu.",
};

export default function ExpCalculatorPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-600 mb-8">
        <Link href="/" className="hover:text-slate-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-400">EXP Calculator</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">📈</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              EXP <span className="text-blue-400">Calculator</span>
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Hitung XP yang dibutuhkan untuk naik level dan estimasi waktu farmin.
            </p>
          </div>
        </div>

        {/* Info strip */}
        <div className="flex flex-wrap gap-3 mt-5 text-xs">
          <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2">
            <span className="text-slate-500">Level range</span>
            <span className="font-bold text-white">Lv. {MIN_LEVEL} – {MAX_LEVEL}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2">
            <span className="text-slate-500">XP maks. (Lv. {MAX_LEVEL})</span>
            <span className="font-bold text-blue-400">159.175.820 XP</span>
          </div>
          <Link
            href="/tools/eudemon-garden"
            className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2 hover:border-white/15 hover:text-white transition-colors"
          >
            <span className="text-slate-500">Sumber EXP harian?</span>
            <span className="font-bold text-red-400">🌸 Eudemon Garden →</span>
          </Link>
        </div>
      </div>

      {/* Calculator */}
      <ExpCalculator />
    </div>
  );
}
