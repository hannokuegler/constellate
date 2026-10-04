"use client";

import { useEffect, useRef, useState } from "react";
import { loadDisease } from "@/lib/data";
import { allDiseaseEdges } from "@/lib/normalize";
import type { Edge, Evidence } from "@/lib/types";
import { LEVEL_INFO, RELATION_LABEL, formatConfidence, formatDate, hasCounterEvidence } from "@/lib/evidence";
import { LevelBadge } from "./Badges";

interface Props {
  edge: Edge | null;
  missingId: string | null;
  labelOf: (id: string) => string;
  onClose: () => void;
}

/** Fired on window when the panel shows (or stops showing) an edge: the graph keeps that edge amber. */
export const EDGE_PANEL_EVENT = "constellate:edge-panel";

const PANEL_WIDTH = 440;
const PAGE_MAX = 1400; // layout max width of <main>
const GUTTER = 20;

/** Neutral wording for model-made evidence (never names a vendor in the present tense). */
function aiLabel(ev: Evidence): string | null {
  if (!ev.model && ev.level !== "text_mined") return null;
  const origin = (ev.origin ?? "").toLowerCase();
  if (ev.db === "PubMed" || origin.includes("extract")) return "AI-extracted from a PubMed abstract";
  if (origin.includes("judge")) return "AI-matched from the organisation website";
  return "AI-produced";
}

