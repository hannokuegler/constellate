"use client";

import type { PersonaId } from "@/lib/persona";
import { usePrefs } from "./Providers";

const MOMENTS: { id: PersonaId; label: string; short: string }[] = [
  { id: "family", label: "We just got the diagnosis", short: "Just diagnosed" },
  { id: "nora", label: "I lead a patient group", short: "Patient group lead" },
];

/** One mother, two moments: switch between them on the disease page and see the three answers first. */
export default function MomentBar({ diseaseLabel, orgs, hasGap, openStudies, neighbours, onOpenCard }: {
  onOpenCard: (() => void) | null;
  diseaseLabel: string;
  orgs: number;
  hasGap: boolean;
  openStudies: number;
  neighbours: number;
}) {
  const { persona, setPersona } = usePrefs();
  const inMoment = MOMENTS.some((m) => m.id === persona.id);
  const family = persona.id === "family";

  const answers: { href: string; value: string; text: string; onClick?: () => void }[] = family
    ? [
        { href: "#patient-organisations", value: orgs ? `${orgs}` : "0", text: orgs ? `patient group${orgs > 1 ? "s" : ""} for ${diseaseLabel}` : hasGap ? "groups for this exact diagnosis: here is what we searched and the nearest ones" : "patient groups in the checked list" },
        { href: "#open-studies", value: `${openStudies}`, text: `open stud${openStudies === 1 ? "y" : "ies"} that list ${diseaseLabel}` },
        { href: "#related", value: `${neighbours}`, text: "related diagnoses whose families and researchers may help" },
      ]
    : [
        { href: "#related", value: `${neighbours}`, text: "related communities, linked by shared genes or symptoms" },
        { href: "#open-studies", value: `${openStudies}`, text: "open studies and registries you could join instead of building" },
        ...(onOpenCard ? [{ href: "#action-card", value: "1", text: "sourced proposal to send to a partner: open the Action card", onClick: onOpenCard }] : []),
      ];

  return (
    <section className="card mt-5 px-4 py-4 md:px-5" aria-label="Where are you right now?">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[13px] text-ink-2">Where are you right now?</span>
        <div className="grid w-full grid-cols-2 gap-1 rounded-full border border-line bg-surface-2 p-1 sm:inline-grid sm:w-auto" role="radiogroup" aria-label="Moment">
          {MOMENTS.map((m) => (
            <button
              key={m.id}
              role="radio"
              aria-checked={persona.id === m.id}
              onClick={() => setPersona(m.id)}
              className={`min-h-11 whitespace-nowrap rounded-full px-2 text-[13px] font-semibold transition-colors sm:px-5 ${persona.id === m.id ? "bg-accent text-accent-ink" : "text-ink-2 hover:text-ink"}`}
            >
              <span className="sm:hidden" aria-hidden="true">{m.short}</span>
              <span className="hidden sm:inline">{m.label}</span>
              <span className="sr-only sm:hidden">{m.label}</span>
            </button>
          ))}
        </div>
        {!inMoment && <span className="text-[12px] text-ink-2">Lens: {persona.name}</span>}
      </div>
      {inMoment && (
        <ol className="mt-4 grid grid-cols-1 gap-0 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {answers.map((a) => (
            <li key={a.href} className="sm:px-5 sm:first:pl-0 sm:last:pr-0">
              <a
                href={a.href}
                onClick={a.onClick ? (e) => (e.preventDefault(), a.onClick!()) : undefined}
                className="flex min-h-11 items-baseline gap-3 rounded-[12px] py-2.5 hover:bg-surface-2 sm:px-2"
              >
                <span className="zaehler tabular min-w-[2ch] text-[28px] font-semibold leading-none" style={{ fontFamily: "var(--font-display, inherit)" }}>{a.value}</span>
                <span className="text-[13px] leading-snug text-ink-2">{a.text}</span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
