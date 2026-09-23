import type { Metadata } from "next";
import SWRewards from "@/components/SWRewards";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "Shadow War Rewards — Ninja Saga Tools", description: "Telusuri reward Shadow War per season dan rank." };

export default function SWRewardsPage() {
  return (
    <div className="page-container">
      <PageHeader title="Shadow War Rewards" description="Pilih season, temukan rank, lalu buka detail reward untuk melihat stat dan efeknya." />
      <SWRewards />
    </div>
  );
}
