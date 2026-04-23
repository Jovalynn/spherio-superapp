export const CANONICAL_RUSD_CONTRACT =
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";

type NormalizePairInput = {
  displaySymbol?: string | null;
  asset0Id?: string | null;
  asset1Id?: string | null;
  asset0Label?: string | null;
  asset1Label?: string | null;
};

function shortAddr(value?: string | null, left = 8, right = 6) {
  if (!value) return "—";
  if (value.length <= left + right) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}

function cleanTokenPrefix(value: string) {
  if (value.startsWith("native:")) return value.slice("native:".length);
  if (value.startsWith("token:")) return value.slice("token:".length);
  return value;
}

export function isRioDenom(value?: string | null) {
  if (!value) return false;
  const v = cleanTokenPrefix(String(value).trim());
  return v === "urio" || v === "RIO";
}

export function isRusdContract(value?: string | null) {
  if (!value) return false;
  const v = cleanTokenPrefix(String(value).trim());
  return v === CANONICAL_RUSD_CONTRACT || v === "RUSD";
}

export function isContractAddressLike(value?: string | null) {
  if (!value) return false;
  const v = cleanTokenPrefix(String(value).trim());
  return /^rio1[0-9a-z]{20,}$/i.test(v);
}

export function isRawChainLabel(value?: string | null) {
  if (!value) return false;
  const v = String(value).trim();

  return (
    isRioDenom(v) ||
    isRusdContract(v) ||
    isContractAddressLike(v) ||
    v.includes("native:") ||
    v.includes("token:") ||
    /^rio1[0-9a-z]{20,}\s*\/\s*rio1[0-9a-z]{20,}$/i.test(v) ||
    /^urio\s*\/\s*rio1[0-9a-z]{20,}$/i.test(v) ||
    /^rio1[0-9a-z]{20,}\s*\/\s*urio$/i.test(v)
  );
}

export function normalizeAssetLabel(value?: string | null) {
  if (!value) return "—";

  const raw = cleanTokenPrefix(String(value).trim());

  if (isRioDenom(raw)) return "RIO";
  if (isRusdContract(raw)) return "RUSD";

  if (isContractAddressLike(raw)) {
    return shortAddr(raw, 10, 8);
  }

  return raw;
}

export function normalizePairLabel(input: NormalizePairInput) {
  const left =
    normalizeAssetLabel(input.asset0Label || input.asset0Id || null) || "—";
  const right =
    normalizeAssetLabel(input.asset1Label || input.asset1Id || null) || "—";

  const derived = `${left} / ${right}`;

  const display = input.displaySymbol?.trim() || "";

  if (!display) return derived;

  if (isRawChainLabel(display)) return derived;

  if (display.includes("/")) {
    const [a, b] = display.split("/").map((v) => normalizeAssetLabel(v.trim()));
    return `${a} / ${b}`;
  }

  return display;
}

export function normalizePairLabelFromRow(row?: {
  display_symbol?: string | null;
  asset_0_id?: string | null;
  asset_1_id?: string | null;
  asset_0_label?: string | null;
  asset_1_label?: string | null;
} | null) {
  if (!row) return "—";

  return normalizePairLabel({
    displaySymbol: row.display_symbol,
    asset0Id: row.asset_0_id,
    asset1Id: row.asset_1_id,
    asset0Label: row.asset_0_label,
    asset1Label: row.asset_1_label,
  });
}
