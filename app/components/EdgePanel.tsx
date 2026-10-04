"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { loadDisease } from "@/lib/data";
import { allDiseaseEdges } from "@/lib/normalize";
import type { Edge, Evidence } from "@/lib/types";
import { LEVEL_INFO, RELATION_LABEL, formatConfidence, formatDate, hasCounterEvidence } from "@/lib/evidence";
import { LevelBadge } from "./Badges";
import { computedRecordLabel, humanizeRank, isSimilarityEdge, similarityWords } from "@/lib/present";

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

/** Methods that find a term by rule, without a model: they are labelled as such, never as AI. */
const RULE_ORIGIN = /^(regex|pattern|keyword|fuzzy|string|exact)/i;

function isRuleBased(ev: Evidence): boolean {
  return !ev.model && RULE_ORIGIN.test(ev.origin ?? "");
}

/** How a rule-based origin reads in the panel ("regex" is a method, not a source a reader knows). */
function originText(origin: string): string {
  if (/^regex|^pattern/i.test(origin)) return "text pattern match";
  if (/^fuzzy/i.test(origin)) return "name match";
  return origin;
}

/** Neutral wording for how text-derived evidence was made (never names a vendor in the present tense). */
function aiLabel(ev: Evidence): { text: string; ai: boolean } | null {
  if (!ev.model && ev.level !== "text_mined") return null;
  if (isRuleBased(ev)) return { text: /^fuzzy/i.test(ev.origin ?? "") ? "Name match on the organisation website (not AI)" : "Pattern match in the abstract (not AI)", ai: false };
  const origin = (ev.origin ?? "").toLowerCase();
  if (ev.db === "PubMed" || origin.includes("extract")) return { text: "AI-extracted from a PubMed abstract", ai: true };
  if (origin.includes("judge")) return { text: "AI-matched from the organisation website", ai: true };
  return { text: "AI-extracted", ai: true };
}

