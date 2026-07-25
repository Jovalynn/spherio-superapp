#!/usr/bin/env python3
from pathlib import Path
import sys

SWAP = Path("app/riodex/swap/page.tsx")
SIM = Path("app/api/riodex/simulate/route.ts")

if not SWAP.exists() or not SIM.exists():
    print("ERROR: run this from ~/spherio-infra/spherio-superapp")
    sys.exit(1)

text = SWAP.read_text()
sim_text = SIM.read_text()

backup_swap = Path("app/riodex/swap/page.tsx.bak-before-token-dropdown-selected-pair-final")
backup_sim = Path("app/api/riodex/simulate/route.ts.bak-before-selected-pair-final")

if not backup_swap.exists():
    backup_swap.write_text(text)
    print(f"Backup created: {backup_swap}")
else:
    print(f"Backup already exists: {backup_swap}")

if not backup_sim.exists():
    backup_sim.write_text(sim_text)
    print(f"Backup created: {backup_sim}")
else:
    print(f"Backup already exists: {backup_sim}")

def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count == 0:
        print(f"WARN: {label} not found; skipping.")
        return source
    if count > 1:
        print(f"WARN: {label} found {count} times; replacing first only.")
    return source.replace(old, new, 1)

# token dropdown state
if "const [tokenMenuOpen, setTokenMenuOpen]" not in text:
    text = replace_once(
        text,
'''  const [registryTruthLoading, setRegistryTruthLoading] = useState(false);
  const [registryTruthError, setRegistryTruthError] = useState<string | null>(null);
  const [marketSearch, setMarketSearch] = useState("");
''',
'''  const [registryTruthLoading, setRegistryTruthLoading] = useState(false);
  const [registryTruthError, setRegistryTruthError] = useState<string | null>(null);
  const [marketSearch, setMarketSearch] = useState("");
  const [tokenMenuOpen, setTokenMenuOpen] = useState<"from" | "to" | null>(null);
''',
        "token menu state",
    )

# layout
text = text.replace(
    "xl:grid-cols-[minmax(0,1.42fr)_380px] 2xl:grid-cols-[minmax(0,1.48fr)_410px]",
    "xl:grid-cols-[minmax(0,1fr)_450px] 2xl:grid-cols-[minmax(0,1fr)_470px]",
)

# labels
old_labels = '''  const registryPairLabel =
    registryMap.has(String(asset0Id)) && registryMap.has(String(asset1Id))
      ? getRegistryPairLabel(registryMap, asset0Id, asset1Id)
      : buildTruthPairLabel(asset0Id, asset1Id);

  const [asset0Label, asset1Label] = registryPairLabel.includes("/")
    ? (registryPairLabel.split("/").map((value) => value.trim()) as [string, string])
    : [getAssetSymbol(asset0Id), getAssetSymbol(asset1Id)];

  const fromAssetId = fromToken === asset0Label ? asset0Id : asset1Id;
  const toAssetId = toToken === asset0Label ? asset0Id : asset1Id;
'''
new_labels = '''  const registryPairLabel =
    registryMap.has(String(asset0Id)) && registryMap.has(String(asset1Id))
      ? getRegistryPairLabel(registryMap, asset0Id, asset1Id)
      : buildTruthPairLabel(asset0Id, asset1Id);

  const [rawAsset0Label, rawAsset1Label] = registryPairLabel.includes("/")
    ? (registryPairLabel.split("/").map((value) => value.trim()) as [string, string])
    : [getAssetSymbol(asset0Id), getAssetSymbol(asset1Id)];

  const asset0Label =
    registryPair?.baseAssetId === asset0Id && registryPair?.baseSymbol
      ? registryPair.baseSymbol
      : registryPair?.quoteAssetId === asset0Id && registryPair?.quoteSymbol
        ? registryPair.quoteSymbol
        : rawAsset0Label;

  const asset1Label =
    registryPair?.baseAssetId === asset1Id && registryPair?.baseSymbol
      ? registryPair.baseSymbol
      : registryPair?.quoteAssetId === asset1Id && registryPair?.quoteSymbol
        ? registryPair.quoteSymbol
        : rawAsset1Label;

  const pairAssetOptions = [
    {
      label: asset0Label,
      assetId: asset0Id,
      assetType: pair?.asset_0_type || registryPair?.baseAssetType || null,
    },
    {
      label: asset1Label,
      assetId: asset1Id,
      assetType: pair?.asset_1_type || registryPair?.quoteAssetType || null,
    },
  ];

  const fromAssetId = fromToken === asset0Label ? asset0Id : asset1Id;
  const toAssetId = toToken === asset0Label ? asset0Id : asset1Id;
  const fromAssetType = fromAssetId === asset0Id ? pair?.asset_0_type : pair?.asset_1_type;
  const toAssetType = toAssetId === asset0Id ? pair?.asset_0_type : pair?.asset_1_type;
'''
if "const pairAssetOptions = [" not in text:
    text = replace_once(text, old_labels, new_labels, "asset label resolver")

