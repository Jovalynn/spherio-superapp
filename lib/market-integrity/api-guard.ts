import { NextRequest } from "next/server";
import { unavailableDecision } from "@spherio/market-integrity";
import { verifyDecisionReceipt, consumeDecisionReceipt } from "@spherio/market-integrity/receipt";
import type { MIAuthority, MIReceipt, WalletIntent } from "@spherio/market-integrity/receipt";

const READ_ONLY_POST = new Set(["/api/pump/quote","/api/pump/participants","/api/pump/discover"]);
export function requiresMarketIntegrity(path:string,method:string) {
  return ["POST","PUT","PATCH","DELETE"].includes(method) && !READ_ONLY_POST.has(path) &&
    /\/(pump|prime|riodex|rioex|spo20|rusd|swap|liquidity|bridge|createtoken)(?:\/|$)/.test(path);
}
export function marketIntegrityUnavailable(reason="MI_AUTHORITY_NOT_CONFIGURED") {
  return {ok:false,available:false,...unavailableDecision(reason),executionPlan:null,
    error:"Canonical Market Integrity authorization is unavailable. Execution was not started."};
}
function authority():MIAuthority {
  let keys:MIAuthority["keys"]=[];
  try {const parsed:unknown=JSON.parse(process.env.MI_RECEIPT_PUBLIC_KEYS_JSON||"[]");if(Array.isArray(parsed)&&parsed.length<=16)keys=parsed.filter((k):k is MIAuthority["keys"][number]=>k&&typeof k.keyId==="string"&&typeof k.spki==="string");}catch{}
  return {keys,maxTtlSeconds:Number(process.env.MI_RECEIPT_MAX_TTL_SECONDS),consumeUrl:process.env.MI_CONSUME_URL||""};
}
export async function protectedPayload(request:Request,maxBytes=8388608,timeoutMs=5000) {
  const reader=request.clone().body?.getReader();if(!reader)return null;let timer:ReturnType<typeof setTimeout>|undefined;
  try {return await Promise.race([(async()=>{const chunks:Uint8Array[]=[];let bytes=0;
    while(true){const r=await reader.read();if(r.done)break;bytes+=r.value.length;if(bytes>maxBytes||chunks.length>=4096)throw Error("MI_REQUEST_TOO_LARGE");chunks.push(r.value);}
    const data=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
    const type=request.headers.get("content-type")||"application/json";
    if(type.toLowerCase().startsWith("multipart/form-data")){const form=await new Response(data,{headers:{"content-type":type}}).formData(),fields:unknown[]=[];for(const [name,value] of form){if(fields.length>=128)throw Error("MI_FORM_TOO_LARGE");if(typeof value==="string")fields.push({name,value});else {const digest=await crypto.subtle.digest("SHA-256",await value.arrayBuffer());fields.push({name,filename:value.name,type:value.type,size:value.size,sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("")});}}return {encoding:"multipart",fields};}
    if(!type.toLowerCase().startsWith("application/json"))throw Error("MI_CONTENT_TYPE_UNSUPPORTED");return JSON.parse(new TextDecoder().decode(data));
  })(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error("MI_BODY_TIMEOUT")),timeoutMs);})]);}finally{if(timer)clearTimeout(timer);void reader.cancel().catch(()=>{});}
}
export async function enforceAPIMarketIntegrity(request:Request,consume=true) {
  const a=authority();if(!a.keys.length||!Number.isSafeInteger(a.maxTtlSeconds)||a.maxTtlSeconds<=0)return marketIntegrityUnavailable();
  try {
    const raw=request.headers.get("x-mi-decision-receipt");if(!raw||raw.length>16384)throw Error("MI_SIGNED_RECEIPT_REQUIRED");
    const receipt=JSON.parse(raw) as MIReceipt;
    // Account comes from the verified issuer's signed payload, never an owner/class header.
    const intent:WalletIntent={protocol:"spherio-mi-v1",requestId:request.headers.get("idempotency-key")||"",address:receipt?.payload?.account,
      network:{chainId:process.env.MI_CANONICAL_CHAIN_ID||"spherio-1"},operation:request.method+" "+new URL(request.url).pathname+new URL(request.url).search,payload:await protectedPayload(request)};
    if(!intent.requestId)throw Error("IDEMPOTENCY_KEY_REQUIRED");
    await verifyDecisionReceipt(receipt,intent,a);
    if(consume)await consumeDecisionReceipt(receipt,intent,a);
    return null;
  } catch {return marketIntegrityUnavailable("MI_AUTHORIZATION_INVALID_OR_UNAVAILABLE");}
}
