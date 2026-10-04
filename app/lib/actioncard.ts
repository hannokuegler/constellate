// Action Card = template sentences built only from edges. Every sentence carries the edge ids it rests on.
import type { DiseaseFile, Edge, GeneFile, Neighbour } from "./types";
import { refOf } from "./ids";
import { enrichmentItems, flag, nodeLabels, orgItems, paperRecords, pathwayRefs, trialPhase, v2Therapies } from "./normalize";
import { RELATION_LABEL, formatConfidence, formatDate } from "./evidence";
import { humanizeRank, phaseText } from "./present";
import { plainDate, therapyState } from "./nextSteps";

export interface CardSentence {
  text: string;
  edgeIds: string[];
  /** formula and ranks behind a computed link: shown folded under "How this link is computed", never in the plain sentence */
  technical?: string;
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

/** Said next to every study of the neighbour: it belongs to the neighbour, fit is for experts to judge. */
export const studyCaveat = (neighbour: string, disease: string) =>
  `This study is for ${neighbour}; whether its design fits ${disease} is a question for clinical experts`;

/** Said next to every approved therapy of the neighbour: approval does not travel. */
export const therapyCaveat = (neighbour: string, disease: string) =>
  `Approved for ${neighbour}, not for ${disease}. What carries over and what differs needs expert review`;

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
  const reviewFromNote: CardSentence[] = [];
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
    const phase = phaseText(trial.node, trialPhase(trial.node));
    // a trial of the neighbour is never evidence that anything works for this disease: say so in the same sentence
    transfers.push({
      text: `${N} has the trial record ${trial.node.id}, “${trial.node.label}” (${phase ? `${phase}, ` : ""}${status}), whose design can be inspected. ${studyCaveat(N, D)}`,
      edgeIds: cite(trial.edge),
    });
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
    // The pipeline writes ONE note for the pair, and it mixes what the two diseases share with where they part ways.
    // Sort each sentence to its column (the data stays as it is): sharing -> transfers, differences -> differs, gaps and caveats -> review.
    // The generic "shared gene" and "shared pathway" sentences are skipped when the card already states them from the gene and pathway edges above.
    const sharesClass = /^same curated mechanism class/i;
    const sharesGene = /^shared causal gene/i;
    const sharesPathway = /^reactome: shared/i;
    const caveat = /data gap|cannot be judged|without expert review|no curated mechanism class|no pathway annotated/i;
    const sentences = note
      .split(/(?<=\.)\s+(?=[A-Z])/)
      .map((sentence) => sentence.replace(/\.$/, "").replace(/\(via MONDO:\d+ /g, "(via ").replace(/\bvia MONDO:\d+ /g, "via "))
      .filter(Boolean)
      .slice(0, 6);
    for (const sentence of sentences) {
      const ids = cite(similarity);
      if (sharesGene.test(sentence)) {
        if (!sharedGenes.length) transfers.push({ text: sentence, edgeIds: ids });
      } else if (sharesPathway.test(sentence)) {
        if (!sharedPathways.size) transfers.push({ text: sentence, edgeIds: ids });
      } else if (sharesClass.test(sentence)) transfers.push({ text: sentence, edgeIds: ids });
      else if (caveat.test(sentence)) reviewFromNote.push({ text: sentence, edgeIds: ids });
      else differs.push({ text: sentence, edgeIds: ids });
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
    review.push({
      text: `The two diseases were linked by computing how similar their symptom profiles are; experts should check this`,
      technical: `Computed, not observed: ${humanizeRank(similarity.formula ?? similarity.evidence[0]?.snippet ?? "formula not recorded", labels[similarity.source] ?? D, labels[similarity.target] ?? N)}`,
      edgeIds: cite(similarity),
    });
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
  // approved therapies of the neighbour: named with their record, and never as if they applied to this disease
  const ownTherapies = new Set(v2Therapies(disease).items.map((t) => t.node.id));
  const theirTherapies = (neighbourFile ? v2Therapies(neighbourFile).items : []).filter((t) => !ownTherapies.has(t.node.id));
  if (theirTherapies.length) {
    const names = [...new Set(theirTherapies.map((t) => t.node.label))];
    review.push({ text: `${N} has approved therapies in EMA or FDA records (${list(names)}). ${therapyCaveat(N, D)}`, edgeIds: cite(...theirTherapies.map((t) => t.edge)) });
  }
  review.push(...reviewFromNote);
  review.push({ text: `Whether endpoints, registries or study designs from ${N} fit ${D} is a question for clinical experts in both diseases`, edgeIds: cite(similarity) });

  return {
    from: { id: disease.node.id, label: D },
    via: { id: neighbour.id, label: N },
    sections: [
      { key: "transfers", title: "What transfers", hint: `Shared biology and existing work, not a treatment for ${D}`, sentences: transfers },
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
export function actionCardMarkdown(card: ActionCardModel, builtAt?: string, glance: GlanceLine[] = []): string {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    `# Proposal: what ${card.from.label} can learn from ${card.via.label}`,
    "",
    `Generated by Constellate on ${today}${builtAt ? ` from data built ${formatDate(builtAt)}` : ""}. Every sentence cites the evidence edges it rests on. This is a research-navigation draft, not medical advice.`,
    "",
  ];
  if (glance.length) {
    lines.push("## At a glance", "");
    for (const g of glance) {
      const sources = g.sources.map((s) => (s.href ? `${s.label} (${s.href})` : s.label)).join("; ");
      lines.push(`- ${g.text}${sources ? ` Source: ${sources}.` : ""} ${g.edgeIds.map((id) => `[${id}]`).join(" ")}`.trimEnd());
    }
    lines.push("");
  }
  for (const section of card.sections) {
    lines.push(`## ${section.title}`, "");
    if (!section.sentences.length) lines.push("_No supported statement in the graph._", "");
    for (const s of section.sentences) lines.push(`- ${s.text}${s.technical ? ` (${s.technical})` : ""} ${s.edgeIds.map((id) => `[${id}]`).join(" ")}.`);
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

// ---------------------------------------------------------------------------------------------------
// "At a glance": the two or three plain lines a parent reads first, each with its source

export interface GlanceLine {
  key: "own" | "neighbour" | "purpose";
  text: string;
  sources: { label: string; href: string | null }[];
  edgeIds: string[];
}


/** Approval status of the disease, the neighbour's approvals (named as the neighbour's), and what the card is for. */
export function buildGlance(disease: DiseaseFile, neighbourFile: DiseaseFile | null, neighbourLabel: string, builtAt?: string | null): GlanceLine[] {
  const D = disease.node.label;
  const N = neighbourLabel;
  const lines: GlanceLine[] = [];
  const own = therapyState(disease);
  if (own.kind === "none") {
    lines.push({
      key: "own",
      text: `No approved medicine for ${D} found in ${own.authorities} records${own.asOf ? ` as of ${own.asOf}` : ""}.`,
      sources: own.sources.length ? [{ label: `searched ${own.sources.join("; ")}`, href: null }] : [],
      edgeIds: [],
    });
  } else if (own.kind === "approved") {
    const named = own.items.slice(0, 3).map((t) => `${t.name}${t.authority || t.date ? ` (${[t.authority, t.date].filter(Boolean).join(", ")})` : ""}`);
    lines.push({
      key: "own",
      text: `${D} has ${own.items.length === 1 ? "an approved medicine" : "approved medicines"} in EMA or FDA records: ${list(named)}${own.items.length > 3 ? ` and ${own.items.length - 3} more` : ""}. Whether it fits is for your specialist to decide.`,
      sources: own.items.slice(0, 3).map((t) => ({ label: [t.authority, t.record].filter(Boolean).join(" ") || t.name, href: t.href })),
      edgeIds: own.items.slice(0, 3).map((t) => t.edge.id),
    });
  } else {
    lines.push({
      key: "own",
      text: `The EMA and FDA medicine records have not been searched for ${D} yet, so this card cannot say whether a medicine is approved.`,
      sources: [{ label: "no search recorded in the data", href: null }],
      edgeIds: [],
    });
  }
  const theirs = neighbourFile ? therapyState(neighbourFile) : null;
  if (theirs?.kind === "approved") {
    const ownIds = new Set(own.kind === "approved" ? own.items.map((t) => t.key) : []);
    const items = theirs.items.filter((t) => !ownIds.has(t.key)).slice(0, 3);
    if (items.length) {
      const named = items.map((t) => `${t.name}${t.authority || t.date ? ` (${[t.authority, t.date].filter(Boolean).join(", ")})` : ""}`);
      lines.push({
        key: "neighbour",
        text: `${N[0].toUpperCase()}${N.slice(1)} has ${list(named)}, approved for ${N}, not for ${D}.`,
        sources: items.map((t) => ({ label: [t.authority, t.record].filter(Boolean).join(" ") || t.name, href: t.href })),
        edgeIds: items.map((t) => t.edge.id),
      });
    }
  }
  const built = plainDate(builtAt ?? null);
  lines.push({
    key: "purpose",
    text: "This card lists what the two diseases share and where they differ, for a conversation with your specialist.",
    sources: [{ label: `Constellate graph edges${built ? `, data built ${built}` : ""}`, href: "/methods" }],
    edgeIds: [],
  });
  return lines;
}
