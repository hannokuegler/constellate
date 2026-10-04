"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { diseaseHref, toFileKey } from "@/lib/ids";
import {
  KIND_LABEL,
  atlasRoute,
  buildRoute,
  fmtX,
  speedup,
  topLever,
  total,
  validateNext,
  type Range,
  type Step,
  type TenxDisease,
  type TenxFile,
} from "@/lib/tenx";
import { useEdgePanel } from "./Providers";

const HERO = "MONDO:0009499";
// Krabbe (its own registry), saposin A deficiency (found only through the shared gene PSAP), MLD, Pelizaeus-Merzbacher
const QUICK = ["MONDO:0009499", "MONDO:0012720", "MONDO:0018868", "MONDO:0010714"];

let tenxRequest: Promise<TenxFile | null> | null = null;
const loadTenx = () =>
  (tenxRequest ??= fetch("/impact/tenx.json")
    .then((r) => (r.ok ? (r.json() as Promise<TenxFile>) : null))
    .catch(() => {
      tenxRequest = null;
      return null;
    }));

const KIND_STYLE: Record<Step["kind"], string> = {
  atlas: "bg-accent-soft text-accent",
  published: "bg-ok-soft text-ok",
  anchored: "bg-ok-soft text-ok",
  assumption: "bg-warn-soft text-warn",
};

