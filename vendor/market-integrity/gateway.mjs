import {authorizeDecision,consumeAuthorization} from "./ledger.mjs";
import {signDecisionReceipt,intentDigest,verifyDecisionReceipt} from "./receipt.mjs";
import {unavailableDecision} from "./index.mjs";
/** Trusted service adapter. Authentication, operation decoding, approved policy
 * and canonical state adapters are server-owned dependencies, never request data.
 * No issuer key or authority is supplied by this package or its templates.
 */
export class MarketIntegrityGateway {
 constructor({authenticate,decodeExecution,loadApprovedPolicy,loadCanonical,ledgerFor,signer,keyId,ttlSeconds,revalidate,verifyAuthority,clock=Date.now}){Object.assign(this,{authenticate,decodeExecution,loadApprovedPolicy,loadCanonical,ledgerFor,signer,keyId,ttlSeconds,revalidate,verifyAuthority,clock});}
 async authorize(request,executionIntent,idempotencyKey){
  try {const principal=await this.authenticate(request);const intent=await this.decodeExecution(executionIntent,principal);if(!principal?.verified||intent.account!==principal.account||intent.chainId!==principal.chainId)throw Error("AUTHENTICATED_EXECUTION_OWNER_REQUIRED");
   const policy=await this.loadApprovedPolicy(intent);if(!policy?.approved||!policy.approvalReference)throw Error("SIGNED_POLICY_APPROVAL_REQUIRED");
   const now=this.clock();if(!Number.isSafeInteger(this.ttlSeconds)||this.ttlSeconds<=0||!this.signer||!this.keyId)throw Error("MI_ISSUER_NOT_CONFIGURED");
   const ledger=this.ledgerFor({...intent,idempotencyKey});const row=await authorizeDecision({ledger,intent,policy,idempotencyKey,now,loadCanonical:this.loadCanonical});
   if(!row.executionAllowed)return {decision:row,receipt:null};if(this.clock()>=row.createdAt+this.ttlSeconds*1000)throw Error("MI_AUTHORIZATION_EXPIRED");if(row.status!=="RESERVED")throw Error("MI_AUTHORIZATION_ALREADY_CONSUMED");
   // The decoder binds every signing/API field into the canonical operation.
   const digest=await intentDigest(executionIntent);const p={protocol:row.protocol,keyId:this.keyId,status:row.status,decision:row.decision,executionAllowed:true,authorizationId:row.authorizationId,policyVersion:row.policyVersion,intentDigest:digest,account:intent.account,chainId:intent.chainId,issuedAt:new Date(now).toISOString(),expiresAt:new Date(row.createdAt+this.ttlSeconds*1000).toISOString(),observationHeight:row.provenance.supply.height,observationBlockHash:row.provenance.supply.blockHash,provenanceDigest:row.provenanceDigest};
   return {decision:row,receipt:await signDecisionReceipt(p,this.signer)};
  }catch {return {decision:unavailableDecision("MI_AUTHENTICATION_POLICY_OR_CANONICAL_STATE_UNAVAILABLE"),receipt:null};}
 }
 async consume(request,executionIntent,receipt){
  await verifyDecisionReceipt(receipt,executionIntent,this.verifyAuthority,this.clock());
  const principal=await this.authenticate(request),intent=await this.decodeExecution(executionIntent,principal);
  if(!principal?.verified||intent.account!==principal.account||intent.chainId!==principal.chainId||receipt?.payload?.intentDigest!==await intentDigest(executionIntent)||receipt.payload.account!==intent.account||receipt.payload.chainId!==intent.chainId||Date.parse(receipt.payload.expiresAt)<=this.clock())throw Error("MI_CONSUMPTION_AUTHORITY_MISMATCH");
  const policy=await this.loadApprovedPolicy(intent);if(!policy?.approved||!policy.approvalReference||policy.version!==receipt.payload.policyVersion)throw Error("MI_POLICY_CHANGED_OR_UNAPPROVED");
  const ledger=this.ledgerFor({...intent,authorizationId:receipt.payload.authorizationId});
  // Authenticity is established by an existing durable row and revalidation,
  // then the result is signed. Caller-controlled decision/status cannot authorize.
  const row=await consumeAuthorization(ledger,receipt.payload.authorizationId,await intentDigest(intent),async(row,tx)=>{if(Date.parse(receipt.payload.expiresAt)<=this.clock())return false;return this.revalidate(row,tx,executionIntent);});
  if(row.intentDigest!==await intentDigest(intent)||receipt.payload.policyVersion!==row.policyVersion)throw Error("MI_CONSUMPTION_INTENT_MISMATCH");
  return signDecisionReceipt({...receipt.payload,status:"CONSUMED",keyId:this.keyId},this.signer);
 }
}
