// Bulutsu fiziği: tür, uzaklık seçimi, fiziksel boyut, H II bölgesinin iyonlaştırıcı foton
// gereksinimi (Strömgren), gezegenimsi bulutsunun dinamik yaşı, süpernova kalıntısının evresi ve
// Sedov–Taylor yaşı. Ağ ya da DOM bilgisi yoktur; alanlar { value, origin } ya da null.

const val = (value, origin) => (value == null || !Number.isFinite(value) ? null : { value, origin });
const PC_CM = 3.0857e18, PC_KM = 3.0857e13, YEAR_S = 3.156e7, MSUN_G = 1.989e33, MH_G = 1.6735e-24;
const ARCMIN_RAD = 1 / 3437.747;

// Varsayımlar (kartta yazılır)
export const ASSUME = {
  neHII: 100,          // cm⁻³, genişlemiş H II bölgesi tipik elektron yoğunluğu
  alphaB: 2.6e-13,     // cm³ s⁻¹, B durumu birleşme katsayısı, T = 10⁴ K
  qO7V: 10 ** 48.75,   // s⁻¹, O7V iyonlaştırıcı foton sayısı (Martins+ 2005)
  vExpPN: 20,          // km/s, gezegenimsi bulutsu genişleme hızı
  eSN: 1e51,           // erg, süpernova enerjisi
  nISM: 1,             // cm⁻³, yıldızlararası ortam
  ejectaMsun: 3,       // M☉; süpürülen kütle bunun ~3 katını aşınca Sedov evresi
};

// SIMBAD nesne türü → bulutsu sınıfı
const KINDS = {
  HII: 'hii', GNe: 'hii', SFR: 'hii', bub: 'hii',
  PN: 'pn',
  SNR: 'snr',
  RNe: 'rne',
  DNe: 'dne', MoC: 'dne', Cld: 'dne', glb: 'dne',
};
export const nebulaKind = (otype) => KINDS[otype] ?? null;

const UNIT_PC = { pc: 1, kpc: 1e3, Mpc: 1e6 };

/** SIMBAD mesDistance satırları → pc cinsinden ortanca ve ölçüm sayısı, yoksa null. */
export function pickDistancePc(rows) {
  const v = rows.map((r) => Number(r.dist) * (UNIT_PC[String(r.unit).trim()] ?? NaN)).filter((x) => x > 0).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return { value: v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2, n: v.length };
}

/**
 * n: { kind, majArcmin, minArcmin, distances: mesDistance satırları }.
 * Fiziksel değerler uzaklık ve açısal boyut varsa hesaplanır.
 */
export function deriveNebula(n) {
  const dist = pickDistancePc(n.distances ?? []);
  const distancePc = dist ? { value: dist.value, origin: 'measured', n: dist.n } : null;
  const axisRatio = n.majArcmin && n.minArcmin ? n.minArcmin / n.majArcmin : 1;
  const radiusPc = distancePc && n.majArcmin ? val(n.majArcmin / 2 * ARCMIN_RAD * distancePc.value, 'derived') : null;
  const R = radiusPc?.value;
  const out = { kind: n.kind, distancePc, radiusPc, axisRatio, qIon: null, o7Equiv: null, agePN: null, sweptMsun: null, phase: null, ageSedov: null };
  if (!R) return out;

  if (n.kind === 'hii') {
    // Strömgren: Q = (4π/3) R³ n_e² α_B — bu boyutu iyonlaştırmaya yetecek foton akısı
    const q = 4 / 3 * Math.PI * (R * PC_CM) ** 3 * ASSUME.neHII ** 2 * ASSUME.alphaB;
    out.qIon = val(q, 'estimated');
    out.o7Equiv = val(q / ASSUME.qO7V, 'estimated');
  }
  if (n.kind === 'pn') out.agePN = val(R * PC_KM / ASSUME.vExpPN / YEAR_S, 'estimated');
  if (n.kind === 'snr') {
    const rho = 1.4 * MH_G * ASSUME.nISM;
    const swept = 4 / 3 * Math.PI * (R * PC_CM) ** 3 * rho / MSUN_G;
    out.sweptMsun = val(swept, 'estimated');
    out.phase = swept > 3 * ASSUME.ejectaMsun ? 'sedov' : 'free';
    // Sedov–Taylor: R = 1,15 (E t² / ρ)^(1/5) → t = (R/1,15)^(5/2) (ρ/E)^(1/2); yalnız Sedov evresinde
    if (out.phase === 'sedov') out.ageSedov = val((R * PC_CM / 1.15) ** 2.5 * Math.sqrt(rho / ASSUME.eSN) / YEAR_S, 'estimated');
  }
  return out;
}