export default function TenXView({ initial }: { initial: string | null }) {
  const router = useRouter();
  const [file, setFile] = useState<TenxFile | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [id, setId] = useState<string>(initial ?? HERO);
  const [weeks, setWeeks] = useState<Record<string, Range>>({});
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadTenx().then((f) => {
      setFile(f);
      setState(f ? "ready" : "missing");
    });
  }, []);
  // a link to /impact?d=… from this page changes the prop, not the state
  useEffect(() => {
    if (initial) setId(initial);
  }, [initial]);

  const byId = useMemo(() => new Map((file?.diseases ?? []).map((d) => [d.id, d])), [file]);
  const disease = byId.get(id) ?? byId.get(HERO) ?? null;

  const choose = (next: string) => {
    setId(next);
    router.replace(`/impact?d=${toFileKey(next)}`, { scroll: false });
  };

  if (state === "loading") return <p className="mx-auto mt-10 max-w-[960px] text-ink-2">Loading the 10× case…</p>;
  if (state === "missing" || !file || !disease)
    return <p className="mx-auto mt-10 max-w-[960px] text-ink-2">The 10× data is not built yet (scripts/build-tenx.mjs).</p>;

  const build = buildRoute(disease);
  const atlas = atlasRoute(disease);
  const buildT = total(build, weeks);
  const atlasT = total(atlas, weeks);
  const x = atlas.length ? speedup(buildT, atlasT) : null;
  const setStep = (st: Step, key: "lo" | "hi", v: number) =>
    setWeeks((w) => {
      if (!Number.isFinite(v)) return w; // an emptied field keeps the last number until a new one is typed
      const cur = w[st.id] ?? { lo: st.lo, hi: st.hi };
      const next = { ...cur, [key]: Math.max(0, Math.min(260, v)) };
      if (next.lo > next.hi) {
        if (key === "lo") next.hi = next.lo;
        else next.lo = next.hi;
      }
      return { ...w, [st.id]: next };
    });
  const edited = Object.keys(weeks).length > 0;

  return (
    <div className="mx-auto mt-8 max-w-[1040px] space-y-10">
      <header>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">The 10× case</p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight md:text-[32px]">
          {disease.route === "gap" ? (
            <>No reusable study for {disease.label} yet</>
          ) : (
            <>
              A {disease.label} group gets its first family into natural-history data
            </>
          )}
        </h1>
        <p className="mt-2 max-w-[72ch] text-[16px] text-ink-2">
          Milestone: the first family’s data enters a natural-history registry or study, the evidence base that external control arms are built from (Libmeldy for MLD was approved against
          a natural-history cohort, Fumagalli 2022,{" "}
          <a className="underline underline-offset-2" href="https://pubmed.ncbi.nlm.nih.gov/35065785/" target="_blank" rel="noreferrer">
            PMID 35065785
          </a>
          ). We compare building a new registry with the route the atlas finds. Every week is labelled as a figure from the atlas, a published figure or our assumption, and you can change each one.
        </p>
        <DiseasePicker file={file} current={disease.id} onPick={choose} />
      </header>

      <Verdict disease={disease} x={x} buildT={buildT} atlasT={atlasT} lever={topLever(build, atlas, weeks)} />

      <section aria-labelledby="routes" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="routes" className="text-[22px] font-semibold">
            Two routes to the same milestone
          </h2>
          <div className="flex gap-2">
            {edited && (
              <button onClick={() => setWeeks({})} className="min-h-11 rounded-full border border-line px-4 text-[15px] font-medium text-ink-2 hover:text-ink">
                Reset to our numbers
              </button>
            )}
            <button
              onClick={() => setEditing((e) => !e)}
              aria-pressed={editing}
              className={`min-h-11 rounded-full px-4 text-[15px] font-medium ${editing ? "bg-accent text-accent-ink" : "border border-line bg-surface text-ink"}`}
            >
              {editing ? "Done" : "Change the assumptions"}
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <RouteCard title="Usual route: build a new registry" steps={build} t={buildT} weeks={weeks} editing={editing} onSet={setStep} disease={disease} />
          {atlas.length ? (
            <RouteCard
              title={disease.route === "join" ? "Constellate route: join the study that exists" : "Constellate route: extend a study with the same mechanism"}
              steps={atlas}
              t={atlasT}
              weeks={weeks}
              editing={editing}
              onSet={setStep}
              disease={disease}
              accent
            />
          ) : (
            <GapCard disease={disease} />
          )}
        </div>
      </section>

      {disease.asset && (
        <section aria-labelledby="validate" className="card px-5 py-5">
          <h2 id="validate" className="text-[22px] font-semibold">
            What to validate next
          </h2>
          <p className="mt-1 text-[16px] text-ink-2">The speed-up is real only when these are checked with the study team or a clinician. Generated from the record, not written by hand.</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[16px]">
            {validateNext(disease).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {disease.backups.length > 0 && (
            <>
              <h3 className="mt-5 text-[17px] font-semibold">Plan B: other open studies on the same route</h3>
              <ul className="mt-2 divide-y divide-line">
                {disease.backups.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-x-3 py-2 text-[15px]">
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{b.label}</span>
                      <span className="text-ink-2">
                        {" "}
                        · {b.record} · {b.status?.toLowerCase().replaceAll("_", " ")}
                        {b.end ? ` · registered end ${b.end}` : ""}
                        {b.via ? ` · via ${b.via.label}` : ""}
                        {b.named_by > 3 ? ` · names ${b.named_by} diseases` : ""}
                      </span>
                    </span>
                    <EvidenceLink edge={b.edge} disease={disease} label={b.label} sourceLabel={b.via?.label ?? disease.label} />
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {disease.asset.contact_url && (
              <a
                href={disease.asset.contact_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-[15px] font-semibold text-accent-ink"
              >
                This week: contact the {disease.asset.record} study team
              </a>
            )}
            <Link href={diseaseHref(disease.id)} className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-[15px] font-medium">
              Open {disease.label}
            </Link>
            {disease.via && (
              <Link
                href={`${diseaseHref(disease.id)}/action?via=${toFileKey(disease.via.id)}`}
                className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-[15px] font-medium"
              >
                Action card with {disease.via.label}
              </Link>
            )}
            {disease.asset.url && (
              <a href={disease.asset.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-[15px] font-medium">
                {disease.asset.record ?? "Record"} on ClinicalTrials.gov
              </a>
            )}
          </div>
        </section>
      )}

      <Network file={file} buildT={buildT} weeks={weeks} />

      <p className="max-w-[72ch] text-[14px] text-ink-2">
        An estimate for one milestone, not a promise of a treatment. Assumptions are ours and labelled so you can check them; the route data comes from ClinicalTrials.gov records in data version{" "}
        <span className="tabular">{file.version}</span>, computed by <code>scripts/build-tenx.mjs</code> for all {file.core_total} core diseases. Research navigation tool, not medical advice.
      </p>
    </div>
  );
}

function DiseasePicker({ file, current, onPick }: { file: TenxFile; current: string; onPick: (id: string) => void }) {
  const sorted = useMemo(() => [...file.diseases].filter((d) => !d.is_group).sort((a, b) => a.label.localeCompare(b.label)), [file]);
  const byId = new Map(file.diseases.map((d) => [d.id, d]));
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {QUICK.filter((q) => byId.has(q)).map((q) => (
        <button
          key={q}
          onClick={() => onPick(q)}
          aria-pressed={q === current}
          className={`min-h-11 rounded-full px-4 text-[15px] font-medium ${q === current ? "bg-ink text-bg" : "border border-line bg-surface text-ink"}`}
        >
          {byId.get(q)!.label}
        </button>
      ))}
      <label className="flex min-h-11 w-full min-w-0 items-center gap-2 text-[15px] text-ink-2 sm:w-auto">
        <span className="sr-only sm:not-sr-only">or any of {sorted.length}:</span>
        <select
          value={current}
          onChange={(e) => onPick(e.target.value)}
          className="min-h-11 w-full min-w-0 rounded-full border border-line bg-surface px-3 text-[16px] text-ink sm:w-[320px]"
          aria-label="Choose a disease"
        >
          {!sorted.some((d) => d.id === current) && <option value={current}>{byId.get(current)?.label}</option>}
          {sorted.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label} · {d.route === "join" ? "join" : d.route === "extend" ? "extend" : "gap"}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function Verdict({
  disease,
  x,
  buildT,
  atlasT,
  lever,
}: {
  disease: TenxDisease;
  x: ReturnType<typeof speedup>;
  buildT: Range;
  atlasT: Range;
  lever: ReturnType<typeof topLever>;
}) {
  if (!x)
    return (
      <section className="card border-l-4 border-l-warn px-5 py-5" aria-label="Verdict">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-warn">Honest gap · no speed-up claimed</p>
        <p className="mt-2 text-[18px]">
          We found no open registry or natural-history study that names {disease.label}, and none at a disease with the same gene or mechanism class. The group would take the usual route,{" "}
          <span className="tabular font-semibold">
            {buildT.lo}–{buildT.hi} weeks
          </span>
          . That is the number this atlas should make smaller; it shows what is missing instead of inventing a shortcut.
        </p>
      </section>
    );
  const in10 = x.lo <= 10 && x.hi >= 10;
  const above = x.lo > 10;
  // break-even: how long may our route take, at the midpoint of the usual route, and still be 10x?
  const breakEven = (buildT.lo + buildT.hi) / 2 / 10;
  return (
    <section className="card px-5 py-5" aria-label="Verdict">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">Estimated speed-up to the milestone</p>
      <p className="mt-1 text-[40px] font-bold leading-none tracking-tight md:text-[48px]">
        <span className="tabular">
          {fmtX(x.lo)} to {fmtX(x.hi)}
        </span>
      </p>
      <p className="mt-2 text-[16px] text-ink-2">
        About <span className="tabular font-semibold text-ink">{fmtX(x.mid)}</span> at the middle of both ranges ({buildT.lo}–{buildT.hi} weeks against {atlasT.lo}–{atlasT.hi}). Calculated
        from the weeks below, not chosen.{" "}
        {above ? "Even our worst case beats 10×." : in10 ? "The 10× target falls inside this range." : "The 10× target is not reached on this route."}
      </p>
      <ScaleBar lo={x.lo} hi={x.hi} mid={x.mid} />
      <p className="mt-3 text-[15px] text-ink-2">
        What has to be true for 10×: the {disease.route === "join" ? "join" : "extend"} route finishes within{" "}
        <span className="tabular font-semibold text-ink">{breakEven.toFixed(1)} weeks</span> (a tenth of the usual route’s midpoint).
      </p>
      {lever && (
        <p className="mt-1 text-[15px] text-ink-2">
          The assumption that matters most: <span className="font-semibold text-ink">{lever.step.title.toLowerCase()}</span> ({lever.route === "usual" ? "usual route" : "atlas route"}). Across its
          range the midpoint moves between <span className="tabular font-semibold text-ink">{fmtX(lever.low)}</span> and{" "}
          <span className="tabular font-semibold text-ink">{fmtX(lever.high)}</span>, so it is the first number to measure.
        </p>
      )}
      {disease.backups.length > 0 && (
        <p className="mt-1 text-[15px] text-ink-2">
          Not one record: <span className="font-semibold text-ink">{disease.backups.length} more open stud{disease.backups.length === 1 ? "y" : "ies"}</span> would carry the same route if this one
          says no (listed below).
        </p>
      )}
    </section>
  );
}

/** Log scale 1x to 100x with the 10x line; the bar is the range, the dot the midpoint. */
function ScaleBar({ lo, hi, mid }: { lo: number; hi: number; mid: number }) {
  const pos = (v: number) => `${(Math.log10(Math.min(Math.max(v, 1), 100)) / 2) * 100}%`;
  return (
    <div className="mt-6 pb-6" aria-hidden="true">
      <div className="relative h-3 rounded-full bg-surface-2">
        <div className="absolute inset-y-0 rounded-full bg-accent/70" style={{ left: pos(lo), width: `calc(${pos(hi)} - ${pos(lo)})` }} />
        <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent" style={{ left: pos(mid) }} />
        <div className="absolute -top-2 bottom-[-8px] w-[2px] bg-node-center" style={{ left: pos(10) }} />
        <span className="absolute top-5 -translate-x-1/2 text-[13px] font-semibold text-ink" style={{ left: pos(10) }}>
          10×
        </span>
        <span className="absolute left-0 top-5 text-[13px] text-ink-2">1×</span>
        <span className="absolute right-0 top-5 text-[13px] text-ink-2">100×</span>
      </div>
    </div>
  );
}

function RouteCard({
  title,
  steps,
  t,
  weeks,
  editing,
  onSet,
  disease,
  accent = false,
}: {
  title: string;
  steps: Step[];
  t: Range;
  weeks: Record<string, Range>;
  editing: boolean;
  onSet: (st: Step, key: "lo" | "hi", v: number) => void;
  disease: TenxDisease;
  accent?: boolean;
}) {
  const { openEdge, register } = useEdgePanel();
  const labels: Record<string, string> = { [disease.id]: disease.label };
  if (disease.via) labels[disease.via.id] = disease.via.label;
  if (disease.asset) labels[disease.asset.id] = disease.asset.label;
  return (
    <div className={`card px-5 py-5 ${accent ? "ring-2 ring-accent/40" : ""}`}>
      <h3 className="text-[18px] font-semibold">{title}</h3>
      <p className="tabular mt-1 text-[15px] text-ink-2">
        {t.lo}–{t.hi} weeks in total
      </p>
      <ol className="mt-4 space-y-4">
        {steps.map((st, i) => {
          const w = weeks[st.id] ?? { lo: st.lo, hi: st.hi };
          const changed = weeks[st.id] && (w.lo !== st.lo || w.hi !== st.hi);
          return (
            <li key={st.id} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[16px] font-semibold leading-snug">
                  <span className="tabular mr-1 text-ink-2">{i + 1}.</span>
                  {st.title}
                </p>
                {editing ? (
                  <span className="flex shrink-0 items-center gap-1 text-[14px]">
                    <WeekInput value={w.lo} label={`${st.title}: fewest weeks`} onChange={(v) => onSet(st, "lo", v)} />–
                    <WeekInput value={w.hi} label={`${st.title}: most weeks`} onChange={(v) => onSet(st, "hi", v)} />
                    wk
                  </span>
                ) : (
                  <span className={`tabular shrink-0 text-[15px] font-semibold ${changed ? "text-accent" : ""}`}>
                    {w.lo}–{w.hi} wk
                  </span>
                )}
              </div>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[12px] font-semibold ${KIND_STYLE[st.kind]}`}>
                {KIND_LABEL[st.kind]}
                {changed ? " · changed by you" : ""}
              </span>
              <p className="mt-1.5 text-[15px] text-ink-2">{st.note}</p>
              {st.check && <p className="mt-1 text-[14px] text-ink-2">To replace it with a measured number: {st.check}</p>}
              <div className="mt-1 flex flex-wrap gap-x-3">
                {st.source && (
                  <a href={st.source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-[14px] font-medium underline underline-offset-4">
                    {st.source.label}
                  </a>
                )}
                {st.edge && (
                  <button
                    onClick={() => {
                      register([st.edge!], labels);
                      openEdge(st.edge!);
                    }}
                    className="inline-flex min-h-11 items-center text-[14px] font-medium underline underline-offset-4"
                  >
                    See the evidence
                  </button>
                )}
                {st.id === "c-find" && disease.asset && st.edge !== disease.asset.edge && (
                  <button
                    onClick={() => {
                      register([disease.asset!.edge], labels);
                      openEdge(disease.asset!.edge);
                    }}
                    className="inline-flex min-h-11 items-center text-[14px] font-medium underline underline-offset-4"
                  >
                    Evidence for {disease.asset.record ?? "the study"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function EvidenceLink({ edge, disease, label, sourceLabel }: { edge: TenxDisease["backups"][number]["edge"]; disease: TenxDisease; label: string; sourceLabel: string }) {
  const { openEdge, register } = useEdgePanel();
  return (
    <button
      onClick={() => {
        register([edge], { [disease.id]: disease.label, [edge.target]: label, [edge.source]: sourceLabel });
        openEdge(edge);
      }}
      className="inline-flex min-h-11 items-center text-[14px] font-medium underline underline-offset-4"
    >
      Evidence
    </button>
  );
}

function WeekInput({ value, label, onChange }: { value: number; label: string; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={260}
      value={value}
      aria-label={label}
      onFocus={(e) => e.target.select()}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="tabular h-11 w-14 rounded-[10px] border border-line bg-surface px-1 text-center text-[16px]"
    />
  );
}

function GapCard({ disease }: { disease: TenxDisease }) {
  return (
    <div className="card border-l-4 border-l-warn px-5 py-5">
      <h3 className="text-[18px] font-semibold">Constellate route: none found yet</h3>
      <p className="mt-2 text-[16px] text-ink-2">
        Searched: open registries and natural-history studies on ClinicalTrials.gov that name {disease.label}, and the same at every neighbour that shares a gene or a mechanism class.
        {disease.own_total > 0 && ` We found ${disease.own_total} record${disease.own_total === 1 ? "" : "s"} for it, none still enrolling.`}
      </p>
      <p className="mt-3 text-[16px] font-semibold">What would change this</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-[16px] text-ink-2">
        <li>A registry or natural-history study we missed: tell us, a person checks it before it appears.</li>
        <li>A neighbouring study that would accept these families after expert review.</li>
        <li>The group’s own registry, built once and shared with the diseases that share its mechanism.</li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/share?d=${toFileKey(disease.id)}`} className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-[15px] font-semibold text-accent-ink">
          Share a study we missed
        </Link>
        <Link href={diseaseHref(disease.id)} className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-[15px] font-medium">
          Open {disease.label}
        </Link>
      </div>
    </div>
  );
}

/** The same calculation for every core disease: how many groups could skip building, and what that adds up to. */
function Network({ file, buildT, weeks }: { file: TenxFile; buildT: Range; weeks: Record<string, Range> }) {
  const specific = file.diseases.filter((d) => !d.is_group);
  const count = (r: TenxDisease["route"]) => specific.filter((d) => d.route === r).length;
  const join = count("join");
  const extend = count("extend");
  const gap = count("gap");
  // per disease, because the confirm step depends on how current each record is
  const buildMid = (buildT.lo + buildT.hi) / 2;
  let savedWeeks = 0;
  let inRange = 0;
  let midTen = 0;
  for (const d of specific) {
    if (d.route === "gap") continue;
    const build = total(buildRoute(d), weeks);
    const t = total(atlasRoute(d), weeks);
    savedWeeks += Math.max(0, buildMid - (t.lo + t.hi) / 2);
    const x = speedup(build, t);
    if (x && x.hi >= 10) inRange++;
    if (x && x.mid >= 10) midTen++;
  }
  const years = savedWeeks / 52;
  const n = specific.length;
  return (
    <section aria-labelledby="network" className="space-y-3">
      <h2 id="network" className="text-[22px] font-semibold">
        The same calculation for all {n} specific core diseases
      </h2>
      <p className="max-w-[72ch] text-[16px] text-ink-2">
        No single community can see this: the route depends on studies that run under other diseases’ names. Disease groups (umbrella terms such as “lysosomal storage disease”) are left
        out.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat value={join} of={n} label="can join an open study that already names them" tone="ok" />
        <Stat value={extend} of={n} label="can ask an open study with the same gene or mechanism to extend" tone="accent" />
        <Stat value={gap} of={n} label="have no reusable open study in our data: honest gap" tone="warn" />
      </div>
      <p className="max-w-[72ch] text-[16px]">
        If each of those groups took the atlas route instead of building, they would save about{" "}
        <span className="tabular font-semibold">{Math.round(years).toLocaleString("en")} group-years</span> of work to this one milestone, at the midpoints of the weeks above
        {Object.keys(weeks).length ? " as you changed them" : ""}. Overlap is not deducted: a study that serves several diseases is counted for each.
      </p>
      <p className="max-w-[72ch] text-[16px]">
        With these weeks, 10× lies inside the estimated range for <span className="tabular font-semibold">{inRange}</span> diseases, and the midpoint reaches 10× for{" "}
        <span className="tabular font-semibold">{midTen}</span>. For the rest we show the smaller speed-up, not a rounder number.
      </p>
      <p className="text-[15px] text-ink-2">
        Try:{" "}
        {specific
          .filter((d) => d.route === "gap")
          .slice(0, 1)
          .map((d) => (
            <Link key={d.id} href={`/impact?d=${toFileKey(d.id)}`} className="underline underline-offset-4">
              an honest gap ({d.label})
            </Link>
          ))}
      </p>
    </section>
  );
}

function Stat({ value, of, label, tone }: { value: number; of: number; label: string; tone: "ok" | "accent" | "warn" }) {
  const color = tone === "ok" ? "text-ok" : tone === "accent" ? "text-accent" : "text-warn";
  return (
    <div className="card px-4 py-4">
      <p className={`tabular text-[32px] font-bold leading-none ${color}`}>
        {value}
        <span className="text-[16px] font-medium text-ink-2"> / {of}</span>
      </p>
      <p className="mt-2 text-[15px] text-ink-2">{label}</p>
    </div>
  );
}
