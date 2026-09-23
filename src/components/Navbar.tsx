"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const tools = [
  ["/tools/exp-calculator", "EXP Calculator", "Kebutuhan XP dan estimasi naik level."],
  ["/tools/eudemon-garden", "Eudemon Garden", "Pertarungan boss, EXP, gold, dan burn."],
  ["/tools/sw-rewards", "SW Rewards", "Reward Shadow War per season dan rank."],
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const toolsToggle = useRef<HTMLButtonElement>(null);
  const toolsGroup = useRef<HTMLDivElement>(null);
  const activeTool = tools.some(([href]) => pathname === href);

  useEffect(() => {
    if (!toolsOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !toolsGroup.current?.contains(event.target)) setToolsOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [toolsOpen]);

  const closeNavigation = () => { setOpen(false); setToolsOpen(false); };

  return (
    <header className="site-header" onKeyDown={(event) => {
      if (event.key === "Escape") {
        if (toolsOpen) { setToolsOpen(false); toolsToggle.current?.focus(); }
        else if (open) { setOpen(false); toggle.current?.focus(); }
      }
    }}>
      <a href="#main-content" className="skip-link">Lewati ke konten</a>
      <div className="header-inner">
        <Link href="/" className="wordmark" onClick={closeNavigation} aria-label="Ninja Saga Tools — Home">
          <span>NINJA SAGA</span>
          <span className="wordmark-divider" aria-hidden="true">/</span>
          <span className="wordmark-sub">TOOLS</span>
        </Link>
        <button ref={toggle} type="button" className="menu-toggle" aria-expanded={open} aria-controls="site-navigation" aria-label={open ? "Tutup menu" : "Buka menu"} onClick={() => setOpen(!open)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
          Menu
        </button>
        <nav id="site-navigation" aria-label="Navigasi utama" className={`site-navigation ${open ? "is-open" : ""}`}>
          <Link className="nav-destination" href="/" aria-current={pathname === "/" ? "page" : undefined} onClick={closeNavigation}>Home</Link>
          <Link className="nav-destination" href="/tools/encyclopedia" aria-current={pathname === "/tools/encyclopedia" ? "page" : undefined} onClick={closeNavigation}>Encyclopedia</Link>
          <div ref={toolsGroup} className="nav-tools" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setToolsOpen(false); }}>
            <button ref={toolsToggle} type="button" className={`nav-destination nav-tools-toggle ${activeTool ? "has-active-tool" : ""}`} aria-expanded={toolsOpen} aria-controls="navigation-tools" onClick={() => setToolsOpen(!toolsOpen)}>
              Tools <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
            </button>
            <span className="mobile-tools-label">Tools</span>
            <div id="navigation-tools" className={`nav-tools-panel ${toolsOpen ? "is-open" : ""}`}>
              {tools.map(([href, label, description]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={closeNavigation}><span><strong>{label}</strong><small>{description}</small></span><span className="tool-link-arrow" aria-hidden="true">→</span></Link>)}
            </div>
          </div>
          <Link className="nav-destination" href="/tools/changelog" aria-current={pathname === "/tools/changelog" ? "page" : undefined} onClick={closeNavigation}>Changelog</Link>
        </nav>
      </div>
    </header>
  );
}
