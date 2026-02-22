/**
 * Ninja Saga Game Data Dumper
 * Downloads and decompresses .bin game data files into JSON.
 *
 * Usage: node dump-game-data.mjs
 *        node dump-game-data.mjs skills talents senjutsu   (specific assets only)
 */

import { inflateSync, gunzipSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL  = "https://ns-assets.ninjasage.id/static/lib/";
const OUTPUT_DIR = join(__dirname, "dump");

const ALL_ASSETS = [
  "skills",
  "library",
  "enemy",
  "npc",
  "pet",
  "mission",
  "gamedata",
  "talents",
  "senjutsu",
  "skill-effect",
  "weapon-effect",
  "back_item-effect",
  "accessory-effect",
  "arena-effect",
  "animation",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RESET  = "\x1b[0m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED    = "\x1b[31m";
const CYAN   = "\x1b[36m";
const DIM    = "\x1b[2m";

const log = {
  info:    (msg) => console.log(`${GREEN}✔${RESET}  ${msg}`),
  warn:    (msg) => console.log(`${YELLOW}⚠${RESET}  ${msg}`),
  error:   (msg) => console.log(`${RED}✖${RESET}  ${msg}`),
  pending: (msg) => process.stdout.write(`${CYAN}↓${RESET}  ${msg} ... `),
  done:    (msg) => console.log(`${GREEN}${msg}${RESET}`),
};

/**
 * Decompress a Buffer that is either zlib (RFC 1950) or gzip (RFC 1952).
 * Mirrors PHP's gzuncompress() → gzdecode() fallback.
 */
function decompress(buffer) {
  try {
    return inflateSync(buffer); // zlib / gzuncompress
  } catch {
    // fall through
  }
  return gunzipSync(buffer); // gzip / gzdecode
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function dumpAsset(asset) {
  const url = `${BASE_URL}${asset}.bin`;
  log.pending(asset.padEnd(20));

  const res = await fetch(url);
  if (!res.ok) {
    log.done(`${RED}FAILED (HTTP ${res.status})${RESET}`);
    return false;
  }

  const arrayBuffer = await res.arrayBuffer();
  const compressed  = Buffer.from(arrayBuffer);

  let jsonBuffer;
  try {
    jsonBuffer = decompress(compressed);
  } catch (err) {
    log.done(`${RED}DECOMPRESS ERROR: ${err.message}${RESET}`);
    return false;
  }

  const outPath = join(OUTPUT_DIR, `${asset}.json`);
  writeFileSync(outPath, jsonBuffer);

  const kb = (jsonBuffer.length / 1024).toFixed(1);
  log.done(`OK  ${DIM}(${kb} KB) → dump/${asset}.json${RESET}`);
  return true;
}

async function main() {
  // Allow running specific assets: node dump-game-data.mjs skills talents
  const requested = process.argv.slice(2);
  const assets = requested.length > 0
    ? requested.filter((a) => ALL_ASSETS.includes(a))
    : ALL_ASSETS;

  if (requested.length > 0) {
    const unknown = requested.filter((a) => !ALL_ASSETS.includes(a));
    if (unknown.length > 0) {
      log.warn(`Unknown asset(s) skipped: ${unknown.join(", ")}`);
    }
  }

  console.log(`\n${CYAN}Ninja Saga Game Data Dump${RESET}`);
  console.log(`${DIM}Source : ${BASE_URL}${RESET}`);
  console.log(`${DIM}Output : ${OUTPUT_DIR}${RESET}`);
  console.log(`${DIM}Assets : ${assets.length}${RESET}\n`);

  mkdirSync(OUTPUT_DIR, { recursive: true });

  let ok = 0, fail = 0;
  for (const asset of assets) {
    try {
      const success = await dumpAsset(asset);
      success ? ok++ : fail++;
    } catch (err) {
      console.log(`${RED}ERROR: ${err.message}${RESET}`);
      fail++;
    }
  }

  console.log(
    `\n${DIM}─────────────────────────────────${RESET}\n` +
    `Done. ${GREEN}${ok} success${RESET}` +
    (fail > 0 ? `, ${RED}${fail} failed${RESET}` : "") +
    "\n"
  );
}

main();
