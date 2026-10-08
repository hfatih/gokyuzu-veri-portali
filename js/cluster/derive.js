// Yıldız kümesi fiziği: üye yıldızların B, V parlaklıklarından renk–parlaklık diyagramı,
// anakol bükülme noktası, bükülme kütlesi ve yaşı, fiziksel boyut, üyelerin gökyüzü konumlarının
// parsek cinsinden izdüşümü. Ağ ya da DOM bilgisi yoktur.

import { bolometricCorrection, massFromLuminosity } from '../star/derive.js';
import { pickDistancePc } from '../nebula/derive.js';

const val = (value, origin) => (value == null || !Number.isFinite(value) ? null : { value, origin });
const ARCMIN_RAD = 1 / 3437.747;
const MBOL_SUN = 4.74;

const KINDS = { OpC: 'open', 'Cl*': 'open', GlC: 'globular' };
export const clusterKind = (otype) => KINDS[otype] ?? null;

/** B−V → Teff, Ballesteros (2012) kara cisim yaklaşımı. */
export const bvToTeff = (bv) => 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));

// Sıfır yaş anakolu yaklaşık M_V(B−V), Pecaut & Mamajek (2013) cüce tablosundan
const ZAMS = [
  [-0.30, -3.9], [-0.26, -2.7], [-0.20, -1.6], [-0.165, -1.1], [-0.11, -0.2], [0.0, 1.0], [0.14, 1.9],
  [0.30, 2.6], [0.44, 3.5], [0.59, 4.4], [0.68, 5.1], [0.82, 5.9], [1.15, 7.4], [1.42, 8.9], [1.50, 10.3], [1.8, 13.0],
];

/** Verilen B−V için ZAMS mutlak V parlaklığı (doğrusal ara değer, uçlarda sabit). */
export function zamsMV(bv) {
  if (bv <= ZAMS[0][0]) return ZAMS[0][1];
  for (let i = 1; i < ZAMS.length; i++) {
    if (bv <= ZAMS[i][0]) {
      const [a, va] = ZAMS[i - 1], [b, vb] = ZAMS[i];
      return va + (vb - va) * (bv - a) / (b - a);
    }
  }
  return ZAMS[ZAMS.length - 1][1];
}

/** Teğet düzlem izdüşümü: merkezden (ra, dec) farkı → [x, y] pc. x doğuya, y kuzeye. */
export function projectPc(p, c, dPc) {
  const k = Math.PI / 180 * dPc;
  return [(p.ra - c.ra) * Math.cos(c.dec * Math.PI / 180) * k, (p.dec - c.dec) * k];
}

/**
 * Anakol ömrü (yıl), log t = 10 − 3,6 log M + 0,9 (log M)². Güneş 10 milyar yıl, 4 M☉ ~150 milyon yıl;
 * büyük kütlelerde basit M^−2,5 yasasından gerçekçi (Schaller+ 1992 eğrilerine yakın, elle uydurma).
 */
export function msLifetimeYr(M) {
  const l = Math.log10(M);
  return 10 ** (10 - 3.6 * l + 0.9 * l * l);
}

/**
 * Anakol ışıma fonksiyonundan bükülme kutusu. bins: { M_V kutu alt sınırı (0,5 adım): sayı }.
 * En kalabalık kutudan parlak yöne yürünür; bir sonraki kutu max(3, şimdiki/4)'ün altına düşünce
 * durulur. Seyrek mavi başıboşlar (M67) kopuştan sonra kalır; genç kümede IMF'nin seyrek ama
 * kesintisiz üst anakolu (Ülker) yürüyüşü durdurmaz.
 */
export function turnoffBin(bins) {
  const keys = Object.keys(bins).map(Number);
  if (!keys.length) return null;
  let cur = keys.reduce((a, k) => (bins[k] > bins[a] ? k : a), keys[0]);
  for (;;) {
    const next = bins[cur - 0.5] ?? 0;
    if (next < Math.max(3, bins[cur] / 4)) return cur;
    cur -= 0.5;
  }
}

