import { canonicalJSON } from "./receipt.mjs";
/** Durable serializable ledger. Uses one client throughout each transaction.
 * Required migrations and least-privilege grants are separate owner operations.
 */
export class PostgresDecisionLedger {
 constructor(pool,scope){this.pool=pool;this.scope=scope;this.fixtureOnly=false;}
 async atomic(work){
  for(let attempt=0;attempt<8;attempt++){
   const client=await this.pool.connect();
   try{
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    const s=this.scope;if(!s?.account||!s.assetId||!s.chainId)throw Error("MI_LEDGER_SCOPE_REQUIRED");
    const keys=[`account:${s.chainId}:${s.account}:${s.assetId}`,...(s.recipient?[`account:${s.chainId}:${s.recipient}:${s.assetId}`]:[]),...(s.poolId?[`pool:${s.chainId}:${s.poolId}`]:[])].sort();
    for(const key of keys)await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",[key]);
    const result=await client.query(`SELECT ledger_key,decision FROM mi_decisions WHERE chain_id=$1 AND
      (((asset_id=$3 AND (account_id=$2 OR account_id=$7 OR decision->'intent'->>'recipient'=$2 OR decision->'intent'->>'recipient'=$7)) OR ($4::text IS NOT NULL AND pool_id=$4)) AND status IN ('RESERVED','CONSUMED','BROADCAST','AMBIGUOUS')
       OR account_id=$2 AND asset_id=$3 AND idempotency_key=$5
       OR authorization_id=$6
       OR ledger_key IN (SELECT ledger_key FROM mi_decisions WHERE chain_id=$1 AND status='CONFIRMED' AND (account_id=$2 OR account_id=$7 OR decision->'intent'->>'recipient'=$2 OR decision->'intent'->>'recipient'=$7) AND asset_id=$3 ORDER BY (decision->'reconciliation'->>'height')::numeric DESC LIMIT 1)
       OR ledger_key IN (SELECT ledger_key FROM mi_decisions WHERE chain_id=$1 AND status='CONFIRMED' AND pool_id=$4 ORDER BY (decision->'reconciliation'->>'height')::numeric DESC LIMIT 1)) ORDER BY created_at LIMIT 5001 FOR UPDATE`,[s.chainId,s.account,s.assetId,s.poolId||null,s.idempotencyKey||null,s.authorizationId||null,s.recipient||null]);
    if(result.rows.length>5000)throw Error("MI_LEDGER_BACKPRESSURE");
    const initial=new Map(result.rows.map(r=>[r.ledger_key,canonicalJSON(r.decision)]));
    const tx={rows:new Map(result.rows.map(r=>[r.ledger_key,r.decision])),audit:[],list(){return [...this.rows.values()].map(r=>structuredClone(r));},append(row){this.audit.push(structuredClone(row));}};
    const output=await work(tx);
    for(const [key,row] of tx.rows){const body=canonicalJSON(row);if(initial.get(key)===body)continue;
     if(initial.has(key))await client.query("UPDATE mi_decisions SET decision=$2::jsonb,status=$3,updated_at=clock_timestamp() WHERE ledger_key=$1",[key,body,row.status]);
     else await client.query(`INSERT INTO mi_decisions(ledger_key,authorization_id,chain_id,account_id,asset_id,pool_id,idempotency_key,intent_digest,policy_version,status,decision)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)`,[key,row.authorizationId,row.intent.chainId,row.intent.account,row.intent.assetId,row.intent.poolId||null,row.idempotencyKey,row.intentDigest,row.policyVersion||"UNRESOLVED",row.status,body]);
    }
    for(const row of tx.audit)await client.query("INSERT INTO mi_decision_events(authorization_id,event_type,evidence) VALUES($1,$2,$3::jsonb)",[row.authorizationId,row.event||"decision",canonicalJSON(row)]);
    await client.query("COMMIT");return output;
   }catch(error){await client.query("ROLLBACK").catch(()=>{});if(error?.code==="40001"&&attempt<7){await new Promise(resolve=>setTimeout(resolve,Math.min(200,10*(attempt+1))));continue;};throw error;}finally{client.release();}
  }
  throw Error("MI_LEDGER_RETRY_EXHAUSTED");
 }
}
