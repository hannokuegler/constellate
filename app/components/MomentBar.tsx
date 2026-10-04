"use client";

interface Answer {
  href: string;
  value: string;
  text: string;
}

const jump = "inline-block py-2.5 -my-2.5 font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-current";

/**
 * Calm key-figure row at the top of a disease page (groups, open studies, related diagnoses; each jumps to its section),
 * and one "What now?" sentence that points to the next three places in the order a person needs them.
 */
export default function MomentBar({ diseaseLabel, orgs, hasGap, openStudies, neighbours, onActionCard }: {
  diseaseLabel: string;
  orgs: number;
  hasGap: boolean;
  openStudies: number;
  neighbours: number;
  /** opens the action card for the default related disease; undefined when there is no related disease */
  onActionCard?: () => void;
}) {
  const answers: Answer[] = [
    { href: "#patient-organisations", value: `${orgs}`, text: orgs ? `patient group${orgs > 1 ? "s" : ""} for ${diseaseLabel}` : hasGap ? "patient groups for this exact diagnosis (honest gap): what we searched and the nearest ones" : "patient groups in the checked list" },
    { href: "#open-studies", value: `${openStudies}`, text: `open stud${openStudies === 1 ? "y" : "ies"} that list ${diseaseLabel}` },
    { href: "#related", value: `${neighbours}`, text: "related diagnoses whose families and researchers may help" },
  ];

  return (
    <section className="card mt-5 px-4 py-4 md:px-5" aria-label="At a glance">
      <ol className="grid grid-cols-1 gap-0 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {answers.map((a) => (
          <li key={a.href} className="sm:px-5 sm:first:pl-0 sm:last:pr-0">
            <a href={a.href} className="flex min-h-11 items-baseline gap-3 rounded-[12px] py-2.5 hover:bg-surface-2 sm:px-2">
              <span className="zaehler tabular min-w-[2ch] text-[28px] font-semibold leading-none" style={{ fontFamily: "var(--font-display, inherit)" }}>{a.value}</span>
              <span className="text-[15px] leading-snug text-ink-2">{a.text}</span>
            </a>
          </li>
        ))}
      </ol>
      <p className="mt-3 border-t border-line pt-3 text-[17px] leading-relaxed">
        <span className="font-semibold">What now?</span>{" "}
        {orgs ? (
          <>Start with <a href="#patient-organisations" className={jump}>the patient groups</a></>
        ) : (
          <>Start with <a href="#patient-organisations" className={jump}>the honest gap and the nearest communities</a></>
        )}
        {neighbours > 0 ? (
          <>, compare <a href="#related" className={jump}>related diagnoses</a>{onActionCard ? <> and open an <button type="button" onClick={onActionCard} className={jump}>action card</button> for the closest one</> : null}.</>
        ) : (
          "."
        )}
      </p>
    </section>
  );
}
