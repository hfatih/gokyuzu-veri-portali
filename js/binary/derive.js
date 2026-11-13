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

const C2_V = 26160;   // hc / (λ k), λ = 550 nm (K)

/** Beyaz cüce yarıçapı (R☉), Nauenberg (1972) kütle–yarıçap bağıntısı; Chandrasekhar sınırı 1,44 M☉. */
export function whiteDwarfRadius(massSun) {
  const x = massSun / 1.44;
  return 0.0112 * Math.sqrt(Math.max(x ** (-2 / 3) - x ** (2 / 3), 0));
}

/**
 * Yoldaşın türü ve beyaz cüceyse fiziği. Anakol yıldızında L ∝ M⁴ olduğundan kütle oranı q olan yoldaş
 * 10 log(1/q) kadir sönük olmalıdır; kütlesine göre bundan en az 4 kadir daha sönükse ve Chandrasekhar
 * sınırının altındaysa beyaz cücedir (Sirius B: beklenen 3, gözlenen 10 kadir). Sıcaklık: V bandındaki
 * yüzey parlaklığı oranı S = 10^(−0,4 Δm) (R₁/R₂)² Planck işlevinden ters çözülür.
 * primary: { mass (M☉), radius (R☉), teff (K) }. Dönüş { kind: 'ms' | 'wd', mass?, radius?, teff? }.
 */
export function classifyCompanion(m2, primary, dmag) {
  if (!(m2 > 0) || !(primary?.mass > 0) || dmag == null) return { kind: 'ms' };
  const expected = 10 * Math.log10(primary.mass / m2);
  if (m2 >= 1.44 || dmag - expected < 4) return { kind: 'ms', mass: m2 };
  const radius = whiteDwarfRadius(m2);
  let teff = null;
  if (primary.radius > 0 && primary.teff > 0) {
    const S = 10 ** (-0.4 * dmag) * (primary.radius / radius) ** 2;
    teff = C2_V / Math.log1p(Math.expm1(C2_V / primary.teff) / S);
  }
  return { kind: 'wd', mass: m2, radius, teff };
}

/**
 * Yörünge türetimi. el: Campbell elemanları; plxMas: paralaks (mas, ϖ/σ ≥ 5 ise kullanılır);
 * dmag: bileşenlerin parlaklık farkı (yoksa null); year: bugünün yılı; primary: birincil yıldızın
 * { mass, radius, teff } değerleri (varsa yoldaşın kütlesi toplam kütleden çıkarılır).
 */
export function deriveBinary(el, plxMas, plxErr, dmag, year, primary = null) {
  const plxOk = plxMas > 0 && (!plxErr || plxMas / plxErr >= 5);
  const aAu = plxOk ? el.a / (plxMas / 1000) : null;
  // Kepler III (Güneş birimlerinde): M₁ + M₂ = a³ / P², a AU, P yıl
  const massSum = aAu ? aAu ** 3 / el.P ** 2 : null;
  // Kütle oranı. Dinamik: M₂ = (M₁ + M₂) − M₁, toplam Kepler III'ten, M₁ yıldızın kendi türetiminden; makul
  // aralıktaysa (0,05–1,5) kullanılır. Yoksa fotometrik: anakolda L ∝ M⁴ → q = 10^(−0,1 Δm).
  const m2 = massSum && primary?.mass > 0 ? massSum - primary.mass : null;
  const qDyn = m2 != null && m2 / primary.mass > 0.05 && m2 / primary.mass < 1.5 ? m2 / primary.mass : null;
  const q = qDyn ?? (dmag != null && dmag >= 0 ? 10 ** (-0.1 * dmag) : 0.8);
  const companion = classifyCompanion(qDyn != null ? m2 : null, primary, dmag);
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
    massSum: val(massSum, 'derived'), q: val(q, qDyn != null ? 'derived' : 'estimated'), companion,
    sepNow: val(now.rho, 'derived'), paNow: val(now.theta, 'derived'), now,
    sepMin: { value: min, year: minYear }, sepMax: { value: max, year: maxYear }, nextPeri,
  };
}

/** Görünen yörünge çizgisi: n nokta [{x doğu ″, y kuzey ″}]. */
export function apparentOrbit(el, n = 180) {
  return Array.from({ length: n + 1 }, (_, k) => relativePosition(el, el.T + el.P * k / n));
}

// ---------- Tayfsal çiftler ----------

const MSIN3 = 1.0361e-7;   // M☉: (1 − e²)^{3/2} K³ P, K km/s, P gün (Kepler III ile dikine hızdan)
const RSUN_KM = 695700, AU_KM = 1.495978707e8;
export const SB_ASSUMED_INCL = 60;   // eğiklik bilinmiyorsa (rastgele yönelimde ortalama sin³i ≈ 0,59 → ~57°)

