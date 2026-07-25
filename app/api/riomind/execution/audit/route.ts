import { NextResponse } from "next/server";

import { RIOMIND_EXECUTION_CONTRACTS } from "@/lib/riomind/execution/contracts";

export async function GET() {
  const byStatus = RIOMIND_EXECUTION_CONTRACTS.reduce<Record<string, number>>(
    (acc, contract) => {
      acc[contract.status] = (acc[contract.status] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const byLayer = RIOMIND_EXECUTION_CONTRACTS.reduce<Record<string, number>>(
    (acc, contract) => {
      acc[contract.layer] = (acc[contract.layer] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return NextResponse.json({
    ok: true,
    source: "riomind_execution_contract_audit",
    status: "execution_contracts_ready",
    standard: "sovereign_foundation",
    summary: {
      contracts: RIOMIND_EXECUTION_CONTRACTS.length,
      byStatus,
      byLayer,
    },
    contracts: RIOMIND_EXECUTION_CONTRACTS,
  });
}
