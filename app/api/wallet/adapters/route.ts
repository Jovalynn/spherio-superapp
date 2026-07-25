import { NextResponse } from "next/server";
import { SPHERIO } from "@/lib/spherioConfig";
import { getSpherioIbcRegistry } from "@/lib/ibc/registry";
import { getSpherioAxelarRegistry } from "@/lib/bridge/axelar";
import { getSpherioHyperlaneRegistry } from "@/lib/bridge/hyperlane";
import { getSpherioEvmRepresentationRegistry } from "@/lib/bridge/evm-representation";
import {
  spherioCosmosKitChainRecord,
  spherioCosmosKitAssetRecord,
  spherioCosmosKitWallets,
} from "@/lib/wallet-adapters/cosmoskit";

export const dynamic = "force-dynamic";

const RIO_LOGO_URI =
  process.env.NEXT_PUBLIC_RIO_LOGO_URI ||
  process.env.NEXT_PUBLIC_RIO_LOGO_URL ||
  "https://raw.githubusercontent.com/Lerivee/RUSD/refs/heads/main/Untitled%20design.png";

function getRioWalletAsset() {
  const now = new Date().toISOString();

  return {
    denom: "urio",
    symbol: "RIO",
    decimals: 6,
    logoURI: RIO_LOGO_URI,
    price: {
      rusd: 0.1,
      usd: 0.1,
      usdt: 0.1,
      btc: null,
    },
    priceSource: "rioex_valuation_rio",
    updatedAt: now,
  };
}

export async function GET() {
  const rioAsset = getRioWalletAsset();

  return NextResponse.json({
    ok: true,
    chain: {
      chainId: SPHERIO.chainId,
      chainName: SPHERIO.chainName,
      rpc: SPHERIO.rpc,
      rest: SPHERIO.rest,
      bech32Prefix: "rio",
      coinType: SPHERIO.coinType,
    },
    nativeAsset: rioAsset,
    cosmosKit: {
      status: "runtime_shell_wired",
      note:
        "CosmosKit runtime shell is mounted in app providers. Direct Keplr, Leap, and Cosmostation adapters remain active until full CosmosKit provider configuration is tested.",
      wallets: spherioCosmosKitWallets(),
      chainRecord: spherioCosmosKitChainRecord(),
      assetRecord: spherioCosmosKitAssetRecord(),
    },
    ibcRegistry: getSpherioIbcRegistry(),
    axelarRegistry: getSpherioAxelarRegistry(),
    hyperlaneRegistry: getSpherioHyperlaneRegistry(),
    evmRepresentationRegistry: getSpherioEvmRepresentationRegistry(),
    adapters: [
      {
        id: "riolight-native",
        label: "RioLight",
        priority: 1,
        role: "native_execution_identity",
        status: "supported",
        connectionMode: "preferred",
        signingMode: "riolight_review_approval_broadcast",
        notes:
          "RioLight is the preferred Spherio execution identity and approval rail.",
      },
      {
        id: "keplr",
        label: "Keplr",
        priority: 2,
        role: "cosmos_wallet_adapter",
        status: "supported",
        connectionMode: "fallback",
        signingMode: "connection_ready_broadcast_gated",
        notes:
          "Keplr can connect to SpherioChain through suggestChain. Broadcast remains gated by the RioLight execution security pass.",
      },
      {
        id: "leap",
        label: "Leap",
        priority: 3,
        role: "cosmos_wallet_adapter",
        status: "supported",
        connectionMode: "fallback",
        signingMode: "connection_ready_broadcast_gated",
        notes:
          "Leap can connect to SpherioChain using the shared Spherio chain metadata.",
      },
      {
        id: "cosmostation",
        label: "Cosmostation",
        priority: 4,
        role: "cosmos_wallet_adapter",
        status: "supported",
        connectionMode: "fallback",
        signingMode: "connection_ready_broadcast_gated",
        notes:
          "Cosmostation can connect through a Keplr-compatible provider when available.",
      },
      {
        id: "walletconnect",
        label: "WalletConnect",
        priority: 5,
        role: "mobile_session_adapter",
        status: "planned",
        connectionMode: "future",
        signingMode: "planned",
        notes:
          "WalletConnect will support mobile wallet session continuity after native Cosmos adapters stabilize.",
      },
      {
        id: "ibc",
        label: "IBC",
        priority: 6,
        role: "cross_chain_transfer_route",
        status: "planned",
        connectionMode: "future",
        signingMode: "planned",
        notes:
          "IBC route awareness will be added after wallet adapter and asset metadata standards are stable.",
      },
      {
        id: "axelar",
        label: "Axelar",
        priority: 7,
        role: "cross_chain_bridge_route",
        status: "planned",
        connectionMode: "future",
        signingMode: "planned",
        notes:
          "Axelar bridge awareness will inherit the same RIO asset and valuation metadata model.",
      },
      {
        id: "hyperlane",
        label: "Hyperlane",
        priority: 8,
        role: "cross_chain_bridge_route",
        status: "planned",
        connectionMode: "future",
        signingMode: "planned",
        notes:
          "Hyperlane bridge awareness will be added after IBC and bridge route contracts are defined.",
      },
      {
        id: "evm",
        label: "EVM",
        priority: 9,
        role: "evm_representation_layer",
        status: "planned",
        connectionMode: "future",
        signingMode: "planned",
        notes:
          "EVM representation will come after canonical SPO-20/EVM representation rules are finalized.",
      },
    ],
  });
}
