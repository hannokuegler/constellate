# Seven-slide deck: first draft

Stand 2026-10-04, 05:13, Europe/Vienna. Editable PowerPoint with English speaker notes and a PDF viewing copy. Deep Sky palette, Fraunces and Inter. Exactly seven slides: Maria, shared biology, product, evidence, data, moonshot, team and ask.

## Before the final version

| When | Owner | Required result |
|---|---|---|
| After 10:30 | Recep, with Hanno's final design | Capture the live diagnosis/next-step view, related diseases/Action Card, and contribution flow for slide 3; evidence panel and Honest Gap for slide 4. Keep source labels readable. Use the approved `maria` design only when it is actually available. |
| By 11:00 | Recep | Review the first deck with Hanno; confirm visible product behavior, data export version and spoken claims. |
| Before 13:00 | Recep + Hanno | Replace screenshot placeholders, retest links, rehearse, and approve the final deck for submission. If a planned feature is absent, change the wording rather than show a fabricated screenshot. |
| Before presenting a speedup | Recep + Hanno | Review [MOONSHOT.md](../docs/MOONSHOT.md); supply actual timings and equal-quality review evidence, or retain the explicitly unmeasured ambition. |

## Evidence decisions

- Data uses `maria` commit `d3826206bbdd6a4840242ddff82d9ddebcd675f8`, export `2026-10-04+36da1b9`. `main` was older at inspection. The slide is an export snapshot, not proof of the current deployment.
- Meta counts: 874 diseases, 350 core diseases, 524 neighbours by subtraction, 1,066 genes, 5,642 phenotype terms. The sum of `counts.edges` is 46,342. Inferred links are labeled, so “all experimentally proven connections” would be wrong.
- Trial inventory: 142 JSON records, comprising 94 RECRUITING, 31 NOT_YET_RECRUITING, 16 ENROLLING_BY_INVITATION and 1 AVAILABLE. Slide wording is “study records with open statuses”, not “142 recruiting studies”.
- `counts.orgs.orgs = 39` with method `cache-judge`. The count alone does not prove human verification of all organizations. Slide wording is “patient organizations in the export”.
- Extract precision 0.897, n = 165, is explicitly an independent model review. It is not a hand review or a clinical validation.
- Krabbe: no approved medicine found in the exported EMA/FDA searches, retrieved 2026-10-03. Do not generalize that finding to every jurisdiction.
- MLD: Libmeldy EU authorization 2020-12-17 and Lenmeldy FDA approval 2024-03-18, restricted to eligible MLD patients. HOME (NCT04628364) is a separate natural-history study, not the approval comparison cohort. Treatment approval does not transfer to Krabbe.
- The slides state Claude extraction. No claim that OpenAI powers the current product or that the team qualifies for the track prize; Hanno's clarification remains open.
- Opening and closing starfields are generated metaphor illustrations, not scientific data or real patient photographs. Product screenshots remain explicit placeholders until capture.

## Final-screen check

Slide 3 must show treatment status, communities, studies and next steps in plain language; the related-disease view must retain the MLD/Krabbe and expert-review boundary. Confirm the contribution flow accepts public research knowledge without personal data and has human review before stating it as deployed behavior. Slide 4 must show source, date, evidence level, confidence and counter-evidence, plus the Honest Gap search scope and date.

PowerPoint text is editable. Fraunces and Inter are named in the file; install the matching fonts when editing on another machine. The PDF preserves the reviewed appearance. No final screenshots, measured speedup or completed video exports are claimed in this first draft.
