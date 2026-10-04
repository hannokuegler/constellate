"use client";

import StartHere from "./next/StartHere";
import SkyBackdrop from "./world/SkyBackdrop";
import ScrollStory from "./world/ScrollStoryLazy";

const STEPS = [
  { title: "Search once", text: "Disease, gene, symptom, synonym or ORPHA/OMIM ID, typos allowed." },
  { title: "See the neighbourhood", text: "Genes, phenotypes and related diseases around one diagnosis." },
  { title: "Open any link", text: "Source record, date, evidence level, confidence and counter-evidence." },
  { title: "Take an action card", text: "What transfers, what differs, what needs experts. Each sentence cites an edge." },
];

/** Start page: the plain entry first (static star field, no WebGL), the scroll story below it as its own lazy chunk. */
export default function StartView() {
  return (
    <div className="relative">
      {/* own stacking context above the story: the search and symptom suggestion lists must overlap the story below */}
      <section className="relative z-10" aria-labelledby="hero-title">
        <SkyBackdrop />
        <div className="relative mx-auto flex min-h-[100svh] max-w-[1400px] flex-col justify-start px-4 pb-10 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] pt-[calc(64px+3svh)] md:px-6 md:pt-[calc(64px+8svh)] lg:justify-center lg:pt-20">
          <StartHere />
        </div>
      </section>

      <ScrollStory />

      <section className="relative mx-auto mt-16 max-w-[960px] px-4" aria-label="How it works">
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card px-4 py-4">
              <span className="zaehler text-[13px] font-semibold text-ink-2">0{i + 1}</span>
              <span className="mt-1 block text-[17px] font-semibold">{step.title}</span>
              <span className="mt-1 block text-[16px] text-ink-2">{step.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
