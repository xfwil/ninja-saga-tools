import type { Metadata } from "next";
import Encyclopedia from "@/components/Encyclopedia";

export const metadata: Metadata = {
  title: "Encyclopedia — Ninja Saga Tools",
  description: "Telusuri skills, items, talents, senjutsu, pets, enemy, efek, dan seasonal Ninja Saga.",
};

export default function EncyclopediaPage() {
  return (
    <div className="encyclopedia-page">
      <Encyclopedia />
    </div>
  );
}
