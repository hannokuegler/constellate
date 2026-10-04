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
    measures: "Share of organisation-to-disease matches that agree with a hand-checked answer.",
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
    label: "Coverage of the 350 core diseases",
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
    <div className="mx-auto mt-8 max-w-[960px] space-y-10">
      <header>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">Methods</p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight">How we know</h1>
        <p className="mt-2 max-w-[68ch] text-[16px] text-ink-2">
          Every line in the graph carries a source, a date, an evidence level, a confidence and a slot for counter-evidence. Where we have no source, we say so instead of guessing.
        </p>
      </header>

      <section aria-labelledby="levels">
        <h2 id="levels" className="text-[22px] font-semibold">Four evidence levels</h2>
        <p className="mt-1 max-w-[68ch] text-[15px] text-ink-2">A level is never raised: a text-mined claim stays text-mined until a curated source states it too.</p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {LEVELS.map((level) => (
            <li key={level} className="card px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <LevelBadge level={level} />
                {levelCount(level) !== undefined && <span className="tabular text-[13px] text-ink-2">{levelCount(level)!.toLocaleString("en")} edges</span>}
              </div>
              <p className="mt-2 text-[15px]">{LEVEL_INFO[level].meaning}.</p>
              <p className="mt-1 text-[13px] text-ink-2">{LEVEL_SOURCES[level]}.</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="card px-4 py-4">
            <h3 className="text-[17px] font-semibold">Counter-evidence</h3>
            <p className="mt-1 text-[15px] text-ink-2">
              Every edge has a <code className="font-mono text-[13px]">contradicting</code> list. It may be empty, it is never missing. Where two sources disagree, both are shown and the edge is drawn in red
              {levelCount("contradicted") !== undefined && <> ({levelCount("contradicted")!.toLocaleString("en")} edges carry counter-evidence in the current build)</>}.
            </p>
          </div>
          <div className="card px-4 py-4">
            <h3 className="text-[17px] font-semibold">Confidence</h3>
            <p className="mt-1 text-[15px] text-ink-2">
              A number from 0 to 1 per edge and per piece of evidence. It orders what we show; it is not a probability that a diagnosis is right. A link pulled up from a subtype to its parent disease gets the weakest subtype confidence times
              {typeof meta?.parameters?.rollup_confidence_factor === "number" ? ` ${meta.parameters.rollup_confidence_factor}` : " a factor below 1"}, so it is never stronger than its source.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="ai">
        <h2 id="ai" className="text-[22px] font-semibold">Where AI is used</h2>
        <p className="mt-1 max-w-[68ch] text-[15px] text-ink-2">Three places, each marked in the product: Extract, Reconcile and Explain. All three are built on the OpenAI API, with the model for each step set by an environment variable (OPENAI_MODEL_EXTRACT, OPENAI_MODEL_JUDGE, OPENAI_MODEL_EMBED) and checked against the available models before a run. The current data export ran these steps on Claude (Anthropic); every evidence item names the model that produced it. Without any key the app still runs and Explain falls back to template text.</p>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ["Extract", "Pipeline step 05", "Reads PubMed abstracts and returns structured claims (subject, predicate, object, polarity, PMID, quoted sentence). Claims without a quote are dropped. Result level: text-mined."],
            ["Reconcile", "Pipeline step 06", "Matches patient-organisation names and free-text diagnoses to MONDO ids: embeddings propose candidates, a model judges them and gives a reason. Only organisations checked against their own website reach the product."],
            ["Explain", "App, /api/explain", "Turns the edges of an action card into plain language for a family. Every sentence must end with an edge id; a sentence without a valid id is struck out in the interface."],
          ].map(([name, where, text]) => (
            <li key={name} className="card px-4 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-2">{where}</p>
              <h3 className="mt-0.5 text-[17px] font-semibold">{name}</h3>
              <p className="mt-1 text-[16px] text-ink-2">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="quality">
        <h2 id="quality" className="text-[22px] font-semibold">How well it works</h2>
        <p className="mt-1 max-w-[68ch] text-[15px] text-ink-2">Measured numbers only. A value that is not yet measured in this build says so, and what it will measure.</p>
        <div className="mt-4 rounded-[16px] border border-line sm:overflow-x-auto">
          <table className="block w-full text-left text-[15px] sm:table sm:min-w-[560px]">
            <caption className="sr-only">Quality metrics</caption>
            <thead className="sr-only bg-surface-2 text-[12px] uppercase tracking-wide text-ink-2 sm:not-sr-only sm:table-header-group">
              <tr>
                <th scope="col" className="px-4 py-2">Metric</th>
                <th scope="col" className="px-4 py-2">Value</th>
                <th scope="col" className="px-4 py-2">What is measured</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {METRICS.map((row) => {
                const value = state === "ready" ? row.render(metrics) : null;
                return (
                  <tr key={row.key} className="block border-t border-line py-2 align-top first:border-t-0 sm:table-row sm:py-0 sm:first:border-t" data-metric={row.key}>
                    <th scope="row" className="block px-4 pt-1 font-semibold sm:table-cell sm:py-3">{row.label}</th>
                    <td className="block break-words px-4 py-1 sm:table-cell sm:py-3">
                      {value ? <span className="tabular font-semibold">{value}</span> : <span className="rounded-full border border-dashed border-line-strong px-2 py-0.5 text-[12px] font-semibold text-ink-2">{state === "loading" ? "loading" : "not yet measured in this build"}</span>}
                    </td>
                    <td className="block break-words px-4 pb-1 text-ink-2 sm:table-cell sm:py-3">{row.measures}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!!nodes.length && (
          <p className="mt-4 text-[16px] text-ink-2" data-testid="graph-counts">
            Current build{meta ? ` (${meta.version}, ${formatDate(meta.built_at)})` : ""}:{" "}
            {nodes.filter(([k]) => ["disease", "core_disease", "gene", "phenotype"].includes(k)).map(([k, v]) => `${v.toLocaleString("en")} ${k.replace("_", " ")}`).join(", ")}
            {edges.length ? `; edges by type: ${edges.map(([k, v]) => `${k.replaceAll("_", " ")} ${v.toLocaleString("en")}`).join(", ")}` : ""}.
          </p>
        )}
      </section>

      <section aria-labelledby="sources">
        <h2 id="sources" className="text-[22px] font-semibold">Data sources and licences</h2>
        {state === "missing" && <p className="mt-2 text-[15px] text-ink-2">Data status could not be loaded.</p>}
        {!!meta?.sources.length && (
          <div className="mt-4 rounded-[16px] border border-line sm:overflow-x-auto">
            <table className="block w-full text-left text-[15px] sm:table sm:min-w-[560px]">
              <caption className="sr-only">Data sources</caption>
              <thead className="sr-only bg-surface-2 text-[12px] uppercase tracking-wide text-ink-2 sm:not-sr-only sm:table-header-group">
                <tr>
                  <th scope="col" className="px-4 py-2">Source</th>
                  <th scope="col" className="px-4 py-2">Version</th>
                  <th scope="col" className="px-4 py-2">Licence</th>
                </tr>
              </thead>
              <tbody className="block sm:table-row-group">
                {meta.sources.map((s) => (
                  <tr key={s.db} className="block border-t border-line py-1 align-top first:border-t-0 sm:table-row sm:py-0 sm:first:border-t">
                    <th scope="row" className="block px-4 py-0.5 font-semibold sm:table-cell">
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 min-w-11 items-center text-ink underline decoration-line underline-offset-2 hover:decoration-current">{s.db}<span className="sr-only"> (opens in a new tab)</span></a>
                      ) : (
                        s.db
                      )}
                    </th>
                    <td className="block break-words px-4 py-0.5 text-ink-2 sm:table-cell sm:py-2">{s.version ?? "not recorded"}</td>
                    <td className="block break-words px-4 pb-2 text-ink-2 sm:table-cell sm:py-2">{s.license ?? "not recorded"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-[13px] text-ink-2">Constellate is a research-navigation tool, not medical advice. Open studies link to the study&apos;s official contact page; we collect no health data and offer no sign-up.</p>
      </section>
    </div>
  );
}
