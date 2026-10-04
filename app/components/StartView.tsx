"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadMeta } from "@/lib/data";
import { diseaseHref } from "@/lib/ids";
import { PERSONAS } from "@/lib/persona";
import type { Meta } from "@/lib/types";
import { usePrefs } from "./Providers";
import SearchBox from "./SearchBox";
import { Logo } from "./Header";
import DataFooter from "./DataFooter";

const STEPS = [
  { title: "Search once", text: "Disease, gene, symptom, synonym or ORPHA/OMIM ID, typos allowed." },
  { title: "See the neighbourhood", text: "Genes, phenotypes and related diseases around one diagnosis." },
  { title: "Open any link", text: "Source record, date, evidence level, confidence and counter-evidence." },
  { title: "Take an action card", text: "What transfers, what differs, what needs experts. Each sentence cites an edge." },
];

export default function StartView() {
  const { persona, setPersona } = usePrefs();
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    loadMeta().then(setMeta, () => setMeta(null));
  }, []);
  const heroId = meta?.hero.start ?? "MONDO:0009499";
  const moments = PERSONAS.filter((p) => p.moment);
  const others = PERSONAS.filter((p) => !p.moment);

  return (
    <div className="relative">
      <div className="starfield pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden="true" />
      <section className="relative mx-auto max-w-[760px] pt-12 text-center md:pt-20">
        <div className="mx-auto mb-5 w-fit"><Logo size={48} /></div>
        <h1 className="text-[28px] font-bold tracking-tight md:text-[40px]">Constellate</h1>
        <p className="mx-auto mt-3 max-w-[560px] text-[17px] text-ink-2">
          A map of rare diseases organised by shared genes and phenotypes instead of names. Every link shows where it comes from and how strong it is.
        </p>
        <div className="mt-8 text-left">
          <SearchBox />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={diseaseHref(heroId)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-accent-ink transition-transform hover:-translate-y-0.5"
          >
            Start with Krabbe disease
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7h8M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
          </Link>
          <Link href="/g/PSAP" className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-5 text-[15px] font-medium">
            One gene, several names: PSAP
          </Link>
          <Link href="/intro" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-5 text-[15px] font-medium">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor" /></svg>
            Watch Maria&apos;s story
          </Link>
        </div>
      </section>

      <section className="relative mx-auto mt-14 max-w-[960px]" aria-labelledby="persona-title">
        <h2 id="persona-title" className="text-center text-[13px] font-semibold uppercase tracking-wide text-ink-2">
          Where are you right now?
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" role="radiogroup" aria-labelledby="persona-title">
          {moments.map((p) => {
            const selected = p.id === persona.id;
            return (
              <button
                key={p.id}
                role="radio"
                aria-checked={selected}
                onClick={() => setPersona(p.id)}
                className={`card min-h-11 px-5 py-5 text-left transition-colors ${selected ? "border-accent ring-2 ring-accent/30" : "hover:border-ink-2/40"}`}
              >
                <span className="block text-[12px] font-semibold uppercase tracking-wide text-accent">{p.moment!.step}</span>
                <span className="mt-1 block text-[20px] font-bold tracking-tight">{p.moment!.title}</span>
                <span className="mt-2 block text-[15px] text-ink-2">{p.moment!.text}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[13px]" role="radiogroup" aria-label="Other lenses">
          <span className="text-ink-2">Other lenses, same data:</span>
          {others.map((p) => (
            <button
              key={p.id}
              role="radio"
              aria-checked={p.id === persona.id}
              onClick={() => setPersona(p.id)}
              className={`min-h-11 rounded-full border px-3 ${p.id === persona.id ? "border-accent font-semibold text-accent" : "border-line text-ink-2 hover:text-ink"}`}
              title={p.goal}
            >
              {p.name} · {p.role}
            </button>
          ))}
        </div>
      </section>

      <section className="relative mx-auto mt-12 max-w-[960px]" aria-label="How it works">
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card px-4 py-4">
              <span className="tabular text-[12px] font-semibold text-accent">0{i + 1}</span>
              <span className="mt-1 block text-[15px] font-semibold">{step.title}</span>
              <span className="mt-1 block text-[13px] text-ink-2">{step.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <DataFooter meta={meta} />
    </div>
  );
}
