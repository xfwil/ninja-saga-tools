"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import IconImg from "./IconImg";
import skillsJson from "../../dump/skills.json";
import talentsJson from "../../dump/talents.json";
import senjutsuJson from "../../dump/senjutsu.json";
import petJson from "../../dump/pet.json";
import skillEffectsJson from "../../dump/skill-effect.json";
import gamedataJson from "../../dump/gamedata.json";
import libraryJson from "../../dump/library.json";
import weaponEffectJson from "../../dump/weapon-effect.json";
import backEffectJson from "../../dump/back_item-effect.json";
import enemyJson from "../../dump/enemy.json";
import sourcesJson from "../../dump/sources.json";

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
  category?: string;
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

type GameEffect = {
  name: string;
  description: string;
  category: "offense" | "defense" | "hybrid" | "control";
  kind: "buff" | "debuff";
};

type LibItem = {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  level: number;
  damage: number;
  price_gold: number;
  price_tokens: number;
  price_prestige: number;
  price_merit?: number;
  premium: boolean;
  buyable: boolean;
  buyable_clan?: boolean;
  sellable?: boolean;
};

type ItemEffect = {
  passive?: boolean;
  type?: string;
  target?: string;
  effect?: string;
  effect_name?: string;
  duration?: number;
  calc_type?: string;
  amount?: number;
  chance?: number;
};

type SeasonGroup = {
  season: number;
  weapons:     LibItem[];
  backs:       LibItem[];
  costumes:    { baseId: string; name: string; variants: LibItem[] }[];
  hairs:       { baseId: string; name: string; variants: LibItem[] }[];
  accessories: LibItem[];
  skills:      Skill[];
};

type SeasonalCategory = "clan" | "crew" | "shadowwar";

type EnemyAttackEffect = {
  passive?: boolean;
  type?: string;
  target?: string;
  effect?: string;
  effect_name?: string;
  calc_type?: string;
  amount?: number;
  duration?: number;
  chance?: number;
};

type EnemyAttack = {
  cooldown: number;
  animation?: string;
  posType?: string;
  dmg: number;
  multi_hit: boolean;
  effects: EnemyAttackEffect[];
  is_self_skill?: boolean;
  is_static?: boolean;
  combo_skill?: boolean;
  next_skill?: boolean;
};

