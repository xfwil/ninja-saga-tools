"use client";

import { useState, useMemo } from "react";
import { levelXP, xpBetween, MIN_LEVEL, MAX_LEVEL } from "@/data/levels";
import "./planning-workshop.css";

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

  return <section className="planning-sheet garden-level-sheet" aria-labelledby="garden-level-heading">
    <div className="planning-section-heading"><div><h2 id="garden-level-heading">Rencana level</h2><p>Hitung XP dan jumlah sesi dari pengaturan Garden.</p></div><span>{formatNumber(xpPerSession)} XP / sesi</span></div>
    <div className="planning-input-row">
      <div className="planning-row-description"><h3>Rentang level</h3><p>Tentukan level tujuan.</p></div>
      <LevelInput label="Level sekarang" value={currentLevel} onChange={(v) => {
        const clamped = clampLevel(v);
        setCurrentLevel(clamped);
        if (clamped >= targetLevel) setTargetLevel(Math.min(MAX_LEVEL, clamped + 1));
      }} min={MIN_LEVEL} max={MAX_LEVEL - 1} />
      <span className="planning-operator" aria-hidden="true">→</span>
      <LevelInput label="Level target" value={targetLevel} onChange={(v) => {
        const clamped = clampLevel(v);
        setTargetLevel(clamped);
        if (clamped <= currentLevel) setCurrentLevel(Math.max(MIN_LEVEL, clamped - 1));
      }} min={MIN_LEVEL + 1} max={MAX_LEVEL} />
      <p className="planning-row-note">Lv. {currentLevel} → {targetLevel}</p>
    </div>
    <div className="planning-input-row">
      <div className="planning-row-description"><h3>XP yang dimiliki</h3><p>Dikurangi dari total kebutuhan XP.</p></div>
      <label className="planning-field" htmlFor="garden-current-xp">XP saat ini<input id="garden-current-xp" type="text" inputMode="numeric" value={currentXP === 0 ? "" : formatNumber(currentXP)} onChange={(e) => setCurrentXP(parseLocalizedNumber(e.target.value))} placeholder="0" /></label>
      <span className="planning-operator" aria-hidden="true">→</span>
      <div className="planning-static"><span>Estimasi sesi</span><strong>{result && result.sessionsNeeded !== null ? `${formatNumber(result.sessionsNeeded)} sesi` : "—"}</strong></div>
      <p className="planning-row-note">{result && result.sessionsNeeded !== null ? formatDays(result.sessionsNeeded) : "Set boss & burn dulu untuk estimasi sesi"}</p>
    </div>
    {result ? <>
      <div className="planning-equation" role="status"><div><span>Total XP dibutuhkan</span><strong>{formatNumber(result.needed)}</strong></div><span aria-hidden="true">−</span><div><span>XP saat ini</span><strong>{formatNumber(currentXP)}</strong></div><span aria-hidden="true">=</span><div className="planning-answer"><span>XP tersisa</span><strong>{formatNumber(result.remaining)} <small>XP</small></strong></div></div>
      {currentXP > 0 && <div className="planning-progress"><div><span>Progress menuju Lv. {targetLevel}</span><strong>{result.progress}%</strong></div><progress value={result.progress} max={100} aria-label={`Progress menuju level ${targetLevel}`} /></div>}
      {xpPerSession > 0 && <p className="planning-footnote">Berdasarkan setting saat ini: {formatNumber(xpPerSession)} XP / sesi{result.sessionsNeeded !== null && result.sessionsNeeded > 0 && <> · butuh {formatNumber(result.sessionsNeeded)} sesi lagi</>}. Estimasi hari memakai satu sesi per hari.</p>}
    </> : <p className="planning-empty">Level target harus lebih tinggi dari level sekarang.</p>}
  </section>;
}

function LevelInput({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return <div className="planning-field"><span>{label}</span><div className="planning-stepper">
    <button aria-label={`Kurangi ${label.toLowerCase()}`} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
    <input aria-label={label} type="number" min={min} max={max} value={value} onChange={(e) => {
      const v = parseInt(e.target.value, 10);
      if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
    }} />
    <button aria-label={`Tambah ${label.toLowerCase()}`} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
  </div><small>XP threshold: {formatNumber(levelXP[value] ?? 0)}</small></div>;
}
