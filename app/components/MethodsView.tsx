"use client";

import { useEffect, useState } from "react";
import type { EdgeLevel, Meta, MetaMetrics } from "@/lib/types";
import { loadMeta } from "@/lib/data";
import { LEVEL_INFO, formatDate } from "@/lib/evidence";
import { LevelBadge } from "./Badges";

const LEVELS: EdgeLevel[] = ["observed", "curated", "text_mined", "inferred"];

const LEVEL_SOURCES: Record<string, string> = {
  observed: "e.g. ClinVar pathogenic variants, HPO annotations with a frequency, trial records",
  curated: "e.g. Orphanet, MONDO, Reactome, OMIM annotations, EMA and FDA records",
  text_mined: "a language model extracts a claim from a PubMed abstract; PMID and the quoted sentence are kept",
  inferred: "computed by Constellate; the formula and its inputs are stored on the edge",
};

type Row = { key: keyof MetaMetrics; label: string; measures: string; render: (m: MetaMetrics) => string | null };

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const withN = (m?: { value?: number | null; n?: number | null; source?: string | null }, fmt: (v: number) => string = pct) =>
  typeof m?.value === "number" ? `${fmt(m.value)}${typeof m.n === "number" ? ` (n = ${m.n})` : ""}${m.source ? `, ${m.source}` : ""}` : null;

const METRICS: Row[] = [
  {
    key: "extract_precision",
    label: "Extract precision",
    measures: "Share of extracted claims confirmed against the abstract on a reviewed sample; the source line says who reviewed.",
    render: (m) => withN(m.extract_precision),
  },
  {
    key: "reconcile_accuracy",
    label: "Reconcile accuracy",
    measures: "Share of organisation-to-disease matches confirmed in the recorded review. The review method is shown with its result.",
    render: (m) => withN(m.reconcile_accuracy),
  },
  {
    key: "monarch_spearman",
    label: "Similarity vs Monarch (Spearman)",
    measures: "Rank correlation between our phenotype similarity (simGIC) and the Monarch semantic similarity for our top disease pairs.",
    render: (m) => withN(m.monarch_spearman, (v) => v.toFixed(2)),
  },
  {
    key: "coverage",
    label: "Coverage of core diseases",
    measures: "Share of core diseases with at least one trial, paper, reusable asset or patient organisation.",
    render: (m) => {
      const c = m.coverage;
      if (!c || typeof c.denominator !== "number" || !c.denominator) return null;
      const part = (label: string, n?: number) => (typeof n === "number" ? `${label} ${n}/${c.denominator} (${pct(n / c.denominator!)})` : null);
      const parts = [part("trial", c.trial), part("paper", c.paper), part("asset", c.asset), part("org", c.org)].filter(Boolean);
      return parts.length ? parts.join(" · ") : null;
    },
  },
  {
    key: "hero_regression",
    label: "Hero-path regression",
    measures: "Automated check that the hero path (Krabbe to MLD and its action card) is still found after every data build.",
    render: (m) => {
      const h = m.hero_regression;
      if (typeof h?.pass !== "boolean") return null;
      return `${h.pass ? "pass" : "fail"}${h.checked_at ? `, checked ${formatDate(h.checked_at)}` : ""}`;
    },
  },
];

function countOf(meta: Meta | null, group: "nodes" | "edges" | "levels"): [string, number][] {
  const raw = (meta?.counts as Record<string, unknown> | undefined)?.[group];
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw as Record<string, unknown>).filter((e): e is [string, number] => typeof e[1] === "number");
}

