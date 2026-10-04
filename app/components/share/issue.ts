// Pure logic for the share flow: kinds, fields, browser-side privacy check and the pre-filled GitHub issue link.
// No network, no storage: the visitor's text goes nowhere until they press "Submit new issue" on GitHub themselves.

export const ISSUE_NEW_URL = "https://github.com/hannokuegler/constellate/issues/new";
export const ISSUE_TEMPLATE = "share-what-you-know.yml";
/** GitHub rejects very long query strings; stay well below the ~8,000 character limit. */
export const MAX_URL_LENGTH = 7000;

export const PRIVACY_NOTICE = "Please do not include names, dates of birth, medical records or anything that identifies a person.";

export type KindId = "org" | "registry" | "trial" | "correction" | "family";
export type FieldKey = "name" | "link" | "country" | "description" | "disease";

export interface FieldSpec {
  key: FieldKey;
  label: string;
  hint?: string;
  required: boolean;
  multiline?: boolean;
  maxLength: number;
  autoComplete?: string;
}

export interface KindSpec {
  id: KindId;
  /** Card title on step 1, also the radio's accessible name. */
  title: string;
  /** One line under the card title. */
  blurb: string;
  /** Short name used in the issue title and body. */
  short: string;
  note?: string;
  fields: FieldSpec[];
}

const LINK_HINT = "A public web page that shows it. Not a private document.";

export const KINDS: KindSpec[] = [
  {
    id: "org",
    title: "A patient organisation or support group we know",
    blurb: "A group that supports families with this diagnosis.",
    short: "Patient organisation or support group",
    fields: [
      { key: "name", label: "Name of the group", required: true, maxLength: 120 },
      { key: "link", label: "Link to a public source", hint: "Their website, or a public page that mentions them.", required: true, maxLength: 300, autoComplete: "off" },
      { key: "country", label: "Country", hint: "Optional.", required: false, maxLength: 80 },
      { key: "description", label: "What do they do?", hint: "Optional. One or two sentences.", required: false, multiline: true, maxLength: 1200 },
    ],
  },
  {
    id: "registry",
    title: "A registry or natural-history study",
    blurb: "A place that collects knowledge about how a disease unfolds.",
    short: "Registry or natural-history study",
    fields: [
      { key: "name", label: "Name of the registry or study", required: true, maxLength: 120 },
      { key: "link", label: "Link to a public source", hint: "The registry's own page, a publication, or its ClinicalTrials.gov entry.", required: true, maxLength: 300, autoComplete: "off" },
      { key: "country", label: "Country", hint: "Optional.", required: false, maxLength: 80 },
      { key: "description", label: "What does it collect or study?", hint: "Optional. One or two sentences.", required: false, multiline: true, maxLength: 1200 },
    ],
  },
  {
    id: "trial",
    title: "A study that is looking for participants",
    blurb: "A trial or study that is recruiting right now.",
    short: "Study looking for participants",
    fields: [
      { key: "name", label: "Name of the study", required: true, maxLength: 120 },
      { key: "link", label: "Link to a public source", hint: "The study page, for example on ClinicalTrials.gov.", required: true, maxLength: 300, autoComplete: "off" },
      { key: "country", label: "Where is it recruiting?", hint: "Optional.", required: false, maxLength: 80 },
      { key: "description", label: "Who can take part?", hint: "Optional. As the study page says it, in a sentence or two.", required: false, multiline: true, maxLength: 1200 },
    ],
  },
  {
    id: "correction",
    title: "A broken link or a correction",
    blurb: "Something here is wrong, out of date or does not open.",
    short: "Broken link or correction",
    fields: [
      { key: "name", label: "Which page or entry is it about?", hint: "Paste the page address or name the disease, group or study.", required: true, maxLength: 300 },
      { key: "link", label: "Link to a public source", hint: "A public page that shows the correct information.", required: true, maxLength: 300, autoComplete: "off" },
      { key: "description", label: "What should be changed?", required: true, multiline: true, maxLength: 1200 },
    ],
  },
  {
    id: "family",
    title: "What helped our family",
    blurb: "A resource, habit or contact that helped. No personal details.",
    short: "What helped a family",
    note: "This is shared experience, not medical advice. A curator reads it before anything is used.",
    fields: [
      { key: "name", label: "What helped, in a few words", required: true, maxLength: 120 },
      { key: "description", label: "How did it help other families?", hint: "Describe the idea or resource, not your family.", required: true, multiline: true, maxLength: 1200 },
      { key: "link", label: "Link to a public source", hint: `Optional. ${LINK_HINT}`, required: false, maxLength: 300, autoComplete: "off" },
      { key: "country", label: "Country", hint: "Optional.", required: false, maxLength: 80 },
    ],
  },
];

