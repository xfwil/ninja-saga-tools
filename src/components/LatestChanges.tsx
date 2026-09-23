"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import IconImg from "./IconImg";

type LatestRun = { id: string; syncedAt: string; changes: number; initial: boolean };
type LatestEntry = { entityId: string; entityName: string; field?: string; action: "modified" | "added" | "removed" };
const actionLabels = { modified: "Diubah", added: "Baru", removed: "Dihapus" };
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function LatestChanges() {
  const [content, setContent] = useState<{ run: LatestRun; entries: LatestEntry[] } | null>(null);
  const [status, setStatus] = useState("Memuat catatan pembaruan…");
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${BASE}/data/syncs.json`, { signal: controller.signal });
        if (!response.ok) throw new Error("syncs");
        const runs: LatestRun[] = await response.json();
        const run = runs.find((entry) => !entry.initial && entry.changes > 0);
        if (!run) { setStatus("Belum ada catatan perubahan."); return; }
        const changes = await fetch(`${BASE}/data/changes/${run.id}.json`, { signal: controller.signal });
        if (!changes.ok) throw new Error("changes");
        const entries: LatestEntry[] = await changes.json();
        if (!controller.signal.aborted) setContent({ run, entries: entries.slice(0, 3) });
      } catch {
        if (!controller.signal.aborted) setStatus("Catatan belum dapat dimuat. Buka Changelog untuk mencoba lagi.");
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return (
    <section className="landing-updates" aria-labelledby="updates-heading">
      <div className="updates-intro"><h2 id="updates-heading">Pembaruan terakhir</h2><p>{content ? <>{new Date(content.run.syncedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} · {content.run.changes} perubahan tercatat</> : "Catatan sinkronisasi database game."}</p><Link href="/tools/changelog">Semua perubahan →</Link></div>
      <div className="updates-feed">{content ? content.entries.map((entry, index) => <Link href="/tools/changelog" key={`${entry.entityId}-${entry.field}-${index}`}><IconImg id={entry.entityId} size={36} /><div><strong>{entry.entityName || "—"}</strong><code>{entry.field ?? "—"}</code></div><span>{actionLabels[entry.action] ?? "—"}</span><span aria-hidden="true">↗</span></Link>) : <p role="status">{status}</p>}</div>
    </section>
  );
}
