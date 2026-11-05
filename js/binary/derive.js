// Görsel çift yıldız yörüngesi (saf fonksiyonlar). Campbell elemanları: P (yıl), a (″), i, Ω, ω
// (derece), T (periastron, Besselian yıl), e. Kaynak: Washington Altıncı Görsel Çift Yörünge Kataloğu (ORB6).

const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const val = (value, origin) => (value == null || !Number.isFinite(value) ? null : { value, origin });

/** Kepler denklemi E − e sin E = M. */
function kepler(M, e) {
  let E = e > 0.8 ? Math.PI : M;
  for (let k = 0; k < 60; k++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}

/** Jülyen günü → Besselian yıl (≈ Jülyen yılı; bu doğrulukta fark önemsiz). */
export const yearFromJd = (jd) => 2000 + (jd - 2451545) / 365.25;

/** ORB6 zaman birimleri: T Besselian yıl, JD ya da MJD olabilir. */
export function toYear(T, unit) {
  if (T == null) return null;
  if (/d|jd/i.test(unit ?? '') || T > 2.3e6) return yearFromJd(T < 1e5 ? T + 2400000.5 : T > 2.3e6 ? T : T + 2400000);
  if (/m/i.test(unit ?? '') && T < 1e5) return yearFromJd(T + 2400000.5);
  return T;
}
/** Dönem birimi: y yıl, d gün, h saat, m dakika, c yüzyıl. */
export function periodYears(P, unit) {
  if (P == null) return null;
  const u = (unit ?? 'y').trim().toLowerCase();
  return P * ({ y: 1, yr: 1, a: 1, d: 1 / 365.25, h: 1 / 8766, m: 1 / 525960, min: 1 / 525960, c: 100 }[u] ?? 1);
}
/** Yarı büyük eksen birimi: a/″ yay saniyesi, m/mas milisaniye. */
export const axisArcsec = (a, unit) => (a == null ? null : /^(m|mas)$/i.test((unit ?? '').trim()) ? a / 1000 : a);

/**
 * el: { P yıl, a ″, i, node (Ω), omega (ω), T yıl, e }, year: Besselian yıl.
 * Dönüş: { rho ″, theta (konum açısı, kuzeyden doğuya, derece), x (doğu ″), y (kuzey ″), z (bakış yönü ″) }.
 */
export function relativePosition(el, year) {
  const M = 2 * Math.PI * (((year - el.T) / el.P) % 1);
  const E = kepler(((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), el.e);
  const nu = 2 * Math.atan2(Math.sqrt(1 + el.e) * Math.sin(E / 2), Math.sqrt(1 - el.e) * Math.cos(E / 2));
  const r = el.a * (1 - el.e * Math.cos(E));
  const u = nu + el.omega * RAD, O = el.node * RAD, i = el.i * RAD;
  const north = r * (Math.cos(O) * Math.cos(u) - Math.sin(O) * Math.sin(u) * Math.cos(i));
  const east = r * (Math.sin(O) * Math.cos(u) + Math.cos(O) * Math.sin(u) * Math.cos(i));
  const z = r * Math.sin(u) * Math.sin(i);
  const theta = ((Math.atan2(east, north) * DEG) % 360 + 360) % 360;
  return { rho: Math.hypot(north, east), theta, x: east, y: north, z, nu, r };
}

/**
 * Yörünge türetimi. el: Campbell elemanları; plxMas: paralaks (mas, ϖ/σ ≥ 5 ise kullanılır);
 * dmag: bileşenlerin parlaklık farkı (yoksa null); year: bugünün yılı.
 */
export function deriveBinary(el, plxMas, plxErr, dmag, year) {
  const plxOk = plxMas > 0 && (!plxErr || plxMas / plxErr >= 5);
  const aAu = plxOk ? el.a / (plxMas / 1000) : null;
  // Kepler III (Güneş birimlerinde): M₁ + M₂ = a³ / P², a AU, P yıl
  const massSum = aAu ? aAu ** 3 / el.P ** 2 : null;
  // Kütle oranı yalnız sahne için: anakolda L ∝ M⁴ → q = 10^(−0,1 Δm)
  const q = dmag != null && dmag >= 0 ? 10 ** (-0.1 * dmag) : 0.8;
  const now = relativePosition(el, year);
  // Bir dönem boyunca en küçük ve en büyük görünen ayrım
  let min = Infinity, max = 0, minYear = year, maxYear = year;
  for (let k = 0; k < 720; k++) {
    const y = year + el.P * k / 720, p = relativePosition(el, y);
    if (p.rho < min) { min = p.rho; minYear = y; }
    if (p.rho > max) { max = p.rho; maxYear = y; }
  }
  const nextPeri = el.T + Math.ceil((year - el.T) / el.P) * el.P;
  return {
    periodYr: val(el.P, 'measured'), aArcsec: val(el.a, 'measured'), e: val(el.e, 'measured'), i: val(el.i, 'measured'),
    aAu: val(aAu, 'derived'), periAu: val(aAu && aAu * (1 - el.e), 'derived'), apoAu: val(aAu && aAu * (1 + el.e), 'derived'),
    massSum: val(massSum, 'derived'), q: val(q, 'estimated'),
    sepNow: val(now.rho, 'derived'), paNow: val(now.theta, 'derived'), now,
    sepMin: { value: min, year: minYear }, sepMax: { value: max, year: maxYear }, nextPeri,
  };
}

/** Görünen yörünge çizgisi: n nokta [{x doğu ″, y kuzey ″}]. */
export function apparentOrbit(el, n = 180) {
  return Array.from({ length: n + 1 }, (_, k) => relativePosition(el, el.T + el.P * k / n));
}
