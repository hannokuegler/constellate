"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Edge } from "@/lib/types";
import { EDGE_ID_PATTERN, plainTerms, type ExplainEvent } from "@/lib/explain";
import { loadDisease } from "@/lib/data";
import { therapyState, type TherapyState } from "@/lib/nextSteps";
import { useEdgePanel } from "./Providers";

/** Text with its [e_…] references as small numbered markers [1] [2], each opening the same evidence as before. */
function Numbered({ text, numberOf }: { text: string; numberOf: Map<string, number> }) {
  const { openEdge } = useEdgePanel();
  const parts = text.split(/(\s*\[e_[0-9a-f]{6,16}\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/\[(e_[0-9a-f]{6,16})\]/);
        if (!match) return <span key={i}>{part}</span>;
        const n = numberOf.get(match[1]);
        return (
          <span key={i}>
            {/^\s/.test(part) ? " " : ""}
            <button
              type="button"
              onClick={() => openEdge(match[1])}
              className="-my-3 -mx-1 inline-flex min-h-11 items-center justify-center px-1.5 align-baseline text-[16px] font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-current"
              aria-label={`Source ${n}: open the evidence`}
              title={match[1]}
            >
              [{n}]
            </button>
          </span>
        );
      })}
    </>
  );
}

/** Calls /api/explain and renders the NDJSON stream sentence by sentence. */
export default function ExplainStream({ edges, labels, from, via }: { edges: Edge[]; labels: Record<string, string>; from?: string; via?: string }) {
  const [events, setEvents] = useState<ExplainEvent[]>([]);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // approval status of the card's disease from its data file, the same source as "At a glance" (lib/actioncard buildGlance)
  const [own, setOwn] = useState<{
    id: string;
    label: string;
    therapy: TherapyState;
  } | null>(null);
  useEffect(() => {
    if (!from) return;
    let alive = true;
    loadDisease(from.replace("_", ":"))
      .then(
        (file) =>
          alive &&
          file &&
          setOwn({
            id: from,
            label: file.node.label,
            therapy: therapyState(file),
          }),
      )
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [from]);

  const run = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setEvents([]);
    setRunning(true);
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edges,
          labels,
          from,
          via,
          audience: "a patient, parent or patient-group lead without medical training",
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        const parsed = lines.filter(Boolean).map((l) => JSON.parse(l) as ExplainEvent);
        if (parsed.length) setEvents((prev) => [...prev, ...parsed]);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") setEvents((prev) => [...prev, { type: "error", message: (error as Error).message }]);
    } finally {
      setRunning(false);
      // the button was disabled while loading, so focus fell to the page: move it to the result
      requestAnimationFrame(() => resultRef.current?.focus());
    }
  };

  const meta = events.find((e): e is Extract<ExplainEvent, { type: "meta" }> => e.type === "meta");
  const sentences = events.filter((e): e is Extract<ExplainEvent, { type: "sentence" }> => e.type === "sentence");
  const dropped = events.filter((e): e is Extract<ExplainEvent, { type: "dropped" }> => e.type === "dropped");
  const errors = events.filter((e): e is Extract<ExplainEvent, { type: "error" }> => e.type === "error");
  const status = events.find((e): e is Extract<ExplainEvent, { type: "status" }> => e.type === "status");
  // plain words after the first technical term, then the edge ids numbered in reading order
  const texts = useMemo(() => plainTerms(sentences.map((s) => s.text)), [sentences]);
  const numberOf = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of texts) for (const m of t.matchAll(EDGE_ID_PATTERN)) if (!map.has(m[1])) map.set(m[1], map.size + 1);
    return map;
  }, [texts]);
  const notApproved = own && own.id === from && own.therapy.kind === "none" ? own : null;
  // neutral labels only: why the server fell back (no key, budget, upstream error) is never shown to the reader
  const label = meta ? (meta.mode === "llm" ? "AI-written summary, every sentence checked against the sources" : "Plain-language summary built from the sources on this card") : null;

  return (
    <div className="rounded-[20px] border border-line bg-surface-2 px-4 py-5 md:px-6">
      <p className="text-[16px] font-semibold text-ink-2">In plain language</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button onClick={run} disabled={running} className="btn-secondary disabled:opacity-60">
          {running ? "Explaining…" : events.length ? "Explain again" : "Explain in plain language"}
        </button>
        {meta && (
          <span className={`rounded-full border px-2.5 py-1 text-[16px] font-semibold ${meta.mode === "llm" ? "border-line-strong text-ink" : "border-dashed border-line-strong text-ink-2"}`}>
            {meta.mode === "llm" ? <span title={meta.model}>AI-written</span> : "Built from the sources"}
          </span>
        )}
      </div>
      {label && <p className="mt-2 text-[16px] text-ink-2">{label}</p>}
      <div aria-live="polite" ref={resultRef} tabIndex={-1} aria-label="Plain-language summary" className="outline-none focus-visible:outline-2">
        {events.length > 0 && notApproved && notApproved.therapy.kind === "none" && (
          <p className="mt-4 max-w-[68ch] rounded-[12px] border border-line-strong bg-surface px-3 py-2 text-[17px] font-semibold leading-[1.65]" data-testid="explain-not-approved">
            None of the medicines or studies named below are approved for {notApproved.label}.{" "}
            <span className="text-[16px] font-normal text-ink-2">
              (Source: {notApproved.therapy.regulators.length ? notApproved.therapy.regulators.join(" and ") : notApproved.therapy.authorities} records searched
              {notApproved.therapy.asOf ? `, as of ${notApproved.therapy.asOf}` : ""})
            </span>
          </p>
        )}
        {status && (
          <p className="mt-4 max-w-[68ch] text-[17px] font-semibold leading-[1.65]" data-testid="explain-status">
            {status.text} <span className="text-[16px] font-normal text-ink-2">({status.source})</span>
          </p>
        )}
        {sentences.length > 0 && (
          <p className="mt-4 max-w-[68ch] text-[17px] leading-[1.65]">
            {sentences.map((s, i) => (
              <span key={i}>
                <Numbered text={texts[i] ?? s.text} numberOf={numberOf} /> {s.invalid_ids.length > 0 && <span className="text-[16px] text-contra">(an unknown source reference was removed) </span>}
              </span>
            ))}
          </p>
        )}
        {dropped.length > 0 && (
          <details className="mt-3 text-[16px]">
            <summary className="min-h-11 cursor-pointer py-2 font-medium text-contra">
              {dropped.length} sentence{dropped.length > 1 ? "s" : ""} removed by the citation check
            </summary>
            <ul className="mt-1 space-y-1">
              {dropped.map((d, i) => (
                <li key={i} className="rounded-[12px] bg-contra-soft px-3 py-2 text-contra line-through decoration-1">
                  {d.text} <span className="no-underline">({d.reason})</span>
                </li>
              ))}
            </ul>
          </details>
        )}
        {errors.length > 0 && !sentences.length && (
          <p className="mt-2 text-[16px] text-contra">The summary could not be loaded. The card above lists every statement with its source; try again in a moment.</p>
        )}
      </div>
    </div>
  );
}
