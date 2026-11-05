// Ortak HTTP katmanı: zaman aşımı, oturum içi bellek önbelleği ve aynı isteğin paylaşılması.
// Önbellek yalnız bu sekmenin belleğindedir (sayfa yenilenince boşalır); diske bir şey yazılmaz.
// Aynı adrese aynı anda gelen istekler tek ağ isteğini paylaşır; ağ isteği ancak onu bekleyen
// herkes vazgeçince (signal) iptal edilir. Hatalar önbelleğe alınmaz: "tekrar dene" yeniden sorar.

const MAX_ENTRIES = 400;
const cache = new Map();   // anahtar → { promise, done, users, ctrl }

const abortError = () => new DOMException('aborted', 'AbortError');

function raceAbort(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then((v) => { signal.removeEventListener('abort', onAbort); resolve(v); },
      (e) => { signal.removeEventListener('abort', onAbort); reject(e); });
  });
}

function evict() {
  if (cache.size <= MAX_ENTRIES) return;
  for (const [k, e] of cache) {
    if (e.done) cache.delete(k);
    if (cache.size <= MAX_ENTRIES * 0.8) break;
  }
}

/**
 * Önbellekli istek. run(signal) gerçek işi yapar ve bir Promise döner.
 * Başarılı sonuç sekme açık kaldıkça saklanır; en eski kayıtlar 400'ü aşınca silinir.
 */
export function shared(key, run, signal) {
  let e = cache.get(key);
  if (e?.done) { cache.delete(key); cache.set(key, e); return raceAbort(e.promise, signal); }   // LRU: sona taşı
  if (!e) {
    const ctrl = new AbortController();
    e = { done: false, users: 0, ctrl };
    e.promise = run(ctrl.signal).then((v) => { e.done = true; evict(); return v; },
      (err) => { cache.delete(key); throw err; });
    cache.set(key, e);
  }
  e.users++;
  // signal'siz bekleyen ağ isteğini hep ister; sayaç düşmez
  signal?.addEventListener('abort', () => { if (--e.users === 0 && !e.done) e.ctrl.abort(); }, { once: true });
  return raceAbort(e.promise, signal);
}

/**
 * GET isteği. opts: { signal, timeoutMs = 8000, headers, as: 'json' | 'text', name (hata öneki), notFound (404 → 'not-found') }.
 */
export function get(url, opts = {}) {
  const { signal, timeoutMs = 8000, headers, as = 'json', name = 'HTTP', notFound = false } = opts;
  return shared(`${as} ${url}`, async (own) => {
    const res = await fetch(url, { signal: AbortSignal.any([own, AbortSignal.timeout(timeoutMs)]), headers });
    if (!res.ok) throw new Error(notFound && res.status === 404 ? 'not-found' : `${name} ${res.status}`);
    return as === 'text' ? res.text() : res.json();
  }, signal);
}

/** Yalnız testler için: önbelleği boşaltır. */
export const clearCache = () => cache.clear();
