// Tarayıcı depolaması onayı. Site HTTP çerezi kullanmaz; benzer teknoloji olarak tarayıcı depolaması
// (localStorage / sessionStorage) kullanılır ve KVKK Çerez Uygulamaları Rehberi'ne göre ele alınır:
// - zorunlu: yalnız bu seçimin kendisi (gvp.consent), onaya tabi değil
// - tercih: gözlem konumu (gvp.location) ve karşılaştırma listesi (gvp.compare). Onay varsa
//   localStorage'da kalır; yoksa sessionStorage'da tutulur ve sekme kapanınca silinir.
// İstatistik ve reklam depolaması yok. Seçim 12 ay geçerli; sonra yeniden sorulur.

const KEY = 'gvp.consent', VERSION = 1, MAX_AGE_MS = 365 * 86400000;
export const PREF_KEYS = ['gvp.location', 'gvp.compare'];
const listeners = new Set();

function safe(fn, fallback = null) { try { return fn(); } catch { return fallback; } }

/** Kayıtlı seçim { v, prefs, at } ya da yoksa / süresi geçtiyse null. */
export function getConsent() {
  const c = safe(() => JSON.parse(localStorage.getItem(KEY)));
  if (!c || c.v !== VERSION || !(Date.now() - Date.parse(c.at) < MAX_AGE_MS)) return null;
  return c;
}

export const prefsAllowed = () => getConsent()?.prefs === true;

/** Seçimi kaydeder; tercih verileri yeni seçime göre localStorage ↔ sessionStorage arasında taşınır. */
export function setConsent({ prefs }) {
  safe(() => localStorage.setItem(KEY, JSON.stringify({ v: VERSION, prefs: !!prefs, at: new Date().toISOString() })));
  for (const k of PREF_KEYS) {
    const from = prefs ? sessionStorage : localStorage, to = prefs ? localStorage : sessionStorage;
    safe(() => { const v = from.getItem(k); if (v != null) { to.setItem(k, v); from.removeItem(k); } });
  }
  listeners.forEach((f) => f(getConsent()));
}

export const onConsentChange = (f) => listeners.add(f);

/** Tercih verisi için depolama: onay varsa localStorage, yoksa sessionStorage. Hata sessiz. */
export const prefStore = {
  get(k) { return safe(() => (prefsAllowed() ? localStorage : sessionStorage).getItem(k)); },
  set(k, v) { safe(() => (prefsAllowed() ? localStorage : sessionStorage).setItem(k, v)); },
  remove(k) { safe(() => { localStorage.removeItem(k); sessionStorage.removeItem(k); }); },
};
