// SIMBAD TAP istemcisi (CDS, CORS açık). ADQL'de tablo takma adı kullanılmaz.
// Önek aramasında ORDER BY kullanılmaz: eşleşme azsa sunucu tüm tabloyu tarıyor (>100 sn).
// Sıralama istemcide nbref'e göre yapılır.

import { likeVariants, sqlStr, prettyId } from './variants.js';
import { get } from '../net/http.js';

const TAP = 'https://simbad.cds.unistra.fr/simbad/sim-tap/sync';
const TIMEOUT_MS = 6000;

/** ADQL çalıştırır, satırları nesne dizisi olarak döner. Hata ya da zaman aşımında fırlatır. */
export async function tap(adql, signal, timeoutMs = TIMEOUT_MS) {
  const url = `${TAP}?REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=${encodeURIComponent(adql)}`;
  const { metadata, data } = await get(url, { signal, timeoutMs, name: 'SIMBAD' });
  return data.map((row) => Object.fromEntries(metadata.map((m, i) => [m.name, row[i]])));
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
