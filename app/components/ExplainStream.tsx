"use client";

import { useRef, useState } from "react";
import type { Edge } from "@/lib/types";
import type { ExplainEvent } from "@/lib/explain";
import { usePrefs } from "./Providers";
import { CitedText } from "./CiteLink";

/** Calls /api/explain and renders the NDJSON stream sentence by sentence. */
export default function ExplainStream({ edges, labels }: { edges: Edge[]; labels: Record<string, string> }) {
  const { persona } = usePrefs();
  const [events, setEvents] = useState<ExplainEvent[]>([]);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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
        body: JSON.stringify({ edges, labels, audience: `${persona.role.toLowerCase()} without medical training` }),
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
    }
  };

  const meta = events.find((e): e is Extract<ExplainEvent, { type: "meta" }> => e.type === "meta");
  const sentences = events.filter((e): e is Extract<ExplainEvent, { type: "sentence" }> => e.type === "sentence");
  const dropped = events.filter((e): e is Extract<ExplainEvent, { type: "dropped" }> => e.type === "dropped");
  const errors = events.filter((e): e is Extract<ExplainEvent, { type: "error" }> => e.type === "error");

  return (
    <div className="rounded-[20px] border border-line bg-surface-2 px-4 py-5 md:px-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">In plain language</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button onClick={run} disabled={running} className="btn-secondary disabled:opacity-60">
          {running ? "Explaining…" : events.length ? "Explain again" : "Explain in plain language"}
        </button>
        {meta && (
          <span className={`rounded-full border px-2.5 py-1 text-[12px] font-semibold ${meta.mode === "llm" ? "border-line-strong text-ink" : "border-dashed border-line-strong text-ink-2"}`}>
            {meta.mode === "llm" ? <>AI · <span className="font-mono">{meta.model}</span></> : "template, no LLM"}
          </span>
        )}
      </div>
      {meta && <p className="mt-2 text-[13px] text-ink-2">{meta.note}</p>}
      <div aria-live="polite">
        {sentences.length > 0 && (
          <p className="mt-4 max-w-[68ch] text-[17px] leading-[1.65]">
            {sentences.map((s, i) => (
              <span key={i}>
                <CitedText text={s.text} />{" "}
                {s.invalid_ids.length > 0 && <span className="text-[12px] text-contra">(unknown ref removed: {s.invalid_ids.join(", ")}) </span>}
              </span>
            ))}
          </p>
        )}
        {dropped.length > 0 && (
          <details className="mt-3 text-[13px]">
            <summary className="min-h-11 cursor-pointer py-2 font-medium text-contra">{dropped.length} sentence{dropped.length > 1 ? "s" : ""} removed by the citation check</summary>
            <ul className="mt-1 space-y-1">
              {dropped.map((d, i) => (
                <li key={i} className="rounded-[12px] bg-contra-soft px-3 py-2 text-contra line-through decoration-1">
                  {d.text} <span className="no-underline">({d.reason})</span>
                </li>
              ))}
            </ul>
          </details>
        )}
        {errors.map((e, i) => (
          <p key={i} className="mt-2 text-[13px] text-contra">⚠️ {e.message}</p>
        ))}
      </div>
    </div>
  );
}
