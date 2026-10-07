export const RIO_APPROVED_ALLOCATIONS = Object.freeze([
  Object.freeze({ key: "liquidity", label: "Liquidity", amount: 44_000_000 }),
  Object.freeze({ key: "emergency", label: "Emergency", amount: 30_000_000 }),
  Object.freeze({ key: "ecosystem", label: "Ecosystem Protocol", amount: 160_000_000 }),
  Object.freeze({
    key: "owner-core",
    label: "Owner / Founder / Core Contributor",
    amount: 30_000_000,
  }),
  Object.freeze({
    key: "validators",
    label: "Validators / Network Security",
    amount: 36_000_000,
  }),
]);

export const RIO_APPROVED_NOMINAL_TOTAL =
  RIO_APPROVED_ALLOCATIONS.reduce((sum, allocation) => sum + allocation.amount, 0);
