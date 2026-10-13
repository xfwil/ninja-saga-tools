"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import IconImg from "./IconImg";

type LookupEntry = { id:string; name:string; level:number|null; damage:number|null; category:string; label:string };
export default function HomeLookup({ entries }: { entries:LookupEntry[] }) {
  const [query,setQuery] = useState("");
  const [category,setCategory] = useState("all");
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return entries.filter(entry => (category === "all" || entry.category === category) && `${entry.name} ${entry.id}`.toLowerCase().includes(text));
  },[entries,query,category]);
  return <section className="lookup-workspace" aria-labelledby="lookup-heading"><div className="home-section-heading"><div><h2 id="lookup-heading">Lookup cepat</h2><p>Temukan entri, lalu buka referensi lengkapnya.</p></div><span role="status">{filtered.length.toLocaleString("id-ID")} hasil</span></div><div className="lookup-controls"><label>Cari nama atau ID<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Contoh: Lightning Edge, wpn_01…"/></label><label>Kategori<select value={category} onChange={event => setCategory(event.target.value)}><option value="all">Semua kategori</option>{Object.entries(Object.fromEntries(entries.map(entry => [entry.category,entry.label]))).map(([key,label]) => <option value={key} key={key}>{label}</option>)}</select></label></div><div className="lookup-table-scroll" tabIndex={0} role="region" aria-label="Hasil lookup"><table><thead><tr><th>Nama / ID</th><th>Kategori</th><th>Level</th><th>Damage</th><th><span className="sr-only">Buka</span></th></tr></thead><tbody>{filtered.slice(0,10).map(entry => <tr key={`${entry.category}:${entry.id}`}><td><Link href={`/tools/encyclopedia?q=${encodeURIComponent(entry.name)}#${entry.category}`}><IconImg id={entry.id} size={32}/><span><strong>{entry.name}</strong><small>{entry.id}</small></span></Link></td><td>{entry.label}</td><td>{entry.level ?? "—"}</td><td>{entry.damage ?? "—"}</td><td><Link href={`/tools/encyclopedia?q=${encodeURIComponent(entry.name)}#${entry.category}`} aria-label={`Buka detail ${entry.name}`}>Buka</Link></td></tr>)}</tbody></table></div>{filtered.length === 0 && <div className="lookup-empty"><h3>Tidak ada entri yang cocok</h3><p>Coba nama lain atau hapus filter kategori.</p><button onClick={() => {setQuery("");setCategory("all");}}>Reset pencarian</button></div>}<div className="lookup-footer"><span>{Math.min(10,filtered.length)} dari {filtered.length.toLocaleString("id-ID")} hasil</span><Link href={`/tools/encyclopedia?q=${encodeURIComponent(query)}#${category === "all" ? "skills" : category}`}>Buka Encyclopedia lengkap</Link></div></section>;
}