export default function MethodsView() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  useEffect(() => {
    loadMeta().then(
      (m) => {
        setMeta(m);
        setState(m ? "ready" : "missing");
      },
      () => setState("missing"),
    );
  }, []);

  const levels = countOf(meta, "levels");
  const nodes = countOf(meta, "nodes");
  const edges = countOf(meta, "edges");
  const metrics = meta?.metrics ?? {};
  const levelCount = (l: string) => levels.find(([k]) => k === l)?.[1];

  return (
    <div className="page-shell max-w-[960px] space-y-12">
      <header>
        <p className="eyebrow">Methods</p>
        <h1 className="page-heading">Follow the evidence.</h1>
        <p className="subtle mt-5 max-w-[65ch]">Every connection should be something you can check: a source, a date, and a clear account of what is known and what is uncertain.</p>
        <p className="source-line mt-4">{meta ? `Dataset ${meta.version} · updated ${formatDate(meta.built_at)}` : state === "loading" ? "Loading dataset information…" : "Dataset information is unavailable."}</p>
      </header>

      <section aria-labelledby="levels">
        <h2 id="levels" className="section-heading">How to read a connection</h2>
        <p className="subtle mt-3">A source observation, a curated record and a computed similarity answer different questions. The label stays with the evidence.</p>
        <ul className="mt-6 divide-y divide-line">
          {LEVELS.map((level) => (
            <li key={level} className="grid gap-3 py-6 md:grid-cols-[11rem_1fr]">
              <div><LevelBadge level={level} /></div>
              <div>
                <p>{LEVEL_INFO[level].meaning}.</p>
                <p className="subtle mt-2">{LEVEL_SOURCES[level]}.</p>
                {levelCount(level) !== undefined && <p className="source-line mt-2">{levelCount(level)!.toLocaleString("en")} connections in this dataset · source: dataset metadata</p>}
              </div>
            </li>
          ))}
        </ul>
        <div className="answer-card mt-6 space-y-5">
          <div><h3 className="font-semibold">Counter-evidence stays visible</h3><p className="subtle mt-2">The evidence panel always includes a counter-evidence section, even when it is empty. Conflicting records are shown together.</p></div>
          <div><h3 className="font-semibold">Confidence is a ranking, not a diagnosis</h3><p className="subtle mt-2">The score from 0 to 1 helps order connections. It is not a probability that a diagnosis is correct. Connections inherited from disease subtypes receive a lower score{typeof meta?.parameters?.rollup_confidence_factor === "number" ? `: the weakest subtype score multiplied by ${meta.parameters.rollup_confidence_factor}` : ""}.</p></div>
        </div>
      </section>

      <section aria-labelledby="gaps">
        <h2 id="gaps" className="section-heading">An honest gap is an answer</h2>
        <p className="subtle mt-3">“Not found” means a recorded search returned no matching records. We show the source and search date when supplied. “Data pending” means that information has not been delivered yet. Neither means that nothing exists elsewhere.</p>
      </section>

      <section aria-labelledby="ai">
        <h2 id="ai" className="section-heading">Where AI contributes</h2>
        <p className="subtle mt-3">AI-assisted content is labelled. The evidence record identifies the model where one is recorded.</p>
        <ol className="mt-5 divide-y divide-line">
          {[
            ["Extract claims", "Claims extracted from research abstracts retain the paper identifier and quoted sentence. They remain unverified, AI-extracted evidence."],
            ["Match names", "Models help match organisation names and free-text disease names to disease identifiers. A proposed match is not the same as a verified organisation."],
            ["Explain connections", "Action-card explanations cite supporting connection identifiers. Sentences without a valid citation are excluded; a template is available when AI generation is unavailable."],
          ].map(([title, description]) => <li key={title} className="py-5"><h3 className="font-semibold">{title}</h3><p className="subtle mt-2">{description}</p></li>)}
        </ol>
      </section>

      <section aria-labelledby="quality">
        <h2 id="quality" className="section-heading">What has been measured</h2>
        <p className="subtle mt-3">Results below come from this dataset’s metadata. Missing measurements stay missing.</p>
        <dl className="mt-6 divide-y divide-line">
          {METRICS.map((row) => {
            const value = state === "ready" ? row.render(metrics) : null;
            const record = metrics[row.key] as { kind?: string; source?: string; checked_at?: string; model?: string } | undefined;
            const modelReview = record?.kind === "model_review";
            return <div key={row.key} className="py-6" data-metric={row.key}>
              <dt className="font-semibold">{row.label}</dt>
              <dd className="mt-2">
                <p className="font-semibold">{value ?? (state === "loading" ? "Loading measurement…" : "Not yet measured in this build")}</p>
                {modelReview && <p className="mt-2 text-warn">Independent model review · not a human-reviewed accuracy score</p>}
                <p className="subtle mt-2">{row.measures}</p>
                <p className="source-line mt-2">Source: dataset metadata{meta ? ` · ${formatDate(meta.built_at)}` : ""}</p>
              </dd>
            </div>;
          })}
        </dl>
        {!!nodes.length && <details className="mt-4 border-t border-line pt-3"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-accent">Show dataset counts</summary><p className="subtle mt-3" data-testid="graph-counts">{nodes.map(([k, v]) => `${v.toLocaleString("en")} ${k.replaceAll("_", " ")}`).join(", ")}{edges.length ? `; connections: ${edges.map(([k, v]) => `${k.replaceAll("_", " ")} ${v.toLocaleString("en")}`).join(", ")}` : ""}. Source: dataset metadata{meta ? `, ${formatDate(meta.built_at)}` : ""}.</p></details>}
      </section>

      <section aria-labelledby="sources">
        <h2 id="sources" className="section-heading">Sources and licences</h2>
        {state === "missing" && <p className="subtle mt-3">The source list could not be loaded. Reload this page to try again.</p>}
        <ul className="mt-5 divide-y divide-line">
          {meta?.sources.map((source) => <li key={source.db} className="min-w-0 py-4">
            {source.url ? <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-accent underline underline-offset-4">{source.db}<span className="sr-only"> (opens in a new tab)</span></a> : <p className="font-semibold">{source.db}</p>}
            <p className="subtle break-words">Version: {source.version ?? "not recorded"} · Licence: {source.license ?? "not recorded"}</p>
          </li>)}
        </ul>
        <p className="source-line mt-6">Research navigation, not medical advice. Study participation and treatment decisions belong with clinicians and the study team.</p>
      </section>
    </div>
  );
}
