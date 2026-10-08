// node dev/check-bh.mjs — kara delik fiziği: EHT gölge boyutları, olay ufku, ISCO, Hawking, gelgit, disk sıcaklığı
import assert from 'node:assert/strict';
import { deriveBlackHole, bhClass } from '../js/bh/derive.js';
import { pickValue } from '../js/planet/units.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);

assert.equal(bhClass(10), 'stellar');
assert.equal(bhClass(5e3), 'intermediate');
assert.equal(bhClass(4e6), 'supermassive');

// Birimler: Wikidata M☉ ve ışık yılı
assert.equal(pickValue([{ amount: 4020000, unit: 'Q180892', rank: 'NormalRank' }, { amount: 4310000, unit: 'Q180892', rank: 'DeprecatedRank' }], 'massSun'), 4020000);
near(pickValue([{ amount: 8, unit: 'Q11929860', rank: 'NormalRank' }], 'distLy'), 26000, 26200, 'kpc → ışık yılı');

// Sgr A*: 4,02 × 10⁶ M☉, 26 000 ışık yılı → gölge ~51 µas (EHT 2022: 51,8 ± 2,3)
const sgr = deriveBlackHole({ massSun: 4.02e6, distLy: 26000 });
near(sgr.shadowUas.value, 49, 54, 'Sgr A* gölge');
near(sgr.rsKm.value, 1.17e7, 1.21e7, 'Sgr A* Schwarzschild yarıçapı');
near(sgr.iscoPeriodS.value / 60, 28, 33, 'Sgr A* ISCO dönemi (dk)');
assert.ok(sgr.tidalG.value < 1e-3, 'Sgr A* olay ufkunda gelgit ihmal edilebilir');
assert.equal(sgr.cls, 'supermassive');

// M87*: 6,5 × 10⁹ M☉, 55 milyon ışık yılı → ~42 µas (EHT 2019: 42 ± 3); ortalama yoğunluk havadan az
const m87 = deriveBlackHole({ massSun: 6.5e9, distLy: 55e6 });
near(m87.shadowUas.value, 39, 45, 'M87* gölge');
assert.ok(m87.density.value < 1.2, `M87* yoğunluğu havadan az: ${m87.density.value}`);

// 10 M☉: olay ufkunda 2 m'lik cisme ~10⁷ g gelgit; Hawking sıcaklığı ~6 nK; disk T_max ~5 × 10⁶ K
const st = deriveBlackHole({ massSun: 10, distLy: null });
near(Math.log10(st.tidalG.value), 6.8, 7.8, 'gelgit (g)');
near(st.hawkingK.value, 5e-9, 7e-9, 'Hawking sıcaklığı');
near(st.diskTmax.value, 3e6, 3e7, 'disk en yüksek sıcaklığı');
assert.equal(st.shadowUas, null);   // uzaklık yoksa açısal boyut yok

console.log('bh: tüm kontroller geçti');
