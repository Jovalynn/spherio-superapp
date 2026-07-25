import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { buildPumpGraduationState } from "@/lib/pump/graduation";
import { buildPumpProtectionState } from "@/lib/pump/protection";
import { getPumpEconomicsPolicy, getPumpFeePolicy } from "@/lib/pump/economics";

const PUMP_FINALIZER_ADDRESS =
  process.env.PUMP_FINALIZER_EXPECTED_ADDRESS ||
  "rio1e9hszjll3d4pkn74n2th47wwyyh228wn2vhmsf";


declare global {
  // eslint-disable-next-line no-var
  var __pumpCreatePgPool: any;
}

async function getPumpCreatePgPool() {
  if (!globalThis.__pumpCreatePgPool) {
    const { Pool } = await import("pg");
    globalThis.__pumpCreatePgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      max: 5,
    });
  }

  return globalThis.__pumpCreatePgPool;
}

function pumpToBaseUnits(value: string, decimals = 6): string {
  const raw = String(value || "").trim();
  if (!raw) return "0";

  const [wholePart, fracPart = ""] = raw.split(".");
  const whole = wholePart.replace(/[^\d]/g, "") || "0";
  const frac = fracPart.replace(/[^\d]/g, "").slice(0, decimals).padEnd(decimals, "0");

  return BigInt(`${whole}${frac}`).toString();
}

