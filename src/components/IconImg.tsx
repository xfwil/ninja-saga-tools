"use client";

import { useState, useCallback } from "react";

// ─── Icon CDN ─────────────────────────────────────────────────────────────────

const ICON_CDN = "https://play.huki.dev/sage";

/** Build the icon URL for a given item/skill ID */
export function getIconUrl(id: string): string | null {
  const cleaned = id.replace(/_%s$/g, "");

  // Currency / quantity — no icon
  if (cleaned.startsWith("tokens_") || cleaned.startsWith("tp_") || cleaned.startsWith("ss_")) return null;

  // Strip quantity suffix: essential_09:1 -> essential_09
  const base = cleaned.split(":")[0];

  // Skills go under /skills/
  if (base.startsWith("skill_")) return `${ICON_CDN}/skills/${base}.png`;

  // Everything else (items, pets) go under /items/
  return `${ICON_CDN}/items/${base}.png`;
}

// ─── Fallback Emoji ───────────────────────────────────────────────────────────

const FALLBACK_EMOJI: Record<string, string> = {
  skill: "🌀",
  wpn: "🗡️",
  back: "🎒",
  set: "👘",
  hair: "💇",
  accessory: "💍",
  pet: "🐾",
  essential: "💊",
  item: "📦",
  currency: "🪙",
};

export function getFallbackEmoji(id: string): string {
  if (id.startsWith("skill_"))     return FALLBACK_EMOJI.skill;
  if (id.startsWith("wpn_"))       return FALLBACK_EMOJI.wpn;
  if (id.startsWith("back_"))      return FALLBACK_EMOJI.back;
  if (id.startsWith("set_"))       return FALLBACK_EMOJI.set;
  if (id.startsWith("hair_"))      return FALLBACK_EMOJI.hair;
  if (id.startsWith("accessory_")) return FALLBACK_EMOJI.accessory;
  if (id.startsWith("pet_"))       return FALLBACK_EMOJI.pet;
  if (id.startsWith("essential_")) return FALLBACK_EMOJI.essential;
  if (id.startsWith("tokens_"))    return "🪙";
  if (id.startsWith("tp_"))        return "⭐";
  if (id.startsWith("ss_"))        return "💎";
  return FALLBACK_EMOJI.item;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Game icon image with automatic fallback to emoji when the CDN returns 404.
 *
 * - Skills:  https://play.huki.dev/sage/skills/{id}.png
 * - Items:   https://play.huki.dev/sage/items/{id}.png
 */
export default function IconImg({
  id,
  size = 24,
  className = "",
  fallbackClassName = "",
}: {
  /** The raw game ID, e.g. "skill_01", "wpn_01", "set_7071_%s" */
  id: string;
  size?: number;
  className?: string;
  /** Extra classes applied only to the emoji fallback span */
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = getIconUrl(id);
  const fallback = getFallbackEmoji(id);

  const handleError = useCallback(() => setFailed(true), []);

  if (!url || failed) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${className} ${fallbackClassName}`}
        style={{ width: size, height: size, fontSize: size * 0.65 }}
      >
        {fallback}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={handleError}
      className={`shrink-0 object-contain ${className}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
