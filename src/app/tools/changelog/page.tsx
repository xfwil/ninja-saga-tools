"use client";

import { useState, useEffect, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SyncRun = {
  id:       string;
  syncedAt: string;
  initial:  boolean;
  changes:  number;
  totals: {
    skills:           number;
    library:          number;
    skillEffects:     number;
    weaponEffects:    number;
    backEffects:      number;
    accessoryEffects: number;
  };
};

type ChangeEntry = {
  syncId:     string;
  detectedAt: string;
  category:   string;
  action:     "added" | "removed" | "modified";
  entityId:   string;
  entityName: string;
  field?:     string;
  oldValue?:  unknown;
  newValue?:  unknown;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const CATEGORIES = [
  { key: "all",              label: "Semua",        icon: "🗂️" },
  { key: "skill",            label: "Skill",        icon: "⚔️" },
  { key: "library",          label: "Item",         icon: "📦" },
  { key: "skill_effect",     label: "Skill Effect", icon: "✨" },
  { key: "weapon_effect",    label: "Weapon FX",    icon: "🗡️" },
  { key: "back_effect",      label: "Back FX",      icon: "🎒" },
  { key: "accessory_effect", label: "Aksesori FX",  icon: "💍" },
] as const;

type ActionKey = "added" | "modified" | "removed";

const ACTION_CONFIG: Record<ActionKey, { label: string; color: string; bg: string; border: string; icon: string }> = {
  added:    { label: "Baru",   color: "text-emerald-300", bg: "bg-emerald-950/40", border: "border-emerald-700/50", icon: "➕" },
  modified: { label: "Diubah",  color: "text-amber-300",  bg: "bg-amber-950/40",   border: "border-amber-700/50",   icon: "✏️" },
  removed:  { label: "Hapus",   color: "text-red-300",    bg: "bg-red-950/40",     border: "border-red-700/50",     icon: "➖" },
};

const ACTION_KEYS: ActionKey[] = ["added", "modified", "removed"];

const CAT_ICON: Record<string, string> = {
  skill:            "⚔️",
  library:          "📦",
  skill_effect:     "✨",
  weapon_effect:    "🗡️",
  back_effect:      "🎒",
  accessory_effect: "💍",
};

const PAGE_SIZE = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

// ─── Smart Value Renderer ────────────────────────────────────────────────────

type ParsedEffect = {
  effect_name?: string;
  effect?: string;
  type?: string;
  target?: string;
  amount?: number;
  calc_type?: string;
  duration?: number;
  chance?: number;
  passive?: boolean;
};

function tryParseJson(v: unknown): unknown {
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return v; }
}

function isEffectsArray(arr: unknown[]): arr is ParsedEffect[] {
  return arr.length > 0 && typeof arr[0] === "object" && arr[0] !== null && ("effect" in arr[0] || "effect_name" in arr[0]);
}

function EffectRow({ fx, tone }: { fx: ParsedEffect; tone: "red" | "green" }) {
  const isDebuff = fx.type === "Debuff";
  const name     = fx.effect_name ?? fx.effect ?? "—";
  const parts: string[] = [];
  if (fx.target)   parts.push(fx.target === "enemy" ? "Musuh" : fx.target === "self" ? "Diri" : fx.target);
  if (fx.amount != null && fx.amount > 0)
    parts.push(fx.calc_type === "percent" ? `${fx.amount}%` : `+${fx.amount}`);
  if (fx.chance != null && fx.chance < 100) parts.push(`${fx.chance}% chance`);
  if (fx.duration != null && fx.duration > 0) parts.push(`${fx.duration}t`);

  const toneClass = tone === "red"
    ? (isDebuff ? "text-red-400" : "text-red-300")
    : (isDebuff ? "text-emerald-400" : "text-emerald-300");

  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <span className={`text-[10px] font-bold shrink-0 ${isDebuff ? "text-red-500" : "text-emerald-500"}`}>
        {isDebuff ? "↓" : "↑"}
      </span>
      <span className={`text-xs font-medium ${toneClass}`}>{name}</span>
      {parts.length > 0 && (
        <span className="text-[10px] opacity-60 ml-auto shrink-0">{parts.join(" · ")}</span>
      )}
    </div>
  );
}

