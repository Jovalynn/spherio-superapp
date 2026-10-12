import { StargateClient } from "@cosmjs/stargate";
import { decodeTxRaw } from "@cosmjs/proto-signing";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx.js";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx.js";
export function decimalBaseUnits(value){const s=String(value);if(!/^(0|[1-9][0-9]*)(\.[0-9]{1,6})?$/.test(s))throw Error("INVALID_SETTLEMENT_AMOUNT");const [whole,fraction=""]=s.split(".");return (BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,"0"))).toString();}
export async function verifyPumpRewardSettlement(txHash,expected,config,connect=StargateClient.connect){
 if(!/^[A-Fa-f0-9]{64}$/.test(txHash)||!config?.rpcUrl||!config.chainId||!config.treasury||!Number.isSafeInteger(config.maxAgeSeconds)||config.maxAgeSeconds<=0)throw Error("SETTLEMENT_AUTHORITY_NOT_CONFIGURED");
 const url=new URL(config.rpcUrl);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error("SETTLEMENT_RPC_INVALID");
 const stable=BigInt(decimalBaseUnits(expected.stableAmountRusd));if(!/^(0|[1-9][0-9]*)$/.test(expected.rioAmountUrio))throw Error("INVALID_SETTLEMENT_AMOUNT");const rio=BigInt(expected.rioAmountUrio);if(stable+rio===0n||!expected.recipient||stable>0n&&!config.rusdContract)throw Error("CANONICAL_SETTLEMENT_IDENTITY_REQUIRED");
 const client=await connect(config.rpcUrl);
 try {
  if(await client.getChainId()!==config.chainId)throw Error("SETTLEMENT_CHAIN_MISMATCH");
  const tx=await client.getTx(txHash);if(!tx||tx.code!==0||!Number.isSafeInteger(tx.height)||tx.height<=0||tx.hash.toUpperCase()!==txHash.toUpperCase())throw Error("CONFIRMED_TRANSACTION_REQUIRED");
  const block=await client.getBlock(tx.height),when=Date.parse(block.header.time),now=config.now??Date.now();if(!Number.isFinite(when)||when>now||now-when>config.maxAgeSeconds*1000)throw Error("SETTLEMENT_EVIDENCE_STALE");
  let observedRio=0n,observedStable=0n;const messages=decodeTxRaw(tx.tx).body.messages;
  for(const any of messages){if(any.typeUrl==="/cosmos.bank.v1beta1.MsgSend"){const m=MsgSend.decode(any.value);if(m.fromAddress!==config.treasury||m.toAddress!==expected.recipient)throw Error("SETTLEMENT_PARTICIPANT_MISMATCH");for(const coin of m.amount){if(coin.denom!=="urio")throw Error("SETTLEMENT_DENOM_MISMATCH");observedRio+=BigInt(coin.amount);}}
   else if(any.typeUrl==="/cosmwasm.wasm.v1.MsgExecuteContract"){const m=MsgExecuteContract.decode(any.value),msg=JSON.parse(new TextDecoder().decode(m.msg));if(m.sender!==config.treasury||m.contract!==config.rusdContract||m.funds.length||Object.keys(msg).length!==1||!msg.transfer||msg.transfer.recipient!==expected.recipient||! /^(0|[1-9][0-9]*)$/.test(msg.transfer.amount))throw Error("SETTLEMENT_CW20_TRANSFER_MISMATCH");observedStable+=BigInt(msg.transfer.amount);}
   else throw Error("UNSUPPORTED_SETTLEMENT_MESSAGE");}
  if(observedRio!==rio||observedStable!==stable)throw Error("SETTLEMENT_QUANTITY_MISMATCH");
  return {verified:true,txHash:tx.hash,height:tx.height,blockHash:block.id,chainId:config.chainId,reference:"rpc:tx:"+tx.hash};
 }finally {client.disconnect();}
}
