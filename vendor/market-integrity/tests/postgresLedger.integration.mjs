import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFile} from "node:fs/promises";
import {PostgresDecisionLedger} from "../postgres-ledger.mjs";
import {authorizeDecision,consumeAuthorization,reconcileAuthorization} from "../ledger.mjs";
import {fixture} from "./fixture.mjs";
const require=createRequire(process.env.MI_TEST_PG_PACKAGE+"/package.json"),{Pool}=require("pg");
const url=new URL(process.env.MI_TEST_DATABASE_URL);assert.equal(url.hostname,"127.0.0.1");assert.notEqual(url.port,"5432");assert.ok(url.pathname.startsWith("/seg0_"));assert.equal(process.env.SPHERIO_DISPOSABLE_TEST_DATABASE,"1");
const pool=new Pool({connectionString:url.toString(),max:12});
try {await pool.query(await readFile(new URL("../schema.sql",import.meta.url),"utf8"));const f=fixture(),now=Date.parse("2026-10-12T12:00:00Z");f.intent.operation="transfer";f.intent.quantityBaseUnits="100";
 const begin=performance.now();const results=await Promise.all(Array.from({length:12},(_,i)=>{const idempotencyKey="race-"+i;return authorizeDecision({ledger:new PostgresDecisionLedger(pool,{...f.intent,idempotencyKey}),policy:f.policy,intent:{...f.intent,product:["Pump","Prime","RioLight"][i%3]},idempotencyKey,now,loadCanonical:async()=>structuredClone(f.state)});}));
 assert.equal(results.filter(r=>r.executionAllowed).length,6);const rows=await pool.query("SELECT count(*)::int n FROM mi_decision_events");assert.equal(rows.rows[0].n,12);const first=results[0],ledger=new PostgresDecisionLedger(pool,{...f.intent,authorizationId:first.authorizationId});
 await consumeAuthorization(ledger,first.authorizationId,first.intentDigest,async()=>true);await assert.rejects(()=>consumeAuthorization(ledger,first.authorizationId,first.intentDigest,async()=>true));
 await assert.rejects(()=>pool.query("UPDATE mi_decision_events SET event_type='tampered'"),/append-only/);await assert.rejects(()=>pool.query("DELETE FROM mi_decision_events"),/append-only/);
 await reconcileAuthorization(ledger,first.authorizationId,{verified:true,chainId:f.intent.chainId,intentDigest:first.intentDigest,txHash:"A".repeat(64),height:"2",blockHash:"block2",reference:"fixture-tx-proof",code:0});
 const late=await authorizeDecision({ledger:new PostgresDecisionLedger(pool,{...f.intent,idempotencyKey:"lagged"}),policy:f.policy,intent:f.intent,idempotencyKey:"lagged",now,loadCanonical:async()=>structuredClone(f.state)});assert.equal(late.executionAllowed,false);
 const replay=await authorizeDecision({ledger:new PostgresDecisionLedger(pool,{...f.intent,idempotencyKey:"race-0"}),policy:f.policy,intent:{...f.intent,product:"Pump"},idempotencyKey:"race-0",now,loadCanonical:async()=>structuredClone(f.state)});assert.equal(replay.authorizationId,first.authorizationId);
 console.log(JSON.stringify({fixtureOnly:true,concurrentRequests:12,accepted:6,rejected:6,elapsedMs:performance.now()-begin,checks:["serializable-cross-product-reservation","replay","audit-immutability","confirmed-index-lag","idempotency"],productionChanges:false}));
}finally{await pool.end();}
