// Üç kaynağı (yerel Türkçe adlar, SIMBAD öneki, Wikidata) birleştirip bilinirliğe (nbref)
// göre sıralar. Hızlı kaynaklar önce gösterilir, Wikidata gelince liste yenilenir.

import { prefixSearch, lookupIds } from './simbad.js';
import { searchWikidata } from './wikidata.js';
import { matchAliases } from './aliases-tr.js';

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
    const add = (items, preferLabel) => {
      for (const it of items) {
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
    // Güneş Sistemi gezegenleri doğrudan eklenir; bilinirlikte Güneş'in hemen ardından gelir
    const seen = new Set();
    add(aliases.filter((a) => a.simbadId.startsWith('planet:') && !seen.has(a.simbadId) && seen.add(a.simbadId))
      .map((a) => ({ label: a.label, mainId: a.simbadId, otype: 'Pl', sp: null, nbref: 1e6 })));
    const aliasIds = aliases.filter((a) => a.simbadId !== 'Sun' && !a.simbadId.startsWith('planet:'));

    const fast = Promise.all([
      prefixSearch(q, signal),
      lookupIds(aliasIds.map((a) => a.simbadId), signal),
    ]).then(([prefix, looked]) => {
      add(prefix);
      add(looked.map((l) => ({ ...l, label: aliasIds.find((a) => norm(a.simbadId) === norm(l.matchedId))?.label ?? l.label })), true);
    }).catch((e) => { if (!signal.aborted) failed.add('simbad'); });

    const slow = searchWikidata(q, getLang(), signal).then(async (wd) => {
      const looked = await lookupIds(wd.map((w) => w.simbadId), signal);
      add(looked.map((l) => ({ ...l, label: wd.find((w) => norm(w.simbadId) === norm(l.matchedId))?.label ?? l.label })), true);
    }).catch(() => { if (!signal.aborted) failed.add('wikidata'); });

    await fast; emit(true);
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
