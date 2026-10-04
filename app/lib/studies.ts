import { useCallback, useEffect, useMemo, useState } from "react";
import type { TrialDetail } from "./types";
import { loadTrial } from "./data";
import type { StudyAge } from "./nextSteps";

/**
 * Shared by the two study blocks on a disease page ("Studies you could ask about" on top, "Open studies" below):
 * the remembered country, the per-study registry details (trial/<NCT>.json, optional), the country options and the contact link.
 */

export const ALL_COUNTRIES = "";
/** Filter value for studies whose registry entry (or missing trial shard) names no country. */
export const NO_COUNTRY = "(none)";
export const NO_COUNTRY_LABEL = "Country not listed";
const COUNTRY_KEY = "constellate.country";

export function readCountry(): string {
  try {
    return window.localStorage.getItem(COUNTRY_KEY) ?? ALL_COUNTRIES;
  } catch {
    return ALL_COUNTRIES;
  }
}

export function writeCountry(value: string) {
  try {
    window.localStorage.setItem(COUNTRY_KEY, value);
  } catch {
    /* private mode: the choice just does not persist */
  }
}

const COUNTRY_EVENT = "constellate:country";

/**
 * "Where do you live?": the chosen country, read from and written to localStorage (safe without it).
 * Both study blocks on a page follow the same choice: picking a country in one updates the other.
 */
export function useCountry(): [string, (value: string) => void] {
  const [country, setCountry] = useState<string>(ALL_COUNTRIES);
  useEffect(() => {
    setCountry(readCountry());
    const follow = (e: Event) => setCountry(String((e as CustomEvent<string>).detail ?? ALL_COUNTRIES));
    window.addEventListener(COUNTRY_EVENT, follow);
    return () => window.removeEventListener(COUNTRY_EVENT, follow);
  }, []);
  const pick = useCallback((value: string) => {
    writeCountry(value);
    window.dispatchEvent(new CustomEvent(COUNTRY_EVENT, { detail: value }));
  }, []);
  return [country, pick];
}

// same set as pipeline/08_trial_details.py OPEN_STATUSES
const OPEN_STATUSES = new Set(["RECRUITING", "NOT_YET_RECRUITING", "ENROLLING_BY_INVITATION", "AVAILABLE"]);

/**
 * Only sites that take participants count for the country filter, the counts and "where": a site marked COMPLETED,
 * TERMINATED, WITHDRAWN or ACTIVE_NOT_RECRUITING is dropped. A site without its own status inherits the study's status
 * (the registry often gives none for studies by invitation). A study left with no open site reads as "Country not listed".
 */
export function openSitesOnly(d: TrialDetail): TrialDetail {
  const studyOpen = OPEN_STATUSES.has(d.status ?? "");
  const isOpen = (status: string | null | undefined) => (status ? OPEN_STATUSES.has(status) : studyOpen);
  const complete = d.sites.length >= d.sites_total;
  const sites = d.sites.filter((s) => isOpen(s.status));
  const perCountry = new Map<string, number>();
  for (const s of sites) perCountry.set(s.country, (perCountry.get(s.country) ?? 0) + 1);
  const countries = d.countries
    .map((c) => {
      // an incomplete site list (registry cut-off): fall back to the pipeline's open_sites count
      const open = complete ? (perCountry.get(c.country) ?? 0) : Math.max(c.open_sites, perCountry.get(c.country) ?? 0);
      return { country: c.country, sites: open, open_sites: open };
    })
    .filter((c) => c.sites > 0);
  return { ...d, sites, countries, sites_total: countries.reduce((n, c) => n + c.sites, 0) };
}

export { countryName, sameCountry } from "./nextSteps";

/**
 * Registry details per NCT id. Trial shards are optional (`make trials`): probe the first one, and if it is missing
 * do not request the rest (no wall of 404s). Missing entries resolve to null ("see the registry entry").
 */
export function useTrialDetails(ids: string[]): Record<string, TrialDetail | null> {
  const [details, setDetails] = useState<Record<string, TrialDetail | null>>({});
  const key = ids.join(",");
  useEffect(() => {
    let alive = true;
    const list = key ? key.split(",") : [];
    (async () => {
      const first = list.length ? await loadTrial(list[0]).catch(() => null) : null;
      const rest = first ? await Promise.all(list.slice(1).map((id) => loadTrial(id).catch(() => null))) : list.slice(1).map(() => null);
      const rows = [first, ...rest];
      if (alive) setDetails(Object.fromEntries(list.map((id, i) => [id, rows[i] ? openSitesOnly(rows[i]!) : null])));
    })();
    return () => {
      alive = false;
    };
  }, [key]);
  return details;
}

