// deriveGalaxy() çıktısını gökada sahnesinin parametrelerine çevirir. Saf fonksiyon.
// Yapı Hubble türünden gelir: şişkinlik/toplam oranı (Simien & de Vaucouleurs 1986 eğilimi),
// sarmal kol açısı (Kennicutt 1981 eğilimi, büyük saçılmayla), toz ve çubuk.

import { lineRgb, blackbodyTable } from '../render/color.js';

const FAMILY_INDEX = { E: 0, S0: 1, S: 2, Irr: 3 };

function chroma(T) {
  const d = blackbodyTable(1, T, T).data, m = Math.max(d[0], d[1], d[2]);
  return [d[0] / m, d[1] / m, d[2] / m];
}

// T sayısına göre şişkinlik/toplam ışık oranı
const BT = [[-5, 1], [-2, 0.6], [1, 0.45], [2, 0.35], [3, 0.25], [4, 0.18], [5, 0.12], [6, 0.08], [7, 0.05], [8, 0.03], [9, 0.02], [10, 0]];
function interp(T) {
  for (let i = 1; i < BT.length; i++) {
    if (T <= BT[i][0]) { const [a, va] = BT[i - 1], [b, vb] = BT[i]; return va + (vb - va) * (T - a) / (b - a); }
  }
  return 0;
}

const seedOf = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) / 997 * 100;

/** gd: deriveGalaxy(), obj: fetchObject(). Hubble türü yoksa Sbc varsayılır. */
export function galaxyVisualParams(gd, obj) {
  const m = gd.morph ?? { family: 'S', T: 4, bar: false };
  const T = m.T;
  const hii = lineRgb(656.28).map((c, i) => 0.75 * c + 0.25 * lineRgb(486.13)[i]);
  return {
    family: FAMILY_INDEX[m.family],
    bulge: interp(T),
    // Eliptikte görünen basıklık içsel basıklık sayılır (yaklaşık)
    flat: m.family === 'E' ? Math.max(0.35, gd.axisRatio) : 0.6,
    pitch: ((5 + 2.8 * Math.max(1, Math.min(9, T))) * Math.PI) / 180,
    arms: m.family === 'S' ? 0.85 : 0,
    bar: m.bar ? 1 : 0,
    dust: { E: 0, S0: 0.25, S: T <= 6 ? 1 : 0.45, Irr: 0.3 }[m.family],
    old: chroma(4300),       // yaşlı topluluk (K devleri baskın)
    young: chroma(15000),    // genç OB yıldızları
    hii,                     // H II bölgeleri: Hα + Hβ
    seed: seedOf(obj.mainId),
    inclination: gd.inclination?.value ?? (m.family === 'E' ? 0 : 55),
  };
}
