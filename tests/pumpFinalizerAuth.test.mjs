import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { isAuthorizedPumpFinalizer } from "../lib/pump/finalizer-auth.mjs";

const token = "server-only-test-token-35f9";
const autoRoute = readFileSync("app/api/pump/graduation/auto/route.ts", "utf8");
const executeRoute = readFileSync("app/api/pump/graduation/execute/route.ts", "utf8");

test("finalizer authorization fails closed when no token is configured", () => {
  assert.equal(isAuthorizedPumpFinalizer(new Request("https://local.test"), ""), false);
});

test("finalizer authorization requires the configured header", () => {
  assert.equal(isAuthorizedPumpFinalizer(new Request("https://local.test"), token), false);
  assert.equal(
    isAuthorizedPumpFinalizer(new Request(`https://local.test/?token=${token}`), token),
    false,
  );
});

test("finalizer authorization accepts only the exact configured header", () => {
  assert.equal(
    isAuthorizedPumpFinalizer(
      new Request("https://local.test", { headers: { "x-pump-finalizer-token": token } }),
      token,
    ),
    true,
  );
  assert.equal(
    isAuthorizedPumpFinalizer(
      new Request("https://local.test", { headers: { "x-pump-finalizer-token": "wrong" } }),
      token,
    ),
    false,
  );
});

test("both transaction routes enforce the shared token gate", () => {
  assert.match(autoRoute, /isAuthorizedPumpFinalizer\(request, ADMIN_TOKEN\)/);
  assert.match(executeRoute, /isAuthorizedPumpFinalizer\(request\)/);
  assert.doesNotMatch(autoRoute, /searchParams\.get\(["']token["']\)/);
  assert.doesNotMatch(executeRoute, /signer: address|rpcUrl: RPC_URL/);
});
