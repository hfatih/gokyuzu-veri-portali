// node dev/check-derive.mjs — derive.js için yayımlanmış değerlerle karşılaştırma
import assert from 'node:assert/strict';
import { deriveStar, parseSpType, teffFromSpType, bolometricCorrection, starVisualParams, intrinsicBV, extinctionAV } from '../js/star/derive.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);

// Tayf türü ayrıştırma
assert.deepEqual(parseSpType('M1-M2Ia-Iab'), { cls: 'M', sub: 1, lum: 'I' });
assert.deepEqual(parseSpType('A0Va'), { cls: 'A', sub: 0, lum: 'V' });
assert.deepEqual(parseSpType('K1.5IIIFe-0.5'), { cls: 'K', sub: 1.5, lum: 'III' });
assert.deepEqual(parseSpType('F7:Ib-IIv SB'), { cls: 'F', sub: 7, lum: 'I' });
assert.equal(parseSpType(''), null);
near(teffFromSpType('G2V'), 5700, 5850, 'G2V Teff');
// Dev ve süperdev ölçekleri: Arcturus K1.5III (ölçülen 4286 K), Aldebaran K5III (~3900–4050 K),
// Rigel B8Ia (~12 100 K), Betelgeuse M1–M2Ia (~3600 K). Anakoldaki K1.5V ~5100 K olurdu.
near(teffFromSpType('K1.5III'), 4250, 4600, 'Arcturus Teff (dev tablosu)');
near(teffFromSpType('K5III'), 3900, 4150, 'Aldebaran Teff');
near(teffFromSpType('B8Ia'), 10500, 13000, 'Rigel Teff');
near(teffFromSpType('M1-M2Ia-Iab'), 3550, 3800, 'Betelgeuse Teff');
assert.ok(teffFromSpType('K1.5V') > teffFromSpType('K1.5III') + 500, 'dev anakoldan soğuk');

// Kendi rengi ve sönümleme: Güneş (B−V)₀ 0,65; ζ Oph O9.5V (B−V 0,02, E(B−V) 0,32; Teff ~34 000 K)
near(intrinsicBV(5772), 0.6, 0.7, 'Güneş (B−V)₀');
near(intrinsicBV(34000), -0.33, -0.29, 'O9.5V (B−V)₀');
near(extinctionAV(2.58, 2.56, 34000), 0.85, 1.15, 'ζ Oph A_V');
assert.equal(extinctionAV(-1.46, -1.46, 9900), null);          // Sirius: kızarma yok
assert.equal(extinctionAV(1.34, 1.25, 8525), null);            // Deneb: renk fazlası eşik altında
assert.equal(extinctionAV(null, 1, 5000), null);

// Bolometrik düzeltme: Güneş için ≈ −0,07 (Torres 2010)
near(bolometricCorrection(5772), -0.12, -0.03, 'BC☉');

// Güneş, 10 pc'den bakılıyor (M_V = 4,81)
const sun = deriveStar({ teff: 5772, logg: 4.44, plx: 100, plxErr: 0.1, sp: 'G2V', mags: { V: 4.81 }, vsini: 2.0 });
near(sun.L.value, 0.95, 1.05, 'L☉');
near(sun.R.value, 0.95, 1.05, 'R☉');
near(sun.scaleHeightKm.value, 110, 160, 'H☉');
assert.equal(sun.L.origin, 'derived');
assert.equal(sun.teff.origin, 'measured');

// Sirius A (SIMBAD: plx 379,21 mas, V −1,46, Teff ~9900 K) — Liebert+2005: R 1,71, L 25,4
const sirius = deriveStar({ teff: 9900, logg: 4.3, plx: 379.21, plxErr: 1.58, sp: 'A0mA1Va', mags: { V: -1.46 }, vsini: 16 });
near(sirius.R.value, 1.5, 2.0, 'Sirius R');
near(sirius.L.value, 20, 32, 'Sirius L');
near(sirius.M.value, 1.6, 2.6, 'Sirius M (tahmini)');
assert.equal(sirius.M.origin, 'estimated');