async function registerPumpLiveState(params: {
  tokenAddress: string;
  creatorAddress: string;
  tokenName: string;
  symbol: string;
  totalSupply: string;
  txHash: string;
  createdHeight: number;
  description?: string;
  logoUrl?: string;
  website?: string;
  xHandle?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  youtube?: string;
}) {
  const pool = await getPumpCreatePgPool();

  const maxSupplyBase = pumpToBaseUnits(params.totalSupply, 6);
  const createdHeight = Number.isFinite(params.createdHeight) && params.createdHeight > 0
    ? Math.trunc(params.createdHeight)
    : 0;

  const metadata = {
    family: "spo20",
    rail: "pump",
    source: "pump_create_api",
    description: params.description || null,
    logo_url: params.logoUrl || null,
    website: params.website || null,
    x_handle: params.xHandle || null,
    twitter: params.twitter || params.xHandle || null,
    telegram: params.telegram || null,
    discord: params.discord || null,
    youtube: params.youtube || null,
  };

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      INSERT INTO pump_live_tokens (
        token_address,
        creator_address,
        token_name,
        token_symbol,
        decimals,
        max_supply_base,
        status,
        settlement_denom,
        fee_denom,
        rusd_reference_asset,
        created_height,
        created_tx_hash,
        created_at,
        description,
        logo_url,
        metadata_json
      )
      VALUES ($1,$2,$3,$4,6,$5,'bonding','urio','urio','RUSD',$6,$7,now(),$8,$9,$10::jsonb)
      ON CONFLICT (token_address) DO UPDATE SET
        creator_address = EXCLUDED.creator_address,
        token_name = EXCLUDED.token_name,
        token_symbol = EXCLUDED.token_symbol,
        max_supply_base = EXCLUDED.max_supply_base,
        description = COALESCE(EXCLUDED.description, pump_live_tokens.description),
        logo_url = COALESCE(EXCLUDED.logo_url, pump_live_tokens.logo_url),
        metadata_json = COALESCE(pump_live_tokens.metadata_json, '{}'::jsonb) || COALESCE(EXCLUDED.metadata_json, '{}'::jsonb),
        status = CASE
          WHEN pump_live_tokens.status IN ('graduating','graduated') THEN pump_live_tokens.status
          ELSE 'bonding'
        END,
        created_tx_hash = EXCLUDED.created_tx_hash
      `,
      [
        params.tokenAddress,
        params.creatorAddress,
        params.tokenName,
        params.symbol,
        maxSupplyBase,
        createdHeight,
        params.txHash,
        params.description || null,
        params.logoUrl || null,
        JSON.stringify(metadata),
      ],
    );

    await client.query(
      `
      INSERT INTO spo20_tokens (
        contract_address,
        symbol,
        creator,
        height,
        name,
        tx_hash,
        decimals,
        total_supply,
        description,
        logo_url,
        metadata_json
      )
      VALUES ($1,$2,$3,$4,$5,$6,6,$7,$8,$9,$10::jsonb)
      ON CONFLICT (contract_address) DO UPDATE SET
        symbol = COALESCE(EXCLUDED.symbol, spo20_tokens.symbol),
        creator = COALESCE(EXCLUDED.creator, spo20_tokens.creator),
        height = LEAST(spo20_tokens.height, EXCLUDED.height),
        name = COALESCE(EXCLUDED.name, spo20_tokens.name),
        tx_hash = COALESCE(EXCLUDED.tx_hash, spo20_tokens.tx_hash),
        total_supply = COALESCE(NULLIF(EXCLUDED.total_supply, '0'), spo20_tokens.total_supply),
        description = COALESCE(EXCLUDED.description, spo20_tokens.description),
        logo_url = COALESCE(EXCLUDED.logo_url, spo20_tokens.logo_url),
        metadata_json = COALESCE(spo20_tokens.metadata_json, '{}'::jsonb) || COALESCE(EXCLUDED.metadata_json, '{}'::jsonb)
      `,
      [
        params.tokenAddress,
        params.symbol,
        params.creatorAddress,
        createdHeight,
        params.tokenName,
        params.txHash || null,
        maxSupplyBase,
        params.description || null,
        params.logoUrl || null,
        JSON.stringify(metadata),
      ],
    );

    await client.query(
      `
      INSERT INTO pump_live_curve_state (
        token_address,
        virtual_rio_reserve_urio,
        virtual_token_reserve_base,
        real_rio_reserve_urio,
        real_token_reserve_base,
        target_graduation_value_rusd,
        target_market_cap_rusd,
        updated_height,
        updated_at
      )
      VALUES ($1,$2,$3,0,$3,15000.000000,65000.000000,$4,now())
      ON CONFLICT (token_address) DO UPDATE SET
        virtual_rio_reserve_urio = EXCLUDED.virtual_rio_reserve_urio,
        virtual_token_reserve_base = EXCLUDED.virtual_token_reserve_base,
        real_token_reserve_base = EXCLUDED.real_token_reserve_base,
        target_graduation_value_rusd = EXCLUDED.target_graduation_value_rusd,
        target_market_cap_rusd = EXCLUDED.target_market_cap_rusd,
        updated_height = EXCLUDED.updated_height,
        updated_at = now()
      `,
      [
        params.tokenAddress,
        "100000000000",
        maxSupplyBase,
        createdHeight,
      ],
    );

    await client.query("COMMIT");

    return {
      registered: true,
      maxSupplyBase,
      createdHeight,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}


const PUMP_REQUIRED_SEED_VALUE_RUSD = 15_000;
const PUMP_REQUIRED_TOKEN_RESERVE_BASE = "200000000000000";

const RPC_URL =
  process.env.SPHERIO_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
  "http://host.docker.internal:26657";

let wasmClient: CosmWasmClient | null = null;

async function getWasmClient() {
  if (!wasmClient) {
    wasmClient = await CosmWasmClient.connect(RPC_URL);
  }

  return wasmClient;
}

async function queryTokenInfo(tokenAddress: string) {
  try {
    const client = await getWasmClient();
    return await client.queryContractSmart(tokenAddress, { token_info: {} });
  } catch {
    return null;
  }
}

async function queryTokenBalance(tokenAddress: string, address: string) {
  try {
    const client = await getWasmClient();
    const result = await client.queryContractSmart(tokenAddress, {
      balance: { address },
    });

    return String(result || "0");
  } catch {
    return "0";
  }
}

function baseAmountGte(value: string, required: string) {
  try {
    return BigInt(value || "0") >= BigInt(required || "0");
  } catch {
    return false;
  }
}

type PumpCreatePayload = {
  tokenName: string;
  symbol: string;
  totalSupply: string;
  description: string;
  website?: string;
  xHandle?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  youtube?: string;
  logoUrl?: string;
  tokenAddress?: string;
  txHash?: string;
  createdHeight?: string | number;
  creatorAddress?: string;
};

async function resolveCreatedHeightFromTx(txHash: string, providedHeight: number): Promise<number> {
  if (Number.isFinite(providedHeight) && providedHeight > 0) {
    return Math.trunc(providedHeight);
  }

  const hash = sanitize(txHash).toUpperCase();
  if (!hash) return 0;

  const rpcBase =
    process.env.SPHERIO_RPC_URL ||
    process.env.SPHERIO_RPC_HTTP ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    "http://host.docker.internal:26657";

  try {
    const url = `${rpcBase.replace(/\/$/, "")}/tx?hash=0x${encodeURIComponent(hash)}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) return 0;

    const data = await res.json();
    const height = Number(data?.result?.tx_result?.height || data?.result?.height || 0);

    return Number.isFinite(height) && height > 0 ? Math.trunc(height) : 0;
  } catch (error) {
    console.error("pump_create_height_resolution_failed", error);
    return 0;
  }
}

