"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DiseaseFile } from "@/lib/types";
import { loadDisease } from "@/lib/data";
import { diseaseHref, toFileKey } from "@/lib/ids";
import { hasFindings, rankFindings, relatedCandidates, relatedFinding, PLAIN_WORDS, type RelatedCandidate, type RelatedFinding } from "@/lib/nextSteps";
import { useEdgePanel } from "../Providers";
import { Explain, NowCard, Source } from "./ui";

export interface RelatedState {
  status: "idle" | "loading" | "ready";
  candidates: RelatedCandidate[];
  findings: RelatedFinding[];
  /** checked, but none of the shards carries a medicine, study, registry or group */
  empty: RelatedCandidate[];
}

/** Loads the shards of at most four same-mechanism relatives, only when the page needs them. */
export function useRelated(file: DiseaseFile, enabled: boolean): RelatedState {
  const { register } = useEdgePanel();
  const candidates = useMemo(() => relatedCandidates(file, 4), [file]);
  const [loaded, setLoaded] = useState<{ id: string; findings: RelatedFinding[] } | null>(null);

  useEffect(() => {
    if (!enabled || !candidates.length) return;
    let alive = true;
    Promise.all(candidates.map((c) => loadDisease(c.id).catch(() => null))).then((files) => {
      if (!alive) return;
      const findings: RelatedFinding[] = [];
      files.forEach((f, i) => {
        if (!f) return;
        const finding = relatedFinding(candidates[i], f);
        findings.push(finding);
        register(
          [...(candidates[i].edge ? [candidates[i].edge!] : []), ...finding.therapies.map((t) => t.edge), ...finding.assets.map((a) => a.edge), ...finding.studies.map((s) => s.edge), ...finding.orgs.flatMap((o) => (o.edge ? [o.edge] : []))],
          Object.fromEntries([
            [f.node.id, f.node.label],
            ...finding.therapies.map((t) => [t.key, t.name]),
            ...finding.assets.map((a) => [a.key, a.label]),
            ...finding.studies.map((s) => [s.key, s.title]),
            ...finding.orgs.map((o) => [o.key, o.label]),
          ]),
        );
      });
      setLoaded({ id: file.node.id, findings });
    });
    return () => {
      alive = false;
    };
  }, [enabled, candidates, file.node.id, register]);

  if (!enabled || !candidates.length) return { status: "idle", candidates, findings: [], empty: [] };
  if (loaded?.id !== file.node.id) return { status: "loading", candidates, findings: [], empty: [] };
  const ranked = rankFindings(loaded.findings);
  return { status: "ready", candidates, findings: ranked.filter(hasFindings), empty: ranked.filter((f) => !hasFindings(f)).map((f) => f.candidate) };
}

/** "What exists for related diseases": shown when this diagnosis has no approved medicine. */
export default function RelatedHelp({ file, related }: { file: DiseaseFile; related: RelatedState }) {
  const label = file.node.label;
  return (
    <NowCard id="related-help" title="What exists for related diseases" wide>
      <p>
        In our data, these diseases share a gene or a body process (pathway) with {label}. Here is what exists for them. None of it is approved for {label}.
      </p>
      {related.status === "idle" && <p className="text-ink-2">We found no related disease with the same mechanism in our data.</p>}
      {related.status === "loading" && (
        <p className="flex items-center gap-3 text-ink-2" role="status">
          <span className="skel-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Checking {related.candidates.map((c) => c.label).join(", ")}
        </p>
      )}
      {related.status === "ready" && related.findings.length === 0 && (
        <p className="text-ink-2">We checked {related.candidates.map((c) => c.label).join(", ")}. None of them has an approved medicine, a study or a patient group in our data.</p>
      )}
      {related.status === "ready" && related.findings.length > 0 && (
        <ul className="space-y-4">
          {related.findings.slice(0, 3).map((f, i) => (
            <RelatedBlock key={f.candidate.id} file={file} finding={f} compact={i > 0} />
          ))}
        </ul>
      )}
      {file.neighbours.length > 3 && (
        <a href="#related" className="inline-flex min-h-11 items-center text-[17px] font-medium underline decoration-line-strong underline-offset-4 hover:decoration-current">
          Show all {file.neighbours.length} related diagnoses
        </a>
      )}
      {related.status === "ready" && related.empty.length > 0 && (
        <p className="text-[16px] text-ink-2">
          Also checked, nothing found: {related.empty.map((c) => c.label).join(", ")}.
        </p>
      )}
    </NowCard>
  );
}

