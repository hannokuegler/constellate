// Route params use "_" instead of ":" (MONDO_0009499); files are named the same way.

export function toFileKey(id: string): string {
  return decodeURIComponent(id).replace(":", "_");
}

export function toNodeId(param: string): string {
  const decoded = decodeURIComponent(param);
  if (decoded.includes(":")) return decoded;
  const match = decoded.match(/^([A-Za-z]+)_(.+)$/);
  return match ? `${match[1]}:${match[2]}` : decoded;
}

export function diseaseHref(id: string): string {
  return `/d/${toFileKey(id)}`;
}

export function geneHref(symbol: string): string {
  return `/g/${encodeURIComponent(symbol)}`;
}

export function phenotypeHref(id: string): string {
  return `/p/${toFileKey(id)}`;
}

export function hrefFor(type: string, id: string): string {
  if (type === "gene") return geneHref(id);
  if (type === "phenotype") return phenotypeHref(id);
  return diseaseHref(id);
}

export function refOf(value: { id: string; label: string } | string, labels?: Record<string, string>) {
  return typeof value === "string" ? { id: value, label: labels?.[value] ?? value } : value;
}

/** External link for a cross-reference like OMIM:245200 or ORPHA:487. */
export function xrefUrl(xref: string): string | null {
  const [prefix, local] = xref.split(":");
  if (!local) return null;
  switch (prefix.toUpperCase()) {
    case "OMIM":
      return `https://omim.org/entry/${local}`;
    case "ORPHA":
    case "ORPHANET":
      return `https://www.orpha.net/en/disease/detail/${local}`;
    case "MONDO":
      return `https://monarchinitiative.org/MONDO:${local}`;
    case "GARD":
      return `https://rarediseases.info.nih.gov/diseases/${parseInt(local, 10)}/index`;
    case "HP":
      return `https://hpo.jax.org/browse/term/HP:${local}`;
    default:
      return null;
  }
}
