import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
import { Worker } from "node:worker_threads";
let active = 0;
export class SpreadsheetValidationError extends Error {
  constructor(message = "Invalid or unsafe spreadsheet") { super(message); this.name = "SpreadsheetValidationError"; }
}
export function validateWorkbookArchive(input) {
  const { inflateRawSync } = require("node:zlib");
  const buffer = Buffer.from(input);
  const fail = () => { throw new Error("Invalid or unsafe spreadsheet"); };
  if (buffer.length > 20 * 1024 * 1024 || buffer.length < 22) fail();
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) if (buffer.readUInt32LE(i) === 0x06054b50 && i + 22 + buffer.readUInt16LE(i + 20) === buffer.length) { end = i; break; }
  if (end < 0 || buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6)) fail();
  const count = buffer.readUInt16LE(end + 10), directoryBytes = buffer.readUInt32LE(end + 12), start = buffer.readUInt32LE(end + 16);
  if (!count || count > 512 || count !== buffer.readUInt16LE(end + 8) || start + directoryBytes !== end) fail();
  let offset = start, total = 0; const names = new Set();
  for (let entry = 0; entry < count; entry++) {
    if (offset + 46 > end || buffer.readUInt32LE(offset) !== 0x02014b50) fail();
    const flags = buffer.readUInt16LE(offset + 8), method = buffer.readUInt16LE(offset + 10), compressed = buffer.readUInt32LE(offset + 20), size = buffer.readUInt32LE(offset + 24), nameBytes = buffer.readUInt16LE(offset + 28), extra = buffer.readUInt16LE(offset + 30), comment = buffer.readUInt16LE(offset + 32), local = buffer.readUInt32LE(offset + 42);
    if (flags & 1 || ![0,8].includes(method) || size > 8 * 1024 * 1024 || compressed > 20 * 1024 * 1024 || offset + 46 + nameBytes + extra + comment > end || local + 30 > start || buffer.readUInt32LE(local) !== 0x04034b50) fail();
    const name = buffer.subarray(offset + 46, offset + 46 + nameBytes).toString("utf8");
    if (!name || name.startsWith("/") || name.includes("\\") || name.split("/").includes("..") || names.has(name) || name.includes("\0")) fail();
    names.add(name);
    const dataStart = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    if (dataStart + compressed > start) fail();
    const data = buffer.subarray(dataStart, dataStart + compressed);
    const expanded = method === 0 ? data : inflateRawSync(data, { maxOutputLength: 8 * 1024 * 1024 });
    total += expanded.length;
    if (expanded.length !== size || total > 32 * 1024 * 1024 || (name.endsWith(".xml") && /<!DOCTYPE|<!ENTITY/i.test(expanded.toString("utf8")))) fail();
    offset += 46 + nameBytes + extra + comment;
  }
  if (offset !== end || !names.has("[Content_Types].xml") || !names.has("xl/workbook.xml")) fail();
}
export async function extractXlsxPreview(input, { timeoutMs = 5000 } = {}) {
  if (active >= 2) throw new SpreadsheetValidationError("Spreadsheet parser is busy; retry shortly");
  if (input.byteLength > 20 * 1024 * 1024) throw new SpreadsheetValidationError();
  active++;
  let worker;
  try {
    const script = `const { parentPort, workerData } = require("node:worker_threads");
      (async () => {
        const input = Buffer.from(workerData);
        (${validateWorkbookArchive.toString()})(input);
        const ExcelJS = require("exceljs"); const book = new ExcelJS.Workbook(); await book.xlsx.load(input);
        const parts = [];
        for (const sheet of book.worksheets.slice(0,8)) {
          const lines = []; sheet.eachRow({includeEmpty:false}, (row) => { if (lines.length < 40) { const cells=[]; for(let i=1;i<=12;i++)cells.push(String(row.getCell(i).text || "").replace(/\\s+/g," ").slice(0,256));lines.push(cells.join(" | ")); } });
          parts.push("Sheet: " + sheet.name.slice(0,120) + "\\n" + lines.join("\\n"));
        }
        parentPort.postMessage({ok:true,text:parts.join("\\n\\n").slice(0,20000)});
      })().catch(() => parentPort.postMessage({ok:false}));`;
    worker = new Worker(script, { eval: true, workerData: input, resourceLimits: { maxOldGenerationSizeMb: 128, maxYoungGenerationSizeMb: 32 } });
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new SpreadsheetValidationError("Spreadsheet parsing timed out")), Math.max(1, Math.min(5000,timeoutMs)));
      const finish = (fn,value) => { clearTimeout(timer); fn(value); };
      worker.once("message", msg => msg?.ok && typeof msg.text === "string" ? finish(resolve,msg.text) : finish(reject,new SpreadsheetValidationError()));
      worker.once("error", () => finish(reject,new SpreadsheetValidationError()));
      worker.once("exit", code => { if(code !== 0) finish(reject,new SpreadsheetValidationError()); });
    });
  } finally { if (worker) await worker.terminate(); active--; }
}
