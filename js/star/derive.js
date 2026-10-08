// Yıldız fiziği türetimi: SIMBAD'dan gelen ham ölçümlerden uzaklık, ışıma gücü, yarıçap,
// kütle, yüzey çekimi, dönme ve yüzey ölçeklerini hesaplar. Ağ ya da DOM bilgisi yoktur;
// her alan { value, origin } döner (origin: measured | derived | estimated) ya da null.

const RSUN_KM = 695700;
const MSUN_KG = 1.98847e30;
const G = 6.6743e-11;
const KB = 1.380649e-23;
const MH = 1.6735575e-27;
const MU = 1.3;          // nötr fotosfer için ortalama molekül ağırlığı
const MBOL_SUN = 4.74;   // IAU 2015 B2
const TSUN = 5772;

const val = (value, origin) => (value == null || !Number.isFinite(value) ? null : { value, origin });
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

const CLASSES = 'OBAFGKM';

/** "M1-M2Ia-Iab" → { cls:'M', sub:1, lum:'I' }. Ayrıştırılamazsa null. */
export function parseSpType(sp) {
  const m = /^\s*(?:sd|d|g)?([OBAFGKM])\s*(\d+(?:\.\d+)?)?/.exec(sp || '');
  if (!m) return null;
  const lum = /(III|II|IV|VI|V|I)/.exec(sp.slice(m[0].length));
  return { cls: m[1], sub: m[2] ? parseFloat(m[2]) : 5, lum: lum ? lum[1] : null };
}

// Anakol tayf türü → Teff (Pecaut & Mamajek 2013, sürüm 2022). Kod: sınıf·10 + alt tür.
const TEFF_TABLE = [
  [3, 44900], [5, 41400], [7, 36500], [9, 31900], [10, 31400], [11, 26000], [12, 20600],
  [13, 17000], [15, 15700], [17, 14000], [18, 12500], [19, 10700], [20, 9700], [22, 8840],
  [25, 8080], [27, 7800], [30, 7220], [32, 6810], [35, 6510], [38, 6170], [40, 5920],
  [42, 5770], [45, 5660], [48, 5490], [50, 5280], [52, 5040], [53, 4830], [55, 4450],
  [57, 4050], [60, 3850], [62, 3560], [63, 3430], [64, 3210], [65, 3060], [66, 2810],
  [68, 2570], [69, 2300],
];

function interp(table, x) {
  if (x <= table[0][0]) return table[0].slice(1);
  for (let i = 1; i < table.length; i++) {
    const [x1] = table[i];
    if (x <= x1) {
      const a = table[i - 1], b = table[i], t = (x - a[0]) / (x1 - a[0]);
      return a.slice(1).map((v, k) => v + (b[k + 1] - v) * t);
    }
  }
  return table[table.length - 1].slice(1);
}

/** Tayf türünden Teff tahmini (anakol tablosu; devlerde birkaç yüz K sıcak kalabilir). */
export function teffFromSpType(sp) {
  const p = parseSpType(sp);
  // ponytail: dev/süperdev için ayrı Teff ölçeği yok, gerekirse P&M dev tablosu eklenir
  return p ? interp(TEFF_TABLE, CLASSES.indexOf(p.cls) * 10 + p.sub)[0] : null;
}

/** V bandı bolometrik düzeltme, Torres (2010) Flower (1996) polinomları. */
export function bolometricCorrection(teff) {
  const lt = Math.log10(teff);
  const c = lt < 3.70
    ? [-0.190537291496456e5, 0.155144866764412e5, -0.421278819301717e4, 0.381476328422343e3]
    : lt < 3.90
      ? [-0.370510203809015e5, 0.385672629965804e5, -0.150651486316025e5, 0.261724637119416e4, -0.170623810323864e3]
      : [-0.118115450538963e6, 0.137145973583929e6, -0.636233812100225e5, 0.147412923562646e5, -0.170587278406872e4, 0.788731721804990e2];
  return c.reduce((s, k, i) => s + k * lt ** i, 0);
}

// Işıklılık sınıfına göre tipik log g (cgs), yalnız ölçüm ve hesap yoksa
const TYPICAL_LOGG = { V: 4.4, IV: 3.8, III: 2.5, II: 1.5, I: 0.5, VI: 4.6 };

/** Anakol kütle–ışıma bağıntısının tersi (Duric 2004 parçalı yasası). */
function massFromLuminosity(L) {
  if (L < 0.23 * 0.43 ** 2.3) return (L / 0.23) ** (1 / 2.3);
  if (L < 16) return L ** 0.25;
  if (L < 1.4 * 55 ** 3.5) return (L / 1.4) ** (1 / 3.5);
  return L / 32000;
}

/**
 * raw: { teff, logg, feh, plx (mas), plxErr, sp, mags:{V,...}, vsini (km/s) }
 * Dönüş alanları { value, origin } ya da null.
 */
