"use client";

import Link from "next/link";
import { useState } from "react";
import SearchBox from "../SearchBox";
import SymptomSearch from "./SymptomSearch";

/** Two diagnoses to try with one tap (MONDO labels, as in the search index). */
const EXAMPLES = [
  { id: "MONDO_0009499", label: "Krabbe disease" },
  { id: "MONDO_0018868", label: "metachromatic leukodystrophy" },
];

/** First screen of the start page: one calm sentence, the diagnosis search, two examples and a way in by symptom. */
export default function StartHere() {
  const [bySymptom, setBySymptom] = useState(false);
  return (
    <div className="w-full">
      <p className="text-center">
        <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-[16px] font-semibold text-accent">Constellate · research navigation, not medical advice</span>
      </p>
      <h1 id="hero-title" className="mt-4 text-center text-[28px] font-bold leading-tight tracking-tight text-ink md:text-[40px]">
        Just received a rare diagnosis? Start here.
      </h1>
      <p className="mx-auto mt-3 max-w-[560px] text-center text-[17px] text-ink-2">
        Type the name of the diagnosis. You will see, in plain words, what you can do now, who you can contact, and where each fact comes from.
      </p>
      <div className="mt-8 text-left">
        <SearchBox />
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
        <span className="text-[16px] text-ink-2">Try:</span>
        {EXAMPLES.map((e) => (
          <Link key={e.id} href={`/d/${e.id}`} className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-5 text-[16px] font-medium text-ink hover:bg-surface-2">
            {e.label}
          </Link>
        ))}
      </div>
      <p className="mt-2 text-center">
        <Link href="/intro" className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[16px] font-medium text-accent hover:underline">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor" /></svg>
          Watch Maria&apos;s story, one minute
        </Link>
      </p>
      <div className="card mt-6 px-5 py-4">
        <button
          type="button"
          onClick={() => setBySymptom((v) => !v)}
          aria-expanded={bySymptom}
          aria-controls="symptom-search"
          className="inline-flex min-h-11 items-center gap-2 rounded-full text-[17px] font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-current"
        >
          I have a finding or symptom
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={bySymptom ? "rotate-180" : ""}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
        </button>
        <div id="symptom-search" className="mt-3" hidden={!bySymptom}>
          {bySymptom && (
            <>
              <p className="mb-3 text-[16px] text-ink-2">No diagnosis yet, or a word from a doctor&apos;s letter? Search it and see which diseases in our data list it.</p>
              <SymptomSearch autoFocus />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
