import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// Idempotent scoped mitigation for advisories without patched upstream releases.
function patch(path, anchor, replacement) {
  const source = readFileSync(path, "utf8");
  if (source.includes("SEGMENT0_BOUND")) return;
  if (!source.includes(anchor)) throw new Error(`Dependency source changed: ${path}`);
  writeFileSync(path,source.replace(anchor,replacement));
}
const braces = require.resolve("braces/lib/parse");
patch(braces, "    block = stack[stack.length - 1];", "    // SEGMENT0_BOUND: cap recursive AST depth before walking.\n    if (stack.length > 100) throw new SyntaxError('Brace nesting exceeds safe depth');\n    block = stack[stack.length - 1];");
const sprintf = require.resolve("sprintf-js");
patch(sprintf, "                match = parse_tree[i] // convenience purposes only", "                match = parse_tree[i] // convenience purposes only\n                // SEGMENT0_BOUND: avoid unbounded padding and JSON precision.\n                if (Number(match[6]) > 10000 || Number(match[7]) > 10000) throw new RangeError('Format width or precision exceeds safe limit');");
console.log("Applied bounded braces and sprintf-js mitigations");
