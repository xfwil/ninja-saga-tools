import type { Metadata } from "next";
import EudemonsTracker from "@/components/EudemonsTracker";
import Link from "next/link";
import "@/components/planning-workshop.css";
import { bosses, MAX_FIGHTS } from "@/data/eudemons";

export const metadata: Metadata = { title: "Eudemon Garden — Ninja Saga Tools", description: "Hitung EXP dan gold dari pertarungan Eudemon Garden." };

export default function EudemonsGardenPage() {
  const maxPossibleXP = bosses.reduce((sum, boss) => sum + boss.xp * MAX_FIGHTS, 0);
  return (
    <div className="page-container planning-page">
      <header className="planning-page-header"><div><h1>Eudemon Garden</h1><p>Susun pertarungan, atur burn, lalu periksa EXP, gold, dan rencana level dari sesi yang sama.</p></div><div className="planning-page-meta"><Link href="/tools/exp-calculator">Buka EXP worksheet →</Link></div></header>
      <div className="garden-ledger-facts"><span><strong>{bosses.length}</strong> boss</span><span>Batas <strong>{MAX_FIGHTS}× / boss / hari</strong></span><span>Maksimum per run <strong>{maxPossibleXP.toLocaleString("id-ID")} XP</strong></span></div>
      <EudemonsTracker />
    </div>
  );
}
