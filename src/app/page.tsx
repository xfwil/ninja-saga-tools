import Link from "next/link";
import IconImg from "@/components/IconImg";
import LatestChanges from "@/components/LatestChanges";
import skills from "../../dump/skills.json";
import library from "../../dump/library.json";
import talents from "../../dump/talents.json";
import senjutsu from "../../dump/senjutsu.json";
import pets from "../../dump/pet.json";
import enemies from "../../dump/enemy.json";
import { MIN_LEVEL, MAX_LEVEL } from "@/data/levels";
import "./home.css";

const weapons = library.filter((item) => item.type === "wpn").slice(0, 3);
const categories = [
  { key: "skills", label: "Skills", count: skills.length, description: "Damage, CP, cooldown, dan efek skill." },
  { key: "items", label: "Items", count: library.length, description: "Perlengkapan, harga, dan sumber item." },
  { key: "talents", label: "Talents", count: talents.length, description: "Detail skill dan efek talent." },
  { key: "senjutsu", label: "Senjutsu", count: senjutsu.length, description: "Skill senjutsu, SP, dan efeknya." },
  { key: "pets", label: "Pets", count: pets.length, description: "Stat dan skill pet per level." },
  { key: "enemies", label: "Enemy", count: enemies.length, description: "Level, HP, CP, dan detail enemy." },
];

export default function HomePage() {
  return (
    <div className="database-home">
      <header className="database-home-heading">
        <h1>Ninja Saga <span>Database & Tools</span></h1>
        <p>Referensi skill, perlengkapan, dan alat bantu untuk pemain Ninja Saga.</p>
      </header>
      <div className="home-columns">
        <div className="home-main">
          <section aria-labelledby="database-heading">
            <div className="home-section-heading"><h2 id="database-heading">Database</h2><Link href="/tools/encyclopedia">Buka Encyclopedia →</Link></div>
            <nav className="database-directory" aria-label="Kategori Encyclopedia">
              {categories.map((category) => <Link key={category.key} href={`/tools/encyclopedia#${category.key}`}><span><strong>{category.label}</strong><small>{category.count.toLocaleString("id-ID")} entri</small></span><p>{category.description}</p></Link>)}
            </nav>
            <div className="database-other"><Link href="/tools/encyclopedia#effects">Referensi efek</Link><Link href="/tools/encyclopedia#seasonal">Item seasonal</Link></div>
          </section>
          <LatestChanges />
        </div>
        <aside className="home-sidebar" aria-label="Tools dan cuplikan item">
          <section aria-labelledby="tools-heading">
            <div className="home-section-heading"><h2 id="tools-heading">Tools</h2></div>
            <div className="home-tool-list">
              <Link href="/tools/exp-calculator"><h3>EXP Calculator</h3><p>Kebutuhan XP dan estimasi waktu naik level.</p><small>Level {MIN_LEVEL}–{MAX_LEVEL}</small></Link>
              <Link href="/tools/eudemon-garden"><h3>Eudemon Garden</h3><p>Jumlah pertarungan, total EXP, gold, dan burn.</p></Link>
              <Link href="/tools/sw-rewards"><h3>Shadow War Rewards</h3><p>Daftar reward berdasarkan season dan rank.</p></Link>
            </div>
          </section>
          <section className="home-item-sample" aria-labelledby="items-heading">
            <div className="home-section-heading"><h2 id="items-heading">Cuplikan item</h2><Link href="/tools/encyclopedia#items">Semua →</Link></div>
            <table><thead><tr><th scope="col">Weapon</th><th scope="col">Lv.</th><th scope="col">DMG</th></tr></thead><tbody>{weapons.map((item) => <tr key={item.id}><th scope="row"><IconImg id={item.id} size={24} /><span>{item.name ?? "—"}</span></th><td>{item.level ?? "—"}</td><td>{item.damage ?? "—"}</td></tr>)}</tbody></table>
          </section>
        </aside>
      </div>
    </div>
  );
}
