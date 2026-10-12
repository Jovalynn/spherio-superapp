import {CosmWasmClient} from "@cosmjs/cosmwasm-stargate";
import {decodeTxRaw} from "@cosmjs/proto-signing";
import {MsgExecuteContract} from "cosmjs-types/cosmwasm/wasm/v1/tx.js";
export async function verifyPumpCreation(input,config,connect=CosmWasmClient.connect){
 if(!config?.rpcUrl||!config.chainId||! /^[A-Fa-f0-9]{64}$/.test(config.spo20Checksum||"")||!Number.isSafeInteger(config.maxAgeSeconds)||config.maxAgeSeconds<=0)throw Error("CANONICAL_SPO20_CREATION_AUTHORITY_UNAVAILABLE");
 if(!/^[A-Fa-f0-9]{64}$/.test(input.txHash||"")||!input.tokenAddress||!input.creator)throw Error("FINALIZED_CREATION_PROOF_REQUIRED");
 const client=await connect(config.rpcUrl);try {
  if(await client.getChainId()!==config.chainId)throw Error("CREATION_CHAIN_MISMATCH");const tx=await client.getTx(input.txHash);
  if(!tx||tx.code!==0||tx.hash.toUpperCase()!==input.txHash.toUpperCase()||!Number.isSafeInteger(tx.height)||tx.height<=0)throw Error("FINALIZED_CREATION_PROOF_REQUIRED");
  const block=await client.getBlock(tx.height),now=config.now??Date.now(),when=Date.parse(block.header.time);if(!Number.isFinite(when)||when>now||now-when>config.maxAgeSeconds*1000)throw Error("CREATION_PROOF_STALE");
  const contract=await client.getContract(input.tokenAddress),code=await client.getCodeDetails(contract.codeId);if(code.checksum.toLowerCase()!==config.spo20Checksum.toLowerCase())throw Error("SPO20_ARTIFACT_IDENTITY_MISMATCH");
  const info=await client.queryContractSmart(input.tokenAddress,{token_info:{}});if(info.minter!==input.creator||info.decimals!==6||!/^[1-9][0-9]*$/.test(String(info.total_supply))||String(info.max_supply)!==String(info.total_supply)||config.product!=="Prime"&&String(info.total_supply)!=="1000000000000000"||info.minting_enabled!==false)throw Error("PUMP_FIXED_SUPPLY_OR_CREATOR_UNPROVEN");
  const messages=decodeTxRaw(tx.tx).body.messages;
  const creatorExecuted=messages.some(any=>any.typeUrl==="/cosmwasm.wasm.v1.MsgExecuteContract"&&MsgExecuteContract.decode(any.value).sender===input.creator&&MsgExecuteContract.decode(any.value).contract===contract.creator);
  const instantiated=tx.events.some(event=>['instantiate','wasm'].includes(event.type)&&event.attributes.some(a=>['_contract_address','contract_address'].includes(a.key)&&a.value===input.tokenAddress));
  if(!creatorExecuted||!instantiated)throw Error("TOKEN_CREATION_TRANSACTION_NOT_BOUND");
  return {verified:true,height:tx.height,creator:input.creator,factoryAddress:contract.creator,tokenInfo:info,txHash:tx.hash,reference:"rpc:creation:"+tx.hash,blockHash:block.id};
 }finally {client.disconnect();}
}
