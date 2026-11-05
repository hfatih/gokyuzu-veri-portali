// Güneş lekesi etkinliği modeli (saf). Lekeler gözlenmiş istatistik yasalarıyla doğar, büyür, söner
// ve Güneş'in farklı dönmesiyle taşınır:
// - Döngü eğrisi: Hathaway, Wilson & Reichmann (1994) işlevi; 25. döngü Aralık 2019 minimumunda
//   başladı, 13 aylık düzgünleştirilmiş en büyük leke sayısı ~160 (Ekim 2024, SILSO)
// - Enlem: Spörer yasası, leke kuşağının merkezi λ = 28° · exp(−t / 90 ay) (Hathaway 2011)
// - Eğiklik: Joy yasası, γ = 32,1° · sin|λ| (Stenflo & Kosovichev 2012); önde giden leke ekvatora yakın
// - Ömür: Gnevyshev–Waldmeier kuralı, T = A_max / 10 MSH/gün; en büyük alanlar log-normal
// - Dönme: Snodgrass & Ulrich (1990) manyetik izleyiciler, ω = 14,713 − 2,396 sin²φ − 1,787 sin⁴φ °/gün
// - Faküller: lekeleri çevreleyen parlak bölgeler; lekelerden daha uzun yaşar
// Lekelerin tek tek yerleri istatistikseldir; NOAA'dan gerçek bölgeler gelirse görünen yüzde onlar kullanılır.

const DEG = Math.PI / 180;
export const MAX_SPOTS = 40, MAX_FAC = 20;

// ---------- Döngü ----------
export const CYCLE = { start: 2019.96, period: 11.0, peak: 160 };

const hShape = (tm, a) => {
  if (tm <= 0) return 0;
  const b = 27.12 + 25.15 / Math.pow(a * 1e3, 0.25);
  return a * tm ** 3 / (Math.exp((tm * tm) / (b * b)) - 0.71);
};
// Genlik a: işlevin tepesi CYCLE.peak olacak biçimde (ikiye bölme)
const A_FIT = (() => {
  const peakOf = (a) => { let m = 0; for (let t = 1; t < 160; t++) m = Math.max(m, hShape(t, a)); return m; };
  let lo = 1e-4, hi = 1e-2;
  for (let k = 0; k < 60; k++) { const mid = Math.sqrt(lo * hi); if (peakOf(mid) < CYCLE.peak) lo = mid; else hi = mid; }
  return Math.sqrt(lo * hi);
})();

/** Yıl → [{ n: döngü no, tm: döngü başından ay, r: katkı }] (komşu döngüler üst üste biner). */
function cycleParts(year) {
  const n0 = 25 + Math.floor((year - CYCLE.start) / CYCLE.period);
  const out = [];
  for (const n of [n0 - 1, n0, n0 + 1]) {
    const tm = (year - (CYCLE.start + (n - 25) * CYCLE.period)) * 12;
    const r = hShape(tm, A_FIT);
    if (r > 0.01) out.push({ n, tm, r });
  }
  return out;
}

/** Düzgünleştirilmiş uluslararası leke sayısı (model). */
export const sunspotNumber = (year) => cycleParts(year).reduce((s, c) => s + c.r, 0);

/** Spörer yasası: döngü başından tm ay sonra leke kuşağının merkez enlemi (derece). */
export const spoererLat = (tm) => 28 * Math.exp(-tm / 90);

/** Farklı dönme (yıldızsal, °/gün). */
export function omegaDeg(latDeg) {
  const s2 = Math.sin(latDeg * DEG) ** 2;
  return 14.713 - 2.396 * s2 - 1.787 * s2 * s2;
}

/** Joy yasası: eğiklik açısı (derece). */
export const joyTilt = (latDeg) => 32.1 * Math.sin(Math.abs(latDeg) * DEG);

/** Gnevyshev–Waldmeier: en büyük alandan (MSH) ömür (gün). */
export const lifetimeDays = (aMax) => Math.max(1, aMax / 10);

// Görünür yarıküredeki grup sayısı ≈ R / 12 (kabaca; tüm Güneş'te iki katı)
const GROUPS_PER_R = 1 / 6;
const A_MED = 60, A_SIG = 1.1, A_MIN = 10, A_MAX = 3000;
const growDays = (T) => Math.min(0.12 * T, 3);

