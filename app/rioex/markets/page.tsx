import { getRioExMarkets } from "@/lib/riodex";

export default async function RioExMarketsPage() {
  const data = await getRioExMarkets();
  const markets = data?.markets ?? [];

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-zinc-400">
            RioEx
          </div>
          <h1 className="text-4xl font-semibold mt-2">Market Intelligence</h1>
          <p className="text-zinc-400 mt-2">
            Canonical discovery and intelligence across Spherio markets.
          </p>
        </div>

        <div className="grid gap-4">
          {markets.map((market: any) => (
            <div
              key={market.market_id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold">{market.display_symbol}</div>
                  <div className="text-zinc-500 text-sm mt-1 font-mono">
                    {market.pool_address}
                  </div>
                </div>
                <div className="text-sm text-zinc-400">
                  {market.canonical ? "Canonical" : "Secondary"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
