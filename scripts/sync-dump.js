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

// ─── Source Resolution ────────────────────────────────────────────────────────
// Ported from Encyclopedia.tsx — computes how/where each entity can be obtained.

const SOURCES_FILE = path.join(DUMP, "sources.json");

/** Collect all IDs from an object's arrays (one level deep). */
function collectIds(obj) {
  const ids = new Set();
  if (!obj || typeof obj !== "object") return ids;
  for (const val of Object.values(obj)) {
    if (Array.isArray(val)) val.forEach((id) => ids.add(id));
  }
  return ids;
}

/** Collect IDs from an array of {id} objects. */
function collectPetIds(arr) {
  const ids = new Set();
  if (Array.isArray(arr)) arr.forEach((p) => { if (p?.id) ids.add(p.id); });
  return ids;
}

/** Collect IDs from a rewards-style array (string or {id}). */
function collectRewardIds(arr) {
  const ids = new Set();
  if (!Array.isArray(arr)) return ids;
  arr.forEach((r) => {
    if (typeof r === "string") ids.add(r);
    else if (r?.id) ids.add(r.id);
  });
  return ids;
}

// Hardcoded ID sets (not derivable from dump data)
const BLACKSMITH_IDS = new Set([
  "wpn_609","wpn_119","wpn_179","wpn_164","wpn_293","wpn_137","wpn_135",
  "wpn_294","wpn_295","wpn_131","wpn_125","wpn_181","wpn_296","wpn_140",
  "wpn_297","wpn_139","wpn_303","wpn_136","wpn_304","wpn_305","wpn_138",
  "wpn_141","wpn_143","wpn_126","wpn_134","wpn_298","wpn_142","wpn_127",
  "wpn_144","wpn_611","wpn_307","wpn_145","wpn_306","wpn_299","wpn_146",
  "wpn_128","wpn_308","wpn_291","wpn_130","wpn_148","wpn_129","wpn_292",
  "wpn_150","wpn_612","wpn_151","wpn_336","wpn_339","wpn_333","wpn_332",
  "wpn_335","wpn_338","wpn_337","wpn_334","wpn_1139","wpn_1141","wpn_1143",
  "wpn_1145","wpn_1147","wpn_1149","wpn_1151","wpn_1153","wpn_1155",
  "wpn_1157","wpn_1159",
]);

const CLAN_FORGE_IDS = new Set([
  "wpn_6004","wpn_6006","wpn_6008","wpn_6010","wpn_6012","wpn_6014",
  "wpn_6016","wpn_6018","wpn_6029","wpn_6030","wpn_6031","wpn_6035",
  "wpn_6036","wpn_6037","wpn_6038","wpn_6039","wpn_6040","wpn_6041",
  "wpn_6042","wpn_6043","wpn_6044","wpn_6045","wpn_6046","wpn_6056",
  "wpn_6057","wpn_6058","wpn_6065","wpn_6066","wpn_6067","wpn_6068",
  "wpn_6069","wpn_6077","wpn_6078","wpn_6079","wpn_6080","wpn_6081",
]);

const CONTEST_SHOP_IDS = new Set([
  "wpn_2078","wpn_2077","wpn_2079","wpn_2080","wpn_2081","wpn_2051","wpn_2052","wpn_2053","wpn_2054","wpn_2055","wpn_2056","wpn_2057","wpn_2058","wpn_2059","wpn_2060","wpn_2061","wpn_2062",
  "back_2075","back_2076","back_2078","back_2077","back_2055","back_2056","back_2057","back_2058","back_2059","back_2060","back_2061","back_2062","back_2063","back_2064","back_2065","back_2066",
]);

const SENJUTSU_IDS = new Set([
  "skill_3001","skill_3002","skill_3003","skill_3004","skill_3005","skill_3006","skill_3007","skill_3008","skill_3009","skill_3010",
  "skill_3101","skill_3102","skill_3103","skill_3104","skill_3105","skill_3106","skill_3107","skill_3108","skill_3109","skill_3110",
]);

