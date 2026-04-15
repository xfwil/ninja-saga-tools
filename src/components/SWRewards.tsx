"use client";

import { useState, useEffect, useMemo } from "react";
import IconImg from "./IconImg";
import skillsJson from "../../dump/skills.json";
import libraryJson from "../../dump/library.json";
import petJson from "../../dump/pet.json";
import skillEffectsJson from "../../dump/skill-effect.json";
import weaponEffectJson from "../../dump/weapon-effect.json";
import backEffectJson from "../../dump/back_item-effect.json";

// ─── Types ────────────────────────────────────────────────────────────────────

type RewardCategory = Record<string, string[]>;

type SeasonRewardData = {
  squad: RewardCategory;
  winner_squad: RewardCategory;
  top_global: RewardCategory;
  league: RewardCategory;
};

type SeasonEntry = {
  season: string;
  fetchedAt: string;
  data: SeasonRewardData;
};

type SWRewardsFile = {
  seasons: SeasonEntry[];
};

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
  passive?: boolean;
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

type ResolvedReward = {
  rawId: string;
  name: string;
  type: "skill" | "item" | "pet" | "currency";
  skill?: Skill;
  item?: LibItem;
  pet?: Pet;
  currencyAmount?: string;
  currencyType?: string;
};

// ─── Data Maps ────────────────────────────────────────────────────────────────

const skills = skillsJson as Skill[];
const library = libraryJson as LibItem[];
const pets = petJson as Pet[];

const SKILL_MAP = new Map(skills.map((s) => [s.id, s]));
const LIB_MAP = new Map(library.map((i) => [i.id, i]));
const PET_MAP = new Map(pets.map((p) => [p.id, p]));

const SKILL_EFFECTS_MAP: Record<string, SkillEffectEntry[]> = {};
for (const rec of skillEffectsJson as { skill_id: string; skill_effect: SkillEffectEntry[] }[]) {
  SKILL_EFFECTS_MAP[rec.skill_id] = rec.skill_effect;
}

const WPN_FX_MAP: Record<string, ItemEffect[]> = Object.fromEntries(
  (weaponEffectJson as { id: string; effects?: ItemEffect[] }[]).map((e) => [e.id, e.effects ?? []])
);
const BACK_FX_MAP: Record<string, ItemEffect[]> = Object.fromEntries(
  (backEffectJson as { id: string; effects?: ItemEffect[] }[]).map((e) => [e.id, e.effects ?? []])
);

const SKILL_TYPE_MAP: Record<string, { label: string; icon: string; badge: string }> = {
  "1":  { label: "Wind",      icon: "🌀", badge: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300" },
  "2":  { label: "Fire",      icon: "🔥", badge: "bg-red-900/40 border-red-700/40 text-red-300" },
  "3":  { label: "Lightning", icon: "⚡", badge: "bg-yellow-900/40 border-yellow-700/40 text-yellow-300" },
  "4":  { label: "Earth",     icon: "🌍", badge: "bg-amber-900/40 border-amber-700/40 text-amber-400" },
  "5":  { label: "Water",     icon: "💧", badge: "bg-blue-900/40 border-blue-700/40 text-blue-300" },
  "6":  { label: "Taijutsu",  icon: "👊", badge: "bg-orange-900/40 border-orange-700/40 text-orange-300" },
  "7":  { label: "Transform", icon: "🔄", badge: "bg-purple-900/40 border-purple-700/40 text-purple-300" },
  "9":  { label: "Genjutsu",  icon: "👁️", badge: "bg-pink-900/40 border-pink-700/40 text-pink-300" },
  "10": { label: "Medical",   icon: "💊", badge: "bg-teal-900/40 border-teal-700/40 text-teal-300" },
  "11": { label: "Senjutsu",  icon: "🐸", badge: "bg-indigo-900/40 border-indigo-700/40 text-indigo-300" },
};

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SW_API = "https://ninjasage.id/api/event/sw";

const CATEGORY_CONFIG: {
  key: keyof SeasonRewardData;
  label: string;
  icon: string;
  color: string;
  border: string;
  bg: string;
}[] = [
  { key: "squad",        label: "Squad Ranking", icon: "🏆", color: "text-amber-300",   border: "border-amber-700/50",   bg: "bg-amber-950/20" },
  { key: "winner_squad", label: "Winner Squad",  icon: "👑", color: "text-yellow-300",  border: "border-yellow-700/50",  bg: "bg-yellow-950/20" },
  { key: "top_global",   label: "Top Global",    icon: "🌍", color: "text-emerald-300", border: "border-emerald-700/50", bg: "bg-emerald-950/20" },
  { key: "league",       label: "League Rewards", icon: "🎖️", color: "text-purple-300", border: "border-purple-700/50", bg: "bg-purple-950/20" },
];

const LEAGUE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  platinum:     { text: "text-cyan-300",   bg: "bg-cyan-950/30",   border: "border-cyan-700/40" },
  diamond:      { text: "text-blue-300",   bg: "bg-blue-950/30",   border: "border-blue-700/40" },
  master:       { text: "text-purple-300", bg: "bg-purple-950/30", border: "border-purple-700/40" },
  grand_master: { text: "text-red-300",    bg: "bg-red-950/30",    border: "border-red-700/40" },
  sage:         { text: "text-amber-300",  bg: "bg-amber-950/30",  border: "border-amber-700/40" },
};

