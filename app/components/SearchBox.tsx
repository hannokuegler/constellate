"use client";

import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadIndex } from "@/lib/data";
import { createSearcher, type SearchHit } from "@/lib/search";
import { hrefFor } from "@/lib/ids";
import type { IndexEntry } from "@/lib/types";
import { personaById, DEFAULT_PERSONA } from "@/lib/persona";
import { TypeBadge } from "./Badges";

type Searcher = ReturnType<typeof createSearcher>;
let searcherPromise: Promise<Searcher> | null = null;
function getSearcher(): Promise<Searcher> {
  searcherPromise ??= loadIndex().then((entries) => createSearcher((entries ?? []) as IndexEntry[]));
  searcherPromise.catch(() => (searcherPromise = null));
  return searcherPromise;
}

export default function SearchBox({ compact = false, autoFocus = false }: { compact?: boolean; autoFocus?: boolean }) {
  const persona = personaById(DEFAULT_PERSONA);
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [searcher, setSearcher] = useState<Searcher | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const deferred = useDeferredValue(query);

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
      setOpen(false);
    }
  };

  const showList = open && query.trim().length >= 2;

  return (
    <div className="relative w-full">
      <label className={compact ? "sr-only" : "search-label"} htmlFor={`${listId}-input`}>Type the diagnosis your family received.</label>
      <div className="search-field">
        <svg width={compact ? 16 : 20} height={compact ? 16 : 20} viewBox="0 0 20 20" className="shrink-0 text-ink-2" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M13 13l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && hits[active] ? `${listId}-${active}` : undefined}
          aria-label="Search diseases, genes, symptoms or IDs"
          placeholder="Search a disease or diagnosis"
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
          className="min-w-0 flex-1 bg-transparent"
        />
      </div>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="search-results"
        >
          {!searcher && !loadError && <li className="px-3 py-3 text-[15px] text-ink-2">Loading the index…</li>}
          {loadError && <li className="px-3 py-3 text-[15px] text-contra">Search could not load. <button className="button mt-3" onClick={() => { setLoadError(null); warm(); }}>Retry search</button></li>}
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
                <span className="block text-[17px] font-medium">{hit.entry.label}</span>
                {hit.matched && <span className="block text-[12px] text-ink-2">matches “{hit.matched}”</span>}
              </span>
              <span className="hidden shrink-0 text-[12px] text-ink-2 sm:inline">{hit.entry.id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