function sanitize(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeSymbol(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

function normalizeUrl(value: string) {
  const v = value.trim();
  if (!v) return "";
  return v;
}

async function saveUploadedPumpLogo(file: any): Promise<string> {
  if (!file || typeof file === "string") return "";

  const size = Number(file.size || 0);
  if (!size) return "";

  const type = String(file.type || "").toLowerCase();
  const allowed = new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ]);

  if (type && !allowed.has(type)) {
    throw new Error("Logo must be PNG, JPG, WEBP, GIF, or SVG.");
  }

  const originalName = String(file.name || "logo").toLowerCase();
  const ext =
    originalName.endsWith(".svg") ? "svg" :
    originalName.endsWith(".gif") ? "gif" :
    originalName.endsWith(".webp") ? "webp" :
    originalName.endsWith(".jpg") || originalName.endsWith(".jpeg") ? "jpg" :
    "png";

  const uploadDir = join(process.cwd(), "public", "uploads", "pump");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}-${randomUUID()}.${ext}`;
  const filepath = join(uploadDir, filename);

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, bytes);

  return `/uploads/pump/${filename}`;
}

function pseudoAddress(symbol: string) {
  const safe = symbol.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "pump";
  return `rio1pump${safe}launch000000000000`;
}

async function readPayload(request: NextRequest): Promise<PumpCreatePayload> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();

    const logo = form.get("logo");
    const uploadedLogoUrl = await saveUploadedPumpLogo(logo);
    const providedLogoUrl = normalizeUrl(sanitize(form.get("logoUrl") || form.get("logo_url") || form.get("imageUrl") || form.get("image_url")));
    const logoUrl = uploadedLogoUrl || providedLogoUrl;

    return {
      tokenName: sanitize(form.get("coinName") || form.get("tokenName")),
      symbol: sanitize(form.get("ticker") || form.get("symbol")),
      totalSupply: sanitize(form.get("totalSupply")) || "1000000000",
      description: sanitize(form.get("description")),
      website: normalizeUrl(sanitize(form.get("website"))),
      xHandle: sanitize(form.get("xHandle")),
      twitter: sanitize(form.get("twitter")),
      telegram: sanitize(form.get("telegram")),
      discord: sanitize(form.get("discord")),
      youtube: sanitize(form.get("youtube")),
      logoUrl,
      tokenAddress: sanitize(form.get("tokenAddress")),
      txHash: sanitize(form.get("txHash")),
      creatorAddress: sanitize(form.get("creatorAddress")),
    };
  }

  const body = (await request.json()) as Partial<PumpCreatePayload>;

  return {
    tokenName: sanitize(body.tokenName),
    symbol: sanitize(body.symbol),
    totalSupply: sanitize(body.totalSupply) || "1000000000",
    description: sanitize(body.description),
    website: normalizeUrl(sanitize(body.website)),
    xHandle: sanitize(body.xHandle),
    twitter: sanitize(body.twitter),
    telegram: sanitize(body.telegram),
    discord: sanitize(body.discord),
    youtube: sanitize(body.youtube),
    logoUrl: sanitize(body.logoUrl),
    tokenAddress: sanitize(body.tokenAddress),
    txHash: sanitize(body.txHash),
    creatorAddress: sanitize(body.creatorAddress),
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = await readPayload(request);

    const tokenName = sanitize(payload.tokenName) || "Pump Launch";
    const symbol = normalizeSymbol(payload.symbol || "PUMP");
    const totalSupply = sanitize(payload.totalSupply) || "1000000000";
    const description = sanitize(payload.description);

    if (!tokenName) {
      return NextResponse.json({ ok: false, error: "Token name is required." }, { status: 400 });
    }

    if (!symbol) {
      return NextResponse.json({ ok: false, error: "Symbol is required." }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ ok: false, error: "Description is required." }, { status: 400 });
    }

    const economicsPolicy = getPumpEconomicsPolicy();
    const feePolicy = getPumpFeePolicy();

    const projectId = `pump_${Date.now()}`;

    const tokenAddress =
      sanitize(payload.tokenAddress) || pseudoAddress(symbol);

    const txHash = sanitize(payload.txHash) || "";
    const providedCreatedHeight = Number(payload.createdHeight || 0);
    const createdHeight = await resolveCreatedHeightFromTx(txHash, providedCreatedHeight);

    const onChainConfirmed = Boolean(
      sanitize(payload.tokenAddress) && sanitize(payload.txHash),
    );

    let tokenInfo: any = null;
    let tokenMinter: string | null = null;
    let finalizerTokenBalanceBase = "0";
    let finalizerIsMinter = false;
    let finalizerHasReserve = false;
    let reserveAuthorityReady = false;
    let reserveAuthorityWarning: string | null = null;

    if (onChainConfirmed) {
      tokenInfo = await queryTokenInfo(tokenAddress);
      tokenMinter = String(tokenInfo?.minter || "").trim() || null;
      finalizerTokenBalanceBase = await queryTokenBalance(
        tokenAddress,
        PUMP_FINALIZER_ADDRESS
      );

      finalizerIsMinter = Boolean(tokenMinter && tokenMinter === PUMP_FINALIZER_ADDRESS);
      finalizerHasReserve = baseAmountGte(
        finalizerTokenBalanceBase,
        PUMP_REQUIRED_TOKEN_RESERVE_BASE
      );
      reserveAuthorityReady = finalizerIsMinter || finalizerHasReserve;

      if (!reserveAuthorityReady) {
        reserveAuthorityWarning =
          "Token accepted and registered. Automated market preparation will continue in the background.";
      }
    }

    let pumpRegistration: {
      registered: boolean;
      maxSupplyBase: string;
      createdHeight: number;
    } | null = null;

    if (onChainConfirmed) {
      try {
        pumpRegistration = await registerPumpLiveState({
          tokenAddress,
          creatorAddress: payload.creatorAddress || tokenMinter || "",
          tokenName,
          symbol,
          totalSupply,
          txHash,
          createdHeight,
          description,
          logoUrl: payload.logoUrl,
          website: payload.website,
          xHandle: payload.xHandle,
          twitter: payload.twitter,
          telegram: payload.telegram,
          discord: payload.discord,
          youtube: payload.youtube,
        });
      } catch (registrationError) {
        console.error("pump_create_auto_registration_failed", registrationError);
        return NextResponse.json(
          {
            ok: false,
            error: registrationError instanceof Error
              ? `Pump token was created on-chain, but auto-registration failed: ${registrationError.message}`
              : "Pump token was created on-chain, but auto-registration failed.",
            tokenAddress,
            txHash,
            source: "pump_create_auto_registration",
          },
          { status: 500 },
        );
      }
    }

    const screenerUrl = `/riodex/screener?token=${encodeURIComponent(tokenAddress)}`;
    const tradeUrl = `/riodex/swap?token=${encodeURIComponent(tokenAddress)}`;
    const liquidityUrl =
      `/riodex/liquidity?source=pumplive&mode=add` +
      `&token=${encodeURIComponent(tokenAddress)}` +
      `&base=${encodeURIComponent(economicsPolicy.defaultBaseAsset)}` +
      `&symbol=${encodeURIComponent(symbol)}` +
      `&project=${encodeURIComponent(projectId)}`;

    const discoveryUrl = `/createtoken/pump/board?token=${encodeURIComponent(tokenAddress)}`;
    const tokenPageUrl = `https://pump.spheriochain.io/token/${encodeURIComponent(tokenAddress)}`;
    const rioExUrl = `/rioex/assets/${encodeURIComponent(tokenAddress)}`;
    const rioExplorerUrl = `/rioexplorer?address=${encodeURIComponent(tokenAddress)}`;
    const coinGeckoHintUrl = `/rioex/assets/${encodeURIComponent(tokenAddress)}?listing=gecko`;
    const coinMarketCapHintUrl = `/rioex/assets/${encodeURIComponent(tokenAddress)}?listing=cmc`;

    const graduation = buildPumpGraduationState({
      tokenAddress,
      symbol,
      launchRail: "pump.live",
      baseAsset: economicsPolicy.defaultBaseAsset,
      totalSupply,
      holders: 12,
      watchers: 38,
      momentumScore: 18,
      communityScore: 24,
      liquidityCommittedRio: 0,
      volume24hUsd: 0,
    });

    const protection = buildPumpProtectionState({
      tokenAddress,
      symbol,
      launchRail: "pump.live",
      maxWalletPercent: 2,
      maxTxPercent: 1,
      cooldownSeconds: 15,
      earlyPhaseBlocks: 50,
      sniperTaxBps: 800,
      botRiskScore: 30,
      mevRiskScore: 35,
      creatorLockedLiquidityPercent: 85,
      creatorCanRemoveLiquidity: false,
      poolVerified: false,
      renouncedMint: false,
      upgradeabilityRestricted: true,
    });

    return NextResponse.json({
      ok: true,
      reserveAuthorityWarning,
      reserveAuthorityStatus: reserveAuthorityReady ? "ready" : "fixed_supply_reserve_required",
      graduationMode: reserveAuthorityReady ? "finalizer_ready" : "reserve_escrow_required",
      mode: onChainConfirmed ? "onchain_confirmed" : "frontend_preview_only",
      projectId,
      tokenAddress,
      txHash: txHash || null,
      pumpRegistration,
      tokenName,
      symbol,
      totalSupply,
      description,
      creatorAddress: payload.creatorAddress || null,
      authority: {
        requiredSeedValueRusd: PUMP_REQUIRED_SEED_VALUE_RUSD,
        requiredTokenReserveBase: PUMP_REQUIRED_TOKEN_RESERVE_BASE,
        finalizerAddress: PUMP_FINALIZER_ADDRESS,
        tokenMinter,
        finalizerIsMinter,
        finalizerTokenBalanceBase,
        finalizerHasReserve,
        reserveAuthorityReady: onChainConfirmed ? reserveAuthorityReady : false,
        note: onChainConfirmed
          ? reserveAuthorityWarning || "PUMP token accepted with graduation reserve authority ready."
          : "Preview only. Wallet signing / execution must complete before propagation.",
      },
      launchRail: "pump.live",
      standard: "SPO-20",
      baseAsset: economicsPolicy.defaultBaseAsset,
      discoveryUrl,
      screenerUrl,
      tradeUrl,
      tokenPageUrl,
      liquidityUrl,
      rioExUrl,
      rioExplorerUrl,
      coinGeckoHintUrl,
      coinMarketCapHintUrl,
      economicsPolicy,
      feePolicy: {
        ...feePolicy,
      },
      graduation,
      protection,
      message: onChainConfirmed
        ? "Pump token created successfully. Your token page and discovery listing are now available."
        : "Pump create request accepted as preview only. Wallet signing / execution must complete before propagation can occur.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process Pump creation request.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