type Enemy = {
  id: string;
  level: number;
  name: string;
  hp: number;
  cp: number;
  dodge: number;
  critical: number;
  purify: number;
  accuracy: number;
  agility: number;
  reactive: number;
  combustion: number;
  description: string;
  calculation?: number;
  calculation_agility?: number;
  attacks?: EnemyAttack[];
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

type PetAttackEffect = {
  type?: string;
  effect?: string;
  target?: string;
  amount?: number;
  duration?: number;
  chance?: number;
  calc_type?: string;
};

type PetAttack = {
  level: number;
  name: string;
  description: string;
  cooldown: number;
  dmg: number;
  effects?: PetAttackEffect[];
};

type Pet = {
  id: string;
  level: number;
  name: string;
  hp: number;
  cp: number;
  dodge: number;
  critical: number;
  purify: number;
  accuracy: number;
  agility: number;
  description: string;
  attacks?: PetAttack[];
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

// ─── Seasonal Rewards Data ────────────────────────────────────────────────────

const _libItems = libraryJson as LibItem[];
const _wfxMap: Record<string, ItemEffect[]> = Object.fromEntries(
  (weaponEffectJson as { id: string; effects?: ItemEffect[] }[]).map((e) => [e.id, e.effects ?? []])
);
const _bfxMap: Record<string, ItemEffect[]> = Object.fromEntries(
  (backEffectJson as { id: string; effects?: ItemEffect[] }[]).map((e) => [e.id, e.effects ?? []])
);

// ─── Source / Obtain Config ───────────────────────────────────────────────────

const SOURCE_CONFIG: Record<string, { label: string; icon: string; badge: string }> = {
  shop_normal:      { label: "Normal Shop",     icon: "🛒", badge: "bg-blue-900/40 border-blue-700/40 text-blue-300" },
  shop_clan:        { label: "Clan Shop",       icon: "🏯", badge: "bg-orange-900/40 border-orange-700/40 text-orange-300" },
  shop_pvp:         { label: "PvP Shop",        icon: "⚔️", badge: "bg-red-900/40 border-red-700/40 text-red-300" },
  shop_crew:        { label: "Crew Shop",       icon: "👥", badge: "bg-cyan-900/40 border-cyan-700/40 text-cyan-300" },
  pet_shop:         { label: "Pet Shop",        icon: "🐾", badge: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300" },
  talent_shop:      { label: "Bloodline Shop",  icon: "💫", badge: "bg-violet-900/40 border-violet-700/40 text-violet-300" },
  senjutsu_shop:    { label: "Senjutsu Shop",   icon: "🐸", badge: "bg-green-900/40 border-green-700/40 text-green-300" },
  academy:          { label: "Academy",         icon: "📚", badge: "bg-sky-900/40 border-sky-700/40 text-sky-300" },
  advanced_academy: { label: "Adv. Academy",    icon: "🎓", badge: "bg-indigo-900/40 border-indigo-700/40 text-indigo-300" },
  blacksmith:       { label: "Blacksmith",      icon: "🔨", badge: "bg-amber-900/40 border-amber-700/40 text-amber-300" },
  material_market:  { label: "Material Market", icon: "⚗️", badge: "bg-lime-900/40 border-lime-700/40 text-lime-300" },
  hunting_market:   { label: "Hunting Market",  icon: "🏹", badge: "bg-teal-900/40 border-teal-700/40 text-teal-300" },
  clan_forge:       { label: "Clan Forge",      icon: "🔥", badge: "bg-rose-900/40 border-rose-700/40 text-rose-300" },
  dragon_gacha:     { label: "Dragon Gacha",    icon: "🐉", badge: "bg-purple-900/40 border-purple-700/40 text-purple-300" },
  daily_gacha:      { label: "Event Gacha",     icon: "🎰", badge: "bg-pink-900/40 border-pink-700/40 text-pink-300" },
  scroll_of_wisdom: { label: "Scroll of Wisdom",icon: "📜", badge: "bg-yellow-900/40 border-yellow-700/40 text-yellow-300" },
  limited_store:    { label: "Limited Store",   icon: "⏳", badge: "bg-fuchsia-900/40 border-fuchsia-700/40 text-fuchsia-300" },
  contest_shop:     { label: "Contest Shop",    icon: "🏆", badge: "bg-amber-900/40 border-amber-700/40 text-amber-400" },
  friendship_shop:  { label: "Friendship Shop", icon: "🤝", badge: "bg-pink-900/40 border-pink-700/40 text-pink-300" },
  special_deals:    { label: "Special Deals",   icon: "🎁", badge: "bg-rose-900/40 border-rose-700/40 text-rose-300" },
  divine_tree:      { label: "Divine Tree",     icon: "🌳", badge: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300" },
  justice_badge:    { label: "Justice Badge",   icon: "⚖️", badge: "bg-slate-800/40 border-slate-600/40 text-slate-300" },
  mission_reward:   { label: "Mission",         icon: "📋", badge: "bg-slate-800/40 border-slate-600/40 text-slate-300" },
  event_seasonal:   { label: "Seasonal Event",  icon: "🎴", badge: "bg-rose-900/40 border-rose-700/40 text-rose-300" },
  dragon_hunt:      { label: "Dragon Hunt",     icon: "🐲", badge: "bg-red-900/40 border-red-700/40 text-red-300" },
  monster_hunter:   { label: "Monster Hunter",  icon: "👹", badge: "bg-orange-900/40 border-orange-700/40 text-orange-300" },
  billing_packages: { label: "Cash Shop",       icon: "💰", badge: "bg-amber-900/40 border-amber-700/40 text-amber-400" },
  set_packages:     { label: "Set Package",     icon: "📦", badge: "bg-pink-900/40 border-pink-700/40 text-pink-300" },
  daily_scratch:    { label: "Daily Scratch",   icon: "🎫", badge: "bg-yellow-900/40 border-yellow-700/40 text-yellow-300" },
  clan_war:         { label: "Clan War",        icon: "⚔️", badge: "bg-red-900/40 border-red-700/40 text-red-300" },
  shadow_war:       { label: "Shadow War",     icon: "🗡️", badge: "bg-rose-900/40 border-rose-700/40 text-rose-300" },
  crew_battle:      { label: "Crew Battle",    icon: "👥", badge: "bg-cyan-900/40 border-cyan-700/40 text-cyan-300" },
  hunting_house:    { label: "Hunting House",   icon: "🏠", badge: "bg-teal-900/40 border-teal-700/40 text-teal-300" },
  pet_combination:  { label: "Pet Fusion",      icon: "🔮", badge: "bg-violet-900/40 border-violet-700/40 text-violet-300" },
  tailed_beast:     { label: "Tailed Beast",    icon: "🦊", badge: "bg-orange-900/40 border-orange-700/40 text-orange-300" },
};

// ─── Source Lookup (pre-computed by sync-dump.js → dump/sources.json) ─────────

const _sources: Record<string, string[]> = sourcesJson as Record<string, string[]>;

/** Look up pre-computed sources for any entity by ID. */
function getSources(id: string): string[] {
  return _sources[id] ?? [];
}

const _EVENT_LABELS: Record<string, string> = {
  valentine2025: "Valentine 2025", anniv2025: "Anniversary 2025", ramadhan2025: "Ramadhan 2025",
  easter2025: "Easter 2025", wmg2025: "WMG 2025", summer2025: "Summer 2025",
  independence2025: "Independence 2025", yinyang2025: "Yin Yang 2025", halloween2025: "Halloween 2025",
  confrontingdeath2025: "Confronting Death 2025", thanksgiving2025: "Thanksgiving 2025", christmas2025: "Christmas 2025",
  phantomkyunoki2026: "Phantom Kyunoki 2026", valentine2026: "Valentine 2026", anniv2026: "Anniversary 2026",
  ramadhan2026: "Ramadhan 2026", hanami2026: "Hanami 2026",
};

function getSourceDisplay(src: string): { icon: string; label: string; badge: string } | null {
  // Static sources
  const cfg = SOURCE_CONFIG[src];
  if (cfg) return cfg;
  // Dynamic event sources: "event:valentine2025" etc.
  if (src.startsWith("event:")) {
    const eventKey = src.slice(6);
    const label = _EVENT_LABELS[eventKey] ?? eventKey;
    return { icon: "🎴", label, badge: "bg-rose-900/40 border-rose-700/40 text-rose-300" };
  }
  return null;
}

function SourceBadges({ sources }: { sources: string[] }) {
  return (
    <div>
      <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Sumber / Cara Dapat</p>
      {sources.length === 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-neutral-800/40 border-neutral-600/40 text-neutral-400">
          ❓ Tidak Diketahui
        </span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {sources.map((src) => {
            const display = getSourceDisplay(src);
            if (!display) return null;
            return (
              <span key={src} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${display.badge}`}>
                {display.icon} {display.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function _parseSeasonNum(name: string): number | null {
  const m = name.match(/^S(\d+)\s+(Clan|Crew|Shadow War)/i);
  return m ? parseInt(m[1], 10) : null;
}

function _parseSkillSeasonNum(name: string): number | null {
  // Skills are named "S{N} Kinjutsu: ..." or "S{N} Sage ..." — just extract S{N}
  const m = name.match(/^S(\d+)\s/i);
  return m ? parseInt(m[1], 10) : null;
}

function _buildSeasonMap(cat: SeasonalCategory): Map<number, SeasonGroup> {
  const items   = _libItems.filter((i) => i.category === cat);
  const catSkills = (skillsJson as Skill[]).filter((s) => s.category === cat);
  const map = new Map<number, SeasonGroup>();

  const ensureGroup = (s: number) => {
    if (!map.has(s)) map.set(s, { season: s, weapons: [], backs: [], costumes: [], hairs: [], accessories: [], skills: [] });
    return map.get(s)!;
  };

  for (const item of items) {
    const s = _parseSeasonNum(item.name);
    if (s === null) continue;
    const g = ensureGroup(s);
    if (item.type === "wpn")       g.weapons.push(item);
    else if (item.type === "back") g.backs.push(item);
    else if (item.type === "accessory") g.accessories.push(item);
    else if (item.type === "set" || item.type === "hair") {
      const baseId  = item.id.replace(/_\d+$/, "");
      const arr     = item.type === "set" ? g.costumes : g.hairs;
      const existing = arr.find((x) => x.baseId === baseId);
      if (existing) existing.variants.push(item);
      else arr.push({ baseId, name: item.name, variants: [item] });
    }
  }

  for (const skill of catSkills) {
    const s = _parseSkillSeasonNum(skill.name);
    if (s === null) continue;
    ensureGroup(s).skills.push(skill);
  }

  return new Map([...map.entries()].sort((a, b) => a[0] - b[0]));
}

const SEASONAL_MAPS: Record<SeasonalCategory, Map<number, SeasonGroup>> = {
  clan:      _buildSeasonMap("clan"),
  crew:      _buildSeasonMap("crew"),
  shadowwar: _buildSeasonMap("shadowwar"),
};

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
  const [activeTab, setActiveTab] = useState<"skills" | "items" | "talents" | "senjutsu" | "pets" | "enemies" | "effects" | "seasonal">("skills");

  const enemies = enemyJson as Enemy[];

  const skills = skillsJson as Skill[];
  const talents = talentsJson as Talent[];
  const senjutsu = senjutsuJson as Senjutsu[];
  const pets = petJson as Pet[];

  const totalSeasonal = SEASONAL_MAPS.clan.size + SEASONAL_MAPS.crew.size + SEASONAL_MAPS.shadowwar.size;

  const tabs = [
    { key: "skills",   label: "Skills",   count: skills.length,                                 icon: "⚔️" },
    { key: "items",    label: "Items",    count: _libItems.length,                               icon: "🗡️" },
    { key: "talents",  label: "Talents",  count: [...groupByBaseId(talents).keys()].length,      icon: "💫" },
    { key: "senjutsu", label: "Senjutsu", count: [...groupByBaseId(senjutsu).keys()].length,     icon: "🍃" },
    { key: "pets",     label: "Pets",     count: pets.length,                                     icon: "🐾" },
    { key: "enemies",  label: "Enemy",   count: enemies.length,                                  icon: "👹" },
    { key: "effects",  label: "Efek",     count: GAME_EFFECTS.length,                           icon: "✨" },
    { key: "seasonal", label: "Seasonal", count: totalSeasonal,                                  icon: "🏆" },
  ] as const;

  return (
    <div>
      {/* Tab Bar */}
      <div className="mb-8 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 min-w-max sm:min-w-0 sm:flex sm:flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap sm:flex-1 ${
                activeTab === tab.key
                  ? "bg-red-600/80 text-white shadow-lg shadow-red-900/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`hidden lg:inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-white/5 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "skills"   && <SkillsTab   skills={skills} />}
      {activeTab === "items"    && <ItemsTab />}
      {activeTab === "talents"  && <TalentsTab  talents={talents} />}
      {activeTab === "senjutsu" && <SenjutsuTab senjutsu={senjutsu} />}
      {activeTab === "pets"     && <PetsTab pets={pets} />}
      {activeTab === "enemies"  && <EnemyTab enemies={enemies} />}
      {activeTab === "effects"  && <EffectsTab  />}
      {activeTab === "seasonal" && <SeasonalTab />}
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
  { label: "Stun",            keyword: "stun" },
  { label: "Burn",            keyword: "burn" },
  { label: "Bleed",           keyword: "bleed" },
  { label: "Blind",           keyword: "blind" },
  { label: "Sleep",           keyword: "sleep" },
  { label: "Poison",          keyword: "poison" },
  { label: "Freeze",          keyword: "frozen" },
  { label: "Slow",            keyword: "slow" },
  { label: "Fear",            keyword: "fear" },
  { label: "Disorient",       keyword: "disorient" },
  { label: "Darkness",        keyword: "darkness" },
  { label: "Dark Curse",      keyword: "dark curse" },
  { label: "Demonic Curse",   keyword: "demonic curse" },
  { label: "Meridian Seal",   keyword: "meridian seal" },
  { label: "Internal Injury", keyword: "internal injury" },
  { label: "Disperse",        keyword: "disperse" },
  { label: "Drain HP",        keyword: "drain hp" },
  { label: "Drain CP",        keyword: "drain cp" },
  { label: "Reduce MAX HP",   keyword: "reduce max hp" },
  { label: "Reduce MAX HP",   keyword: "insta reduce max hp" },
  { label: "Recover HP",      keyword: "recover hp" },
  { label: "Critical",        keyword: "critical" },
  { label: "Absorb HP",       keyword: "absorb hp" },
  { label: "Seal/Lock",       keyword: "seal" },
  { label: "Agility",         keyword: "agility" },
  { label: "Heal",            keyword: "heal" },
  { label: "Debuff Resist",   keyword: "debuff resist" },
  { label: "Instant Kill",    keyword: "instant kill" },
].filter((tag, idx, arr) => arr.findIndex(t => t.label === tag.label) === idx);

// ─── Skill effects lookup ─────────────────────────────────────────────────────

const SKILL_EFFECTS_MAP = Object.fromEntries(
  (skillEffectsJson as SkillEffectRecord[]).map((e) => [e.skill_id, e.skill_effect ?? []])
);

/** Returns true if any effect of this skill matches the query string. */
function effectMatchesQuery(skillId: string, query: string): boolean {
  const fxList = SKILL_EFFECTS_MAP[skillId] ?? [];
  const q = query.toLowerCase();
  return fxList.some((fx) => {
    const name = (fx.effect_name ?? "").toLowerCase();
    const key  = (fx.effect ?? "").toLowerCase().replace(/_/g, " ");
    return name.includes(q) || key.includes(q);
  });
}

// ─── Game Effects (Buffs & Debuffs) ──────────────────────────────────────────

type _GDEntry = { id: string; data: Record<string, unknown> };
const _gdEnc = (gamedataJson as unknown as _GDEntry[]).find((e) => e.id === "encyclopedia");
const _effData = _gdEnc?.data?.["effect"] as { buffs: Omit<GameEffect,"kind">[]; debuffs: Omit<GameEffect,"kind">[] } | undefined;
const _rawBuffs:  Omit<GameEffect,"kind">[] = _effData?.buffs  ?? [];
const _rawDebuffs: Omit<GameEffect,"kind">[] = _effData?.debuffs ?? [];

const GAME_EFFECTS: GameEffect[] = [
  ..._rawBuffs.map((e)  => ({ ...e, kind: "buff"   as const })),
  ..._rawDebuffs.map((e) => ({ ...e, kind: "debuff" as const })),
];

/** Normalize a string for fuzzy matching (lowercase, collapse spaces/underscores) */
function normEffect(s: string): string {
  return s.toLowerCase().replace(/[_\s-]+/g, " ").trim();
}

/** Pre-built map: normalized effect name → array of skill names */
const _skillMap = Object.fromEntries((skillsJson as { id: string; name: string }[]).map((s) => [s.id, s.name]));

const EFFECT_SKILLS_MAP: Record<string, string[]> = {};
for (const eff of GAME_EFFECTS) {
  const n = normEffect(eff.name);
  const matching: string[] = [];
  for (const [skillId, fxList] of Object.entries(SKILL_EFFECTS_MAP)) {
    const hits = fxList.some((fx) => {
      const fxName = normEffect(fx.effect_name ?? "");
      const fxKey  = normEffect(fx.effect ?? "");
      return fxName === n || fxKey === n || fxName.includes(n) || (n.includes(fxKey) && fxKey.length > 3);
    });
    if (hits) matching.push(_skillMap[skillId] ?? skillId);
  }
  EFFECT_SKILLS_MAP[eff.name] = matching;
}

// ─── Skill Detail Modal ───────────────────────────────────────────────────────

function SkillModal({ skill, onClose, highlight = "" }: { skill: Skill; onClose: () => void; highlight?: string }) {
  const typeInfo = SKILL_TYPE_MAP[skill.type] ?? { label: `Type ${skill.type}`, icon: "❓", badge: "bg-slate-800/40 border-slate-600/40 text-slate-400" };
  const seasonNum = getSeasonNumber(skill.name);
  const effects = SKILL_EFFECTS_MAP[skill.id] ?? [];
  const hlLower = highlight.toLowerCase();

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
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
              <IconImg id={skill.id} size={40} />
            </div>
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
                  const nameKey  = (entry.effect_name ?? "").toLowerCase();
                  const effectKey = (entry.effect ?? "").toLowerCase().replace(/_/g, " ");
                  const isMatched = hlLower && (nameKey.includes(hlLower) || effectKey.includes(hlLower));
                  return (
                    <div
                      key={i}
                      className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 transition-all ${
                        isMatched
                          ? "border-violet-500/60 bg-violet-950/40 ring-1 ring-violet-500/20"
                          : effectColor(entry)
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-semibold truncate ${isMatched ? "text-violet-200" : ""}`}>
                          {name}
                        </span>
                        {isMatched && (
                          <span className="shrink-0 text-[9px] font-bold text-violet-400 bg-violet-900/40 border border-violet-700/40 rounded px-1">
                            match
                          </span>
                        )}
                        {entry.type && !isMatched && (
                          <span className="shrink-0 text-[10px] opacity-60 font-medium">
                            {entry.type === "Buff" ? "Buff" : entry.type === "Debuff" ? "Debuff" : entry.type}
                          </span>
                        )}
                      </div>
                      {detail && (
                        <span className={`shrink-0 text-[11px] text-right ${isMatched ? "text-violet-300 opacity-100" : "opacity-80"}`}>
                          {detail}
                        </span>
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

          {/* Sources */}
          <SourceBadges sources={getSources(skill.id)} />
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

type ViewMode = "grid" | "list" | "compact";

function SkillsTab({ skills }: { skills: Skill[] }) {
  const [nameSearch, setNameSearch] = useState("");
  const [effectSearch, setEffectSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState<number | "all">("all");
  const [premFilter, setPremFilter] = useState<"all" | "premium" | "free">("all");
  const [cpMin, setCpMin] = useState<number | "">("");
  const [cpMax, setCpMax] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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
    const minCp = cpMin !== "" ? cpMin : null;
    const maxCp = cpMax !== "" ? cpMax : null;
    return skills.filter((s) => {
      if (nq && !s.name.toLowerCase().includes(nq)) return false;
      if (eq) {
        const inDesc   = s.description.toLowerCase().includes(eq);
        const inEffect = effectMatchesQuery(s.id, eq);
        if (!inDesc && !inEffect) return false;
      }
      if (isSeasonal_filter) {
        if (!isSeasonal(s.name)) return false;
        if (seasonFilter !== "all" && getSeasonNumber(s.name) !== seasonFilter) return false;
      } else if (typeFilter !== "all") {
        if (s.type !== typeFilter) return false;
      }
      if (premFilter === "premium" && !s.premium) return false;
      if (premFilter === "free" && s.premium) return false;
      if (minCp !== null && s.cp_cost < minCp) return false;
      if (maxCp !== null && s.cp_cost > maxCp) return false;
      return true;
    });
  }, [skills, nameSearch, effectSearch, typeFilter, isSeasonal_filter, seasonFilter, premFilter, cpMin, cpMax]);

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
  function handleCpPreset(min: number | "", max: number | "") { setCpMin(min); setCpMax(max); resetPage(); }
  function clearCp() { setCpMin(""); setCpMax(""); resetPage(); }
  const cpActive = cpMin !== "" || cpMax !== "";

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
                  key={label}
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

        {/* CP Cost filter */}
        <div className={`rounded-xl border p-3 transition-colors ${cpActive ? "border-cyan-800/50 bg-cyan-950/10" : "border-white/[0.06] bg-white/[0.02]"}`}>
          <div className="flex items-center justify-between mb-2.5">
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${cpActive ? "text-cyan-400" : "text-slate-600"}`}>
              💧 Filter CP Cost
            </p>
            {cpActive && (
              <button onClick={clearCp} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors">
                ✕ Reset
              </button>
            )}
          </div>
          {/* Preset chips */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {([
              { label: "Gratis (0)",    min: 0,   max: 0   },
              { label: "≤ 100",         min: "",  max: 100  },
              { label: "≤ 200",         min: "",  max: 200  },
              { label: "200 – 400",     min: 200, max: 400  },
              { label: "400 – 600",     min: 400, max: 600  },
              { label: "600+",          min: 600, max: ""   },
            ] as { label: string; min: number | ""; max: number | "" }[]).map(({ label, min, max }) => {
              const isActive = cpMin === min && cpMax === max;
              return (
                <button
                  key={label}
                  onClick={() => isActive ? clearCp() : handleCpPreset(min, max)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-all ${
                    isActive
                      ? "bg-cyan-600 border-cyan-500 text-white"
                      : "border-white/10 text-slate-500 hover:text-cyan-300 hover:border-cyan-700/50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {/* Manual min/max inputs */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Min CP"
              value={cpMin}
              onChange={(e) => { setCpMin(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value))); resetPage(); }}
              className="w-24 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-700/60 focus:outline-none focus:ring-1 focus:ring-cyan-700/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-slate-600 text-xs">—</span>
            <input
              type="number"
              min={0}
              placeholder="Max CP"
              value={cpMax}
              onChange={(e) => { setCpMax(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value))); resetPage(); }}
              className="w-24 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-700/60 focus:outline-none focus:ring-1 focus:ring-cyan-700/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            {cpActive && (
              <span className="text-[11px] text-cyan-400 ml-1">
                {cpMin !== "" && cpMax !== "" ? `${cpMin}–${cpMax} CP`
                  : cpMin !== "" ? `≥ ${cpMin} CP`
                  : `≤ ${cpMax} CP`}
              </span>
            )}
          </div>
        </div>

        {/* Result count + view toggle */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-600">
            Menampilkan {filtered.length.toLocaleString("id-ID")} dari {skills.length.toLocaleString("id-ID")} skill
          </p>
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
            {(["grid", "list", "compact"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={mode === "grid" ? "Grid" : mode === "list" ? "List" : "Compact"}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all flex items-center gap-1 ${
                  viewMode === mode
                    ? "bg-red-600/80 text-white"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {mode === "grid"    && <><GridIcon /><span className="hidden sm:inline">Grid</span></>}
                {mode === "list"    && <><ListIcon /><span className="hidden sm:inline">List</span></>}
                {mode === "compact" && <><CompactIcon /><span className="hidden sm:inline">Compact</span></>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {paginated.length === 0 ? (
        <EmptyState text="Tidak ada skill yang cocok dengan filter." />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginated.map((skill) => (
            <SkillCard key={skill.id} skill={skill} highlight={effectSearch} onSelect={setSelectedSkill} />
          ))}
        </div>
      ) : viewMode === "list" ? (
        <div className="flex flex-col gap-2">
          {paginated.map((skill) => (
            <SkillRow key={skill.id} skill={skill} highlight={effectSearch} onSelect={setSelectedSkill} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.04] rounded-xl border border-white/[0.07] overflow-hidden">
          {paginated.map((skill) => (
            <SkillCompactRow key={skill.id} skill={skill} highlight={effectSearch} onSelect={setSelectedSkill} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} total={totalPages} onChange={setPage} />
      )}

      {/* Detail Modal */}
      {selectedSkill && (
        <SkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} highlight={effectSearch} />
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
  const hlLower = highlight.toLowerCase();
  const matchDesc   = !!highlight && skill.description.toLowerCase().includes(hlLower);
  const matchEffect = !!highlight && effectMatchesQuery(skill.id, hlLower);
  const hasHighlight = matchDesc || matchEffect;

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
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] mt-0.5">
          <IconImg id={skill.id} size={32} />
        </div>
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
            {skill.premium && (
              <span className="rounded-full bg-amber-900/40 border border-amber-700/40 text-amber-400 px-2 py-0.5 text-[10px] font-bold">
                💎 Premium
              </span>
            )}
            <span className="text-[11px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
              Lv. {skill.level}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
            {skill.name}
          </h3>
        </div>
      </div>

      {/* Effect-match badge */}
      {matchEffect && !matchDesc && (
        <span className="inline-flex items-center gap-1 self-start rounded-full border border-violet-700/40 bg-violet-950/30 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
          ✦ match di efek
        </span>
      )}

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
        {highlightText(skill.description, matchDesc ? highlight : "")}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5 mt-auto">
        {skill.damage > 0 && <Stat label="DMG" value={`${skill.damage}%`} />}
        <Stat label="CP" value={skill.cp_cost} />
        <Stat label="CD" value={`${skill.cooldown}t`} />
        <Stat label="Target" value={skill.target} />
        {skill.hit_chance !== undefined && skill.hit_chance > 0 && <Stat label="Hit%" value={`${skill.hit_chance}%`} />}
      </div>

      {/* Sources + Price + detail hint */}
      <div className="pt-2 border-t border-white/5 space-y-2">
        {(() => {
          const srcs = getSources(skill.id);
          return srcs.length > 0 ? (
            <div className="flex flex-wrap gap-1">
               {srcs.map((src) => {
                const display = getSourceDisplay(src);
                if (!display) return null;
                return (
                  <span key={src} className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${display.badge}`}>
                    {display.icon} {display.label}
                  </span>
                );
              })}
            </div>
          ) : null;
        })()}
        <div className="flex items-center justify-between gap-2">
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
    </div>
  );
}

// ─── View Icons ───────────────────────────────────────────────────────────────

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="0" y="0" width="6" height="6" rx="1" /><rect x="8" y="0" width="6" height="6" rx="1" />
      <rect x="0" y="8" width="6" height="6" rx="1" /><rect x="8" y="8" width="6" height="6" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="0" y="0" width="14" height="3" rx="1" /><rect x="0" y="5.5" width="14" height="3" rx="1" />
      <rect x="0" y="11" width="14" height="3" rx="1" />
    </svg>
  );
}

function CompactIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="0" y="0" width="14" height="2" rx="0.5" /><rect x="0" y="4" width="14" height="2" rx="0.5" />
      <rect x="0" y="8" width="14" height="2" rx="0.5" /><rect x="0" y="12" width="14" height="2" rx="0.5" />
    </svg>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────

function SkillRow({ skill, highlight = "", onSelect }: { skill: Skill; highlight?: string; onSelect?: (s: Skill) => void }) {
  const typeInfo = SKILL_TYPE_MAP[skill.type] ?? { label: `Type ${skill.type}`, icon: "❓", badge: "bg-slate-800/40 border-slate-600/40 text-slate-400" };
  const seasonNum = getSeasonNumber(skill.name);
  const hlLower = highlight.toLowerCase();
  const matchDesc   = !!highlight && skill.description.toLowerCase().includes(hlLower);
  const matchEffect = !!highlight && effectMatchesQuery(skill.id, hlLower);
  const hasHighlight = matchDesc || matchEffect;

  return (
    <div
      className={`group flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
        hasHighlight
          ? "border-violet-700/40 bg-violet-950/10 hover:border-violet-600/50 hover:bg-violet-950/20"
          : "border-white/[0.07] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.04]"
      }`}
      onClick={() => onSelect?.(skill)}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
        <IconImg id={skill.id} size={28} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <span className={`text-[10px] font-bold border rounded-full px-1.5 py-0.5 ${typeInfo.badge}`}>
            {typeInfo.label}
          </span>
          {seasonNum !== null && (
            <span className="text-[10px] font-bold border rounded-full px-1.5 py-0.5 bg-rose-900/40 border-rose-700/40 text-rose-300">
              S{seasonNum}
            </span>
          )}
          {skill.premium && (
            <span className="text-[10px] font-bold border rounded-full px-1.5 py-0.5 bg-amber-900/40 border-amber-700/40 text-amber-400">
              💎
            </span>
          )}
          {matchEffect && !matchDesc && (
            <span className="text-[10px] font-semibold border rounded-full px-1.5 py-0.5 border-violet-700/40 bg-violet-950/30 text-violet-300">
              ✦ efek
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-white leading-snug mb-1 truncate">{skill.name}</p>
        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-1">
          {highlightText(skill.description, matchDesc ? highlight : "")}
        </p>
      </div>

      {/* Stats column */}
      <div className="shrink-0 flex flex-col items-end gap-1 text-[11px]">
        <span className="text-slate-600">Lv.{skill.level}</span>
        <div className="flex flex-wrap justify-end gap-x-2 gap-y-0.5">
          {skill.damage > 0 && <span className="text-orange-400">DMG {skill.damage}%</span>}
          <span className="text-blue-400">CP {skill.cp_cost}</span>
          <span className="text-slate-400">CD {skill.cooldown}t</span>
          <span className="text-slate-500">{skill.target}</span>
        </div>
        <span className="text-[10px] text-slate-700 group-hover:text-slate-400 transition-colors">detail →</span>
      </div>
    </div>
  );
}

// ─── Compact Row ──────────────────────────────────────────────────────────────

function SkillCompactRow({ skill, highlight = "", onSelect }: { skill: Skill; highlight?: string; onSelect?: (s: Skill) => void }) {
  const typeInfo = SKILL_TYPE_MAP[skill.type] ?? { label: `Type ${skill.type}`, icon: "❓", badge: "bg-slate-800/40 border-slate-600/40 text-slate-400" };
  const seasonNum = getSeasonNumber(skill.name);
  const hlLower = highlight.toLowerCase();
  const matchDesc   = !!highlight && skill.description.toLowerCase().includes(hlLower);
  const matchEffect = !!highlight && effectMatchesQuery(skill.id, hlLower);
  const hasHighlight = matchDesc || matchEffect;

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-all ${
        hasHighlight ? "bg-violet-950/20 hover:bg-violet-950/30" : "bg-transparent hover:bg-white/[0.03]"
      }`}
      onClick={() => onSelect?.(skill)}
    >
      {/* Icon */}
      <IconImg id={skill.id} size={18} className="shrink-0" />

      {/* Name */}
      <p className="flex-1 min-w-0 text-xs font-medium text-slate-200 truncate">
        {skill.name}
        {seasonNum !== null && (
          <span className="ml-1.5 text-[10px] text-rose-400 font-bold">S{seasonNum}</span>
        )}
        {skill.premium && <span className="ml-1 text-[10px] text-amber-400">💎</span>}
        {matchEffect && !matchDesc && <span className="ml-1.5 text-[10px] text-violet-400 font-bold">✦</span>}
      </p>

      {/* Inline stats */}
      <div className="shrink-0 flex items-center gap-3 text-[11px]">
        {skill.damage > 0 && <span className="text-orange-400 w-14 text-right">DMG {skill.damage}%</span>}
        {!(skill.damage > 0) && <span className="w-14" />}
        <span className="text-blue-400 w-12 text-right">CP {skill.cp_cost}</span>
        <span className="text-slate-500 w-10 text-right">CD {skill.cooldown}t</span>
        <span className="text-slate-600 w-12 text-right hidden sm:inline">{skill.target}</span>
        <span className="text-slate-700 group-hover:text-slate-400 transition-colors text-[10px]">→</span>
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
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
          <IconImg id={group.baseId} size={32} />
        </div>
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

      {/* Sources */}
      <SourceBadges sources={["talent_shop"]} />
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
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
          <IconImg id={group.baseId} size={32} />
        </div>
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

      {/* Sources */}
      <SourceBadges sources={["senjutsu_shop"]} />
    </div>
  );
}

// ─── Pets Tab ─────────────────────────────────────────────────────────────────

function formatPetAttackEffects(effects: PetAttackEffect[] = []): string {
  if (effects.length === 0) return "Tanpa efek tambahan";

  return effects
    .map((fx) => {
      const name = (fx.effect ?? "effect").replace(/_/g, " ");
      const amount = fx.amount != null
        ? fx.calc_type === "percent"
          ? `${fx.amount}%`
          : `${fx.amount}`
        : null;
      const dur = fx.duration != null && fx.duration > 0 ? `${fx.duration}t` : null;
      const chance = fx.chance != null && fx.chance < 100 ? `${fx.chance}%` : null;
      const detail = [amount, dur, chance].filter(Boolean).join(" · ");
      return `${name}${detail ? ` (${detail})` : ""}`;
    })
    .join("; ");
}

function PetsTab({ pets }: { pets: Pet[] }) {
  const [search, setSearch] = useState("");
  const [attackFilter, setAttackFilter] = useState<"all" | "has-skills" | "no-skills">("all");
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [page, setPage] = useState(1);
  const resetPage = useCallback(() => setPage(1), []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...pets]
      .filter((pet) => {
        const attacks = pet.attacks ?? [];
        if (q && !pet.name.toLowerCase().includes(q) && !pet.description.toLowerCase().includes(q)) return false;
        if (attackFilter === "has-skills" && attacks.length === 0) return false;
        if (attackFilter === "no-skills" && attacks.length > 0) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [pets, search, attackFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Cari nama atau deskripsi pet..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-red-700/60 focus:outline-none focus:ring-1 focus:ring-red-700/40"
        />
        <div className="flex flex-wrap gap-2">
          <TypeChip active={attackFilter === "all"} onClick={() => { setAttackFilter("all"); resetPage(); }}>
            🗂️ Semua
          </TypeChip>
          <TypeChip active={attackFilter === "has-skills"} onClick={() => { setAttackFilter("has-skills"); resetPage(); }}>
            ⚔️ Punya Skill
          </TypeChip>
          <TypeChip active={attackFilter === "no-skills"} onClick={() => { setAttackFilter("no-skills"); resetPage(); }}>
            💤 Tanpa Skill
          </TypeChip>
        </div>
        <p className="text-xs text-slate-600">Menampilkan {filtered.length} dari {pets.length} pet</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState text="Tidak ada pet yang cocok dengan filter." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginated.map((pet) => {
            const attacks = [...(pet.attacks ?? [])].sort((a, b) => a.level - b.level);
            return (
              <div key={pet.id} className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 hover:border-white/15 hover:bg-white/[0.04] transition-all">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-emerald-700/30 bg-emerald-950/20">
                    <IconImg id={pet.id} size={32} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        🐾 Pet
                      </span>
                      <span className="text-[11px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">Lv. {pet.level}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">{pet.name}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{pet.description}</p>

                <div className="grid grid-cols-2 gap-1.5">
                  <Stat label="HP" value={pet.hp} />
                  <Stat label="CP" value={pet.cp} />
                  <Stat label="Agi" value={pet.agility} />
                  <Stat label="Acc" value={pet.accuracy} />
                  <Stat label="Crit" value={`${pet.critical}%`} />
                  <Stat label="Dodge" value={`${pet.dodge}%`} />
                </div>

                <div className="pt-2 border-t border-white/[0.06] mt-auto space-y-2">
                  {(() => {
                    const srcs = getSources(pet.id);
                    return srcs.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {srcs.map((src) => {
                          const display = getSourceDisplay(src);
                          if (!display) return null;
                          return (
                            <span key={src} className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${display.badge}`}>
                              {display.icon} {display.label}
                            </span>
                          );
                        })}
                      </div>
                    ) : null;
                  })()}
                  <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-1.5">Skill Pet</p>
                  {attacks.length === 0 ? (
                    <p className="text-[11px] text-slate-700 italic">Belum ada skill.</p>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-400">{attacks.length} skill tersedia</p>
                      <button
                        onClick={() => setSelectedPet(pet)}
                        className="shrink-0 rounded-lg border border-cyan-700/40 bg-cyan-950/20 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:border-cyan-600/50 hover:bg-cyan-950/35 transition-all"
                      >
                        Lihat detail →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} total={totalPages} onChange={setPage} />
      )}

      {selectedPet && (
        <PetSkillsModal pet={selectedPet} onClose={() => setSelectedPet(null)} />
      )}
    </div>
  );
}

function PetSkillsModal({ pet, onClose }: { pet: Pet; onClose: () => void }) {
  const attacks = useMemo(() => [...(pet.attacks ?? [])].sort((a, b) => a.level - b.level), [pet]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0e0e14] shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-5 pb-4 border-b border-white/[0.07] bg-[#0e0e14]">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                🐾 Pet
              </span>
              <span className="text-[11px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">Lv. {pet.level}</span>
            </div>
            <h2 className="text-base font-bold text-white">{pet.name} — Skill Detail</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{pet.description}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Sources */}
          <SourceBadges sources={getSources(pet.id)} />

          {attacks.length === 0 ? (
            <p className="text-sm text-slate-600 italic">Pet ini belum memiliki skill.</p>
          ) : (
            attacks.map((attack) => (
              <div key={`${pet.id}-${attack.level}-${attack.name}`} className="rounded-xl border border-cyan-800/35 bg-cyan-950/12 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-cyan-300 truncate">Lv.{attack.level} {attack.name}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-800/35 bg-blue-950/20 text-blue-300">CD {attack.cooldown}t</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-orange-800/35 bg-orange-950/20 text-orange-300">DMG x{attack.dmg}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{attack.description}</p>
                <p className="text-xs text-emerald-300/90 mt-2 leading-relaxed">Efek: {formatPetAttackEffects(attack.effects ?? [])}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Seasonal Tab ─────────────────────────────────────────────────────────────

const SEASONAL_CAT_CONFIG: Record<
  SeasonalCategory,
  { label: string; icon: string; accent: string; accentBg: string; selectorBorder: string; activePill: string }
> = {
  clan:      { label: "Clan",       icon: "🏯", accent: "text-amber-300",  accentBg: "bg-amber-950/20",  selectorBorder: "border-amber-800/30",  activePill: "bg-amber-600 border-amber-500 text-white" },
  crew:      { label: "Crew",       icon: "⚓", accent: "text-cyan-300",   accentBg: "bg-cyan-950/20",   selectorBorder: "border-cyan-800/30",   activePill: "bg-cyan-700 border-cyan-500 text-white" },
  shadowwar: { label: "Shadow War", icon: "⚔️", accent: "text-rose-300",   accentBg: "bg-rose-950/20",   selectorBorder: "border-rose-800/30",   activePill: "bg-rose-700 border-rose-500 text-white" },
};

const ITEM_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  wpn:       { label: "Weapon",    icon: "🗡️",  color: "text-orange-300", bg: "bg-orange-950/30",  border: "border-orange-800/40" },
  back:      { label: "Back Item", icon: "🎒",  color: "text-violet-300", bg: "bg-violet-950/30", border: "border-violet-800/40" },
  set:       { label: "Kostum",    icon: "👘",  color: "text-pink-300",   bg: "bg-pink-950/30",   border: "border-pink-800/40" },
  hair:      { label: "Hairstyle", icon: "💇",  color: "text-teal-300",   bg: "bg-teal-950/30",   border: "border-teal-800/40" },
  accessory: { label: "Aksesori",  icon: "💍",  color: "text-yellow-300", bg: "bg-yellow-950/30", border: "border-yellow-800/40" },
  skill:     { label: "Kinjutsu",  icon: "🌀",  color: "text-indigo-300", bg: "bg-indigo-950/30", border: "border-indigo-800/40" },
};

function SeasonalTab() {
  const [cat, setCat]       = useState<SeasonalCategory>("clan");
  const [season, setSeason] = useState<number>(0);

  const seasonMap   = SEASONAL_MAPS[cat];
  const seasons     = useMemo(() => [...seasonMap.keys()], [seasonMap]);
  const validSeason = seasons.includes(season) ? season : (seasons[0] ?? 0);
  const group       = seasonMap.get(validSeason);
  const cfg         = SEASONAL_CAT_CONFIG[cat];

  return (
    <div className="space-y-5">
      {/* Category sub-tabs */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {(Object.entries(SEASONAL_CAT_CONFIG) as [SeasonalCategory, typeof SEASONAL_CAT_CONFIG[SeasonalCategory]][]).map(([key, val]) => {
          const keySeasons = [...SEASONAL_MAPS[key].keys()];
          return (
            <button
              key={key}
              onClick={() => { setCat(key); setSeason(SEASONAL_MAPS[key].keys().next().value ?? 0); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                cat === key ? "bg-red-600/80 text-white shadow-lg shadow-red-900/30" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{val.icon}</span>
              <span>{val.label}</span>
              <span className={`hidden sm:inline rounded-full px-2 py-0.5 text-[10px] font-bold ${cat === key ? "bg-white/20 text-white" : "bg-white/5 text-slate-500"}`}>
                {keySeasons.length} seasons
              </span>
            </button>
          );
        })}
      </div>

      {/* Season selector */}
      <div className={`rounded-xl border p-3 ${cfg.selectorBorder} ${cfg.accentBg}`}>
        <p className={`text-[11px] font-semibold mb-2.5 uppercase tracking-widest ${cfg.accent} opacity-80`}>
          {cfg.icon} {cfg.label} · Season
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {seasons.map((s) => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-bold border transition-all ${
                validSeason === s
                  ? cfg.activePill
                  : "border-white/[0.08] bg-white/[0.03] text-slate-500 hover:text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
              }`}
            >
              S{s}
            </button>
          ))}
        </div>
      </div>

      {/* Season content */}
      {group ? <SeasonDetail group={group} cat={cat} /> : <EmptyState text="Season tidak ditemukan." />}
    </div>
  );
}

function SeasonDetail({ group, cat }: { group: SeasonGroup; cat: SeasonalCategory }) {
  const cfg = SEASONAL_CAT_CONFIG[cat];

  const totalItems =
    group.weapons.length + group.backs.length + group.accessories.length +
    group.costumes.length + group.hairs.length + group.skills.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex items-center gap-4 rounded-xl border ${cfg.selectorBorder} ${cfg.accentBg} px-4 py-3`}>
        <span className="text-3xl">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <h2 className={`text-base font-bold ${cfg.accent}`}>Season {group.season} — {cfg.label}</h2>
          <p className="text-xs text-slate-600 mt-0.5">{totalItems} reward tersedia</p>
        </div>
        <div className="hidden sm:flex gap-2 flex-wrap justify-end">
          {group.skills.length > 0 && <StatPill icon="🌀" label="Skill" value={group.skills.length} />}
          {group.weapons.length > 0 && <StatPill icon="🗡️" label="Wpn" value={group.weapons.length} />}
          {group.backs.length > 0 && <StatPill icon="🎒" label="Back" value={group.backs.length} />}
          {group.costumes.length > 0 && <StatPill icon="👘" label="Set" value={group.costumes.length} />}
        </div>
      </div>

      {/* Skills (Kinjutsu) */}
      {group.skills.length > 0 && (
        <SeasonSection title="Kinjutsu / Skill" icon="🌀" count={group.skills.length} color="text-indigo-400">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.skills.map((s) => (
              <SeasonSkillCard key={s.id} skill={s} />
            ))}
          </div>
        </SeasonSection>
      )}

      {/* Weapons + Back side by side */}
      {(group.weapons.length > 0 || group.backs.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {group.weapons.length > 0 && (
            <SeasonSection title="Weapon" icon="🗡️" count={group.weapons.length} color="text-orange-400">
              <div className="flex flex-col gap-3">
                {group.weapons.map((item) => (
                  <SeasonItemCard key={item.id} item={item} effects={_wfxMap[item.id] ?? []} />
                ))}
              </div>
            </SeasonSection>
          )}
          {group.backs.length > 0 && (
            <SeasonSection title="Back Item" icon="🎒" count={group.backs.length} color="text-violet-400">
              <div className="flex flex-col gap-3">
                {group.backs.map((item) => (
                  <SeasonItemCard key={item.id} item={item} effects={_bfxMap[item.id] ?? []} />
                ))}
              </div>
            </SeasonSection>
          )}
        </div>
      )}

      {/* Accessories */}
      {group.accessories.length > 0 && (
        <SeasonSection title="Aksesori" icon="💍" count={group.accessories.length} color="text-yellow-400">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.accessories.map((item) => (
              <SeasonItemCard key={item.id} item={item} effects={[]} />
            ))}
          </div>
        </SeasonSection>
      )}

      {/* Costumes + Hair side by side */}
      {(group.costumes.length > 0 || group.hairs.length > 0) && (
        <div className={`grid gap-6 ${group.costumes.length > 0 && group.hairs.length > 0 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {group.costumes.length > 0 && (
            <SeasonSection title="Kostum" icon="👘" count={group.costumes.length} color="text-pink-400">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.costumes.map((c) => (
                  <SeasonCostumeCard key={c.baseId} name={c.name} variants={c.variants} type="set" />
                ))}
              </div>
            </SeasonSection>
          )}
          {group.hairs.length > 0 && (
            <SeasonSection title="Hairstyle" icon="💇" count={group.hairs.length} color="text-teal-400">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.hairs.map((h) => (
                  <SeasonCostumeCard key={h.baseId} name={h.name} variants={h.variants} type="hair" />
                ))}
              </div>
            </SeasonSection>
          )}
        </div>
      )}
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] text-slate-400">
      <span>{icon}</span>
      <span className="font-semibold text-white">{value}</span>
      <span>{label}</span>
    </span>
  );
}

function SeasonSection({ title, icon, count, color, children }: { title: string; icon: string; count: number; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.06]">
        <span className="text-base">{icon}</span>
        <h3 className={`text-sm font-bold ${color}`}>{title}</h3>
        <span className="text-[11px] text-slate-600 bg-white/[0.04] border border-white/[0.08] rounded-full px-2 py-0.5 ml-1">{count}</span>
      </div>
      {children}
    </div>
  );
}

function SeasonSkillCard({ skill }: { skill: Skill }) {
  const effects = (SKILL_EFFECTS_MAP[skill.id] ?? []) as SkillEffectEntry[];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-indigo-800/20 bg-indigo-950/10 p-4">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-indigo-800/30 bg-indigo-950/20">
          <IconImg id={skill.id} size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-800/40 bg-indigo-950/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300 mb-1.5">
            🌀 Kinjutsu
          </span>
          <h4 className="text-sm font-bold text-white leading-snug">{skill.name}</h4>
        </div>
        {skill.damage > 0 && (
          <span className="shrink-0 text-[11px] font-bold text-orange-400 bg-orange-950/20 border border-orange-800/30 rounded-md px-2 py-0.5">
            {skill.damage} DMG
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed">{skill.description}</p>

      {/* Stats row */}
      <div className="flex gap-2 flex-wrap">
        {skill.cooldown > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded-md border border-white/[0.07] bg-white/[0.03] text-blue-400">
            ⏱ {skill.cooldown}t CD
          </span>
        )}
        {skill.cp_cost > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded-md border border-white/[0.07] bg-white/[0.03] text-cyan-400">
            💧 {skill.cp_cost} CP
          </span>
        )}
        {skill.target && (
          <span className="text-[11px] px-2 py-0.5 rounded-md border border-white/[0.07] bg-white/[0.03] text-slate-500">
            {skill.target}
          </span>
        )}
      </div>

      {/* Effects */}
      {effects.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {effects.slice(0, 3).map((fx, i) => {
            const isDebuff = fx.type === "Debuff";
            const amount = fx.amount != null && fx.amount > 0
              ? (fx.calc_type === "percent" ? `${fx.amount}%` : `+${fx.amount}`)
              : null;
            return (
              <div key={i} className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
                isDebuff ? "bg-red-950/30 border-red-800/30 text-red-300" : "bg-emerald-950/30 border-emerald-800/30 text-emerald-300"
              }`}>
                <span className="font-medium truncate">{fx.effect_name ?? fx.effect}</span>
                <span className="shrink-0 text-[11px] opacity-70">{[amount, fx.duration ? `${fx.duration}t` : null].filter(Boolean).join(" · ")}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SeasonItemCard({ item, effects }: { item: LibItem; effects: ItemEffect[] }) {
  const [expanded, setExpanded] = useState(false);
  const typeCfg = ITEM_TYPE_CONFIG[item.type];

  const formatFx = (fx: ItemEffect) => {
    const name = fx.effect_name ?? fx.effect ?? "—";
    const parts: string[] = [];
    if (fx.target) parts.push(fx.target === "enemy" ? "Musuh" : fx.target === "self" ? "Diri" : fx.target);
    if (fx.amount != null && fx.amount > 0) parts.push(fx.calc_type === "percent" ? `${fx.amount}%` : `+${fx.amount}`);
    if (fx.chance != null && fx.chance < 100) parts.push(`${fx.chance}% chance`);
    if (fx.duration != null && fx.duration > 0) parts.push(`${fx.duration}t`);
    return { name, detail: parts.join(" · "), isDebuff: fx.type === "Debuff" };
  };

  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 ${typeCfg?.border ?? "border-white/[0.07]"} ${typeCfg?.bg ?? "bg-white/[0.02]"}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border ${typeCfg?.border ?? "border-white/[0.08]"} bg-black/20`}>
          <IconImg id={item.id} size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold mb-1.5 ${typeCfg?.border ?? ""} ${typeCfg?.bg ?? ""} ${typeCfg?.color ?? "text-slate-400"}`}>
            {typeCfg?.icon} {typeCfg?.label}
          </span>
          <h4 className="text-sm font-bold text-white leading-snug">{item.name}</h4>
        </div>
        {item.damage > 0 && (
          <span className="shrink-0 text-[11px] font-bold text-orange-400 bg-orange-950/20 border border-orange-800/30 rounded-md px-2 py-0.5">
            {item.damage} DMG
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>

      {/* Effects */}
      {effects.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-1.5">Efek Pasif</p>
          <div className="flex flex-col gap-1.5">
            {(expanded ? effects : effects.slice(0, 3)).map((fx, i) => {
              const { name, detail, isDebuff } = formatFx(fx);
              return (
                <div key={i} className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
                  isDebuff ? "bg-red-950/30 border-red-800/30 text-red-300" : "bg-emerald-950/30 border-emerald-800/30 text-emerald-300"
                }`}>
                  <span className="font-medium truncate">{name}</span>
                  {detail && <span className="shrink-0 text-[11px] opacity-70">{detail}</span>}
                </div>
              );
            })}
            {effects.length > 3 && (
              <button onClick={() => setExpanded(p => !p)} className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors text-left">
                {expanded ? "Sembunyikan" : `+${effects.length - 3} efek lainnya`}
              </button>
            )}
          </div>
        </div>
      )}

      {item.level > 1 && <p className="text-[10px] text-slate-700">Req. Lv. {item.level}</p>}
    </div>
  );
}

function SeasonCostumeCard({ name, variants, type }: { name: string; variants: LibItem[]; type: string }) {
  const typeCfg = ITEM_TYPE_CONFIG[type] ?? ITEM_TYPE_CONFIG.set;
  return (
    <div className={`flex flex-col gap-2 rounded-xl border p-3.5 ${typeCfg.border} ${typeCfg.bg}`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border ${typeCfg.border} bg-black/20`}>
          <IconImg id={variants[0]?.id ?? ""} size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1 rounded-full border self-start px-2 py-0.5 text-[10px] font-bold ${typeCfg.border} ${typeCfg.bg} ${typeCfg.color}`}>
            {typeCfg.icon} {typeCfg.label}
          </span>
          <h4 className="text-sm font-semibold text-white leading-snug mt-1">{name}</h4>
        </div>
      </div>
      {variants[0]?.description && (
        <p className="text-[11px] text-slate-500 leading-relaxed">{variants[0].description}</p>
      )}
      <div className="flex gap-1.5 flex-wrap mt-auto pt-1">
        {variants.map((v, i) => (
          <span key={v.id} className="text-[10px] px-2 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] text-slate-500">
            {i === 0 ? "♂ Male" : "♀ Female"}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Items Tab ────────────────────────────────────────────────────────────────

const ITEM_SUB_TYPES = [
  { key: "all",       label: "Semua",     icon: "🗂️" },
  { key: "wpn",       label: "Weapon",    icon: "🗡️" },
  { key: "back",      label: "Back Item", icon: "🎒" },
  { key: "accessory", label: "Aksesori",  icon: "💍" },
  { key: "set",       label: "Kostum",    icon: "👘" },
  { key: "hair",      label: "Hairstyle", icon: "💇" },
  { key: "item",      label: "Consumable", icon: "📦" },
] as const;

const ITEM_CATEGORY_FILTERS = [
  { key: "all",        label: "Semua" },
  { key: "none",       label: "Normal" },
  { key: "clan",       label: "Clan" },
  { key: "crew",       label: "Crew" },
  { key: "shadowwar",  label: "Shadow War" },
  { key: "event",      label: "Event" },
  { key: "package",    label: "Package" },
  { key: "spending",   label: "Spending" },
  { key: "deals",      label: "Deals" },
  { key: "leaderboard", label: "Leaderboard" },
] as const;

function ItemsTab() {
  const [search, setSearch]       = useState("");
  const [typeFilter, setType]     = useState("all");
  const [catFilter, setCat]       = useState("all");
  const [page, setPage]           = useState(1);
  const [selectedItem, setSelected] = useState<LibItem | null>(null);
  const resetPage = useCallback(() => setPage(1), []);

  const items = _libItems;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (catFilter === "none" && item.category) return false;
      if (catFilter !== "all" && catFilter !== "none" && item.category !== catFilter) return false;
      if (q && !item.name.toLowerCase().includes(q) && !item.id.toLowerCase().includes(q) && !(item.description ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, typeFilter, catFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Count per type for badges
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) counts[item.type] = (counts[item.type] ?? 0) + 1;
    return counts;
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <input
        type="text"
        placeholder="🔎 Cari nama, ID, atau deskripsi item..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); resetPage(); }}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-red-700/60 focus:outline-none focus:ring-1 focus:ring-red-700/40"
      />

      {/* Type filter */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tipe</p>
        <div className="flex flex-wrap gap-1.5">
          {ITEM_SUB_TYPES.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setType(key); resetPage(); }}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                typeFilter === key
                  ? "bg-red-600/80 border-red-500 text-white"
                  : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
              }`}
            >
              {icon} {label}
              {key !== "all" && typeCounts[key] != null && (
                <span className="ml-1 opacity-60">({typeCounts[key]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kategori</p>
        <div className="flex flex-wrap gap-1.5">
          {ITEM_CATEGORY_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setCat(key); resetPage(); }}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                catFilter === key
                  ? "bg-red-600/80 border-red-500 text-white"
                  : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-600">Menampilkan {filtered.length} dari {items.length} item</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState text="Tidak ada item yang cocok dengan filter." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginated.map((item) => (
            <ItemGridCard key={item.id} item={item} onSelect={setSelected} highlight={search} />
          ))}
        </div>
      )}

      {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setPage} />}

      {/* Detail modal */}
      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ItemGridCard({ item, onSelect, highlight = "" }: { item: LibItem; onSelect: (i: LibItem) => void; highlight?: string }) {
  const typeCfg = ITEM_TYPE_CONFIG[item.type] ?? { label: item.type, icon: "📦", color: "text-slate-400", bg: "bg-slate-900/30", border: "border-slate-700/40" };
  const seasonNum = getSeasonNumber(item.name);
  const effects: ItemEffect[] = item.type === "wpn" ? (_wfxMap[item.id] ?? []) : item.type === "back" ? (_bfxMap[item.id] ?? []) : [];

  return (
    <div
      className={`group flex flex-col gap-3 rounded-xl border p-4 cursor-pointer transition-all ${typeCfg.border} ${typeCfg.bg} hover:brightness-110`}
      onClick={() => onSelect(item)}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border ${typeCfg.border} bg-black/20`}>
          <IconImg id={item.id} size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1 mb-1">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${typeCfg.border} ${typeCfg.bg} ${typeCfg.color}`}>
              {typeCfg.icon} {typeCfg.label}
            </span>
            {seasonNum !== null && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-rose-900/40 border-rose-700/40 text-rose-300">
                S{seasonNum}
              </span>
            )}
            {item.premium && (
              <span className="rounded-full bg-amber-900/40 border border-amber-700/40 text-amber-400 px-2 py-0.5 text-[10px] font-bold">
                💎
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
            {highlightText(item.name, highlight)}
          </h3>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{item.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5 mt-auto">
        {item.damage > 0 && <Stat label="DMG" value={item.damage} />}
        {item.level > 0 && <Stat label="Level" value={item.level} />}
        {effects.length > 0 && <Stat label="Efek" value={`${effects.length} pasif`} />}
      </div>

      {/* Sources + Price + hint */}
      <div className="pt-2 border-t border-white/5 space-y-2">
        {(() => {
          const srcs = getSources(item.id);
          return srcs.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {srcs.map((src) => {
                const display = getSourceDisplay(src);
                if (!display) return null;
                return (
                  <span key={src} className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${display.badge}`}>
                    {display.icon} {display.label}
                  </span>
                );
              })}
            </div>
          ) : null;
        })()}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {item.price_gold > 0 && (
              <span className="text-[11px] text-amber-500">G {item.price_gold.toLocaleString("id-ID")}</span>
            )}
            {item.price_tokens > 0 && (
              <span className="text-[11px] text-blue-400">💎 {item.price_tokens}</span>
            )}
          </div>
          <span className="text-[10px] text-slate-700 group-hover:text-slate-400 transition-colors shrink-0">
            Detail →
          </span>
        </div>
      </div>
    </div>
  );
}

function ItemDetailModal({ item, onClose }: { item: LibItem; onClose: () => void }) {
  const typeCfg = ITEM_TYPE_CONFIG[item.type] ?? { label: item.type, icon: "📦", color: "text-slate-400", bg: "bg-slate-900/30", border: "border-slate-700/40" };
  const seasonNum = getSeasonNumber(item.name);
  const effects: ItemEffect[] = item.type === "wpn" ? (_wfxMap[item.id] ?? []) : item.type === "back" ? (_bfxMap[item.id] ?? []) : [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0e0e14] shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-5 pb-4 border-b border-white/[0.07] bg-[#0e0e14]">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border ${typeCfg.border} bg-black/20`}>
              <IconImg id={item.id} size={40} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${typeCfg.border} ${typeCfg.bg} ${typeCfg.color}`}>
                  {typeCfg.icon} {typeCfg.label}
                </span>
                {seasonNum !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-rose-900/40 border-rose-700/40 text-rose-300">
                    🎴 S{seasonNum}
                  </span>
                )}
                {item.premium && (
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold bg-amber-900/40 border-amber-700/40 text-amber-400">
                    💎 Premium
                  </span>
                )}
                {item.level > 0 && (
                  <span className="text-[11px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
                    Lv. {item.level}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-white leading-snug">{item.name}</h2>
              <p className="text-[11px] text-slate-600 font-mono mt-1">ID: {item.id}</p>
            </div>
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
          {item.description && (
            <div>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Deskripsi</p>
              <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Stats */}
          <div>
            <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Stats</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {item.damage > 0 && <StatLarge label="Damage" value={item.damage} />}
              {item.level > 0 && <StatLarge label="Level" value={item.level} />}
              {item.category && <StatLarge label="Kategori" value={item.category} />}
            </div>
          </div>

          {/* Effects */}
          {effects.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Efek Pasif</p>
              <div className="flex flex-col gap-2">
                {effects.map((fx, i) => {
                  const name = fx.effect_name ?? fx.effect ?? "—";
                  const parts: string[] = [];
                  if (fx.target) parts.push(fx.target === "enemy" ? "Musuh" : fx.target === "self" ? "Diri" : fx.target);
                  if (fx.amount != null && fx.amount > 0) parts.push(fx.calc_type === "percent" ? `${fx.amount}%` : `+${fx.amount}`);
                  if (fx.chance != null && fx.chance < 100) parts.push(`${fx.chance}% chance`);
                  if (fx.duration != null && fx.duration > 0) parts.push(`${fx.duration}t`);
                  const isDebuff = fx.type === "Debuff";
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${
                        isDebuff
                          ? "bg-red-950/30 border-red-800/30 text-red-300"
                          : "bg-emerald-950/30 border-emerald-800/30 text-emerald-300"
                      }`}
                    >
                      <span className="font-medium truncate">{name}</span>
                      {parts.length > 0 && <span className="shrink-0 text-[11px] opacity-70">{parts.join(" · ")}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price */}
          {(item.price_gold > 0 || item.price_tokens > 0 || item.price_prestige > 0) && (
            <div>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Harga</p>
              <div className="flex flex-wrap gap-3">
                {item.price_gold > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-amber-700/30 bg-amber-950/20 px-3 py-2">
                    <span className="text-amber-400 text-xs">G</span>
                    <span className="text-sm font-bold text-amber-300">{item.price_gold.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {item.price_tokens > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-blue-700/30 bg-blue-950/20 px-3 py-2">
                    <span className="text-blue-400 text-xs">T</span>
                    <span className="text-sm font-bold text-blue-300">{item.price_tokens}</span>
                  </div>
                )}
                {item.price_prestige > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-purple-700/30 bg-purple-950/20 px-3 py-2">
                    <span className="text-purple-400 text-xs">P</span>
                    <span className="text-sm font-bold text-purple-300">{item.price_prestige}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sources */}
          <SourceBadges sources={getSources(item.id)} />
        </div>
      </div>
    </div>
  );
}

// ─── Enemy Tab ────────────────────────────────────────────────────────────────

function calcEnemyStats(enemy: Enemy, playerLevel: number) {
  const hasCalc = enemy.calculation != null;
  if (!hasCalc) {
    // Fixed stats enemy — use raw values
    return {
      level: enemy.level,
      hp: enemy.hp,
      cp: enemy.cp,
      agility: enemy.agility,
      dodge: enemy.dodge,
      critical: enemy.critical,
      purify: enemy.purify,
      accuracy: enemy.accuracy,
      reactive: enemy.reactive,
      combustion: enemy.combustion,
      isDynamic: false,
    };
  }

  const eLv = playerLevel + 5;
  const hp = playerLevel * enemy.calculation!;
  const cp = playerLevel * enemy.calculation!;
  const agility = 10 + playerLevel + (enemy.calculation_agility ?? 0);

  return {
    level: eLv,
    hp,
    cp,
    agility,
    dodge: enemy.dodge,
    critical: enemy.critical,
    purify: enemy.purify,
    accuracy: enemy.accuracy,
    reactive: enemy.reactive,
    combustion: enemy.combustion,
    isDynamic: true,
  };
}

const ENEMY_CALC_FILTERS = [
  { key: "all",     label: "Semua" },
  { key: "dynamic", label: "Dynamic (Calc)" },
  { key: "fixed",   label: "Fixed Stats" },
] as const;

const ENEMY_SORT_OPTIONS = [
  { key: "name",    label: "Nama" },
  { key: "agility", label: "Agility ↓" },
  { key: "hp",      label: "HP ↓" },
  { key: "level",   label: "Level ↓" },
] as const;

function EnemyTab({ enemies }: { enemies: Enemy[] }) {
  const [search, setSearch]       = useState("");
  const [calcFilter, setCalcFilter] = useState("all");
  const [sortBy, setSortBy]       = useState<string>("name");
  const [playerLevel, setPlayerLevel] = useState(95);
  const [page, setPage]           = useState(1);
  const [selectedEnemy, setSelected] = useState<Enemy | null>(null);
  const resetPage = useCallback(() => setPage(1), []);

  // Top agility leaderboard (always based on current player level)
  const topAgility = useMemo(() => {
    return [...enemies]
      .map((e) => ({ enemy: e, stats: calcEnemyStats(e, playerLevel) }))
      .sort((a, b) => b.stats.agility - a.stats.agility)
      .slice(0, 10);
  }, [enemies, playerLevel]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = enemies.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false;
      if (calcFilter === "dynamic" && e.calculation == null) return false;
      if (calcFilter === "fixed" && e.calculation != null) return false;
      return true;
    });

    // Sort
    if (sortBy === "agility") {
      list.sort((a, b) => calcEnemyStats(b, playerLevel).agility - calcEnemyStats(a, playerLevel).agility);
    } else if (sortBy === "hp") {
      list.sort((a, b) => calcEnemyStats(b, playerLevel).hp - calcEnemyStats(a, playerLevel).hp);
    } else if (sortBy === "level") {
      list.sort((a, b) => calcEnemyStats(b, playerLevel).level - calcEnemyStats(a, playerLevel).level);
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [enemies, search, calcFilter, sortBy, playerLevel]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const dynamicCount = enemies.filter((e) => e.calculation != null).length;
  const fixedCount   = enemies.length - dynamicCount;

  return (
    <div className="space-y-6">
      {/* Player Level Input */}
      <div className="rounded-xl border border-red-800/30 bg-red-950/10 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-bold text-red-300 mb-1">👤 Level Karakter</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Enemy dengan <span className="text-amber-400 font-semibold">calculation</span> akan dihitung berdasarkan level kamu.
              Enemy level = level + 5. HP/CP = level × calc. Agility = 10 + level + calc_agility.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Lv.</span>
            <input
              type="number"
              min={1}
              max={200}
              value={playerLevel}
              onChange={(e) => setPlayerLevel(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
              className="w-20 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-white text-center focus:border-red-700/60 focus:outline-none focus:ring-1 focus:ring-red-700/40"
            />
          </div>
        </div>
      </div>

      {/* Top Agility Leaderboard */}
      <div className="rounded-xl border border-violet-800/30 bg-violet-950/10 p-4">
        <p className="text-sm font-bold text-violet-300 mb-3">🏅 Top 10 Highest Agility <span className="text-[11px] font-normal text-slate-500">(@ Lv. {playerLevel})</span></p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-white/[0.06]">
                <th className="text-left py-1.5 pr-2 w-8">#</th>
                <th className="text-left py-1.5 pr-2">Enemy</th>
                <th className="text-right py-1.5 px-2">Agility</th>
                <th className="text-right py-1.5 px-2">HP</th>
                <th className="text-right py-1.5 px-2">Lv</th>
                <th className="text-right py-1.5 pl-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {topAgility.map(({ enemy, stats }, i) => (
                <tr
                  key={enemy.id}
                  className="border-b border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition-colors"
                  onClick={() => setSelected(enemy)}
                >
                  <td className={`py-1.5 pr-2 font-bold ${i < 3 ? "text-amber-400" : "text-slate-600"}`}>
                    {i + 1}
                  </td>
                  <td className="py-1.5 pr-2 font-semibold text-white truncate max-w-[180px]">{enemy.name}</td>
                  <td className="py-1.5 px-2 text-right font-bold text-violet-300">{stats.agility}</td>
                  <td className="py-1.5 px-2 text-right text-slate-400">{stats.hp.toLocaleString("id-ID")}</td>
                  <td className="py-1.5 px-2 text-right text-slate-500">{stats.level}</td>
                  <td className="py-1.5 pl-2 text-right">
                    {stats.isDynamic ? (
                      <span className="text-[10px] font-bold text-amber-400">⚡</span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600">📌</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="🔎 Cari nama atau ID enemy..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); resetPage(); }}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-red-700/60 focus:outline-none focus:ring-1 focus:ring-red-700/40"
      />

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Calc filter */}
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tipe</p>
          <div className="flex flex-wrap gap-1.5">
            {ENEMY_CALC_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setCalcFilter(key); resetPage(); }}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  calcFilter === key
                    ? "bg-red-600/80 border-red-500 text-white"
                    : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
                }`}
              >
                {label}
                {key === "dynamic" && <span className="ml-1 opacity-60">({dynamicCount})</span>}
                {key === "fixed" && <span className="ml-1 opacity-60">({fixedCount})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Urutkan</p>
          <div className="flex flex-wrap gap-1.5">
            {ENEMY_SORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setSortBy(key); resetPage(); }}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  sortBy === key
                    ? "bg-red-600/80 border-red-500 text-white"
                    : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600">Menampilkan {filtered.length} dari {enemies.length} enemy</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState text="Tidak ada enemy yang cocok dengan filter." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginated.map((enemy) => (
            <EnemyCard key={enemy.id} enemy={enemy} playerLevel={playerLevel} onSelect={setSelected} />
          ))}
        </div>
      )}

      {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setPage} />}

      {/* Detail modal */}
      {selectedEnemy && (
        <EnemyDetailModal enemy={selectedEnemy} playerLevel={playerLevel} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function EnemyCard({ enemy, playerLevel, onSelect }: { enemy: Enemy; playerLevel: number; onSelect: (e: Enemy) => void }) {
  const stats = calcEnemyStats(enemy, playerLevel);
  const attacks = enemy.attacks ?? [];
  const totalEffects = attacks.reduce((sum, a) => sum + (a.effects?.length ?? 0), 0);

  return (
    <div
      className="group flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 cursor-pointer hover:border-white/15 hover:bg-white/[0.04] transition-all"
      onClick={() => onSelect(enemy)}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-red-800/30 bg-red-950/20 text-lg">
          👹
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1 mb-1">
            {stats.isDynamic ? (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold border-amber-700/40 bg-amber-950/30 text-amber-300">
                ⚡ Dynamic
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold border-slate-600/40 bg-slate-800/30 text-slate-400">
                📌 Fixed
              </span>
            )}
            <span className="text-[11px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
              Lv. {stats.level}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">{enemy.name}</h3>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5">
        <Stat label="HP" value={stats.hp.toLocaleString("id-ID")} />
        <Stat label="CP" value={stats.cp.toLocaleString("id-ID")} />
        <Stat label="Agility" value={stats.agility} />
        {stats.dodge > 0 && <Stat label="Dodge" value={`${stats.dodge}%`} />}
        {stats.critical > 0 && <Stat label="Crit" value={`${stats.critical}%`} />}
        {stats.reactive > 0 && <Stat label="Reactive" value={`${stats.reactive}%`} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
        <div className="flex gap-2 text-[11px]">
          <span className="text-slate-500">{attacks.length} skill</span>
          {totalEffects > 0 && <span className="text-violet-400">{totalEffects} efek</span>}
        </div>
        <span className="text-[10px] text-slate-700 group-hover:text-slate-400 transition-colors shrink-0">
          Detail →
        </span>
      </div>
    </div>
  );
}

function EnemyDetailModal({ enemy, playerLevel, onClose }: { enemy: Enemy; playerLevel: number; onClose: () => void }) {
  const stats = calcEnemyStats(enemy, playerLevel);
  const attacks = enemy.attacks ?? [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0e0e14] shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-5 pb-4 border-b border-white/[0.07] bg-[#0e0e14]">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border border-red-800/30 bg-red-950/20 text-2xl">
              👹
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {stats.isDynamic ? (
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold border-amber-700/40 bg-amber-950/30 text-amber-300">
                    ⚡ Dynamic
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold border-slate-600/40 bg-slate-800/30 text-slate-400">
                    📌 Fixed
                  </span>
                )}
                <span className="text-[11px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
                  Lv. {stats.level}
                </span>
              </div>
              <h2 className="text-base font-bold text-white leading-snug">{enemy.name}</h2>
              <p className="text-[11px] text-slate-600 font-mono mt-1">ID: {enemy.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all text-sm mt-0.5"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Calculation info */}
          {stats.isDynamic && (
            <div className="rounded-lg border border-amber-800/30 bg-amber-950/15 px-3 py-2.5 text-xs text-amber-300/80 space-y-1">
              <p className="font-semibold text-amber-300">Formula (Player Lv. {playerLevel})</p>
              <p>Enemy Level = {playerLevel} + 5 = <span className="font-bold text-white">{stats.level}</span></p>
              <p>HP = {playerLevel} × {enemy.calculation} = <span className="font-bold text-white">{stats.hp.toLocaleString("id-ID")}</span></p>
              <p>CP = {playerLevel} × {enemy.calculation} = <span className="font-bold text-white">{stats.cp.toLocaleString("id-ID")}</span></p>
              <p>Agility = 10 + {playerLevel} + {enemy.calculation_agility ?? 0} = <span className="font-bold text-white">{stats.agility}</span></p>
            </div>
          )}

          {/* Stats */}
          <div>
            <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Stats</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <StatLarge label="HP" value={stats.hp.toLocaleString("id-ID")} />
              <StatLarge label="CP" value={stats.cp.toLocaleString("id-ID")} />
              <StatLarge label="Agility" value={stats.agility} />
              <StatLarge label="Dodge" value={`${stats.dodge}%`} />
              <StatLarge label="Critical" value={`${stats.critical}%`} />
              <StatLarge label="Purify" value={`${stats.purify}%`} />
              <StatLarge label="Accuracy" value={`${stats.accuracy}%`} />
              <StatLarge label="Reactive" value={`${stats.reactive}%`} />
              {stats.combustion > 0 && <StatLarge label="Combustion" value={`${stats.combustion}%`} />}
            </div>
          </div>

          {/* Raw data for dynamic enemies */}
          {stats.isDynamic && (
            <div>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Raw Data</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <StatLarge label="Calculation" value={enemy.calculation!} />
                <StatLarge label="Calc Agility" value={enemy.calculation_agility ?? 0} />
                <StatLarge label="Base HP" value={enemy.hp} />
                <StatLarge label="Base CP" value={enemy.cp} />
                <StatLarge label="Base Agility" value={enemy.agility} />
              </div>
            </div>
          )}

          {/* Attacks */}
          {attacks.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">
                Skill ({attacks.length})
              </p>
              <div className="flex flex-col gap-3">
                {attacks.map((atk, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2">
                    {/* Attack header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Skill {i + 1}</span>
                        {atk.multi_hit && (
                          <span className="text-[10px] font-bold border rounded-full px-1.5 py-0.5 border-orange-700/40 bg-orange-950/30 text-orange-300">
                            Multi-hit
                          </span>
                        )}
                        {atk.is_self_skill && (
                          <span className="text-[10px] font-bold border rounded-full px-1.5 py-0.5 border-cyan-700/40 bg-cyan-950/30 text-cyan-300">
                            Self
                          </span>
                        )}
                        {atk.combo_skill && (
                          <span className="text-[10px] font-bold border rounded-full px-1.5 py-0.5 border-violet-700/40 bg-violet-950/30 text-violet-300">
                            Combo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        {atk.dmg > 0 && <span className="text-orange-400 font-bold">{atk.dmg}% DMG</span>}
                        {atk.cooldown > 0 && <span className="text-slate-500">{atk.cooldown}t CD</span>}
                      </div>
                    </div>

                    {/* Effects */}
                    {atk.effects && atk.effects.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        {atk.effects.map((fx, j) => {
                          const name = fx.effect_name ?? fx.effect ?? "—";
                          const parts: string[] = [];
                          if (fx.target) parts.push(fx.target === "enemy" ? "Target" : fx.target === "self" ? "Diri" : fx.target);
                          if (fx.amount != null && fx.amount > 0) parts.push(fx.calc_type === "percent" ? `${fx.amount}%` : `+${fx.amount}`);
                          if (fx.chance != null && fx.chance > 0 && fx.chance < 100) parts.push(`${fx.chance}% chance`);
                          if (fx.duration != null && fx.duration > 0) parts.push(`${fx.duration}t`);
                          const isDebuff = fx.type === "Debuff";
                          return (
                            <div
                              key={j}
                              className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
                                isDebuff
                                  ? "bg-red-950/30 border-red-800/30 text-red-300"
                                  : "bg-emerald-950/30 border-emerald-800/30 text-emerald-300"
                              }`}
                            >
                              <span className="font-medium truncate">{name}</span>
                              {parts.length > 0 && <span className="shrink-0 text-[11px] opacity-70">{parts.join(" · ")}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Effects Tab ──────────────────────────────────────────────────────────────

const EFFECT_CATEGORY_MAP = {
  offense: { label: "Offense",  icon: "⚔️",  badge: "bg-red-900/40 border-red-700/40 text-red-300",         bg: "border-red-900/30 bg-red-950/10" },
  defense: { label: "Defense",  icon: "🛡️",  badge: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300", bg: "border-emerald-900/30 bg-emerald-950/10" },
  hybrid:  { label: "Hybrid",   icon: "⚡",  badge: "bg-blue-900/40 border-blue-700/40 text-blue-300",       bg: "border-blue-900/30 bg-blue-950/10" },
  control: { label: "Control",  icon: "🔒",  badge: "bg-purple-900/40 border-purple-700/40 text-purple-300",  bg: "border-purple-900/30 bg-purple-950/10" },
} as const;

const EFFECT_KIND_MAP = {
  buff:   { label: "Buff",   badge: "bg-emerald-950/50 border-emerald-600/40 text-emerald-300" },
  debuff: { label: "Debuff", badge: "bg-red-950/50 border-red-600/40 text-red-300" },
} as const;

function EffectsTab() {
  const [search, setSearch]   = useState("");
  const [kindFilter, setKind] = useState<"all" | "buff" | "debuff">("all");
  const [catFilter,  setCat]  = useState<"all" | "offense" | "defense" | "hybrid" | "control">("all");
  const [viewMode, setView]   = useState<ViewMode>("grid");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return GAME_EFFECTS.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.description.toLowerCase().includes(q)) return false;
      if (kindFilter !== "all" && e.kind !== kindFilter) return false;
      if (catFilter  !== "all" && e.category !== catFilter) return false;
      return true;
    });
  }, [search, kindFilter, catFilter]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="🔎 Cari nama atau deskripsi efek..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-red-700/60 focus:outline-none focus:ring-1 focus:ring-red-700/40"
        />

        {/* Kind filter */}
        <div className="flex flex-wrap gap-2">
          {(["all", "buff", "debuff"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                kindFilter === k
                  ? "bg-red-600/80 border-red-500 text-white"
                  : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
              }`}
            >
              {k === "all" ? "🗂️ Semua" : k === "buff" ? "✅ Buff" : "❌ Debuff"}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <TypeChip active={catFilter === "all"} onClick={() => setCat("all")}>🗂️ Semua Kategori</TypeChip>
          {(Object.entries(EFFECT_CATEGORY_MAP) as [keyof typeof EFFECT_CATEGORY_MAP, typeof EFFECT_CATEGORY_MAP[keyof typeof EFFECT_CATEGORY_MAP]][]).map(([key, val]) => (
            <TypeChip key={key} active={catFilter === key} onClick={() => setCat(key)}>
              {val.icon} {val.label}
            </TypeChip>
          ))}
        </div>

        {/* Result count + view toggle */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-600">
            Menampilkan {filtered.length} dari {GAME_EFFECTS.length} efek
            <span className="ml-2 text-slate-700">({_rawBuffs.length} buff · {_rawDebuffs.length} debuff)</span>
          </p>
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
            {(["grid", "list", "compact"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                title={mode === "grid" ? "Grid" : mode === "list" ? "List" : "Compact"}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all flex items-center gap-1 ${
                  viewMode === mode ? "bg-red-600/80 text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {mode === "grid"    && <><GridIcon /><span className="hidden sm:inline">Grid</span></>}
                {mode === "list"    && <><ListIcon /><span className="hidden sm:inline">List</span></>}
                {mode === "compact" && <><CompactIcon /><span className="hidden sm:inline">Compact</span></>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState text="Tidak ada efek yang cocok dengan filter." />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((eff) => (
            <EffectCard key={eff.name} effect={eff} highlight={search} />
          ))}
        </div>
      ) : viewMode === "list" ? (
        <div className="flex flex-col gap-2">
          {filtered.map((eff) => (
            <EffectRow key={eff.name} effect={eff} highlight={search} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.04] rounded-xl border border-white/[0.07] overflow-hidden">
          {filtered.map((eff) => (
            <EffectCompactRow key={eff.name} effect={eff} highlight={search} />
          ))}
        </div>
      )}
    </div>
  );
}

// Pre-built skill lookup by name for the modal
const SKILL_BY_NAME: Record<string, Skill> = Object.fromEntries(
  (skillsJson as Skill[]).map((s) => [s.name, s])
);

function EffectCard({ effect, highlight }: { effect: GameEffect; highlight?: string }) {
  const [showModal, setShowModal] = useState(false);
  const catInfo  = EFFECT_CATEGORY_MAP[effect.category] ?? EFFECT_CATEGORY_MAP.hybrid;
  const kindInfo = EFFECT_KIND_MAP[effect.kind];
  const skillNames = EFFECT_SKILLS_MAP[effect.name] ?? [];

  return (
    <>
      <div className={`group flex flex-col gap-3 rounded-xl border p-4 transition-all ${catInfo.bg}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${kindInfo.badge}`}>
                {effect.kind === "buff" ? "✅" : "❌"} {kindInfo.label}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${catInfo.badge}`}>
                {catInfo.icon} {catInfo.label}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white leading-snug">
              {highlightText(effect.name, highlight ?? "")}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 leading-relaxed flex-1">
          {highlightText(effect.description, highlight ?? "")}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] gap-2">
          {skillNames.length > 0 ? (
            <span className="text-[11px] text-slate-500">
              <span className="font-bold text-slate-300">{skillNames.length}</span> skill dapat mengaplikasikan
            </span>
          ) : (
            <span className="text-[11px] text-slate-700 italic">Tidak ada skill terdeteksi</span>
          )}
          {skillNames.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="shrink-0 flex items-center gap-1 rounded-lg border border-violet-700/40 bg-violet-950/20 px-3 py-1 text-[11px] font-semibold text-violet-300 hover:bg-violet-950/40 hover:border-violet-600/50 transition-all"
            >
              Lihat skill →
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <EffectSkillsModal
          effect={effect}
          skillNames={skillNames}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// ─── Effect List Row ──────────────────────────────────────────────────────────

function EffectRow({ effect, highlight }: { effect: GameEffect; highlight?: string }) {
  const [showModal, setShowModal] = useState(false);
  const catInfo  = EFFECT_CATEGORY_MAP[effect.category] ?? EFFECT_CATEGORY_MAP.hybrid;
  const kindInfo = EFFECT_KIND_MAP[effect.kind];
  const skillNames = EFFECT_SKILLS_MAP[effect.name] ?? [];

  return (
    <>
      <div className={`group flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ${catInfo.bg}`}>
        {/* Kind icon */}
        <span className={`shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg border text-sm ${kindInfo.badge}`}>
          {effect.kind === "buff" ? "✅" : "❌"}
        </span>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-bold border rounded-full px-1.5 py-0.5 ${kindInfo.badge}`}>{kindInfo.label}</span>
            <span className={`text-[10px] font-bold border rounded-full px-1.5 py-0.5 ${catInfo.badge}`}>{catInfo.icon} {catInfo.label}</span>
          </div>
          <p className="text-sm font-semibold text-white leading-snug mb-1">
            {highlightText(effect.name, highlight ?? "")}
          </p>
          <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed">
            {highlightText(effect.description, highlight ?? "")}
          </p>
        </div>

        {/* Right side */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {skillNames.length > 0 && (
            <>
              <span className="text-[11px] text-slate-500">
                <span className="font-bold text-slate-300">{skillNames.length}</span> skill
              </span>
              <button
                onClick={() => setShowModal(true)}
                className="text-[11px] font-semibold text-violet-400 border border-violet-700/40 bg-violet-950/20 rounded-lg px-2.5 py-1 hover:bg-violet-950/40 transition-all"
              >
                Lihat →
              </button>
            </>
          )}
          {skillNames.length === 0 && (
            <span className="text-[10px] text-slate-700 italic">—</span>
          )}
        </div>
      </div>

      {showModal && (
        <EffectSkillsModal effect={effect} skillNames={skillNames} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

// ─── Effect Compact Row ───────────────────────────────────────────────────────

function EffectCompactRow({ effect, highlight }: { effect: GameEffect; highlight?: string }) {
  const [showModal, setShowModal] = useState(false);
  const catInfo  = EFFECT_CATEGORY_MAP[effect.category] ?? EFFECT_CATEGORY_MAP.hybrid;
  const kindInfo = EFFECT_KIND_MAP[effect.kind];
  const skillNames = EFFECT_SKILLS_MAP[effect.name] ?? [];

  return (
    <>
      <div className="group flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-all">
        {/* Kind icon */}
        <span className="shrink-0 text-sm w-5 text-center" title={kindInfo.label}>
          {effect.kind === "buff" ? "✅" : "❌"}
        </span>

        {/* Category icon */}
        <span className={`shrink-0 text-sm w-5 text-center`} title={catInfo.label}>
          {catInfo.icon}
        </span>

        {/* Name */}
        <p className="flex-1 min-w-0 text-xs font-medium text-slate-200 truncate">
          {highlightText(effect.name, highlight ?? "")}
        </p>

        {/* Skill count + button */}
        <div className="shrink-0 flex items-center gap-2">
          {skillNames.length > 0 ? (
            <>
              <span className="text-[11px] text-slate-600 hidden sm:inline">{skillNames.length} skill</span>
              <button
                onClick={() => setShowModal(true)}
                className="text-[10px] font-semibold text-violet-400 border border-violet-700/40 bg-violet-950/20 rounded px-2 py-0.5 hover:bg-violet-950/40 transition-all"
              >
                Lihat →
              </button>
            </>
          ) : (
            <span className="text-[10px] text-slate-700">—</span>
          )}
        </div>
      </div>

      {showModal && (
        <EffectSkillsModal effect={effect} skillNames={skillNames} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function EffectSkillsModal({
  effect,
  skillNames,
  onClose,
}: {
  effect: GameEffect;
  skillNames: string[];
  onClose: () => void;
}) {
  const [search, setSearch]       = useState("");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const catInfo  = EFFECT_CATEGORY_MAP[effect.category] ?? EFFECT_CATEGORY_MAP.hybrid;
  const kindInfo = EFFECT_KIND_MAP[effect.kind];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { if (selectedSkill) setSelectedSkill(null); else onClose(); } };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose, selectedSkill]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return skillNames
      .map((name) => SKILL_BY_NAME[name])
      .filter((s): s is Skill => !!s)
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .sort((a, b) => a.cooldown - b.cooldown);
  }, [skillNames, search]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div
          className="relative z-10 w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-[#0e0e14] shadow-2xl shadow-black/60"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-start justify-between gap-3 p-5 pb-4 border-b border-white/[0.07]">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${kindInfo.badge}`}>
                  {effect.kind === "buff" ? "✅" : "❌"} {kindInfo.label}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${catInfo.badge}`}>
                  {catInfo.icon} {catInfo.label}
                </span>
              </div>
              <h2 className="text-base font-bold text-white">{effect.name}</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{effect.description}</p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all text-sm"
            >
              ✕
            </button>
          </div>

          {/* Search + count */}
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.06] space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="🔎 Cari skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white placeholder:text-slate-600 focus:border-violet-700/60 focus:outline-none focus:ring-1 focus:ring-violet-700/40"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs">✕</button>
              )}
            </div>
            <p className="text-[11px] text-slate-600">
              {filtered.length} dari {skillNames.length} skill · diurutkan berdasarkan CD terpendek
            </p>
          </div>

          {/* Skill list */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-slate-600 text-sm">Tidak ada skill yang cocok.</div>
            ) : (
              filtered.map((skill) => {
                const typeInfo = SKILL_TYPE_MAP[skill.type] ?? { icon: "❓", label: "?", badge: "bg-slate-800/40 border-slate-600/40 text-slate-400" };
                const seasonNum = getSeasonNumber(skill.name);
                return (
                  <button
                    key={skill.id}
                    onClick={() => setSelectedSkill(skill)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors text-left group"
                  >
                    {/* Icon */}
                    <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                      <IconImg id={skill.id} size={28} />
                    </div>

                    {/* Name + badges */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate leading-snug">
                        {skill.name}
                        {seasonNum !== null && (
                          <span className="ml-1.5 text-[10px] text-rose-400 font-bold">S{seasonNum}</span>
                        )}
                        {skill.premium && <span className="ml-1 text-[10px] text-amber-400">💎</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                        {skill.damage > 0 && <span className="text-orange-400">DMG {skill.damage}%</span>}
                        <span className="text-blue-400">CP {skill.cp_cost}</span>
                        <span className="text-slate-500">CD {skill.cooldown}t</span>
                        <span className="text-slate-600">{skill.target}</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <span className="shrink-0 text-slate-700 group-hover:text-slate-400 transition-colors text-xs">→</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Nested skill detail modal */}
      {selectedSkill && (
        <SkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      )}
    </>
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
