// İlişkili cisimler: SIMBAD hiyerarşisi (h_link: yıldızın kümesi, bulutsunun merkez yıldızı, çift
// yıldızın bileşenleri) ve Wikidata'daki "parçası" bağları (kara delik ↔ barındıran gökada).
// Dönüş öğeleri arama önerisiyle aynı biçimde: { label, mainId, otype, nbref, rel: 'parent' | 'child' }.

import { tap } from './simbad.js';
import { prettyId } from './variants.js';
import { sparql } from './wikidata.js';

const lit = (s) => '"' + s.replace(/["\\]/g, '\\$&').replace(/\s+/g, ' ') + '"';
const SKIP = new Set(['err', 'Pl', 'Pl?']);   // gezegenler kartta ayrıca listeleniyor

/**
 * obj: fetchObject() çıktısı. withChildren: alt cisimler de sorulsun mu (gökada ve kümelerde binlerce
 * alt cisim olduğu için yalnız yıldız ve bulutsularda). En çok 6 öğe, bilinirliğe göre.
 */
export async function fetchRelated(obj, signal, withChildren = false) {
  const oid = Number(obj.basic.oid);
  if (!oid) return [];
  const [parents, kids] = await Promise.all([
    tap(`SELECT TOP 10 main_id, otype, nbref FROM h_link JOIN basic ON oid=parent WHERE child = ${oid}`, signal, 5000).catch(() => []),
    withChildren
      ? tap(`SELECT TOP 40 main_id, otype, nbref FROM h_link JOIN basic ON oid=child WHERE parent = ${oid}`, signal, 5000).catch(() => [])
      : [],
  ]);
  const seen = new Set([obj.mainId]);
  const out = [];
  for (const [rows, rel] of [[parents, 'parent'], [kids, 'child']]) {
    for (const r of rows.sort((a, b) => (b.nbref ?? 0) - (a.nbref ?? 0))) {
      if (seen.has(r.main_id) || SKIP.has(r.otype)) continue;
      seen.add(r.main_id);
      out.push({ label: prettyId(r.main_id), mainId: r.main_id, otype: r.otype, nbref: r.nbref ?? 0, rel });
    }
  }
  return out.slice(0, 6);
}

/** Gökadanın merkezindeki (P361 parçası / P397 ana gök cismi) kara delikler: bh:Q… öğeleri. */
export async function blackHolesIn(simbadId, lang, signal) {
  const ids = [...new Set([simbadId, simbadId.replace(/\s+/g, ' ')])].map(lit).join(' ');
  const rows = await sparql(`SELECT DISTINCT ?bh ?label WHERE { VALUES ?s { ${ids} } ?g wdt:P3083 ?s.
    ?bh wdt:P361|wdt:P397 ?g. ?bh wdt:P31/wdt:P279* wd:Q589.
    OPTIONAL { ?bh rdfs:label ?label FILTER(lang(?label) = "${lang}") } } LIMIT 3`, signal);
  return rows.map((r) => {
    const qid = r.bh.value.split('/').pop();
    return { label: r.label?.value ?? qid, mainId: 'bh:' + qid, otype: 'BH', rel: 'child' };
  });
}

/** Kara deliği barındıran, SIMBAD kimliği olan cisim (gökada). */
export async function hostOfBlackHole(qid, signal) {
  if (!/^Q\d+$/.test(qid ?? '')) return [];
  const rows = await sparql(`SELECT DISTINCT ?s WHERE { wd:${qid} wdt:P361|wdt:P397 ?g. ?g wdt:P3083 ?s } LIMIT 3`, signal);
  return rows.map((r) => ({ label: prettyId(r.s.value), mainId: r.s.value, otype: null, rel: 'parent' }));
}
