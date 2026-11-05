// Üç kaynağı (yerel Türkçe adlar, SIMBAD öneki, Wikidata) birleştirip bilinirliğe (nbref)
// göre sıralar. Hızlı kaynaklar önce gösterilir, Wikidata gelince liste yenilenir.

import { prefixSearch, lookupIds } from './simbad.js';
import { searchWikidata } from './wikidata.js';
import { matchAliases } from './aliases-tr.js';
import { searchSso } from '../sso/fetch.js';

const DEBOUNCE_MS = 200;
const MAX_ITEMS = 8;
const norm = (s) => s.replace(/\s+/g, ' ');

/** SIMBAD'da olmayan Güneş için sabit öneri. */
export const SUN_ITEM = { label: 'Güneş', mainId: 'Sun', otype: '*', sp: 'G2V', nbref: Infinity };

/**
 * onUpdate({ items, pending, failed }) her yeni sonuçta çağrılır.
 * failed: hata veren kaynak adları ('simbad' | 'wikidata').
 */
export function createSuggester(onUpdate, getLang) {
  let ctrl = null, timer = 0;

  async function run(q, signal) {
    const merged = new Map();
    const failed = new Set();
    const bhSimbad = new Set();   // kara delik sayfasına dönüşen SIMBAD kayıtları (Sgr A*) bir daha eklenmez
    const add = (items, preferLabel) => {
      for (const it of items) {
        if (bhSimbad.has(it.mainId)) continue;
        const old = merged.get(it.mainId);
        if (!old) merged.set(it.mainId, it);
        else if (preferLabel && it.label) old.label = it.label;
      }
    };
    const emit = (pending) => {
      if (signal.aborted) return;
      const items = [...merged.values()].sort((a, b) => b.nbref - a.nbref).slice(0, MAX_ITEMS);
      onUpdate({ items, pending, failed: [...failed] });
    };

    const aliases = matchAliases(q);
    if (aliases.some((a) => a.simbadId === 'Sun')) add([{ ...SUN_ITEM, label: aliases.find((a) => a.simbadId === 'Sun').label }]);
    // Güneş Sistemi gezegenleri ve küçük cisimler doğrudan eklenir; bilinirlikte Güneş'in hemen ardından gelir
    const seen = new Set(), direct = (a) => /^(planet|sso|moon):/.test(a.simbadId);
    add(aliases.filter((a) => direct(a) && !seen.has(a.simbadId) && seen.add(a.simbadId))
      .map((a) => ({ label: a.label, mainId: a.simbadId, otype: a.otype ?? 'Pl', sp: null, nbref: 1e6, rankOnly: true })));
    const aliasIds = aliases.filter((a) => a.simbadId !== 'Sun' && !direct(a));

    const fast = Promise.all([
      prefixSearch(q, signal),
      lookupIds(aliasIds.map((a) => a.simbadId), signal),
    ]).then(([prefix, looked]) => {
      add(prefix);
      add(looked.map((l) => ({ ...l, label: aliasIds.find((a) => norm(a.simbadId) === norm(l.matchedId))?.label ?? l.label })), true);
    }).catch((e) => { if (!signal.aborted) failed.add('simbad'); });
    // Asteroit ve kuyruklu yıldızlar (IMCCE); başarısızlık sessiz, diğer kaynaklar yeter
    const sso = searchSso(q, signal).then(add).catch(() => {});

    const slow = searchWikidata(q, getLang(), signal).then(async (wd) => {
      const looked = await lookupIds(wd.filter((w) => w.simbadId).map((w) => w.simbadId), signal);
      const byId = (l) => wd.find((w) => w.simbadId && norm(w.simbadId) === norm(l.matchedId));
      // Kara delikler kendi sayfasına gider ('bh:Q…'); SIMBAD kaydı varsa onun yerini alır
      for (const w of wd.filter((x) => x.bh)) {
        const l = looked.find((x) => byId(x) === w);
        if (l) { bhSimbad.add(l.mainId); merged.delete(l.mainId); }
        // ponytail: SIMBAD'sız kara delikte bilinirlik için dil bağlantısı sayısı ×50 (nbref ölçeğine kaba eşleme)
        add([{ label: w.label ?? w.qid, mainId: 'bh:' + w.qid, otype: 'BH', sp: null, nbref: l ? l.nbref : w.links * 50, rankOnly: !l }]);
      }
      add(looked.filter((l) => !bhSimbad.has(l.mainId)).map((l) => ({ ...l, label: byId(l)?.label ?? l.label })), true);
    }).catch(() => { if (!signal.aborted) failed.add('wikidata'); });

    await Promise.all([fast, sso]); emit(true);
    await slow; emit(false);
  }

  return {
    /** Yeni girdi; önceki istekleri iptal eder. */
    query(q) {
      clearTimeout(timer);
      ctrl?.abort();
      if (q.trim().length < 2) { onUpdate({ items: [], pending: false, failed: [] }); return; }
      ctrl = new AbortController();
      const signal = ctrl.signal;
      timer = setTimeout(() => run(q, signal), DEBOUNCE_MS);
    },
    cancel() { clearTimeout(timer); ctrl?.abort(); },
  };
}
