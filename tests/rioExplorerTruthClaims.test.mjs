import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../app/rioexplorer/page.tsx', import.meta.url), 'utf8');

test('RioExplorer does not present unverified monetary claims as established facts', () => {
  assert.doesNotMatch(page, /fixed total supply of\s*<span[^>]*>300,000,000<\/span>, fully minted/i);
  assert.doesNotMatch(page, /explorer-auditable reserve, treasury, mint, burn, and attestation evidence/i);
  assert.match(page, /Verified supply is unavailable in this overview/i);
  assert.match(page, /canonical contract identity and reserve attestations are unverified/i);
});
