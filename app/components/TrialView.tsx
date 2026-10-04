"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadTrial } from "@/lib/data";
import { formatDate } from "@/lib/evidence";
import type { TrialDetail } from "@/lib/types";
import { Skeleton } from "./Skeleton";

export default function TrialView({ id }: { id: string }) {
  const [trial, setTrial] = useState<TrialDetail | null | undefined>(undefined);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    loadTrial(id).then((value) => { if (active) setTrial(value); }, () => { if (active) setError(true); });
    return () => { active = false; };
  }, [id]);
  if (!error && trial === undefined) return <Skeleton />;
  if (!trial) return <div className="page-shell max-w-[800px]"><p className="eyebrow">Study</p><h1 className="page-heading">{id}</h1><section className="answer-card mt-7"><h2 className="section-heading">{error ? "Study data could not be loaded" : "Study details are pending"}</h2><p className="subtle mt-3">{error ? "Reload this page to try again, or open the official registry record." : "This dataset has no detail file for this study. Check the official registry for its current status and contact details."}</p>{/^NCT[0-9]+$/.test(id) && <a className="button button-primary mt-5" href={`https://clinicaltrials.gov/study/${id}`} target="_blank" rel="noreferrer">Open registry record</a>}</section><Link href="/" className="button mt-5">Return to search</Link></div>;
  const facts = [
    ["Study status", trial.status?.replaceAll("_", " ").toLowerCase() ?? "Not recorded"],
    ["Age range", [trial.eligibility.min_age, trial.eligibility.max_age].filter(Boolean).join(" to ") || "Not recorded"],
    ["Sex eligibility", trial.eligibility.sex ?? "Not recorded"],
    ["Countries", trial.countries.map((country) => country.country).join(", ") || "Not recorded"],
  ];
  return <div className="page-shell max-w-[960px] space-y-8">
    <header><Link href="/" className="mb-5 inline-flex min-h-11 items-center text-accent underline underline-offset-4">Return to search</Link><p className="eyebrow">Clinical study</p><h1 className="page-heading">{trial.id}</h1><p className="subtle mt-4">A starting point for a conversation with the study team. The official record is the place to check current eligibility and availability.</p><a href={trial.contact_url || trial.url} target="_blank" rel="noreferrer" className="button button-primary mt-6">View official study contacts</a><p className="source-line mt-4">Source: {trial.source.db} · retrieved {formatDate(trial.retrieved)}{trial.last_update ? ` · registry updated ${formatDate(trial.last_update)}` : ""}</p></header>
    <section className="answer-card" aria-labelledby="study-details"><h2 id="study-details" className="section-heading">At a glance</h2><dl className="mt-5 divide-y divide-line">{facts.map(([label, value]) => <div key={label} className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr]"><dt className="subtle">{label}</dt><dd className="min-w-0 font-medium">{value}</dd></div>)}</dl><a href={trial.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center text-accent underline underline-offset-4">Read the full registry record</a></section>
    <details className="border-t border-line pt-3"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-accent">Show study locations ({trial.sites_total})</summary><p className="source-line mt-3">Source: {trial.source.db} · retrieved {formatDate(trial.retrieved)}</p>{trial.sites.length ? <ul className="mt-3 divide-y divide-line">{trial.sites.map((site, i) => <li key={i} className="py-4"><p className="font-medium">{site.facility ?? "Facility not recorded"}</p><p className="subtle mt-1">{[site.city, site.country].filter(Boolean).join(", ")}{site.status ? ` · ${site.status.replaceAll("_", " ").toLowerCase()}` : ""}</p></li>)}</ul> : <p className="subtle mt-4">No individual site details are recorded in this file.</p>}{trial.sites_total > trial.sites.length && <p className="subtle mt-3">Showing {trial.sites.length} of {trial.sites_total} locations. See the registry for the full list.</p>}</details>
    <p className="source-line">Research navigation, not medical advice. The study team confirms eligibility and whether a location is accepting participants.</p>
  </div>;
}
