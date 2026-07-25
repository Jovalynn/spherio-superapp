from pathlib import Path

discover_path = Path("app/api/pump/discover/route.ts")
resolver_path = Path("lib/launch/resolveLaunchLifecycle.ts")

discover = discover_path.read_text()
resolver = resolver_path.read_text()

discover_backup = discover_path.with_suffix(".route.ts.bak-underseeded-truth")
resolver_backup = resolver_path.with_suffix(".ts.bak-underseeded-truth")

if not discover_backup.exists():
    discover_backup.write_text(discover)
    print(f"Backup created: {discover_backup}")

if not resolver_backup.exists():
    resolver_backup.write_text(resolver)
    print(f"Backup created: {resolver_backup}")

# ---------------------------
# Patch PUMP discover API
# ---------------------------

if "RIO_REFERENCE_PRICE_RUSD_ESTIMATE" not in discover:
    discover = discover.replace(
        'type DiscoverSort = "trending" | "progress" | "marketCap" | "new";',
        '''type DiscoverSort = "trending" | "progress" | "marketCap" | "new";

const RIO_REFERENCE_PRICE_RUSD_ESTIMATE = 0.1;
const GRADUATION_SEED_TOLERANCE = 0.995;'''
    )

if "requiredSeedValueRusd?: number | null;" not in discover:
    discover = discover.replace(
        '''  liquidityStatus?: string | null;
  graduationStatus?: string | null;
  createdHeight?: number | null;''',
        '''  liquidityStatus?: string | null;
  graduationStatus?: string | null;

  requiredSeedValueRusd?: number | null;
  requiredSeedRio?: number | null;
  recordedSeedRio?: number | null;
  actualIndexedSeedRio?: number | null;
  graduationUnderseeded?: boolean;
  graduationDiagnostic?: string | null;

  createdHeight?: number | null;'''
    )

if "function graduationUnderseeded" not in discover:
    discover = discover.replace(
        '''function createdAtLabelFromHeight(height: unknown): string {''',
        '''function isRioLikeSymbol(value: unknown): boolean {
  const s = String(value || "").trim().toUpperCase();
  return s === "RIO" || s === "URIO" || s === "NATIVE:URIO";
}

function requiredSeedRio(row: any): number {
  const requiredRusd = toNumber(row.required_seed_value_rusd, 15_000);
  if (requiredRusd <= 0) return 0;
  return requiredRusd / RIO_REFERENCE_PRICE_RUSD_ESTIMATE;
}

function recordedSeedRio(row: any): number {
  return toNumber(row.seed_rio_urio, 0) / 1_000_000;
}

function indexedSeedRio(row: any): number {
  const asset0Symbol = row.asset_0_symbol || row.asset_0_id;
  const asset1Symbol = row.asset_1_symbol || row.asset_1_id;

  if (isRioLikeSymbol(asset0Symbol)) {
    return toNumber(row.reserve_0, 0) / Math.pow(10, Number(row.asset_0_decimals ?? 6));
  }

  if (isRioLikeSymbol(asset1Symbol)) {
    return toNumber(row.reserve_1, 0) / Math.pow(10, Number(row.asset_1_decimals ?? 6));
  }

  return toNumber(row.reserve_0, 0) / 1_000_000;
}

function graduationUnderseeded(row: any): boolean {
  const target = requiredSeedRio(row);
  if (target <= 0) return false;

  const actual = indexedSeedRio(row);
  const recorded = recordedSeedRio(row);
  const status = String(row.graduation_status || "").toLowerCase();
  const hasPair = Boolean(row.riodex_pair_address || row.pair_address);

  if (!hasPair && (status === "pair_created" || status === "completed")) return true;

  const bestAvailableSeed = Math.max(actual, recorded);
  return bestAvailableSeed > 0 && bestAvailableSeed < target * GRADUATION_SEED_TOLERANCE;
}

function graduationDiagnostic(row: any): string | null {
  if (!graduationUnderseeded(row)) return null;

  const target = requiredSeedRio(row);
  const actual = indexedSeedRio(row);
  const recorded = recordedSeedRio(row);

  return `Required ${target.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} RIO for 15K RUSD target at 0.1 RUSD/RIO; indexed ${actual.toLocaleString("en-US", {
    maximumFractionDigits: 6,
  })} RIO; recorded ${recorded.toLocaleString("en-US", {
    maximumFractionDigits: 6,
  })} RIO.`;
}

function createdAtLabelFromHeight(height: unknown): string {'''
    )

