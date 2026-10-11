import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { extractXlsxPreview, validateWorkbookArchive } from "../lib/riomind/xlsx-preview.mjs";
async function workbook(){const b=new ExcelJS.Workbook();b.addWorksheet("Accounts").addRow(["Alice",42]);return Buffer.from(await b.xlsx.writeBuffer());}
test("valid XLSX preview is bounded and supported",async()=>{const input=await workbook();validateWorkbookArchive(input);const text=await extractXlsxPreview(input);assert.match(text,/Accounts/);assert.match(text,/Alice/);assert.match(text,/42/);assert.ok(text.length<=20000);});
test("malformed, traversal, entities and decompression bombs reject without synthetic success",async()=>{await assert.rejects(extractXlsxPreview(Buffer.from("bad")));for(const [name,data] of [["../bad","a"],["xl/extra.xml","<!DOCTYPE x [<!ENTITY x 'evil'>]>"],["xl/bomb.xml","x".repeat(9*1024*1024)]]){const z=await JSZip.loadAsync(await workbook());z.file(name,data);const bytes=await z.generateAsync({type:"nodebuffer",compression:"DEFLATE"});await assert.rejects(extractXlsxPreview(bytes));}});
test("wall-clock deadline terminates parser and permits subsequent work",async()=>{await assert.rejects(extractXlsxPreview(await workbook(),{timeoutMs:1}),/timed out/);assert.match(await extractXlsxPreview(await workbook()),/Alice/);});
test("concurrent parsers have a fixed admission bound",async()=>{const input=await workbook();const results=await Promise.allSettled([extractXlsxPreview(input),extractXlsxPreview(input),extractXlsxPreview(input)]);assert.equal(results.filter(r=>r.status==="fulfilled").length,2);assert.equal(results.filter(r=>r.status==="rejected").length,1);});
