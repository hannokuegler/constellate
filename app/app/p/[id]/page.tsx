import PhenotypeView from "@/components/PhenotypeView";
import { toNodeId } from "@/lib/ids";

export default async function PhenotypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PhenotypeView id={toNodeId(id)} />;
}
