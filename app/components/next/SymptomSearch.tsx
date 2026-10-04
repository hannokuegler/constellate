"use client";

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadIndex } from "@/lib/data";
import { createSearcher, type SearchHit } from "@/lib/search";
import { phenotypeHref } from "@/lib/ids";
import { usePrefs } from "../Providers";

type Searcher = ReturnType<typeof createSearcher>;
let phenotypeSearcher: Promise<Searcher> | null = null;
function getSearcher(): Promise<Searcher> {
  phenotypeSearcher ??= loadIndex().then((entries) => createSearcher((entries ?? []).filter((e) => e.type === "phenotype")));
  phenotypeSearcher.catch(() => (phenotypeSearcher = null));
  return phenotypeSearcher;
}

/** Second way in: a finding or symptom (HPO term) instead of a diagnosis. Opens /p/<HP id>. */
export default function SymptomSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const { persona } = usePrefs();
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [searcher, setSearcher] = useState<Searcher | null>(null);
  const [failed, setFailed] = useState(false);
  const deferred = useDeferredValue(query);

  useEffect(() => {
    getSearcher().then((fn) => setSearcher(() => fn), () => setFailed(true));
  }, []);

  const hits: SearchHit[] = useMemo(() => (searcher ? searcher(deferred, persona, 6) : []), [searcher, deferred, persona]);
  const showList = open && query.trim().length >= 2;

  const go = (hit: SearchHit | undefined) => {
    if (!hit) return;
    setOpen(false);
    router.push(phenotypeHref(hit.entry.id));
  };

  return (
    <div className="relative w-full">
      <div className="relative h-12 rounded-full border border-line bg-surface">
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && hits[active] ? `${listId}-${active}` : undefined}
          aria-label="Search symptoms and findings"
          placeholder="For example: leukodystrophy, seizures"
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(hits[active]);
            } else if (e.key === "Escape") setOpen(false);
          }}
          style={{ borderRadius: 9999 }}
          className="absolute inset-0 h-full w-full bg-transparent px-5 text-[17px] placeholder:text-ink-2"
        />
      </div>
      {showList && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-40 mt-2 max-h-[50vh] overflow-y-auto rounded-[20px] border border-line bg-surface p-2 shadow-[var(--shadow)]">
          {!searcher && !failed && <li className="px-3 py-3 text-[15px] text-ink-2">Loading the list of symptoms…</li>}
          {failed && <li className="px-3 py-3 text-[15px] text-contra">The list of symptoms could not be loaded. Please try again.</li>}
          {searcher && !hits.length && <li className="px-3 py-3 text-[15px] text-ink-2">No symptom matches “{query}”. Try another word or the term from the doctor&apos;s letter.</li>}
          {hits.map((hit, i) => (
            <li
              key={hit.entry.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(hit)}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-11 cursor-pointer flex-col justify-center rounded-[12px] px-3 py-2 ${i === active ? "bg-surface-2" : ""}`}
            >
              <span className="text-[15px] font-medium">{hit.entry.label}</span>
              {hit.matched && <span className="text-[12px] text-ink-2">matches “{hit.matched}”</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