if 'if (graduationUnderseeded(row)) return "ready";' not in discover:
    discover = discover.replace(
        '''  const graduationStatus = String(row.graduation_status || "").toLowerCase();

  if (tokenStatus === "graduated" || graduationStatus === "completed") return "graduated";''',
        '''  const graduationStatus = String(row.graduation_status || "").toLowerCase();

  if (graduationUnderseeded(row)) return "ready";
  if (tokenStatus === "graduated" || graduationStatus === "completed") return "graduated";''',
        1
    )

if 'return "Graduated · LP underseeded";' not in discover:
    discover = discover.replace(
        '''  const graduationStatus = String(row.graduation_status || "").toLowerCase();

  if (stage === "graduated") return "Graduated · RioDex Live";''',
        '''  const graduationStatus = String(row.graduation_status || "").toLowerCase();

  if (graduationUnderseeded(row)) return "Graduated · LP underseeded";
  if (stage === "graduated") return "Graduated · RioDex Live";''',
        1
    )

if "if (graduationUnderseeded(row)) return 96;" not in discover:
    discover = discover.replace(
        '''function progressFor(stage: PumpBoardRow["stage"], row: any): number {
  if (stage === "graduated") return 100;''',
        '''function progressFor(stage: PumpBoardRow["stage"], row: any): number {
  if (graduationUnderseeded(row)) return 96;
  if (stage === "graduated") return 100;'''
    )

if "const requiredSeedValueRusd = toNumber(row.required_seed_value_rusd, 15_000);" not in discover:
    discover = discover.replace(
        '''    const hasPair = Boolean(row.riodex_pair_address || row.pair_address);
    const hasLiquidity = row.reserve_0 !== null && row.reserve_1 !== null;
    const reserves = reserveLabel(row);

    const score =''',
        '''    const hasPair = Boolean(row.riodex_pair_address || row.pair_address);
    const hasLiquidity = row.reserve_0 !== null && row.reserve_1 !== null;
    const reserves = reserveLabel(row);

    const requiredSeedValueRusd = toNumber(row.required_seed_value_rusd, 15_000);
    const requiredSeedRioValue = requiredSeedRio(row);
    const recordedSeedRioValue = recordedSeedRio(row);
    const actualIndexedSeedRioValue = indexedSeedRio(row);
    const isUnderseeded = graduationUnderseeded(row);
    const diagnostic = graduationDiagnostic(row);

    const score ='''
    )

discover = discover.replace(
    '''      pairAddress,
      reserveLabel: reserves,
      liquidityStatus: hasLiquidity ? "reserves_indexed" : hasPair ? "pair_created" : "pending",
      graduationStatus: row.graduation_status || row.token_status || null,
      createdHeight: row.created_height ? Number(row.created_height) : null,''',
    '''      pairAddress,
      reserveLabel: reserves,
      liquidityStatus: isUnderseeded
        ? "underseeded"
        : hasLiquidity
          ? "reserves_indexed"
          : hasPair
            ? "pair_created"
            : "pending",
      graduationStatus: row.graduation_status || row.token_status || null,

      requiredSeedValueRusd,
      requiredSeedRio: requiredSeedRioValue,
      recordedSeedRio: recordedSeedRioValue,
      actualIndexedSeedRio: actualIndexedSeedRioValue,
      graduationUnderseeded: isUnderseeded,
      graduationDiagnostic: diagnostic,

      createdHeight: row.created_height ? Number(row.created_height) : null,''',
)

if "pg.required_seed_value_rusd" not in discover:
    discover = discover.replace(
        '''        pg.status AS graduation_status,
        pg.riodex_pair_address,
        pg.lp_token_amount,
        pg.creator_reward_total_urio,
        pg.block_height AS graduation_height,
        pg.completed_at,''',
        '''        pg.status AS graduation_status,
        pg.required_seed_value_rusd,
        pg.seed_rio_urio,
        pg.seed_token_base,
        pg.surplus_rio_urio,
        pg.creator_reward_total_urio,
        pg.treasury_surplus_urio,
        pg.riodex_pair_address,
        pg.lp_token_amount,
        pg.block_height AS graduation_height,
        pg.completed_at,''',
    )

discover_path.write_text(discover)
print("OK: patched app/api/pump/discover/route.ts")

# ---------------------------
# Patch lifecycle resolver
# ---------------------------