/** The richest relative is shown in full; the next ones in two lines (what exists there, counted), the detail one tap away. */
function RelatedBlock({ file, finding, compact }: { file: DiseaseFile; finding: RelatedFinding; compact: boolean }) {
  const { candidate, therapies, assets, studies, orgs } = finding;
  const label = file.node.label;
  const other = candidate.label;
  if (compact) {
    const nhs = assets.filter((a) => a.kind === "natural_history_study").length;
    const reg = assets.length - nhs;
    const has = [
      therapies.length ? `approved medicine${therapies.length > 1 ? "s" : ""}: ${therapies.map((t) => t.name).join(", ")} (for ${other}, not for ${label})` : null,
      nhs ? `${nhs} natural history stud${nhs > 1 ? "ies" : "y"}` : null,
      reg ? `${reg} registr${reg > 1 ? "ies" : "y"}` : null,
      studies.length ? `${studies.length} open stud${studies.length > 1 ? "ies" : "y"}` : null,
      orgs.length ? `${orgs.length} patient group${orgs.length > 1 ? "s" : ""}` : null,
    ].filter(Boolean);
    return (
      <li className="rounded-[16px] border border-line px-4 py-3">
        <p className="text-[17px] font-semibold leading-snug">
          <Link href={diseaseHref(candidate.id)} className="inline-flex min-h-11 items-center underline decoration-line-strong underline-offset-4 hover:decoration-current">
            {other}
          </Link>
        </p>
        <Source label={`Related: it ${candidate.why}`} edge={candidate.edge} about={`why ${other} is related to ${label}`} prefix={false} />
        <p className="text-[15px]">Has {has.join(", ")}.</p>
        {therapies.length > 0 && <p className="text-[16px] text-ink-2">Whether anything carries over needs expert review.</p>}
      </li>
    );
  }
  const shownAssets = assets.slice(0, 2);
  const kinds = new Set(shownAssets.map((a) => a.kind));
  return (
    <li className="rounded-[16px] border border-line px-4 py-3">
      <p className="text-[20px] font-semibold leading-snug">
        <Link href={diseaseHref(candidate.id)} className="inline-flex min-h-11 items-center underline decoration-line-strong underline-offset-4 hover:decoration-current">
          {other}
        </Link>
      </p>
      <Source label={`Related: it ${candidate.why}`} edge={candidate.edge} about={`why ${other} is related to ${label}`} prefix={false} />

      {therapies.length > 0 && (
        <div className="mt-2">
          <p className="font-semibold">
            Approved for {other}, not for {label}. Whether anything carries over needs expert review.
          </p>
          <ul>
            {therapies.slice(0, 3).map((t) => (
              <li key={t.key}>
                <Source label={[t.name, t.authority, t.date].filter(Boolean).join(" · ")} href={t.href} edge={t.edge} about={`${t.name} approved for ${other}`} prefix={false} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {shownAssets.length > 0 && (
        <div className="mt-2">
          <p className="font-semibold">
            Studies and registries for {other}, not for {label}:
          </p>
          <ul>
            {shownAssets.map((a) => (
              <li key={a.key} className="mt-1">
                <p className="leading-snug">
                  {a.kind === "natural_history_study" ? "Natural history study" : "Registry"}: {a.label}
                  {a.status ? ` (${a.status.toLowerCase()})` : ""}
                </p>
                <Source label={a.record ?? "registry entry"} href={a.href} edge={a.edge} about={`${a.label} for ${other}`} prefix={false} />
              </li>
            ))}
          </ul>
          <Explain>
            {kinds.has("natural_history_study") && PLAIN_WORDS.naturalHistory} {kinds.has("registry") && PLAIN_WORDS.registry}
          </Explain>
        </div>
      )}

      {(studies.length > 0 || orgs.length > 0) && (
        <p className="mt-2 text-[16px] text-ink-2">
          {studies.length > 0 && (
            <>
              <Link href={`${diseaseHref(candidate.id)}#open-studies`} className="inline-flex min-h-11 items-center text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current">
                {studies.length === 1 ? "1 open study" : `${studies.length} open studies`}
              </Link>{" "}
            </>
          )}
          {studies.length > 0 && orgs.length > 0 && "· "}
          {orgs.length > 0 && `Patient groups: ${orgs.slice(0, 4).map((o) => o.label).join(", ")}`}
        </p>
      )}

      <div className="mt-2">
        {candidate.neighbour ? (
          <Link href={`${diseaseHref(file.node.id)}/action?via=${toFileKey(candidate.id)}`} className="btn-secondary">
            Compare in an action card
          </Link>
        ) : (
          <Link href={diseaseHref(candidate.id)} className="btn-secondary">
            Open {other}
          </Link>
        )}
      </div>
    </li>
  );
}
