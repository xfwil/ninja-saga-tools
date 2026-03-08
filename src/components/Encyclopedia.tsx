"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import skillsJson from "../../dump/skills.json";
import talentsJson from "../../dump/talents.json";
import senjutsuJson from "../../dump/senjutsu.json";
import skillEffectsJson from "../../dump/skill-effect.json";

// ─── Types ────────────────────────────────────────────────────────────────────

type Skill = {
  id: string;
  name: string;
  type: string;
  level: number;
  damage: number;
  hit_chance?: number;
  cp_cost: number;
  cooldown: number;
  target: string;
  description: string;
  price_gold: number;
  price_tokens: number;
  premium: boolean;
  buyable: boolean;
};

type SkillEffectEntry = {
  target?: string;
  type?: string;
  effect?: string;
  effect_name?: string;
  duration?: number;
  calc_type?: string;
  amount?: number;
  chance?: number;
  reduce_type?: string;
  passive?: boolean;
};

type SkillEffectRecord = {
  skill_id: string;
  skill_effect: SkillEffectEntry[];
};

type Talent = {
  id: string;
  talent_skill_name: string;
  talent_skill_description: string;
  type?: string;
  talent_skill_damage: number;
  talent_skill_cp_cost: number;
  skill_cooldown: number;
  chance?: number;
  amount?: number;
  increase_max_hp?: number;
  effects?: unknown[];
};

type Senjutsu = {
  id: string;
  name: string;
  type: string;
  description: string;
  damage: number;
  sp_cost: number;
  cooldown: number;
  target: string;
  multi_hit: boolean;
  effects: Array<{ effect_name?: string; amount?: number; type?: string; is_debuff?: boolean }>;
  increase_max_hp?: number;
  increase_damage?: number;
};

type TalentGroup = {
  baseId: string;
  name: string;
  type: string;
  levels: Talent[];
};

