"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { loadIndexMap } from "@/lib/data";
import { diseaseHref, toNodeId } from "@/lib/ids";
import Dot from "@/components/brand/Dot";
import DotChain from "@/components/brand/DotChain";
import {
  DISEASE_FIELD,
  EMPTY_VALUES,
  KINDS,
  PRIVACY_NOTICE,
  buildIssueUrl,
  issueText,
  issueTitle,
  kindById,
  validateAll,
  validateField,
  type Draft,
  type FieldKey,
  type FieldSpec,
  type KindId,
  type Values,
} from "./issue";

type Step = 1 | 2 | 3;
type Errors = Partial<Record<FieldKey, string>>;

const STEP_NAMES = ["Choose", "Details", "Check and send"];

/** The disease id from `?disease=` (or the short form `?d=`). Only a well-formed MONDO id is accepted, anything else is ignored (never echoed). */
function parseDiseaseId(raw: string | null): string | null {
  if (!raw) return null;
  const id = toNodeId(raw.trim());
  return /^MONDO:\d{1,10}$/.test(id) ? id : null;
}

/** `rawDisease` comes from the server page (?disease= or ?d=), so the first step renders on the server at full height (no layout shift). */
export default function ShareFlow({ rawDisease = null }: { rawDisease?: string | null }) {
  const diseaseId = parseDiseaseId(rawDisease);
  const [diseaseLabel, setDiseaseLabel] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [kindId, setKindId] = useState<KindId | null>(null);
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Errors>({});
  const [choiceError, setChoiceError] = useState(false);
  const [sent, setSent] = useState(false);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (!diseaseId) return;
    let live = true;
    loadIndexMap().then(
      (map) => live && setDiseaseLabel(map.get(diseaseId)?.label ?? null),
      () => live && setDiseaseLabel(null),
    );
    return () => {
      live = false;
    };
  }, [diseaseId]);

  // after each step change the new heading takes focus: keyboard and screen-reader users land at the top of the new step
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step, sent]);

  const kind = kindById(kindId);
  const disease = diseaseId ? { id: diseaseId, label: diseaseLabel } : null;
  const fields: FieldSpec[] = useMemo(() => (kind ? (diseaseId ? kind.fields : [...kind.fields, DISEASE_FIELD]) : []), [kind, diseaseId]);
  const draft: Draft | null = kind ? { kind, values, disease } : null;
  const issueUrl = draft ? buildIssueUrl(draft) : "";

  function setValue(key: FieldKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    // an error disappears as soon as the text is fine again, a new one only shows on blur or on Continue
    if (errors[key]) {
      const spec = fields.find((f) => f.key === key);
      const message = spec ? validateField(spec, value) : null;
      setErrors((current) => ({ ...current, [key]: message ?? undefined }));
    }
  }

  function checkOnBlur(spec: FieldSpec) {
    if (!values[spec.key].trim()) return;
    setErrors((current) => ({ ...current, [spec.key]: validateField(spec, values[spec.key]) ?? undefined }));
  }

  function chooseKind(event: FormEvent) {
    event.preventDefault();
    if (!kindId) {
      setChoiceError(true);
      return;
    }
    setStep(2);
  }

  function submitDetails(event: FormEvent) {
    event.preventDefault();
    const found = validateAll(fields, values);
    const next: Errors = {};
    for (const error of found) next[error.key] = error.message;
    setErrors(next);
    if (found.length) {
      document.getElementById(`share-${found[0].key}`)?.focus();
      return;
    }
    setCopy("idle");
    setStep(3);
  }

  async function copyText() {
    if (!draft) return;
    const text = `${issueTitle(draft)}\n\n${issueText(draft)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  }

  function startOver() {
    setKindId(null);
    setValues(EMPTY_VALUES);
    setErrors({});
    setChoiceError(false);
    setCopy("idle");
    setSent(false);
    setStep(1);
  }

  const aboutLine = diseaseId ? (diseaseLabel ?? diseaseId) : null;

  return (
    <div className="mx-auto mt-8 max-w-[640px] pb-8 md:mt-12">
      <p className="t-label">Share what you know</p>
      {aboutLine && (
        <p className="mt-1 text-[16px] text-ink-2">
          About: <span className="font-medium text-ink">{aboutLine}</span>
        </p>
      )}

      {sent ? (
        <Thanks headingRef={headingRef} issueUrl={issueUrl} disease={diseaseId} diseaseLabel={diseaseLabel} onRestart={startOver} />
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3" data-share-progress>
            <DotChain states={STEP_NAMES.map((_, i) => (i + 1 < step ? "linked" : i + 1 === step ? "lit" : "idle"))} />
            <p className="text-[16px] text-ink-2">
              Step {step} of 3: {STEP_NAMES[step - 1]}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={chooseKind} noValidate className="mt-6">
              <h1 ref={headingRef} tabIndex={-1} className="t-h1 outline-none">
                What would you like to share?
              </h1>
              <p className="mt-2 max-w-[56ch] text-ink-2">
                Every note is read by a person before it can appear in the data. Nothing is published automatically.
              </p>
              <fieldset className="mt-6" aria-describedby={choiceError ? "share-choice-error" : undefined}>
                <legend className="sr-only">What would you like to share?</legend>
                <div className="grid gap-3">
                  {KINDS.map((option) => {
                    const checked = kindId === option.id;
                    return (
                      <label
                        key={option.id}
                        className="card relative flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-2 has-[:checked]:border-amber has-[:checked]:bg-amber-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amber"
                      >
                        <input
                          type="radio"
                          name="share-kind"
                          value={option.id}
                          checked={checked}
                          onChange={() => {
                            setKindId(option.id);
                            setChoiceError(false);
                          }}
                          className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-[20px] opacity-0 outline-none"
                        />
                        <span className="mt-[9px]" aria-hidden="true">
                          <Dot state={checked ? "lit" : "idle"} />
                        </span>
                        <span>
                          <span className="block text-[17px] font-semibold leading-snug">{option.title}</span>
                          <span className="mt-0.5 block text-[16px] text-ink-2">{option.blurb}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {choiceError && (
                  <p id="share-choice-error" role="alert" className="mt-3 flex items-start gap-2 text-[15px] text-contra">
                    <ErrorMark />
                    Please choose one of the options.
                  </p>
                )}
              </fieldset>
              <div className="mt-6">
                <button type="submit" className="btn-primary">
                  Continue
                </button>
              </div>
            </form>
          )}

          {step === 2 && kind && (
            <form onSubmit={submitDetails} noValidate className="mt-6">
              <h1 ref={headingRef} tabIndex={-1} className="t-h1 outline-none">
                Tell us about it
              </h1>
              <p className="mt-2 text-ink-2">{kind.title}</p>
              {kind.note && <p className="mt-3 rounded-[12px] bg-surface-2 px-4 py-3 text-[15px]">{kind.note}</p>}
              <div className="mt-6 grid gap-5">
                {fields.map((spec) => (
                  <Field key={spec.key} spec={spec} value={values[spec.key]} error={errors[spec.key]} onChange={(v) => setValue(spec.key, v)} onBlur={() => checkOnBlur(spec)} />
                ))}
              </div>
              <PrivacyNotice />
              {Object.values(errors).some(Boolean) && (
                <p role="alert" className="mt-4 text-[15px] text-contra">
                  Please check the marked fields.
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button type="submit" className="btn-primary">
                  Preview my note
                </button>
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
              </div>
            </form>
          )}

          {step === 3 && draft && (
            <div className="mt-6">
              <h1 ref={headingRef} tabIndex={-1} className="t-h1 outline-none">
                Check and send
              </h1>
              <p className="mt-2 text-ink-2">This is exactly what will be sent. Use Back to change anything.</p>
              <section className="card mt-5 px-5 py-5" aria-label="Preview of your note">
                <p className="t-label">Title</p>
                <p className="mt-1 text-[17px] font-semibold" data-share-title>
                  {issueTitle(draft)}
                </p>
                <p className="t-label mt-4">Note</p>
                <div className="mt-1 select-all whitespace-pre-wrap break-words text-[17px] leading-relaxed" data-share-body>
                  {issueText(draft)}
                </div>
              </section>
              <PrivacyNotice />
              <p className="mt-4 text-[16px] text-ink-2">
                GitHub opens in a new tab with your note filled in. It is sent only when you press <span className="font-medium text-ink">Submit new issue</span> there. A person then checks it.
              </p>
              <p className="mt-4 text-[16px] font-semibold text-ink" data-share-public>
                GitHub issues are public. Do not include names or anything that identifies you or your family.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a href={issueUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" data-share-github onClick={() => setSent(true)}>
                  Open GitHub to send<span className="sr-only"> (opens in a new tab)</span>
                </a>
                {/* the way without a GitHub account sits right next to the main button, not at the end */}
                <button type="button" className="btn-secondary" onClick={copyText}>
                  Copy text
                </button>
                <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
                  Back
                </button>
              </div>
              <p role="status" className="mt-2 min-h-6 text-[16px] text-ink-2">
                {copy === "copied" && "Copied. Nothing has been sent yet."}
                {copy === "failed" && "Copying did not work here. Select the note above and copy it by hand."}
              </p>
              <div className="mt-6 border-t border-line pt-5">
                <h2 className="t-h2">No GitHub account?</h2>
                <p className="mt-2 text-[16px] text-ink-2">Use Copy text and give the note to your patient group or to anyone who can post it for you. It works the same way.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PrivacyNotice() {
  return (
    <p className="mt-6 flex items-start gap-3 rounded-[12px] border border-line-strong bg-surface px-4 py-3 text-[15px]" data-share-privacy>
      <span className="mt-[7px]" aria-hidden="true">
        <span className="dot-ring" />
      </span>
      <span>{PRIVACY_NOTICE}</span>
    </p>
  );
}

function ErrorMark() {
  return (
    <svg className="mt-[3px] shrink-0" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 4.5v4.2M8 10.9v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Field({ spec, value, error, onChange, onBlur }: { spec: FieldSpec; value: string; error?: string; onChange: (value: string) => void; onBlur: () => void }) {
  const uid = useId();
  const id = `share-${spec.key}`;
  const hintId = `${uid}-hint`;
  const errorId = `${uid}-error`;
  const describedBy = [spec.hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name: spec.key,
    value,
    maxLength: spec.maxLength,
    required: spec.required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    autoComplete: spec.autoComplete ?? "off",
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    onBlur,
    className: `block w-full rounded-[12px] border bg-surface-2 px-4 text-[17px] text-ink placeholder:text-ink-2 ${error ? "border-contra" : "border-line-strong"}`,
  };
  return (
    <div>
      <label htmlFor={id} className="block text-[15px] font-semibold">
        {spec.label}
        {spec.required && <span className="font-normal text-ink-2"> (required)</span>}
      </label>
      {spec.hint && (
        <p id={hintId} className="mt-0.5 text-[16px] text-ink-2">
          {spec.hint}
        </p>
      )}
      {spec.multiline ? <textarea {...common} rows={4} className={`${common.className} mt-2 min-h-28 py-3`} /> : <input {...common} type={spec.key === "link" ? "url" : "text"} inputMode={spec.key === "link" ? "url" : undefined} className={`${common.className} mt-2 min-h-12`} />}
      {error && (
        <p id={errorId} role="alert" className="mt-2 flex items-start gap-2 text-[15px] text-contra">
          <ErrorMark />
          {error}
        </p>
      )}
    </div>
  );
}

function Thanks({ headingRef, issueUrl, disease, diseaseLabel, onRestart }: { headingRef: React.RefObject<HTMLHeadingElement | null>; issueUrl: string; disease: string | null; diseaseLabel: string | null; onRestart: () => void }) {
  return (
    <div className="mt-6" data-share-thanks>
      <div className="flex items-center gap-3">
        <DotChain states={["linked", "linked", "lit"]} />
      </div>
      <h1 ref={headingRef} tabIndex={-1} className="t-h1 mt-4 outline-none">
        Thank you. A person reads it next.
      </h1>
      <p className="mt-3 rounded-[12px] bg-surface-2 px-4 py-3 text-[15px]">
        GitHub opened in a new tab. Your note is sent only when you press <span className="font-semibold">Submit new issue</span> there.
      </p>
      <h2 className="t-h2 mt-8">What happens now</h2>
      <ol className="mt-3 grid gap-3 text-[17px]">
        <li className="flex gap-3">
          <Dot className="mt-[10px]" />
          <span>A curator reads your note and checks the source.</span>
        </li>
        <li className="flex gap-3">
          <Dot className="mt-[10px]" />
          <span>If it holds up, it goes into the next data release, with the source attached.</span>
        </li>
        <li className="flex gap-3">
          <Dot className="mt-[10px]" />
          <span>Nothing is published automatically. If we cannot verify it, it stays out.</span>
        </li>
      </ol>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" onClick={onRestart}>
          Share something else
        </button>
        <Link href={disease ? diseaseHref(disease) : "/"} className="btn-secondary">
          {disease ? `Back to ${diseaseLabel ?? "the disease page"}` : "Back to the map"}
        </Link>
      </div>
      <p className="mt-5 text-[16px] text-ink-2">
        The tab did not open?{" "}
        <a href={issueUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-2">
          Open GitHub again<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </div>
  );
}
