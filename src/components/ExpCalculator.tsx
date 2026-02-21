"use client";

import { useState, useMemo } from "react";
import { levelXP, xpBetween, MIN_LEVEL, MAX_LEVEL } from "@/data/levels";

function fmt(n: number) {
  return n.toLocaleString("id-ID");
}

function formatDuration(days: number): string {
  if (days <= 0) return "Sudah tercapai!";
  if (days < 1) return "< 1 hari";
  const d = Math.ceil(days);
  if (d < 7) return `${d} hari`;
  if (d < 30) {
    const w = Math.floor(d / 7);
    const r = d % 7;
    return r === 0 ? `${w} minggu` : `${w} minggu ${r} hari`;
  }
  const m = Math.floor(d / 30);
  const r = d % 30;
  return r === 0 ? `${m} bulan` : `${m} bulan ${r} hari`;
}

const LEVEL_RANGE = Array.from({ length: MAX_LEVEL - MIN_LEVEL + 1 }, (_, i) => MIN_LEVEL + i);

export default function ExpCalculator() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [targetLevel, setTargetLevel] = useState(50);
  const [progressXP, setProgressXP] = useState(0); // XP earned within current level
  const [dailyXP, setDailyXP] = useState(0);
  const [showTable, setShowTable] = useState(false);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const result = useMemo(() => {
    if (currentLevel >= targetLevel) return null;

    const neededTotal = xpBetween(currentLevel, targetLevel);
    const remaining = Math.max(0, neededTotal - progressXP);
    const daysNeeded = dailyXP > 0 ? remaining / dailyXP : null;
    const progressPct = neededTotal > 0 ? Math.min(100, Math.round((progressXP / neededTotal) * 100)) : 0;

    // level-by-level table
    const levelSteps = [];
    for (let lv = currentLevel; lv < targetLevel; lv++) {
      levelSteps.push({
        from: lv,
        to: lv + 1,
        xp: xpBetween(lv, lv + 1),
        cumulative: xpBetween(currentLevel, lv + 1),
      });
    }

    return { neededTotal, remaining, daysNeeded, progressPct, levelSteps };
  }, [currentLevel, targetLevel, progressXP, dailyXP]);

  // XP within current level = user's total XP - threshold of current level
  const currentLevelThreshold = levelXP[currentLevel] ?? 0;
  const nextLevelThreshold = levelXP[currentLevel + 1] ?? 0;
  const xpToNextLevel = nextLevelThreshold - currentLevelThreshold;

  return (
    <div className="flex flex-col gap-6">

      {/* Input section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Current level */}
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Level Sekarang</p>
          <LevelStepper
            value={currentLevel}
            onChange={(v) => {
              const c = clamp(v, MIN_LEVEL, MAX_LEVEL - 1);
              setCurrentLevel(c);
              setProgressXP(0);
              if (c >= targetLevel) setTargetLevel(Math.min(MAX_LEVEL, c + 1));
            }}
            min={MIN_LEVEL}
            max={MAX_LEVEL - 1}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-600">XP Progress dalam level ini</label>
            <input
              type="number"
              min={0}
              max={xpToNextLevel}
              value={progressXP}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setProgressXP(isNaN(v) ? 0 : clamp(v, 0, xpToNextLevel));
              }}
              placeholder="0"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-600/50 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <p className="text-[11px] text-slate-700">
              Maks: {fmt(xpToNextLevel)} XP (ke Lv. {currentLevel + 1})
            </p>
          </div>
        </div>

        {/* Target level + daily XP */}
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Level Target</p>
          <LevelStepper
            value={targetLevel}
            onChange={(v) => {
              const t = clamp(v, MIN_LEVEL + 1, MAX_LEVEL);
              setTargetLevel(t);
              if (t <= currentLevel) setCurrentLevel(Math.max(MIN_LEVEL, t - 1));
            }}
            min={MIN_LEVEL + 1}
            max={MAX_LEVEL}
            color="green"
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-600">XP per hari (opsional)</label>
            <input
              type="number"
              min={0}
              value={dailyXP === 0 ? "" : dailyXP}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setDailyXP(isNaN(v) || v < 0 ? 0 : v);
              }}
              placeholder="Masukkan XP harian kamu..."
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-green-600/50 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <p className="text-[11px] text-slate-700">Untuk estimasi hari yang dibutuhkan</p>
          </div>
        </div>
      </div>

      {/* Result */}
      {result ? (
        <div className="flex flex-col gap-4">

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Total XP Dibutuhkan"
              value={fmt(result.neededTotal)}
              unit="XP"
              color="blue"
            />
            <StatCard
              label="XP Tersisa"
              value={fmt(result.remaining)}
              unit="XP"
              color="red"
              sub={progressXP > 0 ? `Sudah: ${fmt(progressXP)} XP` : undefined}
            />
            <StatCard
              label="Jumlah Level"
              value={String(targetLevel - currentLevel)}
              unit="level"
              color="violet"
              sub={`Lv.${currentLevel} → ${targetLevel}`}
            />
            <StatCard
              label="Estimasi Waktu"
              value={result.daysNeeded !== null ? formatDuration(result.daysNeeded) : "—"}
              unit=""
              color="amber"
              sub={result.daysNeeded !== null ? `${fmt(dailyXP)} XP/hari` : "Isi XP harian"}
            />
          </div>

          {/* Progress bar */}
          {progressXP > 0 && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>Progress Lv.{currentLevel} → Lv.{targetLevel}</span>
                <span className="font-semibold text-white">{result.progressPct}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-500"
                  style={{ width: `${result.progressPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[11px] text-slate-700">
                <span>Lv. {currentLevel}</span>
                <span>Lv. {targetLevel}</span>
              </div>
            </div>
          )}

          {/* Level-by-level table toggle */}
          <div>
            <button
              onClick={() => setShowTable((p) => !p)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
            >
              <span className={`transition-transform duration-200 ${showTable ? "rotate-90" : ""}`}>▶</span>
              {showTable ? "Sembunyikan" : "Lihat"} tabel XP per level
              <span className="text-xs text-slate-700">({targetLevel - currentLevel} level)</span>
            </button>

            {showTable && (
              <div className="mt-3 rounded-xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[#0f0f17] border-b border-white/5">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Level</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">XP Level Ini</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kumulatif</th>
                        {dailyXP > 0 && (
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hari ke-</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {result.levelSteps.map((step, i) => (
                        <tr
                          key={step.from}
                          className={`border-t border-white/[0.03] ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}
                        >
                          <td className="px-4 py-2 text-slate-400">
                            <span className="text-slate-600">Lv.</span> {step.from}
                            <span className="text-slate-700 mx-1">→</span>
                            <span className="text-white font-medium">{step.to}</span>
                          </td>
                          <td className="px-4 py-2 text-right text-slate-300 font-mono text-xs">{fmt(step.xp)}</td>
                          <td className="px-4 py-2 text-right text-blue-400 font-mono text-xs">{fmt(step.cumulative)}</td>
                          {dailyXP > 0 && (
                            <td className="px-4 py-2 text-right text-amber-500 font-mono text-xs">
                              {Math.ceil(step.cumulative / dailyXP)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center text-sm text-slate-600">
          Level target harus lebih tinggi dari level sekarang.
        </div>
      )}
    </div>
  );
}

function LevelStepper({
  value,
  onChange,
  min,
  max,
  color = "blue",
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  color?: "blue" | "green";
}) {
  const textColor = color === "green" ? "text-green-300" : "text-blue-300";
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5 flex-1">
        <button
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          className="h-10 w-10 shrink-0 rounded-md flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-xl leading-none font-bold"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
          className={`flex-1 text-center bg-transparent text-2xl font-black ${textColor} outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
        <button
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          className="h-10 w-10 shrink-0 rounded-md flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-xl leading-none font-bold"
        >
          +
        </button>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] text-slate-700 leading-tight">Threshold</p>
        <p className="text-xs font-semibold text-slate-500">{fmt(levelXP[value] ?? 0)}</p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  color,
  sub,
}: {
  label: string;
  value: string;
  unit: string;
  color: "blue" | "red" | "violet" | "amber";
  sub?: string;
}) {
  const colors = {
    blue:   "text-blue-300",
    red:    "text-red-400",
    violet: "text-violet-300",
    amber:  "text-amber-300",
  };
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
      <p className="text-[11px] text-slate-600 uppercase tracking-wider mb-2 leading-tight">{label}</p>
      <p className={`text-lg font-black ${colors[color]} leading-none`}>
        {value}
        {unit && <span className="text-xs font-semibold ml-1 opacity-70">{unit}</span>}
      </p>
      {sub && <p className="text-[11px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}