// Event keys → display labels (used to identify event gamedata entries)
const EVENT_LABELS = {
  valentine2025: "Valentine 2025", anniv2025: "Anniversary 2025", ramadhan2025: "Ramadhan 2025",
  easter2025: "Easter 2025", wmg2025: "WMG 2025", summer2025: "Summer 2025",
  independence2025: "Independence 2025", yinyang2025: "Yin Yang 2025", halloween2025: "Halloween 2025",
  confrontingdeath2025: "Confronting Death 2025", thanksgiving2025: "Thanksgiving 2025", christmas2025: "Christmas 2025",
  phantomkyunoki2026: "Phantom Kyunoki 2026", valentine2026: "Valentine 2026", anniv2026: "Anniversary 2026",
  ramadhan2026: "Ramadhan 2026", hanami2026: "Hanami 2026",
};
const EVENT_KEYS = Object.keys(EVENT_LABELS);

/**
 * Build all source-resolution indexes from dump data.
 * Returns an object with all the Sets/Maps needed by the resolve functions.
 */
function buildSourceIndexes() {
  const gamedata       = readDump("gamedata.json");
  const pet            = readDump("pet.json");
  const materialMarket = readDump("material_market_ids.json");
  const huntingMarket  = readDump("hunting_market_ids.json");
  const friendshipShop = readDump("friendship_shop_ids.json");
  const limitedStore   = readDump("limited_store_ids.json");

  // Build gamedata map: id → data
  const gamedataMap = {};
  for (let i = 0; i < gamedata.length; i++) {
    const entry = gamedata[i];
    if (entry?.id) gamedataMap[entry.id] = entry.data ?? {};
  }

  // Shop sets: {normal, clan, pvp, crew} → Set<id>
  const shopSets = {};
  for (const shopType of ["normal", "clan", "pvp", "crew"]) {
    const shopData = gamedataMap.shop?.[shopType];
    if (shopData && typeof shopData === "object") {
      shopSets[shopType] = collectIds(shopData);
    }
  }

  // Academy IDs
  const academyIds = collectIds(gamedataMap.academy);

  // Dragon Gacha IDs
  const dragonGachaIds = collectIds(gamedataMap.dragon_gacha);

  // Scroll of Wisdom IDs
  const sowIds = collectIds(gamedataMap.sow);

  // Pet Shop IDs
  const petShopIds = collectPetIds(gamedataMap.pet_shop?.pets);

  // Tailed Beast IDs
  const tailedBeastIds = collectPetIds(gamedataMap.tailed_beast?.pets);

  // Dragon Hunt Pet IDs
  const dragonHuntPetIds = collectIds(gamedataMap.dragon_hunt?.pets);

  // Scratch IDs
  const scratchIds = new Set();
  if (gamedataMap.scratch) {
    if (Array.isArray(gamedataMap.scratch.rewards)) gamedataMap.scratch.rewards.forEach((id) => scratchIds.add(id));
    if (Array.isArray(gamedataMap.scratch.grand_prize)) gamedataMap.scratch.grand_prize.forEach((id) => scratchIds.add(id));
  }

  // Justice Badge IDs
  const justiceBadgeIds = collectRewardIds(gamedataMap.justice_badge?.rewards);

  // Monster Hunter IDs
  const monsterHunterIds = new Set();
  if (Array.isArray(gamedataMap.monster_hunter?.rewards)) {
    gamedataMap.monster_hunter.rewards.forEach((id) => monsterHunterIds.add(id));
  }

  // Divine Tree IDs
  const divineTreeIds = collectRewardIds(gamedataMap.divinetree?.milestone);

  // Market ID sets
  const materialMarketIds = collectIds(materialMarket);
  const huntingMarketIds  = collectIds(huntingMarket);
  const friendshipShopIds = collectIds(friendshipShop);
  const limitedStoreIds   = collectIds(limitedStore);

  // Event mapping: item ID → list of event keys
  const itemToEvents = new Map();
  const ID_PATTERN = /^(wpn_|back_|set_|hair_|accessory_|skill_|pet_|material_)/;
  for (const key of EVENT_KEYS) {
    const evData = gamedataMap[key];
    if (!evData) continue;
    const walk = (obj) => {
      if (Array.isArray(obj)) {
        obj.forEach((item) => {
          let id = null;
          if (typeof item === "string" && ID_PATTERN.test(item)) id = item;
          else if (item && typeof item === "object" && typeof item.id === "string") id = item.id;
          if (id) {
            const existing = itemToEvents.get(id);
            if (existing) { if (!existing.includes(key)) existing.push(key); }
            else itemToEvents.set(id, [key]);
          }
        });
      } else if (obj && typeof obj === "object") {
        for (const val of Object.values(obj)) walk(val);
      }
    };
    walk(evData);
  }

  return {
    gamedataMap, shopSets, academyIds, dragonGachaIds, sowIds,
    petShopIds, tailedBeastIds, dragonHuntPetIds, scratchIds,
    justiceBadgeIds, monsterHunterIds, divineTreeIds,
    materialMarketIds, huntingMarketIds, friendshipShopIds, limitedStoreIds,
    itemToEvents, pet,
  };
}

