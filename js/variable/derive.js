// Değişen yıldızlar (saf fonksiyonlar): VSX türünden aile, şematik ışık eğrisi, dönem–ışıma (P–L)
// bağıntılarından uzaklık, sonraki en parlak / en sönük an ve modeldeki zonklama genliği.

const val = (value, origin) => (value == null || !Number.isFinite(value) ? null : { value, origin });

// VSX tür kodu → aile. Belirsiz türler ("DCEP:") ve birleşikler ("EA+BY") ilk koda göre.
const FAMILY = {
  DCEP: 'cep', DCEPS: 'cep', CEP: 'cep', 'DCEP(B)': 'cep', 'CEP(B)': 'cep',
  CWA: 't2cep', CWB: 't2cep', CW: 't2cep', RV: 't2cep', RVA: 't2cep', RVB: 't2cep',
  RRAB: 'rrab', RRC: 'rrc', RRD: 'rrc', RR: 'rrab',
  M: 'mira',
  SR: 'sr', SRA: 'sr', SRB: 'sr', SRC: 'sr', SRD: 'sr', SRS: 'sr',
  DSCT: 'dsct', DSCTC: 'dsct', HADS: 'dsct', SXPHE: 'dsct',
  EA: 'ea', EB: 'eb', EW: 'ew', E: 'ea', ELL: 'ell',
  ROT: 'rot', BY: 'rot', RS: 'rot', ACV: 'rot', SXARI: 'rot',
  L: 'irr', LB: 'irr', LC: 'irr', I: 'irr', IN: 'irr', INA: 'irr', INB: 'irr', IS: 'irr', GCAS: 'irr', BE: 'irr', UV: 'irr', UVN: 'irr',
};

export function family(type) {
  const code = String(type ?? '').toUpperCase().split(/[|+:/\s]/)[0];
  return FAMILY[code] ?? FAMILY[code.replace(/\(.*\)$/, '')] ?? 'other';
}

/** Aile bir zonklayan mı (yarıçap değişir)? */
export const pulsates = (fam) => ['cep', 't2cep', 'rrab', 'rrc', 'mira', 'sr', 'dsct'].includes(fam);

/**
 * Şematik ışık eğrisi: evre φ (0–1) → sönüklük s (0 en parlak, 1 en sönük).
 * Zonklayanlarda φ = 0 en parlak an (VSX dönem başlangıcı), örtenlerde φ = 0 baş tutulma (en sönük).
 */
export function lightCurve(fam, phi) {
  const v = rawCurve(fam, ((phi % 1) + 1) % 1);
  return v == null ? null : Math.min(1, Math.max(0, v));
}

function rawCurve(fam, p) {
  // Yavaş sönme, hızlı parlama; uçlar kosinüsle yuvarlatılır
  const saw = (rise) => { const x = p < 1 - rise ? p / (1 - rise) : (1 - p) / rise; return 0.5 - 0.5 * Math.cos(Math.PI * x); };
  const dip = (x, w) => Math.exp(-0.5 * (x / w) ** 2);
  switch (fam) {
    case 'cep': case 't2cep': return saw(0.3);
    case 'rrab': return saw(0.15);
    case 'mira': return saw(0.4);
    case 'rrc': case 'sr': case 'dsct': case 'rot': case 'ell': return 0.5 - 0.5 * Math.cos(2 * Math.PI * p);
    case 'ea': return Math.max(dip(Math.min(p, 1 - p), 0.035), 0.12 * dip(p - 0.5, 0.035));
    case 'eb': return Math.max(0.45 * (1 - Math.cos(4 * Math.PI * p)) / 2, dip(Math.min(p, 1 - p), 0.07));
    case 'ew': return p < 0.25 || p > 0.75 ? (1 + Math.cos(4 * Math.PI * p)) / 2 : 0.85 * (1 + Math.cos(4 * Math.PI * p)) / 2;
    default: return null;
  }
}

/** Eğri boyunca sönüklüğün ortalaması (ortalama kadir için). */
export function meanDimming(fam) {
  let s = 0;
  for (let k = 0; k < 200; k++) s += lightCurve(fam, k / 200) ?? 0.5;
  return s / 200;
}

/**
 * Dönem–ışıma bağıntısıyla mutlak parlaklık. Dönüş { M, band, ref } ya da null.
 * Klasik Sefeid: M_V = −2,43 (log P − 1) − 4,05 (Benedict+ 2007)
 * RR Lyrae: M_V = 0,23 [Fe/H] + 0,93 (Chaboyer 1999); [Fe/H] yoksa −1,5 varsayılır
 * Mira: M_K = −3,51 (log P − 2,38) − 7,25 (Whitelock+ 2008)
 * δ Scuti (yüksek genlikli): M_V = −2,89 log P − 1,31 (McNamara 2011)
 */
export function plMagnitude(fam, P, feh = null) {
  if (!(P > 0)) return null;
  const lp = Math.log10(P);
  if (fam === 'cep') return { M: -2.43 * (lp - 1) - 4.05, band: 'V', ref: 'Benedict+ 2007' };
  if (fam === 'rrab' || fam === 'rrc') return { M: 0.23 * (feh ?? -1.5) + 0.93, band: 'V', ref: 'Chaboyer 1999' };
  if (fam === 'mira') return { M: -3.51 * (lp - 2.38) - 7.25, band: 'K', ref: 'Whitelock+ 2008' };
  if (fam === 'dsct' && P < 0.3) return { M: -2.89 * lp - 1.31, band: 'V', ref: 'McNamara 2011' };
  return null;
}

