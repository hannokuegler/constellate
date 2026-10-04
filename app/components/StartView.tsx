"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { loadCore, loadMeta } from "@/lib/data";
import { diseaseHref } from "@/lib/ids";
import { metaCount } from "@/lib/normalize";
import { PERSONAS } from "@/lib/persona";
import type { Meta } from "@/lib/types";
import { usePrefs } from "./Providers";
import SearchBox from "./SearchBox";
import DataFooter from "./DataFooter";
import World from "./world/World";
import { onSkyReady, skyBus, type Sky } from "./world/sky";
import { TOUR_HERO_START, tourHref } from "./world/tour";

const STEPS = [
  { title: "Search once", text: "Disease, gene, symptom, synonym or ORPHA/OMIM ID, typos allowed." },
  { title: "See the neighbourhood", text: "Genes, phenotypes and related diseases around one diagnosis." },
  { title: "Open any link", text: "Source record, date, evidence level, confidence and counter-evidence." },
  { title: "Take an action card", text: "What transfers, what differs, what needs experts. Each sentence cites an edge." },
];

const fmt = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString("en") : null);

/** diseases in core.json without a single core edge, counted at runtime (sky.json carries the same count per data version) */
function useLonelyCount(meta: Meta | null, sky: Sky | null): number | null {
  const [fromCore, setFromCore] = useState<number | null>(null);
  const skyMatches = !!sky && !!meta && sky.file.data_version === meta.version;
  useEffect(() => {
    if (!meta || !sky || skyMatches) return;
    // sky built from another data version: count from core.json itself
    loadCore().then((core) => {
      if (!core) return;
      const linked = new Set<string>();
      for (const e of core.edges) {
        linked.add(e.source);
        linked.add(e.target);
      }
      setFromCore(core.nodes.filter((n) => n.type === "disease" && !linked.has(n.id)).length);
    }, () => undefined);
  }, [meta, sky, skyMatches]);
  return skyMatches ? sky!.file.counts.without_neighbour : fromCore;
}

/** ?tour=hero&step=1 on the start page: the camera flies to Krabbe and its constellation lights up */
function TourFocus() {
  const params = useSearchParams();
  const active = params.get("tour") === "hero" && (params.get("step") ?? "1") === "1";
  useEffect(() => {
    if (!active) return;
    return onSkyReady(() => void skyBus.flyTo(TOUR_HERO_START));
  }, [active]);
  return null;
}

