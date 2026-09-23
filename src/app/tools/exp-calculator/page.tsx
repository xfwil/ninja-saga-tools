import type { Metadata } from "next";
import Link from "next/link";
import ExpCalculator from "@/components/ExpCalculator";
import PageHeader from "@/components/PageHeader";
import { MIN_LEVEL, MAX_LEVEL } from "@/data/levels";

export const metadata: Metadata = { title: "EXP Calculator — Ninja Saga Tools", description: "Hitung kebutuhan XP dan estimasi waktu naik level." };

export default function ExpCalculatorPage() {
  return (
    <div className="page-container">
      <PageHeader title="EXP Calculator" description="Tentukan level tujuan. Lihat XP yang masih dibutuhkan dan estimasi waktu berdasarkan XP harianmu.">
        <span>Rentang level <strong>{MIN_LEVEL}–{MAX_LEVEL}</strong></span>
        <Link href="/tools/eudemon-garden">Hitung EXP Eudemon Garden →</Link>
      </PageHeader>
      <ExpCalculator />
    </div>
  );
}
