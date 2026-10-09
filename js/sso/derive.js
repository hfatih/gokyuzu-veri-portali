// Küçük cisim fiziği: yörünge sınıfı, Tisserand parametresi, vis-viva hızları, güneş altı sıcaklığı,
// H ve albedodan çap, kütle, yüzey çekimi, kaçış hızı, moloz yığını dönme sınırı, Dünya MOID'i,
// tehlikeli asteroit ölçütü, bugünkü konum, uzaklık, evre açısı ve görünür parlaklık.
// Ağ ya da DOM bilgisi yoktur; alanlar { value, origin } ya da null.

import { moid, positionAt, earthElements } from './orbit.js';

const val = (value, origin) => (value == null || !Number.isFinite(value) ? null : { value, origin });

const G = 6.674e-11, AU = 1.495978707e11, GM_SUN = 1.32712440018e20, SIGMA = 5.670e-8, S0 = 1361;
const A_JUP = 5.2026, LD_AU = 0.00257;   // Ay uzaklığı

// Varsayımlar (kartta yazılır)
export const ASSUME = {
  albedo: 0.14,            // albedo ölçülmediyse (ana kuşak ortalaması)
  albedoComet: 0.04,       // kuyruklu yıldız çekirdeği
  densityAst: 2000,        // kg/m³
  densityComet: 500,
  emissivity: 0.9,
  G: 0.15,
};

/** a, e, i (AU, derece) → Jüpiter'e göre Tisserand parametresi. */
export const tisserand = (a, e, i) => A_JUP / a + 2 * Math.cos(i * Math.PI / 180) * Math.sqrt(a / A_JUP * (1 - e * e));

/**
 * Yörünge sınıfı (MPC/JPL tanımları). Kuyruklu yıldızda dönem ve Tisserand'a göre: Jüpiter ailesi
 * (P < 20 yıl, 2 < T_J < 3), Halley türü (P < 200 yıl), uzun dönemli.
 */
export function orbitClass(el, comet) {
  const { a, e, q, Q } = el, P = a ** 1.5;
  if (e >= 1) return 'hyperbolic';
  if (comet) return P < 20 && tisserand(a, e, el.i) > 2 ? 'jfc' : P < 200 ? 'htc' : 'lpc';
  if (Q < 0.983) return 'atira';
  if (a < 1) return 'aten';
  if (q < 1.017) return 'apollo';
  if (q < 1.3) return 'amor';
  if (a > 30.1) return 'tno';
  if (a > 5.5) return 'centaur';
  if (a > 5.05 && a < 5.35) return 'trojan';
  if (a > 3.7 && a < 4.2) return 'hilda';
  if (q < 1.666) return 'marsCrosser';
  if (a >= 2.0 && a < 3.3) return 'mainBelt';
  return 'other';
}

/** Görünür parlaklık: asteroitte H, G evre sistemi (Bowell 1989); kuyruklu yıldızda H1 + 5 log Δ + K1 log r. */
export function apparentMag(b, r, delta, alphaRad) {
  if (b.H1 != null) return b.H1 + 5 * Math.log10(delta) + (b.K1 ?? 10) * Math.log10(r);
  if (b.H == null) return null;
  const g = b.G ?? ASSUME.G, t = Math.tan(alphaRad / 2);
  const phi1 = Math.exp(-3.33 * t ** 0.63), phi2 = Math.exp(-1.87 * t ** 1.22);
  return b.H + 5 * Math.log10(r * delta) - 2.5 * Math.log10((1 - g) * phi1 + g * phi2);
}

const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const len = (p) => Math.hypot(...p);

// Bugünkü geometri: güneş ve Dünya uzaklığı, evre açısı (Güneş–cisim–Dünya)
function geometry(el, jd) {
  if (!(el.e < 1) || el.M0 == null || el.epoch == null) return null;
  const body = positionAt(el, jd), earth = positionAt(earthElements(jd), jd);
  const toSun = body.pos.map((x) => -x), toEarth = sub(earth.pos, body.pos);
  const delta = len(toEarth);
  const cosA = (toSun[0] * toEarth[0] + toSun[1] * toEarth[1] + toSun[2] * toEarth[2]) / (body.r * delta);
  return { r: body.r, delta, alpha: Math.acos(Math.max(-1, Math.min(1, cosA))), pos: body.pos, earth: earth.pos };
}

