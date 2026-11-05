// Gezegen verisi: fiziksel nicelikler Wikidata'dan (ötegezegende SIMBAD kimliği P3083 ile,
// Güneş Sistemi'nde öğe kimliğiyle); ana yıldız SIMBAD hiyerarşisinden (h_link).

import { tap } from '../search/simbad.js';
import { fetchObject } from '../star/fetch.js';
import { deriveStar } from '../star/derive.js';
import { pickValue } from './units.js';
import { solarPlanet } from './solar.js';
import { sparql } from '../search/wikidata.js';

const lit = (s) => '"' + s.replace(/["\\]/g, '\\$&').replace(/\s+/g, ' ') + '"';

// Wikidata özelliği → units.js türü
const PROPS = { P2067: 'mass', P2120: 'radius', P2146: 'period', P2233: 'sma', P1096: 'unitless', P2076: 'temp', P4501: 'unitless', P2147: 'rot', P575: 'time' };
const FIELD = { P2067: 'mass', P2120: 'radius', P2146: 'period', P2233: 'sma', P1096: 'ecc', P2076: 'temp', P4501: 'albedo', P2147: 'rot' };

async function wikidataProps(valuesClause, signal) {
  const pairs = Object.keys(PROPS).map((p) => `("${p}" p:${p} psv:${p})`).join(' ');
  const q = `SELECT ?item ?prop ?amount ?unit ?rank ?time WHERE { ${valuesClause}
    VALUES (?prop ?pp ?ppsv) { ${pairs} }
    ?item ?pp ?st. ?st ?ppsv ?v; wikibase:rank ?rank.
    OPTIONAL { ?v wikibase:quantityAmount ?amount; wikibase:quantityUnit ?unit }
    OPTIONAL { ?v wikibase:timeValue ?time } }`;
  const rows = await sparql(q, signal, 10000);
  const short = (u) => u?.value.split(/[/#]/).pop();
  const byProp = {};
  for (const r of rows) {
    (byProp[r.prop.value] ??= []).push({ amount: r.amount?.value, unit: short(r.unit), rank: short(r.rank), time: r.time?.value });
  }
  const props = {};
  for (const [p, kind] of Object.entries(PROPS)) {
    const st = byProp[p] ?? [];
    if (kind === 'time') {
      const years = st.filter((s) => s.rank !== 'DeprecatedRank' && s.time).map((s) => parseInt(s.time.slice(0, 5), 10));
      props.discovered = years.length ? Math.min(...years) : null;
    } else props[FIELD[p]] = pickValue(st, kind);
  }
  // Albedo: geometrik ve Bond birlikte gelebiliyor; denge sıcaklığı Bond ister, Bond genelde küçüktür
  // ponytail: niteleyiciye (P518) bakılmıyor; gerekirse Bond albedo niteleyicisiyle seçilir
  const alb = (byProp.P4501 ?? []).filter((s) => s.rank !== 'DeprecatedRank').map((s) => Number(s.amount)).filter((x) => x > 0 && x < 1);
  props.albedo = alb.length ? Math.min(...alb) : null;
  const qid = short(rows[0]?.item);
  return { qid, props };
}

const hostSummary = (obj) => {
  const d = deriveStar(obj.raw);
  return { obj, d, teff: d.teff?.value, R: d.R?.value, L: d.L?.value };
};

/**
 * id: 'planet:Q…' (Güneş Sistemi) ya da SIMBAD main_id; obj: ötegezegen için fetchObject() çıktısı.
 * Dönüş: { qid, solar, props, host: { obj, d, teff, R, L } | null }
 */
export async function fetchPlanet(id, obj, signal) {
  const solar = solarPlanet(id);
  if (solar) {
    const [wd, sun] = await Promise.all([
      wikidataProps(`VALUES ?item { wd:${solar.id.slice(7)} }`, signal),
      fetchObject('Sun', signal),
    ]);
    return { qid: wd.qid, solar, props: wd.props, host: hostSummary(sun) };
  }
  // SIMBAD "HD 209458b", Wikidata "HD 209458 b" yazabiliyor: iki biçim de denenir
  const forms = [obj.mainId, ...obj.ids].map((s) => s.replace(/\s+/g, ' '))
    .flatMap((s) => [s, s.replace(/(\d)([a-z])$/, '$1 $2'), s.replace(/(\d) ([a-z])$/, '$1$2')]);
  const ids = [...new Set(forms)].slice(0, 30);
  const [wd, parent] = await Promise.all([
    wikidataProps(`VALUES ?s { ${ids.map(lit).join(' ')} } ?item wdt:P3083 ?s.`, signal).catch(() => ({ qid: null, props: {} })),
    tap(`SELECT TOP 1 main_id FROM h_link JOIN basic ON oid=parent WHERE child = ${Number(obj.basic.oid)}`, signal).catch(() => []),
  ]);
  const host = parent[0] ? await fetchObject(parent[0].main_id, signal).then(hostSummary).catch(() => null) : null;
  return { qid: wd.qid, solar: null, props: wd.props, host };
}
