// lib/createtoken/units.ts
export const SPO20_DECIMALS = 6;

export function humanToBaseUnitsStrict(human: string, decimals = SPO20_DECIMALS): bigint {
  const s = (human ?? "").trim();
  if (!s) throw new Error("Total supply is required");

  const normalized = s.replace(/_/g, "");
  const parts = normalized.split(".");
  if (parts.length > 2) throw new Error("Invalid number format");

  const intPart = parts[0];
  const fracPart = parts[1] ?? "";

  if (!/^\d+$/.test(intPart)) throw new Error("Invalid total supply (integer part)");
  if (!/^\d*$/.test(fracPart)) throw new Error("Invalid total supply (fractional part)");
  if (fracPart.length > decimals) throw new Error(`Too many decimal places (max ${decimals})`);

  const d = BigInt(decimals);
  const baseInt = BigInt(intPart) * (10n ** d);

  const fracPadded = (fracPart + "0".repeat(decimals)).slice(0, decimals);
  const baseFrac = fracPadded.length ? BigInt(fracPadded) : 0n;

  return baseInt + baseFrac;
}

export function formatBigintCommas(x: bigint): string {
  const s = x.toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
