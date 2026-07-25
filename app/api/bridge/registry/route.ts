import { NextResponse } from "next/server";
import { getSpherioIbcRegistry } from "@/lib/ibc/registry";
import { getSpherioAxelarRegistry } from "@/lib/bridge/axelar";
import { getSpherioHyperlaneRegistry } from "@/lib/bridge/hyperlane";
import { getSpherioEvmRepresentationRegistry } from "@/lib/bridge/evm-representation";

export const dynamic = "force-dynamic";

export async function GET() {
  const ibc = getSpherioIbcRegistry();
  const axelar = getSpherioAxelarRegistry();
  const hyperlane = getSpherioHyperlaneRegistry();
  const evmRepresentation = getSpherioEvmRepresentationRegistry();

  const executionEnabled =
    ibc.executionEnabled ||
    axelar.executionEnabled ||
    hyperlane.executionEnabled ||
    evmRepresentation.executionEnabled;

  return NextResponse.json({
    ok: true,
    status: "foundation_ready",
    executionEnabled,
    canonicalModel: {
      canonicalStandard: "SPO-20",
      representedStandard: "ERC-20",
      canonicalChainId: evmRepresentation.canonicalChainId,
      rule:
        "SPO-20 on SpherioChain is canonical. ERC-20 assets on EVM chains are represented assets controlled by bridge/representation proof rules.",
    },
    registries: {
      ibc,
      axelar,
      hyperlane,
      evmRepresentation,
    },
    readiness: {
      ibc: {
        status: ibc.status,
        executionEnabled: ibc.executionEnabled,
        liveRoutes: ibc.routes.filter((route) => route.status === "live").length,
        plannedRoutes: ibc.routes.filter((route) => route.status === "planned").length,
      },
      axelar: {
        status: axelar.status,
        executionEnabled: axelar.executionEnabled,
        liveRoutes: axelar.routes.filter((route) => route.status === "live").length,
        plannedRoutes: axelar.routes.filter((route) => route.status === "planned").length,
      },
      hyperlane: {
        status: hyperlane.status,
        executionEnabled: hyperlane.executionEnabled,
        liveRoutes: hyperlane.routes.filter((route) => route.status === "live").length,
        plannedRoutes: hyperlane.routes.filter((route) => route.status === "planned").length,
      },
      evmRepresentation: {
        status: evmRepresentation.status,
        executionEnabled: evmRepresentation.executionEnabled,
        liveRoutes: evmRepresentation.routes.filter((route) => route.status === "live").length,
        plannedRoutes: evmRepresentation.routes.filter((route) => route.status === "planned").length,
      },
    },
    notes: [
      "Unified bridge registry is informational until route-specific execution is enabled.",
      "RioLight must not broadcast bridge transactions while executionEnabled is false.",
      "RioEx Bridge can use this endpoint to display planned routes, future liquidity paths, and canonical SPO-20/EVM representation rules.",
      "Routes should only become live after channel/contract/relayer/proof verification.",
    ],
  });
}
