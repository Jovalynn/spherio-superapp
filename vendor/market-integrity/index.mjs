/** Shared deterministic MI v1. Amounts are integer base units; ratios use basis points.
 * Only server/keeper adapters may supply state. API request fields are never state.
 * Missing policy or canonical evidence cannot authorize an operation.
 */
export const MI_PROTOCOL = "spherio-mi-v1";
export const BPS = 10000n;
const MAX = (1n << 256n) - 1n;
export function amount(value) {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]{0,77})$/.test(value)) throw Error("INVALID_BASE_UNIT_AMOUNT");
  const n=BigInt(value);if(n>MAX)throw Error("AMOUNT_OVERFLOW");return n;
}
function integer(value,label) {if(!Number.isSafeInteger(value)||value<=0)throw Error(label);return value;}
function timestamp(value){if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value))throw Error("INVALID_TIMESTAMP");const t=Date.parse(value);if(!Number.isFinite(t))throw Error("INVALID_TIMESTAMP");return t;}
function min(values){return values.reduce((a,b)=>a<b?a:b);}
export function cpmmQuote(input,reserveIn,reserveOut,feeBps,protocolFeeBps=0) {
 const dx=amount(input),x=amount(reserveIn),y=amount(reserveOut);
 const poolMax=(1n<<128n)-1n;if(dx>poolMax||x>poolMax||y>poolMax)throw Error("CANT_FIT_NATIVE_POOL_UINT128");
 if(x===0n||y===0n||!Number.isInteger(feeBps)||feeBps<0||feeBps>=10000||!Number.isInteger(protocolFeeBps)||protocolFeeBps<0||protocolFeeBps>feeBps)throw Error("INVALID_CPMM_STATE");
 // Exact deployed-source model: floor total and protocol fees separately,
 // retain only the LP fee, and calculate output from the integer net input.
 const totalFee=dx*BigInt(feeBps)/BPS,protocolFee=dx*BigInt(protocolFeeBps)/BPS,net=dx-totalFee;
 const output=y*net/(x+net),after=x+dx-protocolFee;if(after>poolMax)throw Error("POOL_RESERVE_OVERFLOW");
 return {output:output.toString(),reserveInAfter:after.toString(),reserveOutAfter:(y-output).toString(),totalFee:totalFee.toString(),protocolFee:protocolFee.toString()};
}
export function cpmmImpactWithin(input,pool,maxImpactBps,definition) {
  const dx=amount(input),x=amount(pool.reserveIn),y=amount(pool.reserveOut);
  if(!Number.isInteger(maxImpactBps)||maxImpactBps<0||maxImpactBps>=10000)throw Error("PRICE_IMPACT_POLICY_UNRESOLVED");
  if(dx===0n)return true;
  const quote=cpmmQuote(input,pool.reserveIn,pool.reserveOut,pool.feeBps,pool.protocolFeeBps),dy=amount(quote.output),limit=BigInt(maxImpactBps);
  if(definition==="post_trade_spot_movement")return amount(quote.reserveInAfter)*y*BPS<=x*(y-dy)*(BPS+limit);
  if(definition==="average_execution_shortfall_including_fee")return dy*x*BPS>=y*dx*(BPS-limit);
  throw Error("PRICE_IMPACT_DEFINITION_UNRESOLVED");
}
export function cpmmCapacity(pool,ceiling,maxImpactBps,definition) {
  const upper=amount(ceiling);cpmmQuote("0",pool.reserveIn,pool.reserveOut,pool.feeBps,pool.protocolFeeBps);
  if(definition==="average_execution_shortfall_including_fee"){
    if(!Number.isInteger(maxImpactBps)||maxImpactBps<0||maxImpactBps>=10000)throw Error("PRICE_IMPACT_POLICY_UNRESOLVED");
    const p=BigInt(maxImpactBps),n=BPS-BigInt(pool.feeBps),x=amount(pool.reserveIn),y=amount(pool.reserveOut);
    // A real-valued fee lower bound gives a provable upper bound on capacity.
    const possible=dx=>(dx*n+BPS)*x*BPS>=dx*(BPS-p)*(x*BPS+dx*n+BPS);
    let lo=0n,hi=upper;while(lo<hi){const mid=(lo+hi+1n)/2n;if(possible(mid))lo=mid;else hi=mid-1n;}
    // Integer output rounding is not monotonic in average execution quality.
    // Search largest-first and prune with monotonic output upper bounds.
    const ranges=[[0n,lo]];let nodes=0;
    while(ranges.length){if(++nodes>8192)throw Error("CPMM_EXACT_CAPACITY_RESOURCE_LIMIT");const [a,b]=ranges.pop();if(cpmmImpactWithin(b.toString(),pool,maxImpactBps,definition))return b.toString();if(a===b)continue;const dy=amount(cpmmQuote(b.toString(),pool.reserveIn,pool.reserveOut,pool.feeBps,pool.protocolFeeBps).output);if(dy*x*BPS<y*a*(BPS-p))continue;const mid=(a+b)/2n;ranges.push([a,mid],[mid+1n,b]);}
    return "0";
  }
  if(definition!=="post_trade_spot_movement")throw Error("PRICE_IMPACT_DEFINITION_UNRESOLVED");
  let lo=0n,hi=upper;
  while(lo<hi){const mid=(lo+hi+1n)/2n;if(cpmmImpactWithin(mid.toString(),pool,maxImpactBps,definition))lo=mid;else hi=mid-1n;}
  return lo.toString();
}
export function cpmmInputForOutput(output,pool) {
  const q=amount(output),x=amount(pool.reserveIn),y=amount(pool.reserveOut);
  cpmmQuote("0",pool.reserveIn,pool.reserveOut,pool.feeBps,pool.protocolFeeBps);
  if(q>=y)throw Error("OUTPUT_EXCEEDS_POOL_RESERVES");
  const net=(q*x+(y-q)-1n)/(y-q),factor=BPS-BigInt(pool.feeBps);
  let lo=net,hi=(net*BPS+factor-1n)/factor;
  while(lo<hi){const mid=(lo+hi)/2n;if(mid-mid*BigInt(pool.feeBps)/BPS>=net)hi=mid;else lo=mid+1n;}
  return lo.toString();
}
export function cpmmAssetCapacity(pool,assetId,ceiling,maxImpactBps,definition) {
  if(assetId===pool.assetInId)return cpmmCapacity(pool,ceiling,maxImpactBps,definition);
  if(assetId!==pool.assetOutId)throw Error("POOL_ASSET_UNITS_MISMATCH");
  const q=min([amount(ceiling),amount(pool.reserveOut)-1n]);if(q<0n)throw Error("INVALID_POOL_RESERVES");
  const input=cpmmInputForOutput(q.toString(),pool),cap=cpmmCapacity(pool,input,maxImpactBps,definition);
  return min([q,amount(cpmmQuote(cap,pool.reserveIn,pool.reserveOut,pool.feeBps,pool.protocolFeeBps).output)]).toString();
}
function verifyEvidence(item,policy,now,name) {
  if(!item||item.verified!==true||typeof item.source!=="string"||!policy.trustedSources?.includes(item.source)||!item.reference||!item.blockHash||!/^([1-9][0-9]*)$/.test(item.height||"")||item.chainId!==policy.chainId)throw Error("CANONICAL_"+name+"_UNAVAILABLE");
  const age=now-timestamp(item.observedAt),max=integer(policy.maxAgeSeconds?.[name],"FRESHNESS_POLICY_UNRESOLVED");
  if(age<0||age>max*1000)throw Error("CANONICAL_"+name+"_STALE");
}
export function unavailableDecision(reason="CANONICAL_MARKET_STATE_UNAVAILABLE",extra={}) {
  return {protocol:MI_PROTOCOL,decision:"BLOCK",executionAllowed:false,maxTxBaseUnits:null,reasonCodes:[reason],constraints:{},omittedTerms:[],...extra};
}
export function evaluateMarketIntegrity(policy,state,intent,now=Date.now()) {
  try {
    if(!policy?.approved||!policy.version||!policy.chainId||!policy.trustedSources?.length)throw Error("MI_POLICY_NOT_APPROVED");
    if(!state||!intent||!Number.isSafeInteger(now))throw Error("CANONICAL_MARKET_STATE_UNAVAILABLE");
    if(!policy.operations?.includes(intent.operation)||!['accumulation','disposal'].includes(intent.direction))throw Error("OPERATION_POLICY_UNRESOLVED");
    if(!intent.account||intent.chainId!==policy.chainId||intent.assetId!==policy.assetId||state.account!==intent.account||state.assetId!==policy.assetId||!state.identity?.verified||state.identity.chainId!==policy.chainId)throw Error("CANONICAL_IDENTITY_MISMATCH");
    const quantity=amount(intent.quantityBaseUnits);if(quantity===0n)throw Error("ZERO_QUANTITY");
    verifyEvidence(state.evidence?.supply,policy,now,"supply");verifyEvidence(state.evidence?.holdings,policy,now,"holdings");verifyEvidence(state.evidence?.classification,policy,now,"classification");
    if(state.evidence.supply.height!==state.evidence.holdings.height||state.evidence.supply.blockHash!==state.evidence.holdings.blockHash)throw Error("CANONICAL_STATE_HEIGHT_MISMATCH");
    const supply=amount(state.eligibleSupplyBaseUnits),holdings=amount(state.holdingsBaseUnits),pendingIn=amount(state.pendingIncomingBaseUnits),pendingOut=amount(state.pendingOutgoingBaseUnits);
    if(supply===0n||supply>amount(state.totalSupplyBaseUnits)||holdings>amount(state.totalSupplyBaseUnits))throw Error("INVALID_CANONICAL_SUPPLY");
    let classification="ORDINARY_WALLET",ceilingBps;
    if(policy.assetCode==="RIO") {
      if(state.identity.kind!=="native"||state.identity.denom!=="urio")throw Error("RIO_NATIVE_IDENTITY_MISMATCH");
      ceilingBps=10; // User mandate: 0.10% of eligible circulating RIO.
      const c=state.classification;
      if(c?.source==="rio_account_classifications"&&c.authorized===true&&c.policyVersion===policy.version&&c.approvalReference&&c.classification!=="ORDINARY_WALLET"){
        const configured=policy.classificationCeilingsBps?.[c.classification];if(![20,30,40].includes(configured))throw Error("CLASSIFICATION_POLICY_UNRESOLVED");classification=c.classification;ceilingBps=configured;
      }
    }else if(policy.assetCode==="RUSD") {
      if(state.identity.kind!=="cw20"||!state.identity.contract||policy.assetId!==`cw20:${policy.chainId}:${state.identity.contract}`||state.identity.decimals!==policy.decimals)throw Error("RUSD_IDENTITY_MISMATCH");
      if(policy.decimals!==6||amount(state.totalSupplyBaseUnits)>20000000n*1000000n)throw Error("RUSD_SUPPLY_CAP_EXCEEDED");
      verifyEvidence(state.evidence?.reserve,policy,now,"reserve");
      if(!state.reserve?.verified||!["custody_attestation","finalized_reserve_snapshot"].includes(state.reserve.sourceKind)||state.reserve.frozen||!state.reserve.supplySnapshotId||state.reserve.supplySnapshotId!==state.supplySnapshotId)throw Error("RUSD_RESERVE_UNAVAILABLE_OR_FROZEN");
      if(state.classification?.source==="rusd_account_classifications"&&state.classification.authorized===true&&state.classification.policyVersion===policy.version&&state.classification.approvalReference)classification=state.classification.classification;
      ceilingBps=policy.classificationCeilingsBps?.[classification];if(!Number.isInteger(ceilingBps)||ceilingBps<=0||ceilingBps>10000)throw Error("RUSD_CONCENTRATION_POLICY_UNRESOLVED");
      const target=amount(policy.reserveTargetBps),minimum=amount(policy.reserveMinimumBps),actual=amount(state.reserve.eligibleValueBaseUnits),total=amount(state.totalSupplyBaseUnits);
      if(target===0n||minimum===0n||minimum>target||actual*BPS<total*minimum)throw Error("RUSD_RESERVE_INSUFFICIENT");
    }else {
      ceilingBps=policy.classificationCeilingsBps?.ORDINARY_WALLET;if(!Number.isInteger(ceilingBps)||ceilingBps<=0)throw Error("ASSET_CONCENTRATION_POLICY_UNRESOLVED");
    }
    const policyCeiling=amount(policy.transactionCeilings?.[classification]?.[intent.operation]);
    const walletCap=supply*BigInt(ceilingBps)/BPS;
    const remaining=intent.direction==="accumulation"?(walletCap>holdings+pendingIn?walletCap-holdings-pendingIn:0n):(holdings>pendingOut?holdings-pendingOut:0n);
    // Disposal may reduce an existing large holding. It remains constrained by
    // policy, impact, liquidity and disposal velocity, without an acquisition ban.
    const constraints={policyTransaction:policyCeiling.toString(),walletConcentration:remaining.toString()},omittedTerms=[];
    if(intent.direction==="disposal")omittedTerms.push({term:"acquisition_concentration",reason:"disposal_reduces_holdings; spendable holdings still enforced"});
    const terms=policy.terms?.[intent.operation];if(!terms)throw Error("MAX_TX_TERMS_UNRESOLVED");
    if(terms.cpmm?.inapplicable){if(!terms.cpmm.reason)throw Error("MISSING_INAPPLICABILITY_REASON");omittedTerms.push({term:"cpmm",reason:terms.cpmm.reason});}
    else {
      verifyEvidence(state.evidence?.pool,policy,now,"pool");if(state.pool?.model!=="riodex_cpmm_v1"||!Number.isInteger(state.pool.protocolFeeBps)||state.pool.protocolFeeBps<0||state.pool.protocolFeeBps>state.pool.feeBps||state.pool.poolId!==intent.poolId)throw Error("POOL_MODEL_OR_IDENTITY_MISMATCH");
      if(intent.operation==="swap"){
        if(intent.direction==="accumulation"&&policy.assetId!==state.pool.assetOutId||intent.direction==="disposal"&&policy.assetId!==state.pool.assetInId)throw Error("SWAP_DIRECTION_ASSET_MISMATCH");
        const actualInput=amount(intent.poolInputBaseUnits),quoted=cpmmQuote(actualInput.toString(),state.pool.reserveIn,state.pool.reserveOut,state.pool.feeBps,state.pool.protocolFeeBps);
        const actualQuantity=policy.assetId===state.pool.assetInId?actualInput:amount(quoted.output);
        if(actualQuantity!==quantity)throw Error("SWAP_QUANTITY_DOES_NOT_MATCH_CANONICAL_EXECUTION");
      }
      if(state.poolPendingConflict)throw Error("OPPOSING_POOL_RESERVATIONS_REQUIRE_RECONCILIATION");
      const pendingInput=amount(state.pendingPoolInputBaseUnits||"0"),pendingAsset=amount(state.pendingPoolAssetBaseUnits||"0");
      // Use the same canonical reserve anchor for the sum of in-flight trades,
      // so each request cannot spend the full pool-impact budget independently.
      const inputCeiling=policy.assetId===state.pool.assetInId?policyCeiling:cpmmInputForOutput(min([policyCeiling,amount(state.pool.reserveOut)-1n]).toString(),state.pool);
      const totalCapacity=amount(cpmmCapacity(state.pool,inputCeiling.toString(),policy.maxPriceImpactBps,policy.priceImpactDefinition));
      const remainingInput=totalCapacity>pendingInput?totalCapacity-pendingInput:0n;
      constraints.cpmm=(policy.assetId===state.pool.assetInId?remainingInput:amount(cpmmQuote(remainingInput.toString(),state.pool.reserveIn,state.pool.reserveOut,state.pool.feeBps,state.pool.protocolFeeBps).output)).toString();
    }
    if(terms.effectiveLiquidity?.inapplicable){if(!terms.effectiveLiquidity.reason)throw Error("MISSING_INAPPLICABILITY_REASON");omittedTerms.push({term:"effectiveLiquidity",reason:terms.effectiveLiquidity.reason});}
    else {
      verifyEvidence(state.evidence?.liquidity,policy,now,"liquidity");const bps=integer(policy.effectiveLiquidityBps,"EFFECTIVE_LIQUIDITY_POLICY_UNRESOLVED");if(bps>10000)throw Error("INVALID_LIQUIDITY_RATIO");
      const usable=amount(state.usableLiquidityAssetBaseUnits);if(state.liquidityAssetId!==policy.assetId)throw Error("LIQUIDITY_ASSET_UNITS_MISMATCH");const reserve=policy.assetId===state.pool.assetInId?state.pool.reserveIn:policy.assetId===state.pool.assetOutId?state.pool.reserveOut:null;if(!reserve)throw Error("POOL_ASSET_UNITS_MISMATCH");if(usable>amount(reserve))throw Error("LIQUIDITY_EXCEEDS_VERIFIED_RESERVES");const capacity=usable*BigInt(bps)/BPS,pending=amount(state.pendingPoolAssetBaseUnits||"0");constraints.effectiveLiquidity=(capacity>pending?capacity-pending:0n).toString();
    }
    verifyEvidence(state.evidence?.velocity,policy,now,"velocity");
    if(!Array.isArray(policy.velocityWindows)||policy.velocityWindows.length===0||policy.velocityWindows.length>64||!Array.isArray(state.velocity)||state.velocity.length!==policy.velocityWindows.length)throw Error("VELOCITY_POLICY_OR_COVERAGE_UNRESOLVED");
    const velocity=[];
    for(const window of policy.velocityWindows){const seconds=integer(window.seconds,"INVALID_VELOCITY_WINDOW"),record=state.velocity.find(v=>v.seconds===seconds);if(!record||!Number.isSafeInteger(record.completeSince)||record.completeSince>now-seconds*1000||record.asOf!==now||record.direction!==intent.direction)throw Error("VELOCITY_COVERAGE_INCOMPLETE");const cap=amount(window[intent.direction+'BaseUnits']),used=amount(record.executedBaseUnits)+amount(record.pendingBaseUnits);velocity.push(cap>used?cap-used:0n);}
    constraints.velocity=min(velocity).toString();
    let recipientDecision=null;
    if(intent.operation==='transfer'&&intent.direction==='disposal'){
      if(!intent.recipient||!state.recipientState||state.recipientState.account!==intent.recipient)throw Error("CANONICAL_TRANSFER_RECIPIENT_STATE_REQUIRED");
      recipientDecision=evaluateMarketIntegrity(policy,state.recipientState,{...intent,account:intent.recipient,direction:'accumulation',recipient:undefined},now);
      if(recipientDecision.maxTxBaseUnits===null)throw Error("RECIPIENT_CANONICAL_STATE_OR_POLICY_UNAVAILABLE");
      constraints.recipientCapacity=recipientDecision.maxTxBaseUnits;
    }
    const max=min(Object.values(constraints).map(amount));
    if(terms.cpmm?.inapplicable!==true&&quantity<=max&&!cpmmImpactWithin(intent.operation==="swap"?intent.poolInputBaseUnits:policy.assetId===state.pool.assetInId?quantity.toString():cpmmInputForOutput(quantity.toString(),state.pool),state.pool,policy.maxPriceImpactBps,policy.priceImpactDefinition))return unavailableDecision("ROUNDED_EXECUTION_PRICE_IMPACT_EXCEEDED",{policyVersion:policy.version,constraints,maxTxBaseUnits:max.toString(),classification,omittedTerms});
    if(state.restricted||state.frozen)throw Error("ACCOUNT_OR_ASSET_RESTRICTED");
    if(policy.requiredBehaviorEvidence?.length)for(const name of policy.requiredBehaviorEvidence){verifyEvidence(state.evidence?.[name],policy,now,name);if(state.behavior?.[name]?.cleared!==true)throw Error("BEHAVIOR_CLEARANCE_UNAVAILABLE");}
    if(quantity>max)return {protocol:MI_PROTOCOL,decision:policy.allowAdjustment===true&&max>0n?"WARN-ADJUST":"BLOCK",executionAllowed:false,policyVersion:policy.version,classification,maxTxBaseUnits:max.toString(),constraints,omittedTerms,reasonCodes:["QUANTITY_EXCEEDS_MAX_TX"]};
    return {protocol:MI_PROTOCOL,decision:"PASS",executionAllowed:true,policyVersion:policy.version,classification,maxTxBaseUnits:max.toString(),constraints,omittedTerms,recipientDecision,reasonCodes:[],provenance:state.evidence};
  } catch(error){return unavailableDecision(error instanceof Error?error.message:"INVALID_MI_INPUT",{policyVersion:policy?.version??null});}
}
export function deterministicWithAI(decision,signals) {
  const advisory=Array.isArray(signals)?signals.slice(0,32).filter(s=>s&&typeof s.signal==="string"&&s.signal.length<=128&&typeof s.explanation==="string"&&s.explanation.length<=2048&&Array.isArray(s.evidenceReferences)&&s.evidenceReferences.length<=32&&s.evidenceReferences.every(ref=>typeof ref==="string"&&ref.length<=256)&&Number.isFinite(s.confidence)&&s.confidence>=0&&s.confidence<=1).map(s=>({signal:s.signal,explanation:s.explanation,evidenceReferences:s.evidenceReferences,confidence:s.confidence,modelVersion:typeof s.modelVersion==="string"&&s.modelVersion.length<=128?s.modelVersion:null})):[];
  return {...decision,aiAdvisory:{authority:false,signals:advisory,available:advisory.length>0}};
}
export async function analyzeAdvisory(decision,analyzer,timeoutMs=2000) {
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<=0||timeoutMs>10000)return deterministicWithAI(decision,[]);
  let timer;const controller=new AbortController();
  try {const signals=await Promise.race([Promise.resolve().then(()=>analyzer({decision,signal:controller.signal})),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error("AI_TIMEOUT"));},timeoutMs);})]);return deterministicWithAI(decision,signals);}
  catch{return deterministicWithAI(decision,[]);}finally{clearTimeout(timer);}
}
