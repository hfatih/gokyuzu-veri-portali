// node dev/check-simbad.mjs — SIMBAD yedek aynası: ana sunucu düşünce aynaya geçiş ve onu hatırlama
import assert from 'node:assert/strict';
import { tap, TAPS } from '../js/search/simbad.js';
import { clearCache } from '../js/net/http.js';

const hits = [];
let down = new Set([TAPS[0]]);
globalThis.fetch = async (url) => {
  const base = TAPS.find((t) => url.startsWith(t));
  hits.push(base);
  if (down.has(base)) throw new TypeError('Failed to fetch');
  return { ok: true, status: 200, json: async () => ({ metadata: [{ name: 'main_id' }], data: [['* alf Ori']] }) };
};

// CDS düşük: ayna yanıt verir
assert.deepEqual(await tap('SELECT 1'), [{ main_id: '* alf Ori' }]);
assert.deepEqual(hits, [TAPS[0], TAPS[1]]);

// Sonraki sorgu doğrudan aynaya gider
hits.length = 0; clearCache();
await tap('SELECT 2');
assert.deepEqual(hits, [TAPS[1]]);

// Ayna da düşerse CDS yeniden denenir; ikisi de düşükse hata fırlar
hits.length = 0; clearCache(); down = new Set(TAPS);
await assert.rejects(tap('SELECT 3'), TypeError);
assert.deepEqual(hits, [TAPS[1], TAPS[0]]);

// İptal başka sunucu denemeden fırlar
hits.length = 0; clearCache(); down = new Set();
const ctrl = new AbortController(); ctrl.abort();
await assert.rejects(tap('SELECT 4', ctrl.signal), { name: 'AbortError' });
assert.equal(hits.length, 1);   // http.js isteği başlatır; ikinci sunucu denenmez

console.log('check-simbad: tamam');
