import type { Metadata } from "next";
import TenXView from "@/components/TenXView";
import { toNodeId } from "@/lib/ids";

export const metadata: Metadata = {
  title: "The 10× case · Constellate",
  description: "How much sooner a patient group gets its first family into natural-history data when it joins or extends a study that exists, with every week labelled and adjustable.",
};

export default async function ImpactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const raw = Array.isArray(params.d) ? params.d[0] : params.d;
  return <TenXView initial={raw ? toNodeId(raw) : null} />;
}
