// Seçilen cismin fiziksel verisini SIMBAD'dan çeker. ADQL'de alt sorgu desteklenmediği için
// önce oid alınır, kalan tablolar paralel sorulur. Hiçbir şey saklanmaz.

import { tap } from '../search/simbad.js';
import { sqlStr } from '../search/variants.js';

const median = (xs) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null;
};

// Bir ölçüm sütununun ortancası ve ortancaya en yakın ölçümün kaynağı (aykırı girdilere dayanıklı)
function summarize(rows, col) {
  const m = median(rows.map((r) => r[col]));
  if (m == null) return null;
  const near = rows.filter((r) => r[col] != null).sort((a, b) => Math.abs(a[col] - m) - Math.abs(b[col] - m))[0];
  return { value: m, n: rows.filter((r) => r[col] != null).length, bibcode: near.bibcode };
}

// Güneş SIMBAD'da yok: IAU 2015 nominal değerleri, 1 AU uzaklıktan görünüş
const SUN = {
  mainId: 'Sun',
  basic: { ra: null, dec: null, plx: null, sp: 'G2V', otype: '*', rv: null, nbref: null },
  raw: { teff: 5772, logg: 4.438, feh: 0, plx: 206264806.2, plxErr: 1, sp: 'G2V', mags: { V: -26.74 }, vsini: 2.0 },
  meas: { teff: { value: 5772, n: 1, bibcode: '2016AJ....152...41P' } },
  ids: [], planets: ['Merkür', 'Venüs', 'Dünya', 'Mars', 'Jüpiter', 'Satürn', 'Uranüs', 'Neptün'],
};

/**
 * Dönüş: { mainId, basic, raw, meas, ids, planets }.
 * raw deriveStar() girdisidir; meas her ölçümün ortancasını, sayısını ve kaynağını taşır.
 */
export async function fetchObject(mainId, signal) {
  if (mainId === 'Sun') return SUN;
  const [b] = await tap(`SELECT oid, main_id, ra, dec, plx_value, plx_err, sp_type, otype, rvz_radvel, nbref
    FROM basic WHERE main_id = '${sqlStr(mainId)}'`, signal);
  if (!b) throw new Error('not-found');
  const oid = Number(b.oid);

  // Biri zaman aşımına uğrarsa kart yine eldeki veriyle çizilir. Gökadalarda binlerce alt
  // cisim olduğu için h_link sorgusu gezegenlerle sınırlı (süzgeçsiz hali 6 sn'yi aşıyor).
  const settled = await Promise.allSettled([
    tap(`SELECT teff, log_g, fe_h, bibcode FROM mesFe_H WHERE oidref = ${oid}`, signal),
    tap(`SELECT vsini, bibcode FROM mesRot WHERE oidref = ${oid}`, signal),
    tap(`SELECT filter, flux FROM flux WHERE oidref = ${oid}`, signal),
    tap(`SELECT id FROM ident WHERE oidref = ${oid}`, signal),
    tap(`SELECT TOP 50 main_id, otype FROM h_link JOIN basic ON oid=child WHERE parent = ${oid} AND otype IN ('Pl', 'Pl?')`, signal),
  ]);
  if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
  const [fe, rot, flux, ids, kids] = settled.map((s) => (s.status === 'fulfilled' ? s.value : []));

  const meas = {
    teff: summarize(fe, 'teff'), logg: summarize(fe, 'log_g'), feh: summarize(fe, 'fe_h'),
    vsini: summarize(rot, 'vsini'),
  };
  const mags = Object.fromEntries(flux.map((f) => [f.filter, f.flux]));
  return {
    mainId: b.main_id,
    basic: { oid, ra: b.ra, dec: b.dec, plx: b.plx_value, sp: b.sp_type, otype: b.otype, rv: b.rvz_radvel, nbref: b.nbref },
    raw: {
      teff: meas.teff?.value, logg: meas.logg?.value, feh: meas.feh?.value,
      plx: b.plx_value, plxErr: b.plx_err, sp: b.sp_type, mags, vsini: meas.vsini?.value,
    },
    meas, mags,
    ids: ids.map((r) => r.id),
    planets: kids.map((k) => k.main_id),
  };
}

/** Yıldız mı? Kümeler, birliktelikler ve hatalı kayıtlar hariç '*' içeren türler. */
export const isStar = (otype) => !!otype && otype.includes('*') && !['Cl*', 'As*', 'St*', 'err'].includes(otype);