/** Country options with the number of studies that list a site there, most studies first: [["United States", 6], ...]. */
export function useCountryCounts(details: Record<string, TrialDetail | null>): [string, number][] {
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of Object.values(details)) for (const c of d?.countries ?? []) counts.set(c.country, (counts.get(c.country) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [details]);
}

/** How many of these studies name no country (no trial shard, or an empty country list); 0 until the details have loaded. */
export function unlistedCount(ids: string[], details: Record<string, TrialDetail | null>): number {
  return ids.filter((id) => id in details && !details[id]?.countries.length).length;
}

/** True if no country is chosen, or the study's registry entry lists a site in it ("Country not listed": it names none). */
export function listsCountry(detail: TrialDetail | null | undefined, country: string): boolean {
  if (country === NO_COUNTRY) return !detail?.countries.length;
  return !country || Boolean(detail?.countries.some((c) => c.country === country));
}

/** "as of" for site statements: the newest registry retrieval among the trial shards, else the ClinicalTrials.gov search date. */
export function sitesAsOf(details: Record<string, TrialDetail | null>, searchDates: (string | null | undefined)[] = []): string | null {
  const dates = [...Object.values(details).map((d) => d?.retrieved), ...searchDates].filter((d): d is string => Boolean(d)).sort();
  return dates[dates.length - 1] ?? null;
}

/** The study's official contact section on ClinicalTrials.gov. */
export function contactUrl(detail: TrialDetail | null | undefined, registryUrl: string): string {
  return detail?.contact_url ?? `${registryUrl}#contacts-and-locations`;
}

// ISO 3166-1 alpha-2 codes; the English names come from the browser (Intl.DisplayNames), so nothing here is a claim about studies
const REGION_CODES =
  "AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KM KN KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NZ OM PA PE PG PH PK PL PR PS PT PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS SV SY SZ TD TG TH TJ TL TM TN TO TR TT TW TZ UA UG US UY UZ VE VN YE ZA ZM ZW".split(" ");

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/**
 * Countries no study lists, so a reader can still pick "Germany" and get the honest "no study lists a site there".
 * Names that overlap a listed one ("Türkiye" vs "Turkey (Türkiye)") are left out. Empty if the browser has no Intl.DisplayNames.
 */
export function otherCountries(listed: string[]): string[] {
  let names: Intl.DisplayNames;
  try {
    names = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return [];
  }
  // "Turkey (Türkiye)" also takes "Turkey" and "Türkiye"
  const taken = new Set(listed.flatMap((c) => [c, c.replace(/\s*\(.*\)\s*$/, ""), c.match(/\((.*)\)/)?.[1] ?? c]).map(fold));
  const out = new Set<string>();
  for (const code of REGION_CODES) {
    const name = names.of(code);
    if (!name || name === code) continue;
    const f = fold(name);
    if (!taken.has(f)) out.add(name);
  }
  return [...out].sort((a, b) => a.localeCompare(b));
}

// ---------------------------------------------------------------------------------------------------
// ages, as the registry entry gives them ("2 Months", "18 Years")

/** "2 Months" -> "2 months", "1 Year" -> "1 year"; null for missing or "N/A". */
function plainAge(value: string | null | undefined): string | null {
  const m = value?.trim().match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]+)$/);
  return m ? `${m[1]} ${m[2].toLowerCase()}` : null;
}

/** Age in years, for "does it include children" (under 18). */
function years(value: string | null): number | null {
  const m = value?.match(/^(\d+(?:\.\d+)?) (\w+)$/);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2];
  return unit.startsWith("year") ? n : unit.startsWith("month") ? n / 12 : unit.startsWith("week") ? n / 52 : unit.startsWith("day") ? n / 365 : unit.startsWith("hour") || unit.startsWith("minute") ? 0 : null;
}

/**
 * "Ages 2 months to 55 years", "Ages 18 years and older", "Ages up to 17 years", "No age limits listed" (registry gives none),
 * "Ages not listed" (no registry details loaded),
 * plus whether children (under 18) can take part: from the age limits, else from the registry's standard age groups.
 */
export function ageRange(detail: TrialDetail | null | undefined): StudyAge {
  const min = plainAge(detail?.eligibility?.min_age);
  const max = plainAge(detail?.eligibility?.max_age);
  const groups = detail?.eligibility?.std_ages ?? [];
  const label = min && max ? `Ages ${min} to ${max}` : min ? `Ages ${min} and older` : max ? `Ages up to ${max}` : detail ? "No age limits listed" : "Ages not listed";
  const minYears = years(min);
  const children = minYears !== null ? minYears < 18 : groups.length ? groups.includes("CHILD") : max ? true : null;
  return { label, children };
}
