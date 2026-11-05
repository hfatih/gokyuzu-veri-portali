// SIMBAD TAP istemcisi (CDS, CORS açık). ADQL'de tablo takma adı kullanılmaz.
// Önek aramasında ORDER BY kullanılmaz: eşleşme azsa sunucu tüm tabloyu tarıyor (>100 sn).
// Sıralama istemcide nbref'e göre yapılır.

import { likeVariants, sqlStr, prettyId } from './variants.js';
import { get } from '../net/http.js';

// Ana sunucu CDS; Harvard aynası aynı veritabanını aynı TAP arayüzüyle (CORS açık) sunar.
// CDS bazı ağlardan hiç yanıt vermiyor (2026-11-05: Türkiye'den zaman aşımı), o zaman aynaya geçilir.
export const TAPS = ['https://simbad.cds.unistra.fr/simbad/sim-tap/sync', 'https://simbad.cfa.harvard.edu/simbad/sim-tap/sync'];
const TIMEOUT_MS = 6000;
let active = 0;   // bu oturumda son yanıt veren sunucu; sonraki sorgular önce ona gider

/**
 * ADQL çalıştırır, satırları nesne dizisi olarak döner. Bir sunucu hata verir ya da zaman aşımına
 * düşerse sıradakini dener; hepsi başarısızsa son hatayı fırlatır. İptal (AbortError) hemen fırlatılır.
 */
export async function tap(adql, signal, timeoutMs = TIMEOUT_MS) {
  const query = `?REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=${encodeURIComponent(adql)}`;
  const start = active;
  for (let k = 0; k < TAPS.length; k++) {
    const i = (start + k) % TAPS.length;
    try {
      const { metadata, data } = await get(TAPS[i] + query, { signal, timeoutMs, name: 'SIMBAD' });
      active = i;
      return data.map((row) => Object.fromEntries(metadata.map((m, j) => [m.name, row[j]])));
    } catch (e) {
      if (e.name === 'AbortError' || k === TAPS.length - 1) throw e;
    }
  }
}

const SUGGEST_COLS = 'id, main_id, otype, sp_type, nbref';

// Satırları ana kimliğe göre tekilleştirir; görünen ad olarak eşleşen kimlik kullanılır.
function toSuggestions(rows) {
  const byMain = new Map();
  for (const r of rows) {
    if (byMain.has(r.main_id) || r.otype === 'err') continue;
    byMain.set(r.main_id, {
      label: prettyId(r.id),
      mainId: r.main_id, otype: r.otype, sp: r.sp_type, nbref: r.nbref ?? 0,
    });
  }
  return [...byMain.values()];
}

/** Girdiyle başlayan kimlikler. Dönüş: [{ label, mainId, otype, sp, nbref }] */
export async function prefixSearch(q, signal) {
  const { like, exact } = likeVariants(q);
  const conds = [
    ...like.map((p) => `id LIKE '${sqlStr(p)}%'`),
    ...exact.map((e) => `id = '${sqlStr(e)}'`),
  ];
  if (!conds.length) return [];
  // ponytail: TOP 200 alfabetik ilk satırlar; çok geniş önekte popüler bir cisim dışarıda kalabilir
  const rows = await tap(`SELECT TOP 200 ${SUGGEST_COLS} FROM ident JOIN basic ON oid=oidref WHERE ${conds.join(' OR ')}`, signal);
  return toSuggestions(rows);
}

/** Bilinen kimlikleri (Wikidata/yerel liste) SIMBAD satırlarına çevirir. SIMBAD '=' boşlukları normalleştirir. */
export async function lookupIds(ids, signal) {
  if (!ids.length) return [];
  const list = ids.map((i) => `'${sqlStr(i)}'`).join(',');
  const rows = await tap(`SELECT ${SUGGEST_COLS} FROM ident JOIN basic ON oid=oidref WHERE id IN (${list})`, signal);
  return rows.map((r) => ({ ...toSuggestions([r])[0], matchedId: r.id }));
}
