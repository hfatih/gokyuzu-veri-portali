// Değişen yıldız verisi: AAVSO Uluslararası Değişen Yıldız İndeksi (VSX, VizieR B/vsx). SIMBAD
// konumunun 15″ çevresi; adı SIMBAD kimlikleriyle eşleşen kayıt, yoksa en yakını.

import { cone, pick } from '../net/vizier.js';

const COL = {
  name: ['Name'], type: ['Type', 'VarType'], max: ['max', 'Max', 'magMax'], min: ['min', 'Min', 'magMin'],
  fmin: ['f_min'], band: ['n_max', 'Band', 'n_min'], P: ['Period', 'Per', 'P'], epoch: ['Epoch', 'Ep'],
};

const VAR_OTYPES = new Set(['V*', 'Pu*', 'cC*', 'Ce*', 'dS*', 'RR*', 'Mi*', 'LP*', 'sr*', 'Ro*', 'BY*', 'RS*', 'Er*', 'EB*',
  'Al*', 'bL*', 'WU*', 'El*', 'Ir*', 'Fl*', 'gD*', 'SX*', 'WV*', 'RV*', 'a2*', 'Or*', 'Be*']);

/** Değişen yıldız adayı mı: SIMBAD türü ya da "V* …" kimliği. */
export const isVariableCandidate = (obj) => VAR_OTYPES.has(obj.basic.otype) || obj.ids.some((i) => i.startsWith('V* '));

const norm = (s) => String(s).replace(/^(V\*|\*\*?|NAME)\s+/, '').replace(/\s+/g, '').toLowerCase();

/** VSX satırı → { name, type, max, min, minIsAmp, band, P, epoch }; tür yoksa null. */
export function vsxFromRow(row) {
  const g = (k) => pick(row, COL[k])[0];
  const type = g('type');
  if (!type) return null;
  const num = (x) => (Number.isFinite(x) ? x : null);
  return {
    name: g('name'), type: String(type), max: num(g('max')), min: num(g('min')),
    // VSX: f_min "(" ise min sütunu genliktir
    minIsAmp: String(g('fmin') ?? '').includes('('), band: g('band') ?? 'V', P: num(g('P')), epoch: num(g('epoch')),
  };
}

/** obj: fetchObject(). Dönüş: vsxFromRow() ya da kayıt yoksa null. */
export async function fetchVariable(obj, signal) {
  const { ra, dec } = obj.basic;
  if (ra == null) return null;
  const tables = await cone('B/vsx/vsx', ra, dec, 15, signal);
  const rows = tables.flatMap((tb) => tb.rows).map((r) => vsxFromRow(r)).filter(Boolean);
  if (!rows.length) return null;
  const ids = new Set(obj.ids.map(norm));
  return rows.find((r) => r.name && ids.has(norm(r.name))) ?? rows[0];
}
