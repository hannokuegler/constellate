// Tolerant readers: the fixture and the pipeline differ in a few optional shapes. Views only use these helpers.
import type { Coverage, DiseaseFile, Edge, EnrichmentItem, GeneFile, Meta, PaperRecord, PhenotypeFile } from "./types";

export function nodeLabels(file: DiseaseFile): Record<string, string> {
  const labels: Record<string, string> = { [file.node.id]: file.node.label, ...file.node.parents_labels, ...file.node.children_labels };
  for (const ref of [...file.node.parents, ...file.node.children]) if (typeof ref !== "string") labels[ref.id] = ref.label;
  for (const p of file.phenotypes) labels[p.phenotype.id] = p.phenotype.label;
  for (const n of file.neighbours) labels[n.id] = n.label;
  for (const kind of ["trials", "grants", "papers", "targets"] as const)
    for (const item of enrichmentItems(file, kind)) labels[item.node.id] = String(item.node.label ?? item.node.id);
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
