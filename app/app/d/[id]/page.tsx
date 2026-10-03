import DiseaseView from "@/components/DiseaseView";
import { toNodeId } from "@/lib/ids";

export default async function DiseasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DiseaseView id={toNodeId(id)} />;
}
