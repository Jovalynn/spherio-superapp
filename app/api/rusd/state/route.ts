import { NextResponse } from "next/server";

type RusdStateResponse = {
  asset: "RUSD";
  unit: string;
  contract_address: string;
  treasury_multisig: string;
  issued_supply: {
    raw: string;
    formatted: string;
  };
  supply_ceiling: {
    raw: string;
    formatted: string;
  };
  remaining_issuance_capacity: {
    raw: string;
    formatted: string;
  };
  backing_value: {
    raw: string;
    formatted: string;
  };
  collateralization_ratio: {
    bps: number;
    percent: string;
  };
  mint_policy: {
    daily_mint_cap: {
      raw: string;
      formatted: string;
    };
    epoch_mint_cap: {
      raw: string;
      formatted: string;
    };
    epoch_window_hours: number;
  };
  source: {
    mode: string;
    issued_supply: string;
    policy_fields: string;
    derived_fields: string;
  };
  updated_at: string;
};

function getIndexerBaseUrl() {
  return (
    process.env.INTERNAL_INDEXER_URL ||
    process.env.INDEXER_URL ||
    "http://indexer:4000"
  );
}

function formatWhole(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function buildFallbackRusdState(): RusdStateResponse {
  const issuedSupply = 6_000_000;
  const supplyCeiling = 20_000_000;
  const backingValue = 7_200_000;
  const remaining = Math.max(supplyCeiling - issuedSupply, 0);
  const ratio = issuedSupply > 0 ? (backingValue / issuedSupply) * 100 : 0;

  return {
    asset: "RUSD",
    unit: "leri",
    contract_address: "pending_live_contract_sync",
    treasury_multisig: "rio1nnhxsa49cc5e9vyxj6r6s3hwlkymcrletx7wch",
    issued_supply: {
      raw: String(issuedSupply),
      formatted: formatWhole(issuedSupply),
    },
    supply_ceiling: {
      raw: String(supplyCeiling),
      formatted: formatWhole(supplyCeiling),
    },
    remaining_issuance_capacity: {
      raw: String(remaining),
      formatted: formatWhole(remaining),
    },
    backing_value: {
      raw: String(backingValue),
      formatted: formatWhole(backingValue),
    },
    collateralization_ratio: {
      bps: Math.round(ratio * 100),
      percent: `${ratio.toFixed(2)}%`,
    },
    mint_policy: {
      daily_mint_cap: {
        raw: "100000",
        formatted: formatWhole(100000),
      },
      epoch_mint_cap: {
        raw: "500000",
        formatted: formatWhole(500000),
      },
      epoch_window_hours: 24,
    },
    source: {
      mode: "fallback_attestation_mode",
      issued_supply: "degraded",
      policy_fields: "degraded",
      derived_fields: "fallback",
    },
    updated_at: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const response = await fetch(`${getIndexerBaseUrl()}/api/rusd/state`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await response.text();

    if (response.ok) {
      const data = text ? JSON.parse(text) : null;
      if (data) {
        return NextResponse.json(data);
      }
    }

    const attestationResponse = await fetch(`${getIndexerBaseUrl()}/api/rusd/attestation`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const attestationText = await attestationResponse.text();

    if (attestationResponse.ok) {
      const attestation = attestationText ? JSON.parse(attestationText) : null;

      if (attestation) {
        const totalSupply = Number(attestation.total_supply ?? 0);
        const reserves = Number(attestation.reserves ?? 0);
        const ratio = totalSupply > 0 ? (reserves / totalSupply) * 100 : 0;
        const supplyCeiling = 20_000_000;
        const remaining = Math.max(supplyCeiling - totalSupply, 0);

        return NextResponse.json({
          asset: "RUSD",
          unit: "leri",
          contract_address: "pending_live_contract_sync",
          treasury_multisig: "rio1nnhxsa49cc5e9vyxj6r6s3hwlkymcrletx7wch",
          issued_supply: {
            raw: String(totalSupply),
            formatted: formatWhole(totalSupply),
          },
          supply_ceiling: {
            raw: String(supplyCeiling),
            formatted: formatWhole(supplyCeiling),
          },
          remaining_issuance_capacity: {
            raw: String(remaining),
            formatted: formatWhole(remaining),
          },
          backing_value: {
            raw: String(reserves),
            formatted: formatWhole(reserves),
          },
          collateralization_ratio: {
            bps: Math.round(ratio * 100),
            percent: `${ratio.toFixed(2)}%`,
          },
          mint_policy: {
            daily_mint_cap: {
              raw: "100000",
              formatted: formatWhole(100000),
            },
            epoch_mint_cap: {
              raw: "500000",
              formatted: formatWhole(500000),
            },
            epoch_window_hours: 24,
          },
          source: {
            mode: "attestation_bridge",
            issued_supply: "indexer_attestation",
            policy_fields: "fallback_policy_shape",
            derived_fields: "derived_from_attestation",
          },
          updated_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(buildFallbackRusdState());
  } catch {
    return NextResponse.json(buildFallbackRusdState());
  }
}
