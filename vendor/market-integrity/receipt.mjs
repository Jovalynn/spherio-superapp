import { MI_PROTOCOL } from "./index.mjs";
const encoder=new TextEncoder();
function normalized(value,depth=0){if(depth>32)throw Error("INTENT_TOO_DEEP");if(value===null||typeof value==="boolean")return value;if(typeof value==="string"){if(value.length>65536)throw Error("INTENT_STRING_TOO_LARGE");return value;}if(typeof value==="number"){if(!Number.isFinite(value)||Math.abs(value)>Number.MAX_SAFE_INTEGER)throw Error("INTENT_NUMBER_NOT_EXACT");return value;}if(Array.isArray(value)){if(value.length>1024)throw Error("INTENT_ARRAY_TOO_LARGE");return value.map(v=>normalized(v,depth+1));}if(typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype){const keys=Object.keys(value).sort();if(keys.length>256)throw Error("INTENT_OBJECT_TOO_LARGE");const output={};for(const key of keys){if(['__proto__','constructor','prototype'].includes(key))throw Error("INVALID_INTENT_KEY");if(value[key]!==undefined)output[key]=normalized(value[key],depth+1);}return output;}throw Error("INVALID_INTENT_TYPE");}
export function canonicalJSON(value){const json=JSON.stringify(normalized(value));if(json.length>262144)throw Error("INTENT_TOO_LARGE");return json;}
export async function intentDigest(intent){const hash=await crypto.subtle.digest("SHA-256",encoder.encode(canonicalJSON(intent)));return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join("");}
export function walletExecutionIntent(request,network){return {protocol:MI_PROTOCOL,requestId:request.id,action:request.action,origin:request.origin,networkId:request.networkId,accountId:request.accountId,address:request.address,payload:request.payload,expiresAt:request.expiresAt,network:{id:network.id,chainId:network.chainId,rpcUrl:network.rpcUrl}};}
function decode(value){if(typeof value!=="string"||value.length>4096||! /^[A-Za-z0-9_-]+$/.test(value))throw Error("INVALID_RECEIPT_ENCODING");const s=value.replace(/-/g,"+").replace(/_/g,"/");return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
function encode(value){return btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
export async function signDecisionReceipt(payload,key){return {payload,signature:encode(await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},key,encoder.encode(canonicalJSON(payload))))};}
export async function verifyDecisionReceipt(receipt,intent,authority,now=Date.now(),status="RESERVED") {
  if(!authority?.keys?.length||!Number.isSafeInteger(authority.maxTtlSeconds)||authority.maxTtlSeconds<=0)throw Error("MI_AUTHORITY_NOT_CONFIGURED");
  const p=receipt?.payload,key=authority.keys.find(k=>k.keyId===p?.keyId);if(!p||!key||p.protocol!==MI_PROTOCOL||p.status!==status||p.decision!=="PASS"||p.executionAllowed!==true||typeof p.authorizationId!=="string"||!p.authorizationId||!p.policyVersion||p.intentDigest!==await intentDigest(intent)||p.chainId!==intent.network.chainId||p.account!==intent.address)throw Error("MI_RECEIPT_INTENT_OR_AUTHORITY_MISMATCH");
  const issued=Date.parse(p.issuedAt),expires=Date.parse(p.expiresAt);if(!Number.isFinite(issued)||!Number.isFinite(expires)||issued>now||expires<=now||expires<=issued||expires-issued>authority.maxTtlSeconds*1000)throw Error("MI_RECEIPT_STALE");
  if(!/^([1-9][0-9]*)$/.test(p.observationHeight||"")||!p.observationBlockHash||!p.provenanceDigest)throw Error("MI_RECEIPT_PROVENANCE_MISSING");
  const publicKey=await crypto.subtle.importKey("spki",decode(key.spki),{name:"ECDSA",namedCurve:"P-256"},false,["verify"]);
  if(!await crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},publicKey,decode(receipt.signature),encoder.encode(canonicalJSON(p))))throw Error("MI_RECEIPT_SIGNATURE_INVALID");
  return p;
}
export async function consumeDecisionReceipt(receipt,intent,authority,fetcher=fetch) {
  await verifyDecisionReceipt(receipt,intent,authority);
  const url=new URL(authority.consumeUrl);if(url.protocol!=="https:"||url.username||url.password||url.hash)throw Error("MI_CONSUME_ORIGIN_INVALID");
  const response=await fetcher(url.toString(),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({receipt,intent}),signal:AbortSignal.timeout(5000),redirect:"error"});
  if(!response.ok)throw Error("MI_AUTHORIZATION_CONSUME_FAILED");
  const consumed=await response.json();const payload=await verifyDecisionReceipt(consumed,intent,authority,Date.now(),"CONSUMED");if(payload.authorizationId!==receipt.payload.authorizationId)throw Error("MI_CONSUMED_AUTHORIZATION_MISMATCH");return payload;
}
