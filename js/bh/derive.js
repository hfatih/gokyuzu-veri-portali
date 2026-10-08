// Kara delik fiziği (Schwarzschild; dönme ölçülmediği için a = 0): olay ufku, foton küresi,
// gölgenin açısal çapı, ISCO ve oradaki yörünge dönemi, Eddington ışıması, ince disk en yüksek
// sıcaklığı, Hawking sıcaklığı ve buharlaşma süresi, ortalama yoğunluk, olay ufkunda gelgit.
// Ağ ya da DOM bilgisi yoktur; alanlar { value, origin } ya da null.

const val = (value, origin) => (value == null || !Number.isFinite(value) ? null : { value, origin });

const G = 6.674e-11, C = 2.998e8, MSUN = 1.989e30, SIGMA = 5.670e-8, HBAR = 1.0546e-34, KB = 1.3806e-23;
const LY_M = 9.4607e15, AU_M = 1.496e11, YEAR_S = 3.156e7;

// Varsayımlar (kartta yazılır)
export const ASSUME = {
  eddRatio: 0.1,    // ince disk, Eddington oranının %10'u
  eta: 0.057,       // Schwarzschild ISCO verimliliği
  bodyM: 2,         // gelgit için cisim boyu (m)
};

/** Kütleye göre sınıf: yıldızsal < 100 M☉ ≤ orta kütleli < 10⁵ M☉ ≤ süper kütleli. */
export const bhClass = (m) => (m < 100 ? 'stellar' : m < 1e5 ? 'intermediate' : 'supermassive');

/** b: { massSun, distLy }. Uzaklık yoksa açısal büyüklükler null. */
export function deriveBlackHole(b) {
  const M = b.massSun * MSUN, GM = G * M;
  const rs = 2 * GM / C ** 2;                                   // m
  const D = b.distLy ? b.distLy * LY_M : null;
  // Gölge yarıçapı √27 GM/c² (Synge 1966); çap 2√27 GM/c²
  const shadowRad = D ? 2 * Math.sqrt(27) * GM / C ** 2 / D : null;
  const isco = 3 * rs;
  const iscoPeriod = 2 * Math.PI * Math.sqrt(isco ** 3 / GM);  // uzak gözlemci zamanı
  const lEdd = 1.26e31 * b.massSun;                             // W
  // Shakura–Sunyaev ince disk: T⁴(r) = 3GMṀ/(8πσr³) (1 − √(r_in/r)), en yüksek r = 49/36 r_in'de
  const mdot = ASSUME.eddRatio * lEdd / (ASSUME.eta * C ** 2);
  const tmax = (3 * GM * mdot / (8 * Math.PI * SIGMA * isco ** 3) * (36 / 49) ** 3 * (1 - 6 / 7)) ** 0.25;
  const hawking = HBAR * C ** 3 / (8 * Math.PI * G * M * KB);
  const evapYr = 5120 * Math.PI * G ** 2 * M ** 3 / (HBAR * C ** 4) / YEAR_S;
  const density = M / (4 / 3 * Math.PI * rs ** 3);
  const tidal = 2 * GM * ASSUME.bodyM / rs ** 3;               // olay ufkunda baş–ayak ivme farkı

  return {
    cls: bhClass(b.massSun),
    massSun: val(b.massSun, 'measured'),
    distLy: val(b.distLy, 'measured'),
    rsKm: val(rs / 1e3, 'derived'),
    rsAU: val(rs / AU_M, 'derived'),
    shadowUas: val(shadowRad && shadowRad * 206264.806 * 1e6, 'derived'),
    iscoKm: val(isco / 1e3, 'derived'),
    iscoPeriodS: val(iscoPeriod, 'derived'),
    lEddW: val(lEdd, 'derived'),
    diskTmax: val(tmax, 'estimated'),
    hawkingK: val(hawking, 'derived'),
    evapYr: val(evapYr, 'derived'),
    density: val(density, 'derived'),
    tidalG: val(tidal / 9.807, 'derived'),
  };
}
