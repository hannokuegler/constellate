import Link from "next/link";
import type { Edge } from "@/lib/types";
import { diseaseHref, orgHref } from "@/lib/ids";
import type { Coverage, Gap } from "@/lib/types";
import { closingList, tierLabel } from "@/lib/normalize";
import { formatConfidence, formatDate } from "@/lib/evidence";

export interface GapSearch {
  source: string;
  query?: string;
  /** one row per saved query: text, link to the stored query URL and its own hit count */
  queries?: { query: string; url?: string | null; total_hits?: number }[];
  hits?: number;
  fetched_at?: string;
  note?: string | null;
  draft?: boolean;
}

const SOURCE_NAME: Record<string, string> = {
  ctgov: "ClinicalTrials.gov",
  clinvar: "ClinVar",
  europepmc: "Europe PMC",
  reporter: "NIH RePORTER",
  opentargets: "Open Targets",
  reactome: "Reactome",
};

/** Pipeline source codes ("ctgov") as names a reader knows. */
export function sourceName(source: string): string {
  return SOURCE_NAME[source] ?? source;
}

type RawCoverage = Coverage & { queries?: { query: string; url?: string | null; total_hits?: number }[]; hits_kept?: number };

/** Shard coverage → rows for the "what was searched" table, keeping the stored query links. */
export function coverageSearches(coverage: Coverage[] | undefined, only?: string[]): GapSearch[] {
  return ((coverage ?? []) as RawCoverage[])
    .filter((c) => !only || only.includes(c.source))
    .map((c) => ({
      source: sourceName(c.source),
      query: c.query,
      queries: c.queries?.length ? c.queries : undefined,
      hits: c.hits ?? c.hits_raw,
      fetched_at: c.fetched_at ?? c.retrieved,
      note: c.note ?? (c.hits_kept !== undefined && c.hits_raw !== undefined && c.hits_kept !== c.hits_raw ? `${c.hits_kept} of ${c.hits_raw} kept after filtering` : null),
    }));
}

export interface GapNeighbour {
  id: string;
  label: string;
  via: string;
  confidence?: number;
  edge?: Edge;
  tier?: string | null;
  mechanismDiffers?: boolean | null;
  orgs?: { id: string; label: string }[];
}

/** Adapter: the pipeline's `gap` block → HonestGap props (built-in texts stay the fallback). */
export function gapProps(gap: Gap): Pick<Props, "searched" | "nearest" | "close" | "asOf"> {
  const dates = gap.searched.map((s) => s.retrieved ?? s.verified).filter((d): d is string => Boolean(d)).sort();
  return {
    searched: gap.searched.map((s) => ({
      source: s.source,
      hits: s.hits_raw ?? undefined,
      fetched_at: s.retrieved ?? s.verified ?? undefined,
      note: s.note ?? (s.hits_kept !== undefined && s.hits_kept !== null && s.hits_raw !== s.hits_kept ? `${s.hits_kept} kept` : null),
      draft: s.draft,
    })),
    nearest: gap.nearest_communities.map((n) => ({
      id: n.id,
      label: n.label,
      via: n.relation,
      confidence: n.simgic,
      tier: tierLabel(n.tier),
      mechanismDiffers: n.mechanism_differs,
      orgs: n.orgs,
    })),
    close: closingList(gap),
    asOf: dates[dates.length - 1],
  };
}

interface Props {
  variant: "screen" | "section";
  title: string;
  reason: string;
  searched: GapSearch[];
  asOf?: string;
  /** omitted = this gap has no "nearest community" question (studies, papers); [] = asked, nobody found */
  nearest?: GapNeighbour[];
  close: string[];
  onEdge?: (edge: Edge) => void;
}

/** One-line gap state inside a card section: "Not found in X as of D" or "Data pending". Never an empty box. */
export function GapNote({ kind, children }: { kind: "gap" | "pending"; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-[12px] border border-dashed border-line px-3 py-2.5 text-[15px] leading-relaxed text-ink-2">
      <GapDot size={16} />
      <span className="min-w-0 break-words">
        <span className="mr-2 text-[12px] font-semibold uppercase tracking-[0.08em]">{kind === "gap" ? "Honest gap" : "Pending"}</span>
        {children}
      </span>
    </p>
  );
}

