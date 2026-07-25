"use client";

import { getRioLightAddress } from "./client";

export async function getRioLightPortfolioAddress() {
  return getRioLightAddress();
}

// Placeholder for Phase A portfolio wiring.
// Next steps:
// - native RIO balance
// - SPO-20 balances
// - Pump positions from pump_live_trades.trader_address
// - Prime positions
// - IBC / bridged assets
export async function getRioLightPortfolioBalances() {
  const address = await getRioLightAddress();

  return {
    address,
    balances: [],
  };
}
