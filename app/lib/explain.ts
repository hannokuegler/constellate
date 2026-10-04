// Shared by /api/explain (server) and the client renderer: template fallback, sentence splitting, citation post-check.
import type { Edge } from "./types";
import { formatConfidence } from "./evidence";

export const EDGE_ID_PATTERN = /\[(e_[0-9a-f]{6,16})\]/g;

export type ExplainEvent =
  | { type: "meta"; mode: "llm" | "template"; model?: string; note: string }
  /** approval status of the disease: grounded in the searched EMA/FDA records of its data file, not in an edge */
  | { type: "status"; text: string; source: string }
  | { type: "sentence"; text: string; edge_ids: string[]; invalid_ids: string[] }
  | { type: "dropped"; text: string; reason: string }
  | { type: "error"; message: string }
  | { type: "done"; kept: number; dropped: number };

/** Post-check: a sentence survives only if it cites at least one edge id from the input. */
export function checkSentence(raw: string, validIds: Set<string>): ExplainEvent | null {
  const text = raw.trim();
  if (!text) return null;
  const cited = [...text.matchAll(EDGE_ID_PATTERN)].map((m) => m[1]);
  const valid = cited.filter((id) => validIds.has(id));
  const invalid = cited.filter((id) => !validIds.has(id));
  if (!valid.length) {
    return { type: "dropped", text, reason: cited.length ? `cites unknown edge ${invalid.join(", ")}` : "no edge citation" };
  }
  // keep the sentence (it has support) but strip references the model invented, so no dead link is rendered
  const cleaned = invalid.reduce((t, id) => t.replaceAll(` [${id}]`, "").replaceAll(`[${id}]`, ""), text);
  return { type: "sentence", text: cleaned, edge_ids: [...new Set(valid)], invalid_ids: [...new Set(invalid)] };
}

