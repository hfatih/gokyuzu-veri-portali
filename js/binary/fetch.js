// Görsel çift yıldız yörüngesi: Washington Altıncı Görsel Çift Yörünge Kataloğu (ORB6, VizieR B/orb6).
// Sütun adları ve birim kodları sürümler arasında değişebildiği için birkaç ad denenir; birim önce
// u_ sütunundan, yoksa TSV birim satırından okunur.

import { cone, pick } from '../net/vizier.js';
import { periodYears, axisArcsec, toYear } from './derive.js';

const COL = {
  P: ['P', 'Per', 'Period'], uP: ['u_P', 'u_Per', 'u_Period'],
  a: ['a', 'Axis', 'sma'], ua: ['u_a', 'u_Axis'],
  i: ['i', 'Incl'], node: ['Node', 'Omega', 'Om'], T: ['T', 'T0', 'Tp'], uT: ['u_T', 'u_T0'],
  e: ['e', 'Ecc'], omega: ['omega', 'w', 'Arg'], grade: ['Grade', 'Gr'],
  m1: ['mag1', 'm1', 'Vmag1', 'V1'], m2: ['mag2', 'm2', 'Vmag2', 'V2'],
  wds: ['WDS', '_WDS'], hd: ['HD'], hip: ['HIP'], ads: ['ADS'], disc: ['Disc', 'DD'],
};

/** Bir ORB6 satırını Campbell elemanlarına çevirir; eksik eleman varsa null. */
export function orbitFromRow(row, units = {}) {
  const get = (k) => pick(row, COL[k]);
  const [P, Pcol] = get('P'), [a, acol] = get('a'), [T, Tcol] = get('T');
  const el = {
    P: periodYears(P, get('uP')[0] ?? unitCode(units[Pcol], 'y')),
    a: axisArcsec(a, get('ua')[0] ?? unitCode(units[acol], 'a')),
    T: toYear(T, get('uT')[0] ?? unitCode(units[Tcol], 'y')),
    i: get('i')[0], node: get('node')[0], e: get('e')[0], omega: get('omega')[0],
  };
  if (!Object.values(el).every(Number.isFinite) || el.P <= 0 || el.a <= 0 || el.e < 0 || el.e >= 1) return null;
  const [m1] = get('m1'), [m2] = get('m2');
  return {
    el, grade: get('grade')[0], dmag: Number.isFinite(m1) && Number.isFinite(m2) ? Math.abs(m2 - m1) : null,
    wds: get('wds')[0], hd: get('hd')[0], hip: get('hip')[0], ads: get('ads')[0], disc: get('disc')[0],
  };
}

// Birim satırındaki metin → u_ kodu
function unitCode(u, fallback) {
  const s = (u ?? '').toLowerCase();
  if (/^(yr|a|y|year)/.test(s)) return 'y';
  if (/^d|jd/.test(s)) return 'd';
  if (/mas/.test(s)) return 'm';
  if (/arcsec|"/.test(s)) return 'a';
  return fallback;
}

/** Çift yıldız adayı mı: SIMBAD türü ya da WDS/ADS kimliği. */
export const isBinaryCandidate = (obj) => ['**', 'SB*'].includes(obj.basic.otype) || obj.ids.some((i) => /^(WDS J|ADS )/.test(i));

/** obj: fetchObject(). Dönüş: { el, grade, dmag, … } ya da yörünge yoksa null. */
export async function fetchOrbit(obj, signal) {
  const { ra, dec } = obj.basic;
  if (ra == null) return null;
  let tables = await cone('B/orb6/orb6orb', ra, dec, 30, signal);
  if (!tables.some((tb) => tb.rows.length)) tables = await cone('B/orb6', ra, dec, 30, signal);
  const ids = new Set(obj.ids.map((i) => i.replace(/\s+/g, ' ')));
  const cand = tables.flatMap((tb) => tb.rows.map((r) => orbitFromRow(r, tb.units))).filter(Boolean);
  if (!cand.length) return null;
  const known = cand.filter((c) => (c.hd && ids.has(`HD ${c.hd}`)) || (c.hip && ids.has(`HIP ${c.hip}`)) || (c.ads && ids.has(`ADS ${c.ads}`))
    || (c.wds && [...ids].some((i) => i.startsWith(`WDS J${String(c.wds).replace(/^J/, '')}`))));
  const pool = known.length ? known : cand.slice(0, 1);
  // Aynı çiftin birden çok yörüngesi varsa en iyi derece (1 kesin … 5 belirsiz)
  return pool.sort((x, y) => (x.grade ?? 9) - (y.grade ?? 9))[0];
}