function resolveItemSources(item, idx) {
  const sources = [];
  const id = item.id;

  // Shop cross-reference (gamedata arrays)
  if (idx.shopSets.normal?.has(id)) sources.push("shop_normal");
  if (idx.shopSets.clan?.has(id))   sources.push("shop_clan");
  if (idx.shopSets.pvp?.has(id))    sources.push("shop_pvp");
  if (idx.shopSets.crew?.has(id))   sources.push("shop_crew");

  // Buyable with gold but not in any gamedata shop array = still Normal Shop
  if (item.buyable && item.price_gold > 0 && sources.length === 0) sources.push("shop_normal");

  // Price-based detection
  if (item.price_prestige > 0) sources.push("clan_forge");
  if ((item.price_merit ?? 0) > 0 && !sources.includes("shop_crew")) sources.push("shop_crew");

  // Hardcoded forge/contest lists
  if (BLACKSMITH_IDS.has(id))    sources.push("blacksmith");
  if (CLAN_FORGE_IDS.has(id) && !sources.includes("clan_forge")) sources.push("clan_forge");
  if (CONTEST_SHOP_IDS.has(id))  sources.push("contest_shop");

  // Markets
  if (idx.materialMarketIds.has(id)) sources.push("material_market");
  if (idx.huntingMarketIds.has(id))  sources.push("hunting_market");
  if (idx.friendshipShopIds.has(id)) sources.push("friendship_shop");
  if (idx.limitedStoreIds.has(id))   sources.push("limited_store");

  // Gacha / features
  if (idx.dragonGachaIds.has(id))   sources.push("dragon_gacha");
  if (idx.scratchIds.has(id))       sources.push("daily_scratch");
  if (idx.justiceBadgeIds.has(id))  sources.push("justice_badge");
  if (idx.monsterHunterIds.has(id)) sources.push("monster_hunter");
  if (idx.divineTreeIds.has(id))    sources.push("divine_tree");

  // Events (specific per-event)
  const itemEvents = idx.itemToEvents.get(id);
  if (itemEvents) itemEvents.forEach((ev) => sources.push("event:" + ev));

  // Category-based fallbacks
  if (item.category === "clan") {
    if (!sources.includes("shop_clan") && !sources.includes("clan_war")) {
      sources.push(idx.shopSets.clan?.has(id) ? "shop_clan" : "clan_war");
    }
  }
  if (item.category === "crew") {
    if (!sources.includes("shop_crew") && !sources.includes("crew_battle")) {
      sources.push(idx.shopSets.crew?.has(id) ? "shop_crew" : "crew_battle");
    }
  }
  if (item.category === "shadowwar" && sources.length === 0) sources.push("shadow_war");
  if (item.category === "event" && !itemEvents) sources.push("event_seasonal");
  if (item.category === "package") sources.push("set_packages");
  if (item.category === "deals") sources.push("special_deals");
  if (item.category === "spending" && !itemEvents) sources.push("event_seasonal");
  if (item.category === "leaderboard") sources.push("arena_rewards");

  if (item.premium && sources.length === 0) sources.push("billing_packages");

  return sources;
}

