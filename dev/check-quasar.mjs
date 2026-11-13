// node dev/check-quasar.mjs — kuasar: ΛCDM uzaklıkları (Wright 2006 hesaplayıcısı, H0 70, Ωm 0,3), 3C 273 ışıması, tayf rengi
import assert from 'node:assert/strict';
import { deriveQuasar, comovingMpc, ageGyr, isQuasar } from '../js/quasar/derive.js';
import { observedRgb, visibleAbsorbed, igmTransmission, restFlux } from '../js/quasar/spectrum.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);

// z = 1: D_C 3303,8 Mpc, o anki yaş 5,75 milyar yıl, bugünkü yaş 13,47; ölçek 8,01 kpc/″
near(comovingMpc(1), 3295, 3312, 'D_C(z=1)');
near(ageGyr(1), 5.7, 5.8, 'yaş(z=1)');
near(ageGyr(0), 13.4, 13.55, 'evrenin yaşı');
const z1 = deriveQuasar({ z: 1, mags: {} });
near(z1.kpcPerArcsec.value, 7.95, 8.05, 'ölçek z=1');
near(z1.lookbackGyr.value + z1.ageThenGyr.value, 13.4, 13.55, 'geriye bakış + o anki yaş = bugünkü yaş');

// 3C 273 (z 0,158, g 12,99): M ≈ −26,5 (H0 70), λL(5100) ≈ 10^45,9 erg/s → L_bol ~10^46,9 erg/s
const q = deriveQuasar({ z: 0.15756751, mags: { g: 12.99, V: 14.83 } });
assert.equal(q.band, 'g');
near(q.absMag.value, -27.2, -25.8, '3C 273 mutlak parlaklık');
near(Math.log10(q.lbolW.value * 1e7), 46.5, 47.2, '3C 273 log L_bol (erg/s)');
near(Math.log10(q.massEdd.value), 8.3, 9.2, '3C 273 Eddington kütlesi');

// Lyα: z 7,54 kuasarında 1038 nm (yakın kızılöte); görünür ışık tümüyle soğurulmuş
const far = deriveQuasar({ z: 7.54, mags: {} });
near(far.lyaNm.value, 1035, 1040, 'Lyα gözlenen');
assert.ok(far.visAbsorbed.value > 0.99, 'z 7,5: görünür ışık soğurulmuş');
assert.ok(visibleAbsorbed(0.2) < 0.01, 'z 0,2: soğurma yok');
assert.equal(igmTransmission(900, 3), 0);           // Lyman sınırının altı
assert.ok(restFlux(1216) > 5 * restFlux(1300), 'Lyα çizgisi sürekliliğin çok üstünde');

// Renk: yakın kuasar mavi-beyaz (mavi ≥ kırmızı); z ~ 3,5'te Lyα ormanı maviyi keser, kızıllaşır
const [r0, , b0] = observedRgb(0.16), [r3, , b3] = observedRgb(3.5);
assert.ok(b0 >= r0 * 0.8, `z 0,16 rengi: ${observedRgb(0.16)}`);
assert.ok(r3 > b3, `z 3,5 rengi kırmızımsı: ${observedRgb(3.5)}`);

assert.ok(isQuasar('QSO') && isQuasar('BLL') && !isQuasar('Sy1'));
assert.equal(deriveQuasar({ z: null, mags: {} }), null);

console.log('quasar: tüm kontroller geçti');

// Jet: blazar türleri ve radyo kataloğu adları; sıradan (radyoda sessiz) kuasarda yok
{
  const { hasJet, isBlazar } = await import('../js/quasar/derive.js');
  assert.equal(hasJet('BLL', []), true); assert.equal(isBlazar('Bla'), true); assert.equal(isBlazar('QSO'), false);
  assert.equal(hasJet('QSO', ['QSO B1226+023', '3C 273', 'PG 1226+023']), true);
  assert.equal(hasJet('QSO', ['PKS 1127-14']), true);
  assert.equal(hasJet('QSO', ['SDSS J114816.64+525150.3', 'QSO J1148+5251']), false);
  // Doppler güçlenmesi (Γ = 2, α = 0,7): 20° açıda yaklaşan jet, uzaklaşandan yüzlerce kat parlak
  const G = 2, b = Math.sqrt(1 - 1 / G ** 2), d = (c) => 1 / (G * (1 - b * c));
  const ratio = (d(Math.cos(20 * Math.PI / 180)) / d(-Math.cos(20 * Math.PI / 180))) ** 2.7;
  assert.ok(ratio > 300 && ratio < 700, `jet / karşı jet: ${ratio}`);
  console.log('quasar: jet kontrolleri geçti');
}
