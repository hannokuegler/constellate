"use client";

// The start page scroll story ("putting on the lens"), self-contained: its own sticky sky (StoryStage + World),
// one sticky caption, star name pills, and the closing card. It starts with the chapter "lights"; the hero with the
// search box sits above it on the start page. Every number and fact is read at runtime from meta.json, core.json,
// the disease and gene shards and public/world/sky.json. Load it through ScrollStoryLazy (next/dynamic, ssr: false).

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { loadCore, loadDisease, loadGene, loadIndexMap, loadMeta } from "@/lib/data";
import { diseaseHref } from "@/lib/ids";
import { metaCount, v2Therapies } from "@/lib/normalize";
import type { Meta } from "@/lib/types";
import SearchBox from "../SearchBox";
import StoryStage, { type StarLabel } from "./StoryStage";
import { constellationOf, onSkyReady, skyBus, KIND, type Sky } from "./sky";
import { STORY_GAP, STORY_HEIGHTS, STORY_KRABBE, STORY_MLD, type ChapterId } from "./story";
import { TOUR_HERO_START, tourHref } from "./tour";

/** star names in the story, only in the chapters that talk about them */
const STAR_LABELS: StarLabel[] = [
  { id: STORY_KRABBE, text: "Krabbe disease", chapters: ["krabbe", "constellation", "neighbour", "gap"] },
  { id: "GALC", text: "GALC", chapters: ["constellation"] },
  { id: "PSAP", text: "PSAP", chapters: ["constellation"] },
  { id: STORY_MLD, text: "metachromatic leukodystrophy", chapters: ["neighbour"] },
  { id: STORY_GAP, text: "Krabbe disease due to saposin A deficiency", chapters: ["gap"] },
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

interface StoryFacts {
  krabbe?: TherapyFact;
  mld?: TherapyFact;
  gap?: TherapyFact;
  psapNames?: number;
  /** id of the Krabbe -> MLD neighbour edge, read from the Krabbe shard */
  mldEdge?: string;
}

/** what the story may say, only from the shards: approved therapies (or the searched absence), PSAP disease names */
function useStoryFacts(): StoryFacts {
  const [facts, setFacts] = useState<StoryFacts>({});
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
    const mldEdge = async () => {
      // the neighbour edge Krabbe <-> MLD, from either shard; none found: the caption names no id
      const fromKrabbe = (await loadDisease(STORY_KRABBE).catch(() => null))?.neighbours.find((n) => n.id === STORY_MLD)?.edge.id;
      if (fromKrabbe) return fromKrabbe;
      return (await loadDisease(STORY_MLD).catch(() => null))?.neighbours.find((n) => n.id === STORY_KRABBE)?.edge.id;
    };
    const psapNames = async () => {
      // the gene page's own grouping rule, loaded lazily so the story chunk stays small
      const [gene, index, { familyName }] = await Promise.all([loadGene("PSAP").catch(() => null), loadIndexMap().catch(() => null), import("../GeneView")]);
      if (!gene || !index) return undefined;
      // same counting as the gene page: causal, non-rolled-up edges, grouped by family name
      const causal = gene.diseases.filter((e) => e.type === "caused_by" && e.evidence.length && !e.rolled_up_from?.length);
      return new Set(causal.map((e) => familyName(index.get(e.source)?.label ?? e.source).toLowerCase())).size;
    };
    Promise.all([therapy(STORY_KRABBE), therapy(STORY_MLD), therapy(STORY_GAP), psapNames().catch(() => undefined), mldEdge()]).then(
      ([krabbe, mld, gap, names, edge]) => {
        if (!cancelled) setFacts({ krabbe, mld, gap, psapNames: names, mldEdge: edge });
      },
      () => undefined,
    );
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

/** one story chapter: an empty block that scrolls over the sticky sky; its caption lives in the stage's single box */
function Chapter({ id }: { id: ChapterId }) {
  return <div data-chapter={id} className="pointer-events-none relative" style={{ minHeight: `${STORY_HEIGHTS[id] ?? 80}svh` }} />;
}

function Caption({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <>
      <h2 className="text-ink" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 40px)", lineHeight: 1.12, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      {children && <div className="mt-3 text-[17px] leading-relaxed text-ink-2">{children}</div>}
    </>
  );
}

function EdgeId({ id }: { id?: string }) {
  return id ? <span className="t-mono">{id}</span> : null;
}

export default function ScrollStory({ underHeader = false }: { underHeader?: boolean }) {
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
  const krabbeNone = facts.krabbe && facts.krabbe.items.length === 0 && facts.krabbe.authorities && facts.krabbe.asOf ? facts.krabbe : null;
  const gapNone = facts.gap && facts.gap.items.length === 0 && facts.gap.authorities && facts.gap.asOf ? facts.gap : null;

  const captions: Partial<Record<ChapterId, ReactNode>> = {
    lights: (
      <Caption title="Every light is a real rare disease, gene or symptom.">
        <p className="zaehler">{counts.length ? counts.join(" · ") : " "}</p>
      </Caption>
    ),
    lens: (
      <Caption title="Put on the lens.">
        <p>Inside it the lights connect. Every line is a documented link: a shared gene, or an overlap of symptoms, each with its source.</p>
      </Caption>
    ),
    wearing: (
      <Caption title="You are wearing the lens.">
        <p className="zaehler">
          {sky ? `${fmt(sky.file.counts.core_edges)} mapped links, each with its source, date and evidence level.` : "Every mapped link carries its source, date and evidence level."}
        </p>
      </Caption>
    ),
    krabbe: (
      <Caption title="Krabbe disease">
        {krabbeNone ? (
          <p>
            No approved therapy found in {krabbeNone.authorities} records, as of {krabbeNone.asOf}.
          </p>
        ) : (
          <p className="t-mono">{STORY_KRABBE}</p>
        )}
      </Caption>
    ),
    constellation: (
      <Caption title={facts.psapNames ? `PSAP: one gene, ${facts.psapNames} disease names.` : "Its genes: GALC and PSAP."}>
        {krabbeNeighbours !== null && (
          <p>Krabbe disease lights up with its genes GALC and PSAP and {krabbeNeighbours} related diseases that share a gene or symptoms.</p>
        )}
      </Caption>
    ),
    neighbour: mldTherapy ? (
      <Caption title="Its neighbour, metachromatic leukodystrophy, has an approved gene therapy.">
        <p className="text-ink">Approved for metachromatic leukodystrophy, not for Krabbe disease. What carries over needs expert review.</p>
        <p className="mt-1">
          {mldTherapy.label}
          {mldTherapy.authority ? ` · ${mldTherapy.authority}` : ""}
          {mldTherapy.approved ? ` · approved ${mldTherapy.approved}` : ""}
          {mldTherapy.record ? ` · ${mldTherapy.record}` : ""}
          {facts.mldEdge && (
            <>
              {" · link "}
              <EdgeId id={facts.mldEdge} />
            </>
          )}
        </p>
      </Caption>
    ) : (
      <Caption title="Its neighbour: metachromatic leukodystrophy.">
        <p>
          Linked by shared symptoms{facts.mldEdge ? ", " : "."}
          {facts.mldEdge && (
            <>
              <EdgeId id={facts.mldEdge} />.
            </>
          )}
        </p>
      </Caption>
    ),
    gap: (
      <Caption title="Where there is no trail, we say so.">
        <p>
          Krabbe disease due to saposin A deficiency
          {gapNone ? `: no approved therapy found in ${gapNone.authorities} records, as of ${gapNone.asOf}.` : "."}{" "}
          <Link href={`${diseaseHref(STORY_GAP)}#patient-organisations`} className="inline-flex min-h-11 items-center text-ink underline underline-offset-2">
            See what was searched
          </Link>
        </p>
      </Caption>
    ),
  };

  return (
    <div className="relative">
      <Suspense fallback={null}>
        <TourFocus />
      </Suspense>

      <StoryStage onSky={setSky} captions={captions} labels={STAR_LABELS} underHeader={underHeader}>
        <div id="story-lights" />
        <Chapter id="lights" />
        <Chapter id="lens" />
        <Chapter id="wearing" />
        <Chapter id="krabbe" />
        <Chapter id="constellation" />
        <Chapter id="neighbour" />
        <Chapter id="gap" />

        {/* end: search again, Krabbe, the guided tour */}
        <div
          data-chapter="end"
          className="pointer-events-none relative flex items-end px-4 pb-[12svh] pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] lg:px-10"
          style={{ minHeight: `${STORY_HEIGHTS.end ?? 110}svh` }}
        >
          <div className="glass pointer-events-auto w-full max-w-[640px] rounded-[28px] px-5 py-6 shadow-[var(--shadow)] md:px-9 md:py-8">
            <h2 className="t-h1 text-ink">Find your own light.</h2>
            <div className="mt-5">
              <SearchBox label="Search for a diagnosis, gene or symptom" />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href={tourHref(diseaseHref(heroId), 2)} className="btn-primary">
                Take the guided tour
              </Link>
              <Link href={diseaseHref(heroId)} className="btn-secondary">
                Start with Krabbe disease
              </Link>
            </div>
            <p className="zaehler mt-5 text-[15px] text-ink-2">{counts.length ? counts.join(" · ") : " "}</p>
            <p className="mt-2 text-[13px] text-ink-2">Research navigation, not medical advice.</p>
          </div>
        </div>
      </StoryStage>
    </div>
  );
}
