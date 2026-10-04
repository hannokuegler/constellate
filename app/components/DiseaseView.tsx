"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Core, DiseaseFile, Edge, IndexEntry, Meta, Neighbour } from "@/lib/types";
import { loadCore, loadDisease, loadIndexMap, loadMeta } from "@/lib/data";
import { diseaseHref, geneHref, hrefFor, phenotypeHref, refOf, xrefUrl } from "@/lib/ids";
import { formatConfidence, hasCounterEvidence, RELATION_LABEL } from "@/lib/evidence";
import type { PanelSection } from "@/lib/persona";
import { useEdgePanel, usePrefs } from "./Providers";
import EgoGraph from "./EgoGraph";
import type { GraphLink, GraphNode } from "./ForceGraphClient";
import { LevelBadge } from "./Badges";
import HonestGap, { coverageSearches, gapProps, type GapSearch } from "./HonestGap";
import { OrgList } from "./Orgs";
import TextMined from "./TextMined";
import OpenStudies from "./OpenStudies";
import MomentBar from "./MomentBar";
import ActionCard from "./ActionCard";
import { pickDefaultVia } from "@/lib/actioncard";
import { Skeleton } from "./Skeleton";
import { allDiseaseEdges, enrichmentItems, enrichmentTotal, nodeLabels, openTrials, orgItems, paperRecords, trialPhase } from "@/lib/normalize";

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
  return <DiseaseReady file={state.file} meta={meta} />;
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
      <p className="mb-3 text-[13px] text-ink-2">
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