/** Splits streamed text into complete sentences; returns [complete sentences, remainder]. */
export function splitSentences(buffer: string): [string[], string] {
  const sentences: string[] = [];
  const boundary = /([.!?])(\s+)(?=[A-Z0-9“"(])|\n+/g;
  let last = 0;
  for (const match of buffer.matchAll(boundary)) {
    const end = (match.index ?? 0) + (match[1] ? 1 : 0);
    sentences.push(buffer.slice(last, end));
    last = (match.index ?? 0) + match[0].length;
  }
  return [sentences.filter((s) => s.trim()), buffer.slice(last)];
}

// ---------------------------------------------------------------------------------------------------
// plain-language fallback (no model and no precomputed text): short sentences a parent can read,
// no database prefixes, no formulas, no ranks; every sentence still cites the edges it rests on.

export interface PlainContext {
  /** the disease the card is about, and the related disease it is compared with */
  fromId?: string | null;
  viaId?: string | null;
  /** labels of the symptoms the two diseases share (from the disease file), most specific first */
  sharedSymptoms?: string[];
}

const GENE_EDGE = new Set(["caused_by", "associated_gene"]);
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const lower = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const andList = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
const tags = (list: Edge[]) => [...new Set(list.map((e) => e.id))].map((id) => `[${id}]`).join(" ");
/** a readable name: label if known, else the id without its database prefix */
const nameOf = (id: string, labels: Record<string, string>) => labels[id] ?? id.replace(/^[A-Z]+[:_]/, "");

export function plainSentences(edges: Edge[], labels: Record<string, string>, ctx: PlainContext = {}): string[] {
  if (!edges.length) return [];
  const linkTypes = new Set(["similar_phenotype", "shares_gene"]);
  const guess = edges.find((e) => linkTypes.has(e.type) && e.source.startsWith("MONDO") && e.target.startsWith("MONDO"));
  const from = ctx.fromId ?? guess?.source ?? edges[0].source;
  const via = ctx.viaId ?? (guess ? (guess.source === from ? guess.target : guess.source) : null);
  const D = nameOf(from, labels);
  const N = via ? nameOf(via, labels) : "the related disease";
  const link =
    edges.find((e) => via && ((e.source === from && e.target === via) || (e.source === via && e.target === from))) ?? guess ?? edges[0];
  const out: string[] = [];

  // 1. medicines of the related disease: approved there, not here
  const theirDrugs = via ? edges.filter((e) => e.type === "approved_therapy" && e.source === via) : [];
  if (theirDrugs.length) {
    const names = [...new Set(theirDrugs.map((e) => nameOf(e.target, labels)))];
    out.push(`${andList(names)} ${names.length > 1 ? "are" : "is"} approved for ${N}, not for ${D} ${tags(theirDrugs)}.`);
  }

  // 2. what they share: gene, cell process, symptoms
  const genesOf = (id: string | null) => edges.filter((e) => GENE_EDGE.has(e.type) && e.source === id);
  const ownGenes = genesOf(from);
  const theirGenes = genesOf(via);
  const shared = ownGenes.filter((e) => theirGenes.some((t) => t.target === e.target));
  for (const own of shared.slice(0, 1)) {
    const theirs = theirGenes.find((t) => t.target === own.target)!;
    const inferred = own.level === "inferred" ? `; for ${D} this link is inferred from one of its forms, not recorded directly` : "";
    out.push(`Both diseases are linked to the same gene, ${own.target}${inferred} ${tags([own, theirs])}.`);
  }
  const ownSymbols = new Set(ownGenes.map((e) => e.target));
  const theirSymbols = new Set(theirGenes.map((e) => e.target));
  const pathways = new Map<string, Edge[]>();
  for (const e of edges.filter((x) => x.type === "in_pathway")) pathways.set(e.target, [...(pathways.get(e.target) ?? []), e]);
  const sharedPathway = [...pathways.entries()].find(
    ([, list]) => list.some((e) => ownSymbols.has(e.source)) && list.some((e) => theirSymbols.has(e.source)),
  );
  if (sharedPathway) {
    const [pathway, list] = sharedPathway;
    const genes = [...new Set(list.map((e) => e.source))];
    out.push(
      `${genes.length > 1 ? `Their genes ${andList(genes)} work` : `The gene ${genes[0]} works`} in the same process inside the cell, ${lower(nameOf(pathway, labels))} ${tags(list)}.`,
    );
  } else if (!shared.length && via) {
    out.push(`No shared gene and no shared process inside the cell is recorded for these two diseases, so similar symptoms may have different causes ${tags([link])}.`);
  }
  const symptoms = (ctx.sharedSymptoms ?? []).slice(0, 3).map(lower);
  if (link.type === "similar_phenotype") {
    out.push(
      symptoms.length
        ? `Both can show symptoms such as ${andList(symptoms)} ${tags([link])}.`
        : `Their recorded symptoms overlap, which is how the two diseases were linked here ${tags([link])}.`,
    );
  }

  // 3. what differs: genes only one of them is linked to
  const ownOnly = ownGenes.find((e) => !theirSymbols.has(e.target) && e.type === "caused_by" && e.level !== "inferred");
  const theirOnly = theirGenes.find((e) => !ownSymbols.has(e.target) && e.type === "caused_by" && e.level !== "inferred");
  if (ownOnly && theirOnly) {
    out.push(`They also differ: ${D} is linked to the gene ${ownOnly.target} and ${N} to ${theirOnly.target}; neither gene is recorded for the other disease ${tags([ownOnly, theirOnly])}.`);
  } else if (ownOnly || theirOnly) {
    const e = (ownOnly ?? theirOnly)!;
    out.push(`They also differ: ${e === ownOnly ? D : N} is linked to the gene ${e.target}, which is not recorded for ${e === ownOnly ? N : D} ${tags([e])}.`);
  }
  const theirStudies = via ? edges.filter((e) => e.type === "studied_in" && e.source === via).slice(0, 2) : [];
  if (theirStudies.length) out.push(`The studies on this card are for ${N}, not for ${D} ${tags(theirStudies)}.`);
  const disputed = edges.filter((e) => e.contradicting.length).slice(0, 2);
  if (disputed.length) out.push(`Some sources disagree with ${disputed.length > 1 ? "two of these links" : "one of these links"}, so treat ${disputed.length > 1 ? "them" : "it"} with care ${tags(disputed)}.`);

  // 4. the question to take along
  const what = [theirStudies.length && "its studies", theirDrugs.length && "its approved medicines"].filter(Boolean) as string[];
  out.push(
    `Ask your specialist whether anything learned for ${N}${what.length ? `, such as ${andList(what)},` : ""} could matter for ${D} ${tags([link])}.`,
  );
  return out.map(cap);
}

const rel = (e: Edge, labels: Record<string, string>) => ({ S: labels[e.source] ?? e.source, T: labels[e.target] ?? e.target });

/** Technical one-sentence-per-edge text (kept for scripts and debugging; the action card uses plainSentences). */
export function templateSentences(edges: Edge[], labels: Record<string, string>): string[] {
  const sentences: string[] = [];
  for (const e of edges) {
    const { S, T } = rel(e, labels);
    const ev = e.evidence[0];
    const source = ev ? `${ev.db}${ev.record ? ` ${ev.record}` : ""}` : "no source";
    const tag = `[${e.id}]`;
    switch (e.type) {
      case "caused_by":
        sentences.push(`${S} is annotated with the disease gene ${T} (${e.level}, ${source}) ${tag}.`);
        break;
      case "associated_gene":
        sentences.push(`${S} is associated with ${T}, but not recorded as its cause (${e.level}, ${source}) ${tag}.`);
        break;
      case "has_phenotype":
        sentences.push(`${T} is recorded as a feature of ${S} (${source}, confidence ${formatConfidence(e.confidence)}) ${tag}.`);
        break;
      case "similar_phenotype":
        sentences.push(`${S} and ${T} have similar phenotype profiles, a link computed by Constellate: ${e.formula ?? ev?.snippet ?? "formula not recorded"} ${tag}.`);
        break;
      case "shares_gene":
        sentences.push(`${S} and ${T} share a disease gene: ${e.formula ?? ev?.snippet ?? ""} ${tag}.`);
        break;
      case "in_pathway":
        sentences.push(`${S} takes part in the Reactome pathway ${T} ${tag}.`);
        break;
      case "studied_in":
        sentences.push(`${S} is the subject of the trial record ${T} (${source}) ${tag}.`);
        break;
      case "funded_by":
        sentences.push(`Research on ${S} is funded through ${T} (${source}) ${tag}.`);
        break;
      case "mentioned_in":
        sentences.push(`${S} is mentioned in ${T}, a ${e.level === "search_hit" ? "search hit that is not yet verified" : e.level} link ${tag}.`);
        break;
      default:
        sentences.push(`${S} is linked to ${T} by ${e.type.replaceAll("_", " ")} (${e.level}) ${tag}.`);
    }
    if (e.contradicting.length) {
      const dbs = [...new Set(e.contradicting.map((c) => c.db))].join(", ");
      sentences.push(`Counter-evidence for this link is recorded in ${dbs} ${tag}.`);
    }
  }
  return sentences;
}
