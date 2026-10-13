import Link from "next/link";
import HomeLookup from "@/components/HomeLookup";
import LatestChanges from "@/components/LatestChanges";
import skills from "../../dump/skills.json";
import library from "../../dump/library.json";
import talents from "../../dump/talents.json";
import senjutsu from "../../dump/senjutsu.json";
import pets from "../../dump/pet.json";
import enemies from "../../dump/enemy.json";
import "./home.css";

const categories = [
  {key:"skills",label:"Skills",count:skills.length},
  {key:"items",label:"Items",count:library.length},
  {key:"talents",label:"Talents",count:talents.length},
  {key:"senjutsu",label:"Senjutsu",count:senjutsu.length},
  {key:"pets",label:"Pets",count:pets.length},
  {key:"enemies",label:"Enemy",count:enemies.length},
];
const lookup = [
  ...skills.map(row => ({id:row.id,name:row.name ?? "—",level:row.level ?? null,damage:row.damage ?? null,category:"skills",label:"Skills"})),
  ...library.map(row => ({id:row.id,name:row.name ?? "—",level:row.level ?? null,damage:row.damage ?? null,category:"items",label:"Items"})),
  ...talents.map(row => ({id:row.id,name:row.talent_skill_name ?? "—",level:null,damage:row.talent_skill_damage ?? null,category:"talents",label:"Talents"})),
  ...senjutsu.map(row => ({id:row.id,name:row.name ?? "—",level:null,damage:row.damage ?? null,category:"senjutsu",label:"Senjutsu"})),
  ...pets.map(row => ({id:row.id,name:row.name ?? "—",level:row.level ?? null,damage:null,category:"pets",label:"Pets"})),
  ...enemies.map(row => ({id:row.id,name:row.name ?? "—",level:row.level ?? null,damage:null,category:"enemies",label:"Enemy"})),
];

export default function HomePage() {
  return <div className="workshop-home"><aside className="home-index"><details open><summary>Database</summary><nav aria-label="Kategori Encyclopedia">{categories.map(category => <Link key={category.key} href={`/tools/encyclopedia#${category.key}`}><span>{category.label}</span><small>{category.count.toLocaleString("id-ID")}</small></Link>)}<Link href="/tools/encyclopedia#effects">Referensi efek</Link><Link href="/tools/encyclopedia#seasonal">Item seasonal</Link></nav></details><div className="home-index-note"><strong>Data apa adanya.</strong><p>Nilai yang tidak tersedia ditampilkan sebagai —. Efek, harga, dan sumber lengkap ada di Encyclopedia.</p></div></aside><div className="home-workspace"><header className="home-heading"><h1>Temukan. Periksa. Rencanakan.</h1><p>Referensi game dan lembar kerja Ninja Saga, dalam satu tempat.</p></header><nav className="home-task-bar" aria-label="Akses alat"><span>Buka alat</span><Link href="/tools/exp-calculator">Hitung kebutuhan XP</Link><Link href="/tools/eudemon-garden">Eudemon Garden</Link><Link href="/tools/sw-rewards">Shadow War Rewards</Link></nav><HomeLookup entries={lookup}/><LatestChanges/></div></div>;
}
