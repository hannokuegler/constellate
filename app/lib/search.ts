import Fuse from "fuse.js";
import type { IndexEntry } from "./types";
import type { Persona } from "./persona";

export interface SearchHit {
  entry: IndexEntry;
  score: number;
  matched?: string;
}

const ID_QUERY = /^(mondo|orpha|orphanet|omim|hp|gard|doid)[\s:_-]?(\d+)$/i;

/**
 * Words that name the kind of thing, not the disease, as German-speaking families type it: "Morbus Krabbe", "M. Gaucher", "Krabbe-Krankheit".
 * The query is searched without them first; the full query still counts, one step lower, so "Morbus Fabry" groups stay findable.
 */
const FILLER = /(^|\s)(morbus|mb\.?|m\.|krankheit|erkrankung|syndrom)(?=\s|$)/gi;
const FULL_QUERY_PENALTY = 0.1;

/** "Morbus Krabbe" -> "krabbe"; the query itself when nothing (or too little) is left. */
export function coreQuery(query: string): string {
  const core = query.replace(FILLER, " ").replace(/\s+/g, " ").trim();
  return core.length >= 2 ? core : query.trim();
}

export function createSearcher(entries: IndexEntry[]) {
  const fuse = new Fuse(entries, {
    keys: [
      { name: "label", weight: 3 },
      { name: "synonyms", weight: 1.5 },
    ],
    includeScore: true,
    includeMatches: true,
    ignoreLocation: true,
    threshold: 0.34,
    minMatchCharLength: 2,
  });
  const byXref = new Map<string, IndexEntry[]>();
  for (const entry of entries) {
    for (const key of [entry.id, ...entry.xrefs]) {
      const normal = key.toUpperCase().replace("ORPHANET:", "ORPHA:");
      byXref.set(normal, [...(byXref.get(normal) ?? []), entry]);
    }
  }

  return function search(query: string, persona: Persona, limit = 8): SearchHit[] {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];
    const lowered = trimmed.toLowerCase();
    const idMatch = trimmed.match(ID_QUERY);
    if (idMatch) {
      const prefix = idMatch[1].toUpperCase().replace("ORPHANET", "ORPHA");
      const digits = prefix === "MONDO" ? idMatch[2].padStart(7, "0") : prefix === "HP" ? idMatch[2].padStart(7, "0") : idMatch[2];
      const exact = byXref.get(`${prefix}:${digits}`) ?? [];
      if (exact.length) return exact.slice(0, limit).map((entry) => ({ entry, score: 0, matched: `${prefix}:${digits}` }));
    }
    const core = coreQuery(trimmed);
    const coreLowered = core.toLowerCase();
    const rank = (q: string, penalty: number) =>
      fuse.search(q, { limit: 60 }).map((result) => {
        const entry = result.item;
        const label = entry.label.toLowerCase();
        const prefix = label.startsWith(coreLowered.slice(0, 3)) ? 0.08 : 0; // "krabe" should find "Krabbe disease" before its subtypes
        const lengthPenalty = Math.min(0.08, Math.max(0, label.length - coreLowered.length) * 0.002);
        const boost = (persona.typeBoost[entry.type] ?? 0) + (entry.in_core ? 0.04 : 0) + Math.min(Math.log10(1 + entry.degree) * 0.02, 0.06) + prefix - lengthPenalty;
        const synonymMatch = result.matches?.find((m) => m.key === "synonyms")?.value;
        const labelMatched = result.matches?.some((m) => m.key === "label");
        return { entry, score: (result.score ?? 1) - boost + penalty, matched: labelMatched ? undefined : synonymMatch };
      });
    const best = new Map<string, SearchHit>();
    for (const hit of core.toLowerCase() === lowered ? rank(trimmed, 0) : [...rank(core, 0), ...rank(trimmed, FULL_QUERY_PENALTY)]) {
      const prev = best.get(hit.entry.id);
      if (!prev || hit.score < prev.score) best.set(hit.entry.id, hit);
    }
    return [...best.values()].sort((a, b) => a.score - b.score).slice(0, limit);
  };
}

/** Room the suggestion list needs below the field: about three rows (each at least 44 px, plus padding). */
const ROOM_FOR_THREE = 3 * 60 + 16;

/**
 * On a phone the search field can sit near the bottom of the screen (or under the keyboard), so the suggestions open
 * out of sight. Scroll the field up under the sticky header when fewer than three rows would fit below it.
 * Respects reduced motion (jumps instead of gliding).
 */
export function revealSuggestions(field: HTMLElement | null) {
  if (!field || typeof window === "undefined") return;
  const viewport = window.visualViewport?.height ?? window.innerHeight;
  const rect = field.getBoundingClientRect();
  if (rect.bottom + ROOM_FOR_THREE <= viewport && rect.top >= 0) return;
  const header = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
  field.style.scrollMarginTop = `${Math.max(0, header) + 12}px`;
  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  field.scrollIntoView({ block: "start", behavior: still ? "auto" : "smooth" });
}
