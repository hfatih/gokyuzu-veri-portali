// Gökada fiziği: Hubble türü (de Vaucouleurs), uzaklık seçimi (yakında kırmızıya kayma dışlanır),
// eğiklik, fiziksel çap, mutlak parlaklık, Tully–Fisher dönüş hızı, dinamik kütle ve düz ΛCDM'de
// geriye bakış süresi. Ağ ya da DOM bilgisi yoktur; alanlar { value, origin } ya da null.

const val = (value, origin) => (value == null || !Number.isFinite(value) ? null : { value, origin });
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export const COSMO = { H0: 70, Om: 0.3 };          // km/s/Mpc; düz evren, ΩΛ = 1 − Ωm
const C_KMS = 299792.458;
const HUBBLE_GYR = 977.8 / COSMO.H0;               // 1/H0, milyar yıl
const MB_SUN = 5.44;                               // Güneş'in B bandı mutlak parlaklığı (Willmer 2018)
const ARCMIN_RAD = 1 / 3437.747;

// Gökada sayılan SIMBAD türleri; kuasar ve blazar nokta kaynak olduğu için dışarıda
const GALAXY_OTYPES = new Set(['G', 'GiG', 'GiC', 'GiP', 'BiC', 'AGN', 'Sy1', 'Sy2', 'SyG', 'LIN', 'SBG', 'bCG', 'LSB', 'EmG', 'H2G', 'rG', 'IG', 'PaG']);
export const isGalaxy = (otype) => GALAXY_OTYPES.has(otype);

const STAGE_T = { a: 1, ab: 2, b: 3, bc: 4, c: 5, cd: 6, d: 7, dm: 8, m: 9 };

function fromT(T, bar) {
  if (T <= -4) return { family: 'E', T: -5, bar: false };
  if (T <= 0) return { family: 'S0', T: -2, bar };
  if (T >= 10) return { family: 'Irr', T: 10, bar };
  return { family: 'S', T, bar };
}

/** "SB(rs)bc" → { family: 'S', T: 4, bar: true }. Aile: E, S0, S, Irr. Ayrıştırılamazsa null. */
export function parseMorph(s) {
  const m = s?.trim();
  if (!m) return null;
  if (/^-?\d+(\.\d+)?$/.test(m)) return fromT(Math.round(parseFloat(m)), false);   // yalnız T sayısı
  if (/^(c?D|E)/.test(m)) return { family: 'E', T: -5, bar: false };
  const bar = /^[SI](AB|B)/.test(m);
  if (/^I/.test(m)) return { family: 'Irr', T: 10, bar };
  if (/^S(A|B|AB)?0/.test(m)) return { family: 'S0', T: -2, bar };
  if (/^S/.test(m)) {
    const rest = m.replace(/^S(AB|A|B)?/, '').replace(/\([^)]*\)/g, '').replace(/^[:\s]+/, '');
    const st = /^(ab|bc|cd|dm|a|b|c|d|m)/.exec(rest);
    return { family: 'S', T: st ? STAGE_T[st[1]] : 4, bar };
  }
  return null;
}

const UNIT_MPC = { pc: 1e-6, kpc: 1e-3, Mpc: 1 };

/**
 * SIMBAD mesDistance satırları ve cz (km/s) → { value Mpc, method, n } ya da null.
 * Yakın gökadalarda özel hızlar Hubble akışıyla karşılaştırılabilir olduğu için "redshift"
 * yöntemli satırlar, başka ölçüm varsa dışlanır (M33: 4,11 yerine Sefeid 0,84 Mpc).
 */
