"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DiseaseFile, GeneFile, Meta } from "@/lib/types";
import { loadDisease, loadGene } from "@/lib/data";
import { actionCardMarkdown, buildActionCard } from "@/lib/actioncard";
import { formatDate } from "@/lib/evidence";
import { diseaseHref, toFileKey } from "@/lib/ids";
import { useEdgePanel } from "./Providers";
import CiteLink from "./CiteLink";
import ExplainStream from "./ExplainStream";
import ActionCardV2 from "./ActionCardV2";
import { buildV2, v2Markdown } from "@/lib/actionv2";

interface Props {
  disease: DiseaseFile;
  viaId: string;
  onViaChange?: (id: string) => void;
  meta: Meta | null;
  standalone?: boolean;
}



export default function ActionCard({ disease, viaId, onViaChange, meta, standalone = false }: Props) {
  const { register } = useEdgePanel();
  const [shareStatus, setShareStatus] = useState("");
  const neighbour = disease.neighbours.find((n) => n.id === viaId) ?? null;
  const [loaded, setLoaded] = useState<{ via: string; file: DiseaseFile | null; genes: GeneFile[] } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const file = await loadDisease(viaId).catch(() => null);
      const symbols = [...new Set([...disease.genes, ...(file?.genes ?? [])].map((e) => e.target))].slice(0, 8);
      const genes = (await Promise.all(symbols.map((s) => loadGene(s).catch(() => null)))).filter((g): g is GeneFile => Boolean(g));
      if (alive) setLoaded({ via: viaId, file, genes });
    })();
    return () => {
      alive = false;
    };
  }, [viaId, disease]);

  const ready = loaded?.via === viaId;
  const card = useMemo(
    () => (neighbour && ready ? buildActionCard({ disease, neighbour, neighbourFile: loaded!.file, geneFiles: loaded!.genes }) : null),
    [neighbour, ready, disease, loaded],
  );

  useEffect(() => {
    if (card) register(card.edges.values(), card.labels);
  }, [card, register]);

  const v2 = useMemo(
    () => (neighbour && ready ? buildV2(disease, loaded!.file, { id: neighbour.id, label: neighbour.label }, meta) : null),
    [neighbour, ready, disease, loaded, meta],
  );

  if (!neighbour) {
    return (
      <div className="card px-5 py-5">
        <p className="font-semibold">No link between {disease.node.label} and {viaId} in the data.</p>
        <p className="mt-1 text-[1.0625rem] text-ink-2">Choose a related disease from the disease page to build an evidence-backed card.</p>
      </div>
    );
  }

  const Title = standalone ? "h1" : "h2";
  const SectionTitle = standalone ? "h2" : "h3";
  const download = () => {
    if (!card) return;
    const md = actionCardMarkdown(card, meta?.built_at) + (v2 ? `\n# Assets and context\n\n${v2Markdown(v2).replace(/^## /gm, "### ")}` : "");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `constellate-proposal-${toFileKey(disease.node.id)}-via-${toFileKey(neighbour.id)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    const url = new URL(`${diseaseHref(disease.node.id)}/action?via=${toFileKey(neighbour.id)}`, window.location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: "Constellate action card", url });
      else { await navigator.clipboard.writeText(url); setShareStatus("Link copied."); }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setShareStatus("The link could not be copied. Open this card as a page and copy the address.");
    }
  };
  return (
    <article className="action-document overflow-hidden rounded-[1.5rem] border border-line bg-surface" aria-labelledby="action-card-title">
      <header className="border-b border-line px-5 py-5 md:px-6">
        <p className="text-[0.875rem] font-semibold uppercase tracking-wide text-accent">Action card</p>
        <Title id="action-card-title" className={standalone ? "page-heading" : "section-heading"}>
          A conversation about {disease.node.label}
        </Title>
        <p className="mt-1 text-[1rem] text-ink-2">Compare with {neighbour.label}. Bring these questions to your clinician or patient organisation. Each statement links to its supporting evidence.</p>
        <p className="source-line mt-3">Research navigation, not medical advice. {meta?.built_at ? `Dataset updated ${formatDate(meta.built_at)}.` : "Dataset date pending."}</p>
        <div className="no-print mt-6 flex flex-wrap items-end gap-3">
          {onViaChange && (
            <label className="relative flex min-w-0 max-w-full flex-col items-start gap-2">
              <span className="text-[1rem] text-ink-2">Compare with</span>
              <select
                value={viaId}
                onChange={(e) => onViaChange(e.target.value)}
                className="min-h-11 w-full max-w-[24rem] rounded-xl border border-line bg-surface px-3 py-2 text-[1rem] font-medium"
              >
                {disease.neighbours.map((n) => (
                  <option key={n.id} value={n.id}>
                    via {n.label}
                  </option>
                ))}
              </select>

            </label>
          )}
          <button onClick={download} disabled={!card} className="button button-primary disabled:opacity-60">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1.5v8M3.5 6.5L7 10l3.5-3.5M2 12.5h10" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
            Download card
          </button>
          <button onClick={share} className="button">Share card</button>
          {!standalone && (
            <Link href={`${diseaseHref(disease.node.id)}/action?via=${toFileKey(neighbour.id)}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-[1.0625rem] font-medium">
              Open as page
            </Link>
          )}
          {standalone && (
            <button onClick={() => window.print()} className="no-print inline-flex min-h-11 items-center rounded-full border border-line px-4 text-[1.0625rem] font-medium">
              Print
            </button>
          )}
        </div>
        <p role="status" className="no-print source-line mt-2">{shareStatus}</p>
      </header>

      {!card ? (
        <div className="space-y-3 px-6 py-6" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[12px] bg-surface-2" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1">
          {card.sections.map((section) => (
            <section key={section.key} className="border-b border-line px-5 py-7 md:px-8 last:border-0">
              <SectionTitle className="flex items-center gap-2 text-[17px] font-semibold">
                {section.title}
              </SectionTitle>
              <p className="mt-0.5 text-[1rem] text-ink-2">{section.hint}</p>
              {section.sentences.length ? (
                <ul className="mt-3 space-y-3">
                  {section.sentences.map((s, i) => (
                    <li key={i} className="text-[1.0625rem] leading-relaxed">
                      {s.text}
                      {s.edgeIds.map((id) => (
                        <CiteLink key={id} id={id} />
                      ))}
                      .
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[1.0625rem] text-ink-2">No supported statement in the graph for this section.</p>
              )}
            </section>
          ))}
        </div>
      )}

      {card && v2 && <ActionCardV2 model={v2} level={standalone ? "h2" : "h3"} />}

      {card && <details className="card-sources border-t border-line px-5 py-5 md:px-8">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-accent">Show sources for this card</summary>
        <ul className="mt-4 divide-y divide-line">
          {[...card.edges.values()].map((edge) => <li key={edge.id} className="min-w-0 py-4">
            <p className="break-all font-mono text-[0.875rem]">[{edge.id}]</p>
            {edge.evidence.map((source, i) => <p key={i} className="source-line mt-2">
              {source.url ? <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-accent underline underline-offset-4">{source.db}{source.record ? `: ${source.record}` : ""}</a> : `${source.db}${source.record ? `: ${source.record}` : ""}`}
              {source.retrieved || source.date ? `, ${formatDate(source.retrieved ?? source.date!)}` : ", date not recorded"}
            </p>)}
            <p className="source-line mt-2">Counter-evidence ({edge.contradicting.length})</p>
            {edge.contradicting.map((source, i) => <p key={i} className="source-line mt-2">{source.url ? <a href={source.url} className="inline-flex min-h-11 items-center text-accent underline" target="_blank" rel="noreferrer">{source.db}: {source.record ?? "source record"}</a> : source.db}{source.retrieved || source.date ? `, ${formatDate(source.retrieved ?? source.date!)}` : ", date not recorded"}</p>)}
          </li>)}
        </ul>
      </details>}

      {card && (
        <details className="no-print border-t border-line px-5 py-5 md:px-8">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold text-accent">Explain these connections</summary>
          <ExplainStream edges={[...card.edges.values()]} labels={card.labels} />
        </details>
      )}
    </article>
  );
}
