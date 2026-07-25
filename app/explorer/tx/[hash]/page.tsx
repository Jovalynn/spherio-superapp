import RioExplorerTxDetail from "@/components/rioexplorer/RioExplorerTxDetail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExplorerTxPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  return <RioExplorerTxDetail txHash={hash} />;
}
