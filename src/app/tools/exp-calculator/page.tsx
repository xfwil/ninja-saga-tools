import type { Metadata } from "next";
import Link from "next/link";
import ExpCalculator from "@/components/ExpCalculator";
import "@/components/planning-workshop.css";
import { MIN_LEVEL, MAX_LEVEL } from "@/data/levels";

export const metadata: Metadata = { title: "EXP Calculator — Ninja Saga Tools", description: "Hitung kebutuhan XP dan estimasi waktu naik level." };

export default function ExpCalculatorPage() {
  return (
    <div className="page-container planning-page">
      <header className="planning-page-header">
        <div><h1>EXP Calculator</h1><p>Tentukan level tujuan. Periksa kebutuhan XP dan estimasi waktumu dalam satu lembar kerja.</p></div>
        <div className="planning-page-meta"><span>Level <strong>{MIN_LEVEL}–{MAX_LEVEL}</strong></span><Link href="/tools/eudemon-garden">Hitung EXP Eudemon Garden →</Link></div>
      </header>
      <ExpCalculator />
    </div>
  );
}
