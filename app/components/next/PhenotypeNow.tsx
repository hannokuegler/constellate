"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DiseaseFile, IndexEntry, PhenotypeFile } from "@/lib/types";
import { loadDisease } from "@/lib/data";
import { diseaseHref, xrefUrl } from "@/lib/ids";
import { phenotypeDiseases } from "@/lib/normalize";
import { ownStudies, PLAIN_WORDS, type StudyRow } from "@/lib/nextSteps";
import { useEdgePanel } from "../Providers";
import { Ext, Explain, NowCard, Source } from "./ui";

const TOP = 5;

/** Top of /p/<HP id> in plain words: which diseases in our data list this finding, and their open studies. */
export default function PhenotypeNow({ file, index }: { file: PhenotypeFile; index: Map<string, IndexEntry> }) {
  const { register } = useEdgePanel();
  const label = file.node.label;
  const rows = useMemo(() => phenotypeDiseases(file), [file]);
  const top = useMemo(() => rows.slice(0, TOP), [rows]);
  const total = file.diseases_total ?? rows.length;
  const [shards, setShards] = useState<{ key: string; files: (DiseaseFile | null)[] } | null>(null);
  const key = top.map((r) => r.id).join(",");

  useEffect(() => {
    let alive = true;
    Promise.all(top.map((r) => loadDisease(r.id).catch(() => null))).then((files) => {
      if (!alive) return;
      for (const f of files) if (f) register(ownStudies(f).map((s) => s.edge), { [f.node.id]: f.node.label, ...Object.fromEntries(ownStudies(f).map((s) => [s.key, s.title])) });
      setShards({ key, files });
    });
    return () => {
      alive = false;
    };
  }, [top, key, register]);

  const studies: { study: StudyRow; disease: string }[] = [];
  const seen = new Set<string>();
  if (shards?.key === key)
    for (const f of shards.files)
      for (const s of f ? ownStudies(f) : [])
        if (!seen.has(s.key)) {
          seen.add(s.key);
          studies.push({ study: s, disease: f!.node.label });
        }
  const nameOf = (id: string, fallback?: string) => fallback ?? index.get(id)?.label ?? id;

  return (
    <section aria-labelledby="p-now-title" className="mt-6">
      <h2 id="p-now-title" className="t-h2 text-ink">
        In plain words
      </h2>
      <p className="mt-2 text-[17px] leading-relaxed text-ink-2">
        A single finding can belong to many diseases. Only a doctor can tell which one fits your child. This is research navigation, not medical advice.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4">
        <NowCard id="p-now-diseases" title="Diseases in our data with this finding">
          <p>
            In our data, {total === 1 ? "one disease lists" : `${total} diseases list`} {label}.{rows.length > TOP ? ` The ${TOP} most clearly annotated:` : ""}
          </p>
          <ul className="divide-y divide-line">
            {top.map((r) => {
              const ev = r.edge.evidence[0];
              return (
                <li key={r.edge.id} className="py-2">
                  <Link href={diseaseHref(r.id)} className="inline-flex min-h-11 items-center font-semibold underline decoration-line-strong underline-offset-4 hover:decoration-current">
                    {nameOf(r.id, r.label)}
                  </Link>
                  <Source label={[ev?.db, ev?.record].filter(Boolean).join(" · ") || "phenotype annotation"} href={ev?.url ?? null} date={ev?.date ?? null} edge={r.edge} about={`${nameOf(r.id, r.label)} lists ${label}`} />
                </li>
              );
            })}
          </ul>
          <Explain>
            {PLAIN_WORDS.finding} Source:{" "}
            <a href={xrefUrl(file.node.id) ?? "https://hpo.jax.org"} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              {file.node.id}
            </a>
            .
          </Explain>
        </NowCard>

        <NowCard id="p-now-studies" title="Studies for these diseases" gap={shards?.key === key && !studies.length}>
          {shards?.key !== key ? (
            <p className="text-ink-2" role="status">
              Checking open studies…
            </p>
          ) : studies.length ? (
            <>
              <ul className="divide-y divide-line">
                {studies.slice(0, 5).map(({ study: s, disease }) => (
                  <li key={s.key} className="py-2">
                    <p className="text-[15px]">
                      <span className="font-semibold">{s.status}</span>
                      <span className="text-ink-2"> · {s.observational ? "observes, no treatment" : "tests a treatment"} · for {disease}</span>
                    </p>
                    <p className="leading-snug">{s.title}</p>
                    <Ext href={s.href} className="text-[15px]">
                      {s.key} on ClinicalTrials.gov
                    </Ext>
                  </li>
                ))}
              </ul>
              <Explain>Ask your doctor; the registry lists the contact. {PLAIN_WORDS.observational}</Explain>
            </>
          ) : (
            <p>No open study on ClinicalTrials.gov lists {top.length === 1 ? "this disease" : "these diseases"} right now.</p>
          )}
        </NowCard>
      </div>
    </section>
  );
}
