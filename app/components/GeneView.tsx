"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Edge, GeneFile, IndexEntry } from "@/lib/types";
import { loadGene, loadIndexMap } from "@/lib/data";
import { diseaseHref } from "@/lib/ids";
import { RELATION_LABEL } from "@/lib/evidence";
import { useEdgePanel } from "./Providers";
import EgoGraph, { SKY_BACKGROUND, SKY_VARS } from "./EgoGraph";
import type { GraphLink, GraphNode } from "./ForceGraphClient";
import { LevelBadge } from "./Badges";
import { EvidenceButton } from "./DiseaseView";
import HonestGap from "./HonestGap";
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
  if (file === null)
    return (
      <div className="mx-auto mt-8 max-w-[1100px]">
        <HonestGap
          variant="screen"
          title={`${symbol}: no gene page in this dataset`}
          reason="This gene has no detail file. It may lie outside the current slice or have no disease annotation here."
          searched={[{ source: "HPO genes_to_phenotype" }, { source: "Orphanet product6" }]}
          close={["Extend the slice to diseases annotated with this gene", "Check the symbol spelling (HGNC approved symbol)"]}
        />
      </div>
    );

  const v = view!;
  const manyNames = v.familyList.length >= 2;
  return (
    <div className="mt-6">
      <nav className="mb-3 text-[13px] text-ink-2" aria-label="Breadcrumb">
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">Search</Link> / gene
      </nav>
      <h1 className="t-h1 text-[28px] font-semibold tracking-tight md:text-[40px]">{file.node.id}</h1>
      {file.node.full_name && <p className="mt-1 text-[17px] text-ink-2">{file.node.full_name}</p>}

      {manyNames && (
        <section className="card mt-6 overflow-hidden" aria-labelledby="names-title">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <NamesOrbit gene={file.node.id} names={v.familyList.map((f) => f.name)} />
            <div className="min-w-0 px-5 py-5 md:px-7 md:py-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">Names hide mechanisms</p>
              <h2 id="names-title" className="mt-1 text-[24px] font-semibold leading-snug md:text-[28px]" style={{ fontFamily: "var(--font-display, inherit)" }}>
                One gene, {v.familyList.length} disease names
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">Each name below is annotated with {file.node.id} as its disease gene in curated sources. Grouping by name is for display only.</p>
              <ol className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {v.familyList.map((f, i) => (
                  <li key={f.name} className="min-w-0 border-t border-line py-3">
                    <p className="flex items-start gap-2.5 text-[17px] font-semibold leading-snug">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line-strong text-[12px] font-semibold tabular-nums" aria-hidden="true">{i + 1}</span>
                      <span className="min-w-0 break-words">{f.name}</span>
                    </p>
                    <ul className="mt-1 space-y-0.5 pl-[34px]">
                      {f.edges.map((e) => (
                        <li key={e.id} className="flex flex-wrap items-center gap-x-3">
                          <Link href={diseaseHref(e.source)} className="flex min-h-11 min-w-0 basis-full items-center break-words text-[13px] underline decoration-line underline-offset-2 hover:decoration-current">
                            {label(e.source)}
                          </Link>
                          <span className="-mt-2 text-[12px] text-ink-2">
                            <span className="font-mono">{e.id}</span> · {e.evidence[0]?.db ?? "source n/a"}
                          </span>
                          <span className="-mt-2 ml-auto"><EvidenceButton edge={e} onEdge={openEdge} /></span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <EgoGraph
          nodes={v.nodes}
          links={v.links}
          height={typeof window !== "undefined" && window.innerWidth < 768 ? 340 : 480}
          caption={`Diseases annotated with ${file.node.id}`}
          onLinkClick={openEdge}
          onNodeClick={(n) => n.kind !== "center" && router.push(diseaseHref(n.id))}
          showCounter={false}
          centerShape="ring"
        />
        <div className="space-y-4">
          <section className="card px-4 py-4">
            <h2 className="text-[17px] font-semibold">All disease annotations <span className="tabular text-[13px] font-normal text-ink-2">{file.diseases.length}</span></h2>
            <ul className="mt-2 divide-y divide-line">
              {[...v.causal, ...v.other].map((e) => (
                <li key={e.id} className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <Link href={diseaseHref(e.source)} className="flex min-h-11 min-w-0 basis-full items-center text-[15px] underline decoration-line underline-offset-2 hover:decoration-current sm:basis-0 sm:flex-1">
                    {label(e.source)}
                  </Link>
                  <span className="text-[12px] text-ink-2">{RELATION_LABEL[e.type] ?? e.type}{e.rolled_up_from?.length ? " · via subtypes" : ""}</span>
                  <LevelBadge level={e.level} small />
                  <EvidenceButton edge={e} onEdge={openEdge} />
                </li>
              ))}
            </ul>
          </section>
          <TextMined edges={file.text_mined ?? []} labelOf={(id) => v.labels[id] ?? id} onEdge={openEdge} />
          <section className="card px-4 py-4">
            <h2 className="text-[17px] font-semibold">Pathways <span className="tabular text-[13px] font-normal text-ink-2">{v.pathways.length}</span></h2>
            {file.pathways_note && <p className="mt-1 text-[13px] text-ink-2">{file.pathways_note}</p>}
            {file.pathways === undefined ? (
              <p className="mt-1 text-[13px] text-ink-2">Pathway data not loaded for this gene yet.</p>
            ) : v.pathways.length === 0 ? (
              <p className="mt-1 text-[13px] text-ink-2">Reactome lists no pathway for {file.node.id} (queried, zero results).</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {v.pathways.map((p) => (
                  <li key={p.id} className="flex min-h-11 items-center gap-2 py-1">
                    <span className="min-w-0 flex-1 text-[15px]">{p.label}</span>
                    <span className="text-[12px] text-ink-2">{p.id}</span>
                    <EvidenceButton edge={p.edge} onEdge={openEdge} />
                  </li>
                ))}
              </ul>
            )}
            {v.pathwaysMore.length > 0 && (
              <details className="mt-2">
                <summary className="min-h-11 cursor-pointer py-2 text-[13px] font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-current">{v.pathwaysMore.length} more general pathways</summary>
                <ul className="divide-y divide-line">
                  {v.pathwaysMore.map((p) => (
                    <li key={p.id} className="flex min-h-11 items-center gap-2 py-1">
                      <span className="min-w-0 flex-1 text-[13px]">{p.label}</span>
                      <EvidenceButton edge={p.edge} onEdge={openEdge} />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/** The gene as a ring in the middle of the sky, its disease names as points around it (numbers match the list). */
function NamesOrbit({ gene, names }: { gene: string; names: string[] }) {
  const cx = 150;
  const cy = 150;
  const radius = 98;
  const points = names.map((name, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / names.length;
    return { name, n: i + 1, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
  return (
    <div className="grid place-items-center border-b border-line p-4 md:border-b-0 md:border-r" style={{ ...SKY_VARS, background: SKY_BACKGROUND }}>
      <svg viewBox="0 0 300 300" className="h-auto w-full max-w-[300px]" role="img" aria-label={`${gene} in the middle, ${names.length} disease names around it: ${names.join(", ")}`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray="2 5" strokeLinecap="round" />
        {points.map((p) => (
          <line key={p.n} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--star-dim)" strokeWidth="1.2" opacity="0.7" />
        ))}
        <circle cx={cx} cy={cy} r="46" fill="var(--amber)" opacity="0.08" />
        <circle cx={cx} cy={cy} r="34" fill="var(--amber)" opacity="0.13" />
        <circle cx={cx} cy={cy} r="19" fill="var(--bg)" stroke="var(--amber)" strokeWidth="3" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink)" style={{ fontFamily: "var(--font-sans, inherit)" }}>{gene}</text>
        {points.map((p) => (
          <g key={p.n}>
            <circle cx={p.x} cy={p.y} r="16" fill="var(--star)" opacity="0.14" />
            <circle cx={p.x} cy={p.y} r="10.5" fill="var(--star)" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--bg)" style={{ fontFamily: "var(--font-sans, inherit)" }}>{p.n}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
