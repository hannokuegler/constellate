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
    <div className="glass pointer-events-auto w-full max-w-[600px] rounded-[28px] px-5 py-6 shadow-[var(--shadow)] md:px-9 md:py-9">
      <p className="t-label flex items-center gap-2">
        <span className="dot" data-state="lit" style={{ ["--dot-size" as string]: "6px" }} aria-hidden="true" />
        Constellate · research navigation, not medical advice
      </p>
      <h1 id="hero-title" className="mt-4 text-ink" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 48px)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        Your child just got a diagnosis? Start here.
      </h1>
      <p className="t-body mt-4 text-ink-2">
        Type the name of the diagnosis. You will see, in plain words, what you can do now, who you can contact, and where each fact comes from.
      </p>
      <div className="mt-5">
        <SearchBox />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2">
        <span className="text-[15px] text-ink-2">Try:</span>
        {EXAMPLES.map((e) => (
          <Link key={e.id} href={`/d/${e.id}`} className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-surface px-4 text-[15px] font-medium text-ink hover:bg-surface-2">
            {e.label}
          </Link>
        ))}
      </div>
      <div className="mt-5 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => setBySymptom((v) => !v)}
          aria-expanded={bySymptom}
          aria-controls="symptom-search"
          className="inline-flex min-h-11 items-center gap-2 rounded-full text-[17px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current"
        >
          I have a finding or symptom
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={bySymptom ? "rotate-180" : ""}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
        </button>
        <div id="symptom-search" className="mt-3" hidden={!bySymptom}>
          {bySymptom && (
            <>
              <p className="mb-3 text-[15px] text-ink-2">No diagnosis yet, or a word from a doctor&apos;s letter? Search it and see which diseases in our data list it.</p>
              <SymptomSearch autoFocus />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
