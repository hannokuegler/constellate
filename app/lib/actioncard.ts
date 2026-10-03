// Action Card = template sentences built only from edges. Every sentence carries the edge ids it rests on.
import type { DiseaseFile, Edge, GeneFile, Neighbour } from "./types";
import { refOf } from "./ids";
import { enrichmentItems, flag, nodeLabels, orgItems, paperRecords, pathwayRefs, trialPhase } from "./normalize";
import { RELATION_LABEL, formatConfidence, formatDate } from "./evidence";

export interface CardSentence {
  text: string;
  edgeIds: string[];
}

export interface CardSection {
  key: "transfers" | "differs" | "review";
  title: string;
  hint: string;
  sentences: CardSentence[];
}

export interface ActionCardModel {
  from: { id: string; label: string };
  via: { id: string; label: string };
  sections: CardSection[];
  edges: Map<string, Edge>;
  labels: Record<string, string>;
}

interface CardInput {
  disease: DiseaseFile;
  neighbour: Neighbour;
  neighbourFile: DiseaseFile | null;
  geneFiles: GeneFile[];
}

const list = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export function buildActionCard({ disease, neighbour, neighbourFile, geneFiles }: CardInput): ActionCardModel {
  const D = disease.node.label;
  const N = neighbour.label;
  const edges = new Map<string, Edge>();
  const labels: Record<string, string> = { [disease.node.id]: D, [neighbour.id]: N };
  const cite = (...list: (Edge | undefined)[]) =>
    list.filter((e): e is Edge => Boolean(e)).map((e) => {
      edges.set(e.id, e);
      return e.id;
    });

  const transfers: CardSentence[] = [];
  const differs: CardSentence[] = [];
  const review: CardSentence[] = [];
  const similarity = neighbour.edge;

  // --- what transfers ------------------------------------------------------------------------------
  const sharedGenes = neighbour.shared_genes.map((g) => refOf(g).id);
  for (const gene of sharedGenes) {
    const ownEdge = disease.genes.find((e) => e.target === gene);
    const theirEdge = neighbourFile?.genes.find((e) => e.target === gene);
    const ids = cite(ownEdge, theirEdge);
    if (ids.length) transfers.push({ text: `${D} and ${N} are both annotated with the disease gene ${gene}`, edgeIds: ids });
  }

  const geneBySymbol = new Map(geneFiles.map((g) => [g.node.id, g]));
  const ownGenes = disease.genes.filter((e) => e.evidence.length).map((e) => e.target);
  const theirGenes = (neighbourFile?.genes ?? []).filter((e) => e.evidence.length).map((e) => e.target);
  const sharedPathways = new Map<string, { label: string; edges: Edge[] }>();
  const pathwayLabels: Record<string, string> = {};
  for (const own of ownGenes) {
    for (const theirs of theirGenes) {
      if (own === theirs) continue; // a gene shared by both is already stated above; its pathways add nothing
      const ownGene = geneBySymbol.get(own);
      const theirGene = geneBySymbol.get(theirs);
      const a = ownGene ? pathwayRefs(ownGene) : [];
      const b = theirGene ? pathwayRefs(theirGene) : [];
      for (const pathway of a) {
        pathwayLabels[pathway.id] = pathway.label;
        const match = b.find((p) => p.id === pathway.id);
        if (!match) continue;
        const entry = sharedPathways.get(pathway.id) ?? { label: pathway.label, edges: [] };
        for (const e of [pathway.edge, match.edge]) if (!entry.edges.some((x) => x.id === e.id)) entry.edges.push(e);
        sharedPathways.set(pathway.id, entry);
      }
    }
  }
  for (const [, pathway] of [...sharedPathways].slice(0, 2)) {
    const genes = [...new Set(pathway.edges.map((e) => e.source))];
    transfers.push({ text: `The genes ${list(genes)} take part in the same Reactome pathway, “${pathway.label}”`, edgeIds: cite(...pathway.edges) });
  }

  if (neighbour.shared_phenotypes.length) {
    const names = neighbour.shared_phenotypes.slice(0, 3).map((p) => p.label.toLowerCase());
    transfers.push({
      text: `Their phenotype profiles overlap, including ${list(names)} (similarity ${formatConfidence(similarity.confidence)}, computed)`,
      edgeIds: cite(similarity),
    });
  }

  const trials = neighbourFile ? enrichmentItems(neighbourFile, "trials") : [];
  for (const trial of trials.slice(0, 2)) {
    const status = typeof trial.node.status === "string" ? trial.node.status.toLowerCase().replaceAll("_", " ") : "status not recorded";
    const phase = trialPhase(trial.node);
    transfers.push({ text: `${N} has the trial record ${trial.node.id}, “${trial.node.label}” (${phase ? `${phase}, ` : ""}${status}), whose design can be inspected`, edgeIds: cite(trial.edge) });
  }
  for (const { org, edge } of (neighbourFile ? orgItems(neighbourFile) : []).slice(0, 2)) {
    const assets = [flag(org.has_registry) && "a patient registry", flag(org.has_natural_history_study) && "a natural history study", flag(org.has_biobank) && "a biobank"].filter(Boolean) as string[];
    transfers.push({
      text: `${org.label}${org.country ? ` (${org.country})` : ""} is a patient organisation for ${N}${assets.length ? ` and lists ${list(assets)}` : ""}${org.draft_input ? " (unverified draft entry)" : ""}`,
      edgeIds: cite(edge),
    });
  }
  const grants = neighbourFile ? enrichmentItems(neighbourFile, "grants") : [];
  if (grants[0]) {
    const org = typeof grants[0].node.organization === "string" ? ` at ${grants[0].node.organization}` : "";
    transfers.push({ text: `Research on ${N} is funded through NIH project ${grants[0].node.id}${org}`, edgeIds: cite(grants[0].edge) });
  }

  // --- what differs ----------------------------------------------------------------------------------
  for (const e of disease.genes.filter((g) => !sharedGenes.includes(g.target) && g.type === "caused_by" && g.evidence.length).slice(0, 2)) {
    differs.push({ text: `${D} is annotated with ${e.target}, which is not a shared gene with ${N}`, edgeIds: cite(e) });
  }
  for (const e of (neighbourFile?.genes ?? []).filter((g) => !sharedGenes.includes(g.target) && g.type === "caused_by" && g.evidence.length).slice(0, 2)) {
    differs.push({ text: `${N} is annotated with ${e.target}, which is not a shared gene with ${D}`, edgeIds: cite(e) });
  }
  const note = neighbour.mechanism_note?.trim();
  if (note) {
    // the pipeline's own explanation of the mechanism call, sentence by sentence, each resting on the link edge
    for (const sentence of note.split(/(?<=\.)\s+(?=[A-Z])/).map((s) => s.replace(/\.$/, "")).filter(Boolean).slice(0, 6)) {
      differs.push({ text: sentence, edgeIds: cite(similarity) });
    }
  } else if (neighbour.mechanism_differs === true) {
    differs.push({
      text: `Constellate found no shared disease gene and no shared Reactome pathway for this pair, so similar symptoms may have a different cause`,
      edgeIds: cite(similarity),
    });
  } else if (neighbour.mechanism_differs === null) {
    differs.push({ text: `The mechanism comparison is open, because pathway data is missing for at least one disease gene`, edgeIds: cite(similarity) });
  }
  const sharedIds = new Set(neighbour.shared_phenotypes.map((p) => p.id));
  const distinct = disease.phenotypes.filter((p) => !sharedIds.has(p.phenotype.id) && p.edge.evidence.length).slice(0, 2);
  for (const p of distinct) {
    differs.push({ text: `${p.phenotype.label} is annotated for ${D} but is not among the shared phenotypes`, edgeIds: cite(p.edge) });
  }
  for (const p of disease.phenotypes.filter((x) => x.edge.contradicting.length).slice(0, 2)) {
    const dbs = [...new Set(p.edge.contradicting.map((c) => c.db))].join(", ");
    differs.push({ text: `For ${D}, ${p.phenotype.label.toLowerCase()} has counter-evidence recorded in ${dbs}`, edgeIds: cite(p.edge) });
  }

  // --- needs expert review ---------------------------------------------------------------------------
  if (similarity.level === "inferred") {
    review.push({ text: `The link between ${D} and ${N} is computed, not observed: ${similarity.formula ?? similarity.evidence[0]?.snippet ?? "formula not recorded"}`, edgeIds: cite(similarity) });
  }
  for (const e of [...disease.genes, ...(neighbourFile?.genes ?? [])].filter((g) => g.rolled_up_from?.length).slice(0, 2)) {
    const owner = e.source === disease.node.id ? D : N;
    const via = e.rolled_up_from!.map((id) => refOf(id, labelsFrom(disease, neighbourFile)).label);
    review.push({ text: `${e.target} is attached to ${owner} through the subtype ${list(via)}, so check which forms an asset applies to`, edgeIds: cite(e) });
  }
  const papers = neighbourFile ? enrichmentItems(neighbourFile, "papers") : [];
  if (papers[0]) {
    review.push({ text: `Literature links for ${N} are ${papers[0].edge.level === "search_hit" ? "search hits" : papers[0].edge.level} and need reading before they support a claim`, edgeIds: cite(papers[0].edge) });
  } else if (neighbourFile && paperRecords(neighbourFile).length && trials[0]) {
    review.push({ text: `Papers found for ${N} are literature search matches, not extracted claims, so they need reading before they support a statement`, edgeIds: cite(trials[0].edge) });
  }
  review.push({ text: `Whether endpoints, registries or study designs from ${N} fit ${D} is a question for clinical experts in both diseases`, edgeIds: cite(similarity) });

  return {
    from: { id: disease.node.id, label: D },
    via: { id: neighbour.id, label: N },
    sections: [
      { key: "transfers", title: "What transfers", hint: "Shared biology and existing assets", sentences: transfers },
      { key: "differs", title: "What differs", hint: "Where the two diseases part ways", sentences: differs },
      { key: "review", title: "Needs expert review", hint: "Computed links and open questions", sentences: review },
    ],
    edges,
    labels: { ...labels, ...pathwayLabels, ...orgLabels(neighbourFile), ...labelsFrom(disease, neighbourFile) },
  };
}

