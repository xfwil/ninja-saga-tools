/**
 * sync-dump.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Run: node scripts/sync-dump.js
 *
 * Reads all dump JSON files, diffs against the last known snapshot stored in
 * data/snapshot.json, then writes:
 *   • data/snapshot.json          — updated snapshot (not public, used next run)
 *   • public/data/syncs.json      — sync run history (read by dashboard)
 *   • public/data/changes/<id>.json — changes per sync run (loaded on demand)
 *
 * No external dependencies needed (no MongoDB). Just fs + Node.js built-ins.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const path = require("path");
const fs   = require("fs");
const crypto = require("crypto");

const ROOT       = path.resolve(__dirname, "..");
const DUMP       = path.join(ROOT, "dump");
const DATA       = path.join(ROOT, "data");
const PUBLIC_DATA = path.join(ROOT, "public", "data");
const CHANGES_DIR = path.join(PUBLIC_DATA, "changes");

const SNAPSHOT_FILE = path.join(DATA, "snapshot.json");
const SYNCS_FILE    = path.join(PUBLIC_DATA, "syncs.json");

// ─── Ensure directories ───────────────────────────────────────────────────────
for (const dir of [DATA, PUBLIC_DATA, CHANGES_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, "utf-8")); }
  catch { return fallback; }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

function readDump(filename) {
  return JSON.parse(fs.readFileSync(path.join(DUMP, filename), "utf-8"));
}

function hashData(obj) {
  return crypto
    .createHash("md5")
    .update(JSON.stringify(obj))
    .digest("hex");
}

/** Flatten an object into "dot.path" → value pairs for field-level diffing. */
function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = Array.isArray(v) ? JSON.stringify(v) : v;
    }
  }
  return out;
}

function diffEntity(oldData, newData) {
  const o = flatten(oldData);
  const n = flatten(newData);
  const changes = [];
  for (const key of new Set([...Object.keys(o), ...Object.keys(n)])) {
    if (key === "_id") continue;
    if (JSON.stringify(o[key]) !== JSON.stringify(n[key])) {
      changes.push({ field: key, oldValue: o[key] ?? null, newValue: n[key] ?? null });
    }
  }
  return changes;
}

