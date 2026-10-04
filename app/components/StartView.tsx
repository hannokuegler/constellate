"use client";

import StartHere from "./next/StartHere";
import { Logo } from "./Header";

const STEPS = [
  { title: "Search once", text: "Disease, gene, symptom, synonym or ORPHA/OMIM ID, typos allowed." },
  { title: "See the neighbourhood", text: "Genes, phenotypes and related diseases around one diagnosis." },
  { title: "Open any link", text: "Source record, date, evidence level, confidence and counter-evidence." },
  { title: "Take an action card", text: "What transfers, what differs, what needs experts. Each sentence cites an edge." },
];

/** Start page: the plain entry (one sentence, search, examples, a way in by symptom), then how it works. */
export default function StartView() {
  return (
    <div className="relative">
      <div className="starfield pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden="true" />
      {/* own stacking context: the search and symptom suggestion lists must overlap the section below */}
      <section className="relative z-10 mx-auto max-w-[760px] pt-10 md:pt-16" aria-labelledby="hero-title">
        <div className="mx-auto mb-5 w-fit"><Logo size={48} /></div>
        <StartHere />
      </section>

      <section className="relative mx-auto mt-12 max-w-[960px]" aria-label="How it works">
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card px-4 py-4">
              <span className="tabular text-[13px] font-semibold text-accent">0{i + 1}</span>
              <span className="mt-1 block text-[17px] font-semibold">{step.title}</span>
              <span className="mt-1 block text-[16px] text-ink-2">{step.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
