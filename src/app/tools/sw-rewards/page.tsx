import type { Metadata } from "next";
import SWRewards from "@/components/SWRewards";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "Shadow War Rewards — Ninja Saga Tools", description: "Telusuri reward Shadow War per season dan rank." };

export default function SWRewardsPage() {
  return (
    <div className="page-container rewards-page">
      <PageHeader title="Shadow War Rewards" description="Pilih season, telusuri ranking, dan periksa stat serta efek reward." />
      <SWRewards />
    </div>
  );
}
