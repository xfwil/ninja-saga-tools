import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl">⚔</span>
            <span className="font-bold text-white tracking-wide group-hover:text-red-400 transition-colors">
              Ninja Saga <span className="text-red-500">Tools</span>
            </span>
          </Link>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link
              href="/tools/eudemon-garden"
              className="hover:text-white transition-colors"
            >
              Eudemon Garden
            </Link>
            <Link
              href="/tools/exp-calculator"
              className="hover:text-white transition-colors"
            >
              EXP Calculator
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
