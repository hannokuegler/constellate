import Link from "next/link";
import type { Edge } from "@/lib/types";
import { diseaseHref } from "@/lib/ids";
import { formatConfidence, formatDate } from "@/lib/evidence";

export interface GapSearch {
  source: string;
  query?: string;
  hits?: number;
  fetched_at?: string;
  note?: string | null;
}

export interface GapNeighbour {
  id: string;
  label: string;
  via: string;
  confidence?: number;
  edge?: Edge;
}

interface Props {
  variant: "screen" | "section";
  title: string;
  reason: string;
  searched: GapSearch[];
  asOf?: string;
  nearest?: GapNeighbour[];
  close: string[];
  onEdge?: (edge: Edge) => void;
}

/** A first-class state: what we looked for, when, and what would change the answer. Never an error page. */
export default function HonestGap({ variant, title, reason, searched, asOf, nearest = [], close, onEdge }: Props) {
  const Heading = variant === "screen" ? "h1" : "h3";
  return (
    <section className={`card border-dashed ${variant === "screen" ? "px-5 py-6 md:px-8 md:py-8" : "px-4 py-4"}`} aria-label={title}>
      <p className="text-[12px] font-semibold uppercase tracking-wide text-warn">Honest gap</p>
      <Heading className={`mt-1 font-semibold leading-snug ${variant === "screen" ? "text-[22px] md:text-[28px]" : "text-[17px]"}`}>{title}</Heading>
      <p className="mt-2 max-w-[68ch] text-[15px] text-ink-2">{reason}</p>

      <div className={`mt-5 grid gap-5 ${variant === "screen" ? "md:grid-cols-3" : ""}`}>
        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">What was searched{asOf ? `, as of ${formatDate(asOf)}` : ""}</h4>
          {searched.length ? (
            <ul className="mt-2 space-y-1.5 text-[13px]">
              {searched.map((s, i) => (
                <li key={`${s.source}-${i}`} className="flex flex-wrap gap-x-2">
                  <span className="font-semibold">{s.source}</span>
                  {s.hits !== undefined && <span className="tabular text-ink-2">{s.hits} hits</span>}
                  {s.fetched_at && <span className="text-ink-2">{formatDate(s.fetched_at)}</span>}
                  {s.query && <span className="w-full truncate text-[12px] text-ink-2" title={s.query}>{s.query}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[13px] text-ink-2">No search log recorded for this item yet.</p>
          )}
        </div>
        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">Nearest related communities</h4>
          {nearest.length ? (
            <ul className="mt-2 space-y-1">
              {nearest.map((n) => (
                <li key={n.id} className="flex min-h-11 items-center gap-2">
                  <Link href={diseaseHref(n.id)} className="flex min-h-11 min-w-0 flex-1 items-center truncate text-[15px] font-medium text-accent underline-offset-2 hover:underline">
                    {n.label}
                  </Link>
                  {n.edge && onEdge ? (
                    <button onClick={() => onEdge(n.edge!)} className="min-h-11 shrink-0 rounded-full px-2 text-[12px] text-ink-2 underline underline-offset-2">
                      {n.via} {n.confidence !== undefined && formatConfidence(n.confidence)}
                    </button>
                  ) : (
                    <span className="shrink-0 text-[12px] text-ink-2">{n.via}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[13px] text-ink-2">None found with the current data. That is a finding, not a failure.</p>
          )}
        </div>
        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">What would close this gap</h4>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px]">
            {close.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