/**
 * ZAMS uydurmasıyla kızarma: yıldızlar kızarma vektörü boyunca (ΔB−V = −E, ΔM_V = −3,1 E) geri
 * kaydırılır; ZAMS'a ±0,3 kadir içinde oturan yıldız sayısını en çoklayan E(B−V) seçilir (0–1,2,
 * 0,01 adım; eşitlikte küçük E). points: [{ bv, mv }] gözlenen renk ve uzaklık düzeltilmiş M_V.
 */
export function fitReddening(points) {
  let best = 0, bestN = -1;
  for (let i = 0; i <= 120; i++) {
    const E = i / 100;
    let n = 0;
    for (const p of points) {
      const bv0 = p.bv - E;
      if (bv0 > -0.3 && bv0 < 1.3 && Math.abs(p.mv - 3.1 * E - zamsMV(bv0)) < 0.3) n++;
    }
    if (n > bestN) { bestN = n; best = E; }
  }
  return best;
}

/**
 * c: { kind, majArcmin, distances, members: [{ B, V, ra, dec }], center: { ra, dec } }.
 * Kızarma ZAMS uydurmasıyla bulunur ve düzeltilir (R_V = 3,1). Anakol yıldızı: ZAMS'tan en çok
 * 1 kadir uzakta. Küresel kümede yatay kol yıldızları anakol bandına düştüğü için yaş verilmez.
 */
export function deriveCluster(c) {
  const dist = pickDistancePc(c.distances ?? []);
  const distancePc = dist ? { value: dist.value, origin: 'measured', n: dist.n } : null;
  const d = distancePc?.value;
  const radiusPc = d && c.majArcmin ? val(c.majArcmin / 2 * ARCMIN_RAD * d, 'derived') : null;
  const mu = d ? 5 * Math.log10(d) - 5 : null;

  let cmd = c.members.map((m) => ({ bv: m.B - m.V, mv: mu != null ? m.V - mu : null, v: m.V }));
  let turnoff = null, age = null, totalLv = null, ebv = null;
  if (mu != null) {
    // Küresel kümede (metal fakir anakol, yatay kol) uydurma anlamsız sonuç veriyor (ω Cen: 1,12)
    if (c.kind !== 'globular') {
      const E = fitReddening(cmd);
      // E < 0,15 yöntemin duyarlılığının altında (evrimleşmiş anakol, çiftler ~0,1 kaydırır): düzeltilmez
      const applied = E >= 0.15;
      ebv = { value: E, origin: 'estimated', applied };
      if (applied) cmd = cmd.map((p) => ({ ...p, bv: p.bv - E, mv: p.mv - 3.1 * E }));   // içsel (B−V)₀ ve M_V
    }
    totalLv = val(cmd.reduce((s, p) => s + 10 ** (-0.4 * (p.mv - 4.83)), 0), 'derived');
    const ms = cmd.filter((p) => p.bv > -0.35 && p.bv < 1.6 && Math.abs(p.mv - zamsMV(p.bv)) < 1);
    if (ms.length >= 10 && c.kind !== 'globular') {
      const bins = {};
      for (const p of ms) { const k = Math.floor(p.mv * 2) / 2; bins[k] = (bins[k] ?? 0) + 1; }
      const k = turnoffBin(bins);
      const inBin = ms.filter((p) => p.mv >= k && p.mv < k + 0.5).map((p) => p.bv).sort((a, b) => a - b);
      const bv = inBin[inBin.length >> 1], mv = k + 0.25;
      const teff = bvToTeff(bv);
      const L = 10 ** (-0.4 * (mv + bolometricCorrection(teff) - MBOL_SUN));
      const mass = massFromLuminosity(L);
      turnoff = { bv, mv, teff, mass };
      age = val(msLifetimeYr(mass), 'estimated');
    }
  }
  return { kind: c.kind, distancePc, radiusPc, n: c.members.length, cmd, turnoff, age, totalLv, ebv };
}
