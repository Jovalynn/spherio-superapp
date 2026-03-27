import { NextResponse } from "next/server";
import { createHash } from "crypto";

import { TxRaw, TxBody } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import {
  MsgExecuteContract,
  MsgInstantiateContract,
  MsgInstantiateContract2,
} from "cosmjs-types/cosmwasm/wasm/v1/tx";

type ActionKind = "transfer" | "instantiate" | "execute" | "unknown";

function sha256HexUpper(bytes: Uint8Array): string {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex").toUpperCase();
}

function safeBase64ToBytes(b64: string): Uint8Array {
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
  return new Uint8Array(Buffer.from(padded, "base64"));
}

function shortAddr(addr: string, left = 10, right = 6): string {
  if (!addr || addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

function parseActionFromTxBytes(txBytes: Uint8Array): { kind: ActionKind; label: string } {
  try {
    const txRaw = TxRaw.decode(txBytes);
    const body = TxBody.decode(txRaw.bodyBytes);
    const firstMsg = body.messages?.[0];

    if (!firstMsg?.typeUrl) return { kind: "unknown", label: "unknown" };

    if (firstMsg.typeUrl === "/cosmos.bank.v1beta1.MsgSend") {
      const msg = MsgSend.decode(firstMsg.value);
      return { kind: "transfer", label: `transfer ${shortAddr(msg.toAddress ?? "")}` };
    }

    if (firstMsg.typeUrl === "/cosmwasm.wasm.v1.MsgInstantiateContract") {
      const msg = MsgInstantiateContract.decode(firstMsg.value);
      return { kind: "instantiate", label: `instantiate code_id=${String(msg.codeId)}` };
    }

    if (firstMsg.typeUrl === "/cosmwasm.wasm.v1.MsgInstantiateContract2") {
      const msg = MsgInstantiateContract2.decode(firstMsg.value);
      return { kind: "instantiate", label: `instantiate code_id=${String(msg.codeId)}` };
    }

    if (firstMsg.typeUrl === "/cosmwasm.wasm.v1.MsgExecuteContract") {
      const msg = MsgExecuteContract.decode(firstMsg.value);
      return { kind: "execute", label: `execute ${shortAddr(msg.contract ?? "")}` };
    }

    return { kind: "unknown", label: "unknown" };
  } catch {
    return { kind: "unknown", label: "unknown" };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const height = searchParams.get("height");
  if (!height) {
    return NextResponse.json({ error: "Missing required query param: height" }, { status: 400 });
  }

  const rpcBase = process.env.SPHERIO_RPC_HTTP || "http://localhost:26657";

  try {
    const [blockRes, resultsRes] = await Promise.all([
      fetch(`${rpcBase}/block?height=${encodeURIComponent(height)}`, { cache: "no-store" }),
      fetch(`${rpcBase}/block_results?height=${encodeURIComponent(height)}`, { cache: "no-store" }),
    ]);

    if (!blockRes.ok) {
      const txt = await blockRes.text().catch(() => "");
      return NextResponse.json(
        { error: "RPC /block failed", rpcBase, status: blockRes.status, body: txt.slice(0, 500) },
        { status: 502 }
      );
    }

    if (!resultsRes.ok) {
      const txt = await resultsRes.text().catch(() => "");
      return NextResponse.json(
        {
          error: "RPC /block_results failed",
          rpcBase,
          status: resultsRes.status,
          body: txt.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const blockJson: any = await blockRes.json();
    const resultsJson: any = await resultsRes.json();

    const txsB64: string[] = blockJson?.result?.block?.data?.txs ?? [];
    const txsResults: any[] = resultsJson?.result?.txs_results ?? [];

    const txs = txsB64.map((b64, i) => {
      const txBytes = safeBase64ToBytes(b64);
      const tx_hash = sha256HexUpper(txBytes);

      const r = txsResults[i] ?? {};
      const code = typeof r.code === "number" ? r.code : 0;
      const gas_used = r.gas_used ?? "0";

      const action = parseActionFromTxBytes(txBytes);

      return { tx_hash, code, gas_used, action };
    });

    return NextResponse.json({
      height: resultsJson?.result?.height ?? height,
      tx_count: txs.length,
      txs,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Unhandled server error in /api/rpc/block_results",
        rpcBase,
        message: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
