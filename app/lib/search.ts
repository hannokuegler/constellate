import Fuse from "fuse.js";
import type { IndexEntry } from "./types";
import type { Persona } from "./persona";

export interface SearchHit {
  entry: IndexEntry;
  score: number;
  matched?: string;
}

const ID_QUERY = /^(mondo|orpha|orphanet|omim|hp|gard|doid)[\s:_-]?(\d+)$/i;

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
    return fuse
      .search(trimmed, { limit: 60 })
      .map((result) => {
        const entry = result.item;
        const label = entry.label.toLowerCase();
        const prefix = label.startsWith(lowered.slice(0, 3)) ? 0.08 : 0; // "krabe" should find "Krabbe disease" before its subtypes
        const lengthPenalty = Math.min(0.08, Math.max(0, label.length - lowered.length) * 0.002);
        const boost = (persona.typeBoost[entry.type] ?? 0) + (entry.in_core ? 0.04 : 0) + Math.min(Math.log10(1 + entry.degree) * 0.02, 0.06) + prefix - lengthPenalty;
        const synonymMatch = result.matches?.find((m) => m.key === "synonyms")?.value;
        const labelMatched = result.matches?.some((m) => m.key === "label");
        return { entry, score: (result.score ?? 1) - boost, matched: labelMatched ? undefined : synonymMatch };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, limit);
  };
}
