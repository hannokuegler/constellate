import OrgView from "@/components/OrgView";

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <OrgView slug={decodeURIComponent(slug)} />;
}
