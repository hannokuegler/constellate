import type { Metadata } from "next";
import Link from "next/link";
import { diseaseHref } from "@/lib/ids";
import { Logo } from "@/components/Header";

export const metadata: Metadata = {
  title: "About · Constellate",
  description: "Constellate leads a rare-disease family or patient group from one diagnosis to a related community, a reusable asset and an evidence-backed action card.",
};

const REPO = "https://github.com/hannokuegler/constellate";

const MOMENTS = [
  {
    label: "Moment 1",
    title: "We just got the diagnosis",
    text: "A mother has a name for her child's disease and nobody to ask. Constellate shows her the patient groups for that diagnosis, the studies that list it and, when there is nothing, exactly what was searched.",
  },
  {
    label: "Moment 2",
    title: "I lead a patient group",
    text: "Months later the same mother leads a small group. Constellate shows related communities, and the registries, natural history studies and outcome scales that already exist, so she joins instead of building from zero.",
  },
];

const STEPS = [
  ["1", "Start with the diagnosis", "Search by disease, gene or symptom, in any of its names."],
  ["2", "Find the related community and the asset it already has", "Diseases are linked by shared genes and phenotypes. Each line shows its source, date, evidence level and counter-evidence."],
  ["3", "Get an action card", "What transfers, what differs, what needs expert review. Every sentence cites the evidence it rests on, and the card can be exported."],
];

export default function AboutPage() {
  return (
    <div className="mx-auto mt-8 max-w-[960px] space-y-12">
      <header>
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">About Constellate</p>
        </div>
        <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight md:text-[40px]">Your family is not the first. What you need may already exist under another disease&apos;s name.</h1>
        <p className="mt-4 max-w-[68ch] text-[17px] text-ink-2">
          Families with a rare diagnosis and the groups that support them often work alone, because the registries, studies and tools they need sit under a neighbouring disease with a different name. Constellate is an evidence-graded map of rare diseases that finds those connections and shows the proof for every one of them.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={diseaseHref("MONDO:0009499")} className="btn-primary">
            Follow the hero path: Krabbe disease
          </Link>
          <Link href="/methods" className="btn-secondary">
            How we know
          </Link>
        </div>
      </header>

      <section aria-labelledby="mother">
        <h2 id="mother" className="text-[24px] font-semibold">One mother, two moments</h2>
        <p className="mt-1 text-[13px] text-ink-2">A composite figure for the story, not a real person.</p>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {MOMENTS.map((m) => (
            <li key={m.label} className="card px-5 py-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">{m.label}</p>
              <h3 className="mt-1 text-[20px] font-semibold">{m.title}</h3>
              <p className="mt-2 text-[15px] text-ink-2">{m.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="what">
        <h2 id="what" className="text-[24px] font-semibold">What the app does</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {STEPS.map(([n, title, text]) => (
            <li key={n} className="card px-5 py-5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-[15px] font-semibold text-accent" aria-hidden="true">{n}</span>
              <h3 className="mt-3 text-[17px] font-semibold">{title}</h3>
              <p className="mt-1 text-[16px] text-ink-2">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="gap" className="card border-dashed px-5 py-6 md:px-8">
        <p className="flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-2"><span className="dot-ring" aria-hidden="true" />Honest gap</p>
        <h2 id="gap" className="mt-1 text-[24px] font-semibold">When there is no trail, we say so</h2>
        <p className="mt-2 max-w-[68ch] text-[16px] text-ink-2">
          Where no source supports a link, Constellate does not fill the space. It shows what was searched and when, which communities are nearest, and what would have to be tested next. A missing answer is a result, and it is marked as one.
        </p>
      </section>

      <section aria-labelledby="who" className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 id="who" className="text-[24px] font-semibold">Team</h2>
          <ul className="mt-3 space-y-1 text-[16px]">
            <li><span className="font-semibold">Hanno Kügler</span> <span className="text-ink-2">· tech lead, pipeline and app</span></li>
            <li><span className="font-semibold">Osman</span> <span className="text-ink-2">· operations and curation</span></li>
            <li><span className="font-semibold">Recep</span> <span className="text-ink-2">· story, evidence and video</span></li>
          </ul>
          <p className="mt-3 text-[13px] text-ink-2">Built at the Hack-Nation 7th Global AI Hackathon, Vienna hub, challenge C5 “AI Atlas for the World&apos;s Rare Diseases”.</p>
        </div>
        <div>
          <h2 className="text-[24px] font-semibold">AI inside</h2>
          <p className="mt-3 text-[15px] text-ink-2">
            Language models extract claims from abstracts, match organisation names to diseases and explain an action card in plain language. The pipeline is built on the OpenAI API (Extract, Reconcile, Explain); the current data export ran these steps on Claude (Anthropic), and every evidence item names its model. Each use is marked in the product, and every explanation sentence must cite an evidence edge. Details on <Link href="/methods" className="text-accent underline underline-offset-2">How we know</Link>.
          </p>
          <p className="mt-4 text-[15px]">
            <a href={REPO} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-ink underline decoration-line underline-offset-2 hover:decoration-current">
              Source code on GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
      </section>

      <p className="border-t border-line pt-4 text-[13px] text-ink-2">A research-navigation tool, not medical advice. Decisions about care and study participation belong with a family&apos;s clinicians and the study team.</p>
    </div>
  );
}
