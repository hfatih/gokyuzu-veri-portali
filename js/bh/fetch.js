// Kara delik verisi Wikidata'dan: SIMBAD kara deliği ayrı bir cisim olarak tutmuyor (Sgr A*
// "X-ışını kaynağı", M87* gökadaya, Cyg X-1 yoldaş yıldıza çözülüyor). Kimlik 'bh:Q…'.

import { pickValue } from '../planet/units.js';
import { lang } from '../ui/i18n.js';
import { sparql } from '../search/wikidata.js';

export const isBlackHoleId = (id) => typeof id === 'string' && id.startsWith('bh:');

const PROPS = { P2067: 'massSun', P2583: 'distLy', P6257: 'deg', P6258: 'deg' };
const FIELD = { P2067: 'massSun', P2583: 'distLy', P6257: 'ra', P6258: 'dec' };

/** Dönüş: { qid, label, simbadId, massSun, distLy, ra, dec }. Bulunamazsa 'not-found' fırlatır. */
export async function fetchBlackHole(id, signal) {
  const qid = id.slice(3);
  if (!/^Q\d+$/.test(qid)) throw new Error('not-found');
  const pairs = Object.keys(PROPS).map((p) => `("${p}" p:${p} psv:${p})`).join(' ');
  const q = `SELECT ?prop ?amount ?unit ?rank ?label ?s WHERE {
    VALUES ?item { wd:${qid} }
    OPTIONAL { ?item rdfs:label ?label FILTER(lang(?label) = "${lang}") }
    OPTIONAL { ?item wdt:P3083 ?s }
    OPTIONAL { VALUES (?prop ?pp ?ppsv) { ${pairs} }
      ?item ?pp ?st. ?st ?ppsv ?v; wikibase:rank ?rank. ?v wikibase:quantityAmount ?amount; wikibase:quantityUnit ?unit. } }`;
  const rows = await sparql(q, signal, 10000);
  if (!rows.length) throw new Error('not-found');
  const short = (u) => u?.value.split(/[/#]/).pop();
  const out = { qid, label: rows[0].label?.value ?? qid, simbadId: rows[0].s?.value ?? null };
  for (const [p, kind] of Object.entries(PROPS)) {
    const st = rows.filter((r) => r.prop?.value === p).map((r) => ({ amount: r.amount.value, unit: short(r.unit), rank: short(r.rank) }));
    out[FIELD[p]] = pickValue(st, kind);
  }
  return out;
}
