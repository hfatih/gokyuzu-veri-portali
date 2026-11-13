// deriveGalaxy() çıktısını gökada sahnesinin parametrelerine çevirir. Saf fonksiyon.
// Yapı Hubble türünden gelir: şişkinlik/toplam oranı (Simien & de Vaucouleurs 1986 eğilimi), Sérsic
// indisi ve disk kalınlığı (Graham & Worley 2008; de Grijs 1998), sarmal kol açısı (Kennicutt 1981
// eğilimi, büyük saçılmayla), toz ve çubuk. Renk ölçülen B−V'den: yaşlı ve genç topluluğun ışık payı
// bütünleşik rengi verecek biçimde çözülür. Birim: optik yarıçap (R25) = 1, disk ölçek uzunluğu 0,3.

import { lineRgb, blackbodyTable } from '../render/color.js';
import { bvToTeff } from '../cluster/derive.js';

const FAMILY_INDEX = { E: 0, S0: 1, S: 2, Irr: 3 };
const RD = 0.3, RC = 0.08, BAR = 0.28;
const KPC_KM = 3.0857e16;

function chroma(T) {
  const d = blackbodyTable(1, T, T).data, m = Math.max(d[0], d[1], d[2]);
  return [d[0] / m, d[1] / m, d[2] / m];
}

const interp = (table, x) => {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (x <= table[i][0]) { const [a, va] = table[i - 1], [b, vb] = table[i]; return va + (vb - va) * (x - a) / (b - a); }
  }
  return table[table.length - 1][1];
};

// T sayısına göre: şişkinlik/toplam ışık oranı
const BT = [[-5, 1], [-2, 0.6], [1, 0.45], [2, 0.35], [3, 0.25], [4, 0.18], [5, 0.12], [6, 0.08], [7, 0.05], [8, 0.03], [9, 0.02], [10, 0]];
// Şişkinliğin Sérsic indisi (Graham & Worley 2008 ortancaları: erken türde ~3, geç türde ~1)
const SERSIC_N = [[-5, 4], [-2, 3], [0, 2.8], [1, 2.6], [2, 2.4], [3, 2.2], [4, 1.9], [5, 1.6], [6, 1.3], [7, 1]];
// Disk ölçek uzunluğunun kalınlığa oranı h_R / z0 (de Grijs 1998: geç türler daha ince)
const FLATNESS = [[-2, 4], [1, 4.5], [5, 7], [7, 9]];
// Türün ortalama bütünleşik (B−V)₀ rengi (Roberts & Haynes 1994); ölçüm yoksa kullanılır
const BV_TYPE = [[-5, 0.92], [-2, 0.88], [1, 0.75], [3, 0.64], [4, 0.56], [5, 0.52], [7, 0.47], [10, 0.42]];
const BV_OLD = 0.95, BV_YOUNG = 0;   // yaşlı (eliptik) ve genç (sürekli yıldız oluşumu) topluluğun rengi

/**
 * Bütünleşik B−V renginden genç topluluğun V bandı ışık payı (0–1). İki topluluğun B/V akı oranları
 * doğrusal karışır: r = (1 − f) r_yaşlı + f r_genç, r = 10^(−0,4 (B−V)).
 */
export function youngFraction(bv) {
  const r = (x) => 10 ** (-0.4 * x);
  return Math.min(1, Math.max(0, (r(bv) - r(BV_OLD)) / (r(BV_YOUNG) - r(BV_OLD))));
}

/** Parlak eliptiklerde Sérsic indisi ışımayla artar: M_B = −9,4 log n − 14,3 (Graham & Guzmán 2003). */
export const ellipticalSersicN = (absB) => Math.min(8, Math.max(1, 10 ** (-(absB + 14.3) / 9.4)));

/**
 * Sérsic profilinin hacim yoğunluğu (Prugniel & Simien 1997): ρ(x) = amp · x^−p e^(−b x^(1/n)), x = r/Re.
 * amp, yarıçapı rMax olan (y ekseni flat kadar basık) hacmin toplam ışığı lum olacak biçimde ayarlanır.
 * Dönüş { n, p, b, re, amp }.
 */
