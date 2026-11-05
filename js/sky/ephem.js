// Gökyüzü konumları (saf fonksiyonlar, ağ yok). Doğruluk gözlem planlamasına yeter:
// - Güneş ve Ay: Astronomical Almanac düşük duyarlıklı formülleri (Güneş ~0,01°, Ay ~0,3°)
// - Gezegenler: Standish (1992) ortalama Kepler elemanları, 1800–2050 (~1′ iç gezegenler, birkaç ′ dışlar)
// - Sabit cisimler: J2000 → tarih presesyonu (Lieske 1977); öz hareket ve nütasyon yok sayılır
// Açılar derece, zaman Jülyen günü (UT ≈ TT farkı ~70 sn yok sayılır).

import { positionAt, earthElements } from '../sso/orbit.js';

const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const norm360 = (x) => ((x % 360) + 360) % 360;
const sin = (d) => Math.sin(d * RAD), cos = (d) => Math.cos(d * RAD);

export const jdFromDate = (d) => d.getTime() / 86400000 + 2440587.5;
export const dateFromJd = (jd) => new Date((jd - 2440587.5) * 86400000);

/** Greenwich ortalama yıldız zamanı (derece), Meeus 12.4. */
export function gmst(jd) {
  const T = (jd - 2451545) / 36525;
  return norm360(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - T ** 3 / 38710000);
}

/** Ekliptiğin eğikliği (derece). */
export const obliquity = (jd) => 23.439291 - 0.0130042 * (jd - 2451545) / 36525;

/** Ekliptik (λ, β) → ekvatoral (α, δ), derece. */
export function eclToEq(lon, lat, eps) {
  const x = cos(lat) * cos(lon);
  const y = cos(eps) * cos(lat) * sin(lon) - sin(eps) * sin(lat);
  const z = sin(eps) * cos(lat) * sin(lon) + cos(eps) * sin(lat);
  return { ra: norm360(Math.atan2(y, x) * DEG), dec: Math.asin(z) * DEG };
}

/** J2000 ekvatoral koordinatları tarihin ekvatoruna taşır (Lieske 1977 açıları). */
export function precess(ra, dec, jd) {
  const T = (jd - 2451545) / 36525;
  const zeta = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T ** 3) / 3600;
  const z = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T ** 3) / 3600;
  const th = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T ** 3) / 3600;
  const A = cos(dec) * sin(ra + zeta);
  const B = cos(th) * cos(dec) * cos(ra + zeta) - sin(th) * sin(dec);
  const C = sin(th) * cos(dec) * cos(ra + zeta) + cos(th) * sin(dec);
  return { ra: norm360(Math.atan2(A, B) * DEG + z), dec: Math.asin(Math.max(-1, Math.min(1, C))) * DEG };
}

/** Güneş: görünür ekvatoral konum ve uzaklık (AU). */
export function sunPosition(jd) {
  const n = jd - 2451545;
  const L = norm360(280.460 + 0.9856474 * n), g = norm360(357.528 + 0.9856003 * n);
  const lon = L + 1.915 * sin(g) + 0.020 * sin(2 * g);
  return { ...eclToEq(lon, 0, 23.439 - 0.0000004 * n), lon: norm360(lon), distAu: 1.00014 - 0.01671 * cos(g) - 0.00014 * cos(2 * g) };
}

/** Ay: yer merkezli ekvatoral konum, ekliptik boylam ve uzaklık (km). */
export function moonPosition(jd) {
  const T = (jd - 2451545) / 36525;
  const lon = 218.32 + 481267.881 * T + 6.29 * sin(134.9 + 477198.85 * T) - 1.27 * sin(259.2 - 413335.38 * T)
    + 0.66 * sin(235.7 + 890534.23 * T) + 0.21 * sin(269.9 + 954397.70 * T) - 0.19 * sin(357.5 + 35999.05 * T)
    - 0.11 * sin(186.6 + 966404.05 * T);
  const lat = 5.13 * sin(93.3 + 483202.03 * T) + 0.28 * sin(228.2 + 960400.87 * T)
    - 0.28 * sin(318.3 + 6003.18 * T) - 0.17 * sin(217.6 - 407332.20 * T);
  const plx = 0.9508 + 0.0518 * cos(134.9 + 477198.85 * T) + 0.0095 * cos(259.2 - 413335.38 * T)
    + 0.0078 * cos(235.7 + 890534.23 * T) + 0.0028 * cos(269.9 + 954397.70 * T);
  return { ...eclToEq(norm360(lon), lat, obliquity(jd)), lon: norm360(lon), lat, distKm: 6378.14 / sin(plx) };
}

