// derivePlanet() çıktısını gezegen sahnesinin parametrelerine çevirir. Saf fonksiyon.
// Renkler gözlem değil, fiziksel sınıfın temsili tonlarıdır (Sudarsky+ 2000 model tayfları).

import { rhinesBands, sudarsky } from './derive.js';
import { blackbodyTable } from '../render/color.js';

const EARTH_R_KM = 6371;

// Sudarsky sınıfı → [kuşak (zone, açık), kemer (belt, koyu)] doğrusal RGB albedo
const CLOUD = {
  ammonia: [[0.92, 0.86, 0.74], [0.55, 0.38, 0.24]],
  water: [[0.95, 0.95, 0.96], [0.82, 0.84, 0.88]],
  clear: [[0.36, 0.50, 0.78], [0.28, 0.40, 0.68]],
  alkali: [[0.22, 0.19, 0.20], [0.15, 0.13, 0.14]],
  silicate: [[0.62, 0.50, 0.42], [0.45, 0.33, 0.27]],
  methane: [[0.60, 0.80, 0.90], [0.50, 0.72, 0.86]],   // buz devleri: metan kırmızıyı soğurur (Irwin+ 2024)
};

/** Kara cisim kromatikliği, en parlak kanal 1 (ışık rengi ve sıcak gece yüzü için). */
export function chroma(T) {
  const d = blackbodyTable(1, T, T).data;
  const m = Math.max(d[0], d[1], d[2]);
  return [d[0] / m, d[1] / m, d[2] / m];
}

/**
 * pd: derivePlanet(), solar: solar.js kaydı ya da null, hostTeff: ana yıldız Teff (yoksa 5772).
 * mode: 0 doku, 1 bulut bantları, 2 Venüs bulut örtüsü, 3 kayalık yüzey modeli, 4 uydu yüzeyi (iki ton).
 */
export function planetVisualParams(pd, solar, hostTeff) {
  const T = pd.temp?.value ?? pd.teq?.value ?? 250;
  const rotDays = pd.rot?.value ?? 1;
  const rotSec = Math.abs(rotDays) * 86400;
  const g = pd.gravity?.value ?? 10;
  const fluid = pd.cls && pd.cls !== 'rocky';
  // Kamera Güneş ışığına beyaz dengelenir (NASA gerçek renk görüntüleri ve doku haritaları gibi);
  // kırmızı cücenin ışığı yine kırmızı kalır
  const sun = chroma(5772), host = chroma(hostTeff ?? 5772);
  const bal = host.map((c, i) => c / sun[i]), mx = Math.max(...bal);
  const base = {
    light: bal.map((c) => c / mx),
    rotSec, retro: rotDays < 0 ? -1 : 1,
    tilt: (solar?.tilt ?? 0) * Math.PI / 180,
    oblate: 0, ring: solar?.ring ?? null, texture: solar?.texture ?? null,
    atm: [0, 0, 0, 0], bands: 0, zone: [0.5, 0.5, 0.5], belt: [0.5, 0.5, 0.5], contrast: 0,
    teq: T, glow: 0, glowColor: [0, 0, 0],
  };

  // Uydular: temsili iki tonlu yüzey (kip 4) ya da bulut örtüsü (Titan)
  if (solar?.look) return { ...base, contrast: 0.6, ...solar.look, atm: solar.look.atm ?? base.atm };
  if (solar?.texture) {
    return { ...base, mode: 0, atm: solar.atmosphere ? [...solar.atmosphere, solar.key === 'earth' ? 0.7 : 0.18] : base.atm };
  }
  if (solar?.clouds) {
    return { ...base, mode: 2, zone: [0.93, 0.86, 0.68], belt: [0.86, 0.78, 0.6], contrast: 0.25, atm: [1.0, 0.9, 0.7, 0.35] };
  }
  if (fluid) {
    const ice = T < 120 && pd.cls !== 'giant';
    const cloud = ice ? 'methane' : sudarsky(T).key;
    const Rkm = (pd.radius?.value ?? 4) * EARTH_R_KM;
    // Düşük yüzey çekiminde pus kalınlaşır ve bantları soldurur (Satürn Jüpiter'den soluk)
    const contrast = (ice ? 0.25 : 1) * Math.min(1, Math.max(0.35, g / 25));
    // Basıklık f ≈ 0,75·q, q = ω²R³/GM (gözlenen f/q: Jüpiter 0,78, Satürn 0,70)
    const omega = 2 * Math.PI / rotSec, M = (pd.mass?.value ?? 17) * 5.9722e24;
    const q = omega ** 2 * (Rkm * 1e3) ** 3 / (6.674e-11 * M);
    const hot = Math.min(1, Math.max(0, (T - 1000) / 1000));
    return {
      ...base, mode: 1, bands: rhinesBands(Rkm, rotSec), zone: CLOUD[cloud][0], belt: CLOUD[cloud][1], contrast,
      oblate: Math.min(0.15, q * 0.75), atm: [...CLOUD[cloud][0], 0.25],
      glow: hot * 0.6, glowColor: chroma(Math.max(1000, T * 1.1)),
    };
  }
  // Kayalık ötegezegen: yüzey bilinmiyor; yalnız sıcaklık sınıfı (buz / kaya / kavrulmuş / lav)
  const lava = Math.min(1, Math.max(0, (T - 1000) / 400));
  return { ...base, mode: 3, glow: lava, glowColor: chroma(1300) };
}
