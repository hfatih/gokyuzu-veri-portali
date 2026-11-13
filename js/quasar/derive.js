// Kuasar fiziği: düz ΛCDM'de kırmızıya kaymadan uzaklıklar (eş hareketli, ışıma, açısal çap), ölçek,
// geriye bakış ve o anki evren yaşı; K düzeltmeli mutlak parlaklık, 5100 Å ışıması, bolometrik ışıma
// ve Eddington kütlesi; Lyα'nın gözlenen dalga boyu. Ağ ya da DOM bilgisi yoktur.

import { COSMO, lookbackGyr, comovingMpc } from '../galaxy/derive.js';
import { visibleAbsorbed } from './spectrum.js';

const val = (value, origin) => (value == null || !Number.isFinite(value) ? null : { value, origin });

const MPC_M = 3.0857e22, LSUN = 3.828e26, LY_MPC = 3.2616e6;
const HUBBLE_GYR = 977.8 / COSMO.H0;
const OL = 1 - COSMO.Om;

// Varsayımlar (kartta yazılır)
export const ASSUME = {
  alphaNu: -0.5,       // optik süreklilik eğimi f_ν ∝ ν^α (K düzeltmesi ve 5100 Å'a taşıma)
  bc5100: 9.26,        // bolometrik düzeltme L_bol / λL_λ(5100 Å) (Richards ve ark. 2006)
};

const TYPES = new Set(['QSO', 'Q?', 'Bla', 'BLL', 'Bz?', 'BL?']);
/** SIMBAD türü kuasar ya da blazar mı? (Seyfert ve AGN gökada olarak kalır.) */
export const isQuasar = (otype) => TYPES.has(otype);

const BLAZAR = new Set(['Bla', 'BLL', 'Bz?', 'BL?']);
/** Blazar: jeti bakış doğrultusuna yakın (birkaç derece) kuasar. */
export const isBlazar = (otype) => BLAZAR.has(otype);
/**
 * Göreli jet beklenir mi? Blazarlarda evet; diğerlerinde 3C / 4C / PKS radyo kataloglarında adı varsa
 * (kuasar uzaklığında bu kataloglara girmek güçlü radyo kaynağı, yani jet demektir). Kuasarların
 * yaklaşık %10'u radyoda güçlüdür; adı bu kataloglarda olmayan jetli kuasar kaçırılır.
 */
export const hasJet = (otype, ids = []) => isBlazar(otype) || ids.some((id) => /^(3C|4C|PKS)\s/.test(id));

// Parlaklık bandı tercihi ve etkin dalga boyu (nm); hepsi AB sayılır (Vega farkı < 0,2 kadir)
const BANDS = [['g', 477], ['V', 551], ['G', 623], ['r', 623], ['B', 445], ['R', 658], ['i', 763]];

export { comovingMpc };   // tanımı galaxy/derive.js'te; uzak gökadalar da kullanır

/** z anındaki evren yaşı (milyar yıl), düz ΛCDM'de analitik. */
export const ageGyr = (z) => HUBBLE_GYR * 2 / (3 * Math.sqrt(OL)) * Math.asinh(Math.sqrt(OL / COSMO.Om) * (1 + z) ** -1.5);

/** q: { z, mags: { g?, V?, … } }. z yoksa null. */
export function deriveQuasar(q) {
  const z = q.z;
  if (!(z > 0)) return null;
  const dc = comovingMpc(z), dl = dc * (1 + z), da = dc / (1 + z);
  const band = BANDS.find(([b]) => Number.isFinite(q.mags?.[b]));
  let absMag = null, nuLnu5100 = null;
  if (band) {
    const [b, lnm] = band, m = q.mags[b];
    const K = -2.5 * (1 + ASSUME.alphaNu) * Math.log10(1 + z);
    absMag = m - 5 * Math.log10(dl * 1e5) - K;
    // νL_ν gözlenen bantta → durgun λ = λ_göz/(1+z); νL_ν ∝ λ^−(1+α) ile 5100 Å'a taşınır
    const nuFnu = 3631e-26 * 10 ** (-0.4 * m) * 2.998e17 / lnm;          // W/m²
    const lr = lnm / (1 + z);
    nuLnu5100 = 4 * Math.PI * (dl * MPC_M) ** 2 * nuFnu * (lr / 510) ** (1 + ASSUME.alphaNu);
  }
  const lbol = nuLnu5100 && ASSUME.bc5100 * nuLnu5100;
  return {
    z: val(z, 'measured'),
    band: band?.[0] ?? null,
    lookbackGyr: val(lookbackGyr(z), 'derived'),
    ageThenGyr: val(ageGyr(z), 'derived'),
    comovingGly: val(dc * LY_MPC / 1e9, 'derived'),
    lumDistGly: val(dl * LY_MPC / 1e9, 'derived'),
    kpcPerArcsec: val(da * 1e3 * Math.PI / 648000, 'derived'),
    absMag: val(absMag, 'estimated'),
    lbolW: val(lbol, 'estimated'),
    lbolLsun: val(lbol && lbol / LSUN, 'estimated'),
    massEdd: val(lbol && lbol / 1.26e31, 'estimated'),
    lyaNm: val(121.567 * (1 + z), 'derived'),
    visAbsorbed: val(visibleAbsorbed(z), 'derived'),
    distLy: dl * LY_MPC,
  };
}