/** t gün yaşındaki grubun alanı (MSH): hızlı büyüme, sonra doğrusal sönme. */
export function groupArea(g, age) {
  const gr = growDays(g.T);
  if (age < 0 || age > gr + g.T) return 0;
  return age < gr ? g.aMax * age / gr : g.aMax * (1 - (age - gr) / g.T);
}

// Ortalama ömür (doğum hızını leke sayısına bağlamak için): log-normal alan dağılımının beklentisi
const MEAN_SPAN = (() => {
  let s = 0, n = 0;
  for (let z = -3.5; z <= 3.5; z += 0.01) {
    const w = Math.exp(-z * z / 2);
    const a = Math.min(A_MAX, Math.max(A_MIN, A_MED * Math.exp(A_SIG * z)));
    s += w * (lifetimeDays(a) + growDays(lifetimeDays(a))); n += w;
  }
  return s / n;
})();

// ---------- Rastgelelik (tekrarlanabilir) ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (rnd) => Math.sqrt(-2 * Math.log(rnd() || 1e-12)) * Math.cos(2 * Math.PI * rnd());
function poisson(rnd, lam) {
  const L = Math.exp(-lam); let k = 0, p = 1;
  do { k++; p *= rnd(); } while (p > L && k < 50);
  return k - 1;
}

/**
 * Güneş modeli. opts: { year0 (ondalık yıl, t = 0 anı), seed, real: [{ lat, cmd, area, id }], obsLon (derece) }.
 * real verilirse t = 0'da görünen yüzdeki model grupları yerine gerçek bölgeler kullanılır.
 */
