// node dev/check-variable.mjs — değişen yıldızlar: aileler, ışık eğrileri, P–L uzaklıkları
import assert from 'node:assert/strict';
import { family, lightCurve, plMagnitude, deriveVariable, nextEvent, pulseParams, pulseState } from '../js/variable/derive.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);

assert.equal(family('DCEP'), 'cep'); assert.equal(family('EA/DM'), 'ea'); assert.equal(family('RRAB:'), 'rrab');
assert.equal(family('SRC'), 'sr'); assert.equal(family('M'), 'mira'); assert.equal(family('EA+BY'), 'ea'); assert.equal(family('XYZ'), 'other');

// Işık eğrileri: zonklayan φ=0 en parlak, örten φ=0 en sönük; değerler 0–1
assert.equal(lightCurve('cep', 0), 0); near(lightCurve('cep', 0.7), 0.99, 1, 'Sefeid en sönük');
near(lightCurve('ea', 0), 0.99, 1, 'Algol baş tutulma'); near(lightCurve('ea', 0.25), 0, 0.01, 'Algol tutulma dışı');
for (const f of ['cep', 'rrab', 'rrc', 'mira', 'ea', 'eb', 'ew']) for (let k = 0; k < 50; k++) near(lightCurve(f, k / 50), 0, 1, f);

// δ Cephei (VSX: V 3,48–4,37, P 5,366266 gün; E(B−V) 0,075 → A_V 0,23). HST paralaksı: 272 pc (Benedict+ 2002)
near(plMagnitude('cep', 5.366266).M, -3.45, -3.35, 'δ Cep M_V');
const dcep = deriveVariable({ type: 'DCEP', max: 3.48, min: 4.37, band: 'V', P: 5.366266, epoch: 2436075.445 }, {}, 0.23, null, 2461000);
near(dcep.distPl.value, 240, 310, 'δ Cep P–L uzaklığı');
near(dcep.meanV.value, 3.85, 4.05, 'δ Cep ortalama V');
assert.ok(dcep.nextMax.value >= 2461000 && dcep.nextMax.value < 2461000 + 5.37);

// RR Lyrae (V 7,06–8,12, P 0,5668 gün, [Fe/H] −1,4, A_V 0,13). HST: 3,77 mas → 265 pc (Benedict+ 2011)
const rr = deriveVariable({ type: 'RRAB', max: 7.06, min: 8.12, band: 'V', P: 0.56686776, epoch: 2442923.4193 }, {}, 0.13, -1.4, 2461000);
near(rr.distPl.value, 200, 290, 'RR Lyr P–L uzaklığı');

// Mira (o Cet): P 332 gün, K ≈ −2,7; uzaklık ~92–110 pc (Hipparcos 107 pc)
const mira = deriveVariable({ type: 'M', max: 2.0, min: 10.1, band: 'V', P: 332, epoch: 2459000 }, { K: -2.7 }, 0, null, 2461000);
near(mira.distPl.value, 80, 130, 'Mira P–L uzaklığı');

// Algol (EA): sonraki baş tutulma; genlik "(" ile verilmişse doğrudan
const algol = deriveVariable({ type: 'EA/SD', max: 2.09, min: 1.18, minIsAmp: true, band: 'V', P: 2.867328, epoch: 2445641.5135 }, {}, 0, null, 2461000);
assert.equal(algol.amp.value, 1.18); assert.equal(algol.eclipsing, true); assert.equal(algol.distPl, null);
near(algol.nextMin.value - 2461000, 0, 2.868, 'Algol sonraki tutulma');
assert.equal(nextEvent(100, 10, 125), 130); assert.equal(nextEvent(100, 10, 130), 130);

// Zonklama: akı ortalama çevresinde, sıcaklık ve yarıçap makul aralıkta
const pp = pulseParams(dcep);
assert.equal(pp.fam, 'cep'); near(pp.periodS / 86400, 5.36, 5.37, 'zonklama dönemi');
const bright = pulseState(pp, 0, 6000), faint = pulseState(pp, 0.7, 6000);
assert.ok(bright.tScale > faint.tScale, 'en parlakta daha sıcak');
near(bright.tScale, 1.0, 1.15, 'en parlak T ölçeği'); near(faint.rScale, 0.9, 1.1, 'yarıçap ölçeği');
assert.equal(pulseParams(algol), null);   // örten çift zonklamaz

// Zonklama sıcaklığı V bandı Planck akısından çözülür. Toplam ışıma (T⁴) varsayımı Mira'yı 1400–6300 K
// arasında oynatıyordu (gözlenen ~2400–3200 K); Sefeidlerde iki yöntem aynı aralığı verir.
const swing = (type, teff, amp, P) => {
  const q = pulseParams({ fam: family(type), period: { value: P }, amp: { value: amp } });
  let lo = Infinity, hi = 0, light = [];
  for (let k = 0; k < 400; k++) { const s = pulseState(q, k / 400, teff); lo = Math.min(lo, s.tScale); hi = Math.max(hi, s.tScale); light.push(s.bright * s.rScale ** 2); }
  return { lo: teff * lo, hi: teff * hi, mag: 2.5 * Math.log10(Math.max(...light) / Math.min(...light)) };
};
const miraSw = swing('M', 2900, 6, 332);
near(miraSw.lo, 2300, 2700, 'Mira en soğuk'); near(miraSw.hi, 3200, 3700, 'Mira en sıcak');
const btl = swing('SRC', 3600, 1.3, 400);
near(btl.lo, 3300, 3550, 'Betelgeuse en soğuk'); near(btl.hi, 3650, 3900, 'Betelgeuse en sıcak');
const dc = swing('DCEP', 6000, 0.87, 5.37);
near(dc.lo, 5300, 5700, 'δ Cep en soğuk (gözlenen ~5500)'); near(dc.hi, 6500, 7000, 'δ Cep en sıcak (gözlenen ~6800)');
// Sahnedeki toplam ışık (yüzey parlaklığı × disk alanı) ışık eğrisini izler: Sefeidde tam genlik, Mira'da 2,5 kadirle sınırlı
near(dc.mag, 0.85, 0.89, 'δ Cep gösterilen genlik'); near(miraSw.mag, 2.45, 2.55, 'Mira gösterilen genlik (sınırlı)');
console.log('variable: tüm kontroller geçti');

// VSX satırı ayrıştırma
const { vsxFromRow } = await import('../js/variable/fetch.js');
const r1 = vsxFromRow({ Name: 'bet Per', Type: 'EA/SD', max: 2.09, n_max: 'V', f_min: '(', min: 1.18, Period: 2.867328, Epoch: 2445641.5135 });
assert.equal(r1.minIsAmp, true); assert.equal(r1.P, 2.867328); assert.equal(r1.band, 'V');
assert.equal(vsxFromRow({ Name: 'x' }), null);
console.log('variable: VSX ayrıştırma geçti');
