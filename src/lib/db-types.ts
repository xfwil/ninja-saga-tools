import { ObjectId } from "mongodb";

// ─── Sync Run ──────────────────────────────────────────────────────────────────
// One document per sync execution
export type SyncRun = {
  _id?: ObjectId;
  syncedAt: Date;
  totals: {
    skills: number;
    library: number;
    skillEffects: number;
    weaponEffects: number;
    backEffects: number;
    accessoryEffects: number;
  };
  changes: number; // total changes detected in this run
};

// ─── Entity Snapshot ───────────────────────────────────────────────────────────
// Stores the last known state of every entity for diffing
export type EntitySnapshot = {
  _id?: ObjectId;
  entityType:
    | "skill"
    | "library"
    | "skill_effect"
    | "weapon_effect"
    | "back_effect"
    | "accessory_effect";
  entityId: string;       // e.g. skill_6001, wpn_4001
  entityName: string;
  data: Record<string, unknown>;
  firstSeenAt: Date;
  lastSeenAt: Date;
};

// ─── Changelog Entry ──────────────────────────────────────────────────────────
// One document per individual field change (or add/remove)
export type ChangelogEntry = {
  _id?: ObjectId;
  detectedAt: Date;
  syncRunId: ObjectId;
  category:
    | "skill"
    | "library"
    | "skill_effect"
    | "weapon_effect"
    | "back_effect"
    | "accessory_effect";
  action: "added" | "removed" | "modified";
  entityId: string;
  entityName: string;
  field?: string;          // which field changed (for "modified")
  oldValue?: unknown;
  newValue?: unknown;
};