export function createSunModel({ year0, seed = 1, real = null, obsLon = 0 } = {}) {
  const buckets = new Map();
  const wrap = (d) => ((d + 540) % 360) - 180;

  // Gün k'da doğan gruplar (k: t = 0'dan itibaren gün)
  function bucket(k) {
    let b = buckets.get(k);
    if (b) return b;
    const rnd = mulberry32(seed * 100003 + k * 7919 + 17);
    const year = year0 + (k + 0.5) / 365.25;
    const parts = cycleParts(year);
    const R = parts.reduce((s, c) => s + c.r, 0);
    const n = poisson(rnd, R * GROUPS_PER_R / MEAN_SPAN);
    b = [];
    for (let i = 0; i < n; i++) {
      // Hangi döngüden: katkısıyla orantılı; enlem o döngünün Spörer kuşağından
      let u = rnd() * R, c = parts[0];
      for (const p of parts) { if ((u -= p.r) <= 0) { c = p; break; } }
      const mean = spoererLat(c.tm), sd = Math.max(3, 0.3 * mean);
      const lat = (rnd() < 0.5 ? -1 : 1) * Math.min(45, Math.max(2, mean + sd * gauss(rnd)));
      const aMax = Math.min(A_MAX, Math.max(A_MIN, A_MED * Math.exp(A_SIG * gauss(rnd))));
      b.push({ birth: k + rnd(), lat, lon0: rnd() * 360 - 180, aMax, T: lifetimeDays(aMax), real: false });
    }
    if (buckets.size > 4000) buckets.delete(buckets.keys().next().value);
    buckets.set(k, b);
    return b;
  }

  // Gerçek bölgeler: gözlenen alan sönme evresinin %40'ında sayılır → A_max = A / 0,6
  const realGroups = (real ?? []).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.cmd) && r.area > 0).map((r) => {
    const aMax = Math.min(A_MAX, Math.max(A_MIN, r.area / 0.6)), T = lifetimeDays(aMax);
    const age = growDays(T) + 0.4 * T;
    return { birth: -age, lat: r.lat, lon0: obsLon + r.cmd - omegaDeg(r.lat) * age, aMax, T, real: true, id: r.id };
  });
  const haveReal = realGroups.length > 0;

  const lonAt = (g, t) => g.lon0 + omegaDeg(g.lat) * (t - g.birth);
  const MAX_AGE_SPOT = growDays(lifetimeDays(A_MAX)) + lifetimeDays(A_MAX);

  /** t (gün) anında yaşayan gruplar ve şu anki alanları. */
  function groupsAt(t) {
    const out = [];
    for (let k = Math.floor(t - 2 * MAX_AGE_SPOT); k <= Math.floor(t); k++) {
      for (const g of bucket(k)) {
        if (g.birth > t) continue;
        // Gerçek veri varsa: t = 0'dan önce doğup o anda görünen yüzde olan model grupları atılır
        if (haveReal && g.birth < 0 && Math.abs(wrap(lonAt(g, 0) - obsLon)) < 95) continue;
        const age = t - g.birth;
        if (age > 2 * (growDays(g.T) + g.T)) continue;
        out.push({ g, age, area: groupArea(g, age) });
      }
    }
    for (const g of realGroups) {
      const age = t - g.birth;
      if (age <= 2 * (growDays(g.T) + g.T)) out.push({ g, age, area: groupArea(g, age) });
    }
    return out;
  }

  const unit = (lat, lon) => [Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos(lon * DEG)];
  // Alan (MSH) → açısal yarıçap (radyan): A·10⁻⁶ · 2π sr = π r²
  const radius = (a) => Math.sqrt(2e-6 * a);

  const spots = new Float32Array(MAX_SPOTS * 4), fac = new Float32Array(MAX_FAC * 4), facS = new Float32Array(MAX_FAC);

  /** Shader dizileri: lekeler (x, y, z, r) ve faküller (x, y, z, r) + güç. */
  function stateAt(t) {
    const live = groupsAt(t);
    const sp = [], fc = [];
    for (const { g, age, area } of live) {
      const lon = lonAt(g, t), sgn = Math.sign(g.lat) || 1;
      // Fakül: grubun en büyük alanına göre; leke söndükten sonra da bir süre kalır
      const span = growDays(g.T) + g.T;
      const fs = Math.min(1, Math.sqrt(g.aMax / 300)) * (age < span ? Math.min(1, age / growDays(g.T) || 1) : 1 - (age - span) / span);
      if (fs > 0.02) fc.push([unit(g.lat, lon), radius(g.aMax) * 3.2 + 0.03, fs]);
      if (area <= 0) continue;
      if (area < 20) { sp.push([unit(g.lat, lon), radius(area)]); continue; }
      // İki kutuplu grup: öndeki (batıdaki) leke ekvatora yakın, eğiklik Joy yasasından
      const sep = Math.min(12, 2 + 0.006 * g.aMax), tilt = joyTilt(g.lat) * DEG;
      const dLat = sgn * (sep / 2) * Math.sin(tilt), dLon = (sep / 2) * Math.cos(tilt) / Math.cos(g.lat * DEG);
      sp.push([unit(g.lat - dLat, lon + dLon), radius(0.6 * area)]);
      sp.push([unit(g.lat + dLat, lon - dLon), radius(0.4 * area)]);
    }
    sp.sort((a, b) => b[1] - a[1]);
    fc.sort((a, b) => b[2] - a[2]);
    const nS = Math.min(MAX_SPOTS, sp.length), nF = Math.min(MAX_FAC, fc.length);
    for (let i = 0; i < nS; i++) spots.set([...sp[i][0], sp[i][1]], i * 4);
    for (let i = 0; i < nF; i++) { fac.set([...fc[i][0], fc[i][1]], i * 4); facS[i] = fc[i][2]; }
    return { spots, nSpots: nS, fac, facS, nFac: nF, groups: live };
  }

  /** Kart için özet: döngü, leke sayısı, görünen grup sayısı (gözlemci boylamından ±90°). */
  function summary(t = 0) {
    const year = year0 + t / 365.25;
    const parts = cycleParts(year);
    const main = parts.reduce((m, c) => (c.r > (m?.r ?? -1) ? c : m), null);
    const visible = groupsAt(t).filter(({ g, area }) => area > 0 && Math.abs(wrap(lonAt(g, t) - obsLon)) < 90);
    const dR = sunspotNumber(year + 0.25) - sunspotNumber(year - 0.25);
    return {
      year, ssn: sunspotNumber(year), cycle: main?.n ?? 25, cycleYears: (main?.tm ?? 0) / 12,
      rising: dR > 0, beltLat: main ? spoererLat(main.tm) : null,
      visibleGroups: visible.length, realGroups: visible.filter((v) => v.g.real).length,
    };
  }

  return { stateAt, summary, groupsAt, haveReal };
}

/** JD → ondalık yıl. */
export const yearFromJd = (jd) => 2000 + (jd - 2451545) / 365.25;
