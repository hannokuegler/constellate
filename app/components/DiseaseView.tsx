"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Core, DiseaseFile, Edge, IndexEntry, Meta, Neighbour } from "@/lib/types";
import { loadCore, loadDisease, loadIndexMap, loadMeta } from "@/lib/data";
import { diseaseHref, geneHref, hrefFor, phenotypeHref, refOf, xrefUrl } from "@/lib/ids";
import { formatConfidence, formatDate, hasCounterEvidence, RELATION_LABEL } from "@/lib/evidence";
import { useEdgePanel } from "./Providers";
import EgoGraph from "./EgoGraph";
import type { GraphLink, GraphNode } from "./ForceGraphClient";
import { LevelBadge } from "./Badges";
import HonestGap, { gapProps } from "./HonestGap";
import { OrgList } from "./Orgs";
import TextMined from "./TextMined";
import OpenStudies from "./OpenStudies";
import DiseaseAnswers from "./DiseaseAnswers";
import ActionCard from "./ActionCard";
import { pickDefaultVia } from "@/lib/actioncard";
import { Skeleton } from "./Skeleton";
import { allDiseaseEdges, coverageRows, enrichmentItems, enrichmentTotal, nodeLabels, orgItems, paperRecords, trialPhase, type CoverageRow } from "@/lib/normalize";

type State =
  | { status: "loading" }
  | { status: "ready"; file: DiseaseFile }
  | { status: "missing"; entry: IndexEntry | null; core: Core | null }
  | { status: "error"; message: string };

export default function DiseaseView({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [meta, setMeta] = useState<Meta | null>(null);

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    loadMeta().then((m) => alive && setMeta(m), () => undefined);
    loadDisease(id)
      .then(async (file) => {
        if (!alive) return;
        if (file) return setState({ status: "ready", file });
        const [index, core] = await Promise.all([loadIndexMap(), loadCore().catch(() => null)]);
        if (alive) setState({ status: "missing", entry: index.get(id) ?? null, core });
      })
      .catch((error: Error) => alive && setState({ status: "error", message: error.message }));
    return () => {
      alive = false;
    };
  }, [id]);

  if (state.status === "loading") return <Skeleton />;
  if (state.status === "error")
    return (
      <div className="card mt-6 px-5 py-5" role="alert">
        <p className="font-semibold">⚠️ The data for {id} could not be loaded.</p>
        <p className="mt-1 text-[15px] text-ink-2">{state.message}</p>
      </div>
    );
  if (state.status === "missing") return <MissingDisease id={id} entry={state.entry} core={state.core} meta={meta} />;
  return <DiseaseReady key={state.file.node.id} file={state.file} meta={meta} />;
}

function MissingDisease({ id, entry, core, meta }: { id: string; entry: IndexEntry | null; core: Core | null; meta: Meta | null }) {
  const { openEdge, register } = useEdgePanel();
  const nearest = useMemo(() => {
    if (!core) return [];
    const labels = new Map(core.nodes.map((n) => [n.id, n.label]));
    return core.edges
      .filter((e) => (e.source === id || e.target === id) && labels.has(e.source === id ? e.target : e.source) && e.type !== "caused_by" && e.type !== "associated_gene")
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map((e) => {
        const other = e.source === id ? e.target : e.source;
        return { id: other, label: labels.get(other) ?? other, via: RELATION_LABEL[e.type] ?? e.type, confidence: e.confidence, edge: e as Edge };
      });
  }, [core, id]);
  useEffect(() => {
    register(nearest.map((n) => n.edge), Object.fromEntries([[id, entry?.label ?? id], ...nearest.map((n) => [n.id, n.label])]));
  }, [nearest, register, id, entry]);

  const label = entry?.label ?? id;
  return (
    <div className="mx-auto mt-8 max-w-[1100px]">
      <p className="mb-3 text-sm text-ink-2">
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">Search</Link> / {id}
      </p>
      <HonestGap
        variant="screen"
        title={entry ? `${label}: no mapped neighbourhood yet` : `${id} is not in this dataset`}
        reason={
          entry
            ? `${label} is in the search index, but Constellate has no detail file for it${meta?.fixture ? " in the development fixture" : ""}. We do not show a guess instead.`
            : "This identifier does not match any disease in the current slice (lysosomal storage diseases and their 2-hop neighbours)."
        }
        searched={(meta?.sources ?? []).map((s) => ({ source: s.db, query: s.version ? `version ${s.version}` : undefined }))}
        asOf={meta?.built_at}
        nearest={nearest}
        onEdge={openEdge}
        close={[
          "Run the pipeline for this disease so phenotype similarity and source coverage are computed",
          "More HPO phenotype annotations or a curated causal gene for this disease",
          "A verified patient organisation entry (curated list with verification date)",
        ]}
      />
    </div>
  );
}

