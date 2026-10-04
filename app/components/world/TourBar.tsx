"use client";

// Guided tour bar, mounted once in the layout. Renders nothing unless the URL carries ?tour=hero&step=n.
// Bottom glass bar: dot chain (done = amber, linked), one sentence, edge ids in mono, source, Back / Next (44 px).
// Esc closes (unless a dialog or a text field has the key). While the tour runs, internal links keep the tour params.

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useEdgePanel } from "../Providers";
import { TOUR_ID, TOUR_STEPS, tourHref } from "./tour";

export default function TourBar() {
  return (
    <Suspense fallback={null}>
      <TourBarInner />
    </Suspense>
  );
}

function samePage(stepPath: string, pathname: string, search: URLSearchParams): boolean {
  const [path, query] = stepPath.split("?");
  if (path !== pathname) return false;
  if (!query) return true;
  return [...new URLSearchParams(query)].every(([k, v]) => search.get(k) === v);
}

function TourBarInner() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const edgePanel = useEdgePanel();
  const active = params.get("tour") === TOUR_ID;
  const total = TOUR_STEPS.length;
  const step = Math.min(Math.max(parseInt(params.get("step") ?? "1", 10) || 1, 1), total);
  const current = TOUR_STEPS[step - 1];
  const onStepPage = samePage(current.path, pathname, params);
  const [edgeReady, setEdgeReady] = useState(false);

  const close = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("tour");
    next.delete("step");
    const query = next.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  // Esc closes the tour
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector('[role="dialog"]')) return; // the evidence panel takes Esc first
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // keep the tour while the visitor follows links inside the app
  useEffect(() => {
    if (!active) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download") || anchor.closest("[data-tour-bar]")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.searchParams.has("tour")) return;
      // a link to the next step's page advances the tour, any other link keeps the current step
      const target = url.pathname + url.search;
      const nextIndex = TOUR_STEPS.findIndex((s, i) => i >= step && s.path === target);
      event.preventDefault();
      router.push(tourHref(target + url.hash, nextIndex >= 0 ? nextIndex + 1 : step));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [active, step, router]);

  // "Open evidence" only once the page has registered the edge (the panel opens by id)
  useEffect(() => {
    setEdgeReady(false);
    if (!active || !current.openEdge || !onStepPage) return;
    const id = current.openEdge;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      if (edgePanel.hasEdge(id)) {
        setEdgeReady(true);
        window.clearInterval(timer);
      } else if (tries > 40) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [active, current.openEdge, onStepPage, edgePanel]);

  if (!active) return null;

  return (
    <>
      {/* room at the end of the page, so the fixed bar never covers the last content */}
      <div aria-hidden="true" className="h-[240px] md:h-[190px]" />
      <section
        data-tour-bar
        aria-label={`Guided tour, step ${step} of ${total}`}
        className="glass fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[880px] rounded-t-[24px] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow)] md:bottom-4 md:w-[calc(100%-32px)] md:rounded-[24px] md:px-6 md:pb-4 md:pt-4 print:hidden"
      >
        <div className="flex items-center gap-3">
          <span className="dot-chain" role="img" aria-label={`Step ${step} of ${total}`} style={{ ["--dot-link" as string]: "14px" }}>
            {TOUR_STEPS.map((s, i) => (
              <span key={s.title} className="dot" data-state={i + 1 < step ? "linked" : i + 1 === step ? "lit" : "idle"} />
            ))}
          </span>
          <span className="t-label zaehler">
            Tour · {step}/{total}
          </span>
          <button
            type="button"
            onClick={close}
            className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-2 hover:text-ink"
            aria-label="Close tour (Esc)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <h2 className="t-h2 mt-1 text-ink">{current.title}</h2>
        <p className="mt-1 text-[15px] leading-snug text-ink md:text-[17px]">{current.text}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
          {current.ids.map((id) => (
            <code key={id} className="t-mono text-ink">
              {id}
            </code>
          ))}
          <span>Source: {current.source}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {step > 1 ? (
            <Link href={tourHref(TOUR_STEPS[step - 2].path, step - 1, TOUR_STEPS[step - 2].hash)} className="btn-secondary" scroll={step - 1 !== 1}>
              Back
            </Link>
          ) : (
            <button type="button" className="btn-secondary" aria-disabled="true" disabled>
              Back
            </button>
          )}
          {!onStepPage && (
            <Link href={tourHref(current.path, step, current.hash)} className="btn-secondary">
              Return to step {step}
            </Link>
          )}
          {onStepPage && edgeReady && current.openEdge && (
            <button type="button" className="btn-secondary" onClick={() => edgePanel.openEdge(current.openEdge!)}>
              Open evidence
            </button>
          )}
          {step < total ? (
            <Link href={tourHref(TOUR_STEPS[step].path, step + 1, TOUR_STEPS[step].hash)} className="btn-primary ml-auto">
              <span>
                Next<span className="hidden md:inline">: {TOUR_STEPS[step].title}</span>
              </span>
            </Link>
          ) : (
            <button type="button" onClick={close} className="btn-primary ml-auto">
              Finish tour
            </button>
          )}
        </div>
      </section>
    </>
  );
}