export default function StartView() {
  const { persona, setPersona } = usePrefs();
  const router = useRouter();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [sky, setSky] = useState<Sky | null>(null);
  useEffect(() => {
    loadMeta().then(setMeta, () => setMeta(null));
  }, []);
  const lonely = useLonelyCount(meta, sky);
  const heroId = meta?.hero.start ?? TOUR_HERO_START;
  const moments = PERSONAS.filter((p) => p.moment);
  const others = PERSONAS.filter((p) => !p.moment);

  const counts = meta
    ? [
        fmt(metaCount(meta, "diseases")) && `${fmt(metaCount(meta, "diseases"))} diseases`,
        fmt(metaCount(meta, "genes")) && `${fmt(metaCount(meta, "genes"))} genes`,
        fmt(metaCount(meta, "phenotypes")) && `${fmt(metaCount(meta, "phenotypes"))} symptoms`,
        lonely !== null && `${fmt(lonely)} still without a mapped neighbour`,
      ].filter(Boolean)
    : [];

  const startTour = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    router.push(tourHref("/", 1), { scroll: false });
    void skyBus.flyTo(TOUR_HERO_START);
  };

  return (
    <div className="relative">
      <Suspense fallback={null}>
        <TourFocus />
      </Suspense>

      {/* full-bleed sky, pulled up under the glass header */}
      <section
        aria-labelledby="hero-title"
        className="relative left-1/2 -mt-16 w-screen -translate-x-1/2 overflow-hidden"
      >
        <World onSky={setSky} />
        <div className="pointer-events-none relative z-[1] mx-auto flex min-h-[calc(100svh-24px)] max-w-[1400px] flex-col justify-start px-4 pb-10 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] pt-[calc(64px+22svh)] md:justify-center md:px-6 md:pt-20">
          <div className="glass pointer-events-auto w-full max-w-[580px] rounded-[28px] px-5 py-6 shadow-[var(--shadow)] md:px-9 md:py-9">
            <p className="t-label flex items-center gap-2">
              <span className="dot" data-state="lit" style={{ ["--dot-size" as string]: "6px" }} aria-hidden="true" />
              Constellate · research navigation, not medical advice
            </p>
            <h1 id="hero-title" className="t-hero mt-4 text-ink">
              Your family is not the first.
            </h1>
            <p className="t-body mt-4 text-ink-2">
              Every star here is a real disease, gene or symptom. Every line is a documented link with its source. Search your diagnosis and see who
              shares its genes and symptoms.
            </p>
            <div className="mt-6">
              <SearchBox />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href={diseaseHref(heroId)} className="btn-primary">
                Start with Krabbe disease
              </Link>
              <Link href={tourHref("/", 1)} onClick={startTour} className="btn-secondary">
                Take the guided tour
              </Link>
            </div>
            <p className="zaehler mt-6 text-[13px] leading-relaxed text-ink-2" aria-live="polite">
              {counts.length ? counts.join(" · ") : " "}
            </p>
          </div>
          <SkyLegend />
        </div>
      </section>

      <section className="relative mx-auto mt-16 max-w-[960px]" aria-labelledby="persona-title">
        <h2 id="persona-title" className="t-h2 text-center">
          Where are you right now?
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2" role="radiogroup" aria-labelledby="persona-title">
          {moments.map((p) => {
            const selected = p.id === persona.id;
            return (
              <button
                key={p.id}
                role="radio"
                aria-checked={selected}
                onClick={() => setPersona(p.id)}
                className={`card min-h-11 px-5 py-5 text-left transition-colors ${selected ? "border-[color:var(--amber)] ring-2 ring-[color:var(--amber-soft)]" : "hover:border-ink-2/40"}`}
              >
                <span className="t-label block">{p.moment!.step}</span>
                <span className="t-h2 mt-1 block text-ink">{p.moment!.title}</span>
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
              className={`min-h-11 rounded-full border px-3 ${p.id === persona.id ? "border-[color:var(--amber)] font-semibold text-ink" : "border-line text-ink-2 hover:text-ink"}`}
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
              <span className="zaehler text-[12px] font-semibold text-ink-2">0{i + 1}</span>
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

/** what the points mean: type by size and brightness, never by hue (DESIGN.md §4) */
function SkyLegend() {
  return (
    <ul
      aria-label="How to read the sky"
      className="glass pointer-events-auto mt-4 flex w-full max-w-[580px] flex-wrap gap-x-4 gap-y-1 rounded-[16px] px-4 py-2 text-[12px] text-ink-2 md:absolute md:right-6 md:top-[84px] md:mt-0 md:w-auto md:max-w-none"
    >
      <li className="flex min-h-7 items-center gap-2">
        <span className="inline-block h-[7px] w-[7px] rounded-full bg-[color:var(--star)]" aria-hidden="true" /> disease
      </li>
      <li className="flex min-h-7 items-center gap-2">
        <span className="inline-block h-[5px] w-[5px] rounded-full bg-[color:var(--star)] opacity-90" aria-hidden="true" /> gene
      </li>
      <li className="flex min-h-7 items-center gap-2">
        <span className="inline-block h-[3px] w-[3px] rounded-full bg-[color:var(--star-dim)]" aria-hidden="true" /> symptom
      </li>
      <li className="flex min-h-7 items-center gap-2">
        <span className="dot-ring" style={{ ["--ring-size" as string]: "9px" }} aria-hidden="true" /> outer ring: no mapped neighbour yet
      </li>
      <li className="flex min-h-7 items-center gap-2">
        <span className="inline-block h-[7px] w-[7px] rounded-full bg-[color:var(--amber)]" aria-hidden="true" /> you are here
      </li>
    </ul>
  );
}
