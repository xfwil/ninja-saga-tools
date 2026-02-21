import type { Metadata } from "next";
import Link from "next/link";
import EudemonsTracker from "@/components/EudemonsTracker";
import { bosses, MAX_FIGHTS } from "@/data/eudemons";

export const metadata: Metadata = {
  title: "Eudemon Garden EXP Tracker — Ninja Saga Tools",
  description:
    "Hitung total EXP dari Eudemon Garden. Pilih boss yang dilawan dan berapa kali per hari.",
};

export default function EudemonsGardenPage() {
  const maxPossibleXP = bosses.reduce((sum, b) => sum + b.xp * MAX_FIGHTS, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-600 mb-8">
        <Link href="/" className="hover:text-slate-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-400">Eudemon Garden EXP Tracker</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🌸</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Eudemon Garden
              <span className="text-red-500"> EXP Tracker</span>
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Catat berapa kali kamu melawan boss hari ini dan hitung total EXP-nya.
            </p>
          </div>
        </div>

        {/* Info strip */}
        <div className="flex flex-wrap gap-4 mt-5 text-xs">
          <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2">
            <span className="text-slate-500">Total Boss</span>
            <span className="font-bold text-white">{bosses.length}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2">
            <span className="text-slate-500">Maks. lawan per boss</span>
            <span className="font-bold text-white">{MAX_FIGHTS}× / hari</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2">
            <span className="text-slate-500">EXP maks. hari ini</span>
            <span className="font-bold text-amber-400">
              {maxPossibleXP.toLocaleString("id-ID")} XP
            </span>
          </div>
        </div>
      </div>

      {/* Grade legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["C", "B", "A", "S"] as const).map((grade) => {
          const colors: Record<string, string> = {
            C: "border-slate-500 bg-slate-700 text-slate-300",
            B: "border-blue-500 bg-blue-900/50 text-blue-300",
            A: "border-amber-500 bg-amber-900/50 text-amber-300",
            S: "border-red-500 bg-red-900/50 text-red-300",
          };
          const count = bosses.filter((b) => b.grade === grade).length;
          return (
            <span
              key={grade}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${colors[grade]}`}
            >
              Grade {grade}
              <span className="opacity-60">({count} boss)</span>
            </span>
          );
        })}
      </div>

      {/* Main tracker */}
      <EudemonsTracker />
    </div>
  );
}