function orgLabels(file: DiseaseFile | null): Record<string, string> {
  return Object.fromEntries((file ? orgItems(file) : []).map(({ org }) => [org.id, org.label]));
}

function labelsFrom(disease: DiseaseFile, other: DiseaseFile | null): Record<string, string> {
  return { ...(other ? nodeLabels(other) : {}), ...nodeLabels(disease) };
}

const SUBTYPE_NAME = /,\s*\w+(\s\w+)? form$|\sdue to\s|^(infantile|juvenile|adult|late-infantile)/i;

/** The neighbour an action card opens with: shared gene first, then a disease name over a subtype name, then similarity. */
export function pickDefaultVia(neighbours: Neighbour[]): string | null {
  // A family root whose subtypes also show up as neighbours is a larger related community
  // (e.g. MLD with its juvenile, late-infantile and adult forms), so it outranks a single close subtype.
  const familySize = (n: Neighbour) => {
    const stem = n.label.toLowerCase();
    return neighbours.filter((m) => m.id !== n.id && m.label.toLowerCase().startsWith(stem)).length;
  };
  const ranked = [...neighbours].sort((a, b) => {
    const score = (n: Neighbour) =>
      (n.shared_genes.length ? 2 : 0) + (n.mechanism_differs === false ? 1 : 0) + (SUBTYPE_NAME.test(n.label) ? 0 : 1.5) + n.edge.confidence + Math.min(familySize(n), 5) * 0.2;
    return score(b) - score(a);
  });
  return ranked[0]?.id ?? null;
}