/** Graph height follows the window: tall and calm on a desktop, a comfortable square-ish window on a phone. */
function useGraphHeight(): number {
  const [height, setHeight] = useState(560);
  useEffect(() => {
    const update = () => setHeight(window.innerWidth < 768 ? 400 : Math.round(Math.min(700, Math.max(540, window.innerHeight - 360))));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return height;
}

function DiseaseReady({ file, meta }: { file: DiseaseFile; meta: Meta | null }) {
  const { persona } = usePrefs();
  const graphHeight = useGraphHeight();

  const { openEdge, register } = useEdgePanel();
  const router = useRouter();
  const node = file.node;
  const cardRef = useRef<HTMLDivElement>(null);
  const defaultVia = pickDefaultVia(file.neighbours);
  const [via, setVia] = useState<string | null>(defaultVia);
  const [cardOpen, setCardOpen] = useState(false);
  const [showAllPhenotypes, setShowAllPhenotypes] = useState(false);
  const [expandFamilies, setExpandFamilies] = useState(false);

  const [indexLabels, setIndexLabels] = useState<Record<string, string>>({});
  const labels = useMemo(() => ({ ...indexLabels, ...nodeLabels(file) }), [file, indexLabels]);

  useEffect(() => {
    // text-mined edges can point at nodes this shard does not describe: take their labels from the search index
    const ids = (file.text_mined ?? []).flatMap((e) => [e.source, e.target]);
    if (!ids.length) return;
    let alive = true;
    loadIndexMap().then((index) => {
      if (alive) setIndexLabels(Object.fromEntries(ids.map((id) => [id, index.get(id)?.label ?? id])));
    }, () => undefined);
    return () => {
      alive = false;
    };
  }, [file]);

  useEffect(() => {
    register(allDiseaseEdges(file), labels);
  }, [file, labels, register]);

  const graph = useMemo(() => buildGraph(file, persona.graphPhenotypes, labels, expandFamilies), [file, persona.graphPhenotypes, labels, expandFamilies]);
  const orgs = orgItems(file);

  const openCard = useCallback((neighbourId: string) => {
    setVia(neighbourId);
    setCardOpen(true);
    requestAnimationFrame(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const omim = node.xrefs.filter((x) => /^(OMIM|ORPHA|Orphanet):/.test(x)).slice(0, 4);
  const noNeighbours = file.neighbours.length === 0;
  const coverage = coverageSearches(file.coverage);
  const gapSearched: GapSearch[] = coverage.length ? coverage : (meta?.sources ?? []).map((s) => ({ source: s.db }));

  const ownCommunity = persona.panelOrder.includes("community");
  const sections: Record<PanelSection, React.ReactNode> = {
    community: (
      <Section key="community" title="Patient organisations" hint="Groups for this diagnosis, from a hand-checked list" count={orgs.length}>
        <CommunityBlock file={file} onEdge={openEdge} builtAt={meta?.built_at} />
      </Section>
    ),
    studies: <OpenStudies key="studies" file={file} onEdge={openEdge} family />,
    neighbours: (
      <Section key="neighbours" id="related" title={persona.wording.neighbours} hint={persona.wording.neighboursHint} count={file.neighbours.length}>
        {noNeighbours ? (
          <p className="text-[15px] text-ink-2">No related disease passed the similarity threshold. See the honest gap above.</p>
        ) : (
          <ul className="divide-y divide-line">
            {file.neighbours.map((n) => (
              <NeighbourRow key={n.id} n={n} onEdge={openEdge} onCard={openCard} />
            ))}
          </ul>
        )}
      </Section>
    ),
    genes: (
      <Section key="genes" title="Genes" hint="Disease–gene annotations" count={file.genes.length}>
        {file.genes.length ? (
          <ul className="divide-y divide-line">
            {file.genes.map((e) => (
              <li key={e.id} className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <Link href={geneHref(e.target)} className="inline-flex min-h-11 min-w-11 items-center text-[15px] font-semibold text-ink underline decoration-line underline-offset-2 hover:decoration-current">
                  {e.target}
                </Link>
                <span className="text-[13px] text-ink-2">{RELATION_LABEL[e.type] ?? e.type}</span>
                {e.rolled_up_from?.length ? <span className="text-[12px] text-warn">via subtype</span> : null}
                <span className="ml-auto flex items-center gap-2">
                  <LevelBadge level={e.level} small />
                  <EvidenceButton edge={e} onEdge={openEdge} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-ink-2">No gene annotation recorded for this disease.</p>
        )}
      </Section>
    ),
    phenotypes: (
      <Section key="phenotypes" title="Key phenotypes" hint="Most specific first (information content)" count={file.phenotypes.length}>
        <ul className="divide-y divide-line">
          {(showAllPhenotypes ? file.phenotypes : file.phenotypes.slice(0, 8)).map(({ edge, phenotype }) => (
            <li key={edge.id} className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <Link href={phenotypeHref(phenotype.id)} className="flex min-h-11 min-w-0 basis-full items-center text-[15px] underline decoration-line underline-offset-2 hover:decoration-current sm:basis-0 sm:flex-1">
                {phenotype.label}
              </Link>
              <span className="tabular text-[12px] text-ink-2" title="information content">IC {phenotype.ic.toFixed(1)}</span>
              <span className="flex items-center gap-2">
                {hasCounterEvidence(edge) ? <span className="rounded-full bg-contra-soft px-2 text-[12px] font-semibold text-contra">counter-evidence</span> : <LevelBadge level={edge.level} small />}
                <EvidenceButton edge={edge} onEdge={openEdge} />
              </span>
            </li>
          ))}
        </ul>
        {file.phenotypes.length > 8 && (
          <button onClick={() => setShowAllPhenotypes((v) => !v)} className="mt-2 min-h-11 text-[13px] font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-current">
            {showAllPhenotypes ? "Show fewer" : `Show all ${file.phenotypes.length}`}
          </button>
        )}
      </Section>
    ),
    research: <ResearchSection key="research" file={file} onEdge={openEdge} gapSearched={gapSearched} withCommunity={!ownCommunity} builtAt={meta?.built_at} />,
  };

  return (
    <div className="mt-6">
      <nav className="mb-3 text-[13px] text-ink-2" aria-label="Breadcrumb">
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">Search</Link>
        {node.parents.slice(0, 2).map((p) => {
          const ref = refOf(p, labels);
          return (
            <span key={ref.id}>
              {" / "}
              <Link href={diseaseHref(ref.id)} className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">{ref.label}</Link>
            </span>
          );
        })}
      </nav>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <h1 className="t-h1 text-[28px] font-semibold leading-tight tracking-tight md:text-[40px]" style={{ fontFamily: "var(--font-display, inherit)" }}>{node.label}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
            <span className="tabular rounded-full border border-line px-2.5 py-0.5">{node.id}</span>
            {omim.map((x) => {
              const url = xrefUrl(x.replace("Orphanet:", "ORPHA:"));
              const text = x.replace("Orphanet:", "ORPHA:");
              return url ? (
                <a key={x} href={url} target="_blank" rel="noreferrer" className="-my-2 inline-flex min-h-11 items-center">
                  <span className="tabular rounded-full border border-line px-2.5 py-0.5 underline-offset-2 hover:text-ink hover:underline">{text}</span>
                </a>
              ) : (
                <span key={x} className="tabular rounded-full border border-line px-2.5 py-0.5">{text}</span>
              );
            })}
            {node.in_core && <span className="rounded-full border border-line px-2.5 py-0.5">core cluster</span>}
            {orgs.length > 0 ? (
              <a href="#patient-organisations" className="-my-2 inline-flex min-h-11 items-center">
                <span className="rounded-full border border-line px-2.5 py-0.5 font-medium text-ink hover:underline">
                  {orgs.length} patient organisation{orgs.length > 1 ? "s" : ""}
                </span>
              </a>
            ) : file.gap ? (
              <a href="#patient-organisations" className="-my-2 inline-flex min-h-11 items-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-2.5 py-0.5 hover:text-ink">
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1.6" /></svg>
                  no patient organisation · honest gap
                </span>
              </a>
            ) : null}
            {node.is_group && <span className="rounded-full border border-line px-2.5 py-0.5" title="A grouping class in MONDO, not a single diagnosis">disease group</span>}
            {node.mechanism_classes?.map((m) => (
              <span key={m.key} className="rounded-[14px] border border-line px-2.5 py-0.5" title={m.via_label ? `via ${m.via_label}` : undefined}>
                mechanism: {m.label}
              </span>
            ))}
          </div>
        </div>
        {!noNeighbours && (
          <button
            onClick={() => (cardOpen ? setCardOpen(false) : openCard(via ?? defaultVia!))}
            className="btn-primary"
            aria-expanded={cardOpen}
            aria-controls="action-card"
          >
            {cardOpen ? "Hide action card" : "Action card"}
          </button>
        )}
      </div>

      <MomentBar diseaseLabel={node.label} orgs={orgs.length} hasGap={Boolean(file.gap)} openStudies={openTrials(file).length} neighbours={file.neighbours.length} />

      {noNeighbours && (
        <div className="mt-6">
          <HonestGap
            variant="section"
            title={`No related community found for ${node.label}`}
            reason="No other disease in this slice shares a disease gene or enough specific phenotypes to pass the threshold. Here is what was checked."
            searched={gapSearched}
            asOf={meta?.built_at}
            close={[
              `More HPO phenotype annotations for ${node.label} (currently ${file.phenotypes.length} shown)`,
              file.genes.length ? "Pathway data for its genes, to compare mechanisms" : "A curated causal gene annotation",
              "A verified patient organisation entry for this diagnosis",
            ]}
          />
        </div>
      )}

      <div className={`mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]`}>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <EgoGraph
            nodes={graph.nodes}
            links={graph.links}
            height={graphHeight}
            caption={`Neighbourhood of ${node.label}`}
            onLinkClick={openEdge}
            families={graph.families}
            expanded={expandFamilies}
            onToggleFamilies={() => setExpandFamilies((v) => !v)}
            onNodeClick={(n) => {
              if (n.kind === "family") return setExpandFamilies(true);
              if (n.kind !== "center") router.push(hrefFor(n.kind === "gene" ? "gene" : n.kind === "phenotype" ? "phenotype" : "disease", n.id));
            }}
          />
        </div>
        <div className="space-y-4">
          {node.definition && (
            <section className="card px-4 py-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">Definition</h2>
              <p className="mt-1 text-[15px] leading-relaxed">{node.definition}</p>
              <p className="mt-2 text-[12px] text-ink-2">Source: MONDO disease ontology</p>
              {node.children.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {node.children.map((c) => {
                    const ref = refOf(c, labels);
                    return (
                      <Link key={ref.id} href={diseaseHref(ref.id)} className="inline-flex min-h-11 items-center rounded-full border border-line px-3 text-[13px] hover:bg-surface-2">
                        {ref.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          )}
          {persona.panelOrder.map((key) => sections[key])}
          <TextMined edges={file.text_mined ?? []} labelOf={(id) => labels[id] ?? id} onEdge={openEdge} />
        </div>
      </div>

      {!noNeighbours && cardOpen && via && (
        <div ref={cardRef} id="action-card" className="mt-8 scroll-mt-20">
          <ActionCard disease={file} viaId={via} onViaChange={setVia} meta={meta} />
        </div>
      )}
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
    <section id={id} className="card scroll-mt-20 px-4 py-4">
      <div className="mb-1 flex items-baseline gap-2">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        <span className="tabular text-[13px] text-ink-2">{count}</span>
      </div>
      <p className="mb-2 text-[13px] text-ink-2">{hint}</p>
      {children}
    </section>
  );
}

export function EvidenceButton({ edge, onEdge, label = "Evidence" }: { edge: Edge; onEdge: (e: Edge) => void; label?: string }) {
  return (
    <button
      onClick={() => onEdge(edge)}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 text-[13px] font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-current hover:bg-surface-2"
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
        <Link href={diseaseHref(n.id)} className="flex min-h-11 min-w-0 flex-1 items-center text-[15px] font-semibold underline decoration-line underline-offset-2 hover:decoration-current">
          {n.label}
        </Link>
        <span className="tabular flex items-center gap-2 text-[12px] text-ink-2" title="similarity (edge confidence)">
          <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
            <span className="absolute inset-y-0 left-0 rounded-full bg-neighbour" style={{ width: `${Math.min(100, Math.round(n.edge.confidence * 100 * 2.5))}%` }} />
          </span>
          {formatConfidence(n.edge.confidence)}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
        {genes.map((g) => (
          <Link key={g} href={geneHref(g)} className="-my-2.5 inline-flex min-h-11 items-center">
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
        <details className="mt-1 text-[13px]">
          <summary className="min-h-11 cursor-pointer py-2 text-ink-2">Why the mechanism call</summary>
          <p className="rounded-[12px] bg-surface-2 px-3 py-2 leading-relaxed">{n.mechanism_note}</p>
        </details>
      )}
      <div className="mt-1 flex flex-wrap gap-1">
        <EvidenceButton edge={n.edge} onEdge={onEdge} label="Why linked" />
        <button onClick={() => onCard(n.id)} className="inline-flex min-h-11 items-center rounded-full px-2 text-[13px] font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-current hover:bg-surface-2">
          Action card
        </button>
      </div>
    </li>
  );
}

function ResearchSection({ file, onEdge, gapSearched, withCommunity, builtAt }: { file: DiseaseFile; onEdge: (e: Edge) => void; gapSearched: GapSearch[]; withCommunity: boolean; builtAt?: string }) {
  const groups = [
    { key: "trials" as const, title: "Trials", items: enrichmentItems(file, "trials") },
    { key: "grants" as const, title: "Grants", items: enrichmentItems(file, "grants") },
    { key: "papers" as const, title: "Papers", items: enrichmentItems(file, "papers") },
  ];
  const papers = paperRecords(file);
  const total = groups.reduce((n, g) => n + g.items.length, 0) + papers.length;
  const orgCount = withCommunity ? orgItems(file).length : 0;
  const researchSearched = gapSearched.filter((g) => ["ClinicalTrials.gov", "NIH RePORTER", "Europe PMC"].includes(g.source));
  return (
    <Section title={withCommunity ? "Research and community" : "Research"} hint={withCommunity ? "Trials, grants, papers and patient organisations" : "Trials, grants and papers"} count={total + orgCount}>
      {total === 0 ? (
        <HonestGap
          variant="section"
          title="No trials, grants or papers linked"
          reason="Nothing from the enrichment step is attached to this disease yet."
          searched={researchSearched.length ? researchSearched : gapSearched}
          close={["Run the enrichment for this disease's name and synonyms (ClinicalTrials.gov, NIH RePORTER, Europe PMC)"]}
        />
      ) : (
        <div className="space-y-4">
          {groups.map((g) =>
            g.items.length ? (
              <div key={g.key}>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">
                  {g.title} <span className="tabular">({enrichmentTotal(file, g.key, g.items.length)})</span>
                </h3>
                <ul className="mt-1 divide-y divide-line">
                  {g.items.slice(0, 4).map((item) => (
                    <li key={item.edge.id} className="flex min-h-11 items-center gap-2 py-1.5">
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[13px]">{String(item.node.label)}</span>
                        <span className="text-[12px] text-ink-2">{[item.node.id, g.key === "trials" ? trialPhase(item.node) : null, typeof item.node.status === "string" ? item.node.status.toLowerCase().replaceAll("_", " ") : null].filter(Boolean).join(" · ")}</span>
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
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">
                Papers mentioning it <span className="tabular">({enrichmentTotal(file, "papers_mentioning", papers.length)})</span>
              </h3>
              <p className="text-[12px] text-ink-2">Mentions found by a literature search. A mention is not a fact and carries no evidence level.</p>
              <ul className="mt-1 divide-y divide-line">
                {papers.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex min-h-11 items-center gap-2 py-1.5">
                    <span className="min-w-0 flex-1">
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center text-[13px] text-ink underline decoration-line underline-offset-2 hover:decoration-current">{p.title ?? p.id}</a>
                      ) : (
                        <span className="line-clamp-2 text-[13px]">{p.title ?? p.id}</span>
                      )}
                      <span className="text-[12px] text-ink-2">{[p.journal, p.year, p.id].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="shrink-0 rounded-full border border-line px-2 text-[12px] text-ink-2">mention</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {withCommunity && (
        <div className="mt-4">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">Patient organisations</h3>
          <CommunityBlock file={file} onEdge={onEdge} builtAt={builtAt} />
        </div>
      )}
    </Section>
  );
}

/** Patient organisations for this diagnosis, or the honest gap with the nearest communities (from the gap block, else from the related diagnoses of the shard). */
function CommunityBlock({ file, onEdge, builtAt }: { file: DiseaseFile; onEdge: (e: Edge) => void; builtAt?: string }) {
  const nearest = [...file.neighbours]
    .sort((a, b) => b.edge.confidence - a.edge.confidence)
    .slice(0, 5)
    .map((n) => ({ id: n.id, label: n.label, via: RELATION_LABEL[n.edge.type] ?? n.edge.type.replaceAll("_", " "), confidence: n.edge.confidence, edge: n.edge, mechanismDiffers: n.mechanism_differs }));
  return (
    <div id="patient-organisations">
      {orgItems(file).length ? (
        <OrgList orgs={orgItems(file)} onEdge={onEdge} />
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
        <div className="mt-2">
          <HonestGap
            variant="section"
            title="No patient organisation linked"
            reason={
              nearest.length
                ? `The hand-checked organisation list has no entry for this exact diagnosis. ${nearest.length === 1 ? "A related diagnosis" : "Related diagnoses"} below share genes or symptoms with it, so their communities are the nearest place to ask.`
                : "The hand-checked organisation list has no entry for this diagnosis in the current data."
            }
            searched={[{ source: "Curated organisation list (hand-checked)", query: `entries for ${file.node.label}`, hits: 0, fetched_at: builtAt }]}
            asOf={builtAt}
            nearest={nearest}
            onEdge={onEdge}
            close={["A hand-verified organisation entry with URL and verification date", ...(nearest.length ? ["An entry for one of the related diagnoses that also covers this one"] : [])]}
          />
        </div>
      )}
    </div>
  );
}
