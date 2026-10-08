// Gezegen fiziği: eksik kütle/yarıçap, tür, yoğunluk, çekim, denge sıcaklığı, ışınım,
// yaşanabilir bölge, gelgit kilidi ve görünüm için bant sayısı ile bulut sınıfı.
// Ağ ya da DOM bilgisi yoktur; alanlar { value, origin } ya da null.

const val = (value, origin) => (value == null || !Number.isFinite(value) ? null : { value, origin });
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const RSUN_AU = 0.00465047;

/** Chen & Kipping (2017) ortalama kütle–yarıçap ilişkisi (M⊕ → R⊕). */
export function radiusFromMass(M) {
  if (M < 2.04) return 1.008 * M ** 0.279;
  if (M < 132) return 0.808 * M ** 0.589;
  return 17.74 * M ** -0.044;   // Jüpiter dalı: yarıçap kütleyle neredeyse değişmez
}

/** Tersi; Jüpiter dalında (R ≳ 14 R⊕ ya da 10–14 arası belirsiz) kütle çıkmaz, null döner. */
export function massFromRadius(R) {
  if (R < 1.23) return (R / 1.008) ** (1 / 0.279);
  if (R < 10) return (R / 0.808) ** (1 / 0.589);
  return null;
}

/** Tür: kayalık < 1,6 R⊕ (Rogers 2015) < mini-Neptün < 3,5 R⊕ < Neptün benzeri; gaz devi R ≥ 8 R⊕ ya da M ≥ 50 M⊕. */
export function planetClass(R, M = null) {
  if (R == null) return null;
  if (R >= 8 || M >= 50) return 'giant';   // Satürn 9,1 R⊕ / 95 M⊕; Neptün benzerleri ≲ 50 M⊕
  if (R < 1.6) return 'rocky';
  if (R < 3.5) return 'subneptune';
  return 'neptune';
}

// Kopparapu+ (2013, düzeltilmiş) — S_eff = S☉ + aT + bT² + cT³ + dT⁴, T = Teff − 5780 K
const HZ = {
  inner: [1.0140, 8.1774e-5, 1.7063e-9, -4.3241e-12, -6.6462e-16],   // kaçak sera
  outer: [0.3438, 5.8942e-5, 1.6558e-9, -3.0045e-12, -5.2983e-16],   // en büyük sera
};

/** Muhafazakâr yaşanabilir bölge sınırları (AU). Teff 2600–7200 K dışına sıkıştırılır. */
export function habitableZone(teff, L) {
  const T = clamp(teff, 2600, 7200) - 5780;
  const seff = ([s, a, b, c, d]) => s + a * T + b * T ** 2 + c * T ** 3 + d * T ** 4;
  return { inner: Math.sqrt(L / seff(HZ.inner)), outer: Math.sqrt(L / seff(HZ.outer)) };
}

/**
 * Rhines ölçeği: L_β = π√(2U/β), β = 2Ω/R (ekvator). Yarıküre başına bant ≈ πR / L_β.
 * U = 100 m/s varsayılır (Jüpiter jetleri 100–150 m/s). Rkm: yarıçap km, rotSec: dönme süresi s.
 */
export function rhinesBands(Rkm, rotSec, U = 100) {
  const R = Rkm * 1e3, beta = 2 * (2 * Math.PI / rotSec) / R;
  return clamp(Math.PI * R / (Math.PI * Math.sqrt(2 * U / beta)), 1, 20);
}

/** Sudarsky+ (2000) dev gezegen bulut sınıfları, denge sıcaklığından. */
export function sudarsky(T) {
  if (T < 150) return { cls: 'I', key: 'ammonia' };
  if (T < 300) return { cls: 'II', key: 'water' };
  if (T < 850) return { cls: 'III', key: 'clear' };
  if (T < 1400) return { cls: 'IV', key: 'alkali' };
  return { cls: 'V', key: 'silicate' };
}

/**
 * p: { mass M⊕, radius R⊕, period gün, sma AU, ecc, temp K (ölçülen), albedo, rot gün } — Wikidata'dan.
 * host: { teff K, R R☉, L L☉ } ya da null.
 */
export function derivePlanet(p, host) {
  let radius = val(p.radius, 'measured'), mass = val(p.mass, 'measured');
  if (!radius && mass) radius = val(radiusFromMass(mass.value), 'estimated');
  if (!mass && radius) mass = val(massFromRadius(radius.value), 'estimated');

  const density = mass && radius ? val(5.514 * mass.value / radius.value ** 3, 'derived') : null;
  const gravity = mass && radius ? val(9.807 * mass.value / radius.value ** 2, 'derived') : null;

  // a yoksa Kepler III ile dönem ve yıldız kütlesinden hesaplanamaz (kütle çoğu zaman yok); boş kalır
  const sma = val(p.sma, 'measured');
  const albedo = p.albedo ?? 0.3;
  const teq = host?.teff && host?.R && sma
    ? val(host.teff * Math.sqrt(host.R * RSUN_AU / (2 * sma.value)) * (1 - albedo) ** 0.25, 'estimated')
    : null;
  const insolation = host?.L && sma ? val(host.L / sma.value ** 2, 'derived') : null;
  const hz = host?.teff && host?.L ? habitableZone(host.teff, host.L) : null;
  const inHZ = hz && sma ? sma.value >= hz.inner && sma.value <= hz.outer : null;

  // Gelgit kilidi: ölçülen dönme yoksa ve yıldıza çok yakınsa (a < 0,1 AU) varsayılır
  const tidallyLocked = !p.rot && sma ? sma.value < 0.1 : false;
  const rot = p.rot ? val(p.rot, 'measured') : tidallyLocked && p.period ? val(p.period, 'estimated') : null;

  return {
    mass, radius, density, gravity, sma, teq, insolation, hz, inHZ, tidallyLocked, rot,
    period: val(p.period, 'measured'), ecc: val(p.ecc, 'measured'), temp: val(p.temp, 'measured'),
    albedoAssumed: p.albedo == null,
    cls: planetClass(radius?.value, mass?.value),
  };
}