/** Markdown proposal for download: sentences with [e_id] plus an evidence appendix. */
export function actionCardMarkdown(card: ActionCardModel, builtAt?: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    `# Proposal: what ${card.from.label} can learn from ${card.via.label}`,
    "",
    `Generated by Constellate on ${today}${builtAt ? ` from data built ${formatDate(builtAt)}` : ""}. Every sentence cites the evidence edges it rests on. This is a research-navigation draft, not medical advice.`,
    "",
  ];
  for (const section of card.sections) {
    lines.push(`## ${section.title}`, "");
    if (!section.sentences.length) lines.push("_No supported statement in the graph._", "");
    for (const s of section.sentences) lines.push(`- ${s.text} ${s.edgeIds.map((id) => `[${id}]`).join(" ")}.`);
    lines.push("");
  }
  lines.push("## Evidence", "", "| Edge | Relation | Level | Confidence | Source | Date |", "|---|---|---|---|---|---|");
  for (const e of card.edges.values()) {
    const ev = e.evidence[0];
    const source = ev ? `${ev.db}${ev.record ? ` ${ev.record}` : ""}${ev.url ? ` (${ev.url})` : ""}` : "none";
    const relation = `${card.labels[e.source] ?? e.source} → ${RELATION_LABEL[e.type] ?? e.type} → ${card.labels[e.target] ?? e.target}`;
    lines.push(`| ${e.id} | ${relation} | ${e.level} | ${formatConfidence(e.confidence)} | ${source.replaceAll("|", "/")} | ${formatDate(ev?.date)} |`);
  }
  return lines.join("\n") + "\n";
}