// Vega (plx 130,23, V 0,03, Teff 9600) — R 2,36–2,82, L ~40
const vega = deriveStar({ teff: 9600, logg: 4.1, plx: 130.23, plxErr: 0.36, sp: 'A0Va', mags: { V: 0.03 }, vsini: 20.5 });
near(vega.R.value, 2.2, 3.2, 'Vega R');
near(vega.L.value, 35, 65, 'Vega L');

// Betelgeuse (plx 6,55, V 0,42, Teff 3633) — R ~640–760; dev olduğu için kütle tahmin edilmez
const betel = deriveStar({ teff: 3633, logg: 0.4, plx: 6.55, plxErr: 0.83, sp: 'M1-M2Ia-Iab', mags: { V: 0.42 }, vsini: 14.3 });
near(betel.R.value, 400, 1100, 'Betelgeuse R');
assert.equal(betel.av, null);   // B parlaklığı verilmedi
// B = 2,27 ile (B−V 1,85): A_V ≈ 0,8 (Levesque+ 2005: 0,62), yarıçap büyür
const betelB = deriveStar({ teff: 3633, logg: 0.4, plx: 6.55, plxErr: 0.83, sp: 'M1-M2Ia-Iab', mags: { V: 0.42, B: 2.27 }, vsini: 14.3 });
near(betelB.av.value, 0.5, 1.1, 'Betelgeuse A_V');
assert.equal(betelB.av.origin, 'estimated');
assert.ok(betelB.R.value > betel.R.value * 1.2, 'sönümleme düzeltmesi yarıçapı büyütür');
assert.equal(betel.M, null);
assert.ok(betel.periodDays.value > 1000, 'Betelgeuse dönme süresi binlerce gün');
assert.ok(betel.scaleHeightKm.value > 5e5, 'Betelgeuse ölçek yüksekliği Güneşinkinin binlerce katı');

// Proxima Centauri (M5.5V; plx 768,07, V 11,13, K 4,38, Teff 2883) — Boyajian+2012: R 0,154, L 0,00155
const prox = deriveStar({ teff: 2883, plx: 768.07, plxErr: 0.03, sp: 'M5.5Ve', mags: { V: 11.13, K: 4.38 } });
near(prox.R.value, 0.13, 0.18, 'Proxima R');
near(prox.L.value, 0.0012, 0.002, 'Proxima L');

// TRAPPIST-1: tayf türünde ışıklılık sınıfı yok ("M7.5e"), log g 5,1 → yine cüce yolu (K bandı)
// Agol+ 2021: R 0,119, L 0,00055
const trap = deriveStar({ teff: 2475, logg: 5.105, plx: 80.2123, plxErr: 0.07, sp: 'M7.5e', mags: { V: 18.798, K: 10.296 } });
near(trap.R.value, 0.1, 0.14, 'TRAPPIST-1 R');

// Paralaks yoksa uzaklık, L, R null; Teff tayf türünden tahmin edilir
const noPlx = deriveStar({ sp: 'K0III', mags: { V: 5 } });
assert.equal(noPlx.distancePc, null);
assert.equal(noPlx.L, null);
assert.equal(noPlx.R, null);
assert.equal(noPlx.teff.origin, 'estimated');

// Zayıf paralaks (ϖ/σ < 5) da güvenilmez sayılır
assert.equal(deriveStar({ teff: 5000, plx: 1, plxErr: 0.5, mags: { V: 9 } }).distancePc, null);

// Görsel parametreler: sıcak yıldızda granülasyon kapalı, soğuk devde iri hücreler
const vv = starVisualParams(vega), bv = starVisualParams(betel), sv = starVisualParams(sun);
assert.equal(vv.granContrast, 0);
assert.ok(bv.granScale < sv.granScale / 5 && sv.granScale > 1000, `hücre sayısı ölçeği: Betelgeuse ${bv.granScale}, Güneş ${sv.granScale}`);
assert.ok(bv.u1 > sv.u1 && sv.u1 > vv.u1, 'kenar kararması soğuk yıldızda daha güçlü');

console.log('derive: tüm kontroller geçti');
