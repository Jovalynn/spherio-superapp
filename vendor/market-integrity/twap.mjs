import { amount } from "./index.mjs";
/** Step-function time-weighted canonical pool price. Explicit carry-in, coverage,
 * minimum observations, staleness and maximum-gap policy are mandatory.
 */
export function canonicalTWAP(policy,observations,now=Date.now()) {
 const unavailable=(reason)=>({available:false,authoritative:false,priceScaled:null,reason,method:"time_weighted_pool_spot_step_function"});
 try{
  if(!policy?.approved||!policy.version||!policy.poolId||!policy.baseAssetId||!policy.quoteAssetId||!policy.chainId||!Number.isSafeInteger(policy.windowSeconds)||policy.windowSeconds<=0||!Number.isSafeInteger(policy.maxGapSeconds)||policy.maxGapSeconds<=0||!Number.isSafeInteger(policy.maxAgeSeconds)||policy.maxAgeSeconds<=0||!Number.isSafeInteger(policy.minimumObservations)||policy.minimumObservations<2)throw Error("TWAP_POLICY_UNRESOLVED");
  if(!Array.isArray(observations)||observations.length<policy.minimumObservations||observations.length>10000)throw Error("TWAP_INSUFFICIENT_DATA");
  const start=now-policy.windowSeconds*1000,scale=10n**18n,seen=new Map(),rows=[];
  for(const row of observations){const time=Date.parse(row.timestamp);if(!row.verified||row.chainId!==policy.chainId||row.poolId!==policy.poolId||row.baseAssetId!==policy.baseAssetId||row.quoteAssetId!==policy.quoteAssetId||!row.reference||!row.blockHash||!/^([1-9][0-9]*)$/.test(row.height||"")||!Number.isFinite(time)||time>now)throw Error("TWAP_OBSERVATION_INVALID");
   const numerator=amount(row.priceNumerator),denominator=amount(row.priceDenominator);if(denominator===0n||numerator===0n)throw Error("TWAP_PRICE_INVALID");const price=numerator*scale/denominator;if(price===0n)throw Error("TWAP_PRICE_PRECISION_UNSUPPORTED");
   if(seen.has(time)){const old=seen.get(time);if(old.price!==price||old.blockHash!==row.blockHash)throw Error("TWAP_CONFLICTING_OBSERVATIONS");continue;}
   seen.set(time,{price,blockHash:row.blockHash});rows.push({time,price,reference:row.reference,height:row.height,blockHash:row.blockHash});
  }
  rows.sort((a,b)=>a.time-b.time);const carry=rows.filter(r=>r.time<=start).at(-1);if(!carry||start-carry.time>policy.maxGapSeconds*1000)throw Error("TWAP_CARRY_IN_UNAVAILABLE");
  const relevant=[carry,...rows.filter(r=>r.time>start)];if(relevant.length<policy.minimumObservations)throw Error("TWAP_INSUFFICIENT_WINDOW_OBSERVATIONS");
  if(now-relevant.at(-1).time>policy.maxAgeSeconds*1000)throw Error("TWAP_STALE");
  let weighted=0n,coverage=0;
  for(let i=0;i<relevant.length;i++){const begin=Math.max(start,relevant[i].time),end=i+1<relevant.length?relevant[i+1].time:now;if(end-relevant[i].time>policy.maxGapSeconds*1000)throw Error("TWAP_GAP_EXCEEDED");const duration=end-begin;if(duration<0)throw Error("TWAP_INVALID_ORDER");weighted+=relevant[i].price*BigInt(duration);coverage+=duration;}
  if(coverage!==policy.windowSeconds*1000)throw Error("TWAP_COVERAGE_INSUFFICIENT");
  return {available:true,authoritative:true,policyVersion:policy.version,method:"time_weighted_pool_spot_step_function",priceScaled:(weighted/BigInt(coverage)).toString(),scale:scale.toString(),windowStart:new Date(start).toISOString(),windowEnd:new Date(now).toISOString(),coverageMs:coverage,observations:relevant.length,provenance:relevant.map(r=>({reference:r.reference,height:r.height,blockHash:r.blockHash}))};
 }catch(error){return unavailable(error instanceof Error?error.message:"TWAP_UNAVAILABLE");}
}
