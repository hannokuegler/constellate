"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import type { DiseaseFile, Edge, EnrichmentItem, TrialDetail } from "@/lib/types";
import { loadTrial } from "@/lib/data";
import { ageRange, coverageRows, openTrials, trialPhase, trialStatusLabel } from "@/lib/normalize";
import { formatDate } from "@/lib/evidence";
import { LevelBadge } from "./Badges";
import HonestGap from "./HonestGap";

const COUNTRY_KEY = "constellate.country";
const ALL = "";

function readCountry(): string {
  try {
    return window.localStorage.getItem(COUNTRY_KEY) ?? ALL;
  } catch {
    return ALL;
  }
}
function writeCountry(value: string) {
  try {
    window.localStorage.setItem(COUNTRY_KEY, value);
  } catch {
    /* private mode: the choice just does not persist */
  }
}

/** Open studies that list this diagnosis, with where they run and how a family contacts the study team. */
export default function OpenStudies({ file, onEdge }: { file: DiseaseFile; onEdge: (e: Edge) => void; family?: boolean }) {
  const trials = useMemo(() => openTrials(file), [file]);
  const [details, setDetails] = useState<Record<string, TrialDetail | null>>({});
  const [country, setCountry] = useState<string>(ALL);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => setCountry(readCountry()), []);
  useEffect(() => {
    let alive = true;
    // trial shards are optional (`make trials`): probe one first, and if it is missing do not request the rest (no wall of 404s)
    (async () => {
      const first = trials.length ? await loadTrial(trials[0].node.id).catch(() => null) : null;
      const rest = first ? await Promise.all(trials.slice(1).map((t) => loadTrial(t.node.id).catch(() => null))) : trials.slice(1).map(() => null);
      const rows = [first, ...rest];
      if (alive) setDetails(Object.fromEntries(trials.map((t, i) => [t.node.id, rows[i]])));
    })();
    return () => {
      alive = false;
    };
  }, [trials]);

  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of Object.values(details)) for (const c of d?.countries ?? []) counts.set(c.country, (counts.get(c.country) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [details]);
  const hasDetails = countries.length > 0;

  const shown = trials.filter((t) => !hasDetails || !country || details[t.node.id]?.countries.some((c) => c.country === country));
  const visible = showAll ? shown : shown.slice(0, 2);
  const ctgov = coverageRows(file.coverage).filter((c) => /ctgov|clinicaltrials/i.test(c.source));
  const searchedAt = ctgov.map((c) => c.fetched_at).filter((d): d is string => Boolean(d)).sort().at(-1);

  const pickCountry = (value: string) => {
    setCountry(value);
    writeCountry(value);
  };

  return (
    <section className="answer-card min-w-0 scroll-mt-20" id="open-studies" aria-labelledby="open-studies-title">
      <div className="mb-1 flex items-baseline gap-2">
        <h2 id="open-studies-title" className="section-heading">Studies</h2>
        <span className="tabular text-base text-ink-2">{trials.length}</span>
      </div>
      <p className="mb-3 text-base text-ink-2">
        Studies on ClinicalTrials.gov that list {file.node.label} and take participants now or soon.
      </p>

      {trials.length === 0 ? (
        !ctgov.length ? <p className="subtle"><strong>Data pending.</strong> A study search with a recorded source and date is not available for this diagnosis yet.</p> : <HonestGap
          variant="section"
          title={`No open study found for ${file.node.label}`}
          reason="No recruiting or upcoming study naming this diagnosis or its synonyms was found in the recorded ClinicalTrials.gov search."
          searched={ctgov}
          asOf={searchedAt}
          close={["A study registration that names this diagnosis", "A review of related-disease studies and their eligibility criteria with the study team"]}
        />
      ) : (
        <>
          {hasDetails && (
            <label className="mb-3 flex flex-wrap items-center gap-2 text-base">
              <span className="text-ink-2">Filter by study country</span>
              <select
                value={country}
                onChange={(e) => pickCountry(e.target.value)}
                className="min-h-11 max-w-full rounded-xl border border-line bg-surface px-3 text-base font-medium"
              >
                <option value={ALL}>All countries</option>
                {countries.map(([c, n]) => (
                  <option key={c} value={c}>
                    {c} ({n})
                  </option>
                ))}
              </select>
            </label>
          )}
          {shown.length === 0 ? (
            <p className="rounded-[12px] bg-warn-soft px-3 py-2 text-base text-warn">
              None of these studies lists a site in {country}. Studies abroad sometimes accept international families: ask the study team.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((t) => (
                <StudyRow key={t.node.id} item={t} detail={details[t.node.id]} country={country} onEdge={onEdge} />
              ))}
            </ul>
          )}
          {shown.length > 2 && (
            <button onClick={() => setShowAll((v) => !v)} className="mt-2 min-h-11 text-base font-medium text-accent">
              {showAll ? "Show fewer" : `Show all studies (${shown.length - 2} more)`}
            </button>
          )}
          <p className="mt-3 rounded-[12px] bg-surface-2 px-3 py-2 text-base leading-relaxed">
            Whether a child can join is decided by the study team together with your doctor. Studies that only observe collect data over time and do
            not treat; studies that test a treatment have risks as well as possible benefits. Constellate only shows what the registry says.
          </p>
        </>
      )}
    </section>
  );
}

