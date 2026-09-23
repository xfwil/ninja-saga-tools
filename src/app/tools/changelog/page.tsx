"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import IconImg from "@/components/IconImg";
import "./changelog.css";

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

function effectToKey(fx: ParsedEffect): string {
  return [fx.effect_name ?? fx.effect ?? "", fx.target ?? "", fx.type ?? ""].join("|");
}

function EffectRow({ fx, tone, changed }: { fx: ParsedEffect; tone: "red" | "green"; changed?: boolean }) {
  const isDebuff = fx.type === "Debuff";
  const name     = fx.effect_name ?? fx.effect ?? "—";
  const parts: string[] = [];
  if (fx.target)   parts.push(fx.target);
  if (fx.amount != null && fx.amount > 0)
    parts.push(fx.calc_type === "percent" ? `${fx.amount}%` : `+${fx.amount}`);
  if (fx.chance != null && fx.chance < 100) parts.push(`${fx.chance}% chance`);
  if (fx.duration != null && fx.duration > 0) parts.push(`${fx.duration}t`);

  const toneClass = tone === "red"
    ? (isDebuff ? "text-red-400" : "text-red-300")
    : (isDebuff ? "text-emerald-400" : "text-emerald-300");

  return (
    <div className={`flex items-center gap-1.5 py-0.5 rounded px-1 ${changed ? (tone === "red" ? "bg-red-500/15 ring-1 ring-red-500/30" : "bg-emerald-500/15 ring-1 ring-emerald-500/30") : ""}`}>
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

function buildChangedSet(thisSide: unknown[], otherSide: unknown[]): Set<number> {
  const changed = new Set<number>();
  if (!isEffectsArray(thisSide) || !isEffectsArray(otherSide)) return changed;

  const otherKeys = new Map<string, string>();
  for (const fx of otherSide) {
    otherKeys.set(effectToKey(fx), JSON.stringify(fx));
  }

  for (let i = 0; i < thisSide.length; i++) {
    const key = effectToKey(thisSide[i]);
    const otherJson = otherKeys.get(key);
    if (otherJson == null) {
      // This effect doesn't exist on the other side at all
      changed.add(i);
    } else if (otherJson !== JSON.stringify(thisSide[i])) {
      // Same effect but values differ
      changed.add(i);
    }
  }
  return changed;
}

function SmartValue({ value, tone, counterpart }: { value: unknown; tone: "red" | "green"; counterpart?: unknown }) {
  const colorClass = tone === "red" ? "text-red-300" : "text-emerald-300";
  const dimClass   = tone === "red" ? "text-red-500" : "text-emerald-500";

  const parsed = tryParseJson(value);
  const parsedOther = counterpart != null ? tryParseJson(counterpart) : undefined;

  // null / undefined
  if (parsed === null || parsed === undefined) {
      return <span className="text-slate-600 italic text-xs">—</span>;
  }

  // Array
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return <span className="text-slate-600 italic text-xs">[ ]</span>;
    }

    const otherArr = Array.isArray(parsedOther) ? parsedOther : [];
    const changedIndices = buildChangedSet(parsed, otherArr);

    return (
      <div>
        <span className={`text-[10px] font-mono ${dimClass}`}>[{parsed.length} item]</span>
        <div className="mt-1 space-y-1 pl-2 border-l border-white/[0.08]">
          {parsed.map((item, i) => {
            if (typeof item === "object" && item !== null) {
              const obj = item as Record<string, unknown>;
              // Effects array — special display
              if (isEffectsArray([item as ParsedEffect])) {
                return <EffectRow key={i} fx={item as ParsedEffect} tone={tone} changed={changedIndices.has(i)} />;
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

  // Primitive — highlight if different from counterpart
  const parsedOtherPrim = parsedOther != null && !Array.isArray(parsedOther) && typeof parsedOther !== "object" ? parsedOther : undefined;
  const isDiff = parsedOtherPrim !== undefined && String(parsed) !== String(parsedOtherPrim);
  return (
    <span className={`text-xs font-mono break-all ${colorClass} ${isDiff ? (tone === "red" ? "bg-red-500/15 px-1 rounded ring-1 ring-red-500/30" : "bg-emerald-500/15 px-1 rounded ring-1 ring-emerald-500/30") : ""}`}>
      {String(parsed)}
    </span>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

function SyncBadge({ run, active, onClick }: { run: SyncRun; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={active} className="journal-run">
      <span className="run-marker" aria-hidden="true" />
      <span><time dateTime={run.syncedAt}>{formatDate(run.syncedAt)}</time><small>{run.initial ? "Snapshot awal" : `${run.changes.toLocaleString("id-ID")} perubahan`} · {timeAgo(run.syncedAt)}</small></span>
      <span aria-hidden="true" className="run-arrow">↗</span>
    </button>
  );
}

function ChangeCard({ entry, density }: { entry: ChangeEntry; density: "comfortable" | "compact" }) {
  const cfg = ACTION_CONFIG[entry.action as ActionKey];
  const compact = density === "compact";
  const shortValue = (value: unknown) => value == null || typeof value === "number" || typeof value === "boolean";
  const inlineDiff = entry.action === "modified" && shortValue(entry.oldValue) && shortValue(entry.newValue);
  const categoryLabel = CATEGORIES.find((category) => category.key === entry.category)?.label ?? entry.category;

  return (
    <details className={`change-entry ${compact ? "is-compact" : ""}`}>
      <summary>
        <span className="change-art"><IconImg id={entry.entityId} size={36} /></span>
        <span className="change-identity"><strong>{entry.entityName || "—"}</strong><span>{categoryLabel} <span aria-hidden="true">/</span> <code>{entry.field ?? "—"}</code></span></span>
        {inlineDiff ? <span className="inline-diff" aria-label="Sebelum dan sesudah"><span>{entry.oldValue == null ? "—" : String(entry.oldValue)}</span><span aria-hidden="true">→</span><strong>{entry.newValue == null ? "—" : String(entry.newValue)}</strong></span> : <span className="change-hint">Lihat detail</span>}
        <span className={`change-status status-${entry.action}`}>{cfg.label}</span>
        <span className="change-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="change-body">
        <div className="change-provenance"><code>{entry.entityId || "—"}</code><time dateTime={entry.detectedAt}>{formatDate(entry.detectedAt)}</time></div>
        <div className="change-comparison">
          <section><h3><span aria-hidden="true">−</span> Sebelum</h3><SmartValue value={entry.oldValue} tone="red" counterpart={entry.newValue} /></section>
          <section><h3><span aria-hidden="true">+</span> Sesudah</h3><SmartValue value={entry.newValue} tone="green" counterpart={entry.oldValue} /></section>
        </div>
      </div>
    </details>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChangelogPage() {
  const historyRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const updateHistory = () => { if (historyRef.current) historyRef.current.open = desktop.matches; };
    updateHistory();
    desktop.addEventListener("change", updateHistory);
    return () => desktop.removeEventListener("change", updateHistory);
  }, []);
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
        // Filter out empty syncs (0 changes, non-initial) — they clutter the sidebar
        const meaningful = data.filter((s) => s.initial || s.changes > 0);
        setSyncs(meaningful);
        // Auto-select first non-initial sync with changes
        const first = meaningful.find((s) => !s.initial && s.changes > 0) ?? meaningful[0] ?? null;
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
    <div className="page-container changelog-page journal-page">
      <PageHeader title="Changelog" description="Riwayat pembaruan skill, item, dan efek. Pilih tanggal untuk membandingkan perubahan data." />

      {error && (
        <div className="mb-6 rounded-xl border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          ⚠️ {error}
        </div>
      )}

      <div className="changelog-layout">
        <div className="space-y-4">
          <div className="sync-sidebar space-y-4">
            {/* Sync list */}
            <details ref={historyRef} className="sync-history journal-history">
              <summary>Arsip pembaruan <small>· Pilih tanggal</small></summary>
              <div>
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
            </details>

            {/* Active sync stats */}
            {activeSync && <details className="journal-index"><summary>Isi snapshot · {totalEntities.toLocaleString("id-ID")} entitas</summary><dl>{Object.entries(activeSync.totals).map(([label, count]) => <div key={label}><dt>{label}</dt><dd>{count.toLocaleString("id-ID")}</dd></div>)}</dl></details>}

            {/* How to sync */}
            <details className="changelog-help">
              <summary>Informasi sinkronisasi</summary>
              <p className="mb-2 text-[11px] text-slate-500">
                Perbarui dump files, lalu jalankan:
              </p>
              <code className="block rounded-lg bg-black/30 px-3 py-2 text-[11px] font-mono text-slate-400">
                node scripts/sync-dump.js
              </code>
              <p className="mt-2 text-[10px] text-slate-600">
                Lalu commit <code className="font-mono">public/data/</code> ke repo.
              </p>
            </details>
          </div>
        </div>

        <div className="journal-content">
          <header className="journal-edition"><div><h2>{activeSync ? formatDate(activeSync.syncedAt) : "Memuat pembaruan…"}</h2><p>{activeSync?.initial ? "Snapshot awal database" : "Catatan sinkronisasi database"}</p></div><span>{activeSync?.changes.toLocaleString("id-ID") ?? "—"}<small>perubahan tercatat</small></span></header>
          <div className="journal-controls">
            <div className="journal-search">
            <input
              aria-label="Cari perubahan skill atau item"
              type="text"
              placeholder="Cari nama atau ID…"
              value={search}
              onChange={(e) => handleFilter(setSearch, e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-700/60 focus:outline-none focus:ring-1 focus:ring-amber-700/30"
            />
            <select aria-label="Kategori perubahan" value={category} onChange={(event) => handleFilter(setCategory, event.target.value)}>{CATEGORIES.map(({key, label}) => <option key={key} value={key}>{key === "all" ? "Semua kategori" : label}</option>)}</select>
            </div>

            <div className="journal-actions" role="group" aria-label="Jenis perubahan">
              {(["all", ...ACTION_KEYS] as const).map((key) => {
                const cfg = key === "all" ? null : ACTION_CONFIG[key];
                return (
                  <button
                    key={key}
                    aria-pressed={action === key}
                    onClick={() => handleFilter(setAction, key)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                      action === key
                        ? key === "all"
                          ? "bg-white/10 border-white/20 text-white"
                          : `${cfg!.bg} ${cfg!.border} ${cfg!.color}`
                        : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                    }`}
                  >
                    {key === "all" ? "Semua perubahan" : cfg!.label}
                  </button>
                );
              })}
            </div>

            <div className="journal-density">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setDensity("comfortable")}
                  aria-pressed={density === "comfortable"}
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
                  aria-pressed={density === "compact"}
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

          <div className="journal-results" role="status">
            <span>
              {entriesLoading ? "Memuat…" : `${filtered.length.toLocaleString("id-ID")} perubahan`}
              {totalPages > 1 && ` · Halaman ${page}/${totalPages}`}
              {!entriesLoading && <span className="result-breakdown">{ACTION_KEYS.map((key) => <span key={key} className={`status-${key}`}>{actionCounts[key] ?? 0} {ACTION_CONFIG[key].label.toLowerCase()}</span>)}</span>}
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
            <div className="journal-entries">
              {paginated.map((entry, i) => (
                <ChangeCard key={`${entry.syncId}-${entry.entityId}-${entry.field ?? entry.action}-${i}`} entry={entry} density={density} />
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
                       aria-current={pg === page ? "page" : undefined}
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