type SenjutsuGroup = {
  baseId: string;
  name: string;
  type: string;
  levels: Senjutsu[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SKILL_TYPE_MAP: Record<string, { label: string; icon: string; chip: string; badge: string }> = {
  "1": { label: "Wind",        icon: "🌀", chip: "bg-emerald-950/60 border-emerald-700/40 text-emerald-300 hover:border-emerald-500", badge: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300" },
  "2": { label: "Fire",        icon: "🔥", chip: "bg-red-950/60 border-red-700/40 text-red-300 hover:border-red-500",               badge: "bg-red-900/40 border-red-700/40 text-red-300" },
  "3": { label: "Lightning",   icon: "⚡", chip: "bg-yellow-950/60 border-yellow-700/40 text-yellow-300 hover:border-yellow-500",   badge: "bg-yellow-900/40 border-yellow-700/40 text-yellow-300" },
  "4": { label: "Earth",       icon: "🌍", chip: "bg-amber-950/60 border-amber-700/40 text-amber-400 hover:border-amber-500",       badge: "bg-amber-900/40 border-amber-700/40 text-amber-400" },
  "5": { label: "Water",       icon: "💧", chip: "bg-blue-950/60 border-blue-700/40 text-blue-300 hover:border-blue-500",           badge: "bg-blue-900/40 border-blue-700/40 text-blue-300" },
  "6": { label: "Taijutsu",    icon: "👊", chip: "bg-orange-950/60 border-orange-700/40 text-orange-300 hover:border-orange-500",   badge: "bg-orange-900/40 border-orange-700/40 text-orange-300" },
  "7": { label: "Transform",   icon: "🔄", chip: "bg-purple-950/60 border-purple-700/40 text-purple-300 hover:border-purple-500",   badge: "bg-purple-900/40 border-purple-700/40 text-purple-300" },
  "9": { label: "Genjutsu",    icon: "👁️", chip: "bg-pink-950/60 border-pink-700/40 text-pink-300 hover:border-pink-500",           badge: "bg-pink-900/40 border-pink-700/40 text-pink-300" },
  "10": { label: "Medical",    icon: "💊", chip: "bg-teal-950/60 border-teal-700/40 text-teal-300 hover:border-teal-500",           badge: "bg-teal-900/40 border-teal-700/40 text-teal-300" },
  "11": { label: "Senjutsu",   icon: "🐸", chip: "bg-indigo-950/60 border-indigo-700/40 text-indigo-300 hover:border-indigo-500",   badge: "bg-indigo-900/40 border-indigo-700/40 text-indigo-300" },
};

const TALENT_TYPE_MAP: Record<string, { label: string; icon: string; badge: string }> = {
  extreme: { label: "Extreme", icon: "💠", badge: "bg-sky-900/40 border-sky-700/40 text-sky-300" },
  secret:  { label: "Secret",  icon: "🔮", badge: "bg-violet-900/40 border-violet-700/40 text-violet-300" },
  normal:  { label: "Normal",  icon: "⚪", badge: "bg-slate-800/40 border-slate-600/40 text-slate-400" },
};

const SENJUTSU_TYPE_MAP: Record<string, { label: string; icon: string; chip: string; badge: string }> = {
  toad:  { label: "Toad Sage",  icon: "🐸", chip: "bg-green-950/60 border-green-700/40 text-green-300 hover:border-green-500",   badge: "bg-green-900/40 border-green-700/40 text-green-300" },
  snake: { label: "Snake Sage", icon: "🐍", chip: "bg-purple-950/60 border-purple-700/40 text-purple-300 hover:border-purple-500", badge: "bg-purple-900/40 border-purple-700/40 text-purple-300" },
  other: { label: "General",   icon: "✨", chip: "bg-slate-800/60 border-slate-600/40 text-slate-300 hover:border-slate-500",    badge: "bg-slate-800/40 border-slate-600/40 text-slate-300" },
};

const PAGE_SIZE = 24;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLevelFromId(id: string): number {
  const parts = id.split(":");
  return parts.length > 1 ? parseInt(parts[1], 10) : 1;
}

function groupByBaseId<T extends { id: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const base = item.id.split(":")[0];
    if (!map.has(base)) map.set(base, []);
    map.get(base)!.push(item);
  }
  return map;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Encyclopedia() {
  const [activeTab, setActiveTab] = useState<"skills" | "talents" | "senjutsu">("skills");

  const skills = skillsJson as Skill[];
  const talents = talentsJson as Talent[];
  const senjutsu = senjutsuJson as Senjutsu[];

  const tabs = [
    { key: "skills",   label: "Skills",   count: skills.length,                         icon: "⚔️" },
    { key: "talents",  label: "Talents",  count: [...groupByBaseId(talents).keys()].length, icon: "💫" },
    { key: "senjutsu", label: "Senjutsu", count: [...groupByBaseId(senjutsu).keys()].length, icon: "🍃" },
  ] as const;

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-1 mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-red-600/80 text-white shadow-lg shadow-red-900/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className={`hidden sm:inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === tab.key ? "bg-white/20 text-white" : "bg-white/5 text-slate-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "skills"   && <SkillsTab   skills={skills} />}
      {activeTab === "talents"  && <TalentsTab  talents={talents} />}
      {activeTab === "senjutsu" && <SenjutsuTab senjutsu={senjutsu} />}
    </div>
  );
}

// ─── Helpers: seasonal ────────────────────────────────────────────────────────

const SEASONAL_REGEX = /^S(\d+) Kinjutsu/i;

function getSeasonNumber(name: string): number | null {
  const m = name.match(SEASONAL_REGEX);
  return m ? parseInt(m[1], 10) : null;
}

function isSeasonal(name: string): boolean {
  return SEASONAL_REGEX.test(name);
}

// ─── Effect quick-tags ────────────────────────────────────────────────────────

const EFFECT_TAGS = [
  { label: "Stun",          keyword: "stun" },
  { label: "Burn",          keyword: "burn" },
  { label: "Bleed",         keyword: "bleed" },
  { label: "Recover HP",    keyword: "recover" },
  { label: "Dodge",         keyword: "dodge" },
  { label: "Critical",      keyword: "critical" },
  { label: "Reduce",        keyword: "reduce" },
  { label: "Poison",        keyword: "poison" },
  { label: "Sleep",         keyword: "sleep" },
  { label: "Seal",          keyword: "seal" },
  { label: "Agility",       keyword: "agility" },
  { label: "Blind",         keyword: "blind" },
  { label: "Freeze",        keyword: "freeze" },
  { label: "Debuff",        keyword: "debuff" },
  { label: "Buff",          keyword: "buff" },
  { label: "Absorb",        keyword: "absorb" },
  { label: "Ignore DEF",    keyword: "ignore defense" },
  { label: "All Attack",    keyword: "all attack" },
  { label: "Heal",          keyword: "heal" },
  { label: "Curse",         keyword: "curse" },
];

// ─── Skill effects lookup ─────────────────────────────────────────────────────

const SKILL_EFFECTS_MAP = Object.fromEntries(
  (skillEffectsJson as SkillEffectRecord[]).map((e) => [e.skill_id, e.skill_effect ?? []])
);

// ─── Skill Detail Modal ───────────────────────────────────────────────────────

function SkillModal({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const typeInfo = SKILL_TYPE_MAP[skill.type] ?? { label: `Type ${skill.type}`, icon: "❓", badge: "bg-slate-800/40 border-slate-600/40 text-slate-400" };
  const seasonNum = getSeasonNumber(skill.name);
  const effects = SKILL_EFFECTS_MAP[skill.id] ?? [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const effectColor = (entry: SkillEffectEntry) => {
    if (entry.type === "Buff")   return "bg-emerald-950/50 border-emerald-700/40 text-emerald-300";
    if (entry.type === "Debuff") return "bg-red-950/50 border-red-700/40 text-red-300";
    return "bg-slate-800/50 border-slate-600/40 text-slate-300";
  };

  const formatEffect = (entry: SkillEffectEntry) => {
    const name  = entry.effect_name ?? entry.effect ?? "—";
    const parts: string[] = [];
    if (entry.target) parts.push(entry.target === "enemy" ? "Musuh" : entry.target === "self" ? "Diri" : entry.target);
    if (entry.amount != null && entry.amount > 0) {
      parts.push(entry.calc_type === "percent" ? `${entry.amount}%` : `+${entry.amount}`);
    }
    if (entry.chance != null && entry.chance < 100) parts.push(`${entry.chance}% chance`);
    if (entry.duration != null && entry.duration > 0)  parts.push(`${entry.duration} turn`);
    return { name, detail: parts.join(" · ") };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0e0e14] shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-5 pb-4 border-b border-white/[0.07] bg-[#0e0e14]">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${typeInfo.badge}`}>
                {typeInfo.icon} {typeInfo.label}
              </span>
              {seasonNum !== null && (
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-rose-900/40 border-rose-700/40 text-rose-300">
                  🎴 S{seasonNum}
                </span>
              )}
              {skill.premium && (
                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold bg-amber-900/40 border-amber-700/40 text-amber-400">
                  💎 Premium
                </span>
              )}
              <span className="text-[11px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
                Lv. {skill.level}
              </span>
            </div>
            <h2 className="text-base font-bold text-white leading-snug">{skill.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all text-sm mt-0.5"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Description */}
          <div>
            <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Deskripsi</p>
            <p className="text-sm text-slate-300 leading-relaxed">{skill.description}</p>
          </div>

          {/* Stats */}
          <div>
            <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Stats</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {skill.damage > 0 && <StatLarge label="Damage" value={`${skill.damage}%`} />}
              <StatLarge label="CP Cost" value={skill.cp_cost} />
              <StatLarge label="Cooldown" value={`${skill.cooldown} turn`} />
              <StatLarge label="Target" value={skill.target} />
              {skill.hit_chance != null && skill.hit_chance > 0 && (
                <StatLarge label="Hit Chance" value={`${skill.hit_chance}%`} />
              )}
            </div>
          </div>

          {/* Effects */}
          {effects.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Efek</p>
              <div className="flex flex-col gap-2">
                {effects.map((entry, i) => {
                  const { name, detail } = formatEffect(entry);
                  return (
                    <div key={i} className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 ${effectColor(entry)}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold truncate">{name}</span>
                        {entry.type && (
                          <span className="shrink-0 text-[10px] opacity-60 font-medium">
                            {entry.type === "Buff" ? "Buff" : entry.type === "Debuff" ? "Debuff" : entry.type}
                          </span>
                        )}
                      </div>
                      {detail && (
                        <span className="shrink-0 text-[11px] opacity-80 text-right">{detail}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price */}
          {(skill.price_gold > 0 || skill.price_tokens > 0) && (
            <div>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Harga</p>
              <div className="flex gap-3">
                {skill.price_gold > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-amber-700/30 bg-amber-950/20 px-3 py-2">
                    <span className="text-amber-400 text-xs">G</span>
                    <span className="text-sm font-bold text-amber-300">{skill.price_gold.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {skill.price_tokens > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-blue-700/30 bg-blue-950/20 px-3 py-2">
                    <span className="text-blue-400 text-xs">💎</span>
                    <span className="text-sm font-bold text-blue-300">{skill.price_tokens} token</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatLarge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-white/[0.04] border border-white/[0.07] px-3 py-2">
      <span className="text-[10px] text-slate-600">{label}</span>
      <span className="text-sm font-bold text-slate-200">{value}</span>
    </div>
  );
}

// ─── Skills Tab ───────────────────────────────────────────────────────────────

function SkillsTab({ skills }: { skills: Skill[] }) {
  const [nameSearch, setNameSearch] = useState("");
  const [effectSearch, setEffectSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState<number | "all">("all");
  const [premFilter, setPremFilter] = useState<"all" | "premium" | "free">("all");
  const [page, setPage] = useState(1);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const resetPage = useCallback(() => setPage(1), []);

  // Collect available season numbers from data
  const availableSeasons = useMemo(() => {
    const nums = new Set<number>();
    for (const s of skills) {
      const n = getSeasonNumber(s.name);
      if (n !== null) nums.add(n);
    }
    return Array.from(nums).sort((a, b) => a - b);
  }, [skills]);

  const isSeasonal_filter = typeFilter === "seasonal";

  const filtered = useMemo(() => {
    const nq = nameSearch.toLowerCase();
    const eq = effectSearch.toLowerCase();
    return skills.filter((s) => {
      if (nq && !s.name.toLowerCase().includes(nq)) return false;
      if (eq && !s.description.toLowerCase().includes(eq)) return false;
      if (isSeasonal_filter) {
        if (!isSeasonal(s.name)) return false;
        if (seasonFilter !== "all" && getSeasonNumber(s.name) !== seasonFilter) return false;
      } else if (typeFilter !== "all") {
        if (s.type !== typeFilter) return false;
      }
      if (premFilter === "premium" && !s.premium) return false;
      if (premFilter === "free" && s.premium) return false;
      return true;
    });
  }, [skills, nameSearch, effectSearch, typeFilter, isSeasonal_filter, seasonFilter, premFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleNameSearch(v: string)   { setNameSearch(v); resetPage(); }
  function handleEffectSearch(v: string) { setEffectSearch(v); resetPage(); }
  function handleEffectTag(keyword: string) {
    setEffectSearch((prev) => prev === keyword ? "" : keyword);
    resetPage();
  }
  function handleType(v: string)   { setTypeFilter(v); setSeasonFilter("all"); resetPage(); }
  function handlePrem(v: typeof premFilter) { setPremFilter(v); resetPage(); }
  function handleSeason(v: number | "all") { setSeasonFilter(v); resetPage(); }

  return (
    <div className="space-y-6">
      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        {/* Name + Description search row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="🔎 Cari nama skill..."
            value={nameSearch}
            onChange={(e) => handleNameSearch(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-red-700/60 focus:outline-none focus:ring-1 focus:ring-red-700/40"
          />
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="✨ Filter efek / deskripsi..."
              value={effectSearch}
              onChange={(e) => handleEffectSearch(e.target.value)}
              className={`w-full rounded-lg border bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                effectSearch
                  ? "border-violet-600/60 focus:border-violet-500 focus:ring-violet-600/30"
                  : "border-white/10 focus:border-red-700/60 focus:ring-red-700/40"
              }`}
            />
            {effectSearch && (
              <button
                onClick={() => { setEffectSearch(""); resetPage(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Effect quick-tags */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Quick filter efek</p>
          <div className="flex flex-wrap gap-1.5">
            {EFFECT_TAGS.map(({ label, keyword }) => {
              const active = effectSearch === keyword;
              return (
                <button
                  key={keyword}
                  onClick={() => handleEffectTag(keyword)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-all ${
                    active
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "border-white/10 text-slate-500 hover:text-violet-300 hover:border-violet-700/50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Type filter chips */}
        <div className="flex flex-wrap gap-2">
          <TypeChip active={typeFilter === "all"} onClick={() => handleType("all")}>
            🗂️ Semua
          </TypeChip>
          {Object.entries(SKILL_TYPE_MAP).map(([key, { label, icon, chip }]) => (
            <TypeChip key={key} active={typeFilter === key} onClick={() => handleType(key)} className={typeFilter !== key ? chip : ""}>
              {icon} {label}
            </TypeChip>
          ))}
          <TypeChip
            active={isSeasonal_filter}
            onClick={() => handleType("seasonal")}
            className={!isSeasonal_filter ? "bg-rose-950/60 border-rose-700/40 text-rose-300 hover:border-rose-500" : ""}
          >
            🎴 Seasonal
          </TypeChip>
        </div>

        {/* Season number sub-filter — only shown when "Seasonal" is active */}
        {isSeasonal_filter && (
          <div className="rounded-xl border border-rose-900/30 bg-rose-950/10 p-3">
            <p className="text-[11px] text-rose-400/70 font-semibold mb-2 uppercase tracking-wider">Season</p>
            {/* Horizontal scroll on mobile — never wraps */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => handleSeason("all")}
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium border transition-all ${
                  seasonFilter === "all"
                    ? "bg-rose-600 border-rose-500 text-white"
                    : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
                }`}
              >
                Semua
              </button>
              {availableSeasons.map((n) => (
                <button
                  key={n}
                  onClick={() => handleSeason(n)}
                  className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-bold border transition-all ${
                    seasonFilter === n
                      ? "bg-rose-600 border-rose-500 text-white"
                      : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
                  }`}
                >
                  S{n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Premium filter */}
        <div className="flex flex-wrap gap-2">
          {(["all", "free", "premium"] as const).map((v) => (
            <button
              key={v}
              onClick={() => handlePrem(v)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                premFilter === v
                  ? "bg-red-600/80 border-red-500 text-white"
                  : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
              }`}
            >
              {v === "all" ? "Semua" : v === "free" ? "G Gratis" : "💎 Premium"}
            </button>
          ))}
        </div>

        {/* Result count */}
        <p className="text-xs text-slate-600">
          Menampilkan {filtered.length.toLocaleString("id-ID")} dari {skills.length.toLocaleString("id-ID")} skill
        </p>
      </div>

      {/* Grid */}
      {paginated.length === 0 ? (
        <EmptyState text="Tidak ada skill yang cocok dengan filter." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginated.map((skill) => (
            <SkillCard key={skill.id} skill={skill} highlight={effectSearch} onSelect={setSelectedSkill} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} total={totalPages} onChange={setPage} />
      )}

      {/* Detail Modal */}
      {selectedSkill && (
        <SkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      )}
    </div>
  );
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-violet-500/30 text-violet-200 rounded px-0.5 not-italic font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {highlightText(text.slice(idx + query.length), query)}
    </>
  );
}

function SkillCard({ skill, highlight = "", onSelect }: { skill: Skill; highlight?: string; onSelect?: (s: Skill) => void }) {
  const typeInfo = SKILL_TYPE_MAP[skill.type] ?? { label: `Type ${skill.type}`, icon: "❓", badge: "bg-slate-800/40 border-slate-600/40 text-slate-400" };
  const seasonNum = getSeasonNumber(skill.name);
  const hasHighlight = highlight && skill.description.toLowerCase().includes(highlight.toLowerCase());

  return (
    <div
      className={`group flex flex-col gap-3 rounded-xl border p-4 transition-all cursor-pointer ${
        hasHighlight
          ? "border-violet-700/40 bg-violet-950/10 hover:border-violet-600/50 hover:bg-violet-950/20"
          : "border-white/[0.07] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.04]"
      }`}
      onClick={() => onSelect?.(skill)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${typeInfo.badge}`}>
              {typeInfo.icon} {typeInfo.label}
            </span>
            {seasonNum !== null && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-rose-900/40 border-rose-700/40 text-rose-300">
                🎴 S{seasonNum}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
            {skill.name}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {skill.premium && (
            <span className="rounded-full bg-amber-900/40 border border-amber-700/40 text-amber-400 px-2 py-0.5 text-[10px] font-bold">
              💎 Premium
            </span>
          )}
          <span className="text-[11px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
            Lv. {skill.level}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className={`text-xs text-slate-500 leading-relaxed line-clamp-2`}>
        {highlightText(skill.description, highlight)}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5 mt-auto">
        {skill.damage > 0 && <Stat label="DMG" value={`${skill.damage}%`} />}
        <Stat label="CP" value={skill.cp_cost} />
        <Stat label="CD" value={`${skill.cooldown}t`} />
        <Stat label="Target" value={skill.target} />
        {skill.hit_chance !== undefined && skill.hit_chance > 0 && <Stat label="Hit%" value={`${skill.hit_chance}%`} />}
      </div>

      {/* Price + detail hint */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
        <div className="flex gap-2">
          {skill.price_gold > 0 && (
            <span className="text-[11px] text-amber-500">G {skill.price_gold.toLocaleString("id-ID")}</span>
          )}
          {skill.price_tokens > 0 && (
            <span className="text-[11px] text-blue-400">💎 {skill.price_tokens} token</span>
          )}
        </div>
        <span className="text-[10px] text-slate-700 group-hover:text-slate-400 transition-colors shrink-0">
          Klik detail →
        </span>
      </div>
    </div>
  );
}

// ─── Talents Tab ──────────────────────────────────────────────────────────────

function TalentsTab({ talents }: { talents: Talent[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const groups = useMemo<TalentGroup[]>(() => {
    const map = groupByBaseId(talents);
    return Array.from(map.entries()).map(([baseId, levels]) => ({
      baseId,
      name: levels[0].talent_skill_name,
      type: levels[0].type ?? "normal",
      levels: [...levels].sort((a, b) => parseLevelFromId(a.id) - parseLevelFromId(b.id)),
    }));
  }, [talents]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return groups.filter((g) => {
      if (q && !g.name.toLowerCase().includes(q) && !g.levels.some(l => l.talent_skill_description.toLowerCase().includes(q))) return false;
      if (typeFilter !== "all" && g.type !== typeFilter) return false;
      return true;
    });
  }, [groups, search, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Cari nama atau efek talent..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); }}
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-red-700/60 focus:outline-none focus:ring-1 focus:ring-red-700/40"
        />
        <div className="flex flex-wrap gap-2">
          <TypeChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
            🗂️ Semua
          </TypeChip>
          {Object.entries(TALENT_TYPE_MAP).map(([key, { label, icon }]) => (
            <TypeChip key={key} active={typeFilter === key} onClick={() => setTypeFilter(key)}>
              {icon} {label}
            </TypeChip>
          ))}
        </div>
        <p className="text-xs text-slate-600">
          Menampilkan {filtered.length} dari {groups.length} talent
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState text="Tidak ada talent yang cocok dengan filter." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((group) => (
            <TalentGroupCard key={group.baseId} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

function TalentGroupCard({ group }: { group: TalentGroup }) {
  const [selectedLevel, setSelectedLevel] = useState(0);
  const typeInfo = TALENT_TYPE_MAP[group.type] ?? TALENT_TYPE_MAP.normal;
  const talent = group.levels[selectedLevel];

  if (!talent) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 hover:border-white/15 hover:bg-white/[0.04] transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold mb-1.5 ${typeInfo.badge}`}>
            {typeInfo.icon} {typeInfo.label}
          </span>
          <h3 className="text-sm font-bold text-white leading-snug">{group.name}</h3>
        </div>
      </div>

      {/* Level selector */}
      {group.levels.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {group.levels.map((_, i) => (
            <button
              key={i}
              onClick={() => setSelectedLevel(i)}
              className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${
                selectedLevel === i
                  ? "bg-red-600 text-white"
                  : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Description */}
      <p className="text-xs text-slate-400 leading-relaxed">{talent.talent_skill_description}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5 mt-auto">
        {talent.talent_skill_damage > 0 && <Stat label="DMG" value={`${talent.talent_skill_damage}%`} />}
        {talent.talent_skill_cp_cost > 0 && <Stat label="CP" value={talent.talent_skill_cp_cost} />}
        {talent.skill_cooldown > 0 && <Stat label="CD" value={`${talent.skill_cooldown}t`} />}
        {talent.chance != null && talent.chance > 0 && <Stat label="Chance" value={`${talent.chance}%`} />}
        {talent.amount != null && talent.amount > 0 && <Stat label="Amount" value={talent.amount} />}
        {talent.increase_max_hp != null && talent.increase_max_hp > 0 && <Stat label="+Max HP" value={talent.increase_max_hp} />}
      </div>
    </div>
  );
}

// ─── Senjutsu Tab ─────────────────────────────────────────────────────────────

function SenjutsuTab({ senjutsu }: { senjutsu: Senjutsu[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const groups = useMemo<SenjutsuGroup[]>(() => {
    const map = groupByBaseId(senjutsu);
    return Array.from(map.entries()).map(([baseId, levels]) => ({
      baseId,
      name: levels[0].name,
      type: levels[0].type,
      levels: [...levels].sort((a, b) => parseLevelFromId(a.id) - parseLevelFromId(b.id)),
    }));
  }, [senjutsu]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return groups.filter((g) => {
      if (q && !g.name.toLowerCase().includes(q) && !g.levels.some(l => l.description.toLowerCase().includes(q))) return false;
      if (typeFilter !== "all" && g.type !== typeFilter) return false;
      return true;
    });
  }, [groups, search, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Cari nama atau efek senjutsu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-red-700/60 focus:outline-none focus:ring-1 focus:ring-red-700/40"
        />
        <div className="flex flex-wrap gap-2">
          <TypeChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
            🗂️ Semua
          </TypeChip>
          {Object.entries(SENJUTSU_TYPE_MAP).map(([key, { label, icon, chip }]) => (
            <TypeChip key={key} active={typeFilter === key} onClick={() => setTypeFilter(key)} className={typeFilter !== key ? chip : ""}>
              {icon} {label}
            </TypeChip>
          ))}
        </div>
        <p className="text-xs text-slate-600">
          Menampilkan {filtered.length} dari {groups.length} senjutsu
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState text="Tidak ada senjutsu yang cocok dengan filter." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((group) => (
            <SenjutsuGroupCard key={group.baseId} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

function SenjutsuGroupCard({ group }: { group: SenjutsuGroup }) {
  const [selectedLevel, setSelectedLevel] = useState(0);
  const typeInfo = SENJUTSU_TYPE_MAP[group.type] ?? SENJUTSU_TYPE_MAP.other;
  const senj = group.levels[selectedLevel];

  if (!senj) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 hover:border-white/15 hover:bg-white/[0.04] transition-all">
      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold mb-1.5 ${typeInfo.badge}`}>
            {typeInfo.icon} {typeInfo.label}
          </span>
          <h3 className="text-sm font-bold text-white leading-snug">{group.name}</h3>
        </div>
      </div>

      {/* Level selector */}
      {group.levels.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {group.levels.map((_, i) => (
            <button
              key={i}
              onClick={() => setSelectedLevel(i)}
              className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${
                selectedLevel === i
                  ? "bg-red-600 text-white"
                  : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Description */}
      <p className="text-xs text-slate-400 leading-relaxed">{senj.description}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5 mt-auto">
        {senj.damage > 0 && <Stat label="DMG" value={`${senj.damage}%`} />}
        {senj.sp_cost > 0 && <Stat label="SP" value={senj.sp_cost} />}
        {senj.cooldown > 0 && <Stat label="CD" value={`${senj.cooldown}t`} />}
        {senj.target && <Stat label="Target" value={senj.target} />}
        {senj.increase_max_hp != null && senj.increase_max_hp > 0 && <Stat label="+Max HP" value={`${senj.increase_max_hp}%`} />}
        {senj.increase_damage != null && senj.increase_damage > 0 && <Stat label="+DMG" value={`${senj.increase_damage}%`} />}
      </div>

      {/* Effects */}
      {senj.effects && senj.effects.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2 border-t border-white/5">
          {senj.effects.map((ef, i) => (
            <span
              key={i}
              className={`text-[10px] px-1.5 py-0.5 rounded border ${
                ef.is_debuff
                  ? "bg-red-950/40 border-red-800/30 text-red-400"
                  : "bg-emerald-950/40 border-emerald-800/30 text-emerald-400"
              }`}
            >
              {ef.effect_name ?? ef.type}
              {ef.amount != null && ef.amount > 0 ? ` ${ef.amount}` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function TypeChip({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
        active
          ? "bg-red-600/80 border-red-500 text-white"
          : `border-white/10 text-slate-500 hover:text-slate-300 ${className}`
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-white/[0.03] border border-white/[0.05] px-2 py-1">
      <span className="text-[10px] text-slate-600">{label}</span>
      <span className="text-[11px] font-semibold text-slate-300">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <span className="text-4xl">🔍</span>
      <p className="text-slate-500 text-sm">{text}</p>
    </div>
  );
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = useMemo(() => {
    const arr: (number | "...")[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) arr.push(i);
    } else {
      arr.push(1);
      if (page > 3) arr.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) arr.push(i);
      if (page < total - 2) arr.push("...");
      arr.push(total);
    }
    return arr;
  }, [page, total]);

  const btnBase = "border transition-all disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      {/* Prev */}
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className={`${btnBase} px-3 py-1.5 rounded-lg text-xs border-white/10 text-slate-400 hover:text-white hover:border-white/20`}
      >
        ← Prev
      </button>

      {/* Desktop: numbered buttons */}
      <div className="hidden sm:flex items-center gap-1">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-2 text-slate-600 text-xs">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`w-8 h-8 rounded-lg text-xs font-medium border transition-all ${
                page === p
                  ? "bg-red-600 border-red-500 text-white"
                  : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      {/* Mobile: compact X / Y indicator */}
      <span className="sm:hidden text-xs text-slate-500 px-2">
        <span className="font-bold text-white">{page}</span>
        <span className="mx-1">/</span>
        {total}
      </span>

      {/* Next */}
      <button
        disabled={page === total}
        onClick={() => onChange(page + 1)}
        className={`${btnBase} px-3 py-1.5 rounded-lg text-xs border-white/10 text-slate-400 hover:text-white hover:border-white/20`}
      >
        Next →
      </button>
    </div>
  );
}
