import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import ts from 'typescript';

function loadRoute() {
  const file = path.resolve('app/api/riodex/pairs/route.ts');
  const route = new Module(file);
  route.filename = file;
  route.require = (name) => {
    if (name === 'next/server') return { NextResponse: { json: Response.json } };
    if (name === '@cosmjs/cosmwasm-stargate') return { CosmWasmClient: { connect: async () => ({ queryContractSmart: async () => ({ assets: [{ amount: '1999982157401' }, { amount: '200001784280' }], total_share: '632455532033' }) }) } };
    if (name === '@/lib/spherioChain') return { SPHERIO_CHAIN: { rpc: 'http://127.0.0.1:26657' } };
    throw new Error('Unapproved fixture import: ' + name);
  };
  route._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file);
  return route.exports;
}

test('on-chain pair reserves do not receive a fabricated request-time freshness mark', async () => {
  const response = await loadRoute().GET();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.items[0].pool.assets[0].amount, '1999982157401');
  assert.equal(body.items[0].pool.assets[1].amount, '200001784280');
  assert.equal(body.observation_height, null);
  assert.equal(body.updated_at, null);
  assert.equal(body.observation_status, 'UNAVAILABLE');
});
