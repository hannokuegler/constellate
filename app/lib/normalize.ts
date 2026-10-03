// Tolerant readers: the fixture and the pipeline differ in a few optional shapes. Views only use these helpers.
import type { Coverage, DiseaseFile, Edge, EnrichmentItem, Flag, Gap, GeneFile, Meta, OrgCard, PaperRecord, PhenotypeFile } from "./types";

export function nodeLabels(file: DiseaseFile): Record<string, string> {
  const labels: Record<string, string> = { [file.node.id]: file.node.label, ...file.node.parents_labels, ...file.node.children_labels };
  for (const ref of [...file.node.parents, ...file.node.children]) if (typeof ref !== "string") labels[ref.id] = ref.label;
  for (const p of file.phenotypes) labels[p.phenotype.id] = p.phenotype.label;
  for (const n of file.neighbours) labels[n.id] = n.label;
  for (const kind of ["trials", "grants", "papers", "targets"] as const)
    for (const item of enrichmentItems(file, kind)) labels[item.node.id] = String(item.node.label ?? item.node.id);
  for (const { org } of orgItems(file)) labels[org.id] = org.label;
  return labels;
}

export function enrichmentItems(file: DiseaseFile, kind: "trials" | "grants" | "papers" | "targets"): EnrichmentItem[] {
  const items = file.enrichment?.[kind];
  return Array.isArray(items) ? items.filter((i) => i && i.node && i.edge) : [];
}

export function paperRecords(file: DiseaseFile): PaperRecord[] {
  const flat = file.enrichment?.papers_mentioning;
  return Array.isArray(flat) ? flat : [];
}

export function enrichmentTotal(file: DiseaseFile, kind: string, shown: number): number {
  const total = file.enrichment?.totals?.[kind];
  return typeof total === "number" ? total : shown;
}

/** Every edge a disease file carries (genes, phenotypes, neighbours, enrichment). */
export function allDiseaseEdges(file: DiseaseFile): Edge[] {
  return [
    ...file.genes,
    ...file.phenotypes.map((p) => p.edge),
    ...file.neighbours.map((n) => n.edge),
    ...(["trials", "grants", "papers", "targets"] as const).flatMap((k) => enrichmentItems(file, k).map((i) => i.edge)),
    ...orgItems(file).map((o) => o.edge),
    ...(file.text_mined ?? []),
  ];
}

export interface CoverageRow {
  source: string;
  query?: string;
  hits?: number;
  fetched_at?: string;
  note?: string | null;
}

export function coverageRows(coverage: Coverage[] | undefined): CoverageRow[] {
  return (coverage ?? []).map((c) => ({
    source: c.source,
    query: c.query,
    hits: c.hits ?? c.hits_raw,
    fetched_at: c.fetched_at ?? c.retrieved,
    note: c.note,
  }));
}

export function pathwayRefs(gene: GeneFile, which: "pathways" | "pathways_more" = "pathways"): { id: string; label: string; edge: Edge }[] {
  return (gene[which] ?? [])
    .map((p) => ({ id: p.node?.id ?? p.id ?? p.edge?.target, label: (p.node?.label ?? p.label ?? "").trim(), edge: p.edge }))
    .filter((p): p is { id: string; label: string; edge: Edge } => Boolean(p.id && p.edge));
}

/** Count lookup that works for flat (fixture) and nested (pipeline) meta.counts. */
export function metaCount(meta: Meta, kind: "diseases" | "genes" | "phenotypes" | "edges"): number | null {
  const counts = meta.counts as Record<string, unknown>;
  const flat = counts[kind];
  if (typeof flat === "number") return flat;
  const nodes = counts.nodes as Record<string, number> | undefined;
  const singular = { diseases: "disease", genes: "gene", phenotypes: "phenotype" } as const;
  if (kind !== "edges" && nodes && typeof nodes[singular[kind]] === "number") return nodes[singular[kind]];
  if (kind === "edges" && flat && typeof flat === "object") return Object.values(flat as Record<string, number>).reduce((a, b) => a + (Number(b) || 0), 0);
  return null;
}

export interface PhenotypeDisease {
  id: string;
  label?: string;
  edge: Edge;
}

