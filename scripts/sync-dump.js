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

  const allEntities = [
    ...buildEntities(skills,           "skill",            (x) => x.id,       (x) => x.name),
    ...buildEntities(library,          "library",          (x) => x.id,       (x) => x.name),
    ...buildEntities(skillEffects,     "skill_effect",     (x) => x.skill_id, (x) => x.skill_id),
    ...buildEntities(weaponEffects,    "weapon_effect",    (x) => x.id,       (x) => x.id),
    ...buildEntities(backEffects,      "back_effect",      (x) => x.id,       (x) => x.id),
    ...buildEntities(accessoryEffects, "accessory_effect", (x) => x.id,       (x) => x.id),
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
