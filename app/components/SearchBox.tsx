"use client";

import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadIndex } from "@/lib/data";
import { createSearcher, revealSuggestions, type SearchHit } from "@/lib/search";
import { hrefFor } from "@/lib/ids";
import type { IndexEntry } from "@/lib/types";
import { usePrefs } from "./Providers";
import { TypeBadge } from "./Badges";

type Searcher = ReturnType<typeof createSearcher>;
let searcherPromise: Promise<Searcher> | null = null;
function getSearcher(): Promise<Searcher> {
  searcherPromise ??= loadIndex().then((entries) => createSearcher((entries ?? []) as IndexEntry[]));
  searcherPromise.catch(() => (searcherPromise = null));
  return searcherPromise;
}

export default function SearchBox({
  compact = false,
  autoFocus = false,
  label = "Search diseases, genes, symptoms or IDs",
}: {
  compact?: boolean;
  autoFocus?: boolean;
  /** a second search box on the same page needs its own name */
  label?: string;
}) {
  const { persona } = usePrefs();
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [searcher, setSearcher] = useState<Searcher | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const deferred = useDeferredValue(query);
  // phones: the long placeholder would be cut off inside the pill
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 480px)");
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const warm = useCallback(() => {
    if (searcher) return;
    // the searcher is a function: wrap it, or React would call it as a state updater
    getSearcher().then((fn) => setSearcher(() => fn), (e: Error) => setLoadError(e.message));
  }, [searcher]);

  useEffect(() => {
    if (!compact) warm(); // start page: load the index right away
  }, [compact, warm]);

  const hits: SearchHit[] = useMemo(() => (searcher ? searcher(deferred, persona) : []), [searcher, deferred, persona]);

  const go = (hit: SearchHit | undefined) => {
    if (!hit) return;
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(hrefFor(hit.entry.type, hit.entry.id));
  };

  const showList = open && query.trim().length >= 2;

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(hits[active]);
    } else if (event.key === "Escape") {
      // first Esc closes the list (the browser would clear a search field), a second Esc clears the text
      if (showList) {
        event.preventDefault();
        setOpen(false);
      } else setQuery("");
    }
  };

  // phones: keep at least three suggestions on screen (the field may sit near the bottom or under the keyboard)
  useEffect(() => {
    if (showList) revealSuggestions(fieldRef.current);
  }, [showList, hits.length]);

  return (
    <div className="relative w-full">
      {/* the input fills the whole pill, so its own focus ring (global :focus-visible) follows the pill shape */}
      <div ref={fieldRef} className={`relative rounded-full border border-line bg-surface ${compact ? "h-12" : "h-14 shadow-[var(--shadow)] md:h-16"}`}>
        <svg
          width={compact ? 16 : 20}
          height={compact ? 16 : 20}
          viewBox="0 0 20 20"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-2 ${compact ? "left-4" : "left-5"}`}
          aria-hidden="true"
        >
          <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M13 13l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && hits[active] ? `${listId}-${active}` : undefined}
          aria-label={label}
          placeholder={narrow ? "Type a diagnosis" : persona.placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onFocus={() => {
            warm();
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          style={{ borderRadius: 9999 }}
          className={`absolute inset-0 h-full w-full bg-transparent placeholder:text-ink-2 ${compact ? "pl-10 pr-4 text-[16px]" : "pl-[53px] pr-5 text-[17px] md:text-[22px]"}`}
        />
      </div>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-[20px] border border-line bg-surface p-2 shadow-[var(--shadow)]"
        >
          {!searcher && !loadError && <li className="px-3 py-3 text-[15px] text-ink-2">Loading the index…</li>}
          {loadError && <li className="px-3 py-3 text-[15px] text-contra">Search index unavailable: {loadError}</li>}
          {searcher && !hits.length && (
            <li className="px-3 py-3 text-[15px] text-ink-2">
              No match for “{query}”. Try a synonym, a gene symbol or an ID such as ORPHA:487.
            </li>
          )}
          {hits.map((hit, i) => (
            <li
              key={hit.entry.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(hit)}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2 ${i === active ? "bg-surface-2" : ""}`}
            >
              <TypeBadge type={hit.entry.type} />
              <span className="min-w-0 flex-1">
                <span className="block break-words text-[15px] font-medium leading-snug">{hit.entry.label}</span>
                {hit.matched && <span className="block break-words text-[12px] text-ink-2">matches “{hit.matched}”</span>}
              </span>
              <span className="hidden shrink-0 text-[12px] text-ink-2 sm:inline">{hit.entry.id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