function ObjectRow({ obj, tone }: { obj: Record<string, unknown>; tone: "red" | "green" }) {
  const colorClass = tone === "red" ? "text-red-300" : "text-emerald-300";
  const dimClass   = tone === "red" ? "text-red-500/60" : "text-emerald-500/60";
  return (
    <div className="border border-white/[0.06] rounded-md px-2 py-1.5 space-y-0.5">
      {Object.entries(obj).map(([k, v]) => (
        <div key={k} className="flex gap-1.5 text-[11px]">
          <span className={`shrink-0 font-mono ${dimClass}`}>{k}:</span>
          <span className={`break-all ${colorClass}`}>
            {v === null ? "null" : typeof v === "object" ? JSON.stringify(v) : String(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

function SmartValue({ value, tone }: { value: unknown; tone: "red" | "green" }) {
  const colorClass = tone === "red" ? "text-red-300" : "text-emerald-300";
  const dimClass   = tone === "red" ? "text-red-500" : "text-emerald-500";

  const parsed = tryParseJson(value);

  // null / undefined
  if (parsed === null || parsed === undefined) {
    return <span className="text-slate-600 italic text-xs">kosong</span>;
  }

  // Array
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return <span className="text-slate-600 italic text-xs">[ ]</span>;
    }

    return (
      <div>
        <span className={`text-[10px] font-mono ${dimClass}`}>[{parsed.length} item]</span>
        <div className="mt-1 space-y-1 pl-2 border-l border-white/[0.08]">
          {parsed.map((item, i) => {
            if (typeof item === "object" && item !== null) {
              const obj = item as Record<string, unknown>;
              // Effects array — special display
              if (isEffectsArray([item as ParsedEffect])) {
                return <EffectRow key={i} fx={item as ParsedEffect} tone={tone} />;
              }
              return <ObjectRow key={i} obj={obj} tone={tone} />;
            }
            return (
              <div key={i} className="flex gap-2 text-xs">
                <span className={`shrink-0 font-mono text-[10px] ${dimClass} opacity-50`}>[{i}]</span>
                <span className={`break-all ${colorClass}`}>{String(item)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Plain object
  if (typeof parsed === "object") {
    return <ObjectRow obj={parsed as Record<string, unknown>} tone={tone} />;
  }

  // Primitive
  return <span className={`text-xs font-mono break-all ${colorClass}`}>{String(parsed)}</span>;
}

// ─── Components ───────────────────────────────────────────────────────────────

function SyncBadge({ run, active, onClick }: { run: SyncRun; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-3.5 text-left transition-all duration-200 ${
        active
          ? "border-red-500/60 bg-red-950/25 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]"
          : "border-white/[0.08] bg-slate-900/35 hover:border-slate-500/40 hover:bg-slate-900/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${active ? "text-red-300" : "text-slate-400"}`}>
            {run.initial ? "Snapshot awal" : "Sesi sinkronisasi"}
          </p>
          <p className="text-sm font-semibold text-slate-100">{timeAgo(run.syncedAt)}</p>
          <p className="text-[11px] text-slate-500">{formatDate(run.syncedAt)}</p>
        </div>

        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
          run.initial
            ? "border-slate-700/50 bg-slate-900/60 text-slate-400"
            : run.changes === 0
              ? "border-slate-700/40 bg-slate-900/40 text-slate-500"
              : "border-amber-700/50 bg-amber-950/40 text-amber-300"
        }`}>
          {run.initial ? "Initial" : `${run.changes} perubahan`}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-slate-400">⚔️ {run.totals.skills}</span>
        <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-slate-400">📦 {run.totals.library}</span>
        <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-slate-500">✨ {run.totals.skillEffects + run.totals.weaponEffects + run.totals.backEffects + run.totals.accessoryEffects}</span>
      </div>
    </button>
  );
}

function ChangeCard({ entry, density }: { entry: ChangeEntry; density: "comfortable" | "compact" }) {
  const cfg = ACTION_CONFIG[entry.action as ActionKey];
  const showDiff = entry.action === "modified" && entry.field;
  const compact = density === "compact";

  return (
    <div className={`rounded-2xl border shadow-sm ${cfg.border} ${cfg.bg} ${compact ? "p-3 sm:p-3.5" : "p-4 sm:p-5"}`}>
      <div className={`flex items-start ${compact ? "gap-2.5" : "gap-3"}`}>
        <span className="mt-0.5 shrink-0 text-base leading-none">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`flex flex-wrap items-center gap-2 ${compact ? "mb-1.5" : "mb-2"}`}>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.border} ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-slate-400">
              {CAT_ICON[entry.category]} {entry.category.replace(/_/g, " ")}
            </span>
            <span className="ml-auto text-[10px] text-slate-500">{formatDate(entry.detectedAt)}</span>
          </div>

          <h4 className={`font-semibold leading-snug text-white ${compact ? "text-sm" : "text-sm sm:text-base"}`}>{entry.entityName}</h4>
          <p className={`mt-0.5 font-mono text-slate-500 ${compact ? "text-[10px]" : "text-[11px]"}`}>ID: {entry.entityId}</p>

          {showDiff && (
            <div className={`space-y-2 ${compact ? "mt-2" : "mt-3"}`}>
              <p className="text-[11px] text-slate-500">
                Field diubah: <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-slate-300">{entry.field}</span>
              </p>
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${compact ? "gap-1.5" : "gap-2"}`}>
                <div className={`rounded-xl border border-red-900/40 bg-red-950/20 ${compact ? "px-2.5 py-2" : "px-3 py-2.5"}`}>
                  <p className="text-[9px] text-red-500 font-bold mb-1.5 uppercase tracking-wider">Sebelum</p>
                  <SmartValue value={entry.oldValue} tone="red" />
                </div>
                <div className={`rounded-xl border border-emerald-900/40 bg-emerald-950/20 ${compact ? "px-2.5 py-2" : "px-3 py-2.5"}`}>
                  <p className="text-[9px] text-emerald-500 font-bold mb-1.5 uppercase tracking-wider">Sesudah</p>
                  <SmartValue value={entry.newValue} tone="green" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChangelogPage() {
  const [syncs, setSyncs]             = useState<SyncRun[]>([]);
  const [activeSyncId, setActiveSync] = useState<string | null>(null);
  const [allEntries, setAllEntries]   = useState<ChangeEntry[]>([]);
  const [page, setPage]               = useState(1);
  const [category, setCategory]       = useState("all");
  const [action, setAction]           = useState("all");
  const [density, setDensity]         = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch]           = useState("");
  const [syncsLoading, setSyncsLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Load sync history once
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSyncsLoading(true);
    fetch(`${BASE}/data/syncs.json`)
      .then((r) => r.json())
      .then((data: SyncRun[]) => {
        setSyncs(data);
        // Auto-select first non-initial sync
        const first = data.find((s) => !s.initial) ?? data[0] ?? null;
        if (first) setActiveSync(first.id);
      })
      .catch(() => setError("Gagal memuat sync history. Pastikan sudah menjalankan sync-dump.js."))
      .finally(() => setSyncsLoading(false));
  }, []);

  // Load changes whenever active sync changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!activeSyncId) { setAllEntries([]); return; }
    setEntriesLoading(true);
    setPage(1);
    fetch(`${BASE}/data/changes/${activeSyncId}.json`)
      .then((r) => r.json())
      .then((data: ChangeEntry[]) => setAllEntries(data))
      .catch(() => setAllEntries([]))
      .finally(() => setEntriesLoading(false));
  }, [activeSyncId]);

  // Client-side filtering
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allEntries.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (action   !== "all" && e.action   !== action)   return false;
      if (q && !e.entityName.toLowerCase().includes(q) && !e.entityId.includes(q)) return false;
      return true;
    });
  }, [allEntries, category, action, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeSync = syncs.find((s) => s.id === activeSyncId);

  const actionCounts = useMemo(() =>
    filtered.reduce((acc, e) => { acc[e.action] = (acc[e.action] ?? 0) + 1; return acc; }, {} as Record<ActionKey, number>),
    [filtered]
  );

  const totalEntities = activeSync
    ? Object.values(activeSync.totals).reduce((a, b) => a + b, 0)
    : 0;

  function handleFilter<T>(setter: (v: T) => void, v: T) {
    setter(v);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-7 rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.08),transparent_40%),radial-gradient(circle_at_85%_0%,rgba(239,68,68,0.12),transparent_42%),rgba(2,6,23,0.7)] p-6 sm:p-7">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-700/40 bg-amber-950/20 px-3 py-1 text-xs text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
          Game Data Tracker
        </div>
        <h1 className="mb-2 text-3xl font-black text-white sm:text-4xl">
          Changelog{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            Database
          </span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
          Lacak semua perubahan data game — skill baru, buff/debuff, item diupdate, atau dihapus.
          Setiap kali dump files diperbarui dan sync dijalankan, perubahan tercatat di sini.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Perubahan tampil</p>
            <p className="mt-1 text-xl font-bold text-white">{entriesLoading ? "..." : filtered.length.toLocaleString("id-ID")}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Sync aktif</p>
            <p className="mt-1 text-xl font-bold text-white">{activeSync ? formatDate(activeSync.syncedAt) : "-"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Total entitas</p>
            <p className="mt-1 text-xl font-bold text-white">{activeSync ? totalEntities.toLocaleString("id-ID") : "-"}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <div className="space-y-4 lg:sticky lg:top-4">
            {/* Sync list */}
            <div className="rounded-2xl border border-white/[0.08] bg-slate-900/45 p-4">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-300">📅 Riwayat Sync</h2>
              {syncsLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />
                  ))}
                </div>
              ) : syncs.length === 0 ? (
                <div className="space-y-2 py-6 text-center">
                  <p className="text-2xl">📭</p>
                  <p className="text-slate-600 text-sm">Belum ada sync.</p>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    Jalankan sekali untuk mulai tracking:
                  </p>
                  <code className="block text-[11px] font-mono text-slate-500 bg-black/30 rounded-lg px-3 py-2">
                    node scripts/sync-dump.js
                  </code>
                </div>
              ) : (
                <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {syncs.map((run) => (
                    <SyncBadge
                      key={run.id}
                      run={run}
                      active={activeSyncId === run.id}
                      onClick={() => setActiveSync(run.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Active sync stats */}
            {activeSync && (
              <div className="rounded-2xl border border-white/[0.08] bg-slate-900/45 p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">📊 Ringkasan Sync</h3>
                {activeSync.initial ? (
                  <p className="text-xs leading-relaxed text-slate-500">
                    Initial snapshot - {Object.values(activeSync.totals).reduce((a, b) => a + b, 0).toLocaleString()} entities diindeks.
                  </p>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    {(
                      [
                        ["⚔️ Skills",       activeSync.totals.skills],
                        ["📦 Library",      activeSync.totals.library],
                        ["✨ Skill FX",     activeSync.totals.skillEffects],
                        ["🗡️ Weapon FX",   activeSync.totals.weaponEffects],
                        ["🎒 Back FX",      activeSync.totals.backEffects],
                        ["💍 Accessory FX", activeSync.totals.accessoryEffects],
                      ] as [string, number][]
                    ).map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between rounded-md border border-white/[0.06] bg-black/20 px-2.5 py-1.5">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-mono text-slate-300">{val.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-white/[0.06] pt-2 font-semibold">
                      <span className="text-amber-400">Perubahan</span>
                      <span className="text-amber-300">{activeSync.changes.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* How to sync */}
            <div className="rounded-2xl border border-white/[0.08] bg-slate-900/35 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">🚀 Cara Sync</h3>
              <p className="mb-2 text-[11px] text-slate-500">
                Perbarui dump files, lalu jalankan:
              </p>
              <code className="block rounded-lg bg-black/30 px-3 py-2 text-[11px] font-mono text-slate-400">
                node scripts/sync-dump.js
              </code>
              <p className="mt-2 text-[10px] text-slate-600">
                Lalu commit <code className="font-mono">public/data/</code> ke repo.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-slate-900/45 p-4 sm:p-5 space-y-4">
            <input
              type="text"
              placeholder="🔎 Cari nama skill / item…"
              value={search}
              onChange={(e) => handleFilter(setSearch, e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-700/60 focus:outline-none focus:ring-1 focus:ring-amber-700/30"
            />

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kategori</p>
              <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => handleFilter(setCategory, key)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                    category === key
                      ? "border-red-500 bg-red-600/80 text-white"
                      : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Aksi</p>
              <div className="flex flex-wrap gap-1.5">
              {(["all", ...ACTION_KEYS] as const).map((key) => {
                const cfg = key === "all" ? null : ACTION_CONFIG[key];
                const count = key !== "all" ? actionCounts[key] : filtered.length;
                return (
                  <button
                    key={key}
                    onClick={() => handleFilter(setAction, key)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                      action === key
                        ? key === "all"
                          ? "bg-white/10 border-white/20 text-white"
                          : `${cfg!.bg} ${cfg!.border} ${cfg!.color}`
                        : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                    }`}
                  >
                    {key === "all" ? "🗂️ Semua" : `${cfg!.icon} ${cfg!.label}`}
                    {count != null && count > 0 && (
                      <span className="ml-1 opacity-70">({count})</span>
                    )}
                  </button>
                );
              })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mode tampilan</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setDensity("comfortable")}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                    density === "comfortable"
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                  }`}
                >
                  Nyaman
                </button>
                <button
                  onClick={() => setDensity("compact")}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                    density === "compact"
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                  }`}
                >
                  Ringkas
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-xs text-slate-500">
            <span>
              {entriesLoading ? "Memuat…" : `${filtered.length.toLocaleString("id-ID")} perubahan`}
              {totalPages > 1 && ` · Halaman ${page}/${totalPages}`}
            </span>
            {(search || category !== "all" || action !== "all") && (
              <button
                onClick={() => { setSearch(""); setCategory("all"); setAction("all"); setPage(1); }}
                className="text-red-400 transition-colors hover:text-red-300"
              >
                ✕ Reset filter
              </button>
            )}
          </div>

          {/* Entries list */}
          {entriesLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
              ))}
            </div>
          ) : !activeSyncId ? (
            <div className="rounded-2xl border border-white/[0.08] bg-slate-900/35 py-16 text-center">
              <p className="text-3xl mb-2">👈</p>
              <p className="text-slate-500 text-sm">Pilih sync run di sidebar.</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-slate-900/35 py-16 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-slate-500 text-sm">
                {activeSync?.initial
                  ? "Ini adalah initial snapshot — belum ada perubahan yang bisa ditampilkan."
                  : "Tidak ada perubahan ditemukan dengan filter ini."}
              </p>
            </div>
          ) : (
            <div className={density === "compact" ? "space-y-2" : "space-y-3"}>
              {paginated.map((entry, i) => (
                <ChangeCard key={`${entry.entityId}-${entry.field ?? entry.action}-${i}`} entry={entry} density={density} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Prev
              </button>
              {[...Array(Math.min(totalPages, 9))].map((_, i) => {
                let pg: number;
                if (totalPages <= 9) pg = i + 1;
                else if (page <= 5)  pg = i + 1;
                else if (page >= totalPages - 4) pg = totalPages - 8 + i;
                else pg = page - 4 + i;
                return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                        pg === page
                          ? "border-red-500 bg-red-600 text-white"
                          : "border-white/10 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
