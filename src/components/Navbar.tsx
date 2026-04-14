import Link from "next/link";

const NAV_LINKS = [
  { href: "/",                        label: "Home" },
  { href: "/tools/encyclopedia",      label: "Encyclopedia" },
  { href: "/tools/eudemon-garden",    label: "Eudemon Garden" },
  { href: "/tools/exp-calculator",    label: "EXP Calculator" },
  { href: "/tools/sw-rewards",        label: "SW Rewards" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-4">
          {/* Logo — shrink-0 so it never gets squished */}
          <Link href="/" className="flex shrink-0 items-center gap-2 group">
            <span className="text-xl">⚔</span>
            <span className="font-bold text-white tracking-wide group-hover:text-red-400 transition-colors">
              Ninja Saga <span className="text-red-500">Tools</span>
            </span>
          </Link>

          {/* Nav links — horizontal scroll on mobile, hidden scrollbar */}
          <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 rounded-md px-2.5 py-1.5 text-xs sm:text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
