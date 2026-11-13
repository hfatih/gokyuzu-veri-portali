// Pulsar fiziği (dönen manyetik dipol): karakteristik yaş, yüzey manyetik alanı, dönme
// enerjisi kaybı, ışık silindiri, kutup başlığı, ekvator hızı, ölüm çizgisi, ışın genişliği,
// dağılma gecikmesi ve dik hız. Girdi ATNF kataloğunun (VizieR B/psr) satırıdır.
// Ağ ya da DOM bilgisi yoktur; alanlar { value, origin } ya da null.

const val = (value, origin) => (value == null || !Number.isFinite(value) ? null : { value, origin });

const C = 2.998e8, G = 6.674e-11, MSUN = 1.989e30, YEAR_S = 3.156e7, LSUN = 3.828e26;
const B_Q = 4.414e13;   // kuantum kritik alan m²c³/(eħ), G

// Varsayımlar (kartta yazılır). I ve R, ATNF'nin türetilmiş sütunlarıyla aynı kanonik değerler.
export const ASSUME = {
  massSun: 1.4,
  radiusKm: 10,
  inertia: 1e38,        // eylemsizlik momenti, kg m² (10⁴⁵ g cm²)
  alphaDeg: 45,         // manyetik eksenin dönme eksenine eğikliği (çoğu pulsarda ölçülmedi)
};

/** SIMBAD türü pulsar mı? (Nötron yıldızı adayları N* ayrı; katalogda dönem yoksa kart boş kalır.) */
export const isPulsar = (otype) => otype === 'Psr' || otype === 'N*';

/**
 * Sınıf: ATNF tür kodu AXP ise magnetar, XINS ise sönük ısıl nötron yıldızı; P < 30 ms ve B < 10¹⁰ G
 * ise geri dönüştürülmüş milisaniye pulsarı; karakteristik yaş < 10⁵ yıl ise genç; aksi halde olağan.
 */
export function pulsarClass(r, B, tau) {
  const type = r.Type ?? '';
  if (/AXP/.test(type)) return 'magnetar';
  if (/XINS/.test(type)) return 'xins';
  if (r.P0 < 0.03 && (B == null || B < 1e10)) return 'msp';
  if (tau != null && tau < 1e5) return 'young';
  return 'normal';
}

/** Sıkılık u = r_s / R = 2GM / (R c²); varsayılan nötron yıldızında 0,41. */
export const compactness = (massSun = ASSUME.massSun, radiusKm = ASSUME.radiusKm) => 2 * G * massSun * MSUN / (radiusKm * 1e3 * C * C);

/**
 * Işık bükülmesi yüzünden uzaktaki gözlemcinin aynı anda gördüğü yüzey payı. Beloborodov (2002):
 * 1 − cos α = (1 − cos ψ)(1 − u); α yüzey normaliyle çıkış açısı, ψ noktanın bakış doğrultusuna açısı.
 * Kenar (α = 90°) cos ψ = −u / (1 − u) noktasındadır; düz uzayda (u = 0) yarım küre görülür.
 */
export const visibleFraction = (u) => Math.min(1, (1 + u / (1 - u)) / 2);

/** r: ATNF satırı { P0 (s), P1, DM, Dist (kpc), Plx (mas), PMTot (mas/yr), W50 (ms), PB (gün), Ecc, minM, medM, NGlt, Type, BINCOMP }. */
export function derivePulsar(r) {
  const P = r.P0, Pd = r.P1 > 0 ? r.P1 : null;
  const R = ASSUME.radiusKm * 1e3, M = ASSUME.massSun * MSUN;
  const tau = Pd ? P / (2 * Pd) / YEAR_S : null;
  const B = Pd ? 3.2e19 * Math.sqrt(P * Pd) : null;                 // G, ekvatorda dipol
  const edot = Pd ? 4 * Math.PI ** 2 * ASSUME.inertia * Pd / P ** 3 : null;   // W
  const rlc = C * P / (2 * Math.PI);                                 // m
  const omega = 2 * Math.PI / P;
  const dist = r.Dist > 0 ? r.Dist : null;                           // kpc
  // Ölüm çizgisi (Chen & Ruderman 1993, yaklaşık): B/P² < 0,17 × 10¹² G s⁻² ise radyo yayımı sönmeli
  const deathRatio = B ? B / P ** 2 / 0.17e12 : null;
  // Işın yarı genişliği, dış koni (Rankin 1993): ρ = 5,75° P^−½; yarım küreyle sınırlı
  const rho = Math.min(90, 5.75 / Math.sqrt(P));
  const dmDelay = r.DM > 0 ? 4.1488e3 * r.DM * (400 ** -2 - 1400 ** -2) : null;   // s, 400 ile 1400 MHz arası
  const tauVal = val(tau, 'derived');
  // Kütleçekimsel ışık bükülmesi (varsayılan 1,4 M☉, 10 km için): sıkılık u = r_s / R
  const u = compactness();
  return {
    cls: pulsarClass(r, B, tau),
    binary: r.PB > 0,
    periodS: val(P, 'measured'),
    pdot: val(Pd, 'measured'),
    freqHz: val(1 / P, 'derived'),
    ageYr: tauVal,
    bGauss: val(B, 'derived'),
    bQuantum: val(B && B / B_Q, 'derived'),
    edotW: val(edot, 'derived'),
    edotLsun: val(edot && edot / LSUN, 'derived'),
    rlcKm: val(rlc / 1e3, 'derived'),
    rlcOverR: val(rlc / R, 'derived'),
    capDeg: val(Math.asin(Math.sqrt(Math.min(1, R / rlc))) * 180 / Math.PI, 'derived'),
    vEqC: val(omega * R / C, 'derived'),
    spinGravity: val(omega ** 2 * R ** 3 / (G * M), 'derived'),      // ekvatorda merkezkaç / kütleçekim
    deathRatio: val(deathRatio, 'estimated'),
    beamDeg: val(rho, 'estimated'),
    dutyCycle: val(r.W50 > 0 ? r.W50 / 1e3 / P : null, 'measured'),
    w50Ms: val(r.W50 > 0 ? r.W50 : null, 'measured'),
    distKpc: val(dist, r.Plx > 0 ? 'measured' : 'estimated'),
    distFromPlx: r.Plx > 0,
    dm: val(r.DM > 0 ? r.DM : null, 'measured'),
    dmDelayS: val(dmDelay, 'derived'),
    neCm3: val(dist && r.DM > 0 ? r.DM / (dist * 1e3) : null, 'derived'),
    vTransKms: val(dist && r.PMTot > 0 ? 4.74 * r.PMTot * dist : null, 'derived'),
    pbDays: val(r.PB > 0 ? r.PB : null, 'measured'),
    ecc: val(r.PB > 0 ? r.Ecc : null, 'measured'),
    minCompanion: val(r.minM > 0 ? r.minM : null, 'derived'),
    glitches: val(r.NGlt > 0 ? r.NGlt : null, 'measured'),
    surfaceZ: val(1 / Math.sqrt(1 - u) - 1, 'estimated'),          // yüzeyden kaçan ışığın kırmızıya kayması
    visibleFraction: val(visibleFraction(u), 'estimated'),         // aynı anda görülen yüzey payı
    apparentRadiusKm: val(ASSUME.radiusKm / Math.sqrt(1 - u), 'estimated'),
  };
}