export function pickGalaxyDistanceMpc(rows, cz) {
  const conv = rows.map((r) => ({ d: Number(r.dist) * (UNIT_MPC[String(r.unit).trim()] ?? NaN), z: /redshift/i.test(r.method ?? '') }))
    .filter((r) => r.d > 0);
  const median = (xs) => { const s = xs.sort((a, b) => a - b), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
  const direct = conv.filter((r) => !r.z).map((r) => r.d);
  if (direct.length) return { value: median(direct), method: 'measured', n: direct.length };
  if (cz > 1000) return { value: cz / COSMO.H0, method: 'hubble', n: 0 };
  const zrows = conv.map((r) => r.d);
  return zrows.length ? { value: median(zrows), method: 'redshift', n: zrows.length } : null;
}

/** Görünen eksen oranından eğiklik (Hubble 1926), içsel kalınlık q0 = 0,2. Derece. */
export function inclinationDeg(q, q0 = 0.2) {
  const c2 = clamp((q * q - q0 * q0) / (1 - q0 * q0), 0, 1);
  return Math.acos(Math.sqrt(c2)) * 180 / Math.PI;
}

/** Düz ΛCDM'de geriye bakış süresi (milyar yıl): ∫ dz / ((1+z) E(z)), Simpson kuralı. */
export function lookbackGyr(z) {
  if (!(z > 0)) return 0;
  const E = (x) => Math.sqrt(COSMO.Om * (1 + x) ** 3 + (1 - COSMO.Om));
  const f = (x) => 1 / ((1 + x) * E(x));
  const n = 200, h = z / n;
  let s = f(0) + f(z);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(i * h);
  return HUBBLE_GYR * s * h / 3;
}

/**
 * g: { morph, majArcmin, minArcmin, cz km/s, z, mags: { B?, V? }, distances: mesDistance satırları }.
 */
export function deriveGalaxy(g) {
  const morph = parseMorph(g.morph);
  const dist = pickGalaxyDistanceMpc(g.distances ?? [], g.cz);
  const distanceMpc = dist
    ? { ...val(dist.value, { measured: 'measured', hubble: 'derived', redshift: 'estimated' }[dist.method]), method: dist.method, n: dist.n }
    : null;
  const dKpc = distanceMpc ? distanceMpc.value * 1e3 : null;
  const diameterKpc = dKpc && g.majArcmin ? val(g.majArcmin * ARCMIN_RAD * dKpc, 'derived') : null;
  const disk = morph && morph.family !== 'E';
  const q = g.majArcmin && g.minArcmin ? g.minArcmin / g.majArcmin : null;
  // Şişkinlik baskın türlerde (T ≤ 1) görünen biçimi şişkinlik belirler; Hubble yöntemi diski varsayar
  const inclination = disk && q ? val(inclinationDeg(q), morph.T <= 1 ? 'estimated' : 'derived') : null;

  // Mutlak B parlaklığı; yıldızlararası ve iç sönümleme yok sayılır (kartta yazılır)
  const B = g.mags?.B;
  const absB = dKpc && B != null ? val(B - 5 * Math.log10(dKpc * 1e3) + 5, 'derived') : null;
  const lumB = absB ? val(10 ** (-0.4 * (absB.value - MB_SUN)), 'derived') : null;

  // Tully–Fisher (Tully & Pierce 2000, B): M_B = −7,48 (log W − 2,5) − 19,55, W = 2 V; yalnız sarmallarda
  const vRot = absB && morph?.family === 'S'
    ? val(10 ** (2.5 + (-19.55 - absB.value) / 7.48) / 2, 'estimated') : null;
  // Dinamik kütle M = V² R / G, R = optik yarıçap
  const dynMass = vRot && diameterKpc
    ? val((vRot.value * 1e3) ** 2 * (diameterKpc.value / 2 * 3.0857e19) / 6.674e-11 / 1.989e30, 'estimated') : null;

  const z = g.z ?? (g.cz != null ? g.cz / C_KMS : null);
  const lookback = z > 0.001 ? val(lookbackGyr(z), 'derived') : null;
  return { morph, distanceMpc, diameterKpc, axisRatio: q ?? 1, inclination, absB, lumB, vRot, dynMass, z, lookback };
}
