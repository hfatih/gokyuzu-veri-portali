// node dev/check-vizier.mjs — VizieR yedek aynası: CDS düşünce Harvard'a geçiş ve onu hatırlama
import assert from 'node:assert/strict';
import { asu, ASUS, cone } from '../js/net/vizier.js';
import { clearCache } from '../js/net/http.js';

const TSV = '#c\nSeq\tPer\n \td\n----\t----\n766\t4.0145\n';
const hits = [];
let down = new Set([ASUS[0]]);
globalThis.fetch = async (url) => {
  const base = ASUS.find((a) => url.startsWith(a));
  hits.push(base);
  if (down.has(base)) return { ok: false, status: 404, text: async () => 'Not Found', json: async () => ({}) };
  return { ok: true, status: 200, text: async () => TSV, json: async () => ({}) };
};

// CDS 404: ayna yanıt verir, tablo ayrıştırılır
const [tb] = await cone('B/sb9/main', 201.3, -11.16, 15);
assert.deepEqual(tb.rows, [{ Seq: 766, Per: 4.0145 }]);
assert.deepEqual(hits, [ASUS[0], ASUS[1]]);

// Sonraki sorgu doğrudan aynaya gider
hits.length = 0; clearCache();
await asu({ '-source': 'B/sb9/orbits', Seq: '=766' });
assert.deepEqual(hits, [ASUS[1]]);

// İkisi de düşükse hata fırlar
hits.length = 0; clearCache(); down = new Set(ASUS);
await assert.rejects(asu({ '-source': 'x' }));
assert.equal(hits.length, 2);
console.log('vizier: yedek ayna geçti');