export const DISEASE_FIELD: FieldSpec = {
  key: "disease",
  label: "Which disease is it about?",
  hint: "Optional.",
  required: false,
  maxLength: 120,
};

export type Values = Record<FieldKey, string>;
export const EMPTY_VALUES: Values = { name: "", link: "", country: "", description: "", disease: "" };

export const kindById = (id: KindId | null): KindSpec | null => KINDS.find((k) => k.id === id) ?? null;

// ---------------------------------------------------------------------------------------------
// Privacy check: a safety net in the browser, not a guarantee. A human reads every note anyway.
// ---------------------------------------------------------------------------------------------

const MONTHS = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const EMAIL = /[^\s@]+@[^\s@]+\.[A-Za-z]{2,}/;
const DATE_NUMERIC = /(?<!\d)(?:0?[1-9]|[12]\d|3[01])[./-](?:0?[1-9]|1[0-2])[./-](?:\d{4}|\d{2})(?!\d)/; // 28.08.2003, 28/08/2003
const DATE_ISO = /(?<!\d)(?:19|20)\d{2}-\d{2}-\d{2}(?!\d)/; // 2003-08-28
const DATE_WORDS = new RegExp(`(?<!\\d)\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTHS}\\.?,?\\s+\\d{4}|\\b${MONTHS}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}`, "i");
const PHONE_CANDIDATE = /(?<![\w])\+?\(?\d[\d\s().\/-]{5,}\d(?!\w)/g;
const YEAR_RANGE = /^\d{4}\s*[-/]\s*\d{4}$/;

export type PrivacyIssue = "email" | "phone" | "date";

export const PRIVACY_MESSAGES: Record<PrivacyIssue, string> = {
  email: "This looks like an email address. Please take it out: we do not need contact details here.",
  phone: "This looks like a phone number. Please take it out: we do not need contact details here.",
  date: "This looks like an exact date, such as a birthday. Please take it out. A year on its own is fine.",
};

/** First thing in the text that looks like contact data or an exact date, else null. */
export function findPrivacyIssue(text: string, opts: { link?: boolean } = {}): PrivacyIssue | null {
  if (EMAIL.test(text)) return "email";
  if (opts.link) return null; // addresses carry long digit runs (NCT numbers, ids), only e-mails are checked
  if (DATE_NUMERIC.test(text) || DATE_ISO.test(text) || DATE_WORDS.test(text)) return "date";
  for (const match of text.matchAll(PHONE_CANDIDATE)) {
    const candidate = match[0].replace(/^[^\d]+|[^\d]+$/g, "");
    if (YEAR_RANGE.test(candidate)) continue;
    if (candidate.replace(/\D/g, "").length >= 8) return "phone";
  }
  return null;
}

/** Turns what people paste ("www.orpha.net/x") into a full https address, or null when it is not a web address. */
export function normaliseLink(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export interface FieldError {
  key: FieldKey;
  message: string;
}

export function validateField(spec: FieldSpec, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return spec.required ? `Please fill in “${spec.label.replace(/[?.]$/, "")}”.` : null;
  const privacy = findPrivacyIssue(trimmed, { link: spec.key === "link" });
  if (privacy) return PRIVACY_MESSAGES[privacy];
  if (spec.key === "link" && !normaliseLink(trimmed)) return "Please paste a full web address, for example https://example.org.";
  return null;
}

export function validateAll(specs: FieldSpec[], values: Values): FieldError[] {
  const errors: FieldError[] = [];
  for (const spec of specs) {
    const message = validateField(spec, values[spec.key]);
    if (message) errors.push({ key: spec.key, message });
  }
  return errors;
}

// ---------------------------------------------------------------------------------------------
// The note itself and the GitHub link
// ---------------------------------------------------------------------------------------------

export interface Draft {
  kind: KindSpec;
  values: Values;
  /** MONDO id and resolved name when the visitor came from a disease page. */
  disease?: { id: string; label: string | null } | null;
}

const clean = (text: string) => text.trim().replace(/\r\n?/g, "\n");

export function diseaseLine(draft: Draft): string {
  if (draft.disease) return draft.disease.label ? `${draft.disease.label} (${draft.disease.id})` : draft.disease.id;
  return clean(draft.values.disease);
}

export function issueTitle(draft: Draft): string {
  const name = clean(draft.values.name).replace(/\s+/g, " ").slice(0, 90);
  const about = draft.disease?.label ?? clean(draft.values.disease).slice(0, 40);
  return `Share: ${draft.kind.short}${name ? `: ${name}` : ""}${about ? ` (${about})` : ""}`;
}

export function sourceOf(draft: Draft): string {
  const link = clean(draft.values.link);
  return link ? (normaliseLink(link) ?? link) : "";
}

/** Plain text, readable on its own. The same text is prefilled on GitHub and copied for people without an account. */
export function issueText(draft: Draft, descriptionLimit = Infinity): string {
  const { kind, values } = draft;
  const lines: string[] = [`What I would like to share: ${kind.short}`];
  const about = diseaseLine(draft);
  if (about) lines.push(`About: ${about}`);
  const labelOf = (key: FieldKey) => kind.fields.find((f) => f.key === key)?.label.replace(/[?:]$/, "");
  for (const key of ["name", "country"] as const) {
    const value = clean(values[key]);
    if (value && labelOf(key)) lines.push(`${labelOf(key)}: ${value}`);
  }
  const source = sourceOf(draft);
  if (source) lines.push(`Link to a public source: ${source}`);
  const description = clean(values.description);
  if (description && labelOf("description")) {
    const shown = description.length > descriptionLimit ? `${description.slice(0, descriptionLimit).trimEnd()} [shortened]` : description;
    const heading = kind.fields.find((f) => f.key === "description")!.label;
    lines.push("", heading.endsWith("?") ? heading : `${heading}:`, shown);
  }
  return lines.join("\n");
}

/** Pre-filled issue-form link. Issue forms fill fields by their id (see .github/ISSUE_TEMPLATE/share-what-you-know.yml); `body` is ignored by forms. */
export function buildIssueUrl(draft: Draft): string {
  const make = (descriptionLimit: number) => {
    const params = new URLSearchParams();
    params.set("template", ISSUE_TEMPLATE);
    params.set("title", issueTitle(draft));
    params.set("kind", draft.kind.short);
    const about = diseaseLine(draft);
    if (about) params.set("disease", about);
    const source = sourceOf(draft);
    if (source) params.set("source", source);
    params.set("details", issueText(draft, descriptionLimit));
    // URLSearchParams writes spaces as "+", GitHub reads both; %20 is unambiguous
    return `${ISSUE_NEW_URL}?${params.toString().replace(/\+/g, "%20")}`;
  };
  let limit = 1200;
  let url = make(limit);
  while (url.length > MAX_URL_LENGTH && limit > 100) {
    limit = Math.floor(limit * 0.7);
    url = make(limit);
  }
  return url;
}
