import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
test("deep brace patterns reject before recursive compiler exhaustion",()=>{const braces=require("braces");assert.deepEqual(braces.expand("a{b,c}"),["ab","ac"]);assert.throws(()=>braces("{".repeat(3000)+"x"+"}".repeat(3000)),/safe depth/);});
test("format width and JSON precision have finite limits",()=>{const {sprintf}=require("sprintf-js");assert.equal(sprintf("%04d",3),"0003");assert.throws(()=>sprintf("%1000000000s","x"),/safe limit/);assert.throws(()=>sprintf("%.1000000000j",{}),/safe limit/);});
test("CosmJS generated protobuf codec and transaction hashes remain compatible",async()=>{const {TxBody}=await import("cosmjs-types/cosmos/tx/v1beta1/tx.js");const {sha256}=await import("@cosmjs/crypto");const body=TxBody.fromPartial({memo:"fixture",messages:[{typeUrl:"/fixture.Msg",value:new Uint8Array([1,2,3])}]});const bytes=TxBody.encode(body).finish();assert.deepEqual(TxBody.decode(bytes),body);assert.equal(sha256(bytes).length,32);const p=require("protobufjs");assert.ok(Number(p.build ? require("protobufjs/package.json").version.split(".")[0] : 0)>=7);});
