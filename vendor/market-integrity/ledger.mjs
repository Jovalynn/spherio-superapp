import { evaluateMarketIntegrity,deterministicWithAI,amount,unavailableDecision } from "./index.mjs";
import { intentDigest,canonicalJSON } from "./receipt.mjs";
/** Testable ledger interface; production adapters must use serializable DB/keeper
 * transactions with account/asset AND pool locks. The in-memory adapter is a fixture.
 */
export class MemoryDecisionLedger {
  constructor(){this.rows=new Map();this.audit=[];this.tail=Promise.resolve();this.fixtureOnly=true;}
  async atomic(work){const previous=this.tail;let unlock;this.tail=new Promise(r=>unlock=r);await previous;try{return await work(this);}finally{unlock();}}
  list(){return [...this.rows.values()].map(r=>structuredClone(r));}
  append(record){const row=structuredClone(record);this.audit.push(row);return row;}
}
export async function authorizeDecision({ledger,loadCanonical,policy,intent,idempotencyKey,now=Date.now(),aiSignals=[]}) {
  if(typeof idempotencyKey!=="string"||!idempotencyKey||idempotencyKey.length>128)throw Error("IDEMPOTENCY_KEY_REQUIRED");
  const ttl=policy?.reservationTtlSeconds;if(!Number.isSafeInteger(ttl)||ttl<=0||!Number.isSafeInteger(now)||now<0||now+ttl*1000>8640000000000000)throw Error("APPROVED_RESERVATION_LIFETIME_REQUIRED");
  const digest=await intentDigest(intent),key=canonicalJSON([intent.chainId,intent.account,intent.assetId,idempotencyKey]);
  return ledger.atomic(async tx=>{
    for(const row of tx.rows.values()) {
      if(row.status!=="RESERVED")continue;
      const expired=Number.isSafeInteger(row.expiresAt)&&row.expiresAt<=now;
      const changed=row.intent.chainId===intent.chainId&&row.intent.assetId===intent.assetId&&(row.policyVersion!==policy.version||row.policyApprovalReference!==policy.approvalReference);
      if(expired||changed){row.status=expired?"EXPIRED":"POLICY_INVALIDATED";row.executionAllowed=false;row.decision="BLOCK";row.reasonCodes=[expired?"RESERVATION_EXPIRED":"POLICY_CHANGED"];tx.append({...row,event:expired?"expire":"policy-invalidate"});}
    }
    const old=tx.rows.get(key);if(old){if(old.intentDigest!==digest)throw Error("IDEMPOTENCY_INTENT_MISMATCH");return structuredClone(old);}
    let state;try {state=structuredClone(await loadCanonical(intent,now));}catch {state=null;}
    let pending=tx.list().filter(r=>r.executionAllowed&&['RESERVED','CONSUMED','BROADCAST','AMBIGUOUS'].includes(r.status)&&(r.intent.account===intent.account||r.intent.recipient===intent.account||intent.recipient&&(r.intent.account===intent.recipient||r.intent.recipient===intent.recipient))&&r.intent.assetId===intent.assetId);
    if(state) {
    const settled=tx.list().filter(r=>r.status==='CONFIRMED'&&((r.intent.account===intent.account||r.intent.recipient===intent.account||intent.recipient&&(r.intent.account===intent.recipient||r.intent.recipient===intent.recipient))&&r.intent.assetId===intent.assetId||r.intent.poolId&&r.intent.poolId===intent.poolId));
    for(const row of settled){const height=state.evidence?.holdings?.height,proof=row.reconciliation;if(!height||!proof||BigInt(height)<BigInt(proof.height)||height===proof.height&&state.evidence.holdings.blockHash!==proof.blockHash)state=null;}
    }
    if(state) {
    const allPending=pending;
    const forAccount=(account,direction)=>allPending.filter(r=>r.intent.account===account&&r.intent.direction===direction||r.intent.recipient===account&&direction==='accumulation');
    pending=forAccount(intent.account,intent.direction).filter(r=>r.intent.account===intent.account);
    state.pendingIncomingBaseUnits=forAccount(intent.account,'accumulation').filter(r=>true).reduce((sum,r)=>sum+amount(r.intent.quantityBaseUnits),0n).toString();
    state.pendingOutgoingBaseUnits=forAccount(intent.account,'disposal').reduce((sum,r)=>sum+amount(r.intent.quantityBaseUnits),0n).toString();
    for(const window of state.velocity||[])window.pendingBaseUnits=forAccount(intent.account,window.direction).reduce((sum,r)=>sum+amount(r.intent.quantityBaseUnits),0n).toString();
    if(intent.recipient&&state.recipientState){const recipient=state.recipientState;recipient.pendingIncomingBaseUnits=forAccount(intent.recipient,'accumulation').reduce((s,r)=>s+amount(r.intent.quantityBaseUnits),0n).toString();recipient.pendingOutgoingBaseUnits=forAccount(intent.recipient,'disposal').reduce((s,r)=>s+amount(r.intent.quantityBaseUnits),0n).toString();for(const w of recipient.velocity||[])w.pendingBaseUnits=forAccount(intent.recipient,w.direction).reduce((s,r)=>s+amount(r.intent.quantityBaseUnits),0n).toString();}
    const poolPending=tx.list().filter(r=>r.executionAllowed&&['RESERVED','CONSUMED','BROADCAST','AMBIGUOUS'].includes(r.status)&&intent.operation==='swap'&&r.intent.poolId===intent.poolId);
    if(poolPending.some(r=>r.intent.assetId!==intent.assetId||r.intent.direction!==intent.direction))state.poolPendingConflict=true;
    state.pendingPoolInputBaseUnits=poolPending.reduce((sum,r)=>sum+amount(r.intent.poolInputBaseUnits),0n).toString();
    state.pendingPoolAssetBaseUnits=poolPending.reduce((sum,r)=>sum+amount(r.intent.quantityBaseUnits),0n).toString();
    }
    const decision=deterministicWithAI(evaluateMarketIntegrity(policy,state,intent,now),aiSignals);
    const row={...decision,authorizationId:crypto.randomUUID(),intentDigest:digest,idempotencyKey,intent:structuredClone(intent),status:decision.executionAllowed?"RESERVED":"REJECTED",createdAt:now,expiresAt:now+ttl*1000,policyApprovalReference:policy.approvalReference,provenanceDigest:await intentDigest(state?.evidence||{})};
    tx.rows.set(key,row);tx.append(row);return structuredClone(row);
  });
}
export async function consumeAuthorization(ledger,authorizationId,digest,revalidate,clock=Date.now) {
 return ledger.atomic(async tx=>{const row=[...tx.rows.values()].find(r=>r.authorizationId===authorizationId);if(!row||row.status!=="RESERVED"||!row.executionAllowed||row.intentDigest!==digest)throw Error("MI_AUTHORIZATION_NOT_AVAILABLE");const now=clock();if(!Number.isSafeInteger(now)||!Number.isSafeInteger(row.expiresAt)||row.expiresAt<=now)throw Error("MI_RESERVATION_EXPIRED_OR_UNVERIFIED");if(typeof revalidate!=="function"||await revalidate(structuredClone(row),tx)!==true)throw Error("CANONICAL_REVALIDATION_REQUIRED");row.status="CONSUMED";tx.append({...row,event:"consume"});return structuredClone(row);});
}
export async function reconcileAuthorization(ledger,id,proof) {
 return ledger.atomic(async tx=>{const row=[...tx.rows.values()].find(r=>r.authorizationId===id);if(!row||!['CONSUMED','BROADCAST','AMBIGUOUS'].includes(row.status))throw Error("MI_RECONCILIATION_STATE_INVALID");
  if(!proof?.verified||proof.chainId!==row.intent.chainId||proof.intentDigest!==row.intentDigest||!/^([A-Fa-f0-9]{64})$/.test(proof.txHash||"")||!/^([1-9][0-9]*)$/.test(proof.height||"")||!proof.blockHash||!proof.reference)throw Error("CANONICAL_TRANSACTION_PROOF_REQUIRED");
  if(proof.code===0)row.status="CONFIRMED";else if(Number.isInteger(proof.code)&&proof.code>0)row.status="CHAIN_REJECTED";else throw Error("UNVERIFIED_TRANSACTION_RESULT");
  row.reconciliation=structuredClone(proof);tx.append({...row,event:"reconcile"});return structuredClone(row);});
}
export class CanonicalEventReconciler {
 constructor(){this.events=new Map();this.unavailable=false;}
 accept(event){if(!event?.verified||!event.chainId||!/^([A-Fa-f0-9]{64})$/.test(event.txHash||"")||!Number.isSafeInteger(event.msgIndex)||!Number.isSafeInteger(event.eventIndex)||event.msgIndex<0||event.eventIndex<0||!event.blockHash||!/^([1-9][0-9]*)$/.test(event.height||""))throw Error("INVALID_CANONICAL_EVENT");const key=[event.chainId,event.txHash,event.msgIndex,event.eventIndex].join(':');const payload=canonicalJSON(event);if(this.events.has(key)){if(this.events.get(key)!==payload){this.unavailable=true;throw Error("CONFLICTING_EVENT_REORG_RECONCILIATION_REQUIRED");}return {duplicate:true,applied:false};}if(this.unavailable)throw Error("REORG_RECONCILIATION_REQUIRED");this.events.set(key,payload);return {duplicate:false,applied:true};}
}

export async function invalidateReservation(ledger,id,digest,reason="POLICY_CHANGED") {return ledger.atomic(async tx=>{const row=[...tx.rows.values()].find(r=>r.authorizationId===id);if(!row||row.status!=="RESERVED"||row.intentDigest!==digest)return false;row.status="POLICY_INVALIDATED";row.executionAllowed=false;row.decision="BLOCK";row.reasonCodes=[reason];tx.append({...row,event:"policy-invalidate"});return true;});}
