// Shared wallet monetary boundary. Canonical quote/currency conversion authority
// is not configured. Asset/network discovery must not manufacture price or age.
export function getRioWalletMarketState() {
  return {
    price: { rusd: null, usd: null, usdt: null, btc: null },
    priceSource: "unavailable",
    priceAvailable: false,
    authoritativeMarketData: false,
    priceUnavailableReason: "CANONICAL_WALLET_PRICE_AUTHORITY_UNCONFIGURED",
    updatedAt: null,
  };
}