/** One point without a line, inside a dashed ring: a finding, not a failure. */
export function GapDot({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" className="mt-0.5 shrink-0">
      <circle cx="14" cy="14" r="12" fill="none" stroke="var(--star-dim, currentColor)" strokeWidth="1.3" strokeDasharray="3.2 3.6" strokeLinecap="round" />
      <circle cx="14" cy="14" r="3.6" fill="var(--star, currentColor)" />
    </svg>
  );
}

function SearchedTable({ searched }: { searched: GapSearch[] }) {
  const rows = searched.flatMap((s) =>
    s.queries?.length
      ? s.queries.map((q, i) => ({ key: `${s.source}-${i}`, first: i === 0, source: s.source, query: q.query, url: q.url, hits: q.total_hits ?? (s.queries!.length === 1 ? s.hits : undefined), date: s.fetched_at, note: i === 0 ? s.note : null, draft: s.draft }))
      : [{ key: `${s.source}-0`, first: true, source: s.source, query: s.query, url: null as string | null | undefined, hits: s.hits, date: s.fetched_at, note: s.note, draft: s.draft }],
  );
  return (
    <div className="@container"><table className="mt-3 w-full border-collapse text-[13px] @lg:table-fixed">
      <thead className="sr-only @lg:table-header-group @lg:not-sr-only">
        <tr className="border-b border-line text-left text-[12px] uppercase tracking-[0.08em] text-ink-2">
          <th scope="col" className="w-[30%] py-2 pr-3 font-medium @lg:w-[26%]">Source</th>
          <th scope="col" className="py-2 pr-3 font-medium">Query</th>
          <th scope="col" className="w-16 py-2 pr-3 text-right font-medium">Hits</th>
          <th scope="col" className="w-[6.5rem] py-2 text-right font-medium">Date</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} className="block border-b border-line py-2.5 last:border-0 @lg:table-row @lg:py-0">
            <td className="block min-w-0 font-semibold @lg:table-cell @lg:py-2.5 @lg:pr-3 @lg:align-top">
              {r.first ? r.source : <span className="sr-only">{r.source}</span>}
              {r.first && r.draft && <span className="ml-2 rounded-full border border-line px-2 text-[12px] font-medium text-ink-2">draft list</span>}
            </td>
            <td className="block min-w-0 text-ink-2 @lg:table-cell @lg:py-2.5 @lg:pr-3 @lg:align-top">
              {r.query ? (
                r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer" className="flex min-h-11 min-w-11 items-center text-ink underline decoration-line underline-offset-2 hover:decoration-current" title={r.query}>
                    <span className="line-clamp-3 min-w-0 break-words [overflow-wrap:anywhere]">{r.query}</span>
                    <span className="sr-only"> (opens the stored query in a new tab)</span>
                  </a>
                ) : (
                  <span className="line-clamp-3 break-words [overflow-wrap:anywhere]" title={r.query}>{r.query}</span>
                )
              ) : (
                <span>list checked as a whole</span>
              )}
              {r.note && <span className="mt-0.5 block text-[12px]">{r.note}</span>}
            </td>
            <td className="tabular mt-1 inline-block pr-4 text-ink-2 @lg:mt-0 @lg:table-cell @lg:py-2.5 @lg:pr-3 @lg:text-right @lg:align-top">
              {r.hits !== undefined ? <><span className="text-ink">{r.hits.toLocaleString("en")}</span> {r.hits === 1 ? "hit" : "hits"}</> : <span aria-label="no hit count recorded">n/a</span>}
            </td>
            <td className="tabular mt-1 inline-block text-ink-2 @lg:mt-0 @lg:table-cell @lg:py-2.5 @lg:text-right @lg:align-top">{r.date ? formatDate(r.date) : "n/a"}</td>
          </tr>
        ))}
      </tbody>
    </table></div>
  );
}

