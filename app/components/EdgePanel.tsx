"use client";

import { useEffect, useRef, useState } from "react";
import { loadDisease } from "@/lib/data";
import { aiOrigin, allDiseaseEdges } from "@/lib/normalize";
import type { Edge, Evidence } from "@/lib/types";
import { LEVEL_INFO, RELATION_LABEL, formatConfidence, formatDate, hasCounterEvidence } from "@/lib/evidence";
import { LevelBadge } from "./Badges";

interface Props {
  edge: Edge | null;
  missingId: string | null;
  labelOf: (id: string) => string;
  onClose: () => void;
}

export default function EdgePanel({ edge: given, missingId, labelOf, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const main = document.querySelector("main");
    main?.setAttribute("inert", "");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input,select,[tabindex='0']") ?? []).filter((el) => el.getClientRects().length);
      const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = previousOverflow; main?.removeAttribute("inert"); };
  }, [edge, missingId, onClose]);

  const sourcesChecked = edge
    ? [...new Set([...(edge.independent_sources ?? []), ...edge.evidence.map((e) => e.db)])].filter((s) => s && s !== "computed")
    : [];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/25" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        ref={panelRef}
        aria-modal="true"
        aria-labelledby="edge-panel-title"
        className="drawer-enter fixed z-50 inset-x-0 bottom-0 max-h-[85vh] md:inset-x-auto md:right-4 md:top-20 md:bottom-4 md:max-h-none md:w-[440px] overflow-y-auto overscroll-contain rounded-t-[20px] md:rounded-[20px] border border-line bg-surface shadow-[var(--shadow)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-surface px-5 py-4">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-2">Evidence for one link</p>
            <h2 id="edge-panel-title" className="mt-1 text-[17px] font-semibold leading-snug">
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
            className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-surface-2"
            aria-label="Close evidence panel"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        {!edge ? (
          <p className="px-5 py-6 text-[15px] text-ink-2">This edge is not part of the data loaded on this page, so its evidence cannot be shown here.</p>
        ) : (
          <div className="space-y-5 px-5 py-5 text-[15px]">
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={edge.level} />
              {hasCounterEvidence(edge) && (
                <span className="rounded-full bg-contra-soft px-2.5 py-0.5 text-[12px] font-semibold text-contra">counter-evidence</span>
              )}
              <code className="ml-auto text-[12px] text-ink-2">{edge.id}</code>
            </div>
            <p className="text-[13px] text-ink-2">{LEVEL_INFO[edge.level]?.meaning}</p>
            {loadingFull && <p className="text-[13px] text-ink-2" aria-live="polite">Summary from the overview map; loading the full evidence…</p>}

            <dl className="grid grid-cols-3 gap-2 text-center">
              <Stat label="confidence" value={formatConfidence(edge.confidence)} />
              <Stat label="independent sources" value={String(edge.independent_sources?.length ?? 0)} />
              <Stat label="evidence records" value={String(edge.evidence.length)} />
            </dl>
            {!!edge.independent_sources?.length && (
              <p className="text-[13px] text-ink-2">Independent sources: {edge.independent_sources.join(", ")}</p>
            )}

            {edge.formula && (
              <section>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">Formula (inferred)</h3>
                <p className="mt-1 rounded-[12px] bg-surface-2 px-3 py-2 font-mono text-[13px] leading-relaxed">{edge.formula}</p>
              </section>
            )}

            {!!edge.rolled_up_from?.length && (
              <p className="rounded-[12px] bg-warn-soft px-3 py-2 text-[13px] text-warn">
                Rolled up from subtype{edge.rolled_up_from.length > 1 ? "s" : ""}: {edge.rolled_up_from.map(labelOf).join(", ")}
              </p>
            )}

            <section>
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">Evidence ({edge.evidence.length})</h3>
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
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-contra">Counter-evidence ({edge.contradicting.length})</h3>
              {edge.contradicting.length ? (
                <ul className="mt-2 space-y-3">
                  {edge.contradicting.map((ev, i) => (
                    <EvidenceItem key={i} ev={ev} contra />
                  ))}
                </ul>
              ) : (
                <p className="mt-2 rounded-[12px] border border-dashed border-line px-3 py-2 text-[13px] text-ink-2">
                  No contradicting evidence recorded in: {sourcesChecked.length ? sourcesChecked.join(", ") : "the sources of this edge"}.
                  <br />
                  Absence of a record is not proof that none exists.
                </p>
              )}
            </section>
          </div>
        )}
      </aside>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-surface-2 px-2 py-2">
      <dd className="tabular text-[17px] font-semibold">{value}</dd>
      <dt className="text-[12px] leading-tight text-ink-2">{label}</dt>
    </div>
  );
}

function EvidenceItem({ ev, contra = false }: { ev: Evidence; contra?: boolean }) {
  return (
    <li className={`rounded-[12px] border px-3 py-3 ${contra ? "border-contra/40 bg-contra-soft" : "border-line"}`}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-semibold">{ev.db}</span>
        {ev.origin && ev.origin !== ev.db && <span className="text-[13px] text-ink-2">via {aiOrigin(ev) ? "AI-extracted" : ev.origin}</span>}
        <span className="ml-auto"><LevelBadge level={ev.level} small /></span>
      </div>
      {ev.record && (
        <p className="mt-1 text-[13px]">
          {ev.url ? (
            <a href={ev.url} target="_blank" rel="noreferrer" className="break-all text-accent underline underline-offset-2">
              {ev.record}
            </a>
          ) : (
            <span className="break-all">{ev.record}</span>
          )}
        </p>
      )}
      {aiOrigin(ev) && (
        <div className="mt-2 rounded-[12px] bg-accent-soft px-3 py-2 text-[13px] text-accent">
          <p className="font-semibold">{aiOrigin(ev)}</p>
          <p className="text-[12px]">
            {ev.model ? `model ${ev.model}` : "model not recorded"}
            {ev.prompt_version ? ` · prompt ${ev.prompt_version}` : ""} · unverified until a person checks the source
          </p>
        </div>
      )}
      {ev.draft_input && <p className="mt-2 text-[12px] font-semibold text-warn">From an unverified draft list</p>}
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
