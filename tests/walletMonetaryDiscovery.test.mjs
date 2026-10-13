import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import ts from 'typescript';
function load(file){
 const full=path.resolve(file),m=new Module(full);m.filename=full;
 m.require=id=>{
  if(id==='next/server')return {NextResponse:{json:Response.json}};
  if(id==='@/lib/spherioConfig')return {SPHERIO:{chainId:'fixture-chain',chainName:'Fixture',rpc:'http://127.0.0.1:1',rest:'http://127.0.0.1:1',coinType:118}};
  if(id.startsWith('@/'))return load(id.slice(2)+'.ts');
  if(id.startsWith('.'))return load(path.relative(process.cwd(),path.resolve(path.dirname(full),id))+'.ts');
  throw Error('Unapproved fixture import: '+id);
 };
 m._compile(ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,full);return m.exports;
}
for(const scenario of ['missing','stale','invalid','manipulated']){
 test('wallet price remains unavailable for '+scenario+' valuation input',async()=>{
  const original=globalThis.fetch;let calls=0;
  globalThis.fetch=async()=>{calls++;return Response.json({ok:true,price:{rio:{rusd:0.1,usd:0.1,usdt:0.1,btc:99}},updated_at:scenario==='stale'?'2000-01-01T00:00:00Z':new Date().toISOString(),authority:scenario==='manipulated'?'caller':undefined});};
  try{
   for(const [file,key] of [['app/api/wallet/adapters/route.ts','nativeAsset'],['app/api/wallet/assets/rio/route.ts','asset']]){
    const response=await load(file).GET(new Request('https://fixture.invalid/api/wallet/assets/rio'));assert.equal(response.status,200);const body=await response.json(),asset=body[key];assert.equal(asset.denom,'urio');assert.equal(asset.decimals,6);
    for(const v of Object.values(asset.price))assert.equal(v,null);assert.equal(asset.priceSource,'unavailable');assert.equal(asset.updatedAt,null);assert.equal(asset.authoritativeMarketData,false);assert.equal(asset.priceAvailable,false);
    if(key==='nativeAsset'){assert.ok(body.adapters.some(a=>a.id==='keplr'));assert.ok(body.adapters.some(a=>a.id==='leap'));assert.ok(body.adapters.some(a=>a.id==='cosmostation'));assert.equal(body.axelarRegistry.executionEnabled,false);assert.equal(body.hyperlaneRegistry.executionEnabled,false);assert.equal(body.evmRepresentationRegistry.executionEnabled,false);}
   }
   assert.equal(calls,0,'Legacy pool valuation must not be used as canonical wallet conversion authority');
  }finally{globalThis.fetch=original;}
 });
}
test('all bridge registries remain non-executable and preserve planned routes',()=>{
 for(const [file,fn] of [['lib/bridge/axelar.ts','getSpherioAxelarRegistry'],['lib/bridge/hyperlane.ts','getSpherioHyperlaneRegistry'],['lib/bridge/evm-representation.ts','getSpherioEvmRepresentationRegistry'],['lib/ibc/registry.ts','getSpherioIbcRegistry']]){
  const value=load(file)[fn]();assert.equal(value.executionEnabled,false);assert.ok(value.routes.length>0);assert.ok(value.routes.every(r=>r.status==='planned'));
 }
});
