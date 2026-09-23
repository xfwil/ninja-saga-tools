import type { Metadata } from "next";
import Encyclopedia from "@/components/Encyclopedia";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Encyclopedia — Ninja Saga Tools",
  description: "Telusuri skills, items, talents, senjutsu, pets, enemy, efek, dan seasonal Ninja Saga.",
};

export default function EncyclopediaPage() {
  return (
    <div className="page-container encyclopedia-page">
      <PageHeader title="Encyclopedia" description="Cari skill dan perlengkapan. Periksa stat, efek, harga, serta sumbernya sebelum menentukan pilihan." />
      <Encyclopedia />
    </div>
  );
}
