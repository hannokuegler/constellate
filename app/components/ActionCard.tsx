"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DiseaseFile, GeneFile, Meta } from "@/lib/types";
import { loadDisease, loadGene } from "@/lib/data";
import { actionCardMarkdown, buildActionCard } from "@/lib/actioncard";
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

/** Meaning travels in the glyph, not in colour: ink only. */
const SECTION_GLYPH = { transfers: "✓", differs: "≠", review: "?" } as const;

export default function ActionCard({ disease, viaId, onViaChange, meta, standalone = false }: Props) {
  const { register } = useEdgePanel();
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
        <p className="mt-1 text-[15px] text-ink-2">An action card needs an edge to stand on. Pick a related disease from the list.</p>
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

  return (
    <article className="card overflow-hidden" aria-labelledby="action-card-title">
      <header className="border-b border-line px-5 py-5 md:px-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">Action card</p>
        <Title id="action-card-title" className="t-h2 mt-1 text-[24px] font-semibold leading-snug md:text-[28px]">
          What {disease.node.label} can learn from {neighbour.label}
        </Title>
        <p className="mt-1 text-[13px] text-ink-2">Template text built only from graph edges. Every sentence ends with the edges it rests on; click one to see the evidence.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {onViaChange && (
            <label className="relative flex items-center">
              <span className="sr-only">Compare with</span>
              <select
                value={viaId}
                onChange={(e) => onViaChange(e.target.value)}
                className="h-11 max-w-[260px] appearance-none truncate rounded-full border border-line bg-surface pl-4 pr-8 text-[13px] font-medium"
              >
                {disease.neighbours.map((n) => (
                  <option key={n.id} value={n.id}>
                    via {n.label}
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 text-ink-2" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
            </label>
          )}
          <button onClick={download} disabled={!card} className="btn-primary disabled:opacity-60">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1.5v8M3.5 6.5L7 10l3.5-3.5M2 12.5h10" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
            Export proposal
          </button>
          {!standalone && (
            <Link href={`${diseaseHref(disease.node.id)}/action?via=${toFileKey(neighbour.id)}`} className="btn-secondary">
              Open as page
            </Link>
          )}
          {standalone && (
            <button onClick={() => window.print()} className="btn-secondary no-print">
              Print
            </button>
          )}
        </div>
      </header>

      {!card ? (
        <div className="space-y-3 px-6 py-6" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[12px] bg-surface-2" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
          {card.sections.map((section) => (
            <section key={section.key} className="border-b border-line px-5 py-5 md:border-b-0 md:border-r md:px-6 last:border-0">
              <SectionTitle className="t-h2 flex items-center gap-2.5 text-[20px] font-semibold" style={{ fontFamily: "var(--font-display, inherit)" }}>
                {section.title}
                <span className="grid h-7 w-7 place-items-center rounded-full border border-line-strong text-[14px] font-semibold leading-none" style={{ fontFamily: "var(--font-sans, inherit)" }} aria-hidden="true">{SECTION_GLYPH[section.key]}</span>
              </SectionTitle>
              <p className="mt-0.5 text-[13px] text-ink-2">{section.hint}</p>
              {section.sentences.length ? (
                <ul className="mt-4 space-y-3.5">
                  {section.sentences.map((s, i) => (
                    <li key={i} className="text-[15px] leading-relaxed">
                      {s.text}
                      {s.edgeIds.map((id) => (
                        <CiteLink key={id} id={id} />
                      ))}
                      .
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[15px] text-ink-2">No supported statement in the graph for this section.</p>
              )}
            </section>
          ))}
        </div>
      )}

      {card && v2 && <ActionCardV2 model={v2} level={standalone ? "h2" : "h3"} />}

      {card && (
        <div className="border-t border-line px-5 py-5 md:px-6">
          <ExplainStream edges={[...card.edges.values()]} labels={card.labels} />
        </div>
      )}
    </article>
  );
}
