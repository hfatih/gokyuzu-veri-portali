// Bir cismin önümüzdeki 24 saatteki gökyüzü yolu: yükseklik eğrisi, doğuş / batış / meridyen
// geçişi ve karanlıkta (Güneş −12°'nin altında) en iyi gözlem anı. Saf fonksiyonlar.

import { altAz, sunPosition, moonPosition, planetPosition, precess, geocentric } from './ephem.js';
import { positionAt } from '../sso/orbit.js';

const STEP_MIN = 5;
// Ufuk yüksekliği: kırılma (−34′); Güneş'te ayrıca yarıçap (−16′); Ay'da yarıçap ve paralaks (+0,7° net)
const H0 = { fixed: -0.5667, sun: -0.8333, moon: 0.125, planet: -0.5667, elements: -0.5667 };

/**
 * Kaynak türüne göre o anki ekvatoral konum fonksiyonu.
 * src: { type: 'fixed', ra, dec } (J2000) | { type: 'sun' } | { type: 'moon' } | { type: 'planet', key } | { type: 'elements', el }
 */
export function positionFn(src) {
  switch (src.type) {
    case 'fixed': return (jd) => precess(src.ra, src.dec, jd);
    case 'sun': return sunPosition;
    case 'moon': return moonPosition;
    case 'planet': return (jd) => planetPosition(src.key, jd);
    case 'elements': return (jd) => geocentric(positionAt(src.el, jd).pos, jd);
    default: throw new Error('bilinmeyen kaynak');
  }
}

/**
 * src: positionFn() kaynağı, lat/lon derece, jd0: başlangıç. Dönüş:
 * { now: {alt, az}, samples: [{jd, alt, sunAlt}], rise, set, transit: {jd, alt}, best: {jd, alt} | null,
 *   always: 'up' | 'down' | null }
 */
export function skyPath(src, lat, lon, jd0, hours = 24) {
  const pos = positionFn(src), h0 = H0[src.type] ?? -0.5667;
  const samples = [];
  for (let k = 0; k <= hours * 60 / STEP_MIN; k++) {
    const jd = jd0 + k * STEP_MIN / 1440;
    const p = pos(jd), s = sunPosition(jd);
    samples.push({ jd, alt: altAz(p.ra, p.dec, lat, lon, jd).alt, sunAlt: altAz(s.ra, s.dec, lat, lon, jd).alt });
  }
  const p0 = pos(jd0);
  const now = altAz(p0.ra, p0.dec, lat, lon, jd0);
  let rise = null, set = null, transit = samples[0], best = null;
  for (let k = 1; k < samples.length; k++) {
    const a = samples[k - 1], b = samples[k];
    const cross = (a.alt - h0) * (b.alt - h0) <= 0 && a.alt !== b.alt;
    const jd = a.jd + (h0 - a.alt) / (b.alt - a.alt) * (b.jd - a.jd);
    if (cross && b.alt > a.alt && !rise) rise = jd;
    if (cross && b.alt < a.alt && !set) set = jd;
    if (b.alt > transit.alt) transit = b;
  }
  for (const s of samples) if (s.sunAlt < -12 && s.alt > 10 && (!best || s.alt > best.alt)) best = s;
  const alts = samples.map((s) => s.alt);
  const always = Math.min(...alts) > h0 ? 'up' : Math.max(...alts) < h0 ? 'down' : null;
  // Meridyen geçişi örnek aralığında bir uçtaysa (eğri tepe yapmadan bitiyorsa) gerçek geçiş değildir
  const inside = transit !== samples[0] && transit !== samples[samples.length - 1];
  return { now, samples, rise, set, transit: inside ? { jd: transit.jd, alt: transit.alt } : null, best, always, h0 };
}

const DIRS = { tr: ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'], en: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] };

/** Azimut → 8 yönlü pusula kısaltması. */
export const compass = (az, lang = 'tr') => DIRS[lang][Math.round(az / 45) % 8];

/** Görünür parlaklığa göre gereken araç: 'eye' | 'binoculars' | 'small' | 'large'. */
export function instrumentFor(V) {
  if (V == null || !Number.isFinite(V)) return null;
  if (V <= 6) return 'eye';
  if (V <= 9) return 'binoculars';
  if (V <= 13) return 'small';
  return 'large';
}
