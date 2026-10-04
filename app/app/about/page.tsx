import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About · Constellate",
  description: "Find source-backed connections between rare diseases, patient communities and the resources they have built.",
};

export default function AboutPage() {
  return (
    <div className="page-shell max-w-[960px] space-y-12">
      <header>
        <p className="eyebrow">About Constellate</p>
        <h1 className="page-heading">A diagnosis can be a starting point.</h1>
        <p className="mt-6 max-w-[62ch] text-[1.25rem] leading-relaxed">Your family is not the first. What you need may already exist under another disease&apos;s name.</p>
        <p className="subtle mt-4 max-w-[65ch]">Constellate brings together evidence about rare diseases, the communities around them, and the research resources they have built. Start with a diagnosis, then explore the connections at your own pace.</p>
        <Link href="/" className="button button-primary mt-6">Find a diagnosis</Link>
      </header>
      <section aria-labelledby="path">
        <h2 id="path" className="section-heading">From a name to a next step</h2>
        <ol className="mt-6 divide-y divide-line">
          {[
            ["Start with what you know", "Search for a disease, gene or symptom. Different names can lead to the same record."],
            ["Find what is already there", "Explore recorded treatments, patient organisations and studies. Each connection has evidence you can open and check."],
            ["Take a question with you", "An action card brings together what may transfer, what differs and what needs expert review. Share or print it for a conversation with a clinician or patient group."],
          ].map(([title, text], index) => <li key={title} className="grid grid-cols-[2rem_1fr] gap-4 py-6"><span className="subtle" aria-hidden="true">0{index + 1}</span><div><h3 className="font-semibold">{title}</h3><p className="subtle mt-2">{text}</p></div></li>)}
        </ol>
      </section>
      <section className="answer-card" aria-labelledby="gap">
        <p className="eyebrow">Honest gap</p>
        <h2 id="gap" className="section-heading mt-2">Uncertainty belongs in the picture.</h2>
        <p className="subtle mt-4">A missing record is never a reason to invent an answer. Constellate distinguishes information that is still pending from a search that found no records, and shows sources and dates when they are available.</p>
        <Link href="/methods" className="mt-4 inline-flex min-h-11 items-center text-accent underline underline-offset-4">Read how we use evidence</Link>
      </section>
      <section aria-labelledby="team">
        <h2 id="team" className="section-heading">Built together</h2>
        <p className="subtle mt-4">Hanno Kügler · technology, pipeline and app<br />Osman · operations and curation<br />Recep · story, evidence and video</p>
        <p className="subtle mt-4">Built for the Hack-Nation 7th Global AI Hackathon in Vienna, challenge C5: AI Atlas for the World&apos;s Rare Diseases.</p>
        <a href="https://github.com/hannokuegler/constellate" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center text-accent underline underline-offset-4">Explore the source code<span className="sr-only"> (opens in a new tab)</span></a>
      </section>
      <p className="source-line border-t border-line pt-5">Research navigation, not medical advice. Decisions about care and study participation belong with clinicians and the study team.</p>
    </div>
  );
}
