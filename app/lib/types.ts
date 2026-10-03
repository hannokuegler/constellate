// Data contract v1 (see app/README.md). The pipeline writes these files to public/data/.

export type EvidenceLevel = "observed" | "curated" | "text_mined" | "inferred";
export type EdgeLevel = EvidenceLevel | "contradicted" | "search_hit";
export type NodeType = "disease" | "gene" | "phenotype" | "org";

export interface Evidence {
  db: string;
  origin?: string;
  record?: string;
  url?: string | null;
  level: EdgeLevel;
  date?: string;
  confidence?: number;
  snippet?: string;
  /** LLM-produced evidence (05 extract, 06 reconcile judge) stays attributable */
  model?: string;
  prompt_version?: string;
  claim?: string;
  predicate?: string;
  polarity?: string;
  study_context?: string;
  reason?: string;
  free_text_name?: string;
  draft_input?: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  evidence: Evidence[];
  contradicting: Evidence[];
  confidence: number;
  level: EdgeLevel;
  independent_sources?: string[];
  formula?: string;
  rolled_up_from?: string[];
  /** core.json: at most 3 evidence records without snippets; the full edge lives in the disease shard */
  evidence_omitted?: boolean;
}

export interface Ref {
  id: string;
  label: string;
}

export interface Meta {
  version: string;
  built_at: string;
  fixture: boolean;
  sources: { db: string; version?: string; license?: string; url?: string }[];
  /** flat ({diseases: n}) in the fixture, nested ({nodes: {disease: n}, edges: {type: n}}) from the pipeline */
  counts: Record<string, unknown>;
  hero: { start: string };
}

export interface IndexEntry {
  id: string;
  type: NodeType;
  label: string;
  synonyms: string[];
  xrefs: string[];
  in_core: boolean;
  degree: number;
}

export interface CoreNode {
  id: string;
  type: "disease" | "gene";
  label: string;
  in_core: boolean;
  cluster_id?: number;
  n_genes: number;
  n_phenotypes: number;
}

export interface Core {
  nodes: CoreNode[];
  edges: (Edge & { mechanism_differs?: boolean | null })[];
}

export interface PhenotypeRef {
  id: string;
  label: string;
  ic: number;
}

export interface Neighbour {
  id: string;
  label: string;
  edge: Edge;
  shared_phenotypes: PhenotypeRef[];
  shared_genes: (Ref | string)[];
  mechanism_differs: boolean | null;
  mechanism_note?: string | null;
}

export interface EnrichmentItem {
  node: { id: string; label: string; [key: string]: unknown };
  edge: Edge;
}

export interface Coverage {
  source: string;
  query?: string;
  hits?: number;
  hits_raw?: number;
  fetched_at?: string;
  retrieved?: string;
  note?: string | null;
}

/** Flat literature record (pipeline: enrichment.papers_mentioning), no edge attached. */
export interface PaperRecord {
  id: string;
  title?: string;
  year?: number;
  journal?: string;
  db?: string;
  record?: string;
  url?: string;
  date?: string;
}

/** Flags come from the curated CSV: booleans or strings such as "yes" / "no". */
export type Flag = boolean | string | null | undefined;

export interface OrgCard {
  id: string;
  label: string;
  url?: string | null;
  country?: string | null;
  has_registry?: Flag;
  registry_url?: string | null;
  has_natural_history_study?: Flag;
  nhs_url?: string | null;
  has_biobank?: Flag;
  contact_url?: string | null;
  verified_date?: string | null;
  draft_input?: boolean;
}

export interface OrgFile {
  node: OrgCard & { disease_names?: string[]; orpha_ids?: string[]; input_file?: string; notes?: string | null };
  diseases: { id: string; label: string; in_core?: boolean; edge: Edge }[];
}

export interface GapCommunity {
  id: string;
  label: string;
  relation: string;
  tier?: number;
  simgic?: number;
  shared_genes?: string[];
  shared_pathways?: { id: string; label: string }[];
  mechanism_differs?: boolean | null;
  orgs?: { id: string; label: string; url?: string | null; edge_id?: string }[];
}

export interface GapSearched {
  source: string;
  retrieved?: string | null;
  hits_raw?: number | null;
  hits_kept?: number | null;
  n_orgs?: number;
  verified?: string | null;
  draft?: boolean;
  note?: string | null;
}

/** Pipeline honest-gap block for a disease without a patient organisation. */
export interface Gap {
  orgs: string;
  nearest_communities: GapCommunity[];
  searched: GapSearched[];
  closing_the_gap: string | string[];
}

export interface DiseaseFile {
  node: {
    id: string;
    label: string;
    definition?: string | null;
    synonyms: string[];
    xrefs: string[];
    parents: (Ref | string)[];
    children: (Ref | string)[];
    parents_labels?: Record<string, string>;
    children_labels?: Record<string, string>;
    in_core: boolean;
    is_group?: boolean;
    cluster_id?: number;
    mechanism_classes?: { key: string; label: string; via?: string; via_label?: string }[];
  };
  genes: Edge[];
  phenotypes: { edge: Edge; phenotype: PhenotypeRef }[];
  neighbours: Neighbour[];
  enrichment?: {
    trials?: EnrichmentItem[];
    grants?: EnrichmentItem[];
    papers?: EnrichmentItem[];
    targets?: EnrichmentItem[];
    papers_mentioning?: PaperRecord[];
    totals?: Record<string, number>;
  };
  coverage?: Coverage[];
  orgs?: { org: OrgCard; edge: Edge }[];
  gap?: Gap;
  /** AI-extracted literature edges of other types (associated_with, biomarker_of, …) */
  text_mined?: Edge[];
}

export interface GeneFile {
  node: { id: string; label: string; full_name?: string | null; [key: string]: unknown };
  diseases: Edge[];
  /** {id, label, edge} in the fixture, {node: {id, label}, edge} from the pipeline */
  pathways?: { id?: string; label?: string; node?: { id: string; label: string }; edge: Edge }[];
  /** generic pathways (pipeline), shown collapsed */
  pathways_more?: { id?: string; label?: string; node?: { id: string; label: string }; edge: Edge }[];
  pathways_note?: string;
  text_mined?: Edge[];
}

export interface PhenotypeFile {
  node: { id: string; label: string; ic?: number };
  /** fixture: plain edges; pipeline: {id, label, edge, confidence} */
  diseases: (Edge | { id: string; label: string; edge: Edge; confidence?: number })[];
  diseases_total?: number;
}

/** trial/<NCT>.json (pipeline step 08): where an open study runs and whom it takes. No personal contact data. */
export interface TrialDetail {
  id: string;
  status: string | null;
  last_update?: string | null;
  retrieved: string;
  url: string;
  /** the study's official contact section on ClinicalTrials.gov */
  contact_url: string;
  source: { db: string; record: string; url: string };
  eligibility: { min_age?: string | null; max_age?: string | null; sex?: string | null; std_ages?: string[]; healthy_volunteers?: boolean | null };
  countries: { country: string; sites: number; open_sites: number }[];
  sites: { facility?: string | null; city?: string | null; country: string; status?: string | null }[];
  sites_total: number;
  officials?: { affiliation?: string | null; role?: string | null }[];
}
