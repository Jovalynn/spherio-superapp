export const PUMP_EXECUTION_UNAVAILABLE: string;

export type PumpPreviewAdmission =
  | { ok: true; previewOnly: true }
  | {
      ok: false;
      status: 503;
      code: "ON_CHAIN_EXECUTION_UNAVAILABLE";
      error: string;
    };

export function admitPumpPreviewRequest(
  previewOnly: boolean,
): PumpPreviewAdmission;