function resolveSkillSources(skill, idx) {
  const sources = [];
  const id = skill.id;

  // Bloodline/Talent skills (type 9) = talent_shop
  if (String(skill.type) === "9") { sources.push("talent_shop"); return sources; }

  if (idx.academyIds.has(id)) sources.push("academy");
  if (idx.shopSets.pvp?.has(id)) sources.push("shop_pvp");
  if (SENJUTSU_IDS.has(id)) sources.push("senjutsu_shop");
  if (idx.sowIds.has(id)) sources.push("scroll_of_wisdom");
  if (idx.materialMarketIds.has(id)) sources.push("material_market");
  if (idx.huntingMarketIds.has(id))  sources.push("hunting_market");
  if (idx.friendshipShopIds.has(id)) sources.push("friendship_shop");
  if (idx.limitedStoreIds.has(id))   sources.push("limited_store");

  // Events (specific per-event)
  const skillEvents = idx.itemToEvents.get(id);
  if (skillEvents) skillEvents.forEach((ev) => sources.push("event:" + ev));

  // Advanced Academy: Kinjutsu upgrades (II-VI) with token price, not buyable
  if (!skill.buyable && skill.price_tokens > 0 && /\s(II|III|IV|V|VI)$/.test(skill.name)) {
    sources.push("advanced_academy");
  }

  if (skill.buyable && !sources.includes("academy") && !sources.includes("shop_pvp")) {
    if (skill.price_gold > 0) sources.push("academy");
    if (skill.price_tokens > 0 && !sources.includes("academy")) sources.push("limited_store");
  }

  // Category-based fallbacks
  if (skill.category === "clan" && !sources.includes("clan_war")) sources.push("clan_war");
  if (skill.category === "crew" && !sources.includes("crew_battle")) sources.push("crew_battle");
  if (skill.category === "shadowwar" && !sources.includes("shadow_war")) sources.push("shadow_war");
  if (skill.category === "event" && !skillEvents) sources.push("event_seasonal");
  if (skill.category === "deals") sources.push("special_deals");
  if (skill.category === "package") sources.push("set_packages");
  if (skill.category === "spending" && !skillEvents) sources.push("event_seasonal");

  if (skill.premium && sources.length === 0) sources.push("limited_store");

  return sources;
}

function resolvePetSources(id, idx) {
  const sources = [];
  if (idx.petShopIds.has(id))         sources.push("pet_shop");
  if (idx.tailedBeastIds.has(id))     sources.push("tailed_beast");
  if (idx.dragonHuntPetIds.has(id))   sources.push("dragon_hunt");
  if (idx.dragonGachaIds.has(id))     sources.push("dragon_gacha");
  if (idx.materialMarketIds.has(id))  sources.push("material_market");
  if (idx.huntingMarketIds.has(id))   sources.push("hunting_market");
  if (idx.friendshipShopIds.has(id))  sources.push("friendship_shop");
  if (idx.limitedStoreIds.has(id))    sources.push("limited_store");
  const petEvents = idx.itemToEvents.get(id);
  if (petEvents) petEvents.forEach((ev) => sources.push("event:" + ev));
  return sources;
}

/**
 * Compute sources for all entities and write dump/sources.json.
 * Returns the sources map for logging.
 */
function computeAndWriteSources(skills, library, idx) {
  const sources = {};

  for (const item of library) {
    const s = resolveItemSources(item, idx);
    if (s.length > 0) sources[item.id] = s;
  }

  for (const skill of skills) {
    const s = resolveSkillSources(skill, idx);
    if (s.length > 0) sources[skill.id] = s;
  }

  for (const pet of idx.pet) {
    const s = resolvePetSources(pet.id, idx);
    if (s.length > 0) sources[pet.id] = s;
  }

  writeJson(SOURCES_FILE, sources);

  const total = Object.keys(sources).length;
  console.log(`🏷️  Sources resolved for ${total.toLocaleString()} entities → dump/sources.json`);

  return sources;
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

  // ─── Source resolution ────────────────────────────────────────────────────
  console.log("🏷️  Resolving sources…");
  const sourceIdx = buildSourceIndexes();
  computeAndWriteSources(skills, library, sourceIdx);

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

  // Skip writing sync entry when there are no changes (non-initial)
  if (!isFirstSync && changes.length === 0) {
    console.log(`\n⏭  No changes detected — skipping sync entry.`);
    writeJson(SNAPSHOT_FILE, newSnapshot);
    return;
  }

  // Write per-sync changes file
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
