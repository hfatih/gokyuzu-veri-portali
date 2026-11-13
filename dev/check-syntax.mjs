// node dev/check-syntax.mjs — js/ altındaki her dosya ayrıştırılabiliyor mu? Diğer kontroller DOM'a bağlı
// dosyaları (ör. ui/i18n.js) içe aktarmadığı için oradaki bir sözdizimi hatası siteyi açılmaz hale getirip
// yine de bütün testlerden geçebiliyordu (2026-11-13: metin içinde kaçışsız kesme işareti).
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../js/', import.meta.url));
const files = readdirSync(root, { recursive: true }).filter((f) => String(f).endsWith('.js'));
const bad = files.filter((f) => spawnSync(process.execPath, ['--check', root + f]).status !== 0);
if (bad.length) { console.error('Sözdizimi hatası:', bad.join(', ')); process.exit(1); }
console.log(`syntax: ${files.length} dosya ayrıştırıldı`);

// Sahne modülleri içe aktarılabiliyor mu? (Shader metni şablonla kurulur; tanımsız bir ad ancak yüklenince patlar.)
for (const f of files.filter((x) => String(x).replace(/\\/g, '/').startsWith('render/') && !/glview|view3d/.test(String(x)))) {
  await import(new URL('../js/' + String(f).replace(/\\/g, '/'), import.meta.url));
}
console.log('syntax: sahne modülleri yüklendi');
