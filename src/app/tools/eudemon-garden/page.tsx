import type { Metadata } from "next";
import EudemonsTracker from "@/components/EudemonsTracker";
import PageHeader from "@/components/PageHeader";
import { bosses, MAX_FIGHTS } from "@/data/eudemons";

export const metadata: Metadata = { title: "Eudemon Garden — Ninja Saga Tools", description: "Hitung EXP dan gold dari pertarungan Eudemon Garden." };

export default function EudemonsGardenPage() {
  const maxPossibleXP = bosses.reduce((sum, boss) => sum + boss.xp * MAX_FIGHTS, 0);
  return (
    <div className="page-container">
      <PageHeader title="Eudemon Garden" description="Atur pertarungan setiap boss. Periksa total EXP, gold, dan estimasi sesi untuk mencapai level tujuanmu.">
        <span>Boss <strong>{bosses.length}</strong></span>
        <span>Batas per boss <strong>{MAX_FIGHTS}× / hari</strong></span>
        <span>EXP maksimum per run <strong>{maxPossibleXP.toLocaleString("id-ID")} XP</strong></span>
      </PageHeader>
      <EudemonsTracker />
    </div>
  );
}