resolver = resolver.replace(
    '''  liquidityAdded?: boolean | null
  tradeEnabled?: boolean | null
}''',
    '''  liquidityAdded?: boolean | null
  tradeEnabled?: boolean | null

  liquidityStatus?: string | null
  graduationUnderseeded?: boolean | null
  requiredSeedRio?: number | null
  actualIndexedSeedRio?: number | null
  recordedSeedRio?: number | null
}''',
)

resolver = resolver.replace(
    '''  lifecycleLabel: string
}''',
    '''  lifecycleLabel: string

  isGraduationUnderseeded: boolean
  requiredSeedRio: number | null
  actualSeedRio: number | null
}''',
)

if "function numericOrNull" not in resolver:
    resolver = resolver.replace(
        '''function normalizeStatus(value: unknown): string {
  return String(value ?? "").trim().toLowerCase()
}''',
        '''function normalizeStatus(value: unknown): string {
  return String(value ?? "").trim().toLowerCase()
}

function numericOrNull(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}''',
    )

if "const requiredSeedRio = numericOrNull(raw.requiredSeedRio)" not in resolver:
    resolver = resolver.replace(
        '''  const hasPair = Boolean(raw.pairAddress)
  const hasRioExAsset = Boolean(raw.rioexAssetId || raw.rioexIndexed)''',
        '''  const hasPair = Boolean(raw.pairAddress)
  const hasRioExAsset = Boolean(raw.rioexAssetId || raw.rioexIndexed)

  const requiredSeedRio = numericOrNull(raw.requiredSeedRio)
  const actualSeedRio =
    numericOrNull(raw.actualIndexedSeedRio) ??
    numericOrNull(raw.recordedSeedRio)

  const liquidityStatus = normalizeStatus(raw.liquidityStatus)
  const isGraduationUnderseeded =
    raw.graduationUnderseeded === true ||
    liquidityStatus === "underseeded" ||
    (
      requiredSeedRio !== null &&
      actualSeedRio !== null &&
      requiredSeedRio > 0 &&
      actualSeedRio < requiredSeedRio * 0.995
    )''',
    )

resolver = resolver.replace(
    '''  const isGraduated =
    explicitGraduated ||
    hasPair ||
    curveProgress >= 100''',
    '''  const isGraduated =
    !isGraduationUnderseeded &&
    (
      explicitGraduated ||
      hasPair ||
      curveProgress >= 100
    )''',
)

resolver = resolver.replace(
    '''  const graduationProgress = isGraduated
    ? 100
    : clampPercent(raw.graduationProgress ?? raw.graduationStep ?? curveProgress)''',
    '''  const graduationProgress = isGraduationUnderseeded
    ? 96
    : isGraduated
      ? 100
      : clampPercent(raw.graduationProgress ?? raw.graduationStep ?? curveProgress)''',
)

resolver = resolver.replace(
    '''  const isLiquidityReady =
    Boolean(raw.liquidityAdded) ||
    hasPair ||
    isGraduated''',
    '''  const isLiquidityReady =
    !isGraduationUnderseeded &&
    (
      Boolean(raw.liquidityAdded) ||
      hasPair ||
      isGraduated
    )''',
)

resolver = resolver.replace(
    '''  const graduationLabel = isGraduated
    ? "100/100"
    : `${graduationProgress}/100`''',
    '''  const graduationLabel = isGraduationUnderseeded
    ? "LP pending"
    : isGraduated
      ? "100/100"
      : `${graduationProgress}/100`''',
)

resolver = resolver.replace(
    '''  const tradeLabel = isTradeReady
    ? "Live"
    : isGraduated
      ? "Pair indexing"
      : "Pending"''',
    '''  const tradeLabel = isGraduationUnderseeded
    ? "Route ready · LP underseeded"
    : isTradeReady
      ? "Live"
      : isGraduated
        ? "Pair indexing"
        : "Pending"''',
)

resolver = resolver.replace(
    '''  const lifecycleLabel = isGraduated
    ? "Graduated to RioDex"
    : curveProgress > 0
      ? "Bonding curve live"
      : "Created"''',
    '''  const lifecycleLabel = isGraduationUnderseeded
    ? "Graduated · LP underseeded"
    : isGraduated
      ? "Graduated to RioDex"
      : curveProgress > 0
        ? "Bonding curve live"
        : "Created"''',
)

resolver = resolver.replace(
    '''    lifecycleLabel,
  }
}''',
    '''    lifecycleLabel,

    isGraduationUnderseeded,
    requiredSeedRio,
    actualSeedRio,
  }
}''',
)

resolver_path.write_text(resolver)
print("OK: patched lib/launch/resolveLaunchLifecycle.ts")
