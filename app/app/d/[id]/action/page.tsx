import ActionCardPage from "@/components/ActionCardPage";
import { toNodeId } from "@/lib/ids";

export default async function ActionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ via?: string }> }) {
  const [{ id }, { via }] = await Promise.all([params, searchParams]);
  return <ActionCardPage id={toNodeId(id)} via={via ? toNodeId(via) : null} />;
}