text = text.replace('label="Reserve Price"', 'label="Pool Ratio"')
text = text.replace(">Reserve Price<", ">Pool Ratio<")

# quote body
old_quote_gate = '''      const executionSupported =
        [pair?.asset_0_id ?? RIO_DENOM, pair?.asset_1_id ?? RUSD_CONTRACT]
          .sort()
          .join("|") === [RIO_DENOM, RUSD_CONTRACT].sort().join("|");

      try {
        if (!executionSupported) {
          if (active) {
            setQuoteLoading(false);
            setQuoteOut("0");
            setQuoteFee("0");
            setQuoteError(null);
          }
          return;
        }

        if (active) {
'''
new_quote_gate = '''      try {
        if (!pairAddress || !pair || !latestLiquidity) {
          if (active) {
            setQuoteLoading(false);
            setQuoteOut("0");
            setQuoteFee("0");
            setQuoteError("Selected market liquidity is not available yet.");
          }
          return;
        }

        if (active) {
'''
text = text.replace(old_quote_gate, new_quote_gate)

text = text.replace(
'''          body: JSON.stringify({
            fromToken,
            amount,
          }),''',
'''          body: JSON.stringify({
            pairAddress,
            fromToken,
            toToken,
            fromAssetId,
            toAssetId,
            fromAssetType,
            toAssetType,
            asset0Id,
            asset1Id,
            asset0Type: pair?.asset_0_type || null,
            asset1Type: pair?.asset_1_type || null,
            amount,
          }),'''
)

text = text.replace(
'''  }, [fromToken, toToken, amount, pair?.asset_0_id, pair?.asset_1_id]);''',
'''  }, [fromToken, toToken, amount, pairAddress, pair, latestLiquidity, fromAssetId, toAssetId, fromAssetType, toAssetType, asset0Id, asset1Id]);'''
)

# execution supported
text = text.replace(
'''  const pairExecutionSupported = useMemo(() => {
    const combo = [asset0Id, asset1Id].sort().join("|");
    return combo === [RIO_DENOM, RUSD_CONTRACT].sort().join("|");
  }, [asset0Id, asset1Id]);''',
'''  const pairExecutionSupported = useMemo(() => {
    return Boolean(pairAddress && pair?.is_live !== false && latestLiquidity);
  }, [pairAddress, pair?.is_live, latestLiquidity]);'''
)
text = text.replace('"Execution is currently wired for RIO/RUSD only."', '"Selected market is not route-ready yet."')

# execution helpers
if "function makeAssetInfo(assetId" not in text:
    text = replace_once(
        text,
        "  async function handleExecuteSwap() {",
'''  function isNativeExecutionAsset(assetId: string, assetType?: string | null) {
    return assetType === "native" || assetId === RIO_DENOM || assetId === "urio";
  }

  function makeAssetInfo(assetId: string, assetType?: string | null) {
    if (isNativeExecutionAsset(assetId, assetType)) {
      return { native_token: { denom: assetId } };
    }

    return { token: { contract_addr: assetId } };
  }

  async function handleExecuteSwap() {''',
        "execution helpers",
    )