/** Sonraki olay (JD): epoch + n·P ≥ jd. */
export const nextEvent = (epoch, P, jd) => (epoch != null && P > 0 ? epoch + Math.ceil((jd - epoch) / P) * P : null);

/**
 * v: { type, max, min, minIsAmp, band, P (gün), epoch (JD) } — VSX; mags: SIMBAD parlaklıkları;
 * av: yıldızın sönümlemesi (A_V, yoksa 0); feh; jd: şimdi.
 */
export function deriveVariable(v, mags = {}, av = 0, feh = null, jd = null) {
  const fam = family(v.type);
  const amp = v.max != null && v.min != null ? (v.minIsAmp ? v.min : v.min - v.max) : null;
  const curve = lightCurve(fam, 0) != null && v.P > 0;
  // Ortalama V: VSX en parlak + genlik × eğrinin ortalama sönüklüğü; yoksa SIMBAD V
  const meanV = v.max != null && amp != null && /^V/i.test(v.band ?? 'V') ? v.max + amp * meanDimming(fam) : mags.V ?? null;
  const pl = plMagnitude(fam, v.P, feh);
  let distPl = null;
  if (pl) {
    const m = pl.band === 'K' ? mags.K : meanV;
    const A = pl.band === 'K' ? 0.112 * av : av;   // A_K / A_V = 0,112 (Cardelli+ 1989)
    if (m != null) distPl = 10 ** ((m - pl.M - A + 5) / 5);
  }
  const eclipsing = ['ea', 'eb', 'ew'].includes(fam);
  return {
    fam, eclipsing, curve,
    period: val(v.P, 'measured'), amp: val(amp, 'measured'), meanV: val(meanV, 'derived'),
    absMag: pl ? { value: pl.M, origin: 'estimated', band: pl.band, ref: pl.ref } : null,
    distPl: val(distPl, 'estimated'),
    // Zonklayanlarda epoch en parlak an, örtenlerde en sönük an
    nextMax: !eclipsing ? val(nextEvent(v.epoch, v.P, jd), 'derived') : null,
    nextMin: eclipsing ? val(nextEvent(v.epoch, v.P, jd), 'derived') : null,
  };
}

// Yarıçap değişimi oranı (ΔR/R, tepeden tepeye yarısı): gözlenen tipik değerler
const RADIUS_AMP = { cep: 0.08, t2cep: 0.1, rrab: 0.12, rrc: 0.07, mira: 0.2, sr: 0.08, dsct: 0.03 };

/** Yıldız sahnesine zonklama parametreleri: { periodS, amp (kadir), ar, fam } ya da null. */
export function pulseParams(vd) {
  if (!pulsates(vd.fam) || !(vd.period?.value > 0) || !(vd.amp?.value > 0)) return null;
  return { periodS: vd.period.value * 86400, amp: Math.min(vd.amp.value, 6), ar: RADIUS_AMP[vd.fam] ?? 0.05, fam: vd.fam };
}

const C2_V = 26160;   // hc / (λ k), λ = 550 nm (V bandı), kelvin
// V genliğinin sıcaklık değişimine düşen payı. Soğuk yıldızlarda (Mira, yarı düzenli) genliğin
// yaklaşık yarısı TiO gibi moleküllerin oluşup dağılmasından gelir (Reid & Goldston 2002); bu pay
// sıcaklığa yazılırsa Mira 1400–6300 K arasında salınır (gözlenen ~2400–3200 K).
// ponytail: aile başına tek sabit; yıldızın kendi tayf evrelerinden çözmek gerekirse buraya gelir
const TEMP_SHARE = { mira: 0.5, sr: 0.5 };
const BRIGHT_CAP_MAG = 1.25;   // sahnede gösterilen parlaklık değişimi (Mira'nın 6 kadiri ekrana sığmaz)

/**
 * Zonklama anındaki ölçekler: evre φ → { rScale, tScale, bright }. teff: yıldızın ortalama sıcaklığı (K).
 * Işık eğrisi V bandı akısını verir; yarıçap sinüsle değişir (en büyük yarıçap en parlaktan ~0,4 evre
 * sonra). Sıcaklık, V akısı ∝ R² / (e^(hc/λkT) − 1) bağıntısının tersinden çözülür: V bandı soğuk
 * yıldızlarda Planck eğrisinin dik (Wien) yanında olduğu için küçük bir sıcaklık değişimi büyük bir
 * genlik verir; toplam ışıma (T⁴) varsayımı sıcaklığı fazla oynatıyordu.
 * bright: yüzey parlaklığı çarpanı (ortalama = 1), ±1,25 kadirle sınırlı.
 */
export function pulseState(pp, phi, teff = 5772) {
  const s = lightCurve(pp.fam, phi), mean = meanDimming(pp.fam);
  const dm = pp.amp * (s - mean);   // ortalamaya göre kadir, + sönük
  const r = 1 + pp.ar * Math.sin(2 * Math.PI * (phi - 0.15));
  const surf = 10 ** (-0.4 * (TEMP_SHARE[pp.fam] ?? 1) * dm) / (r * r);   // sıcaklığın açıklaması gereken yüzey parlaklığı oranı
  const T = C2_V / Math.log1p(Math.expm1(C2_V / teff) / surf);
  const shown = Math.min(BRIGHT_CAP_MAG, Math.max(-BRIGHT_CAP_MAG, dm));
  return { rScale: r, tScale: T / teff, bright: 10 ** (-0.4 * shown) / (r * r) };
}
