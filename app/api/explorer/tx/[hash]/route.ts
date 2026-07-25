import { proxyRioExplorerTx } from "@/lib/rioexplorer/tx-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  context: { params: Promise<{ hash: string }> }
) {
  const { hash } = await context.params;
  return proxyRioExplorerTx(hash);
}