/** A first-class state: what we looked for, when, and what would change the answer. Never an error page. */
export default function HonestGap({ variant, title, reason, searched, asOf, nearest, close, onEdge }: Props) {
  const Heading = variant === "screen" ? "h1" : "h3";
  const screen = variant === "screen";
  return (
    <section className={`card min-w-0 ${screen ? "px-5 py-7 md:px-9 md:py-9" : "px-4 py-5 md:px-5"}`} aria-label={title}>
      <div className="flex items-start gap-3.5">
        <GapDot size={screen ? 36 : 28} />
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-2">Honest gap</p>
          <Heading className={`mt-1 break-words font-semibold leading-snug ${screen ? "text-[22px] md:text-[28px]" : "text-[19px]"}`} style={{ fontFamily: "var(--font-display, inherit)" }}>
            {title}
          </Heading>
          <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-ink-2">{reason}</p>
        </div>
      </div>

      <div className={`mt-6 grid gap-x-8 gap-y-6 ${screen ? "md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" : ""}`}>
        <div className="min-w-0">
          <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">What was searched{asOf ? <>, as of <span className="whitespace-nowrap">{formatDate(asOf)}</span></> : ""}</h4>
          {searched.length ? (
            <SearchedTable searched={searched} />
          ) : (
            <p className="mt-2 text-[13px] text-ink-2">No search log recorded for this item yet.</p>
          )}
        </div>
        <div className="min-w-0 space-y-6">
          {nearest !== undefined && (
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">Nearest related communities</h4>
            {nearest.length ? (
              <ul className="mt-2">
                {nearest.map((n) => n.tier !== undefined || n.orgs ? (
                  <li key={n.id} className="border-b border-line py-2 last:border-0">
                    <Link href={diseaseHref(n.id)} className="flex min-h-11 items-center break-words text-[15px] font-medium underline decoration-line underline-offset-2 hover:decoration-current">
                      {n.label}
                    </Link>
                    <p className="text-[12px] text-ink-2">
                      {n.tier && <span className="font-semibold">{n.tier}: </span>}
                      {n.via}
                      {n.confidence !== undefined && n.confidence !== null && ` · similarity ${formatConfidence(n.confidence)}`}
                    </p>
                    {n.mechanismDiffers === true && <span className="mt-1 inline-block rounded-full border border-dashed border-line px-2 text-[12px] font-medium text-ink-2">mechanism differs</span>}
                    {!!n.orgs?.length && (
                      <p className="mt-1 flex flex-wrap gap-x-3 text-[13px]">
                        {n.orgs.map((o) => (
                          <Link key={o.id} href={orgHref(o.id)} className="inline-flex min-h-11 items-center underline underline-offset-2">
                            {o.label}
                          </Link>
                        ))}
                      </p>
                    )}
                  </li>
                ) : (
                  <li key={n.id} className="flex flex-wrap items-center gap-x-3 border-b border-line last:border-0">
                    <Link href={diseaseHref(n.id)} className="flex min-h-11 min-w-0 grow basis-[13rem] items-center break-words py-1 text-[15px] font-medium underline decoration-line underline-offset-2 hover:decoration-current">
                      {n.label}
                    </Link>
                    {n.edge && onEdge ? (
                      <button onClick={() => onEdge(n.edge!)} className="tabular min-h-11 shrink-0 rounded-full pr-1 text-left text-[12px] text-ink-2 underline underline-offset-2">
                        {n.via}{n.confidence !== undefined && (n.edge?.type === "similar_phenotype" ? `, similarity ${formatConfidence(n.confidence)}` : ` ${formatConfidence(n.confidence)}`)}
                      </button>
                    ) : (
                      <span className="text-[12px] text-ink-2">{n.via}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[15px] text-ink-2">None found with the current data. That is a finding, not a failure.</p>
            )}
          </div>
          )}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">What would close this gap</h4>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
              {close.map((c) => (
                <li key={c} className="break-words">{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
