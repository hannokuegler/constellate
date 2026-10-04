"use client";

import { useId, useMemo } from "react";
import type { DiseaseFile } from "@/lib/types";
import { trialStatusLabel } from "@/lib/normalize";
import { familyAssets, plainDate, PLAIN_WORDS, type StudyRow } from "@/lib/nextSteps";
import { ALL_COUNTRIES, NO_COUNTRY, NO_COUNTRY_LABEL, contactUrl, listsCountry, otherCountries, sitesAsOf, unlistedCount, useCountry, useCountryCounts, useTrialDetails } from "@/lib/studies";
import { Explain, NowCard, Source } from "./ui";

const RECRUITING = trialStatusLabel("RECRUITING");
const BY_INVITATION = trialStatusLabel("ENROLLING_BY_INVITATION");

/** Recruiting studies that test a treatment first, then recruiting studies that observe (incl. registries), then by invitation, then "opens soon". */
function rank(s: StudyRow): number {
  if (s.status === RECRUITING) return s.observational ? 1 : 0;
  return s.status === BY_INVITATION ? 2 : 3;
}

/**
 * "Studies you could ask about" in "What you can do now": on a phone, right after the diagnosis, a parent sees whether a study
 * lists a site in their country and reaches the study team through the registry entry. The full list follows in "Open studies".
 */
export default function StudiesNow({ file, studies, assets }: { file: DiseaseFile; studies: StudyRow[]; assets: ReturnType<typeof familyAssets> }) {
  const label = file.node.label;
  const selectId = useId();
  const ordered = useMemo(() => studies.map((s, i) => ({ s, i })).sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i).map(({ s }) => s), [studies]);
  const ids = useMemo(() => ordered.map((s) => s.key), [ordered]);
  const details = useTrialDetails(ids);
  const countries = useCountryCounts(details);
  const unlisted = unlistedCount(ids, details);
  const [stored, pickCountry] = useCountry();
  // the choice is shared with "Open studies" below; "Country not listed" only applies where such a study exists
  const country = stored === NO_COUNTRY && !unlisted ? ALL_COUNTRIES : stored;
  // every other country stays pickable, so "none here" is said, not implied by a missing option
  const others = useMemo(() => {
    if (!countries.length) return [];
    const rest = otherCountries(countries.map(([c]) => c));
    // a remembered country from another disease page that the browser names differently
    return country && country !== NO_COUNTRY && !countries.some(([c]) => c === country) && !rest.includes(country) ? [country, ...rest] : rest;
  }, [countries, country]);

  const matching = ordered.filter((s) => listsCountry(details[s.key], country));
  const shown = (matching.length ? matching : ordered).slice(0, 2);

  const studyIds = new Set(studies.map((s) => s.key));
  const registries = assets.filter((a) => a.kind === "registry" && /recruiting/i.test(a.status ?? "") && !studyIds.has(a.record ?? ""));
  const ctgov = (file.coverage ?? []).find((c) => /ctgov|clinicaltrials/i.test(c.source));
  const checked = plainDate(ctgov?.retrieved ?? ctgov?.fetched_at);
  const registryChecked = plainDate(sitesAsOf(details, [ctgov?.retrieved ?? ctgov?.fetched_at]));

  return (
    <NowCard id="now-studies" title="Studies you could ask about" gap={!studies.length}>
      {studies.length ? (
        <>
          <p>
            {studies.length === 1 ? "One study lists" : `${studies.length} studies list`} {label} and take{studies.length === 1 ? "s" : ""} participants now or soon.
          </p>
          {countries.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={selectId} className="text-[15px] font-semibold text-ink">
                Where do you live?
              </label>
              <select
                id={selectId}
                value={country}
                onChange={(e) => pickCountry(e.target.value)}
                className="h-12 w-full max-w-[360px] rounded-[12px] border border-line-strong bg-surface px-3 text-[17px] text-ink"
              >
                <option value={ALL_COUNTRIES}>All countries</option>
                {unlisted > 0 && (
                  <option value={NO_COUNTRY}>
                    {NO_COUNTRY_LABEL} ({unlisted})
                  </option>
                )}
                <optgroup label="Countries with a study site">
                  {countries.map(([c, n]) => (
                    <option key={c} value={c}>
                      {c} ({n})
                    </option>
                  ))}
                </optgroup>
                {others.length > 0 && (
                  <optgroup label="No study site listed">
                    {others.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}
          {country && (
            <p role="status" className={matching.length ? "text-[16px] text-ink-2" : "rounded-[12px] bg-warn-soft px-3 py-2 text-[16px] leading-relaxed text-warn"}>
              {country === NO_COUNTRY
                ? `${matching.length === 1 ? "One study does" : `${matching.length} studies do`} not list a country yet; ask the study team where it will run.`
                : matching.length
                ? `${matching.length === 1 ? "One study lists" : `${matching.length} studies list`} a site in ${country}.`
                : `No study for ${label} lists a site in ${country}${registryChecked ? ` as of ${registryChecked}` : ""}. Studies elsewhere sometimes accept travelling participants; ask the study team.`}
            </p>
          )}
          {country && !matching.length && <p className="text-[15px] font-semibold text-ink">Studies in other countries</p>}
          <ul className="divide-y divide-line">
            {shown.map((s) => {
              const d = details[s.key];
              const here = country ? d?.countries.find((c) => c.country === country) : undefined;
              const all = d?.countries.map((c) => c.country) ?? [];
              const where = here
                ? `${here.sites} site${here.sites === 1 ? "" : "s"} in ${country}`
                : all.length
                  ? `${all.slice(0, 3).join(", ")}${all.length > 3 ? ` +${all.length - 3}` : ""}`
                  : "places: see the registry";
              return (
                <li key={s.key} className="py-3">
                  <p className="text-[15px] leading-7">
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${s.status === RECRUITING ? "bg-ok-soft text-ok" : "bg-accent-soft text-accent"}`}>{s.status}</span>
                    <span className="text-ink-2">
                      {" "}
                      · {s.observational ? "observes, no treatment" : "tests a treatment"} · {where}
                    </span>
                  </p>
                  <p className="mt-1 font-semibold leading-snug">{s.title}</p>
                  <a
                    href={contactUrl(d, s.href)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary mt-2"
                    aria-label={`Contact the study team: ${s.title}`}
                  >
                    Contact the study team
                  </a>
                  <Source label={`${s.key} on ClinicalTrials.gov`} href={s.href} edge={s.edge} about={`${s.key} lists ${label}`} prefix={false} />
                </li>
              );
            })}
          </ul>
          {studies.length > shown.length && (
            <a href="#open-studies" className="inline-flex min-h-11 items-center text-[15px] underline decoration-line-strong underline-offset-4 hover:decoration-current">
              See all {studies.length} studies below
            </a>
          )}
          <Explain>Whether your child can take part is decided with your doctor and the study team.</Explain>
        </>
      ) : (
        <p>
          No open study lists {label} on ClinicalTrials.gov right now{checked ? ` (checked ${checked})` : ""}.
        </p>
      )}
      {registries.length > 0 && (
        <div>
          <p className="font-semibold">Registries that collect data on {label}</p>
          <ul>
            {registries.slice(0, 2).map((r) => (
              <li key={r.key}>
                <p className="leading-snug">
                  {r.label} ({r.status?.toLowerCase()})
                </p>
                <Source label={r.record ?? "registry entry"} href={r.href} date={r.date} edge={r.edge} about={`${r.label} for ${label}`} />
              </li>
            ))}
          </ul>
          <Explain>{PLAIN_WORDS.registry}</Explain>
        </div>
      )}
    </NowCard>
  );
}
