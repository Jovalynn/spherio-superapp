import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  RIO_APPROVED_ALLOCATIONS,
  RIO_APPROVED_NOMINAL_TOTAL,
} from "../lib/rioAllocationPolicy.mjs";

const expected = [
  ["Liquidity", 44_000_000],
  ["Emergency", 30_000_000],
  ["Ecosystem Protocol", 160_000_000],
  ["Owner / Founder / Core Contributor", 30_000_000],
  ["Validators / Network Security", 36_000_000],
];

test("RIO policy targets match the locked allocation and nominal total", () => {
  assert.deepEqual(
    RIO_APPROVED_ALLOCATIONS.map(({ label, amount }) => [label, amount]),
    expected,
  );
  assert.equal(RIO_APPROVED_NOMINAL_TOTAL, 300_000_000);
});

test("RIO terminal rejects unmarked state and does not present obsolete live allocations", () => {
  const source = readFileSync(new URL("../app/rio/page.tsx", import.meta.url), "utf8");
  assert.match(source, /authoritative_monetary_truth === true/);
  assert.match(source, /Live RIO monetary state is unavailable/);
  assert.match(source, /Reconciliation unavailable/);
  assert.doesNotMatch(source, /36,997,819|51,000,000|86,000,000/);
  assert.match(source, /161M Forever Lock category\s+is abolished/);
});
