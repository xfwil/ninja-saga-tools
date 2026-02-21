"use client";

import { useState, useMemo } from "react";
import { bosses, gradeConfig, MAX_FIGHTS, type Boss } from "@/data/eudemons";
import LevelCalculator from "@/components/LevelCalculator";

type FightCounts = Record<string, number>;

function formatNumber(n: number) {
  return n.toLocaleString("id-ID");
}

export default function EudemonsTracker() {
  const [counts, setCounts] = useState<FightCounts>(() =>
    Object.fromEntries(bosses.map((b) => [b.id, MAX_FIGHTS]))
  );
  const [burnCount, setBurnCount] = useState(0);

  const setCount = (id: string, value: number) => {
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, Math.min(MAX_FIGHTS, value)) }));
  };

  const handleReset = () => {
    setCounts(Object.fromEntries(bosses.map((b) => [b.id, MAX_FIGHTS])));
    setBurnCount(0);
  };

  const handleMaxAll = () => {
    setCounts(Object.fromEntries(bosses.map((b) => [b.id, MAX_FIGHTS])));
  };

  const { xpPerRun, goldPerRun, activeBossCount } = useMemo(() => {
    let xp = 0;
    let gold = 0;
    let count = 0;
    for (const boss of bosses) {
      const n = counts[boss.id] ?? 0;
      xp += boss.xp * n;
      gold += boss.gold * n;
      if (n > 0) count++;
    }
    return { xpPerRun: xp, goldPerRun: gold, activeBossCount: count };
  }, [counts]);

  return (
    <div className="flex flex-col gap-6">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Klik <span className="text-white font-medium">+</span> untuk menambah jumlah lawan.
          Maksimal <span className="text-white font-medium">{MAX_FIGHTS}x</span> per boss per hari.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleMaxAll}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-red-700/50 hover:text-white hover:bg-red-950/30 transition-all"
          >
            Max Semua
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-white/20 hover:text-slate-300 transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Boss list */}
      <div className="flex flex-col gap-2">
        {bosses.map((boss) => (
          <BossRow
            key={boss.id}
            boss={boss}
            count={counts[boss.id] ?? 0}
            onCountChange={(v) => setCount(boss.id, v)}
          />
        ))}
      </div>

      {/* Burn / Reset multiplier */}
      <BurnCounter burnCount={burnCount} onChange={setBurnCount} />

      {/* Summary */}
      <SummaryPanel
        xpPerRun={xpPerRun}
        goldPerRun={goldPerRun}
        burnCount={burnCount}
        activeBossCount={activeBossCount}
      />

      {/* Level Calculator */}
      <LevelCalculator xpPerSession={xpPerRun * (burnCount + 1)} />
    </div>
  );
}

function BossRow({
  boss,
  count,
  onCountChange,
}: {
  boss: Boss;
  count: number;
  onCountChange: (v: number) => void;
}) {
  const cfg = gradeConfig[boss.grade];
  const subtotalXP = boss.xp * count;
  const isActive = count > 0;

  return (
    <div
      className={`group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl border px-4 py-3.5 transition-all duration-150 ${
        isActive
          ? "border-red-800/40 bg-red-950/20"
          : "border-white/5 bg-white/[0.025] hover:border-white/10"
      }`}
    >
      {/* Grade badge + Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black ${cfg.bg} ${cfg.color} ${cfg.border}`}
        >
          {cfg.label}
        </span>

        <div className="min-w-0">
          <p className={`font-semibold truncate transition-colors ${isActive ? "text-white" : "text-slate-300"}`}>
            {boss.name}
          </p>
          <p className="text-xs text-slate-600">
            Lv. {boss.lvl} &middot; {formatNumber(boss.xp)} XP / lawan
          </p>
        </div>
      </div>

      {/* Counter + Subtotal */}
      <div className="flex items-center justify-between sm:justify-end gap-4">
        {/* Subtotal */}
        <div className="text-right min-w-[90px]">
          {count > 0 ? (
            <>
              <p className="text-sm font-bold text-red-400">
                +{formatNumber(subtotalXP)} XP
              </p>
              <p className="text-[11px] text-slate-600">
                {formatNumber(boss.xp)} × {count}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-700">— XP</p>
          )}
        </div>

        {/* Counter control */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5">
          <button
            onClick={() => onCountChange(count - 1)}
            disabled={count === 0}
            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-lg leading-none font-bold"
          >
            −
          </button>

          <div className="flex items-center gap-0.5 px-1">
            {Array.from({ length: MAX_FIGHTS }).map((_, i) => (
              <button
                key={i}
                onClick={() => onCountChange(i < count ? i : i + 1)}
                className={`h-2.5 w-2.5 rounded-full transition-all duration-150 ${
                  i < count
                    ? "bg-red-500 scale-110"
                    : "bg-white/15 hover:bg-white/30"
                }`}
                title={`Set ${i + 1}x`}
              />
            ))}
          </div>

          <button
            onClick={() => onCountChange(count + 1)}
            disabled={count === MAX_FIGHTS}
            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-lg leading-none font-bold"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

const TOKEN_PER_BURN = 50;

function BurnCounter({
  burnCount,
  onChange,
}: {
  burnCount: number;
  onChange: (v: number) => void;
}) {
  const totalTokens = burnCount * TOKEN_PER_BURN;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-orange-900/40 bg-orange-950/20 px-5 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-orange-300 text-sm">
            🔥 Jumlah Burn / Reset Garden
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            0 = belum burn (1 run). Tiap +1 burn = reset dan ulang lagi dari awal.
            Total run = burn + 1, EXP dikalikan total run.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button
              onClick={() => onChange(Math.max(0, burnCount - 1))}
              disabled={burnCount <= 0}
              className="h-9 w-9 rounded-md flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-lg leading-none font-bold"
            >
              −
            </button>

            <input
              type="number"
              min={0}
              value={burnCount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 0) onChange(v);
              }}
              className="w-14 text-center bg-transparent text-xl font-black text-orange-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />

            <button
              onClick={() => onChange(burnCount + 1)}
              className="h-9 w-9 rounded-md flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all text-lg leading-none font-bold"
            >
              +
            </button>
          </div>
          <span className="text-sm font-semibold text-orange-400">
            = {burnCount + 1}× run
          </span>
        </div>
      </div>

      {/* Token cost */}
      {burnCount > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-3 border-t border-orange-900/30 text-sm">
          <span className="text-slate-500">
            Biaya token:{" "}
            <span className="font-semibold text-yellow-400">
              {totalTokens} 👛
            </span>
          </span>
          <span className="text-slate-700 text-xs">
            {burnCount} burn × {TOKEN_PER_BURN} token / burn
          </span>
        </div>
      )}
    </div>
  );
}