export default function EdgePanel({ edge: given, missingId, labelOf, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  // below 768 px the panel is a bottom sheet over a dimmed page: then it is modal (screen readers skip the rest, Tab stays inside)
  const [modal, setModal] = useState(false);
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
    const media = window.matchMedia("(max-width: 767px)");
    const apply = () => setModal(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
  }, [edge, missingId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return onClose();
      if (event.key !== "Tab" || !modal) return;
      // focus trap while the panel covers the page
      const panel = panelRef.current;
      if (!panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex='-1'])")].filter((el) => el.getClientRects().length > 0);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, onClose]);

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
  const similarity = edge ? isSimilarityEdge(edge) : false;
  const sourceLabel = edge ? labelOf(edge.source) : "";
  const targetLabel = edge ? labelOf(edge.target) : "";
  const sourceCount = edge?.independent_sources?.length ?? 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/25 md:bg-transparent md:pointer-events-none" onClick={onClose} aria-hidden="true" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal={modal ? "true" : "false"}
        aria-labelledby="edge-panel-title"
        className="@container drawer-enter fixed z-50 inset-x-0 bottom-0 max-h-[85vh] md:inset-x-auto md:right-4 md:top-20 md:bottom-4 md:max-h-none md:w-[440px] overflow-y-auto overscroll-contain rounded-t-[20px] md:rounded-[20px] border border-line bg-surface shadow-[var(--shadow,0_8px_32px_rgb(0_0_0/0.35))] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="sticky top-0 z-10 border-b border-line bg-surface px-5 pb-4 pt-3">
          <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-line md:hidden" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">Evidence for one link</p>
              <h2 id="edge-panel-title" className="mt-1 text-[20px] font-semibold leading-snug">
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
          <p className="px-5 py-6 text-[16px] text-ink-2">This edge is not part of the data loaded on this page, so its evidence cannot be shown here.</p>
        ) : (
          <div className="space-y-6 px-5 py-5 text-[16px]">
            <ProvenanceChain edge={edge} lead={lead} />

            <div className="space-y-3">
              {hasCounterEvidence(edge) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-contra-soft px-2.5 py-0.5 text-[12px] font-semibold text-contra">counter-evidence</span>
                </div>
              )}
              <p className="text-[16px] leading-relaxed text-ink-2">
                {edge.level === "text_mined" && edge.evidence.length && edge.evidence.every(isRuleBased)
                  ? "Found by a text pattern in a paper abstract, not by AI. It shows that the term appears there, not that the statement holds; read the source before relying on it."
                  : LEVEL_INFO[edge.level]?.meaning}
              </p>
              {loadingFull && <p className="text-[13px] text-ink-2" aria-live="polite">Summary from the overview map; loading the full evidence…</p>}
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-[13px] text-ink-2">{similarity ? "similarity (simGIC)" : "confidence"}</p>
                <p className="tabular font-mono text-[17px] font-semibold">
                  {formatConfidence(edge.confidence)}
                  {similarity && similarityWords(edge.confidence) && <span className="ml-2 font-sans text-[16px] font-normal text-ink-2">{similarityWords(edge.confidence)}</span>}
                </p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`${similarity ? "similarity" : "confidence"} ${formatConfidence(edge.confidence)} of 1`}>
                <div className="h-full rounded-full" style={{ width: `${Math.round(Math.min(1, Math.max(0, edge.confidence ?? 0)) * 100)}%`, background: "var(--accent)" }} />
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
              {similarity && (
                <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
                  Similarity is how much the two symptom profiles overlap, from 0 to 1. It is not the probability that the link is true, and it says nothing about whether the cause is shared.
                </p>
              )}
              {!!edge.independent_sources?.length && <p className="mt-2 text-[16px] text-ink-2">Independent sources: {edge.independent_sources.map(originText).join(", ")}</p>}
            </div>

            {edge.formula && (
              <section>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">How it was computed (inferred)</h3>
                <p className="mt-2 break-words rounded-[12px] bg-surface-2 px-3 py-2.5 font-mono text-[13px] leading-relaxed">{humanizeRank(edge.formula, sourceLabel, targetLabel)}</p>
              </section>
            )}

            {!!edge.rolled_up_from?.length && (
              <p className="rounded-[12px] border border-line px-3 py-2 text-[16px] text-ink-2">
                Rolled up from subtype{edge.rolled_up_from.length > 1 ? "s" : ""}: {edge.rolled_up_from.map(labelOf).join(", ")}
              </p>
            )}

            <section>
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">Evidence ({edge.evidence.length})</h3>
              {edge.evidence.length ? (
                <ul className="mt-2 space-y-3">
                  {edge.evidence.map((ev, i) => (
                    <EvidenceItem key={i} ev={ev} similarity={similarity} sourceLabel={sourceLabel} targetLabel={targetLabel} />
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
                    <EvidenceItem key={i} ev={ev} contra similarity={similarity} sourceLabel={sourceLabel} targetLabel={targetLabel} />
                  ))}
                </ul>
              ) : (
                <p className="mt-2 rounded-[12px] border border-dashed border-line px-3 py-2.5 text-[16px] leading-relaxed text-ink-2">
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

/** The record of a computed edge, in words: "Computed by Constellate (pipeline step 07, build 917470a)", linked to the methods page. */
function ComputedRecord({ record, codeUrl }: { record: string; codeUrl?: string | null }) {
  const label = computedRecordLabel(record);
  if (!label) return <span className="break-all">{record}</span>;
  return (
    <span>
      <Link href="/methods" className="inline-flex min-h-11 items-center text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-current">{label}</Link>
      {codeUrl && (
        <>
          {" · "}
          <a href={codeUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-current">
            pipeline code<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </>
      )}
    </span>
  );
}

/** Source → record (link) → date → level, as four connected points; the last one is lit. A vertical chain: long record names need the width. */
function ProvenanceChain({ edge, lead }: { edge: Edge; lead: Evidence | undefined }) {
  const computed = lead?.db === "computed" || edge.level === "inferred";
  const computedLabel = lead?.record ? computedRecordLabel(lead.record) : null;
  const steps: { key: string; value: React.ReactNode }[] = [
    { key: "Source", value: lead ? <>{computed && lead.db === "computed" ? "Constellate" : lead.db}{lead.origin && lead.origin !== lead.db && !computedLabel ? <span className="block text-[16px] font-normal text-ink-2">via {originText(lead.origin)}</span> : null}</> : "none" },
    {
      key: "Record",
      value: lead?.record ? (
        computedLabel ? (
          <ComputedRecord record={lead.record} codeUrl={lead.url} />
        ) : lead.url ? (
          <a href={lead.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 min-w-0 items-center break-all text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-current">
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
    <ol aria-label="Provenance of this link">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.key} className="relative min-w-0 pb-4 pl-7 last:pb-0">
            {!last && <span className="absolute left-[3.5px] top-3 bottom-[-4px] w-px bg-line-strong" aria-hidden="true" />}
            <div className="absolute left-0 top-[7px] flex items-center" aria-hidden="true">
              <span className="dot" data-state={last ? "lit" : undefined} />
            </div>
            <p className="text-[12px] uppercase tracking-[0.08em] text-ink-2">{step.key}</p>
            <div className="mt-0.5 break-words text-[16px] font-medium leading-snug">{step.value}</div>
          </li>
        );
      })}
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
      <button onClick={copy} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-[16px] font-medium text-ink hover:bg-surface-2" aria-label={`Copy edge ID ${id}`}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function EvidenceItem({ ev, contra = false, similarity = false, sourceLabel = "", targetLabel = "" }: { ev: Evidence; contra?: boolean; similarity?: boolean; sourceLabel?: string; targetLabel?: string }) {
  const ai = aiLabel(ev);
  const computedLabel = ev.record ? computedRecordLabel(ev.record) : null;
  const computedEvidence = similarity && ev.db === "Constellate";
  return (
    <li className={`rounded-[12px] border px-3 py-3 ${contra ? "border-contra/40 bg-contra-soft" : "border-line"}`}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-semibold">{ev.db}</span>
        {ev.origin && ev.origin !== ev.db && ev.origin !== "computed" && <span className="text-[16px] text-ink-2">via {originText(ev.origin)}</span>}
        <span className="ml-auto"><LevelBadge level={ev.level} small /></span>
      </div>
      {ev.record && (
        <p className="mt-1 text-[16px]">
          {computedLabel ? (
            <ComputedRecord record={ev.record} codeUrl={ev.url} />
          ) : ev.url ? (
            <a href={ev.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 min-w-0 items-center break-all text-accent underline decoration-accent/40 underline-offset-2">
              {ev.record}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <span className="break-all">{ev.record}</span>
          )}
        </p>
      )}
      {ai && (
        <div className="mt-2 rounded-[10px] border border-dashed border-line px-3 py-2 text-[16px]">
          <p className="font-semibold">{ai.text}</p>
          <p className="text-[16px] text-ink-2">
            {ai.ai && (ev.model ? <>model <span className="font-mono">{ev.model}</span> · </> : "model not recorded · ")}
            {ai.ai && ev.prompt_version ? `prompt ${ev.prompt_version} · ` : ""}unverified until a person checks the source
          </p>
          {typeof (ev as { note?: unknown }).note === "string" && <p className="mt-1 text-[16px] text-ink-2">{(ev as { note?: string }).note}</p>}
        </div>
      )}
      {ev.draft_input && <p className="mt-2 text-[12px] font-semibold text-ink-2">From an unverified draft list</p>}
      {ev.claim && (
        <p className="mt-2 text-[16px]">
          Claim: <span className="font-medium">{ev.claim}</span>
          {ev.study_context && ev.study_context !== "not_stated" ? ` (${ev.study_context.replaceAll("_", " ")})` : ""}
        </p>
      )}
      {ev.snippet && <p className="mt-2 break-words text-[16px] leading-relaxed text-ink-2">“{computedEvidence ? humanizeRank(ev.snippet, sourceLabel, targetLabel) : ev.snippet}”</p>}
      {ev.reason && <p className="mt-1 text-[16px] text-ink-2">Reason given: {ev.reason}</p>}
      <p className="tabular mt-2 text-[12px] text-ink-2">
        {formatDate(ev.date)} · {computedEvidence ? "similarity" : "confidence"} {formatConfidence(ev.confidence)}
      </p>
    </li>
  );
}