# generic execution
old_exec = '''      if (fromAssetId === RIO_DENOM && toAssetId === RUSD_CONTRACT) {
        const msg = {
          swap: {
            offer_asset: {
              info: { native_token: { denom: RIO_DENOM } },
              amount: amountBase,
            },
            ask_asset_info: {
              token: { contract_addr: RUSD_CONTRACT },
            },
            max_spread: maxSpread,
          },
        };

        setExecutionStage("Broadcasting");

        res = await client.execute(
          sender,
          pairAddress,
          msg,
          "auto",
          "RioDex Swap RIO→RUSD",
          [{ denom: RIO_DENOM, amount: amountBase }]
        );
      } else if (fromAssetId === RUSD_CONTRACT && toAssetId === RIO_DENOM) {
        const hookMsg = encodeHookMsg({
          swap: {
            ask_asset_info: {
              native_token: { denom: RIO_DENOM },
            },
            max_spread: maxSpread,
          },
        });

        const msg = {
          send: {
            contract: pairAddress,
            amount: amountBase,
            msg: hookMsg,
          },
        };

        setExecutionStage("Broadcasting");

        res = await client.execute(
          sender,
          RUSD_CONTRACT,
          msg,
          "auto",
          "RioDex Swap RUSD→RIO"
        );
      } else {
        throw new Error("Execution is currently enabled for canonical RIO/RUSD routing only.");
      }'''
new_exec = '''      if (isNativeExecutionAsset(fromAssetId, fromAssetType)) {
        const msg = {
          swap: {
            offer_asset: {
              info: makeAssetInfo(fromAssetId, fromAssetType),
              amount: amountBase,
            },
            ask_asset_info: makeAssetInfo(toAssetId, toAssetType),
            max_spread: maxSpread,
          },
        };

        setExecutionStage("Broadcasting");

        res = await client.execute(
          sender,
          pairAddress,
          msg,
          "auto",
          `RioDex Swap ${fromToken}→${toToken}`,
          [{ denom: fromAssetId, amount: amountBase }]
        );
      } else {
        const hookMsg = encodeHookMsg({
          swap: {
            ask_asset_info: makeAssetInfo(toAssetId, toAssetType),
            max_spread: maxSpread,
          },
        });

        const msg = {
          send: {
            contract: pairAddress,
            amount: amountBase,
            msg: hookMsg,
          },
        };

        setExecutionStage("Broadcasting");

        res = await client.execute(
          sender,
          fromAssetId,
          msg,
          "auto",
          `RioDex Swap ${fromToken}→${toToken}`
        );
      }'''
text = text.replace(old_exec, new_exec)

# dropdown blocks
old_from = '''                  <div className={`${shell("token")} flex min-w-0 items-center gap-3 px-4 py-3`}>
                    <TokenAvatar registryMap={registryMap} assetId={fromAssetId} label={fromToken} size={34} />
                    <div className="min-w-0 truncate text-2xl font-semibold text-white">
                      {fromToken}
                    </div>
                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-300" />
                  </div>'''
new_from = '''                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTokenMenuOpen(tokenMenuOpen === "from" ? null : "from")}
                      className={`${shell("token")} flex min-w-0 items-center gap-3 px-4 py-3`}
                    >
                      <TokenAvatar registryMap={registryMap} assetId={fromAssetId} label={fromToken} size={34} />
                      <div className="min-w-0 truncate text-2xl font-semibold text-white">
                        {fromToken}
                      </div>
                      <ChevronDown className="h-5 w-5 shrink-0 text-slate-300" />
                    </button>

                    {tokenMenuOpen === "from" ? (
                      <div className="absolute left-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#101a3d] shadow-2xl">
                        {pairAssetOptions.map((option) => (
                          <button
                            key={`from-${option.assetId}`}
                            type="button"
                            onClick={() => {
                              setFromToken(option.label);
                              if (option.label === toToken) {
                                setToToken(option.label === asset0Label ? asset1Label : asset0Label);
                              }
                              setTokenMenuOpen(null);
                              setQuoteError(null);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.06]"
                          >
                            <TokenAvatar registryMap={registryMap} assetId={option.assetId} label={option.label} size={28} />
                            <div>
                              <div className="text-sm font-semibold text-white">{option.label}</div>
                              <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                                {option.assetType || "asset"}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>'''

