"use client";

import { useState, useMemo } from "react";
import { levelXP, xpBetween, MIN_LEVEL, MAX_LEVEL } from "@/data/levels";
import "./planning-workshop.css";

function fmt(n: number) {
  return n.toLocaleString("id-ID");
}

function parseLocalizedNumber(value: string): number {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return 0;
  const parsed = Number.parseInt(digitsOnly, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
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

export default function ExpCalculator() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [targetLevel, setTargetLevel] = useState(50);
  const [progressXP, setProgressXP] = useState(0); // XP earned within current level
  const [dailyXP, setDailyXP] = useState(0);
  const [showTable, setShowTable] = useState(true);

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

  const xpToNextLevel = levelXP[currentLevel] ?? 0;

  return (
    <section className="planning-sheet" aria-label="Lembar perhitungan XP">
      <div className="planning-section-heading"><h2>Parameter perhitungan</h2><p>Dihitung otomatis saat diubah</p></div>
      <div className="planning-input-row">
        <div className="planning-row-description"><h3>Rentang level</h3><p>Dari level sekarang ke tujuanmu.</p></div>
        <LevelStepper label="Level sekarang" value={currentLevel} min={MIN_LEVEL} max={MAX_LEVEL - 1} onChange={(v) => {
          const c = clamp(v, MIN_LEVEL, MAX_LEVEL - 1);
          setCurrentLevel(c);
          setProgressXP(0);
          if (c >= targetLevel) setTargetLevel(Math.min(MAX_LEVEL, c + 1));
        }} />
        <span className="planning-operator" aria-hidden="true">→</span>
        <LevelStepper label="Level target" value={targetLevel} min={MIN_LEVEL + 1} max={MAX_LEVEL} onChange={(v) => {
          const t = clamp(v, MIN_LEVEL + 1, MAX_LEVEL);
          setTargetLevel(t);
          if (t <= currentLevel) setCurrentLevel(Math.max(MIN_LEVEL, t - 1));
        }} />
        <p className="planning-row-note">{targetLevel - currentLevel} level</p>
      </div>
      <div className="planning-input-row">
        <div className="planning-row-description"><h3>Progres XP</h3><p>XP yang sudah diperoleh dalam level ini.</p></div>
        <label className="planning-field" htmlFor="progress-xp">XP saat ini<input id="progress-xp" type="text" inputMode="numeric" value={progressXP === 0 ? "" : fmt(progressXP)} onChange={(e) => {
          const v = parseLocalizedNumber(e.target.value);
          setProgressXP(clamp(v, 0, xpToNextLevel));
        }} placeholder="0" /></label>
        <span className="planning-operator" aria-hidden="true">/</span>
        <div className="planning-static"><span>XP ke level berikutnya</span><strong>{fmt(xpToNextLevel)}</strong></div>
        <p className="planning-row-note">Maks. {fmt(xpToNextLevel)} XP · ke Lv. {currentLevel + 1}</p>
      </div>
      <div className="planning-input-row">
        <div className="planning-row-description"><h3>Ritme harian</h3><p>Opsional, untuk estimasi waktu.</p></div>
        <label className="planning-field" htmlFor="daily-xp">XP per hari<input id="daily-xp" type="text" inputMode="numeric" value={dailyXP === 0 ? "" : dailyXP} onChange={(e) => setDailyXP(parseLocalizedNumber(e.target.value))} placeholder="Masukkan XP harian" /></label>
        <span className="planning-operator" aria-hidden="true">=</span>
        <div className="planning-static"><span>Estimasi waktu</span><strong>{result && result.daysNeeded !== null ? formatDuration(result.daysNeeded) : "—"}</strong></div>
        <p className="planning-row-note">{dailyXP > 0 ? `${fmt(dailyXP)} XP / hari` : "Isi XP harian untuk estimasi"}</p>
      </div>
      {result ? <>
        <div className="planning-equation" role="status" aria-live="polite">
          <div><span>Total XP dibutuhkan</span><strong>{fmt(result.neededTotal)}</strong></div><span aria-hidden="true">−</span>
          <div><span>Progres saat ini</span><strong>{fmt(progressXP)}</strong></div><span aria-hidden="true">=</span>
          <div className="planning-answer"><span>Sisa menuju Lv. {targetLevel}</span><strong>{fmt(result.remaining)} <small>XP</small></strong></div>
        </div>
        {progressXP > 0 && <div className="planning-progress"><div><span>Progress Lv. {currentLevel} → Lv. {targetLevel}</span><strong>{result.progressPct}%</strong></div><progress value={result.progressPct} max={100} aria-label={`Progress menuju level ${targetLevel}`} /></div>}
        <div className="planning-section-heading planning-table-heading"><div><h2>Rincian per level</h2><p>XP dasar sebelum dikurangi progres level saat ini.</p></div><button onClick={() => setShowTable((p) => !p)} aria-expanded={showTable} aria-controls="xp-level-table">{showTable ? "Sembunyikan" : "Lihat"} tabel · {targetLevel - currentLevel} level</button></div>
        {showTable && <div id="xp-level-table" className="planning-table-scroll" role="region" aria-label="Tabel XP per level, geser untuk semua kolom" tabIndex={0}><table className="planning-table"><thead><tr><th scope="col">Level</th><th scope="col">XP level ini</th><th scope="col">Kumulatif</th>{dailyXP > 0 && <th scope="col">Hari ke-</th>}</tr></thead><tbody>{result.levelSteps.map((step) => <tr key={step.from}><td>Lv. {step.from} → <strong>{step.to}</strong></td><td>{fmt(step.xp)}</td><td>{fmt(step.cumulative)}</td>{dailyXP > 0 && <td>{Math.ceil(step.cumulative / dailyXP)}</td>}</tr>)}</tbody><tfoot><tr><th scope="row">Total kebutuhan</th><td>{fmt(result.neededTotal)} XP</td><td>{targetLevel - currentLevel} level</td>{dailyXP > 0 && <td>{Math.ceil(result.neededTotal / dailyXP)}</td>}</tr></tfoot></table></div>}
        <p className="planning-footnote">Estimasi mengikuti XP harian yang kamu masukkan. Kolom hari pada tabel memakai XP kumulatif sebelum dikurangi progres saat ini.</p>
      </> : <p className="planning-empty">Level target harus lebih tinggi dari level sekarang.</p>}
    </section>
  );
}

function LevelStepper({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return <div className="planning-field"><span>{label}</span><div className="planning-stepper">
    <button aria-label={`Kurangi ${label.toLowerCase()}`} onClick={() => onChange(value - 1)} disabled={value <= min}>−</button>
    <input aria-label={label} type="number" min={min} max={max} value={value} onChange={(e) => {
      const v = parseInt(e.target.value, 10);
      if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
    }} />
    <button aria-label={`Tambah ${label.toLowerCase()}`} onClick={() => onChange(value + 1)} disabled={value >= max}>+</button>
  </div><small>Threshold: {fmt(levelXP[value] ?? 0)}</small></div>;
}
