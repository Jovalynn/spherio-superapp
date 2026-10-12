import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// Idempotent scoped mitigation for advisories without patched upstream releases.
function patch(path, anchor, replacement, marker="SEGMENT0_BOUND") {
  const source = readFileSync(path, "utf8");
  if (source.includes(marker)) return;
  if (!source.includes(anchor)) throw new Error(`Dependency source changed: ${path}`);
  writeFileSync(path,source.replace(anchor,replacement));
}
const braces = require.resolve("braces/lib/parse");
patch(braces, "    block = stack[stack.length - 1];", "    // SEGMENT0_BOUND: cap recursive AST depth before walking.\n    if (stack.length > 100) throw new SyntaxError('Brace nesting exceeds safe depth');\n    block = stack[stack.length - 1];");
const sprintf = require.resolve("sprintf-js");
patch(sprintf, "                match = parse_tree[i] // convenience purposes only", "                match = parse_tree[i] // convenience purposes only\n                // SEGMENT0_BOUND: avoid unbounded padding and JSON precision.\n                if (Number(match[6]) > 10000 || Number(match[7]) > 10000) throw new RangeError('Format width or precision exceeds safe limit');");
console.log("Applied bounded braces and sprintf-js mitigations");

const expansion = require.resolve("braces/lib/expand");
patch(expansion,"  stash = [].concat(stash);","  stash = [].concat(stash);\n  // SEGMENT0_BOUND_CARDINALITY: cap Cartesian products before allocating.\n  const left=utils.flatten(queue),right=utils.flatten(stash);\n  const leftCount=Math.max(left.length,1),rightCount=Math.max(right.length,1);\n  const bytes=left.reduce((n,x)=>n+String(x).length,0)*rightCount+right.reduce((n,x)=>n+String(x).length,0)*leftCount;\n  if(leftCount*rightCount>10000||bytes>1048576)throw new RangeError('Brace expansion exceeds safe cardinality or byte limit');","SEGMENT0_BOUND_CARDINALITY");
patch(expansion,"  const rangeLimit = options.rangeLimit === undefined ? 1000 : options.rangeLimit;","  // SEGMENT0_BOUND_RANGE: caller options cannot remove the allocation budget.\n  const requested=options.rangeLimit;\n  const rangeLimit=requested===undefined?1000:Number.isSafeInteger(requested)&&requested>=0?Math.min(requested,10000):10000;","SEGMENT0_BOUND_RANGE");
