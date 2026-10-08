// node dev/check-nebula.mjs — bulutsu fiziği: boyut, Strömgren, PN yaşı, SNR evresi, uzaklık seçimi
import assert from 'node:assert/strict';
import { nebulaKind, pickDistancePc, deriveNebula } from '../js/nebula/derive.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);

assert.equal(nebulaKind('HII'), 'hii');
assert.equal(nebulaKind('PN'), 'pn');
assert.equal(nebulaKind('SNR'), 'snr');
assert.equal(nebulaKind('RNe'), 'rne');
assert.equal(nebulaKind('DNe'), 'dne');
assert.equal(nebulaKind('MoC'), 'dne');
assert.equal(nebulaKind('G'), null);
assert.equal(nebulaKind('*'), null);

// Uzaklık: birimler pc'ye çevrilir, ortanca alınır
const d = pickDistancePc([
  { dist: 0.5, unit: 'kpc' }, { dist: 458, unit: 'pc' }, { dist: 433, unit: 'pc' }, { dist: 488, unit: 'pc' },
]);
near(d.value, 460, 480, 'M42 uzaklık ortancası');
assert.equal(d.n, 4);
assert.equal(pickDistancePc([]), null);
assert.equal(pickDistancePc([{ dist: 5, unit: 'Mpc' }]).value, 5e6);

// M57 Halka: 1,153′ × 1,153′, ~790 pc → yarıçap ~0,13 pc; 20 km/s ile yaş ~6500 yıl
const m57 = deriveNebula({ kind: 'pn', majArcmin: 1.153, minArcmin: 1.153, distances: [{ dist: 787, unit: 'pc' }, { dist: 880, unit: 'pc' }] });
near(m57.radiusPc.value, 0.12, 0.15, 'M57 yarıçap');
near(m57.agePN.value, 5000, 8000, 'M57 dinamik yaş');
assert.equal(m57.agePN.origin, 'estimated');

// M42 Orion: 66′, ~470 pc → R ~4,5 pc; n_e = 100 cm⁻³ ile Q ~ 10⁴⁹ s⁻¹ mertebesi
const m42 = deriveNebula({ kind: 'hii', majArcmin: 66, minArcmin: 66, distances: [{ dist: 470, unit: 'pc' }] });
near(m42.radiusPc.value, 4, 5, 'M42 yarıçap');
near(Math.log10(m42.qIon.value), 48.8, 49.8, 'M42 log Q');
near(m42.o7Equiv.value, 1, 15, 'M42 O7V eşdeğeri');

// Yengeç: 7′ × 5′, 2 kpc → R ~2 pc, süpürülen kütle ~1 M☉ → serbest genişleme, Sedov yaşı verilmez
const crab = deriveNebula({ kind: 'snr', majArcmin: 7, minArcmin: 5, distances: [{ dist: 2, unit: 'kpc' }] });
near(crab.sweptMsun.value, 0.5, 2, 'Yengeç süpürülen kütle');
assert.equal(crab.phase, 'free');
assert.equal(crab.ageSedov, null);

// Kuğu İlmeği: ~180′, 735 pc → R ~19 pc; Sedov evresinde, yaş on binlerce yıl (lit. 10–20 bin)
const cyg = deriveNebula({ kind: 'snr', majArcmin: 180, minArcmin: 160, distances: [{ dist: 735, unit: 'pc' }] });
assert.equal(cyg.phase, 'sedov');
near(cyg.ageSedov.value, 5e3, 6e4, 'Kuğu İlmeği Sedov yaşı');

// Uzaklık yoksa fiziksel boyut ve ondan türeyenler yok
const horse = deriveNebula({ kind: 'dne', majArcmin: 6, minArcmin: 4, distances: [] });
assert.equal(horse.radiusPc, null);
assert.equal(horse.axisRatio, 4 / 6);

console.log('nebula: tüm kontroller geçti');
