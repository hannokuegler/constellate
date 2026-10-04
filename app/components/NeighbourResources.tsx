"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DiseaseFile, Edge } from "@/lib/types";
import { loadDisease } from "@/lib/data";
import { diseaseHref } from "@/lib/ids";
import { allDiseaseEdges, nodeLabels, openTrials, v2Assets, v2Therapies, trialStatusLabel } from "@/lib/normalize";
import { useEdgePanel } from "./Providers";
import { SourceLine } from "./DiseaseAnswers";

/** Probe only three mechanism-related neighbours, once this section enters the viewport. */
export default function NeighbourResources({ file, onEdge, onCard }: { file: DiseaseFile; onEdge: (edge: Edge) => void; onCard: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [records, setRecords] = useState<(DiseaseFile | null)[] | null>(null);
  const { register } = useEdgePanel();
  const candidates = useMemo(() => {
    const neighbours = file.neighbours.filter((n) => n.mechanism_differs !== true && (n.shared_genes.length > 0 || n.mechanism_differs === false)).sort((a, b) => b.shared_genes.length - a.shared_genes.length || b.edge.confidence - a.edge.confidence);
    const communities = (file.gap?.nearest_communities ?? []).filter((n) => n.mechanism_differs !== true && (n.shared_genes?.length || n.shared_pathways?.length));
    const unique = [...communities, ...neighbours].filter((n, index, rows) => rows.findIndex((other) => other.id === n.id) === index);
    // Prefer the parent disease over multiple subtypes so a small request budget covers distinct communities.
    const groups = new Map<string, (typeof unique)[number]>();
    for (const neighbour of unique) {
      const key = neighbour.label.toLowerCase().split(/ due to |, | type /)[0].replace(/\s+\d+[a-z]?$/, "");
      const previous = groups.get(key);
      if (!previous || neighbour.label.length < previous.label.length) groups.set(key, neighbour);
    }
    return [...groups.values()].slice(0, 3);
  }, [file]);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin: "160px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    Promise.all(candidates.map((n) => loadDisease(n.id).catch(() => null))).then((loaded) => {
      if (!alive) return;
      loaded.forEach((neighbour) => { if (neighbour) register(allDiseaseEdges(neighbour), nodeLabels(neighbour)); });
      setRecords(loaded);
    });
    return () => { alive = false; };
  }, [visible, candidates, register]);
  return <div ref={ref} className="mt-6 border-t border-line pt-6">
    <h3 className="text-lg font-semibold">What already exists nearby?</h3>
    <p className="subtle mt-2">A related community may have an established resource. These are starting points for a conversation with a specialist.</p>
    {!candidates.length ? <p className="mt-3">No shared-gene or shared-pathway neighbour is recorded yet. Explore the evidence below to see what is missing.</p> : records === null ? <p className="source-line mt-4" role="status">Checking resources in related communities...</p> : <ul className="mt-4 divide-y divide-line">{candidates.map((candidate, index) => {
      const neighbour = records[index];
      const therapies = neighbour ? v2Therapies(neighbour).items : [];
      const assets = neighbour ? v2Assets(neighbour).items.filter((item) => ["natural_history_study", "registry"].includes(item.node.asset_type)) : [];
      const trials = neighbour ? openTrials(neighbour) : [];
      const edge = file.neighbours.find((n) => n.id === candidate.id)?.edge;
      return <li className="py-5" key={candidate.id}>
        <Link href={diseaseHref(candidate.id)} className="inline-flex min-h-11 items-center text-lg font-semibold text-accent">{candidate.label}</Link>
        {edge && <button className="button ml-0 sm:ml-3" onClick={() => onEdge(edge)}>Why linked</button>}
        {therapies.slice(0, 2).map(({ node, edge }) => <div className="mt-3" key={node.id}><p className="font-semibold">{node.label} | {node.authority ?? edge.evidence[0]?.db}</p><p className="mt-1">Approved for {candidate.label}, not for {file.node.label}. What carries over and what differs needs expert review.</p><SourceLine edge={edge} /></div>)}
        {assets.slice(0, 2).map(({ node, edge }) => <div className="mt-3" key={node.id}><p className="font-semibold">{node.asset_type === "registry" ? "Registry" : "Natural history study"}: {node.label}</p><p className="source-line">Resource for {candidate.label}.</p><SourceLine edge={edge} /></div>)}
        {trials.slice(0, 1).map(({ node, edge }) => <div className="mt-3" key={node.id}><p className="font-semibold">Study: {node.label}</p><p className="source-line">{trialStatusLabel(node.status)} | Listed for {candidate.label}; eligibility needs review.</p><SourceLine edge={edge} /></div>)}
        {!therapies.length && !assets.length && !trials.length && <p className="subtle mt-2">{neighbour ? "No approval, registry, natural history study or open study is available in the displayed records for this neighbour." : "Data pending: this neighbour's resource records are not available."}</p>}
        <button className="button mt-3" onClick={() => onCard(candidate.id)}>Action card</button>
      </li>;
    })}</ul>}
  </div>;
}
