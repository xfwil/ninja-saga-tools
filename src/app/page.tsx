import Link from "next/link";

const tools = [
  {
    href: "/tools/eudemon-garden",
    icon: "🌸",
    title: "Eudemon Garden EXP Tracker",
    description:
      "Hitung total EXP dari Eudemon Garden. Pilih boss yang dilawan dan berapa kali, lalu lihat total EXP yang kamu dapatkan hari ini.",
    tags: ["EXP", "Eudemon", "Garden"],
    available: true,
  },
  {
    href: "/tools/exp-calculator",
    icon: "📈",
    title: "EXP Calculator",
    description:
      "Hitung berapa XP yang dibutuhkan untuk naik dari level berapa ke level berapa. Lihat estimasi hari berdasarkan XP harian kamu.",
    tags: ["EXP", "Level", "Calculator"],
    available: true,
  },
  {
    href: "/tools/encyclopedia",
    icon: "📖",
    title: "Encyclopedia",
    description:
      "Database lengkap Skills, Talents, dan Senjutsu. Cari berdasarkan nama, tipe, level, dan harga. Lihat detail setiap skill dengan level selector.",
    tags: ["Skills", "Talents", "Senjutsu", "Database"],
    available: true,
  },
  {
    href: "/tools/changelog",
    icon: "📋",
    title: "Game Data Changelog",
    description:
      "Lacak semua perubahan data game secara otomatis. Skill baru, buff/debuff, item diupdate atau dihapus — semuanya tercatat di database dengan timestamp.",
    tags: ["Changelog", "Tracker", "Database", "MongoDB"],
    available: true,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="relative py-20 text-center overflow-hidden">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5">
          <div className="text-[20rem] leading-none select-none">🥷</div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-800/40 bg-red-950/30 px-4 py-1.5 text-xs text-red-400 mb-6">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            Ninja Saga Fan Tools
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white mb-4">
            Ninja Saga
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
              Tools
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-slate-400 text-lg leading-relaxed">
            Kumpulan alat bantu untuk memaksimalkan perjalananmu di Ninja Saga.
            Dari tracker EXP hingga kalkulator battle.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/tools/exp-calculator"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-900/40"
            >
              📈 Mulai Tracking EXP
            </Link>
            <a
              href="#tools"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-slate-300 hover:border-white/25 hover:text-white transition-colors"
            >
              Lihat Semua Tools
            </a>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="pb-20">
        <div className="mb-10 flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Semua Tools</h2>
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-xs text-slate-600 bg-white/5 px-3 py-1 rounded-full">
            {tools.filter((t) => t.available).length} tersedia
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <ToolCard key={tool.href} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ToolCard({
  tool,
}: {
  tool: (typeof tools)[number];
}) {
  const Wrapper = tool.available ? Link : "div";
  const wrapperProps = tool.available ? { href: tool.href } : {};

  return (
    <Wrapper
    href={""} {...(wrapperProps as Record<string, string>)}
    className={`group relative flex flex-col gap-4 rounded-xl border p-6 transition-all duration-200 ${tool.available
        ? "border-white/10 bg-white/[0.03] hover:border-red-800/50 hover:bg-red-950/20 cursor-pointer"
        : "border-white/5 bg-white/[0.015] opacity-60 cursor-not-allowed"}`}    >
      {!tool.available && (
        <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
          Coming Soon
        </span>
      )}

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 text-2xl">
          {tool.icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-white leading-snug group-hover:text-red-300 transition-colors">
            {tool.title}
          </h3>
        </div>
      </div>

      <p className="text-sm text-slate-500 leading-relaxed flex-1">
        {tool.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-white/5">
        {tool.tags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </Wrapper>
  );
}
