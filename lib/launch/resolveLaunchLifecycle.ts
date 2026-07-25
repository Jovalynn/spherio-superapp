export type LaunchRawState = {
  symbol?: string | null
  assetId?: string | null
  contractAddress?: string | null
  pairAddress?: string | null

  status?: string | null
  lifecycleStatus?: string | null
  graduated?: boolean | null

  curveProgress?: number | null
  graduationProgress?: number | null
  graduationStep?: number | null

  indexed?: boolean | null
  rioexIndexed?: boolean | null
  rioexAssetId?: string | null

  liquidityAdded?: boolean | null
  tradeEnabled?: boolean | null

  liquidityStatus?: string | null
  graduationUnderseeded?: boolean | null
  requiredSeedRio?: number | null
  actualIndexedSeedRio?: number | null
  recordedSeedRio?: number | null
}

export type CanonicalLaunchLifecycle = {
  symbol: string
  assetId: string | null
  contractAddress: string | null
  pairAddress: string | null

  isCreated: boolean
  isCurveLive: boolean
  isGraduated: boolean
  isLiquidityReady: boolean
  isTradeReady: boolean
  isRioExIndexed: boolean

  curveProgress: number
  graduationProgress: number

  indexerLabel: string
  graduationLabel: string
  tradeLabel: string
  lifecycleLabel: string

  isGraduationUnderseeded: boolean
  requiredSeedRio: number | null
  actualSeedRio: number | null
}

function clampPercent(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

function normalizeStatus(value: unknown): string {
  return String(value ?? "").trim().toLowerCase()
}

function numericOrNull(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function resolveLaunchLifecycle(raw: LaunchRawState): CanonicalLaunchLifecycle {
  const status = normalizeStatus(raw.status)
  const lifecycleStatus = normalizeStatus(raw.lifecycleStatus)

  const explicitGraduated =
    raw.graduated === true ||
    status === "graduated" ||
    lifecycleStatus === "graduated" ||
    status === "completed" ||
    lifecycleStatus === "completed"

  const hasPair = Boolean(raw.pairAddress)
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
    )

  const curveProgress = clampPercent(
    raw.curveProgress ??
      raw.graduationProgress ??
      raw.graduationStep ??
      0
  )

  const isGraduated =
    !isGraduationUnderseeded &&
    (
      explicitGraduated ||
      hasPair ||
      curveProgress >= 100
    )

  const graduationProgress = isGraduationUnderseeded
    ? 96
    : isGraduated
      ? 100
      : clampPercent(raw.graduationProgress ?? raw.graduationStep ?? curveProgress)

  const isLiquidityReady =
    !isGraduationUnderseeded &&
    (
      Boolean(raw.liquidityAdded) ||
      hasPair ||
      isGraduated
    )

  const isTradeReady =
    Boolean(raw.tradeEnabled) ||
    hasPair

  const isRioExIndexed =
    Boolean(raw.indexed) ||
    Boolean(raw.rioexIndexed) ||
    hasRioExAsset

  const indexerLabel = isRioExIndexed
    ? "Indexed"
    : isGraduated
      ? "RioEx pending"
      : "Not indexed"

  const graduationLabel = isGraduationUnderseeded
    ? "LP pending"
    : isGraduated
      ? "100/100"
      : `${graduationProgress}/100`

  const tradeLabel = isGraduationUnderseeded
    ? "Route ready · LP underseeded"
    : isTradeReady
      ? "Live"
      : isGraduated
        ? "Pair indexing"
        : "Pending"

  const lifecycleLabel = isGraduationUnderseeded
    ? "Graduated · LP underseeded"
    : isGraduated
      ? "Graduated to RioDex"
      : curveProgress > 0
        ? "Bonding curve live"
        : "Created"

  return {
    symbol: raw.symbol || "UNKNOWN",
    assetId: raw.assetId || null,
    contractAddress: raw.contractAddress || null,
    pairAddress: raw.pairAddress || null,

    isCreated: Boolean(raw.contractAddress || raw.assetId || raw.symbol),
    isCurveLive: curveProgress > 0 && !isGraduated,
    isGraduated,
    isLiquidityReady,
    isTradeReady,
    isRioExIndexed,

    curveProgress: isGraduated ? 100 : curveProgress,
    graduationProgress,

    indexerLabel,
    graduationLabel,
    tradeLabel,
    lifecycleLabel,

    isGraduationUnderseeded,
    requiredSeedRio,
    actualSeedRio,
  }
}