old_to = old_from.replace("fromAssetId", "toAssetId").replace("fromToken", "toToken")
new_to = new_from.replace('"from"', '"to"').replace("fromAssetId", "toAssetId").replace("fromToken", "toToken").replace("setFromToken", "setToToken").replace("setToToken", "setFromToken_TEMP").replace("setFromToken_TEMP", "setFromToken").replace("`from-${option.assetId}`", "`to-${option.assetId}`")

text = text.replace(old_from, new_from, 1)
text = text.replace(old_to, new_to, 1)

SWAP.write_text(text)
print("OK: patched swap page")

sim = '''import { NextRequest, NextResponse } from "next/server";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SPHERIO_CHAIN } from "@/lib/spherioChain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_PAIR_ADDR =
  "rio1vh2p4x96m0qcvhzh3g86dxg9zu8pzwj4xuuwyf2z8dpmshcf0qmsgf7tp6";
const RIO_DENOM = "urio";

const INDEXER_BASE =
  process.env.INDEXER_BASE_URL ||
  process.env.NEXT_PUBLIC_INDEXER_BASE_URL ||
  "http://indexer:4000";

function rpcEndpoint() {
  return (
    process.env.SPHERIO_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
    (SPHERIO_CHAIN as any)?.apis?.rpc?.[0]?.address ||
    (SPHERIO_CHAIN as any)?.rpc ||
    "http://127.0.0.1:26657"
  );
}

function toBaseUnits(displayAmount: string, decimals = 6) {
  const n = Number(displayAmount || "0");
  if (!Number.isFinite(n) || n <= 0) return "0";
  return String(Math.floor(n * 10 ** decimals));
}

function fromBaseUnits(amount: string | number, decimals = 6) {
  return Number(amount || 0) / 10 ** decimals;
}

function isNativeAsset(assetId: string, assetType?: string | null) {
  return assetType === "native" || assetId === RIO_DENOM || assetId === "urio";
}

function makeAssetInfo(assetId: string, assetType?: string | null) {
  if (isNativeAsset(assetId, assetType)) return { native_token: { denom: assetId } };
  return { token: { contract_addr: assetId } };
}

async function fetchLatestLiquidity(pairAddress: string) {
  const res = await fetch(
    `${INDEXER_BASE}/api/riodex/pairs/${encodeURIComponent(pairAddress)}/liquidity?limit=1`,
    { cache: "no-store", headers: { accept: "application/json" } }
  );

  const raw = await res.text();
  let json: any = null;
  try { json = raw ? JSON.parse(raw) : null; }
  catch { throw new Error(`Liquidity truth route returned non-JSON (${res.status})`); }

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `Liquidity truth request failed: ${res.status}`);
  }

  return json?.liquidity?.[0] || null;
}

function reserveQuote(input: {
  amount: string;
  latestLiquidity: any;
  fromAssetId: string;
  toAssetId: string;
  asset0Id: string;
  asset1Id: string;
}) {
  const { amount, latestLiquidity, fromAssetId, toAssetId, asset0Id, asset1Id } = input;

  if (!latestLiquidity) {
    return { amount_out: "0", commission: "0", spread: "0", reserve_price: null, fallback_reason: "liquidity_unavailable" };
  }

  const reserve0 = fromBaseUnits(latestLiquidity.reserve_0 || "0");
  const reserve1 = fromBaseUnits(latestLiquidity.reserve_1 || "0");

  if (!Number.isFinite(reserve0) || !Number.isFinite(reserve1) || reserve0 <= 0 || reserve1 <= 0) {
    return { amount_out: "0", commission: "0", spread: "0", reserve_price: null, fallback_reason: "invalid_reserves" };
  }

  const n = Number(amount || "0");
  let out = 0;
  let price: number | null = null;

  if (fromAssetId === asset0Id && toAssetId === asset1Id) {
    price = reserve1 / reserve0;
    out = n * price;
  } else if (fromAssetId === asset1Id && toAssetId === asset0Id) {
    price = reserve0 / reserve1;
    out = n * price;
  } else {
    return { amount_out: "0", commission: "0", spread: "0", reserve_price: null, fallback_reason: "asset_not_in_pair" };
  }

  return { amount_out: String(out), commission: "0", spread: "0", reserve_price: String(price), fallback_reason: "selected_pair_reserve_truth_quote" };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const pairAddress = String(body?.pairAddress || body?.pair || body?.pool || DEFAULT_PAIR_ADDR);
    const amount = String(body?.amount || "0");

    const asset0Id = String(body?.asset0Id || body?.asset_0_id || RIO_DENOM);
    const asset1Id = String(body?.asset1Id || body?.asset_1_id || "");
    const asset0Type = body?.asset0Type || body?.asset_0_type || null;
    const asset1Type = body?.asset1Type || body?.asset_1_type || null;

    const fromAssetId = String(body?.fromAssetId || asset0Id);
    const toAssetId = String(body?.toAssetId || (fromAssetId === asset0Id ? asset1Id : asset0Id));
    const fromAssetType = body?.fromAssetType || (fromAssetId === asset0Id ? asset0Type : asset1Type);
    const toAssetType = body?.toAssetType || (toAssetId === asset0Id ? asset0Type : asset1Type);

    const fromToken = String(body?.fromToken || fromAssetId);
    const toToken = String(body?.toToken || toAssetId);

    if (!pairAddress || !asset0Id || !asset1Id) {
      return NextResponse.json({ ok: false, error: "Missing selected pair or pair assets.", rpc_endpoint: rpcEndpoint() }, { status: 400 });
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({
        ok: true,
        mode: "empty",
        pairAddress,
        fromToken,
        toToken,
        fromAssetId,
        toAssetId,
        amount_in: amount,
        amount_out: "0",
        commission: "0",
        spread: "0",
        rpc_endpoint: rpcEndpoint(),
      });
    }

    try {
      const client = await CosmWasmClient.connect(rpcEndpoint());
      const simulationMsg = {
        simulation: {
          offer_asset: {
            info: makeAssetInfo(fromAssetId, fromAssetType),
            amount: toBaseUnits(amount),
          },
          ask_asset_info: makeAssetInfo(toAssetId, toAssetType),
        },
      };

      const sim = await client.queryContractSmart(pairAddress, simulationMsg);

      return NextResponse.json({
        ok: true,
        mode: "selected_pair_onchain_simulation",
        pairAddress,
        fromToken,
        toToken,
        fromAssetId,
        toAssetId,
        amount_in: amount,
        amount_out: String(fromBaseUnits(sim?.return_amount || "0")),
        commission: String(fromBaseUnits(sim?.commission_amount || "0")),
        spread: String(fromBaseUnits(sim?.spread_amount || "0")),
        raw: sim,
        rpc_endpoint: rpcEndpoint(),
      });
    } catch (simulationError: any) {
      const latestLiquidity = await fetchLatestLiquidity(pairAddress);
      const fallback = reserveQuote({ amount, latestLiquidity, fromAssetId, toAssetId, asset0Id, asset1Id });

      return NextResponse.json({
        ok: true,
        mode: "selected_pair_reserve_fallback",
        pairAddress,
        fromToken,
        toToken,
        fromAssetId,
        toAssetId,
        amount_in: amount,
        amount_out: fallback.amount_out,
        commission: fallback.commission,
        spread: fallback.spread,
        reserve_price: fallback.reserve_price,
        fallback: true,
        warning: simulationError?.message || "On-chain simulation unavailable; selected pair reserve truth fallback used.",
        rpc_endpoint: rpcEndpoint(),
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to simulate swap", rpc_endpoint: rpcEndpoint() },
      { status: 500 }
    );
  }
}
'''
SIM.write_text(sim)
print("OK: patched simulate route")
print("Next: cd ~/spherio-infra && docker-compose up -d --build superapp")