export function sersicBulge(n, re, lum, flat, rMax) {
  const p = 1 - 0.6097 / n + 0.05463 / (n * n), b = 2 * n - 1 / 3 + 0.009876 / n;
  // ∫ ρ 4π r² dr: logaritmik adımlı yamuk kuralı (merkezdeki sivrilik x^(2−p) ile integrallenebilir)
  const N = 600, lo = Math.log(1e-5), hi = Math.log(rMax);
  let sum = 0;
  for (let i = 0; i <= N; i++) {
    const r = Math.exp(lo + (hi - lo) * i / N), x = r / re;
    sum += (i === 0 || i === N ? 0.5 : 1) * x ** -p * Math.exp(-b * x ** (1 / n)) * r ** 3;
  }
  const unit = 4 * Math.PI * flat * sum * (hi - lo) / N;
  return { n, p, b, re, amp: lum > 0 ? lum / unit : 0 };
}

const seedOf = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) / 997 * 100;

/** gd: deriveGalaxy(), obj: fetchObject(). Hubble türü yoksa Sbc varsayılır. */
export function galaxyVisualParams(gd, obj) {
  const m = gd.morph ?? { family: 'S', T: 4, bar: false };
  const T = m.T, E = m.family === 'E';
  const hii = lineRgb(656.28).map((c, i) => 0.75 * c + 0.25 * lineRgb(486.13)[i]);
  const bt = m.family === 'Irr' ? 0 : interp(BT, T);
  // Disk ışığı 2π Σ₀ h² (Σ₀ = 1); şişkinlik ışığı B/T oranını verecek kadar. Eliptik: disk yok.
  const diskLum = 2 * Math.PI * RD * RD;
  const flat = E ? Math.max(0.35, gd.axisRatio) : 0.6;   // eliptikte görünen basıklık içsel sayılır (yaklaşık)
  const sersic = E
    ? sersicBulge(gd.absB ? ellipticalSersicN(gd.absB.value) : 4, 0.3, 1.5 * diskLum, flat, 1.45)
    // Yarı ışık yarıçapı: Re / h ≈ 0,2 (geç tür) – 0,45 (S0)
    : sersicBulge(interp(SERSIC_N, T), RD * (0.15 + 0.5 * bt), bt < 1 ? diskLum * bt / (1 - bt) : 0, flat, 1);
  // Renk: türün ortalaması; ölçülen B−V onu en çok ±0,15 kaydırır (SIMBAD gökada parlaklıkları farklı
  // açıklıklardan gelir ve sönümleme düzeltmesizdir, tek başına güvenilmez: M51 için 0,9 verir, gerçek 0,6)
  const bvType = interp(BV_TYPE, T);
  const bv = Math.min(bvType + 0.15, Math.max(bvType - 0.15, gd.bv?.value ?? bvType));
  const youngFrac = E ? 0 : Math.min(0.85, youngFraction(bv) / Math.max(0.15, 1 - bt));
  // Dönme: V / R25 (rad/s). Ölçek bilinmiyorsa Samanyolu benzeri (200 km/s, 15 kpc)
  const rotRate = (gd.vRot?.value ?? 200) / ((gd.diameterKpc?.value ?? 30) / 2 * KPC_KM);
  // Desen hızı: eş dönme yarıçapı çubuklularda çubuk ucunun 1,2 katı, diğerlerinde ~2,7 ölçek uzunluğu
  const rCr = m.bar ? 1.2 * BAR : 0.8;
  return {
    family: FAMILY_INDEX[m.family],
    flat, sersic, bulge: bt,
    hz: RD / (m.family === 'Irr' ? 3 : interp(FLATNESS, T)),
    pitch: ((5 + 2.8 * Math.max(1, Math.min(9, T))) * Math.PI) / 180,
    arms: m.family === 'S' ? 0.85 : 0,
    armN: 2,
    // Geç türlerde büyük desen dağılır, kısa kol parçaları (yumak) baskınlaşır; çubuk deseni toplar
    floc: m.family === 'S' ? Math.min(0.85, Math.max(0, (T - 4) / 4)) * (m.bar ? 0.6 : 1) : 0,
    bar: m.bar ? 1 : 0,
    dust: { E: 0, S0: 0.25, S: T <= 6 ? 1 : 0.45, Irr: 0.3 }[m.family],
    old: chroma(bvToTeff(BV_OLD)),       // yaşlı topluluk: B−V = 0,95 → ~4900 K
    young: chroma(bvToTeff(BV_YOUNG)),   // genç topluluk: B−V = 0 → ~10 000 K
    hii,                     // H II bölgeleri: Hα + Hβ
    bv, youngFrac, rotRate,
    omegaP: 1 / Math.hypot(rCr, RC),
    seed: seedOf(obj.mainId),
    inclination: gd.inclination?.value ?? (E ? 0 : 55),
  };
}
