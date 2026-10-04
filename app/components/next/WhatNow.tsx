"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { DiseaseFile, Meta } from "@/lib/types";
import { refOf, xrefUrl } from "@/lib/ids";
import {
  citedEdges,
  citedLabels,
  familyAssets,
  gapOrgs,
  nextSteps,
  ownOrgs,
  ownStudies,
  plainDate,
  therapyState,
  wordsIn,
  type OrgRow,
} from "@/lib/nextSteps";
import { useEdgePanel } from "../Providers";
import RelatedHelp, { useRelated, type RelatedState } from "./RelatedHelp";
import StudiesNow from "./StudiesNow";
import { Ext, Explain, NowCard, Source } from "./ui";

/**
 * The top of a disease page for a family that has just heard the diagnosis: what it is, whether a medicine is approved,
 * what exists for related diseases, who to contact, which studies to ask about, and numbered next steps.
 * Every line comes from the shard (or a related shard) and links to its source. The full evidence follows below.
 */
export default function WhatNow({ file, meta, labels, defaultVia }: { file: DiseaseFile; meta: Meta | null; labels: Record<string, string>; defaultVia: string | null }) {
  const { register } = useEdgePanel();
  const node = file.node;
  const label = node.label;

  useMemo(() => register(citedEdges(file), citedLabels(file)), [file, register]);

  const therapy = useMemo(() => therapyState(file), [file]);
  const orgs = useMemo(() => ownOrgs(file), [file]);
  const studies = useMemo(() => ownStudies(file), [file]);
  const assets = useMemo(() => familyAssets(file), [file]);
  const related = useRelated(file, therapy.kind !== "approved" || orgs.length === 0);

  // groups for related diseases when this diagnosis has none: the honest-gap block first, else the loaded relatives
  const relatedOrgs = useMemo<OrgRow[]>(() => {
    if (orgs.length) return [];
    const fromGap = gapOrgs(file);
    if (fromGap.length) return fromGap.slice(0, 4);
    const seen = new Set<string>();
    return related.findings.flatMap((f) => f.orgs).filter((o) => !seen.has(o.key) && seen.add(o.key)).slice(0, 4);
  }, [orgs, file, related.findings]);

  const viaNeighbour = useMemo(() => {
    const precedent = related.findings.find((f) => f.therapies.length && f.candidate.neighbour)?.candidate;
    if (precedent) return { id: precedent.id, label: precedent.label };
    const n = file.neighbours.find((x) => x.id === defaultVia);
    return n ? { id: n.id, label: n.label } : null;
  }, [related.findings, file.neighbours, defaultVia]);

  const steps = nextSteps({ file, therapy, orgs: orgs.length ? orgs : relatedOrgs, studies, assets, related: related.findings, actionVia: viaNeighbour });
  const builtAt = plainDate(meta?.built_at);
  const parents = node.parents.slice(0, 2).map((p) => refOf(p, labels));
  const words = wordsIn(`${label} ${node.definition ?? ""} ${parents.map((p) => p.label).join(" ")}`);

  return (
    <section aria-labelledby="what-now-title" className="mt-6">
      <h2 id="what-now-title" className="t-h2 text-ink">
        What you can do now
      </h2>
      <p className="mt-2 max-w-[760px] text-[17px] leading-relaxed text-ink-2">
        In short, with a source for each line. Research navigation, not medical advice: talk to your child&apos;s doctor before you act on it.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <NowCard id="now-what" title="What this is">
          {node.definition ? <p>{node.definition}</p> : <p>The disease ontology has no short description of {label} yet.</p>}
          {words.length > 0 && <Explain>{words.join(" ")}</Explain>}
          <Source label={`MONDO disease ontology, ${node.id}`} href={xrefUrl(node.id)} date={builtAt ? `as of ${builtAt}` : null} about={`definition of ${label}`} />
        </NowCard>

        <MedicineCard label={label} therapy={therapy} related={related} />

        <FamiliesCard label={label} orgs={orgs} relatedOrgs={relatedOrgs} builtAt={builtAt} loading={!orgs.length && related.status === "loading" && !gapOrgs(file).length} />

        <StudiesNow file={file} studies={studies} assets={assets} />

        <NowCard id="now-steps" title="Next steps" wide>
          {steps.length ? (
            <ol className="space-y-3">
              {steps.map((s, i) => (
                <li key={s.key} className="flex gap-4">
                  <span className="tabular mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line-strong text-[15px] font-semibold" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p>{s.text}</p>
                    {s.link &&
                      (s.link.external ? (
                        <Ext href={s.link.href}>{s.link.label}</Ext>
                      ) : (
                        <Link href={s.link.href} className="inline-flex min-h-11 items-center underline decoration-line-strong underline-offset-4 hover:decoration-current">
                          {s.link.label}
                        </Link>
                      ))}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p>Our data has no group, study or comparison to point you to for {label} yet. The records below show what was searched.</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
            {/* the share page is built separately; a plain link, so no prefetch runs before it exists */}
            <a href={`/share?disease=${encodeURIComponent(node.id)}`} className="btn-primary">
              Share what you know
            </a>
            <span className="text-[15px] text-ink-2">Know a patient group, study or source we are missing?</span>
          </div>
        </NowCard>

        {therapy.kind !== "approved" && <RelatedHelp file={file} related={related} />}
      </div>
    </section>
  );
}

/** "Approved for MLD, not for Krabbe disease: Libmeldy (EMA, 17 Dec 2020) ..." right under the honest no; the details follow in "What exists for related diseases". */
function RelatedPrecedent({ label, related }: { label: string; related: RelatedState }) {
  const precedent = related.findings.find((f) => f.therapies.length);
  if (related.status === "loading") return <p className="text-[15px] text-ink-2" role="status">Checking related diseases…</p>;
  if (!precedent) return null;
  const names = precedent.therapies.slice(0, 3).map((t) => [t.name, [t.authority, t.date].filter(Boolean).join(", ")].filter(Boolean).join(" (") + (t.authority || t.date ? ")" : ""));
  return (
    <div className="rounded-[14px] border border-line px-4 py-3">
      <p>
        <span className="font-semibold">
          Approved for {precedent.candidate.label}, not for {label}.
        </span>{" "}
        {names.join(", ")}. Whether anything carries over needs expert review.
      </p>
      <a href="#related-help" className="inline-flex min-h-11 items-center text-[15px] font-medium underline decoration-line-strong underline-offset-4 hover:decoration-current">
        See what exists for related diseases
      </a>
    </div>
  );
}

function MedicineCard({ label, therapy, related }: { label: string; therapy: ReturnType<typeof therapyState>; related: RelatedState }) {
  if (therapy.kind === "unchecked")
    return (
      <NowCard id="now-medicine" title="Is there an approved medicine?" gap>
        <p>
          <span className="mr-2 inline-flex rounded-full border border-dashed border-line-strong px-2.5 py-0.5 text-[13px] font-semibold uppercase tracking-wide text-ink-2">Not checked yet</span>
          We have not searched the EMA and FDA medicine records for {label} yet, so we cannot say either way.
        </p>
        <RelatedPrecedent label={label} related={related} />
        <Explain>EMA approves medicines in the European Union, the FDA in the United States.</Explain>
      </NowCard>
    );
  if (therapy.kind === "none")
    return (
      <NowCard id="now-medicine" title="Is there an approved medicine?" gap>
        <p className="font-semibold">
          No approved medicine found in {therapy.authorities} records{therapy.asOf ? ` as of ${therapy.asOf}` : ""}.
        </p>
        <p className="text-[15px] text-ink-2" title={therapy.sources.join("; ")}>
          EMA: European Union medicines agency. FDA: United States.
        </p>
        <RelatedPrecedent label={label} related={related} />
      </NowCard>
    );
  return (
    <NowCard id="now-medicine" title="Is there an approved medicine?">
      <p className="font-semibold">
        Yes. {therapy.items.length === 1 ? "One medicine is" : `${therapy.items.length} medicines are`} approved for {label}.
      </p>
      <ul>
        {therapy.items.slice(0, 4).map((t) => (
          <li key={t.key} title={t.holder ?? undefined}>
            <Source label={[t.name, t.authority, t.date].filter(Boolean).join(" · ")} href={t.href} edge={t.edge} about={`${t.name} approved for ${label}`} prefix={false} />
          </li>
        ))}
      </ul>
      {therapy.items.length > 4 && <p className="text-[15px] text-ink-2">{therapy.items.length - 4} more in the action card below.</p>}
      <p className="text-[15px] text-ink-2">Whether it fits your child is for your specialist to decide. EMA: European Union medicines agency. FDA: United States.</p>
    </NowCard>
  );
}

function FamiliesCard({ label, orgs, relatedOrgs, builtAt, loading }: { label: string; orgs: OrgRow[]; relatedOrgs: OrgRow[]; builtAt: string | null; loading: boolean }) {
  const { openEdge } = useEdgePanel();
  const rows = (orgs.length ? orgs : relatedOrgs).slice(0, 4);
  const dates = [...new Set(rows.map((o) => o.verified).filter(Boolean))];
  const oneDate = dates.length === 1 ? dates[0] : null;
  return (
    <NowCard id="now-families" title="Families like yours" gap={!orgs.length}>
      {orgs.length ? (
        <p>
          {orgs.length === 1 ? "A patient group" : `${orgs.length} patient groups`} for {label}
          {oneDate ? `, checked against the organisation's website, ${oneDate}` : ", each checked against the organisation's website"}:
        </p>
      ) : (
        <p>
          We found no patient group for {label} in our list of patient groups{builtAt ? ` (as of ${builtAt})` : ""}.
          {relatedOrgs.length > 0 && " These groups support families with a related disease and may know where to turn:"}
        </p>
      )}
      {loading && <p className="text-ink-2" role="status">Looking at related diseases…</p>}
      {rows.length > 0 && (
        <ul className="divide-y divide-line">
          {rows.map((o) => (
            <li key={o.key} className="py-1.5">
              <p className="font-semibold leading-snug">{o.site ? <Ext href={o.site}>{o.label}</Ext> : o.label}</p>
              <p className="flex flex-wrap items-center gap-x-1.5 text-[15px] text-ink-2">
                {[
                  o.forDisease ? <span key="for">for {o.forDisease.label}</span> : null,
                  o.country ? <span key="c">{o.country}</span> : null,
                  o.verified && !oneDate ? <span key="v">checked against the organisation&apos;s website, {o.verified}</span> : null,
                  o.contact ? <Ext key="contact" href={o.contact}>Contact page</Ext> : null,
                  o.edge ? (
                    <button
                      key="how"
                      type="button"
                      onClick={() => openEdge(o.edge!)}
                      className="inline-flex min-h-11 items-center font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current"
                      aria-label={`How we know: ${o.label} supports families with ${o.forDisease?.label ?? label}`}
                    >
                      How we know
                    </button>
                  ) : null,
                ]
                  .filter(Boolean)
                  .map((part, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5">
                      {i > 0 && <span aria-hidden="true">·</span>}
                      {part}
                    </span>
                  ))}
              </p>
            </li>
          ))}
        </ul>
      )}
      {!orgs.length && !relatedOrgs.length && !loading && <p className="text-ink-2">No group for a related disease is listed either.</p>}
    </NowCard>
  );
}
