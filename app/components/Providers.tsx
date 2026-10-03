"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Edge } from "@/lib/types";
import { DEFAULT_PERSONA, personaById, type Persona, type PersonaId } from "@/lib/persona";
import EdgePanel from "./EdgePanel";

// ---------------------------------------------------------------------------------------------------
// Persona + theme (per-viewer conveniences, kept in localStorage, failures ignored)

type ThemeChoice = "auto" | "light" | "dark";

interface Prefs {
  persona: Persona;
  setPersona: (id: PersonaId) => void;
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;
}

const PrefsContext = createContext<Prefs | null>(null);

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode: preference just does not persist */
  }
}

// ---------------------------------------------------------------------------------------------------
// Edge panel: any view registers the edges and labels it shows; [e_xxx] links open the drawer by id.

interface EdgePanelApi {
  openEdge: (edge: Edge | string) => void;
  register: (edges: Iterable<Edge>, labels: Record<string, string>) => void;
  hasEdge: (id: string) => boolean;
  labelOf: (id: string) => string;
}

const EdgeContext = createContext<EdgePanelApi | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const [personaId, setPersonaId] = useState<PersonaId>(DEFAULT_PERSONA);
  const [theme, setThemeState] = useState<ThemeChoice>("auto");

  useEffect(() => {
    // restoring the stored preference after hydration is intentional (server render has no localStorage)
    setPersonaId(personaById(readStorage("constellate.persona")).id);
    const storedTheme = readStorage("constellate.theme");
    if (storedTheme === "light" || storedTheme === "dark") setThemeState(storedTheme);
  }, []);

  const setPersona = useCallback((id: PersonaId) => {
    setPersonaId(id);
    writeStorage("constellate.persona", id);
  }, []);

  const setTheme = useCallback((t: ThemeChoice) => {
    setThemeState(t);
    writeStorage("constellate.theme", t);
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  }, []);

  const prefs = useMemo(() => ({ persona: personaById(personaId), setPersona, theme, setTheme }), [personaId, setPersona, theme, setTheme]);

  // edge registry
  const edgesRef = useRef(new Map<string, Edge>());
  const labelsRef = useRef<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [missingId, setMissingId] = useState<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const register = useCallback((edges: Iterable<Edge>, labels: Record<string, string>) => {
    for (const e of edges) edgesRef.current.set(e.id, e);
    Object.assign(labelsRef.current, labels);
  }, []);

  const openEdge = useCallback((edge: Edge | string) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    if (typeof edge !== "string") edgesRef.current.set(edge.id, edge);
    const id = typeof edge === "string" ? edge : edge.id;
    if (edgesRef.current.has(id)) {
      setMissingId(null);
      setOpenId(id);
    } else {
      setOpenId(null);
      setMissingId(id);
    }
  }, []);

  const close = useCallback(() => {
    setOpenId(null);
    setMissingId(null);
    returnFocus.current?.focus?.();
  }, []);

  const api = useMemo<EdgePanelApi>(
    () => ({
      openEdge,
      register,
      hasEdge: (id) => edgesRef.current.has(id),
      labelOf: (id) => labelsRef.current[id] ?? id,
    }),
    [openEdge, register],
  );

  return (
    <PrefsContext.Provider value={prefs}>
      <EdgeContext.Provider value={api}>
        {children}
        {(openId || missingId) && (
          <EdgePanel
            edge={openId ? edgesRef.current.get(openId)! : null}
            missingId={missingId}
            labelOf={api.labelOf}
            onClose={close}
          />
        )}
      </EdgeContext.Provider>
    </PrefsContext.Provider>
  );
}

export function usePrefs(): Prefs {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs outside Providers");
  return ctx;
}

export function useEdgePanel(): EdgePanelApi {
  const ctx = useContext(EdgeContext);
  if (!ctx) throw new Error("useEdgePanel outside Providers");
  return ctx;
}