function StudyRow({ item, detail, country, onEdge }: { item: EnrichmentItem; detail: TrialDetail | null | undefined; country: string; onEdge: (e: Edge) => void }) {
  const n = item.node as Record<string, unknown> & { id: string; label: string };
  const observational = n.study_type === "OBSERVATIONAL";
  const conditions = Array.isArray(n.conditions) ? (n.conditions as string[]) : [];
  const ages = detail ? ageRange(detail.eligibility.min_age, detail.eligibility.max_age) : null;
  const here = country ? detail?.countries.find((c) => c.country === country) : null;
  const sitesHere = country ? detail?.sites.filter((s) => s.country === country).slice(0, 3) ?? [] : [];
  const topCountries = detail?.countries.slice(0, 4).map((c) => c.country) ?? [];
  const status = detail?.status ?? n.status;

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${status === "RECRUITING" ? "bg-ok-soft text-ok" : "bg-accent-soft text-accent"}`}>{trialStatusLabel(status)}</span>
        <span className="rounded-full border border-line px-2 py-0.5">{observational ? "Observes, no treatment" : "Tests a treatment"}</span>
        {!observational && trialPhase(n) && <span className="text-ink-2">{trialPhase(n)}</span>}
        <span className="tabular text-ink-2">{n.id}</span>
      </div>
      <p className="mt-1.5 text-base font-semibold leading-snug">{n.label}</p>
      <dl className="mt-3 grid min-w-0 grid-cols-1 gap-x-3 gap-y-1 text-base sm:grid-cols-[auto_minmax(0,1fr)]">
        {typeof n.sponsor === "string" && (
          <>
            <dt className="text-ink-2">Run by</dt>
            <dd>{n.sponsor}</dd>
          </>
        )}
        {typeof n.enrollment === "number" && (
          <>
            <dt className="text-ink-2">Looking for</dt>
            <dd className="tabular">{n.enrollment.toLocaleString("en")} participants</dd>
          </>
        )}
        {ages && (
          <>
            <dt className="text-ink-2">Ages</dt>
            <dd>{ages}</dd>
          </>
        )}
        {conditions.length > 1 && (
          <>
            <dt className="text-ink-2">Also for</dt>
            <dd>{conditions.filter((c) => !c.toLowerCase().includes(String(n.label).toLowerCase())).slice(0, 5).join(", ")}</dd>
          </>
        )}
        <dt className="text-ink-2">Where</dt>
        <dd>
          {!detail
            ? "See the registry entry"
            : here
              ? `${here.sites} site${here.sites > 1 ? "s" : ""} in ${country}${sitesHere.length ? `: ${sitesHere.map((s) => [s.facility, s.city].filter(Boolean).join(", ")).join("; ")}` : ""}`
              : `${detail.sites_total} site${detail.sites_total === 1 ? "" : "s"} in ${detail.countries.length} countr${detail.countries.length === 1 ? "y" : "ies"}${topCountries.length ? ` (${topCountries.join(", ")}${detail.countries.length > 4 ? ", …" : ""})` : ""}`}
        </dd>
      </dl>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link className="button" href={`/t/${n.id.replace(/^NCT:/, "")}`}>View study</Link>
        <a
          href={detail?.contact_url ?? `${String(n.url ?? `https://clinicaltrials.gov/study/${n.id}`)}#contacts-and-locations`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-base font-semibold text-accent"
        >
          Contact the study team
        </a>
        <LevelBadge level={item.edge.level} small />
        <button onClick={() => onEdge(item.edge)} className="inline-flex min-h-11 items-center rounded-full px-2 text-base font-medium text-accent hover:bg-accent-soft">
          Why listed
        </button>
        <span className="source-line">ClinicalTrials.gov | {detail?.retrieved || item.edge.evidence[0]?.retrieved || item.edge.evidence[0]?.date ? `Registry checked ${formatDate(detail?.retrieved ?? item.edge.evidence[0]?.retrieved ?? item.edge.evidence[0]?.date ?? "")}` : "Check date not recorded"}</span>
      </div>
    </li>
  );
}
