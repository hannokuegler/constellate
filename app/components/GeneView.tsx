"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Edge, GeneFile, IndexEntry } from "@/lib/types";
import { loadGene, loadIndexMap } from "@/lib/data";
import { diseaseHref } from "@/lib/ids";
import { formatDate, RELATION_LABEL } from "@/lib/evidence";
import { useEdgePanel } from "./Providers";
import EgoGraph from "./EgoGraph";
import type { GraphLink, GraphNode } from "./ForceGraphClient";
import { LevelBadge } from "./Badges";
import { EvidenceButton } from "./DiseaseView";
import { Skeleton } from "./Skeleton";
import { pathwayRefs } from "@/lib/normalize";
import TextMined from "./TextMined";

/** "infantile Krabbe disease", "Krabbe disease due to saposin A deficiency" → "Krabbe disease" (display grouping only). */
export function familyName(label: string): string {
  return label
    .replace(/,?\s*(autosomal (dominant|recessive)|x-linked)?,?\s*susceptibility to$/i, "")
    .replace(/\s+due to .*$/i, "")
    .replace(/,\s*(adult|juvenile|late infantile|infantile|classic|connatal|transitional|perinatal lethal) form$/i, "")
    .replace(/^(infantile|juvenile|adult|late-infantile\/juvenile|late infantile|late-onset|early-onset|classic|atypical)\s+/i, "")
    .replace(/\s+type\s+[0-9ivx]+[a-z]?$/i, "")
    .replace(/\s+in female carriers$/i, "")
    .trim();
}

