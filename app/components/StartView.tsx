"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { loadCore, loadDisease, loadGene, loadIndexMap, loadMeta } from "@/lib/data";
import { diseaseHref } from "@/lib/ids";
import { metaCount, v2Therapies } from "@/lib/normalize";
import type { Meta } from "@/lib/types";
import SearchBox from "./SearchBox";
import StartHere from "./next/StartHere";
import StoryStage from "./world/StoryStage";
import { constellationOf, onSkyReady, skyBus, KIND, type Sky } from "./world/sky";
import { STORY_GAP, STORY_KRABBE, STORY_MLD, type ChapterId } from "./world/story";
import { TOUR_HERO_START, tourHref } from "./world/tour";

const STEPS = [
  { title: "Search once", text: "Disease, gene, symptom, synonym or ORPHA/OMIM ID, typos allowed." },
  { title: "See the neighbourhood", text: "Genes, phenotypes and related diseases around one diagnosis." },
  { title: "Open any link", text: "Source record, date, evidence level, confidence and counter-evidence." },
  { title: "Take an action card", text: "What transfers, what differs, what needs experts. Each sentence cites an edge." },
];

const fmt = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString("en") : null);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** 2026-10-03 -> 3 Oct 2026 */
function day(value: string | null | undefined): string | null {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : null;
}

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

interface TherapyFact {
  /** "EMA or FDA" from the searched sources, null when the shard did not say what was searched */
  authorities: string | null;
  asOf: string | null;
  items: { label: string; authority: string | null; approved: string | null; record: string | null }[];
}

