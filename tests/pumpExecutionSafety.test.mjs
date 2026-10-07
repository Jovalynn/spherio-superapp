import assert from "node:assert/strict";
import test from "node:test";
import {
  admitPumpPreviewRequest,
  PUMP_EXECUTION_UNAVAILABLE,
} from "../lib/pump/execution-safety.mjs";

test("preview requests are admitted without enabling transaction execution", () => {
  assert.deepEqual(admitPumpPreviewRequest(true), {
    ok: true,
    previewOnly: true,
  });
});

test("non-preview requests fail closed until an on-chain executor is verified", () => {
  assert.deepEqual(admitPumpPreviewRequest(false), {
    ok: false,
    status: 503,
    code: "ON_CHAIN_EXECUTION_UNAVAILABLE",
    error: PUMP_EXECUTION_UNAVAILABLE,
  });
});
