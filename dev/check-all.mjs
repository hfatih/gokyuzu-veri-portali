// node dev/check-all.mjs — dev/check-*.mjs betiklerinin hepsini sırayla çalıştırır (npm test).
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(dir).filter((f) => /^check-.+\.mjs$/.test(f) && f !== 'check-all.mjs').sort();
let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [join(dir, f)], { encoding: 'utf8' });
  const out = (r.stdout + r.stderr).trim();
  if (r.status === 0) console.log(`✓ ${f}  ${out.split('\n').pop()}`);
  else { failed++; console.log(`✗ ${f}\n${out}`); }
}
console.log(failed ? `\n${failed}/${files.length} betik başarısız` : `\n${files.length} betiğin hepsi geçti`);
process.exit(failed ? 1 : 0);
