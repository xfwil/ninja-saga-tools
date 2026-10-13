"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

const destinations = [
  ["/", "Lookup"],
  ["/tools/encyclopedia", "Encyclopedia"],
  ["/tools/exp-calculator", "EXP Calculator"],
  ["/tools/eudemon-garden", "Eudemon Garden"],
  ["/tools/sw-rewards", "SW Rewards"],
  ["/tools/changelog", "Changelog"],
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const toggle = useRef<HTMLButtonElement>(null);
  return <header className="site-header" onKeyDown={event => {
    if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); }
  }}>
    <a href="#main-content" className="skip-link">Lewati ke konten</a>
    <div className="header-inner">
      <Link href="/" className="wordmark" aria-label="Ninja Saga Tools — Home" onClick={() => setOpen(false)}><svg width="30" height="30" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 4h8v8H4zM16 4h8v8h-8zM4 16h8v8H4zM16 20h8m-4-4v8"/></svg><span>Ninja Saga<strong>Tools & reference</strong></span></Link>
      <form className="header-search" role="search" onSubmit={event => { event.preventDefault(); setOpen(false); window.location.assign(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/tools/encyclopedia?q=${encodeURIComponent(query)}#skills`); }}><label htmlFor="global-search" className="sr-only">Cari di Encyclopedia</label><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input id="global-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari nama di Encyclopedia…"/><button type="submit">Cari</button></form>
      <span className="header-caption">Sage Workshop</span>
      <button ref={toggle} type="button" className="menu-toggle" aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(!open)}>{open ? "Tutup menu" : "Menu"}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d={open ? "m6 6 12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"}/></svg></button>
    </div>
    <nav id="site-navigation" aria-label="Navigasi utama" className={`site-navigation${open ? " is-open" : ""}`}>{destinations.map(([href,label]) => <Link key={href} href={href} className="nav-destination" aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
  </header>;
}