/** what the story may say, only from the shards: approved therapies (or the searched absence), PSAP disease names */
function useStoryFacts() {
  const [facts, setFacts] = useState<{ krabbe?: TherapyFact; mld?: TherapyFact; gap?: TherapyFact; psapNames?: number }>({});
  useEffect(() => {
    let cancelled = false;
    const therapy = async (id: string): Promise<TherapyFact | undefined> => {
      const file = await loadDisease(id).catch(() => null);
      if (!file) return undefined;
      const read = v2Therapies(file);
      if (!read.present) return undefined;
      const names = [...new Set(read.searched.map((s) => (/^EMA/i.test(s.source) ? "EMA" : /FDA/i.test(s.source) ? "FDA" : null)).filter(Boolean))];
      const dates = read.searched.map((s) => (s as { retrieved?: string }).retrieved).filter(Boolean).sort() as string[];
      return {
        authorities: names.length ? names.join(" or ") : null,
        asOf: day(dates[dates.length - 1]),
        items: read.items.map((it) => ({
          label: it.node.label,
          authority: it.node.authority ?? it.edge.evidence[0]?.db ?? null,
          approved: day(it.node.approved ?? it.edge.evidence[0]?.date),
          record: it.edge.evidence[0]?.record ?? null,
        })),
      };
    };
    const psapNames = async () => {
      // the gene page's own grouping rule, loaded lazily so the start page bundle stays small
      const [gene, index, { familyName }] = await Promise.all([loadGene("PSAP").catch(() => null), loadIndexMap().catch(() => null), import("./GeneView")]);
      if (!gene || !index) return undefined;
      // same counting as the gene page: causal, non-rolled-up edges, grouped by family name
      const causal = gene.diseases.filter((e) => e.type === "caused_by" && e.evidence.length && !e.rolled_up_from?.length);
      return new Set(causal.map((e) => familyName(index.get(e.source)?.label ?? e.source).toLowerCase())).size;
    };
    Promise.all([therapy(STORY_KRABBE), therapy(STORY_MLD), therapy(STORY_GAP), psapNames()]).then(([krabbe, mld, gap, names]) => {
      if (!cancelled) setFacts({ krabbe, mld, gap, psapNames: names });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return facts;
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

/** one story chapter: a block that scrolls over the sticky sky, with a glass caption bottom-left */
function Chapter({ id, height, children }: { id: ChapterId; height: string; children?: ReactNode }) {
  return (
    <div data-chapter={id} className="pointer-events-none relative" style={{ minHeight: height }}>
      {children && (
        <div className="sticky top-[52svh] mt-[52svh] px-4 pb-6 pl-[max(16px,env(safe-area-inset-left))] lg:px-10">
          <div className="glass pointer-events-auto w-full max-w-[640px] rounded-[24px] px-5 py-5 shadow-[var(--shadow)] md:px-8 md:py-7">{children}</div>
        </div>
      )}
    </div>
  );
}

function Caption({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <>
      <h2 className="text-ink" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.4vw, 44px)", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      {children && <div className="mt-3 text-[15px] leading-relaxed text-ink-2 md:text-[17px]">{children}</div>}
    </>
  );
}

export default function StartView() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [sky, setSky] = useState<Sky | null>(null);
  useEffect(() => {
    loadMeta().then(setMeta, () => setMeta(null));
  }, []);
  const lonely = useLonelyCount(meta, sky);
  const facts = useStoryFacts();
  const heroId = meta?.hero.start ?? TOUR_HERO_START;

  const counts = meta
    ? [
        fmt(metaCount(meta, "diseases")) && `${fmt(metaCount(meta, "diseases"))} diseases`,
        fmt(metaCount(meta, "genes")) && `${fmt(metaCount(meta, "genes"))} genes`,
        fmt(metaCount(meta, "phenotypes")) && `${fmt(metaCount(meta, "phenotypes"))} symptoms`,
        lonely !== null && `${fmt(lonely)} still without a mapped neighbour`,
      ].filter(Boolean)
    : [];

  // Krabbe's lit neighbourhood, counted from the sky (the same constellation the renderer lights)
  const krabbeIndex = sky?.indexById.get(STORY_KRABBE);
  const krabbeNeighbours =
    sky && krabbeIndex !== undefined
      ? [...constellationOf(sky, krabbeIndex).stars.entries()].filter(([i, s]) => s.hop === 1 && sky.kind[i] !== KIND.gene).length
      : null;
  const mldTherapy = facts.mld?.items[0];

  return (
    <div className="relative">
      <Suspense fallback={null}>
        <TourFocus />
      </Suspense>

      <StoryStage onSky={setSky}>
        {/* 0 hero: the sky out of focus, search right away */}
        <div data-chapter="hero" className="pointer-events-none relative">
          <div className="mx-auto flex min-h-[100svh] max-w-[1400px] flex-col justify-start px-4 pb-10 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] pt-[calc(64px+3svh)] md:px-6 md:pt-[calc(64px+8svh)] lg:justify-center lg:pt-20">
            <StartHere />
          </div>
        </div>

        <div id="story-lights" />
        <Chapter id="lights" height="80svh">
          <Caption title="Every light is a real rare disease, gene or symptom.">
            <p className="zaehler">{counts.length ? counts.join(" · ") : " "}</p>
          </Caption>
        </Chapter>

        <Chapter id="lens" height="120svh">
          <Caption title="Put on the lens.">
            <p>Inside it the lights connect. Every line is a documented link: a shared gene, or an overlap of symptoms, each with its source.</p>
          </Caption>
        </Chapter>

        <Chapter id="wearing" height="100svh">
          <Caption title="You are wearing the lens.">
            {sky && <p className="zaehler">{fmt(sky.file.counts.core_edges)} mapped links, each with its source, date and evidence level.</p>}
          </Caption>
        </Chapter>

        <Chapter id="krabbe" height="90svh">
          <Caption title="Krabbe disease">
            {facts.krabbe && facts.krabbe.items.length === 0 && facts.krabbe.authorities && facts.krabbe.asOf ? (
              <p>
                No approved therapy found in {facts.krabbe.authorities} records, as of {facts.krabbe.asOf}.
              </p>
            ) : (
              <p className="t-mono">MONDO:0009499</p>
            )}
          </Caption>
        </Chapter>

        <Chapter id="constellation" height="80svh">
          <Caption title={facts.psapNames ? `PSAP: one gene, ${facts.psapNames} disease names.` : "Its genes: GALC and PSAP."}>
            {krabbeNeighbours !== null && (
              <p>Krabbe disease lights up with its genes GALC and PSAP and {krabbeNeighbours} related diseases that share a gene or symptoms.</p>
            )}
          </Caption>
        </Chapter>

        <Chapter id="neighbour" height="80svh">
          {mldTherapy ? (
            <Caption title="Its neighbour, metachromatic leukodystrophy, has an approved gene therapy.">
              <p className="text-[13px] md:text-[15px]">
                {mldTherapy.label}
                {mldTherapy.authority ? ` · ${mldTherapy.authority}` : ""}
                {mldTherapy.approved ? ` · approved ${mldTherapy.approved}` : ""}
                {mldTherapy.record ? ` · ${mldTherapy.record}` : ""} · link <span className="t-mono">e_e270315fe572</span>
              </p>
            </Caption>
          ) : (
            <Caption title="Its neighbour: metachromatic leukodystrophy.">
              <p>
                Linked by shared symptoms, <span className="t-mono">e_e270315fe572</span>.
              </p>
            </Caption>
          )}
        </Chapter>

        <Chapter id="gap" height="90svh">
          <Caption title="Where there is no trail, we say so.">
            <p>
              Krabbe disease due to saposin A deficiency
              {facts.gap && facts.gap.items.length === 0 && facts.gap.authorities && facts.gap.asOf
                ? `: no approved therapy found in ${facts.gap.authorities} records, as of ${facts.gap.asOf}.`
                : "."}{" "}
              <Link href="/d/MONDO_0012720#patient-organisations" className="inline-flex min-h-11 items-center underline underline-offset-2">
                See what was searched
              </Link>
            </p>
          </Caption>
        </Chapter>

        {/* 8 end: search again, Krabbe, the guided tour */}
        <div data-chapter="end" className="pointer-events-none relative flex min-h-[110svh] items-end px-4 pb-[12svh] pl-[max(16px,env(safe-area-inset-left))] lg:px-10">
          <div className="glass pointer-events-auto w-full max-w-[640px] rounded-[28px] px-5 py-6 shadow-[var(--shadow)] md:px-9 md:py-8">
            <h2 className="t-h1 text-ink">Find your own light.</h2>
            <div className="mt-5">
              <SearchBox label="Search for a diagnosis, gene or symptom" />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href={tourHref("/d/MONDO_0009499", 2)} className="btn-primary">
                Take the guided tour
              </Link>
              <Link href={diseaseHref(heroId)} className="btn-secondary">
                Start with Krabbe disease
              </Link>
            </div>
            <p className="zaehler mt-5 text-[13px] text-ink-2">{counts.length ? counts.join(" · ") : " "}</p>
          </div>
        </div>
      </StoryStage>

      <section className="relative mx-auto mt-16 max-w-[960px]" aria-label="How it works">
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

    </div>
  );
}