export function deriveStar(raw) {
  const sp = parseSpType(raw.sp);
  const teff = raw.teff ? val(raw.teff, 'measured') : val(teffFromSpType(raw.sp), 'estimated');

  const plxOk = raw.plx > 0 && (!raw.plxErr || raw.plx / raw.plxErr >= 5);
  const distancePc = plxOk ? val(1000 / raw.plx, 'derived') : null;

  let L = null, R = null;
  // Soğuk cücelerde BC_V polinomu geçersiz (TiO bantları); K bandında BC_K neredeyse düz:
  // 2,4 (M0) → ~3,0 (M6), Mann+ 2015 Şekil 6'ya doğrusal yaklaşım.
  const useK = teff && teff.value < 3800 && sp?.lum === 'V' && raw.mags?.K != null;
  const mag = useK ? raw.mags.K : raw.mags?.V;
  if (distancePc && teff && mag != null) {
    const M = mag - 5 * Math.log10(distancePc.value) + 5;
    const bc = useK ? 2.4 + clamp((3800 - teff.value) / 1000, 0, 1.1) * 0.6 : bolometricCorrection(teff.value);
    const Mbol = M + bc;
    L = val(10 ** (-0.4 * (Mbol - MBOL_SUN)), 'derived');
    R = val(Math.sqrt(L.value) / (teff.value / TSUN) ** 2, 'derived');
  }

  const M = L && sp?.lum === 'V' ? val(massFromLuminosity(L.value), 'estimated') : null;

  let logg = raw.logg != null ? val(raw.logg, 'measured') : null;
  if (!logg && M && R) logg = val(Math.log10(G * M.value * MSUN_KG / (R.value * RSUN_KM * 1e3) ** 2 * 100), 'derived');
  if (!logg && sp?.lum) logg = val(TYPICAL_LOGG[sp.lum], 'estimated');

  // Basınç ölçek yüksekliği H = kT / (μ m_H g)
  const scaleHeightKm = teff && logg
    ? val(KB * teff.value / (MU * MH * 10 ** logg.value / 100) / 1e3, logg.origin === 'measured' ? 'derived' : 'estimated')
    : null;

  // v sin i yalnız alt sınır: i = 90° varsayılır
  const vEq = raw.vsini > 0 ? val(raw.vsini, 'estimated') : null;
  const periodDays = vEq && R ? val(2 * Math.PI * R.value * RSUN_KM / vEq.value / 86400, 'estimated') : null;

  // Roche yaklaşımı: ω = v / √(GM/Re), Rp/Re = 1 / (1 + ω²/2)
  let oblateness = null, gEqRatio = 1;
  if (vEq && M && R) {
    const w2 = (vEq.value * 1e3) ** 2 / (G * M.value * MSUN_KG / (R.value * RSUN_KM * 1e3));
    const rp = 1 / (1 + clamp(w2, 0, 1) / 2);
    oblateness = val(1 - rp, 'estimated');
    gEqRatio = rp * rp * (1 - clamp(w2, 0, 0.99));
  }

  return { teff, distancePc, L, R, M, logg, feh: val(raw.feh, 'measured'), vEq, periodDays, scaleHeightKm, oblateness, gEqRatio, sp };
}

// Kenar kararması (dörtlü yasa, V bandı) — Claret (2000) tablolarına yakın elle uydurulmuş değerler
const LIMB_TABLE = [
  [3500, 0.80, -0.02], [4500, 0.70, 0.08], [5800, 0.47, 0.23], [7000, 0.35, 0.31],
  [9500, 0.20, 0.38], [15000, 0.18, 0.32], [30000, 0.12, 0.28],
];

/**
 * Shader parametreleri. granScale: ekvator boyunca granül sayısı (granül çapı ≈ 10 H,
 * Freytag+ 2002); granLifeSec: H / c_s ile ölçeklenir, Güneş'te ~8 dk olacak biçimde kalibre.
 */
export function starVisualParams(d) {
  const teff = d.teff?.value ?? TSUN;
  const R = d.R?.value ?? 1;
  const H = d.scaleHeightKm?.value;
  const cs = Math.sqrt(5 / 3 * KB * teff / (MU * MH)) / 1e3;
  const giant = (d.logg?.value ?? 4.4) < 2;
  const vEq = d.vEq?.value ?? 2;
  const [u1, u2] = interp(LIMB_TABLE, teff);
  return {
    teff,
    radiusRsun: R,
    granScale: H ? clamp(2 * Math.PI * R * RSUN_KM / (10 * H), 3, 1e5) : 300,
    granContrast: clamp((8000 - teff) / 1500, 0, 1),
    granLifeSec: H ? 28 * H / cs : 480,
    spots: giant ? 0 : clamp((6000 - teff) / 1000, 0, 1) * clamp(vEq / 20, 0.15, 1),
    oblateness: d.oblateness?.value ?? 0,
    gEqRatio: d.gEqRatio ?? 1,
    gravDarkBeta: teff > 7000 ? 0.25 : 0.08,
    periodDays: d.periodDays?.value ?? 25,
    u1, u2,
  };
}
