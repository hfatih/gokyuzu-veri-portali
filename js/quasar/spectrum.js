// Kuasar tayfı modeli (durgun çerçeve, f_λ): Vanden Berk ve ark. (2001) SDSS bileşik tayfının kuvvet
// yasası sürekliliği ve geniş salma çizgilerinin eşdeğer genişlikleri. Kırmızıya kayınca gözlenen
// tayf, Lyα ormanı soğurması (Lyα'nın mavisinde) ve 912 Å altında Lyman sınırı. Saf fonksiyonlar.

import { spectrumRgb } from '../render/color.js';

// [ad, durgun λ (Å), eşdeğer genişlik (Å), FWHM (km/s)] — Vanden Berk 2001 Tablo 2'den yuvarlak
export const LINES = [
  ['Lyβ', 1026, 9, 5000], ['Lyα', 1216, 93, 5000], ['Si IV', 1397, 8, 5000], ['C IV', 1549, 24, 5000],
  ['C III]', 1909, 21, 5000], ['Mg II', 2799, 32, 5000], ['Hγ', 4342, 13, 4000], ['Hβ', 4861, 46, 4000],
  ['[O III]', 5007, 16, 600], ['Hα', 6563, 195, 4000],
];
const C_KMS = 299792.458, LYA = 1215.67, LYLIMIT = 911.8;

/** Durgun çerçeve f_λ (keyfi birim). Süreklilik α_ν = −0,44 (λ < 5000 Å), kırmızıda −2,45 (konak gökada). */
export function restFlux(lA) {
  const cont = lA < 5000 ? (lA / 5000) ** -1.56 : (lA / 5000) ** 0.45;
  let lines = 0;
  for (const [, l0, ew, fwhm] of LINES) {
    const sig = l0 * fwhm / C_KMS / 2.355;
    lines += ew / (sig * Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * ((lA - l0) / sig) ** 2);
  }
  return cont * (1 + lines);
}

/** Lyα ormanı geçirgenliği: τ = 0,0036 (λ_göz/1216 Å)^3,46 (Madau 1995 yaklaşımı); 912 Å altı kapalı. */
export function igmTransmission(lRestA, z) {
  if (lRestA < LYLIMIT) return 0;
  if (lRestA >= LYA) return 1;
  return Math.exp(-0.0036 * (lRestA * (1 + z) / LYA) ** 3.46);
}

/** Gözlenen f_λ (λ nm cinsinden), biçim olarak (ölçek keyfi). */
export const observedFlux = (z) => (lnm) => {
  const rest = lnm * 10 / (1 + z);
  return restFlux(rest) * igmTransmission(rest, z);
};

/** Kuasarın göze görünen rengi (doğrusal sRGB, en parlak kanal 1). */
export const observedRgb = (z) => spectrumRgb(observedFlux(z));

/** 400–700 nm arasındaki ışığın Lyα ormanı ve Lyman sınırında soğurulan kesri. */
export function visibleAbsorbed(z) {
  let a = 0, b = 0;
  for (let l = 400; l <= 700; l += 2) { const r = l * 10 / (1 + z); b += restFlux(r); a += restFlux(r) * igmTransmission(r, z); }
  return 1 - a / b;
}