function DiseaseReady({ file, meta }: { file: DiseaseFile; meta: Meta | null }) {
  const { openEdge, register } = useEdgePanel();
  const router = useRouter();
  const node = file.node;
  const cardRef = useRef<HTMLDivElement>(null);
  const evidenceRef = useRef<HTMLDetailsElement>(null);
  const defaultVia = pickDefaultVia(file.neighbours);
  const [via, setVia] = useState<string | null>(defaultVia);
  const [cardOpen, setCardOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [showAllNeighbours, setShowAllNeighbours] = useState(false);
  const representativeNeighbours = useMemo(() => {
    const families = new Map<string, Neighbour>();
    for (const neighbour of file.neighbours) {
      const key = familyKey(neighbour.label);
      const previous = families.get(key);
      if (!previous || neighbour.label.length < previous.label.length) families.set(key, neighbour);
    }
    return [...families.values()].slice(0, 3);
  }, [file]);
  const shownNeighbours = showAllNeighbours ? file.neighbours : representativeNeighbours;
  const [showAllPhenotypes, setShowAllPhenotypes] = useState(false);
  const [expandFamilies, setExpandFamilies] = useState(false);
  const [indexLabels, setIndexLabels] = useState<Record<string, string>>({});
  const labels = useMemo(() => ({ ...indexLabels, ...nodeLabels(file) }), [file, indexLabels]);
  useEffect(() => {
    if (!evidenceOpen) return;
    let alive = true;
    const ids = (file.text_mined ?? []).flatMap((e) => [e.source, e.target]);
    if (ids.length) loadIndexMap().then((index) => {
      if (alive) setIndexLabels(Object.fromEntries(ids.map((id) => [id, index.get(id)?.label ?? id])));
    }, () => undefined);
    return () => { alive = false; };
  }, [file, evidenceOpen]);
  useEffect(() => { register(allDiseaseEdges(file), labels); }, [file, labels, register]);
  const graph = useMemo(() => buildGraph(file, 8, labels, expandFamilies), [file, labels, expandFamilies]);
  const openCard = useCallback((neighbourId: string) => {
    setVia(neighbourId);
    setCardOpen(true);
    requestAnimationFrame(() => cardRef.current?.scrollIntoView({ behavior: "instant", block: "start" }));
  }, []);
  const coverage = coverageRows(file.coverage);
  const gapSearched: CoverageRow[] = coverage.length ? coverage : (meta?.sources ?? []).map((s) => ({ source: s.db }));
  const definitionSource = meta?.sources.find((s) => /mondo/i.test(s.db));

  return (
    <div className="page-shell min-w-0">
      <nav className="source-line mb-6" aria-label="Breadcrumb"><Link className="inline-flex min-h-11 items-center" href="/">Search diseases</Link><span aria-hidden="true"> / </span><span>{node.id}</span></nav>
      <header className="mb-8 max-w-[48rem]">
        <p className="eyebrow">Understanding a diagnosis</p>
        <h1 className="page-heading">{node.label}</h1>
        <nav aria-label="On this page" className="mt-2 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <a className="inline-flex min-h-11 items-center text-accent underline underline-offset-4" href="#treatment">Review treatment</a>
          <a className="inline-flex min-h-11 items-center text-accent underline underline-offset-4" href="#disease-evidence" onClick={(event) => {
            event.preventDefault();
            setEvidenceOpen(true);
            requestAnimationFrame(() => {
              evidenceRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
              evidenceRef.current?.querySelector("summary")?.focus({ preventScroll: true });
            });
          }}>Explore evidence</a>
        </nav>
        <p className="subtle mt-3">A place to start. Take one question at a time.</p>
      </header>
      <div className="stack">
        <section className="answer-card" aria-labelledby="definition-heading">
          <h2 id="definition-heading" className="section-heading">What this is</h2>
          <p className="mt-3 max-w-[70ch] leading-relaxed">{node.definition || "Data pending: a source definition has not been included for this diagnosis yet."}</p>
          <p className="source-line mt-3">Source: {definitionSource?.url ? <a href={definitionSource.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline">MONDO disease ontology</a> : "MONDO disease ontology"}{meta?.built_at ? ` | Dataset updated ${formatDate(meta.built_at)}` : " | Update date not recorded"}</p>
        </section>
        <DiseaseAnswers file={file} meta={meta} onEdge={openEdge} onCard={openCard} />
        <section className="answer-card" aria-labelledby="families-heading">
          <h2 id="families-heading" className="section-heading">Families like yours</h2>
          <p className="subtle mt-2">Patient organisations and communities connected to this diagnosis.</p>
          <CommunityBlock file={file} onEdge={openEdge} />
        </section>
        <OpenStudies file={file} onEdge={openEdge} />
        <section id="related" className="answer-card scroll-mt-24" aria-labelledby="related-heading">
          <h2 id="related-heading" className="section-heading">Your nearest neighbours</h2>
          <p className="subtle mt-2">Related diseases may have research or community resources to learn from. A connection does not mean a treatment will work for this diagnosis.</p>
          {file.neighbours.length ? <ul className="mt-4 divide-y divide-line">{shownNeighbours.map((n) => <NeighbourRow key={n.id} n={n} onEdge={openEdge} onCard={openCard} />)}</ul> : <HonestGap variant="section" title={`No related community found for ${node.label}`} reason="No related disease passed the current similarity threshold." searched={gapSearched} asOf={meta?.built_at} close={["More source-backed gene, pathway or phenotype annotations for this diagnosis"]} />}
          {file.neighbours.length > representativeNeighbours.length && <button className="button mt-4" onClick={() => setShowAllNeighbours((value) => !value)} aria-expanded={showAllNeighbours}>{showAllNeighbours ? "Show fewer neighbours" : `Show all neighbours (${file.neighbours.length - representativeNeighbours.length} more)`}</button>}
        </section>
        {!!file.neighbours.length && <section className="answer-card">
          <p className="eyebrow">A next step</p><h2 className="section-heading">Bring the questions with you</h2>
          <p className="subtle mt-3">An action card gathers what may carry over from a related disease, what differs, and what needs expert review.</p>
          <button className="button button-primary mt-5" onClick={() => cardOpen ? setCardOpen(false) : openCard(via ?? defaultVia!)} aria-expanded={cardOpen} aria-controls="action-card">{cardOpen ? "Hide action card" : "Action card"}</button>
        </section>}
        {cardOpen && via && <div ref={cardRef} id="action-card" className="scroll-mt-24"><ActionCard disease={file} viaId={via} onViaChange={setVia} meta={meta} /></div>}
        <details ref={evidenceRef} id="disease-evidence" open={evidenceOpen} className="answer-card scroll-mt-24" onToggle={(event) => setEvidenceOpen(event.currentTarget.open)}>
          <summary className="min-h-11 cursor-pointer py-2 text-lg font-semibold">Show the evidence</summary>
          <p className="subtle mb-6 mt-2">Explore genes, symptoms and research. Every connection opens its sources, confidence and counter-evidence.</p>
          {evidenceOpen && <div className="stack">
            <EgoGraph nodes={graph.nodes} links={graph.links} height={420} caption={`Neighbourhood of ${node.label}`} onLinkClick={openEdge} families={graph.families} expanded={expandFamilies} onToggleFamilies={() => setExpandFamilies((v) => !v)} onNodeClick={(n) => { if (n.kind === "family") return setExpandFamilies(true); if (n.kind !== "center") router.push(hrefFor(n.kind === "gene" ? "gene" : n.kind === "phenotype" ? "phenotype" : "disease", n.id)); }} />
            <Section title="Genes" hint="Source-backed disease-gene annotations" count={file.genes.length}>
              {file.genes.length ? <ul className="divide-y divide-line">{file.genes.map((edge) => <li key={edge.id} className="flex flex-wrap items-center gap-3 py-3"><Link className="inline-flex min-h-11 items-center font-semibold text-accent" href={geneHref(edge.target)}>{edge.target}</Link><span className="subtle">{RELATION_LABEL[edge.type] ?? edge.type}</span><LevelBadge level={edge.level} small /><EvidenceButton edge={edge} onEdge={openEdge} /></li>)}</ul> : <p className="subtle">No gene annotation recorded.</p>}
            </Section>
            <Section title="Key phenotypes" hint="Symptoms recorded in the source data; most specific first" count={file.phenotypes.length}>
              <ul className="divide-y divide-line">{(showAllPhenotypes ? file.phenotypes : file.phenotypes.slice(0, 8)).map(({ edge, phenotype }) => <li key={edge.id} className="flex flex-wrap items-center gap-3 py-3"><Link href={phenotypeHref(phenotype.id)} className="inline-flex min-h-11 min-w-0 items-center">{phenotype.label}</Link><span className="source-line">IC {phenotype.ic.toFixed(1)}</span><LevelBadge level={edge.level} small /><EvidenceButton edge={edge} onEdge={openEdge} /></li>)}</ul>
              {file.phenotypes.length > 8 && <button className="button mt-3" onClick={() => setShowAllPhenotypes((v) => !v)}>{showAllPhenotypes ? "Show fewer phenotypes" : `Show all ${file.phenotypes.length} phenotypes`}</button>}
            </Section>
            <ResearchSection file={file} onEdge={openEdge} gapSearched={gapSearched} withCommunity={false} />
            <TextMined edges={file.text_mined ?? []} labelOf={(id) => labels[id] ?? id} onEdge={openEdge} />
            <section><h2 className="section-heading">Disease identifiers and subtypes</h2><div className="cluster mt-3">{node.xrefs.map((xref) => { const url = xrefUrl(xref.replace("Orphanet:", "ORPHA:")); return url ? <a className="button" key={xref} href={url} target="_blank" rel="noreferrer">{xref}</a> : <span key={xref}>{xref}</span>; })}{node.children.map((child) => { const ref = refOf(child, labels); return <Link className="button" key={ref.id} href={diseaseHref(ref.id)}>{ref.label}</Link>; })}</div></section>
          </div>}
        </details>
      </div>
      <p className="source-line my-8">Research navigation, not medical advice.</p>
    </div>
  );
}

/** Family key of a disease label: "X, juvenile form" and "X due to Y deficiency" belong to X; "X 2A" and "X 4" belong to X. */
export function familyKey(label: string): string {
  return label
    .toLowerCase()
    .split(/ due to |, | type /)[0]
    .replace(/\s+\d+[a-z]?$/, "")
    .trim();
}

function buildGraph(file: DiseaseFile, phenotypeCount: number, labels: Record<string, string>, expand: boolean): { nodes: GraphNode[]; links: GraphLink[]; families: number } {
  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const center = file.node.id;
  nodes.set(center, { id: center, label: file.node.label, kind: "center" });
  for (const e of file.genes) {
    nodes.set(e.target, { id: e.target, label: e.target, kind: "gene" });
    links.push({ source: center, target: e.target, edge: e });
  }
  const positive = file.phenotypes.filter((p) => p.edge.evidence.length).slice(0, phenotypeCount);
  const contra = file.phenotypes.filter((p) => hasCounterEvidence(p.edge)).slice(0, 2);
  for (const { edge, phenotype } of [...positive, ...contra]) {
    if (nodes.has(phenotype.id)) continue;
    nodes.set(phenotype.id, { id: phenotype.id, label: phenotype.label, kind: "phenotype" });
    links.push({ source: center, target: phenotype.id, edge });
  }

  // neighbours of one disease family (e.g. the many MLD subtypes) collapse into one family node; mechanism counter-examples stay single
  const byFamily = new Map<string, Neighbour[]>();
  for (const n of file.neighbours) {
    const key = familyKey(n.label);
    byFamily.set(key, [...(byFamily.get(key) ?? []), n]);
  }
  const groupable = new Map([...byFamily].filter(([, m]) => m.length >= 2 && !m.some((x) => x.mechanism_differs)));
  const bundled = expand ? new Map<string, Neighbour[]>() : groupable;

  const addSecondHop = (id: string, members: Neighbour[], edge: Edge) => {
    const seen = new Set<string>();
    for (const n of members) {
      for (const g of n.shared_genes.map((x) => refOf(x).id)) {
        if (nodes.has(g) && !seen.has(g)) {
          seen.add(g);
          links.push({ source: id, target: g, edge, secondHop: true });
        }
      }
      for (const p of n.shared_phenotypes) {
        if (nodes.has(p.id) && !seen.has(p.id)) {
          seen.add(p.id);
          links.push({ source: id, target: p.id, edge, secondHop: true });
        }
      }
    }
  };

  for (const [key, members] of bundled) {
    const strongest = [...members].sort((a, b) => b.edge.confidence - a.edge.confidence)[0];
    const id = `family:${key}`;
    const name = members.find((m) => m.label.toLowerCase() === key)?.label ?? key;
    nodes.set(id, { id, label: name, kind: "family", members: members.length });
    links.push({ source: center, target: id, edge: strongest.edge });
    addSecondHop(id, members, strongest.edge);
  }
  for (const n of file.neighbours) {
    if (bundled.has(familyKey(n.label))) continue;
    nodes.set(n.id, { id: n.id, label: n.label, kind: n.mechanism_differs ? "counter" : "neighbour" });
    links.push({ source: center, target: n.id, edge: n.edge, counter: n.mechanism_differs === true });
    // second hop: the neighbour's shared genes and phenotypes that are on screen
    addSecondHop(n.id, [n], n.edge);
  }
  // AI-extracted literature links: drawn dashed (level text_mined), at most 8 so they do not crowd the curated picture
  for (const e of (file.text_mined ?? []).slice(0, 8)) {
    const other = e.source === center ? e.target : e.target === center ? e.source : null;
    if (!other) continue;
    if (!nodes.has(other)) {
      const kind = other.startsWith("HP:") ? "phenotype" : other.startsWith("MONDO:") ? "neighbour" : "gene";
      nodes.set(other, { id: other, label: labels[other] ?? other, kind });
    }
    links.push({ source: e.source, target: e.target, edge: e });
  }
  return { nodes: [...nodes.values()], links, families: groupable.size };
}

function Section({ id, title, hint, count, children }: { id?: string; title: string; hint: string; count: number; children: React.ReactNode }) {
  return (
    <section id={id} className="min-w-0 scroll-mt-20 rounded-2xl border border-line p-4">
      <div className="mb-1 flex items-baseline gap-2">
        <h2 className="section-heading">{title}</h2>
        <span className="tabular text-sm text-ink-2">{count}</span>
      </div>
      <p className="mb-2 text-sm text-ink-2">{hint}</p>
      {children}
    </section>
  );
}

export function EvidenceButton({ edge, onEdge, label = "Evidence" }: { edge: Edge; onEdge: (e: Edge) => void; label?: string }) {
  return (
    <button
      onClick={() => onEdge(edge)}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 text-sm font-medium text-accent hover:bg-accent-soft"
      aria-label={`${label}: ${edge.type.replaceAll("_", " ")} ${edge.source} to ${edge.target}`}
    >
      {label}
    </button>
  );
}

function NeighbourRow({ n, onEdge, onCard }: { n: Neighbour; onEdge: (e: Edge) => void; onCard: (id: string) => void }) {
  const genes = n.shared_genes.map((g) => refOf(g).id);
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link href={diseaseHref(n.id)} className="flex min-h-11 min-w-0 basis-full items-center text-base font-semibold underline-offset-2 hover:underline">
          {n.label}
        </Link>
        <span className="tabular flex items-center gap-2 text-sm text-ink-2" title="similarity (edge confidence)">
          <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
            <span className="absolute inset-y-0 left-0 rounded-full bg-neighbour" style={{ width: `${Math.min(100, Math.round(n.edge.confidence * 100 * 2.5))}%` }} />
          </span>
          {formatConfidence(n.edge.confidence)}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
        {genes.map((g) => (
          <Link key={g} href={geneHref(g)} className="inline-flex min-h-11 items-center">
            <span className="rounded-full bg-[color-mix(in_srgb,var(--n-gene)_14%,transparent)] px-2 py-0.5 font-semibold text-[color-mix(in_srgb,var(--n-gene)_60%,var(--ink))]">shares {g}</span>
          </Link>
        ))}
        {n.mechanism_differs === true && (
          <span className="rounded-full bg-warn-soft px-2 py-0.5 font-semibold text-warn" title="No shared disease gene and no shared Reactome pathway">
            mechanism differs
          </span>
        )}
        {n.mechanism_differs === null && <span className="rounded-full border border-line px-2 py-0.5 text-ink-2" title="Pathway data missing for at least one gene">mechanism not compared</span>}
        {n.shared_phenotypes.length > 0 && (
          <span className="text-ink-2">
            {n.shared_phenotypes.length}+ shared phenotypes, e.g. {n.shared_phenotypes[0].label.toLowerCase()}
          </span>
        )}
      </div>
      {n.mechanism_note && (
        <details className="mt-1 text-sm">
          <summary className="min-h-11 cursor-pointer py-2 text-ink-2">Why the mechanism call</summary>
          <p className="rounded-[12px] bg-surface-2 px-3 py-2 leading-relaxed">{n.mechanism_note}</p>
        </details>
      )}
      <div className="mt-2 flex flex-wrap gap-3">
        <EvidenceButton edge={n.edge} onEdge={onEdge} label="Why linked" />
        <button onClick={() => onCard(n.id)} className="inline-flex min-h-11 items-center rounded-full px-2 text-sm font-medium text-accent hover:bg-accent-soft">
          Action card
        </button>
      </div>
    </li>
  );
}

function ResearchSection({ file, onEdge, gapSearched, withCommunity }: { file: DiseaseFile; onEdge: (e: Edge) => void; gapSearched: CoverageRow[]; withCommunity: boolean }) {
  const groups = [
    { key: "trials" as const, title: "Trials", items: enrichmentItems(file, "trials") },
    { key: "grants" as const, title: "Grants", items: enrichmentItems(file, "grants") },
    { key: "papers" as const, title: "Papers", items: enrichmentItems(file, "papers") },
  ];
  const papers = paperRecords(file);
  const total = groups.reduce((n, g) => n + g.items.length, 0) + papers.length;
  const orgCount = withCommunity ? orgItems(file).length : 0;
  return (
    <Section title={withCommunity ? "Research and community" : "Research"} hint={withCommunity ? "Trials, grants, papers and patient organisations" : "Trials, grants and papers"} count={total + orgCount}>
      {total === 0 ? (
        <HonestGap
          variant="section"
          title="No trials, grants or papers linked"
          reason="Nothing from the enrichment step is attached to this disease yet."
          searched={gapSearched}
          close={["Run the enrichment for this disease's name and synonyms (ClinicalTrials.gov, NIH RePORTER, Europe PMC)"]}
        />
      ) : (
        <div className="space-y-4">
          {groups.map((g) =>
            g.items.length ? (
              <div key={g.key}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-2">
                  {g.title} <span className="tabular">({enrichmentTotal(file, g.key, g.items.length)})</span>
                </h3>
                <ul className="mt-1 divide-y divide-line">
                  {g.items.slice(0, 4).map((item) => (
                    <li key={item.edge.id} className="flex min-h-11 items-center gap-2 py-1.5">
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm">{String(item.node.label)}</span>
                        <span className="text-sm text-ink-2">{[item.node.id, g.key === "trials" ? trialPhase(item.node) : null, typeof item.node.status === "string" ? item.node.status.toLowerCase().replaceAll("_", " ") : null].filter(Boolean).join(" · ")}</span>
                      </span>
                      <LevelBadge level={item.edge.level} small />
                      <EvidenceButton edge={item.edge} onEdge={onEdge} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
          {papers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-2">
                Papers mentioning it <span className="tabular">({enrichmentTotal(file, "papers_mentioning", papers.length)})</span>
              </h3>
              <p className="text-sm text-ink-2">Mentions found by a literature search. A mention is not a fact and carries no evidence level.</p>
              <ul className="mt-1 divide-y divide-line">
                {papers.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex min-h-11 items-center gap-2 py-1.5">
                    <span className="min-w-0 flex-1">
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center text-sm text-accent underline-offset-2 hover:underline">{p.title ?? p.id}</a>
                      ) : (
                        <span className="line-clamp-2 text-sm">{p.title ?? p.id}</span>
                      )}
                      <span className="text-sm text-ink-2">{[p.journal, p.year, p.id].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="shrink-0 rounded-full border border-line px-2 text-sm text-ink-2">mention</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {withCommunity && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-2">Patient organisations</h3>
          <CommunityBlock file={file} onEdge={onEdge} />
        </div>
      )}
    </Section>
  );
}

/** Patient organisations for this diagnosis, or the honest gap with the nearest communities. */
function CommunityBlock({ file, onEdge }: { file: DiseaseFile; onEdge: (e: Edge) => void }) {
  return (
    <div id="patient-organisations">
      {orgItems(file).filter(({ org }) => !org.draft_input).length ? (
        <><OrgList orgs={orgItems(file).filter(({ org }) => !org.draft_input)} onEdge={onEdge} /><div className="cluster mt-3">{orgItems(file).filter(({ org }) => !org.draft_input && org.url).map(({ org }) => <a key={org.id} href={org.url!} target="_blank" rel="noreferrer" className="button">Visit {org.label}</a>)}</div></>
      ) : file.gap ? (
        <div className="mt-2">
          <HonestGap
            variant="section"
            title={`No patient organisation for ${file.node.label} in the curated list`}
            reason="Nearest communities are ranked by mechanism before symptoms: same disease family, shared causal gene, shared pathway, then phenotype similarity."
            {...gapProps(file.gap)}
          />
        </div>
      ) : (
        <p className="subtle mt-3"><strong>Data pending.</strong> A verified organisation entry or a completed search record is not available for this diagnosis yet.</p>
      )}
    </div>
  );
}
