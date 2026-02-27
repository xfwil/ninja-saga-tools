"use client";

import { useState, useMemo } from "react";
import { levelXP, xpBetween, MIN_LEVEL, MAX_LEVEL } from "@/data/levels";

function formatNumber(n: number) {
  return n.toLocaleString("id-ID");
}

function parseLocalizedNumber(value: string): number {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return 0;
  const parsed = Number.parseInt(digitsOnly, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDays(days: number): string {
  if (days < 1) return "< 1 hari";
  if (days === 1) return "1 hari";
  if (days < 30) return `${days} hari`;
  const months = Math.floor(days / 30);
  const remaining = days % 30;
  if (remaining === 0) return `${months} bulan`;
  return `${months} bulan ${remaining} hari`;
}

export default function LevelCalculator({ xpPerSession }: { xpPerSession: number }) {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [targetLevel, setTargetLevel] = useState(10);
  const [currentXP, setCurrentXP] = useState(0);

  const result = useMemo(() => {
    if (currentLevel >= targetLevel) return null;
    const needed = xpBetween(currentLevel, targetLevel);
    const remaining = Math.max(0, needed - currentXP);
    const sessionsNeeded = xpPerSession > 0 ? Math.ceil(remaining / xpPerSession) : null;
    const progress = needed > 0 ? Math.min(100, Math.round((currentXP / needed) * 100)) : 0;
    return { needed, remaining, sessionsNeeded, progress };
  }, [currentLevel, targetLevel, currentXP, xpPerSession]);

  const clampLevel = (v: number) => Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, v));

  return (
    <div className="rounded-2xl border border-violet-900/40 bg-gradient-to-br from-violet-950/30 to-black/60 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">🎯</span>
        <div>
          <h3 className="font-bold text-white text-base">Level Target Calculator</h3>
          <p className="text-xs text-slate-500">Hitung XP yang dibutuhkan untuk naik level</p>
        </div>
      </div>

      {/* Input grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {/* Current Level */}
        <LevelInput
          label="Level Sekarang"
          value={currentLevel}
          onChange={(v) => {
            const clamped = clampLevel(v);
            setCurrentLevel(clamped);
            if (clamped >= targetLevel) setTargetLevel(Math.min(MAX_LEVEL, clamped + 1));
          }}
          min={MIN_LEVEL}
          max={MAX_LEVEL - 1}
          color="violet"
        />

        {/* Target Level */}
        <LevelInput
          label="Level Target"
          value={targetLevel}
          onChange={(v) => {
            const clamped = clampLevel(v);
            setTargetLevel(clamped);
            if (clamped <= currentLevel) setCurrentLevel(Math.max(MIN_LEVEL, clamped - 1));
          }}
          min={MIN_LEVEL + 1}
          max={MAX_LEVEL}
          color="violet"
        />

        {/* Current XP owned */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            XP Saat Ini
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={currentXP === 0 ? "" : formatNumber(currentXP)}
            onChange={(e) => {
              setCurrentXP(parseLocalizedNumber(e.target.value));
            }}
            placeholder="0"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-600/60 focus:bg-violet-950/20 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <p className="text-[11px] text-slate-700">XP yang sudah kamu punya sekarang</p>
        </div>
      </div>

      {/* Result */}
      {result ? (
        <div className="space-y-4">
          {/* XP needed breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatBox
              label="Total XP Dibutuhkan"
              value={`${formatNumber(result.needed)} XP`}
              sub={`Lv. ${currentLevel} → ${targetLevel}`}
              color="violet"
            />
            <StatBox
              label="XP Tersisa"
              value={`${formatNumber(result.remaining)} XP`}
              sub={currentXP > 0 ? `Sudah punya ${formatNumber(currentXP)} XP` : "Belum punya XP"}
              color="red"
            />
            {result.sessionsNeeded !== null ? (
              <StatBox
                label="Estimasi Sesi"
                value={`${formatNumber(result.sessionsNeeded)} sesi`}
                sub={formatDays(result.sessionsNeeded)}
                color="amber"
              />
            ) : (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center justify-center text-center">
                <p className="text-xs text-slate-600">Set boss & burn dulu untuk estimasi sesi</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {currentXP > 0 && (
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                <span>Progress menuju Lv. {targetLevel}</span>
                <span>{result.progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-700 to-violet-400 transition-all duration-500"
                  style={{ width: `${result.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* XP per session note */}
          {xpPerSession > 0 && (
            <p className="text-xs text-slate-600 border-t border-white/5 pt-3">
              Berdasarkan setting saat ini:{" "}
              <span className="text-slate-400 font-medium">{formatNumber(xpPerSession)} XP / sesi</span>
              {result.sessionsNeeded !== null && result.sessionsNeeded > 0 && (
                <> · butuh <span className="text-violet-400 font-medium">{formatNumber(result.sessionsNeeded)} sesi</span> lagi</>
              )}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-600 italic">
          Level target harus lebih tinggi dari level sekarang.
        </p>
      )}
    </div>
  );
}

function LevelInput({
  label,
  value,
  onChange,
  min,
  max,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  color: string;
}) {
  const borderFocus = color === "violet" ? "focus:border-violet-600/60 focus:bg-violet-950/20" : "";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="h-9 w-9 shrink-0 rounded-md flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-lg leading-none font-bold"
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
          className={`flex-1 min-w-0 text-center bg-transparent text-lg font-black text-white outline-none ${borderFocus} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="h-9 w-9 shrink-0 rounded-md flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-lg leading-none font-bold"
        >
          +
        </button>
      </div>
      <p className="text-[11px] text-slate-700">
        XP threshold: {formatNumber(levelXP[value] ?? 0)}
      </p>
    </div>
  );
}

function StatBox({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: "violet" | "red" | "amber";
}) {
  const colors = {
    violet: "text-violet-300",
    red: "text-red-400",
    amber: "text-amber-300",
  };
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <p className="text-[11px] text-slate-600 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-base font-bold ${colors[color]}`}>{value}</p>
      <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>
    </div>
  );
}
