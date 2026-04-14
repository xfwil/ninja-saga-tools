/**
 * sync-sw-rewards.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Run: node scripts/sync-sw-rewards.js
 *      node scripts/sync-sw-rewards.js S23        (force label)
 *
 * Fetches the current Shadow War rewards from the API, compares with stored
 * seasons in public/data/sw-rewards.json, and if the data is new, appends
 * it as a new season entry.
 *
 * The season label auto-increments (S23 -> S24 -> S25 ...) unless you pass
 * a custom label as the first argument.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const path = require("path");
const fs   = require("fs");

const ROOT        = path.resolve(__dirname, "..");
const PUBLIC_DATA = path.join(ROOT, "public", "data");
const REWARDS_FILE = path.join(PUBLIC_DATA, "sw-rewards.json");
const API_URL     = "https://ninjasage.id/api/event/sw";

// ─── Ensure directory ─────────────────────────────────────────────────────────
if (!fs.existsSync(PUBLIC_DATA)) fs.mkdirSync(PUBLIC_DATA, { recursive: true });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, "utf-8")); }
  catch { return fallback; }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

function fingerprint(data) {
  return JSON.stringify(data);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const forceLabel = process.argv[2] || null;

  console.log("📡 Fetching SW rewards from API...");

  const res = await fetch(API_URL);
  if (!res.ok) {
    console.error(`❌ API returned ${res.status}`);
    process.exit(1);
  }

  const json = await res.json();
  const liveData = json.data;

  if (!liveData || !liveData.squad) {
    console.error("❌ Unexpected API response format.");
    process.exit(1);
  }

  console.log("✅ API data fetched successfully.");

  // Load existing file
  const file = readJson(REWARDS_FILE, { seasons: [] });
  const liveFp = fingerprint(liveData);

  // Check for duplicate
  const match = file.seasons.find((s) => fingerprint(s.data) === liveFp);
  if (match && !forceLabel) {
    console.log(`ℹ️  Data identical to existing season "${match.season}". No changes.`);
    return;
  }

  // Determine season label
  let seasonLabel;
  if (forceLabel) {
    seasonLabel = forceLabel;
    // Remove existing entry with same label if re-syncing
    file.seasons = file.seasons.filter((s) => s.season !== forceLabel);
  } else {
    const maxNum = file.seasons.reduce((max, s) => {
      const n = parseInt(s.season.replace(/\D/g, ""), 10) || 0;
      return Math.max(max, n);
    }, 0);
    seasonLabel = `S${maxNum + 1}`;
  }

  const entry = {
    season: seasonLabel,
    fetchedAt: new Date().toISOString(),
    data: liveData,
  };

  file.seasons.push(entry);

  // Sort by season number descending
  file.seasons.sort((a, b) => {
    const numA = parseInt(a.season.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.season.replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });

  writeJson(REWARDS_FILE, file);

  console.log(`🎉 Season "${seasonLabel}" saved to ${REWARDS_FILE}`);
  console.log(`   Squad ranks: ${Object.keys(liveData.squad).join(", ")}`);
  console.log(`   Winner Squad ranks: ${Object.keys(liveData.winner_squad).join(", ")}`);
  console.log(`   Top Global ranks: ${Object.keys(liveData.top_global).join(", ")}`);
  console.log(`   League tiers: ${Object.keys(liveData.league).join(", ")}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