/** Ortalama anomaliden gerçek anomali (derece değil, radyan). */
function trueAnomaly(M, e) {
  const E = kepler(((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), e);
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
}

/**
 * Dikine hız eğrisi: evre φ (0–1, periastrondan) → { v1, v2 } km/s. v = V0 ± K [cos(ν + ω) + e cos ω];
 * ω birincilin periastron açısı, ikincil zıt yönde. SB1'de v2 null.
 */
export function radialVelocity(o, phi) {
  const w = o.omega * RAD, nu = trueAnomaly(2 * Math.PI * phi, o.e), c = Math.cos(nu + w) + o.e * Math.cos(w);
  return { v1: o.V0 + o.K1 * c, v2: o.K2 ? o.V0 - o.K2 * c : null };
}

/**
 * SB9 yörüngesinin fiziği. o: fetchSb9(); primary: { mass, teff } (yıldızın kendi türetiminden, yoksa null).
 * - Çift çizgili (K2 var): q = M₂/M₁ = K₁/K₂, M sin³i = 1,0361·10⁻⁷ (1 − e²)^{3/2} (K₁ + K₂)² K P.
 * - Tek çizgili: kütle işlevi f(M) = M₂³ sin³i / (M₁ + M₂)²; birincilin kütlesi biliniyorsa M₂ varsayılan
 *   eğiklikle çözülür.
 * - a sin i = K P √(1 − e²) / 2π. Eğiklik ölçülmez; birincilin kütlesi biliniyorsa sin³i = M₁ sin³i / M₁.
 * Dönüş alanları { value, origin } ya da null; el: çift yıldız sahnesi için Campbell elemanları (a = 1, keyfi).
 */
export function deriveSpectroscopic(o, primary = null, year = 2026) {
  const s = (1 - o.e * o.e) ** 1.5, root = Math.sqrt(1 - o.e * o.e);
  const sb2 = o.K2 > 0;
  const q = sb2 ? o.K1 / o.K2 : null;
  const m1s = sb2 ? MSIN3 * s * (o.K1 + o.K2) ** 2 * o.K2 * o.P : null;
  const m2s = sb2 ? MSIN3 * s * (o.K1 + o.K2) ** 2 * o.K1 * o.P : null;
  const fm = MSIN3 * s * o.K1 ** 3 * o.P;
  const asini = 13751 * (o.K1 + (o.K2 ?? 0)) * o.P * root;   // km (P gün → s, / 2π)
  const M1 = primary?.mass > 0 ? primary.mass : null;
  // Eğiklik: çift çizgilide birincilin kütlesinden (sin³i ≤ 1 ise)
  const sin3 = m1s && M1 ? m1s / M1 : null;
  const incl = sin3 && sin3 <= 1 ? Math.asin(Math.cbrt(sin3)) * DEG : null;
  // Tek çizgilide M₂: f(M) (M₁ + M₂)² = M₂³ sin³i, varsayılan eğiklikle Newton yöntemi
  let qSb1 = null;
  if (!sb2 && M1) {
    const si3 = Math.sin(SB_ASSUMED_INCL * RAD) ** 3;
    let m2 = M1 * 0.5;
    for (let k = 0; k < 40; k++) {
      const F = m2 ** 3 * si3 - fm * (M1 + m2) ** 2, dF = 3 * m2 * m2 * si3 - 2 * fm * (M1 + m2);
      m2 = Math.max(1e-3, m2 - F / dF);
    }
    qSb1 = m2 / M1;
  }
  const qScene = q ?? qSb1 ?? 0.8;
  // Düğüm açısı tayfsal çiftte ölçülemez; 90° seçilir: büyük eksen ekranda yatay durur
  const el = { P: o.P / 365.25, a: 1, i: incl ?? SB_ASSUMED_INCL, node: 90, T: yearFromJd(o.T0), e: o.e, omega: (o.omega + 180) % 360 };
  return {
    sb2, el,
    periodDays: val(o.P, 'measured'), e: val(o.e, 'measured'), omega: val(o.omega, 'measured'),
    K1: val(o.K1, 'measured'), K2: val(o.K2, 'measured'),
    q: val(q ?? qSb1, q ? 'derived' : 'estimated'),
    m1sin3: val(m1s, 'derived'), m2sin3: val(m2s, 'derived'), massFunction: sb2 ? null : val(fm, 'derived'),
    asiniRsun: val(asini / RSUN_KM, 'derived'), asiniAu: val(asini / AU_KM, 'derived'),
    inclination: val(incl, 'estimated'), inclAssumed: incl == null,
    // Sahne (binaryVisualParams) yoldaşı anakol sayar; kütle oranı yukarıdaki sıradan
    sceneBd: { q: { value: Math.min(1, qScene) }, companion: { kind: 'ms' } },
    nextPeri: yearFromJd(o.T0 + Math.ceil(((year - 2000) * 365.25 + 2451545 - o.T0) / o.P) * o.P),
  };
}
