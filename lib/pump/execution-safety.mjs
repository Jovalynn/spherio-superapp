export const PUMP_EXECUTION_UNAVAILABLE =
  "Pump trading cannot execute until an on-chain transaction path is connected and verified.";

export function admitPumpPreviewRequest(previewOnly) {
  if (previewOnly !== true) {
    return {
      ok: false,
      status: 503,
      code: "ON_CHAIN_EXECUTION_UNAVAILABLE",
      error: PUMP_EXECUTION_UNAVAILABLE,
    };
  }

  return {
    ok: true,
    previewOnly: true,
  };
}
