export type LiquiditySource = "createtoken" | "pumplive";

import { RIODEX_LIQUIDITY_ROUTE } from "@/lib/riodex/routes";

export type BuildLiquidityHrefInput = {
  pairAddress: string;
  source: LiquiditySource;
  mode?: "add" | "manage" | "remove";
  tokenAddress?: string | null;
  txHash?: string | null;
  graduated?: boolean;
};

export function buildLiquidityHref(input: BuildLiquidityHrefInput) {
  const qs = new URLSearchParams();

  qs.set("pool", input.pairAddress);
  qs.set("source", input.source);

  if (input.mode) qs.set("mode", input.mode);
  if (input.tokenAddress) qs.set("token", input.tokenAddress);
  if (input.txHash) qs.set("tx", input.txHash);
  if (input.graduated) qs.set("graduated", "1");

  return `${RIODEX_LIQUIDITY_ROUTE}?${qs.toString()}`;
}

export function buildCreateTokenLiquidityHref(args: {
  pairAddress: string;
  tokenAddress?: string | null;
  txHash?: string | null;
}) {
  return buildLiquidityHref({
    pairAddress: args.pairAddress,
    source: "createtoken",
    mode: "add",
    tokenAddress: args.tokenAddress ?? null,
    txHash: args.txHash ?? null,
  });
}

export function buildPumpLiveLiquidityHref(args: {
  pairAddress: string;
  tokenAddress?: string | null;
  txHash?: string | null;
}) {
  return buildLiquidityHref({
    pairAddress: args.pairAddress,
    source: "pumplive",
    mode: "manage",
    tokenAddress: args.tokenAddress ?? null,
    txHash: args.txHash ?? null,
    graduated: true,
  });
}
