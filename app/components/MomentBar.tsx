"use client";

import type { PersonaId } from "@/lib/persona";
import { usePrefs } from "./Providers";

const MOMENTS: { id: PersonaId; label: string }[] = [
  { id: "family", label: "We just got the diagnosis" },
  { id: "nora", label: "I lead a patient group" },
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
    <section className="card mt-5 px-4 py-4" aria-label="Where are you right now?">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-ink-2">Where are you right now?</span>
        <div className="flex flex-wrap gap-1 rounded-full bg-surface-2 p-1" role="radiogroup" aria-label="Moment">
          {MOMENTS.map((m) => (
            <button
              key={m.id}
              role="radio"
              aria-checked={persona.id === m.id}
              onClick={() => setPersona(m.id)}
              className={`min-h-11 rounded-full px-4 text-[13px] font-semibold transition-colors ${persona.id === m.id ? "bg-accent text-accent-ink" : "text-ink-2 hover:text-ink"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {!inMoment && <span className="text-[12px] text-ink-2">Lens: {persona.name}</span>}
      </div>
      {inMoment && (
        <ol className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {answers.map((a) => (
            <li key={a.href}>
              <a
                href={a.href}
                onClick={a.onClick ? (e) => (e.preventDefault(), a.onClick!()) : undefined}
                className="flex min-h-11 items-baseline gap-2 rounded-[12px] px-2 py-1.5 hover:bg-surface-2"
              >
                <span className="tabular text-[22px] font-bold text-accent">{a.value}</span>
                <span className="text-[13px] leading-snug">{a.text}</span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