export function phenotypeDiseases(file: PhenotypeFile): PhenotypeDisease[] {
  return file.diseases
    .map((d) => ("edge" in d && d.edge ? { id: d.id, label: d.label, edge: d.edge } : { id: (d as Edge).source, edge: d as Edge }))
    .filter((d) => d.edge && d.id);
}

export function trialPhase(node: Record<string, unknown>): string | null {
  if (typeof node.phase_label === "string" && node.phase_label) return node.phase_label;
  if (Array.isArray(node.phases) && node.phases.length) return node.phases.map((p) => String(p).toLowerCase().replace("phase", "phase ")).join("/");
  return null;
}

/** "yes" / "true" / true → true, "no" / false → false, empty → null */
export function flag(value: Flag): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const v = value.trim().toLowerCase();
  if (["yes", "y", "true", "1", "ja"].includes(v)) return true;
  if (["no", "n", "false", "0", "nein"].includes(v)) return false;
  return null;
}

export function orgItems(file: DiseaseFile): { org: OrgCard; edge: Edge }[] {
  return Array.isArray(file.orgs) ? file.orgs.filter((o) => o && o.org && o.edge) : [];
}

export function orgSlug(id: string): string {
  return (id.includes(":") ? id.split(":").slice(1).join(":") : id).replace(/[^A-Za-z0-9._-]/g, "_");
}

export function closingList(gap: Gap): string[] {
  const value = gap.closing_the_gap;
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

const TIER_LABEL = ["same disease family", "shared causal gene", "shared pathway", "phenotype similarity only"];
export function tierLabel(tier: number | undefined): string | null {
  return tier === undefined ? null : TIER_LABEL[tier] ?? null;
}

/** Evidence produced by a model: who made it, with which prompt. */
export function aiOrigin(ev: { db?: string; origin?: string; model?: string; level?: string }): string | null {
  if (!ev.model && ev.level !== "text_mined") return null;
  const origin = (ev.origin ?? "").toLowerCase();
  if (ev.db === "PubMed" || origin.includes("extract")) return "Extracted by OpenAI from a PubMed abstract";
  if (origin.includes("judge")) return "Matched by an OpenAI judge from the organisation website";
  return "Produced by a language model";
}

const OPEN_STATUSES = new Set(["RECRUITING", "NOT_YET_RECRUITING", "ENROLLING_BY_INVITATION", "AVAILABLE"]);

export function isOpenStatus(status: unknown): boolean {
  return typeof status === "string" && OPEN_STATUSES.has(status);
}

/** Trials of this disease that take participants now or soon: recruiting first, then by target size. */
export function openTrials(file: DiseaseFile): EnrichmentItem[] {
  const rank = (s: unknown) => (s === "RECRUITING" ? 0 : s === "ENROLLING_BY_INVITATION" ? 1 : s === "NOT_YET_RECRUITING" ? 2 : 3);
  return enrichmentItems(file, "trials")
    .filter((i) => isOpenStatus(i.node.status))
    .sort((a, b) => rank(a.node.status) - rank(b.node.status) || (Number(b.node.enrollment) || 0) - (Number(a.node.enrollment) || 0));
}

const STATUS_LABEL: Record<string, string> = {
  RECRUITING: "Recruiting now",
  NOT_YET_RECRUITING: "Opens soon",
  ENROLLING_BY_INVITATION: "By invitation",
  AVAILABLE: "Available",
};
export function trialStatusLabel(status: unknown): string {
  return typeof status === "string" ? STATUS_LABEL[status] ?? status.toLowerCase().replaceAll("_", " ") : "status unknown";
}

/** "18 Years" / "6 Months" → readable age range for families. */
export function ageRange(min?: string | null, max?: string | null): string | null {
  const clean = (v?: string | null) => (v ? v.toLowerCase().replace(/^(\d+) (\w+?)s?$/, (_, n, u) => `${n} ${u}${n === "1" ? "" : "s"}`) : null);
  const lo = clean(min);
  const hi = clean(max);
  if (lo && hi) return `${lo} to ${hi}`;
  if (lo) return `${lo} and older`;
  if (hi) return `up to ${hi}`;
  return null;
}
