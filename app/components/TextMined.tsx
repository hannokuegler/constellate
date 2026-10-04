"use client";

import type { Edge } from "@/lib/types";
import { RELATION_LABEL, formatConfidence, hasCounterEvidence } from "@/lib/evidence";

/** "From the literature": AI-extracted claims, each with its PMID and snippet, never presented as fact. */
export default function TextMined({ edges, labelOf, onEdge }: { edges: Edge[]; labelOf: (id: string) => string; onEdge: (e: Edge) => void }) {
  if (!edges.length) return null;
  const model = edges.flatMap((e) => e.evidence).find((ev) => ev.model)?.model;
  return (
    <section className="card px-4 py-4">
      <div className="mb-1 flex items-baseline gap-2">
        <h2 className="text-[17px] font-semibold">From the literature</h2>
        <span className="tabular text-[13px] text-ink-2">{edges.length}</span>
      </div>
      <p className="mb-2 text-[13px] text-ink-2">
        AI-extracted from PubMed abstracts{model ? ` by ${model}` : ""}. Unverified: check the PMID before relying on a claim.
      </p>
      <ul className="divide-y divide-line">
        {edges.slice(0, 12).map((e) => {
          const ev = e.evidence[0];
          return (
            <li key={e.id} className="py-2">
              <p className="text-[15px]">
                {labelOf(e.source)} <span className="text-ink-2">{RELATION_LABEL[e.type] ?? e.type.replaceAll("_", " ")}</span> {labelOf(e.target)}
                {hasCounterEvidence(e) && <span className="ml-2 rounded-full bg-contra-soft px-2 text-[12px] font-semibold text-contra">contradicted</span>}
              </p>
              {ev?.snippet && <p className="mt-1 line-clamp-2 text-[13px] text-ink-2">“{ev.snippet}”</p>}
              <div className="flex flex-wrap items-center gap-x-3 text-[12px] text-ink-2">
                {ev?.url ? (
                  <a href={ev.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-ink underline decoration-line underline-offset-2 hover:decoration-current">
                    {ev.record ?? "source"}
                  </a>
                ) : (
                  <span>{ev?.record}</span>
                )}
                <span className="tabular">conf. {formatConfidence(e.confidence)}</span>
                <span>{e.evidence.length} abstract{e.evidence.length === 1 ? "" : "s"}</span>
                <button onClick={() => onEdge(e)} className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 text-[13px] font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-current hover:bg-surface-2">
                  Evidence
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