export default function EdgePanel({ edge: given, missingId, labelOf, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [full, setFull] = useState<Edge | null>(null);
  const edge = full && given && full.id === given.id ? full : given;
  const loadingFull = Boolean(given?.evidence_omitted && edge === given);

  useEffect(() => {
    // core.json edges carry at most 3 records without snippets: fetch the complete edge from a disease shard
    if (!given?.evidence_omitted) return;
    let alive = true;
    (async () => {
      for (const id of [given.source, given.target].filter((x) => x.startsWith("MONDO:"))) {
        const file = await loadDisease(id).catch(() => null);
        const match = file && allDiseaseEdges(file).find((e) => e.id === given.id);
        if (match) {
          if (alive) setFull(match);
          return;
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [given]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [edge, missingId, onClose]);

  // the graph keeps the read edge amber while this panel is open
  const edgeId = edge?.id ?? null;
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(EDGE_PANEL_EVENT, { detail: { id: edgeId } }));
    return () => {
      window.dispatchEvent(new CustomEvent(EDGE_PANEL_EVENT, { detail: { id: null } }));
    };
  }, [edgeId]);

  // wide screens: page and panel sit side by side, the panel never covers the graph
  useEffect(() => {
    const main = document.getElementById("main");
    if (!main) return;
    const media = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      const margin = Math.max(0, (window.innerWidth - PAGE_MAX) / 2);
      main.style.paddingRight = media.matches ? `${Math.max(0, PANEL_WIDTH + 16 + GUTTER - margin)}px` : "";
    };
    main.style.transition = "padding-right 200ms ease-out";
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      main.style.paddingRight = "";
      main.style.transition = "";
    };
  }, []);

  const sourcesChecked = edge
    ? [...new Set([...(edge.independent_sources ?? []), ...edge.evidence.map((e) => e.db)])].filter((s) => s && s !== "computed")
    : [];
  const lead = edge?.evidence[0];
  const sourceCount = edge?.independent_sources?.length ?? 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/25 md:bg-transparent md:pointer-events-none" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="false"
        aria-labelledby="edge-panel-title"
        className="@container drawer-enter fixed z-50 inset-x-0 bottom-0 max-h-[85vh] md:inset-x-auto md:right-4 md:top-20 md:bottom-4 md:max-h-none md:w-[440px] overflow-y-auto overscroll-contain rounded-t-[20px] md:rounded-[20px] border border-line bg-surface shadow-[var(--shadow,0_8px_32px_rgb(0_0_0/0.35))] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="sticky top-0 z-10 border-b border-line bg-surface px-5 pb-4 pt-3">
          <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-line md:hidden" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">Evidence for one link</p>
              <h2 id="edge-panel-title" className="mt-1 text-[19px] font-semibold leading-snug" style={{ fontFamily: "var(--font-display, inherit)" }}>
                {edge ? (
                  <>
                    {labelOf(edge.source)} <span className="font-normal text-ink-2">→ {RELATION_LABEL[edge.type] ?? edge.type} →</span> {labelOf(edge.target)}
                  </>
                ) : (
                  <>Edge {missingId}</>
                )}
              </h2>
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink"
              aria-label="Close evidence panel"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>

        {!edge ? (
          <p className="px-5 py-6 text-[15px] text-ink-2">This edge is not part of the data loaded on this page, so its evidence cannot be shown here.</p>
        ) : (
          <div className="space-y-6 px-5 py-5 text-[15px]">
            <ProvenanceChain edge={edge} lead={lead} />

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <LevelBadge level={edge.level} />
                {hasCounterEvidence(edge) && (
                  <span className="rounded-full bg-contra-soft px-2.5 py-0.5 text-[12px] font-semibold text-contra">counter-evidence</span>
                )}
              </div>
              <p className="text-[13px] leading-relaxed text-ink-2">{LEVEL_INFO[edge.level]?.meaning}</p>
              {loadingFull && <p className="text-[13px] text-ink-2" aria-live="polite">Summary from the overview map; loading the full evidence…</p>}
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-[13px] text-ink-2">confidence</p>
                <p className="tabular font-mono text-[17px] font-semibold">{formatConfidence(edge.confidence)}</p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`confidence ${formatConfidence(edge.confidence)} of 1`}>
                <div className="h-full rounded-full" style={{ width: `${Math.round(Math.min(1, Math.max(0, edge.confidence ?? 0)) * 100)}%`, background: "var(--star, var(--ink))" }} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                <div className="rounded-[12px] bg-surface-2 px-3 py-2">
                  <dd className="tabular text-[17px] font-semibold">{sourceCount}</dd>
                  <dt className="text-ink-2">independent sources</dt>
                </div>
                <div className="rounded-[12px] bg-surface-2 px-3 py-2">
                  <dd className="tabular text-[17px] font-semibold">{edge.evidence.length}</dd>
                  <dt className="text-ink-2">evidence records</dt>
                </div>
              </dl>
              {!!edge.independent_sources?.length && <p className="mt-2 text-[13px] text-ink-2">Independent sources: {edge.independent_sources.join(", ")}</p>}
            </div>

            {edge.formula && (
              <section>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">Formula (inferred)</h3>
                <p className="mt-2 break-words rounded-[12px] bg-surface-2 px-3 py-2.5 font-mono text-[13px] leading-relaxed">{edge.formula}</p>
              </section>
            )}

            {!!edge.rolled_up_from?.length && (
              <p className="rounded-[12px] border border-line px-3 py-2 text-[13px] text-ink-2">
                Rolled up from subtype{edge.rolled_up_from.length > 1 ? "s" : ""}: {edge.rolled_up_from.map(labelOf).join(", ")}
              </p>
            )}

            <section>
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">Evidence ({edge.evidence.length})</h3>
              {edge.evidence.length ? (
                <ul className="mt-2 space-y-3">
                  {edge.evidence.map((ev, i) => (
                    <EvidenceItem key={i} ev={ev} />
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-ink-2">No supporting evidence: this link only has counter-evidence.</p>
              )}
            </section>

            <section aria-live="polite">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-contra">Counter-evidence ({edge.contradicting.length})</h3>
              {edge.contradicting.length ? (
                <ul className="mt-2 space-y-3">
                  {edge.contradicting.map((ev, i) => (
                    <EvidenceItem key={i} ev={ev} contra />
                  ))}
                </ul>
              ) : (
                <p className="mt-2 rounded-[12px] border border-dashed border-line px-3 py-2.5 text-[13px] leading-relaxed text-ink-2">
                  No contradicting evidence recorded in: {sourcesChecked.length ? sourcesChecked.join(", ") : "the sources of this edge"}.
                  <br />
                  Absence of a record is not proof that none exists.
                </p>
              )}
            </section>

            <EdgeId id={edge.id} />
          </div>
        )}
      </aside>
    </>
  );
}

/** Source → record (link) → date → level, as four connected points; the last one is lit. */
function ProvenanceChain({ edge, lead }: { edge: Edge; lead: Evidence | undefined }) {
  const computed = lead?.db === "computed" || edge.level === "inferred";
  const steps: { key: string; value: React.ReactNode }[] = [
    { key: "Source", value: lead ? <>{computed && lead.db === "computed" ? "Constellate" : lead.db}{lead.origin && lead.origin !== lead.db ? <span className="block text-[12px] font-normal text-ink-2">via {lead.origin}</span> : null}</> : "none" },
    {
      key: "Record",
      value: lead?.record ? (
        lead.url ? (
          <a href={lead.url} target="_blank" rel="noreferrer" className="break-all text-ink underline decoration-line underline-offset-2 hover:decoration-[var(--amber,currentColor)]">
            {lead.record}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <span className="break-all">{lead.record}</span>
        )
      ) : computed ? "formula" : "n/a",
    },
    { key: "Date", value: <span className="tabular whitespace-nowrap">{formatDate(lead?.date)}</span> },
    { key: "Level", value: LEVEL_INFO[edge.level]?.label ?? edge.level },
  ];
  return (
    <ol className="grid grid-cols-2 gap-x-3 gap-y-4 @sm:grid-cols-4 @sm:gap-x-1" aria-label="Provenance of this link">
      {steps.map((step, i) => (
        <li key={step.key} className="min-w-0 pr-1">
          <div className="flex items-center" aria-hidden="true">
            <span className="dot" data-state={i === steps.length - 1 ? "lit" : undefined} />
            {i < steps.length - 1 && <span className={`ml-1 mr-1 h-px flex-1 bg-line-strong ${i === 1 ? "hidden @sm:block" : ""}`} />}
          </div>
          <p className="mt-2 text-[12px] uppercase tracking-[0.08em] text-ink-2">{step.key}</p>
          <div className="mt-0.5 break-words text-[13px] font-medium leading-snug">{step.value}</div>
        </li>
      ))}
    </ol>
  );
}

/** Edge ID in mono with a copy button (44 px target). */
function EdgeId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the id is selectable text */
    }
  };
  return (
    <div className="flex items-center gap-2 border-t border-line pt-4">
      <p className="text-[12px] uppercase tracking-[0.08em] text-ink-2">Edge ID</p>
      <code className="ml-auto select-all font-mono text-[13px]">{id}</code>
      <button onClick={copy} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-[13px] font-medium text-ink hover:bg-surface-2" aria-label={`Copy edge ID ${id}`}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function EvidenceItem({ ev, contra = false }: { ev: Evidence; contra?: boolean }) {
  const ai = aiLabel(ev);
  return (
    <li className={`rounded-[12px] border px-3 py-3 ${contra ? "border-contra/40 bg-contra-soft" : "border-line"}`}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-semibold">{ev.db}</span>
        {ev.origin && ev.origin !== ev.db && <span className="text-[13px] text-ink-2">via {ev.origin}</span>}
        <span className="ml-auto"><LevelBadge level={ev.level} small /></span>
      </div>
      {ev.record && (
        <p className="mt-1 text-[13px]">
          {ev.url ? (
            <a href={ev.url} target="_blank" rel="noreferrer" className="break-all underline underline-offset-2">
              {ev.record}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <span className="break-all">{ev.record}</span>
          )}
        </p>
      )}
      {ai && (
        <div className="mt-2 rounded-[10px] border border-dashed border-line px-3 py-2 text-[13px]">
          <p className="font-semibold">{ai}</p>
          <p className="text-[12px] text-ink-2">
            {ev.model ? <>model <span className="font-mono">{ev.model}</span></> : "model not recorded"}
            {ev.prompt_version ? ` · prompt ${ev.prompt_version}` : ""} · unverified until a person checks the source
          </p>
        </div>
      )}
      {ev.draft_input && <p className="mt-2 text-[12px] font-semibold text-ink-2">From an unverified draft list</p>}
      {ev.claim && (
        <p className="mt-2 text-[13px]">
          Claim: <span className="font-medium">{ev.claim}</span>
          {ev.study_context && ev.study_context !== "not_stated" ? ` (${ev.study_context.replaceAll("_", " ")})` : ""}
        </p>
      )}
      {ev.snippet && <p className="mt-2 text-[13px] leading-relaxed text-ink-2">“{ev.snippet}”</p>}
      {ev.reason && <p className="mt-1 text-[12px] text-ink-2">Reason given: {ev.reason}</p>}
      <p className="tabular mt-2 text-[12px] text-ink-2">
        {formatDate(ev.date)} · confidence {formatConfidence(ev.confidence)}
      </p>
    </li>
  );
}