// ─── Resolve Reward ID ────────────────────────────────────────────────────────

function resolveReward(rawId: string): ResolvedReward {
  const cleaned = rawId.replace(/_%s$/g, "");

  // Currency types: tokens_1500, tp_125, ss_125
  if (cleaned.startsWith("tokens_")) {
    const amount = cleaned.replace("tokens_", "");
    return { rawId, name: `${amount} Tokens`, type: "currency", currencyAmount: amount, currencyType: "Tokens" };
  }
  if (cleaned.startsWith("tp_")) {
    const amount = cleaned.replace("tp_", "");
    return { rawId, name: `${amount} TP`, type: "currency", currencyAmount: amount, currencyType: "TP" };
  }
  if (cleaned.startsWith("ss_")) {
    const amount = cleaned.replace("ss_", "");
    return { rawId, name: `${amount} SS`, type: "currency", currencyAmount: amount, currencyType: "SS" };
  }

  // Essential items with quantity: essential_09:1
  if (cleaned.includes(":")) {
    const [base, qty] = cleaned.split(":");
    // Try to find in library
    const item = LIB_MAP.get(base);
    if (item) {
      return { rawId, name: `${item.name} x${qty}`, type: "item", item };
    }
    const parts = base.split("_");
    const fallbackName = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    return { rawId, name: `${fallbackName} x${qty}`, type: "currency", currencyAmount: qty, currencyType: fallbackName };
  }

  // Skills: skill_7049
  if (cleaned.startsWith("skill_")) {
    const skill = SKILL_MAP.get(cleaned);
    if (skill) return { rawId, name: skill.name, type: "skill", skill };
    return { rawId, name: cleaned, type: "skill" };
  }

  // Pets: pet_triad
  if (cleaned.startsWith("pet_")) {
    const pet = PET_MAP.get(cleaned);
    if (pet) return { rawId, name: `Pet: ${pet.name}`, type: "pet", pet };
    // Fallback
    const parts = cleaned.split("_").slice(1);
    return { rawId, name: `Pet: ${parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")}`, type: "pet" };
  }

  // Library items: set_7071, back_7018, hair_7009, wpn_xxxx
  // For set/hair with %s suffix, try _1 and _2 variants
  const item = LIB_MAP.get(cleaned);
  if (item) return { rawId, name: item.name, type: "item", item };

  // Try with _1 suffix (male variant)
  const variant1 = LIB_MAP.get(cleaned + "_1");
  if (variant1) {
    // Strip gender suffix from name for display
    const baseName = variant1.name.replace(/\s*\(?(Male|Female|M|F)\)?$/i, "").trim();
    return { rawId, name: baseName, type: "item", item: variant1 };
  }

  // Fallback: format the ID nicely
  const parts = cleaned.split("_");
  return { rawId, name: parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" "), type: "item" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRankLabel(key: string): string {
  if (/^\d/.test(key)) return `Rank ${key}`;
  return key.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function dataFingerprint(data: SeasonRewardData): string {
  return JSON.stringify(data);
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function RewardDetailModal({ reward, onClose }: { reward: ResolvedReward; onClose: () => void }) {
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
            <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
              <IconImg id={reward.rawId} size={36} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white leading-snug">{reward.name}</h2>
              <p className="text-[11px] text-slate-600 font-mono mt-1">ID: {reward.rawId}</p>
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
          {/* Skill Detail */}
          {reward.type === "skill" && reward.skill && <SkillDetail skill={reward.skill} />}

          {/* Item Detail */}
          {reward.type === "item" && reward.item && <ItemDetail item={reward.item} />}

          {/* Pet Detail */}
          {reward.type === "pet" && reward.pet && <PetDetail pet={reward.pet} />}

          {/* Currency - simple display */}
          {reward.type === "currency" && (
            <div className="text-center py-6">
              <p className="text-4xl font-black text-white mb-2">{reward.currencyAmount}</p>
              <p className="text-sm text-slate-400">{reward.currencyType}</p>
            </div>
          )}

          {/* Fallback if no data found */}
          {reward.type === "skill" && !reward.skill && (
            <p className="text-sm text-slate-500 italic">Data skill tidak ditemukan di dump.</p>
          )}
          {reward.type === "item" && !reward.item && (
            <p className="text-sm text-slate-500 italic">Data item tidak ditemukan di dump.</p>
          )}
          {reward.type === "pet" && !reward.pet && (
            <p className="text-sm text-slate-500 italic">Data pet tidak ditemukan di dump.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillDetail({ skill }: { skill: Skill }) {
  const typeInfo = SKILL_TYPE_MAP[skill.type] ?? { label: `Type ${skill.type}`, icon: "❓", badge: "bg-slate-800/40 border-slate-600/40 text-slate-400" };
  const effects = SKILL_EFFECTS_MAP[skill.id] ?? [];

  return (
    <>
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${typeInfo.badge}`}>
          {typeInfo.icon} {typeInfo.label}
        </span>
        {skill.premium && (
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold bg-amber-900/40 border-amber-700/40 text-amber-400">
            Premium
          </span>
        )}
        <span className="text-[11px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
          Lv. {skill.level}
        </span>
      </div>

      {/* Description */}
      <div>
        <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Deskripsi</p>
        <p className="text-sm text-slate-300 leading-relaxed">{skill.description}</p>
      </div>

      {/* Stats */}
      <div>
        <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Stats</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {skill.damage > 0 && <StatBox label="Damage" value={`${skill.damage}%`} />}
          <StatBox label="CP Cost" value={skill.cp_cost} />
          <StatBox label="Cooldown" value={`${skill.cooldown} turn`} />
          <StatBox label="Target" value={skill.target} />
          {skill.hit_chance != null && skill.hit_chance > 0 && <StatBox label="Hit Chance" value={`${skill.hit_chance}%`} />}
        </div>
      </div>

      {/* Effects */}
      {effects.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Efek</p>
          <div className="flex flex-col gap-2">
            {effects.map((fx, i) => {
              const name = fx.effect_name ?? fx.effect ?? "—";
              const parts: string[] = [];
              if (fx.target) parts.push(fx.target === "enemy" ? "Musuh" : fx.target === "self" ? "Diri" : fx.target);
              if (fx.amount != null && fx.amount > 0) parts.push(fx.calc_type === "percent" ? `${fx.amount}%` : `+${fx.amount}`);
              if (fx.chance != null && fx.chance < 100) parts.push(`${fx.chance}% chance`);
              if (fx.duration != null && fx.duration > 0) parts.push(`${fx.duration} turn`);
              const isDebuff = fx.type === "Debuff";
              return (
                <div
                  key={i}
                  className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 ${
                    isDebuff
                      ? "bg-red-950/50 border-red-700/40 text-red-300"
                      : "bg-emerald-950/50 border-emerald-700/40 text-emerald-300"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold truncate">{name}</span>
                    {fx.type && (
                      <span className="shrink-0 text-[10px] opacity-60 font-medium">{fx.type}</span>
                    )}
                  </div>
                  {parts.length > 0 && (
                    <span className="shrink-0 text-[11px] opacity-80 text-right">{parts.join(" · ")}</span>
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
                <span className="text-blue-400 text-xs">T</span>
                <span className="text-sm font-bold text-blue-300">{skill.price_tokens} token</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ItemDetail({ item }: { item: LibItem }) {
  const effects: ItemEffect[] = item.type === "wpn"
    ? (WPN_FX_MAP[item.id] ?? [])
    : item.type === "back"
      ? (BACK_FX_MAP[item.id] ?? [])
      : [];

  const typeConfig: Record<string, { label: string; icon: string; badge: string }> = {
    wpn:       { label: "Weapon",    icon: "🗡️", badge: "bg-orange-900/40 border-orange-700/40 text-orange-300" },
    back:      { label: "Back Item", icon: "🎒", badge: "bg-violet-900/40 border-violet-700/40 text-violet-300" },
    set:       { label: "Kostum",    icon: "👘", badge: "bg-pink-900/40 border-pink-700/40 text-pink-300" },
    hair:      { label: "Hairstyle", icon: "💇", badge: "bg-teal-900/40 border-teal-700/40 text-teal-300" },
    accessory: { label: "Aksesori",  icon: "💍", badge: "bg-yellow-900/40 border-yellow-700/40 text-yellow-300" },
  };
  const typeCfg = typeConfig[item.type] ?? { label: item.type, icon: "📦", badge: "bg-slate-800/40 border-slate-600/40 text-slate-400" };

  return (
    <>
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${typeCfg.badge}`}>
          {typeCfg.icon} {typeCfg.label}
        </span>
        {item.premium && (
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold bg-amber-900/40 border-amber-700/40 text-amber-400">
            Premium
          </span>
        )}
        {item.level > 1 && (
          <span className="text-[11px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
            Req. Lv. {item.level}
          </span>
        )}
      </div>

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
          {item.damage > 0 && <StatBox label="Damage" value={item.damage} />}
          {item.level > 0 && <StatBox label="Level" value={item.level} />}
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
    </>
  );
}

function PetDetail({ pet }: { pet: Pet }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-emerald-900/40 border-emerald-700/40 text-emerald-300">
          🐾 Pet
        </span>
        <span className="text-[11px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
          Lv. {pet.level}
        </span>
      </div>

      {pet.description && (
        <div>
          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Deskripsi</p>
          <p className="text-sm text-slate-300 leading-relaxed">{pet.description}</p>
        </div>
      )}

      <div>
        <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Stats</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatBox label="HP" value={pet.hp} />
          <StatBox label="CP" value={pet.cp} />
          <StatBox label="Dodge" value={pet.dodge} />
          <StatBox label="Critical" value={pet.critical} />
          <StatBox label="Purify" value={pet.purify} />
          <StatBox label="Accuracy" value={pet.accuracy} />
          <StatBox label="Agility" value={pet.agility} />
        </div>
      </div>
    </>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-white/[0.04] border border-white/[0.07] px-3 py-2">
      <span className="text-[10px] text-slate-600">{label}</span>
      <span className="text-sm font-bold text-slate-200">{value}</span>
    </div>
  );
}

// ─── Reward Badge (Clickable) ─────────────────────────────────────────────────

function RewardBadge({ reward, onClick }: { reward: ResolvedReward; onClick: () => void }) {
  const hasDetail = reward.skill || reward.item || reward.pet;

  // Determine badge color based on type
  let badgeClass = "border-white/10 bg-white/[0.04] text-slate-300";
  const id = reward.rawId;
  if (id.startsWith("skill_"))          badgeClass = "border-red-700/40 bg-red-950/25 text-red-300";
  else if (id.startsWith("set_"))       badgeClass = "border-purple-700/40 bg-purple-950/25 text-purple-300";
  else if (id.startsWith("back_"))      badgeClass = "border-blue-700/40 bg-blue-950/25 text-blue-300";
  else if (id.startsWith("hair_"))      badgeClass = "border-pink-700/40 bg-pink-950/25 text-pink-300";
  else if (id.startsWith("pet_"))       badgeClass = "border-emerald-700/40 bg-emerald-950/25 text-emerald-300";
  else if (id.startsWith("tokens_"))    badgeClass = "border-amber-700/40 bg-amber-950/25 text-amber-300";
  else if (id.startsWith("tp_"))        badgeClass = "border-cyan-700/40 bg-cyan-950/25 text-cyan-300";
  else if (id.startsWith("ss_"))        badgeClass = "border-orange-700/40 bg-orange-950/25 text-orange-300";
  else if (id.startsWith("essential_")) badgeClass = "border-lime-700/40 bg-lime-950/25 text-lime-300";
  else if (id.startsWith("wpn_"))       badgeClass = "border-orange-700/40 bg-orange-950/25 text-orange-300";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${badgeClass} ${
        hasDetail
          ? "cursor-pointer hover:brightness-125 hover:scale-[1.03] active:scale-[0.98]"
          : "cursor-default"
      }`}
      title={hasDetail ? "Klik untuk detail" : reward.rawId}
    >
      <IconImg id={reward.rawId} size={20} />
      <span className="leading-tight">{reward.name}</span>
      {hasDetail && (
        <span className="text-[10px] opacity-50">→</span>
      )}
    </button>
  );
}

// ─── Reward Section ───────────────────────────────────────────────────────────

function RewardSection({
  categoryKey,
  data,
  onSelectReward,
}: {
  categoryKey: keyof SeasonRewardData;
  data: RewardCategory;
  onSelectReward: (r: ResolvedReward) => void;
}) {
  const config = CATEGORY_CONFIG.find((c) => c.key === categoryKey)!;
  const entries = Object.entries(data);

  // Pre-resolve all rewards
  const resolvedEntries = useMemo(
    () => entries.map(([rankKey, rewards]) => ({
      rankKey,
      rewards: rewards.map((id) => resolveReward(id)),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} p-4 sm:p-5`}>
      <h3 className={`flex items-center gap-2 text-sm font-bold ${config.color} mb-4`}>
        <span className="text-lg">{config.icon}</span>
        {config.label}
      </h3>

      <div className="space-y-3">
        {resolvedEntries.map(({ rankKey, rewards }) => {
          const isLeague = categoryKey === "league";
          const leagueStyle = isLeague ? LEAGUE_COLORS[rankKey] : null;

          return (
            <div
              key={rankKey}
              className={`rounded-xl border p-3 ${
                leagueStyle
                  ? `${leagueStyle.border} ${leagueStyle.bg}`
                  : "border-white/[0.08] bg-black/20"
              }`}
            >
              <p className={`text-xs font-bold mb-2 ${leagueStyle ? leagueStyle.text : "text-slate-400"}`}>
                {formatRankLabel(rankKey)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rewards.map((reward, i) => (
                  <RewardBadge
                    key={`${reward.rawId}-${i}`}
                    reward={reward}
                    onClick={() => onSelectReward(reward)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SWRewards() {
  const [seasons, setSeasons] = useState<SeasonEntry[]>([]);
  const [activeSeason, setActiveSeason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<ResolvedReward | null>(null);

  // Load stored seasons from JSON + localStorage
  useEffect(() => {
    setLoading(true);
    fetch(`${BASE}/data/sw-rewards.json`)
      .then((r) => r.json())
      .then((file: SWRewardsFile) => {
        const localRaw = localStorage.getItem("sw-rewards-extra");
        const localSeasons: SeasonEntry[] = localRaw ? JSON.parse(localRaw) : [];

        const allSeasons = [...file.seasons];
        for (const ls of localSeasons) {
          if (!allSeasons.find((s) => s.season === ls.season)) {
            allSeasons.push(ls);
          }
        }

        allSeasons.sort((a, b) => {
          const numA = parseInt(a.season.replace(/\D/g, ""), 10) || 0;
          const numB = parseInt(b.season.replace(/\D/g, ""), 10) || 0;
          return numB - numA;
        });

        setSeasons(allSeasons);
        if (allSeasons.length > 0) setActiveSeason(allSeasons[0].season);
      })
      .catch(() => setError("Gagal memuat data rewards."))
      .finally(() => setLoading(false));
  }, []);

  function fetchLiveData() {
    setFetchingLive(true);
    setLiveStatus(null);

    fetch(SW_API)
      .then((r) => r.json())
      .then((response: { data: SeasonRewardData }) => {
        const liveData = response.data;
        const liveFingerprint = dataFingerprint(liveData);

        const existingMatch = seasons.find((s) => dataFingerprint(s.data) === liveFingerprint);
        if (existingMatch) {
          setLiveStatus(`Data sama dengan ${existingMatch.season}. Belum ada season baru.`);
          setActiveSeason(existingMatch.season);
          return;
        }

        const maxNum = seasons.reduce((max, s) => {
          const n = parseInt(s.season.replace(/\D/g, ""), 10) || 0;
          return Math.max(max, n);
        }, 0);
        const newSeasonName = `S${maxNum + 1}`;

        const newEntry: SeasonEntry = {
          season: newSeasonName,
          fetchedAt: new Date().toISOString(),
          data: liveData,
        };

        const localRaw = localStorage.getItem("sw-rewards-extra");
        const localSeasons: SeasonEntry[] = localRaw ? JSON.parse(localRaw) : [];
        localSeasons.push(newEntry);
        localStorage.setItem("sw-rewards-extra", JSON.stringify(localSeasons));

        const updated = [newEntry, ...seasons];
        setSeasons(updated);
        setActiveSeason(newSeasonName);
        setLiveStatus(`Season baru terdeteksi: ${newSeasonName}! Data disimpan.`);
      })
      .catch(() => setLiveStatus("Gagal fetch data dari API."))
      .finally(() => setFetchingLive(false));
  }

  const activeData = seasons.find((s) => s.season === activeSeason);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Season Tabs + Fetch Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {seasons.map((s) => (
            <button
              key={s.season}
              onClick={() => setActiveSeason(s.season)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all ${
                activeSeason === s.season
                  ? "border-red-500/60 bg-red-950/30 text-red-300 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]"
                  : "border-white/[0.08] bg-slate-900/35 text-slate-400 hover:border-slate-500/40 hover:text-slate-300"
              }`}
            >
              {s.season}
            </button>
          ))}
        </div>

        <button
          onClick={fetchLiveData}
          disabled={fetchingLive}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-700/50 bg-emerald-950/25 px-4 py-2 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {fetchingLive ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              Fetching...
            </>
          ) : (
            <>
              <span>🔄</span>
              Cek Season Baru
            </>
          )}
        </button>
      </div>

      {/* Live status message */}
      {liveStatus && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            liveStatus.includes("Gagal")
              ? "border-red-800/50 bg-red-950/30 text-red-300"
              : liveStatus.includes("baru")
                ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-300"
                : "border-amber-800/50 bg-amber-950/30 text-amber-300"
          }`}
        >
          {liveStatus}
        </div>
      )}

      {/* Active season info */}
      {activeData && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500">Season</span>
            <p className="text-lg font-bold text-white">{activeData.season}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Fetched</span>
            <p className="text-sm text-slate-400">{formatDate(activeData.fetchedAt)}</p>
          </div>
        </div>
      )}

      {/* Reward Categories */}
      {activeData && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {CATEGORY_CONFIG.map((cat) => (
            <RewardSection
              key={cat.key}
              categoryKey={cat.key}
              data={activeData.data[cat.key]}
              onSelectReward={setSelectedReward}
            />
          ))}
        </div>
      )}

      {!activeData && seasons.length > 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/35 py-16 text-center">
          <p className="text-3xl mb-2">👈</p>
          <p className="text-slate-500 text-sm">Pilih season di atas.</p>
        </div>
      )}

      {seasons.length === 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/35 py-16 text-center">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-slate-500 text-sm">
            Belum ada data rewards. Klik &quot;Cek Season Baru&quot; untuk fetch dari API.
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReward && (
        <RewardDetailModal
          reward={selectedReward}
          onClose={() => setSelectedReward(null)}
        />
      )}
    </div>
  );
}