/** Ay evresi: aydınlık kesir (0–1), elongasyon (derece) ve büyüyor mu. */
export function moonPhase(jd) {
  const m = moonPosition(jd), s = sunPosition(jd);
  const elong = Math.acos(cos(m.lat) * cos(m.lon - s.lon)) * DEG;
  return { illum: (1 - cos(elong)) / 2, elong, waxing: norm360(m.lon - s.lon) < 180 };
}

// Standish (1992) Tablo 1: a, e, I, L, ϖ, Ω ve yüzyıllık değişimleri (J2000 ekliptiği)
const ELEMENTS = {
  mercury: [0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.25032350, 149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081],
  venus: [0.72333566, 0.00000390, 0.00677672, -0.00004107, 3.39467605, -0.00078890, 181.97909950, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418],
  mars: [1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
  jupiter: [5.20288700, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106],
  saturn: [9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794],
  uranus: [19.18916464, -0.00196176, 0.04725744, -0.00004397, 0.77263783, -0.00242939, 313.23810451, 428.48202785, 170.95427630, 0.40805281, 74.01692503, 0.04240589],
  neptune: [30.06992276, 0.00026291, 0.00859048, 0.00005105, 1.77004347, 0.00035372, -55.12002969, 218.45945325, 44.96476227, -0.32241464, 131.78422574, -0.00508664],
};

/** Gezegenin o andaki Kepler elemanları (orbit.js biçiminde). */
export function planetElements(key, jd) {
  const [a, da, e, de, I, dI, L, dL, w, dw, O, dO] = ELEMENTS[key];
  const T = (jd - 2451545) / 36525;
  const Lt = L + dL * T, wt = w + dw * T, Ot = O + dO * T;
  return { a: a + da * T, e: e + de * T, i: I + dI * T, node: Ot, peri: wt - Ot, M0: norm360(Lt - wt), epoch: jd, n: 0 };
}

/** Güneş merkezli ekliptik J2000 konum (AU) → yer merkezli görünür ekvatoral konum ve uzaklık. */
export function geocentric(helio, jd) {
  const E = positionAt(earthElements(jd), jd).pos;
  const d = [helio[0] - E[0], helio[1] - E[1], helio[2] - E[2]];
  const r = Math.hypot(...d);
  const j2000 = eclToEq(Math.atan2(d[1], d[0]) * DEG, Math.asin(d[2] / r) * DEG, 23.4392911);
  return { ...precess(j2000.ra, j2000.dec, jd), distAu: r, helio };
}

/** Güneş Sistemi gezegeni ('mars', …): yer merkezli konum ve uzaklık. */
export const planetPosition = (key, jd) => geocentric(positionAt(planetElements(key, jd), jd).pos, jd);

/** Elongasyon: Güneş'ten açısal uzaklık (derece). */
export function elongation(p, jd) {
  const s = sunPosition(jd);
  return Math.acos(Math.max(-1, Math.min(1, sin(p.dec) * sin(s.dec) + cos(p.dec) * cos(s.dec) * cos(p.ra - s.ra)))) * DEG;
}

/** Ekvatoral → ufuk koordinatları. lat, lon derece (doğu +). Dönüş { alt, az } (az kuzeyden doğuya). */
export function altAz(ra, dec, lat, lon, jd) {
  const H = gmst(jd) + lon - ra;
  const alt = Math.asin(sin(lat) * sin(dec) + cos(lat) * cos(dec) * cos(H)) * DEG;
  const az = Math.atan2(-cos(dec) * sin(H), sin(dec) * cos(lat) - cos(dec) * sin(lat) * cos(H)) * DEG;
  return { alt, az: norm360(az) };
}
