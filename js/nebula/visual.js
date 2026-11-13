// deriveNebula() çıktısını bulutsu sahnesinin parametrelerine çevirir. Saf fonksiyon.
// Renkler emisyon çizgilerinin gerçek dalga boylarından (CIE) hesaplanır; biçim türün genel
// yapısını verir, belirli bir bulutsunun gözlenen şeklini değil.

import { lineRgb, scatteredRgb, blackbodyTable } from '../render/color.js';

const KIND_INDEX = { hii: 0, pn: 1, snr: 2, rne: 3, dne: 4 };

// Dalga boyları (nm, havada): Hα 656,28; [N II] 658,35; [O III] 500,68; Hβ 486,13; [S II] 671,6
const LINES = { ha: lineRgb(656.28), n2: lineRgb(658.35), o3: lineRgb(500.68), hb: lineRgb(486.13), s2: lineRgb(671.6) };

function chroma(T) {
  const d = blackbodyTable(1, T, T).data, m = Math.max(d[0], d[1], d[2]);
  return [d[0] / m, d[1] / m, d[2] / m];
}

// Kimlikten sabit tohum: aynı bulutsu her açılışta aynı görünür
const seedOf = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) / 997 * 100;

/** nd: deriveNebula(), obj: fetchObject() (açısal boyut, konum açısı, kimlik). */
export function nebulaVisualParams(nd, obj) {
  // Yansıma bulutsusunu aydınlatan yıldız bilinmiyor; tipik B yıldızı (15 000 K) varsayılır
  const starT = nd.kind === 'pn' ? 100000 : nd.kind === 'rne' ? 15000 : 35000;
  return {
    kind: KIND_INDEX[nd.kind],
    axis: Math.max(0.3, nd.axisRatio ?? 1),
    angle: ((obj.basic.dimAngle ?? 0) * Math.PI) / 180,
    seed: seedOf(obj.mainId),
    // Süpernova kalıntısının evresi (boyuttan, derive.js): Sedov'da ince kabuk, serbest genişlemede kalın ve dolu
    sedov: nd.phase === 'free' ? 0 : 1,
    // Belirgin uzamış gezegenimsi çift kutuplu çizilir (eksen oranı 0,7 → 0,5 arasında geçiş)
    bipolar: nd.kind === 'pn' ? Math.min(1, Math.max(0, (0.7 - (nd.axisRatio ?? 1)) / 0.2)) : 0,
    ha: LINES.ha, o3: LINES.o3, hb: LINES.hb, s2: LINES.s2,
    scatter: scatteredRgb(starT, 1.5),
    star: chroma(starT),
    starT,
  };
}
