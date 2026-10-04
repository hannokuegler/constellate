"use client";

import type { DiseaseFile, Edge, Meta } from "@/lib/types";
import { formatDate } from "@/lib/evidence";
import { sourceHref, v2Therapies } from "@/lib/normalize";
import HonestGap from "./HonestGap";
import NeighbourResources from "./NeighbourResources";

export function SourceLine({ edge }: { edge: Edge }) {
  return <p className="source-line mt-2 flex flex-wrap items-center gap-x-3">{edge.evidence.map((source, i) => {
    const url = sourceHref(source.db, source.record, source.url);
    const text = `${source.db}${source.record ? ` | ${source.record}` : ""}${source.retrieved || source.date ? ` | ${formatDate(source.retrieved || source.date!)}` : " | Date not recorded"}`;
    return url ? <a className="inline-flex min-h-11 max-w-full items-center break-words underline" key={i} href={url} target="_blank" rel="noreferrer">{text}</a> : <span key={i}>{text}</span>;
  })}{!edge.evidence.length && <span>Source details not recorded.</span>}</p>;
}

export default function DiseaseAnswers({ file, meta, onEdge, onCard }: { file: DiseaseFile; meta: Meta | null; onEdge: (edge: Edge) => void; onCard: (id: string) => void }) {
  const therapies = v2Therapies(file);
  const searched = therapies.searched.map((s) => ({ source: s.source, fetched_at: s.retrieved ?? undefined, hits: s.hits ?? undefined }));
  const pending = !therapies.present || (!therapies.items.length && !searched.length);
  return <section className="answer-card" aria-labelledby="treatment-heading">
    <h2 className="section-heading" id="treatment-heading">Is there an approved treatment?</h2>
    {therapies.items.length ? <ul className="mt-4 divide-y divide-line">{therapies.items.map(({ node, edge }) => {
      const source = edge.evidence[0];
      const date = node.approved ?? source?.date;
      return <li key={node.id} className="py-3"><h3 className="font-semibold">{node.label}</h3><p className="mt-2">{node.authority ?? source?.db ?? "Authority not recorded"}{date ? ` | Approved ${formatDate(date)}` : " | Approval date not recorded"}</p><SourceLine edge={edge} /><button className="button mt-2" onClick={() => onEdge(edge)}>Review approval evidence</button></li>;
    })}</ul> : pending ? <div className="mt-4"><p className="font-semibold">Data pending</p><p className="subtle mt-2">Approval records for {file.node.label} are not available in this dataset yet. This is not a finding that no approved treatment exists.</p></div> : <div className="mt-4"><HonestGap variant="section" title={`No approved treatment found for ${file.node.label}`} reason={`Not found in the ${searched.map((s) => s.source).join(" or ")} records included in this dataset. This does not describe every care option.`} searched={searched} asOf={searched.map((s) => s.fetched_at).filter((date): date is string => Boolean(date)).sort().at(-1) ?? meta?.built_at} close={["An authority record confirming approval for this diagnosis"]} /></div>}
    {!therapies.items.length && <NeighbourResources file={file} onEdge={onEdge} onCard={onCard} />}
    {file.fixture_v2 && <p className="source-line mt-3">Development fixture: these resource records are examples for testing.</p>}
  </section>;
}