/** b: fetchSso() çıktısı, jd: hesap anı (Jülyen günü). */
export function deriveSso(b, jd) {
  const comet = b.type === 'Comet', el = b.el;
  const elliptic = el.e != null && el.e < 1;
  const albedoVal = b.albedo ?? (comet ? ASSUME.albedoComet : ASSUME.albedo);
  // Çap: ölçülen; yoksa asteroitte H ve albedodan D = 1329 km / √p · 10^(−H/5) (kuyruklu yıldızda H komayı içerir)
  const dFromH = !comet && b.H != null ? 1329 / Math.sqrt(albedoVal) * 10 ** (-b.H / 5) : null;
  const D = b.D ?? dFromH;
  const rho = b.density ?? (comet ? ASSUME.densityComet : ASSUME.densityAst);
  const R = D ? D * 500 : null;                                       // m
  const mass = b.mass ?? (R ? 4 / 3 * Math.PI * R ** 3 * rho : null);
  const massMeasured = b.mass != null;
  const gSurf = mass && R ? G * mass / R ** 2 : null;
  const vEsc = mass && R ? Math.sqrt(2 * G * mass / R) : null;
  // Moloz yığını dönme sınırı: ekvatorda merkezkaç = kütleçekim → P_c = √(3π/(Gρ))
  const pCritH = Math.sqrt(3 * Math.PI / (G * rho)) / 3600;
  // Güneş altı noktası sıcaklığı (yavaş dönen, ısı iletimi yok): T = [S(1−A)/(εσr²)]^¼, Bond A = p(0,29 + 0,684 G)
  const bond = albedoVal * (0.29 + 0.684 * (b.G ?? ASSUME.G));
  const tAt = (r) => (S0 * (1 - bond) / (ASSUME.emissivity * SIGMA * r * r)) ** 0.25;
  const vAt = (r) => Math.sqrt(GM_SUN * (2 / (r * AU) - 1 / (el.a * AU))) / 1e3;
  const geo = geometry(el, jd);
  const moidE = elliptic ? moid(el, earthElements(jd)) : null;
  const H = comet ? null : b.H;
  return {
    comet, elliptic,
    cls: el.a != null && el.e != null ? orbitClass(el, comet) : 'other',
    periodYr: val(elliptic ? el.a ** 1.5 : null, 'derived'),
    tJup: val(el.a != null ? tisserand(el.a, el.e, el.i) : null, 'derived'),
    vPeri: val(el.q ? vAt(el.q) : null, 'derived'),
    vAph: val(elliptic && el.Q ? vAt(el.Q) : null, 'derived'),
    tPeri: val(el.q ? tAt(el.q) : null, 'derived'),
    tAph: val(elliptic && el.Q ? tAt(el.Q) : null, 'derived'),
    diameterKm: val(D, b.D != null ? 'measured' : 'estimated'),
    albedo: val(albedoVal, b.albedo != null ? 'measured' : 'estimated'),
    massKg: val(mass, massMeasured ? 'measured' : 'estimated'),
    density: val(rho, b.density != null ? 'measured' : 'estimated'),
    gSurf: val(gSurf, massMeasured ? 'derived' : 'estimated'),
    vEscMs: val(vEsc, massMeasured ? 'derived' : 'estimated'),
    spinH: val(b.spinH, 'measured'),
    spinRatio: val(b.spinH ? b.spinH / pCritH : null, 'derived'),
    pCritH: val(pCritH, b.density != null ? 'derived' : 'estimated'),
    moidAu: val(moidE, 'derived'),
    moidLd: val(moidE != null ? moidE / LD_AU : null, 'derived'),
    pha: moidE != null && H != null && moidE <= 0.05 && H <= 22,
    rNow: val(geo?.r, 'derived'),
    deltaNow: val(geo?.delta, 'derived'),
    phaseDeg: val(geo && geo.alpha * 180 / Math.PI, 'derived'),
    magNow: val(geo ? apparentMag(b, geo.r, geo.delta, geo.alpha) : null, 'estimated'),
    geo,
  };
}