export default function GeneView({ symbol }: { symbol: string }) {
  const [file, setFile] = useState<GeneFile | null | undefined>(undefined);
  const [index, setIndex] = useState<Map<string, IndexEntry> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { openEdge, register } = useEdgePanel();
  const router = useRouter();

  useEffect(() => {
    loadGene(symbol).then(setFile, (e: Error) => setError(e.message));
    loadIndexMap().then(setIndex, () => setIndex(new Map()));
  }, [symbol]);

  const label = (id: string) => index?.get(id)?.label ?? id;

  const view = useMemo(() => {
    if (!file || !index) return null;
    const lab = (id: string) => index.get(id)?.label ?? id;
    // rolled-up edges (parent or group classes) repeat their subtypes' annotations, so they do not count as extra names
    const causal = file.diseases.filter((e) => e.type === "caused_by" && e.evidence.length && !e.rolled_up_from?.length);
    const other = file.diseases.filter((e) => !causal.includes(e));
    const families = new Map<string, Edge[]>();
    for (const e of causal) {
      const name = familyName(lab(e.source));
      const key = name.toLowerCase();
      families.set(key, [...(families.get(key) ?? []), e]);
    }
    const familyList = [...families.values()]
      .map((edges) => ({ name: familyName(lab(edges[0].source)), edges }))
      .sort((a, b) => b.edges.length - a.edges.length);
    const nodes: GraphNode[] = [{ id: file.node.id, label: file.node.id, kind: "center" }];
    const links: GraphLink[] = [];
    for (const e of file.diseases) {
      nodes.push({ id: e.source, label: lab(e.source), kind: e.type === "caused_by" ? "disease" : "neighbour" });
      links.push({ source: file.node.id, target: e.source, edge: e });
    }
    const labels: Record<string, string> = Object.fromEntries([
      [file.node.id, file.node.id],
      ...file.diseases.map((e) => [e.source, lab(e.source)]),
      ...(file.text_mined ?? []).flatMap((e) => [[e.source, lab(e.source)], [e.target, lab(e.target)]]),
    ]);
    const pathways = pathwayRefs(file);
    const pathwaysMore = pathwayRefs(file, "pathways_more");
    for (const p of [...pathways, ...pathwaysMore]) labels[p.id] = p.label;
    return { causal, other, familyList, nodes, links, labels, pathways, pathwaysMore };
  }, [file, index]);

  useEffect(() => {
    if (view && file) register([...file.diseases, ...view.pathways.map((p) => p.edge), ...view.pathwaysMore.map((p) => p.edge), ...(file.text_mined ?? [])], view.labels);
  }, [view, file, register]);

  if (error) return <p className="card mt-6 px-5 py-5" role="alert">⚠️ Gene data could not be loaded: {error}</p>;
  if (file === undefined || !index) return <Skeleton />;
  if (file === null) return (
    <div className="page-shell max-w-[800px]">
      <p className="eyebrow">Data pending</p>
      <h1 className="page-heading">{symbol}</h1>
      <p className="subtle mt-5">No detail page for this gene is included in the current dataset. This is a missing record, not evidence that no connections exist.</p>
      <Link href="/" className="button button-primary mt-6">Return to search</Link>
    </div>
  );

  const v = view!;
  const manyNames = v.familyList.length > 0;
  return (
    <div className="page-shell">
      <nav className="mb-3 text-[1rem] text-ink-2" aria-label="Breadcrumb">
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">Search</Link> / gene
      </nav>
      <p className="eyebrow">Gene connections</p>
      <h1 className="page-heading">{file.node.id}</h1>
      {file.node.full_name && <p className="mt-1 text-[17px] text-ink-2">{file.node.full_name}</p>}

      {manyNames && (
        <section className="answer-card mt-8 overflow-hidden" aria-labelledby="names-title">
          <div className="border-b border-line pb-6">
            <p className="text-[0.875rem] font-semibold uppercase tracking-wide text-accent">A shared starting point</p>
            <h2 id="names-title" className="mt-1 text-[22px] font-semibold">
              One gene, {v.familyList.length} disease {v.familyList.length === 1 ? "name" : "names"}
            </h2>
            <p className="mt-1 text-[1rem] text-ink-2">Each name below is annotated with {file.node.id} as its disease gene in curated sources. Grouping by name is for display only.</p>
          </div>
          <ul className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
            {v.familyList.map((f) => (
              <li key={f.name} className="min-w-0 border-b border-line py-6 last:border-0">
                <p className="text-[17px] font-semibold">{f.name}</p>
                <ul className="mt-2 space-y-1">
                  {f.edges.map((e) => (
                    <li key={e.id} className="flex min-h-11 flex-wrap items-center gap-3">
                      <Link href={diseaseHref(e.source)} className="flex min-h-11 min-w-0 flex-1 items-center text-[1rem] text-accent underline-offset-2 hover:underline">
                        {label(e.source)}
                      </Link>
                      <EvidenceButton edge={e} onEdge={openEdge} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="source-line mt-4">Sources: {[...new Set(v.causal.flatMap((edge) => edge.evidence.map((e) => e.db)))].join(", ") || "See the evidence for each connection"}. {(() => { const dates = v.causal.flatMap((edge) => edge.evidence.map((e) => e.retrieved ?? e.date).filter((d): d is string => Boolean(d))).sort(); return dates.length ? `Latest source date: ${formatDate(dates[dates.length - 1])}.` : "Source dates are shown with the evidence when recorded."; })()}</p>
      <details className="mt-10 border-t border-line pt-4">
        <summary className="min-h-11 cursor-pointer py-3 font-semibold text-accent">Show the evidence and pathways</summary>
      <div className="mt-6 grid grid-cols-1 gap-6">
        <EgoGraph
          nodes={v.nodes}
          links={v.links}
          height={360}
          caption={`Diseases annotated with ${file.node.id}`}
          onLinkClick={openEdge}
          onNodeClick={(n) => n.kind !== "center" && router.push(diseaseHref(n.id))}
          showCounter={false}
        />
        <div className="space-y-4">
          <section className="card px-4 py-4">
            <h2 className="text-[17px] font-semibold">All disease annotations <span className="tabular text-[1rem] font-normal text-ink-2">{file.diseases.length}</span></h2>
            <ul className="mt-2 divide-y divide-line">
              {[...v.causal, ...v.other].map((e) => (
                <li key={e.id} className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <Link href={diseaseHref(e.source)} className="flex min-h-11 min-w-0 basis-full items-center text-[1.0625rem] underline-offset-2 hover:underline sm:basis-0 sm:flex-1">
                    {label(e.source)}
                  </Link>
                  <span className="text-[0.875rem] text-ink-2">{RELATION_LABEL[e.type] ?? e.type}{e.rolled_up_from?.length ? " · via subtypes" : ""}</span>
                  <LevelBadge level={e.level} small />
                  <EvidenceButton edge={e} onEdge={openEdge} />
                </li>
              ))}
            </ul>
          </section>
          <TextMined edges={file.text_mined ?? []} labelOf={(id) => v.labels[id] ?? id} onEdge={openEdge} />
          <section className="card px-4 py-4">
            <h2 className="text-[17px] font-semibold">Pathways <span className="tabular text-[1rem] font-normal text-ink-2">{v.pathways.length}</span></h2>
            {file.pathways_note && <p className="mt-1 text-[1rem] text-ink-2">{file.pathways_note}</p>}
            {file.pathways === undefined ? (
              <p className="mt-1 text-[1rem] text-ink-2">Pathway data not loaded for this gene yet.</p>
            ) : v.pathways.length === 0 ? (
              <p className="mt-1 text-[1rem] text-ink-2">No pathway records are included for {file.node.id} in this dataset. Search date not recorded.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {v.pathways.map((p) => (
                  <li key={p.id} className="flex min-h-11 flex-wrap items-center gap-3 py-2">
                    <span className="min-w-0 flex-1 text-[1.0625rem]">{p.label}</span>
                    <span className="text-[0.875rem] text-ink-2">{p.id}</span>
                    <EvidenceButton edge={p.edge} onEdge={openEdge} />
                  </li>
                ))}
              </ul>
            )}
            {v.pathwaysMore.length > 0 && (
              <details className="mt-2">
                <summary className="min-h-11 cursor-pointer py-2 text-[1rem] font-medium text-accent">{v.pathwaysMore.length} more general pathways</summary>
                <ul className="divide-y divide-line">
                  {v.pathwaysMore.map((p) => (
                    <li key={p.id} className="flex min-h-11 flex-wrap items-center gap-3 py-2">
                      <span className="min-w-0 flex-1 text-[1rem]">{p.label}</span>
                      <EvidenceButton edge={p.edge} onEdge={openEdge} />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        </div>
      </div>
      </details>
    </div>
  );
}
