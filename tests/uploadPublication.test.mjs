import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp,readFile,writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { publishUploadedFile } from "../lib/riomind/upload-publication.mjs";
async function fixture(){const dir=await mkdtemp(path.join(os.tmpdir(),"seg0-upload-"));return {storagePath:path.join(dir,"file.xlsx"),id:"fixture",ownerKey:"subject",buffer:Buffer.from("new")};}
test("success publishes exact bytes; exclusive collision preserves existing recovery file",async()=>{const input=await fixture();await publishUploadedFile({...input,db:{query:async()=>({rows:[]})},persist:async()=>({ok:true})});assert.equal((await readFile(input.storagePath)).toString(),"new");await assert.rejects(publishUploadedFile({...input,db:{query:async()=>({rows:[]})},persist:async()=>({})}),/EEXIST/);assert.equal((await readFile(input.storagePath)).toString(),"new");});
test("confirmed absent database publication cleans only its newly created file",async()=>{const input=await fixture();await assert.rejects(publishUploadedFile({...input,db:{query:async(sql,values)=>{assert.deepEqual(values,[input.id,input.ownerKey]);return {rows:[]};}},persist:async()=>{throw Error("insert rejected");}}));await assert.rejects(readFile(input.storagePath),/ENOENT/);});
test("committed-but-disconnected and indeterminate outcomes preserve bytes for reconciliation",async()=>{for(const outcome of ["committed","unavailable"]){const input=await fixture();await assert.rejects(publishUploadedFile({...input,db:{query:async()=>{if(outcome==="unavailable")throw Error("db unavailable");return {rows:[{storage_path:input.storagePath}]};}},persist:async()=>{throw Error("connection lost");}}));assert.equal((await readFile(input.storagePath)).toString(),"new");}});
