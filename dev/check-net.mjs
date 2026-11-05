// node dev/check-net.mjs — oturum önbelleği: paylaşım, iptal sayacı, hataların saklanmaması
import assert from 'node:assert/strict';
import { shared, clearCache } from '../js/net/http.js';

let calls = 0;
const slow = (v, ms = 20) => (signal) => new Promise((res, rej) => {
  calls++;
  const t = setTimeout(() => res(v), ms);
  signal.addEventListener('abort', () => { clearTimeout(t); rej(new DOMException('aborted', 'AbortError')); });
});

// Aynı anahtar tek iş, sonra önbellekten
calls = 0;
const [a, b] = await Promise.all([shared('k1', slow(1)), shared('k1', slow(2))]);
assert.equal(a, 1); assert.equal(b, 1); assert.equal(calls, 1);
assert.equal(await shared('k1', slow(3)), 1); assert.equal(calls, 1);

// Bekleyenlerden biri vazgeçince iş sürer, öbürü sonucu alır
calls = 0;
const c1 = new AbortController(), c2 = new AbortController();
const p1 = shared('k2', slow(7, 40), c1.signal), p2 = shared('k2', slow(8), c2.signal);
c1.abort();
await assert.rejects(p1, { name: 'AbortError' });
assert.equal(await p2, 7);

// Herkes vazgeçince ağ işi iptal edilir ve kayıt silinir
calls = 0;
const c3 = new AbortController();
const p3 = shared('k3', slow(9, 40), c3.signal);
c3.abort();
await assert.rejects(p3, { name: 'AbortError' });
await new Promise((r) => setTimeout(r, 5));
assert.equal(await shared('k3', slow(10)), 10);
assert.equal(calls, 2);

// Hata önbelleğe alınmaz
calls = 0;
await assert.rejects(shared('k4', async () => { calls++; throw new Error('x'); }));
assert.equal(await shared('k4', async () => { calls++; return 4; }), 4);
assert.equal(calls, 2);

clearCache();
console.log('net: tüm kontroller geçti');
