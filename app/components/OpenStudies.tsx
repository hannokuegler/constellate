"use client";

import { useEffect, useMemo, useState } from "react";
import type { DiseaseFile, Edge, EnrichmentItem, TrialDetail } from "@/lib/types";
import { loadTrial } from "@/lib/data";
import { ageRange, openTrials, trialPhase, trialStatusLabel } from "@/lib/normalize";
import { formatDate } from "@/lib/evidence";
import { LevelBadge } from "./Badges";
import HonestGap, { coverageSearches } from "./HonestGap";

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
export default function OpenStudies({ file, onEdge, family }: { file: DiseaseFile; onEdge: (e: Edge) => void; family: boolean }) {
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

  const shown = trials.filter((t) => !country || details[t.node.id]?.countries.some((c) => c.country === country));
  const visible = showAll ? shown : shown.slice(0, 5);
  const ctgov = coverageSearches(file.coverage, ["ctgov"]);

  const pickCountry = (value: string) => {
    setCountry(value);
    writeCountry(value);
  };

  return (
    <section className="card scroll-mt-20 px-4 py-4" id="open-studies" aria-labelledby="open-studies-title">
      <div className="mb-1 flex items-baseline gap-2">
        <h2 id="open-studies-title" className="text-[17px] font-semibold">{family ? `Studies looking for participants with ${file.node.label}` : "Open studies"}</h2>
        <span className="tabular text-[13px] text-ink-2">{trials.length}</span>
      </div>
      <p className="mb-3 text-[13px] text-ink-2">
        Studies on ClinicalTrials.gov that list {file.node.label} and take participants now or soon.
      </p>

      {trials.length === 0 ? (
        <HonestGap
          variant="section"
          title={`No open study lists ${file.node.label} right now`}
          reason="ClinicalTrials.gov has no recruiting or upcoming study whose conditions or title name this diagnosis or one of its synonyms."
          searched={ctgov.length ? ctgov : [{ source: "ClinicalTrials.gov", fetched_at: undefined }]}
          asOf={ctgov[0]?.fetched_at}
          close={["A study registration that names this diagnosis", "Studies of related diseases (see related communities) may accept it: ask their teams"]}
        />
      ) : (
        <>
          {hasDetails && (
            <label className="mb-3 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-ink-2">Where do you live?</span>
              <select
                value={country}
                onChange={(e) => pickCountry(e.target.value)}
                className="h-11 rounded-full border border-line bg-surface px-3 text-[13px] font-medium"
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
            <p className="rounded-[12px] bg-warn-soft px-3 py-2 text-[13px] text-warn">
              None of these studies lists a site in {country}. Studies abroad sometimes accept international families: ask the study team.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((t) => (
                <StudyRow key={t.node.id} item={t} detail={details[t.node.id]} country={country} onEdge={onEdge} />
              ))}
            </ul>
          )}
          {shown.length > 5 && (
            <button onClick={() => setShowAll((v) => !v)} className="mt-2 min-h-11 text-[13px] font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-current">
              {showAll ? "Show fewer" : `Show all ${shown.length}`}
            </button>
          )}
          <p className="mt-3 rounded-[12px] bg-surface-2 px-3 py-2 text-[13px] leading-relaxed">
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
      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${status === "RECRUITING" ? "bg-ok-soft text-ok" : "bg-accent-soft text-accent"}`}>{trialStatusLabel(status)}</span>
        <span className="rounded-full border border-line px-2 py-0.5">{observational ? "Observes, no treatment" : "Tests a treatment"}</span>
        {!observational && trialPhase(n) && <span className="text-ink-2">{trialPhase(n)}</span>}
        <span className="tabular text-ink-2">{n.id}</span>
      </div>
      <p className="mt-1.5 text-[15px] font-semibold leading-snug">{n.label}</p>
      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px]">
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
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <a
          href={detail?.contact_url ?? `${String(n.url ?? `https://clinicaltrials.gov/study/${n.id}`)}#contacts-and-locations`}
          target="_blank"
          rel="noreferrer"
          className="btn-primary text-[13px]"
        >
          Contact the study team
        </a>
        <LevelBadge level={item.edge.level} small />
        <button onClick={() => onEdge(item.edge)} className="inline-flex min-h-11 items-center rounded-full px-2 text-[13px] font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-current hover:bg-surface-2">
          Why listed
        </button>
        {detail && <span className="text-[12px] text-ink-2">Registry checked {formatDate(detail.retrieved)}</span>}
      </div>
    </li>
  );
}
