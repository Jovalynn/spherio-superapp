import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { createOwnerVerifier } from "../lib/riomind/owner-auth.ts";
const {publicKey,privateKey}=generateKeyPairSync("rsa",{modulusLength:2048});
const jwk={...publicKey.export({format:"jwk"}),kid:"fixture",alg:"RS256",use:"sig"};
const config={issuer:"https://fixture.cloudflareaccess.com",audience:"fixture-app"};
const now=1000000;
function token(claims={},header={}) { const h=Buffer.from(JSON.stringify({alg:"RS256",kid:"fixture",...header})).toString("base64url"); const p=Buffer.from(JSON.stringify({iss:config.issuer,aud:[config.audience],sub:"user-one",exp:1100,...claims})).toString("base64url");const content=`${h}.${p}`;return `${content}.${sign("RSA-SHA256",Buffer.from(content),privateKey).toString("base64url")}`; }
const headers=t=>new Headers({"cf-access-jwt-assertion":t,"x-riomind-owner":"victim","x-nexus-owner":"victim"});
test("signed identity owns data; client owner headers cannot override it",async()=>{let calls=0;const owner=createOwnerVerifier(config,async()=>{calls++;return new Response(JSON.stringify({keys:[jwk]}));},()=>now);assert.equal(await owner(headers(token())),"user-one");assert.equal(await owner(headers(token({sub:"user-two"}))),"user-two");assert.equal(calls,1);await assert.rejects(owner(new Headers({"x-riomind-owner":"victim"})));});
test("signature, algorithm, audience, issuer, expiry, time and key boundaries fail closed",async()=>{const owner=createOwnerVerifier(config,async()=>new Response(JSON.stringify({keys:[jwk]})),()=>now);for(const t of [token({aud:["other"]}),token({iss:"https://attacker.test"}),token({exp:1000}),token({nbf:1001}),token({sub:"../victim"}),token({}, {alg:"none"}),token({}, {kid:"unknown"}),token().slice(0,-8)+"AAAAAAAA"])await assert.rejects(owner(headers(t)));});
test("missing configuration and unavailable certificates have no development fallback",async()=>{assert.throws(()=>createOwnerVerifier({issuer:"",audience:""}));assert.throws(()=>createOwnerVerifier({issuer:"https://evil.test",audience:"x"}));await assert.rejects(createOwnerVerifier(config,async()=>new Response("",{status:503}),()=>now)(headers(token())));});
test("cache expiration refreshes rotated certificate and coalesces requests",async()=>{let clock=now,calls=0;const owner=createOwnerVerifier(config,async()=>{calls++;await new Promise(r=>setTimeout(r,5));return new Response(JSON.stringify({keys:[jwk]}));},()=>clock);await Promise.all([owner(headers(token())),owner(headers(token()))]);assert.equal(calls,1);clock+=300001;await Promise.all([owner(headers(token({exp:2000}))),owner(headers(token({exp:2000})))]);assert.equal(calls,2);});
