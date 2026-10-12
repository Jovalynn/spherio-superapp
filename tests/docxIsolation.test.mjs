import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {extractDocxPreview,extractXlsxPreview} from '../lib/riomind/xlsx-preview.mjs';
const require=createRequire(import.meta.url),JSZip=require('jszip'),ExcelJS=require('exceljs');
async function docx(extra={},text='Hello bounded DOCX') {
 const zip=new JSZip();zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 zip.file('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>'+text+'</w:t></w:r></w:p></w:body></w:document>');for(const [name,value] of Object.entries(extra))zip.file(name,value);return zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
}
test('valid DOCX text remains supported in the bounded worker',async()=>assert.match(await extractDocxPreview(await docx()),/Hello bounded DOCX/));
test('malformed, traversal, entity and decompression bombs reject before publication',async()=>{
 for(const input of [Buffer.from('not a zip'),await docx({'../evil.xml':'x'}),await docx({'word/document.xml':'<!DOCTYPE x [<!ENTITY evil "x">]><x>&evil;</x>'}),await docx({'word/document.xml':'x'.repeat(9*1024*1024)})])await assert.rejects(()=>extractDocxPreview(input));
});
test('deadline terminates DOCX parser and subsequent valid work succeeds',async()=>{const input=await docx();await assert.rejects(()=>extractDocxPreview(input,{timeoutMs:1}),/timed out/);assert.match(await extractDocxPreview(input),/Hello/);});
test('DOCX and XLSX share the two-worker admission bound',async()=>{const input=await docx(),book=new ExcelJS.Workbook();book.addWorksheet('Sheet').getCell('A1').value='bounded XLSX';const xlsx=await book.xlsx.writeBuffer();const results=await Promise.allSettled([extractDocxPreview(input),extractXlsxPreview(xlsx),extractDocxPreview(input)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,2);assert.match(results[2].reason.message,/busy/);});
test('upload path uses isolated DOCX parsing and propagates unsafe-file errors',()=>{const source=readFileSync(new URL('../app/api/riomind/files/upload/route.ts',import.meta.url),'utf8');assert.match(source,/await extractDocxPreview\(buffer\)/);assert.doesNotMatch(source,/mammoth\.extractRawText/);assert.doesNotMatch(source,/DOCX extraction failed/);});
