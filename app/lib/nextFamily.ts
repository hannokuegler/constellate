/** Family key of a disease label (same rule as the disease graph): "X, juvenile form", "X due to Y deficiency" and "X 2A" belong to X. */
export function familyKey(label: string): string {
  return label
    .toLowerCase()
    .split(/ due to |, | type /)[0]
    .replace(/\s+\d+[a-z]?$/, "")
    .trim();
}