/** Safe sync-run ID — use ISO timestamp with colons replaced */
function makeSyncId(date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

/**
 * Create a fingerprint for a single change entry (ignoring syncId / detectedAt).
 * Used to detect duplicate / flip-flop changes across consecutive syncs.
 */
function changeFingerprint(c) {
  return JSON.stringify({
    category:   c.category,
    action:     c.action,
    entityId:   c.entityId,
    field:      c.field ?? null,
    oldValue:   c.oldValue ?? null,
    newValue:   c.newValue ?? null,
  });
}

/**
 * Check if the *exact same set of changes* was already recorded in the
 * most recent previous sync.  If so, the data is flip-flopping and we
 * should skip writing a duplicate entry.
 */
function isDuplicateOfLastSync(newChanges) {
  const syncs = readJson(SYNCS_FILE, []);
  if (syncs.length === 0) return false;

  // Find the most recent non-initial sync
  const lastSync = syncs.find((s) => !s.initial && s.changes > 0);
  if (!lastSync) return false;

  const lastFile = path.join(CHANGES_DIR, `${lastSync.id}.json`);
  const lastChanges = readJson(lastFile, null);
  if (!lastChanges || !Array.isArray(lastChanges)) return false;

  // Different number of changes → not a duplicate
  if (lastChanges.length !== newChanges.length) return false;

  // Compare fingerprints (order-independent)
  const lastSet = new Set(lastChanges.map(changeFingerprint));
  const newSet  = new Set(newChanges.map(changeFingerprint));

  if (lastSet.size !== newSet.size) return false;
  for (const fp of newSet) {
    if (!lastSet.has(fp)) return false;
  }
  return true;
}

// ─── Flip-flop detection ────────────────────────────────────────────────────

/**
 * Build a unique key for a change entry (entity + field).
 */
function changeEntityKey(c) {
  return `${c.category}::${c.entityId}::${c.field ?? "_action_"}`;
}

/**
 * Detect flip-flop changes by looking at recent sync history.
 *
 * A flip-flop is when an entity+field alternates between two values:
 *   sync N-2:  A → B
 *   sync N-1:  B → A
 *   sync N  :  A → B  ← this is a flip-flop, should be suppressed
 *
 * We scan the last LOOKBACK non-initial syncs. If a change's (entity, field)
 * has appeared in ≥ THRESHOLD of those syncs, it's considered a flip-flop.
 *
 * Returns a Set of changeEntityKey strings that should be suppressed.
 */
const FLIPFLOP_LOOKBACK  = 4;   // how many recent syncs to inspect
const FLIPFLOP_THRESHOLD = 3;   // appear in ≥ this many → flip-flop

function detectFlipFlops(newChanges) {
  const syncs = readJson(SYNCS_FILE, []);
  const recentSyncs = syncs
    .filter((s) => !s.initial && s.changes > 0)
    .slice(0, FLIPFLOP_LOOKBACK);

  if (recentSyncs.length < 2) return new Set();

  // Count how many recent syncs each (entity, field) appeared in
  const hitCount = new Map();

  for (const sync of recentSyncs) {
    const file = path.join(CHANGES_DIR, `${sync.id}.json`);
    const entries = readJson(file, []);
    if (!Array.isArray(entries)) continue;

    const seenInThisSync = new Set();
    for (const c of entries) {
      const key = changeEntityKey(c);
      if (!seenInThisSync.has(key)) {
        seenInThisSync.add(key);
        hitCount.set(key, (hitCount.get(key) ?? 0) + 1);
      }
    }
  }

  // Only flag keys that also appear in the new changes
  const flipFlops = new Set();
  for (const c of newChanges) {
    const key = changeEntityKey(c);
    if ((hitCount.get(key) ?? 0) >= FLIPFLOP_THRESHOLD) {
      flipFlops.add(key);
    }
  }

  return flipFlops;
}

// ─── Entity builders ──────────────────────────────────────────────────────────

function buildEntities(arr, type, getId, getName) {
  return arr.map((item) => ({
    type,
    id:   getId(item),
    name: getName(item),
    data: item,
  }));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function sync() {
  console.log("📂  Reading dump files…");

  const skills            = readDump("skills.json");
  const library           = readDump("library.json");
  const skillEffects      = readDump("skill-effect.json");
  const weaponEffects     = readDump("weapon-effect.json");
  const backEffects       = readDump("back_item-effect.json");
  const accessoryEffects  = readDump("accessory-effect.json");

  // Build name lookup maps for effect entities
  const skillNameMap    = Object.fromEntries(skills.map((s) => [s.id, s.name]));
  const libraryNameMap  = Object.fromEntries(library.map((i) => [i.id, i.name]));

  const allEntities = [
    ...buildEntities(skills,           "skill",            (x) => x.id,       (x) => x.name),
    ...buildEntities(library,          "library",          (x) => x.id,       (x) => x.name),
    ...buildEntities(skillEffects,     "skill_effect",     (x) => x.skill_id, (x) => skillNameMap[x.skill_id] ?? x.skill_id),
    ...buildEntities(weaponEffects,    "weapon_effect",    (x) => x.id,       (x) => libraryNameMap[x.id] ?? x.id),
    ...buildEntities(backEffects,      "back_effect",      (x) => x.id,       (x) => libraryNameMap[x.id] ?? x.id),
    ...buildEntities(accessoryEffects, "accessory_effect", (x) => x.id,       (x) => libraryNameMap[x.id] ?? x.id),
  ];

  console.log(`📊  Total entities: ${allEntities.length.toLocaleString()}`);

  // Load previous snapshot
  const prevSnapshot = readJson(SNAPSHOT_FILE, null);
  const isFirstSync  = prevSnapshot === null;

  if (isFirstSync) {
    console.log("🆕  First sync detected — saving initial snapshot (no diff generated).");
  }

  // Build new snapshot map
  const newSnapshot = {};
  for (const e of allEntities) {
    const key = `${e.type}::${e.id}`;
    newSnapshot[key] = { name: e.name, hash: hashData(e.data), data: e.data };
  }

  const now    = new Date();
  const syncId = makeSyncId(now);

  let changes = [];

  if (!isFirstSync) {
    const prevMap = prevSnapshot; // key → { name, hash, data }
    const seen    = new Set();

    for (const e of allEntities) {
      const key  = `${e.type}::${e.id}`;
      const prev = prevMap[key];
      seen.add(key);

      if (!prev) {
        // New entity
        changes.push({
          syncId,
          detectedAt: now.toISOString(),
          category:   e.type,
          action:     "added",
          entityId:   e.id,
          entityName: e.name,
        });
      } else if (prev.hash !== hashData(e.data)) {
        // Modified — find which fields changed
        const diffs = diffEntity(prev.data, e.data);
        for (const d of diffs) {
          changes.push({
            syncId,
            detectedAt: now.toISOString(),
            category:   e.type,
            action:     "modified",
            entityId:   e.id,
            entityName: e.name,
            field:      d.field,
            oldValue:   d.oldValue,
            newValue:   d.newValue,
          });
        }
      }
    }

    // Removed entities
    for (const key of Object.keys(prevMap)) {
      if (!seen.has(key)) {
        const [type, ...idParts] = key.split("::");
        const id = idParts.join("::");
        changes.push({
          syncId,
          detectedAt: now.toISOString(),
          category:   type,
          action:     "removed",
          entityId:   id,
          entityName: prevMap[key].name,
        });
      }
    }
  }

  // ─── Deduplication: skip if changes are identical to the last sync ────────
  if (!isFirstSync && changes.length > 0 && isDuplicateOfLastSync(changes)) {
    console.log(`\n⏭  Skipped — ${changes.length} change(s) are identical to the previous sync (exact duplicate).`);
    console.log(`   The snapshot is NOT updated so the next real change will still be detected.`);
    return;
  }

  // ─── Flip-flop suppression ──────────────────────────────────────────────
  let suppressedKeys = new Set();
  if (!isFirstSync && changes.length > 0) {
    suppressedKeys = detectFlipFlops(changes);
    if (suppressedKeys.size > 0) {
      const suppressed = changes.filter((c) => suppressedKeys.has(changeEntityKey(c)));
      const kept       = changes.filter((c) => !suppressedKeys.has(changeEntityKey(c)));

      console.log(`\n🔄  Flip-flop detected — suppressing ${suppressed.length} change(s):`);
      for (const c of suppressed) {
        console.log(`     ↳ ${c.category}/${c.entityId} [${c.field ?? c.action}]`);
      }

      changes = kept;
    }
  }

  // For flip-flopping entities, revert their snapshot entry to the previous
  // value so they don't keep triggering on every sync.
  if (suppressedKeys.size > 0 && prevSnapshot) {
    for (const e of allEntities) {
      const snapKey = `${e.type}::${e.id}`;
      // Check if any suppressed change belongs to this entity
      const isSuppressed = [...suppressedKeys].some((k) => k.startsWith(`${e.type}::${e.id}::`));
      if (isSuppressed && prevSnapshot[snapKey]) {
        // Keep the old snapshot data so it won't flip again next run
        newSnapshot[snapKey] = prevSnapshot[snapKey];
      }
    }
  }

  // If all changes were suppressed, skip writing a sync entry entirely
  if (!isFirstSync && changes.length === 0 && suppressedKeys.size > 0) {
    console.log(`   All changes were flip-flops — skipping sync entry.`);
    // Still save snapshot (with reverted flip-flop entities)
    writeJson(SNAPSHOT_FILE, newSnapshot);
    return;
  }

  // Write per-sync changes file (even if empty, for consistency)
  const changesFile = path.join(CHANGES_DIR, `${syncId}.json`);
  writeJson(changesFile, changes);

  // Update syncs.json (prepend newest)
  const syncs = readJson(SYNCS_FILE, []);
  const syncRecord = {
    id:       syncId,
    syncedAt: now.toISOString(),
    initial:  isFirstSync,
    changes:  changes.length,
    totals: {
      skills:           skills.length,
      library:          library.length,
      skillEffects:     skillEffects.length,
      weaponEffects:    weaponEffects.length,
      backEffects:      backEffects.length,
      accessoryEffects: accessoryEffects.length,
    },
  };
  syncs.unshift(syncRecord);
  writeJson(SYNCS_FILE, syncs);

  // Save updated snapshot
  writeJson(SNAPSHOT_FILE, newSnapshot);

  // Summary
  if (isFirstSync) {
    console.log(`\n✅  Initial snapshot saved — ${allEntities.length.toLocaleString()} entities indexed.`);
    console.log(`   Run the script again after a game update to start tracking changes.`);
  } else {
    const added    = changes.filter((c) => c.action === "added").length;
    const removed  = changes.filter((c) => c.action === "removed").length;
    const modified = changes.filter((c) => c.action === "modified").length;

    console.log(`\n✅  Sync complete!`);
    console.log(`   ➕ Added:    ${added}`);
    console.log(`   ✏️  Modified: ${modified}`);
    console.log(`   ➖ Removed:  ${removed}`);
    console.log(`   📝 Total:    ${changes.length}`);
    console.log(`   📄 File: public/data/changes/${syncId}.json`);
  }
}

try {
  sync();
} catch (err) {
  console.error("❌  Sync failed:", err);
  process.exit(1);
}
