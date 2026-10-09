// Kepler yörüngesi (iki cisim): Kepler denklemi, belirli bir andaki güneş merkezli konum (ekliptik
// J2000, AU), Dünya'nın ortalama yörüngesi ve iki yörünge arasındaki en küçük uzaklık (MOID).
// Saf fonksiyonlar. Gezegen tedirginlikleri yok: elemanların dönemine (epoch) yakın tarihlerde doğru.

const RAD = Math.PI / 180;
export const K_DEG_DAY = 0.9856076686;   // Gauss sabitinden ortalama hareket, a = 1 AU için °/gün

/** Kepler denklemi E − e sin E = M (radyan), e < 1. */
export function eccentricAnomaly(M, e) {
  let E = e > 0.8 ? Math.PI : M;
  for (let k = 0; k < 60; k++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}

/** Gerçek ayrıklıktan (ν, radyan) güneş merkezli konum. el: { a, e, i, node, peri } (AU, derece). */
export function positionAtNu(el, nu) {
  const r = el.a * (1 - el.e ** 2) / (1 + el.e * Math.cos(nu));
  const i = el.i * RAD, O = el.node * RAD, u = el.peri * RAD + nu;
  return [
    r * (Math.cos(O) * Math.cos(u) - Math.sin(O) * Math.sin(u) * Math.cos(i)),
    r * (Math.sin(O) * Math.cos(u) + Math.cos(O) * Math.sin(u) * Math.cos(i)),
    r * Math.sin(u) * Math.sin(i),
  ];
}

/** el: { a, e, i, node, peri, M0 (°), epoch (JD), n? (°/gün) }, jd: Jülyen günü. Dönüş: { pos, r, nu }. */
export function positionAt(el, jd) {
  const n = el.n ?? K_DEG_DAY / el.a ** 1.5;
  const M = (((el.M0 + n * (jd - el.epoch)) % 360) + 360) % 360 * RAD;
  const E = eccentricAnomaly(M, el.e);
  const nu = 2 * Math.atan2(Math.sqrt(1 + el.e) * Math.sin(E / 2), Math.sqrt(1 - el.e) * Math.cos(E / 2));
  return { pos: positionAtNu(el, nu), r: el.a * (1 - el.e * Math.cos(E)), nu };
}

/** Dünya'nın ortalama yörünge elemanları (Standish 1992, 1800–2050 için). */
export function earthElements(jd) {
  const T = (jd - 2451545) / 36525;
  const L = 100.46457166 + 35999.37244981 * T, varpi = 102.93768193 + 0.32327364 * T;
  return { a: 1.00000261, e: 0.01671123, i: 0, node: 0, peri: varpi, M0: L - varpi, epoch: jd, n: 0 };
}

export const jdNow = (ms = Date.now()) => ms / 86400000 + 2440587.5;

const dist2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;

/**
 * MOID: iki eliptik yörünge üzerindeki noktalar arasındaki en küçük uzaklık (AU).
 * 360 × 360 kaba ızgara, sonra en iyi birkaç yerel adayda daralan ızgarayla inceltme.
 * ponytail: ızgara araması; analitik (Gronchi) yöntem gerekmedi, 10⁻⁶ AU'ya iniyor.
 */
export function moid(A, B) {
  const N = 360, step = 2 * Math.PI / N;
  const pa = Array.from({ length: N }, (_, k) => positionAtNu(A, k * step));
  const pb = Array.from({ length: N }, (_, k) => positionAtNu(B, k * step));
  const cand = [];
  for (let i = 0; i < N; i++) {
    let bj = 0, bd = Infinity;
    for (let j = 0; j < N; j++) { const d = dist2(pa[i], pb[j]); if (d < bd) { bd = d; bj = j; } }
    cand.push([bd, i, bj]);
  }
  // A üzerinde yerel en küçükler (komşularından küçük olanlar)
  const local = cand.filter((c, i) => c[0] <= cand[(i + N - 1) % N][0] && c[0] <= cand[(i + 1) % N][0])
    .sort((x, y) => x[0] - y[0]).slice(0, 4);
  let best = Infinity;
  for (const [, i0, j0] of local) {
    let u = i0 * step, v = j0 * step, w = step;
    for (let it = 0; it < 30; it++) {
      let bu = u, bv = v, bd = Infinity;
      for (let a = -5; a <= 5; a++) for (let b = -5; b <= 5; b++) {
        const d = dist2(positionAtNu(A, u + a * w / 5), positionAtNu(B, v + b * w / 5));
        if (d < bd) { bd = d; bu = u + a * w / 5; bv = v + b * w / 5; }
      }
      u = bu; v = bv; w *= 0.5;
      best = Math.min(best, bd);
    }
  }
  return Math.sqrt(best);
}