function SummaryPanel({
  xpPerRun,
  goldPerRun,
  burnCount,
  activeBossCount,
}: {
  xpPerRun: number;
  goldPerRun: number;
  burnCount: number;
  activeBossCount: number;
}) {
  const totalRuns = burnCount + 1;
  const totalXP = xpPerRun * totalRuns;
  const totalGold = goldPerRun * totalRuns;
  const totalTokens = burnCount * TOKEN_PER_BURN;
  const maxPossibleXP = bosses.reduce((sum, b) => sum + b.xp * MAX_FIGHTS, 0);
  const maxTotal = maxPossibleXP * totalRuns;
  const percentage = maxTotal > 0 ? Math.round((totalXP / maxTotal) * 100) : 0;

  return (
    <div className="rounded-2xl border border-red-900/40 bg-gradient-to-br from-red-950/40 to-black/60 p-6">
      {/* Breakdown row (only when burned) */}
      {burnCount > 0 && xpPerRun > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-5 pb-5 border-b border-white/5 text-sm">
          <span className="text-slate-500">
            Per run:{" "}
            <span className="text-slate-300 font-semibold">{formatNumber(xpPerRun)} XP</span>
          </span>
          <span className="text-orange-600">×</span>
          <span className="text-slate-500">
            {totalRuns} run ({burnCount} burn) ={" "}
            <span className="text-orange-300 font-semibold">{formatNumber(xpPerRun)} × {totalRuns}</span>
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-6">
        {/* Total XP */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-red-500/70 mb-1">
            Total EXP{burnCount > 0 ? ` (${totalRuns}× Run)` : " Hari Ini"}
          </p>
          <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {formatNumber(totalXP)}
            <span className="text-xl font-semibold text-red-400 ml-2">XP</span>
          </p>
          {totalXP > 0 && (
            <p className="text-sm text-slate-500 mt-1">
              {activeBossCount} boss · {burnCount > 0 ? `${burnCount} burn · ` : ""}{percentage}% dari max
            </p>
          )}
        </div>

        {/* Gold + Token */}
        <div className="flex flex-col gap-3 text-right">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500/70 mb-1">
              Total Gold
            </p>
            <p className="text-2xl font-bold text-amber-400">
              {formatNumber(totalGold)}
              <span className="text-base font-semibold text-amber-600 ml-1">G</span>
            </p>
            {burnCount > 0 && goldPerRun > 0 && (
              <p className="text-xs text-slate-600 mt-0.5">
                {formatNumber(goldPerRun)} × {totalRuns}
              </p>
            )}
          </div>
          {burnCount > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-yellow-600/70 mb-1">
                Token Habis
              </p>
              <p className="text-2xl font-bold text-yellow-400">
                {totalTokens}
                <span className="text-base font-semibold text-yellow-600 ml-1">👛</span>
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {burnCount} × {TOKEN_PER_BURN} token
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalXP > 0 && (
        <div className="mt-5">
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] text-slate-700">
            <span>0</span>
            <span>Max: {formatNumber(maxTotal)} XP ({totalRuns}× run)</span>
          </div>
        </div>
      )}

      {totalXP === 0 && (
        <p className="mt-4 text-sm text-slate-600 italic">
          Belum ada boss yang dilawan. Klik + untuk mulai tracking.
        </p>
      )}
    </div>
  );
}
