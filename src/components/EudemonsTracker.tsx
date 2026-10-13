"use client";

import { useState, useMemo } from "react";
import { bosses, gradeConfig, MAX_FIGHTS, type Boss } from "@/data/eudemons";
import LevelCalculator from "@/components/LevelCalculator";
import "./planning-workshop.css";

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

  return <div className="garden-workspace">
    <div className="garden-ledger-layout">
      <section className="garden-ledger" aria-labelledby="garden-ledger-heading">
        <div className="planning-section-heading"><div><h2 id="garden-ledger-heading">Ledger pertarungan</h2><p>Maksimal {MAX_FIGHTS}× per boss per hari. Atur jumlah lawan di setiap baris.</p></div><div className="planning-actions"><button onClick={handleMaxAll}>Max semua</button><button onClick={handleReset}>Reset</button></div></div>
        <div className="planning-table-scroll" role="region" aria-label="Ledger boss, geser untuk semua kolom" tabIndex={0}>
          <table className="planning-table garden-boss-table"><thead><tr><th scope="col">Boss / grade</th><th scope="col">XP / lawan</th><th scope="col">Pertarungan</th><th scope="col">Subtotal XP</th></tr></thead><tbody>{bosses.map((boss) => <BossRow key={boss.id} boss={boss} count={counts[boss.id] ?? 0} onCountChange={(v) => setCount(boss.id, v)} />)}</tbody><tfoot><tr><th scope="row">{activeBossCount} boss aktif</th><td colSpan={2}>Total per run</td><td>{formatNumber(xpPerRun)} XP</td></tr></tfoot></table>
        </div>
      </section>
      <aside className="garden-inspector" aria-label="Rencana dan total sesi Garden">
        <BurnCounter burnCount={burnCount} onChange={setBurnCount} />
        <SummaryPanel xpPerRun={xpPerRun} goldPerRun={goldPerRun} burnCount={burnCount} activeBossCount={activeBossCount} />
      </aside>
    </div>
    <LevelCalculator xpPerSession={xpPerRun * (burnCount + 1)} />
  </div>;
}

function BossRow({ boss, count, onCountChange }: { boss: Boss; count: number; onCountChange: (v: number) => void }) {
  const cfg = gradeConfig[boss.grade];
  const subtotalXP = boss.xp * count;
  const isActive = count > 0;
  return <tr data-active={isActive}>
    <th scope="row"><div className="garden-boss-name"><span className="garden-grade">{cfg.label}</span><div><strong>{boss.name}</strong><small>Lv. {boss.lvl}</small></div></div></th>
    <td>{formatNumber(boss.xp)}</td>
    <td><div className="garden-fight-control"><div className="planning-stepper"><button aria-label={`Kurangi pertarungan ${boss.name}`} onClick={() => onCountChange(count - 1)} disabled={count === 0}>−</button><span aria-live="polite">{count}</span><button aria-label={`Tambah pertarungan ${boss.name}`} onClick={() => onCountChange(count + 1)} disabled={count === MAX_FIGHTS}>+</button></div><div className="garden-quick-count" aria-label={`Pilihan jumlah pertarungan ${boss.name}`}>{Array.from({ length: MAX_FIGHTS }).map((_, i) => <button key={i} aria-label={`Set ${boss.name} ${i < count ? i : i + 1} pertarungan`} aria-pressed={i < count} onClick={() => onCountChange(i < count ? i : i + 1)} title={`Set ${i < count ? i : i + 1}x`}>{i + 1}</button>)}</div></div></td>
    <td className="garden-subtotal">{count > 0 ? <><strong>+{formatNumber(subtotalXP)}</strong><small>{formatNumber(boss.xp)} × {count}</small></> : <span>— XP</span>}</td>
  </tr>;
}

const TOKEN_PER_BURN = 50;

function BurnCounter({ burnCount, onChange }: { burnCount: number; onChange: (v: number) => void }) {
  const totalTokens = burnCount * TOKEN_PER_BURN;
  return <section className="garden-burn" aria-labelledby="garden-burn-heading">
    <h2 id="garden-burn-heading">Burn / reset Garden</h2><p>0 = belum burn (1 run). Tiap burn mengulang pertarungan dari awal.</p>
    <label className="planning-field" htmlFor="garden-burn-count">Jumlah burn</label><div className="garden-burn-input"><div className="planning-stepper"><button aria-label="Kurangi burn" onClick={() => onChange(Math.max(0, burnCount - 1))} disabled={burnCount <= 0}>−</button><input id="garden-burn-count" type="number" min={0} value={burnCount} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 0) onChange(v); }} /><button aria-label="Tambah burn" onClick={() => onChange(burnCount + 1)}>+</button></div><strong>= {burnCount + 1}× run</strong></div>
    <p className="garden-burn-note">Total run = burn + 1. EXP dan gold dikalikan total run.</p>
    {burnCount > 0 && <div className="garden-token-cost"><span>Biaya token</span><strong>{totalTokens} token</strong><small>{burnCount} burn × {TOKEN_PER_BURN} token / burn</small></div>}
  </section>;
}

function SummaryPanel({ xpPerRun, goldPerRun, burnCount, activeBossCount }: { xpPerRun: number; goldPerRun: number; burnCount: number; activeBossCount: number }) {
  const totalRuns = burnCount + 1;
  const totalXP = xpPerRun * totalRuns;
  const totalGold = goldPerRun * totalRuns;
  const totalTokens = burnCount * TOKEN_PER_BURN;
  const maxPossibleXP = bosses.reduce((sum, b) => sum + b.xp * MAX_FIGHTS, 0);
  const maxTotal = maxPossibleXP * totalRuns;
  const percentage = maxTotal > 0 ? Math.round((totalXP / maxTotal) * 100) : 0;
  return <section className="garden-summary" aria-labelledby="garden-summary-heading" aria-live="polite">
    <h2 id="garden-summary-heading">Total sesi</h2>
    {burnCount > 0 && xpPerRun > 0 && <p className="garden-summary-equation">{formatNumber(xpPerRun)} XP / run × {totalRuns} run ({burnCount} burn)</p>}
    <dl className="garden-total-lines"><div className="garden-total-xp"><dt>Total EXP{burnCount > 0 ? ` (${totalRuns}× run)` : " hari ini"}</dt><dd>{formatNumber(totalXP)} <small>XP</small></dd></div><div><dt>Total gold</dt><dd>{formatNumber(totalGold)} <small>G</small>{burnCount > 0 && goldPerRun > 0 && <span>{formatNumber(goldPerRun)} × {totalRuns}</span>}</dd></div>{burnCount > 0 && <div><dt>Token habis</dt><dd>{totalTokens}<span>{burnCount} × {TOKEN_PER_BURN} token</span></dd></div>}</dl>
    {totalXP > 0 && <div className="planning-progress"><div><span>{activeBossCount} boss{burnCount > 0 ? ` · ${burnCount} burn` : ""}</span><strong>{percentage}% dari max</strong></div><progress value={percentage} max={100} aria-label="Persentase EXP maksimum" /><div><span>0</span><span>Max: {formatNumber(maxTotal)} XP ({totalRuns}× run)</span></div></div>}
    {totalXP === 0 && <p className="planning-empty">Belum ada boss yang dilawan. Klik + untuk mulai tracking.</p>}
  </section>;
}
