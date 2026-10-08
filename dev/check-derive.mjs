// node dev/check-derive.mjs — derive.js için yayımlanmış değerlerle karşılaştırma
import assert from 'node:assert/strict';
import { deriveStar, parseSpType, teffFromSpType, bolometricCorrection, starVisualParams } from '../js/star/derive.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);

// Tayf türü ayrıştırma
assert.deepEqual(parseSpType('M1-M2Ia-Iab'), { cls: 'M', sub: 1, lum: 'I' });
assert.deepEqual(parseSpType('A0Va'), { cls: 'A', sub: 0, lum: 'V' });
assert.deepEqual(parseSpType('K1.5IIIFe-0.5'), { cls: 'K', sub: 1.5, lum: 'III' });
assert.deepEqual(parseSpType('F7:Ib-IIv SB'), { cls: 'F', sub: 7, lum: 'I' });
assert.equal(parseSpType(''), null);
near(teffFromSpType('G2V'), 5700, 5850, 'G2V Teff');

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
assert.equal(betel.M, null);
assert.ok(betel.periodDays.value > 1000, 'Betelgeuse dönme süresi binlerce gün');
assert.ok(betel.scaleHeightKm.value > 5e5, 'Betelgeuse ölçek yüksekliği Güneşinkinin binlerce katı');

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
