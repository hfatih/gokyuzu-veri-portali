// node dev/check-binary.mjs — görsel çift yıldız yörüngesi, ORB6 elemanları ve yayımlanmış değerlerle
import assert from 'node:assert/strict';
import { deriveBinary, relativePosition, periodYears, axisArcsec, toYear } from '../js/binary/derive.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);

// Sirius AB (ORB6, van den Bos 1960 / Bond+ 2017 elemanlarına yakın): P 50,128 y, a 7,4957″,
// i 136,336°, Ω 45,400°, T 1994,5715, e 0,59142, ω 149,161°; ϖ 379,21 mas
const sirius = { P: 50.128, a: 7.4957, i: 136.336, node: 45.4, T: 1994.5715, e: 0.59142, omega: 149.161 };
const s = deriveBinary(sirius, 379.21, 1.58, 8.4, 2025.0);
near(s.massSum.value, 2.95, 3.2, 'Sirius A+B kütlesi (Bond+ 2017: 2,063 + 1,018)');
near(s.aAu.value, 19.6, 19.9, 'Sirius a (AU)');
// En büyük görünen ayrım ~11,3″ (2020'lerin ortası), periastronda ~3″
near(s.sepMax.value, 10.9, 11.6, 'Sirius en büyük ayrım');
near(s.sepMin.value, 2.0, 3.5, 'Sirius en küçük ayrım');
near(relativePosition(sirius, 2025.0).rho, 10.3, 11.6, 'Sirius 2025 ayrımı');
near(s.nextPeri, 2044.6, 2044.8, 'Sirius sonraki periastron');

// α Centauri AB (Pourbaix & Boffin 2016): P 79,91 y, a 17,66″, i 79,32°, Ω 205,06°, T 1955,66, e 0,524, ω 232,3°; ϖ 747,1 mas
const acen = { P: 79.91, a: 17.66, i: 79.32, node: 205.06, T: 1955.66, e: 0.524, omega: 232.3 };
const a = deriveBinary(acen, 747.1, 0.5, 1.3, 2016.0);
near(a.massSum.value, 1.95, 2.15, 'α Cen A+B kütlesi (1,10 + 0,91)');
// 2016'da görünen ayrım ~4″ ile en küçüğüne yakındı
near(relativePosition(acen, 2016.0).rho, 3.5, 5.5, 'α Cen 2016 ayrımı');
near(a.q.value, 0.7, 0.9, "α Cen kütle oranı tahmini (gerçek 0,83)");

// Sahne: yoldaşın sıcaklığı anakol bağıntılarından, T ∝ M^0,6 (L ∝ M⁴, R ∝ M^0,8)
const { binaryVisualParams } = await import('../js/render/binary.js');
near(binaryVisualParams(acen, { q: { value: 0.5 } }, 6000, 2016).teff2, 3940, 3980, 'yoldaş Teff (q = 0,5)');

// Paralaks güvenilmezse kütle verilmez
assert.equal(deriveBinary(sirius, 2, 1, null, 2025).massSum, null);

// Birimler
assert.equal(periodYears(365.25, 'd'), 1);
assert.equal(periodYears(2, 'c'), 200);
assert.equal(axisArcsec(250, 'm'), 0.25);
assert.equal(axisArcsec(7.5, 'a'), 7.5);
near(toYear(2451545, 'd'), 1999.99, 2000.01, 'JD → yıl');
near(toYear(51544.5, 'm'), 1999.99, 2000.01, 'MJD → yıl');
assert.equal(toYear(1994.5715, 'y'), 1994.5715);
console.log('binary: tüm kontroller geçti');

// ORB6 satırı ayrıştırma (VizieR TSV biçimi; sütun adları birkaç biçimde)
const { orbitFromRow } = await import('../js/binary/fetch.js');
const { parseAsu } = await import('../js/net/vizier.js');
const tsv = ['#RESOURCE', '#Table B/orb6/orb6orb', 'WDS\tDisc\tHD\tP\tu_P\ta\tu_a\ti\tNode\tT\tu_T\te\tomega\tGrade',
  '\t\t\td\t\tarcsec\t\tdeg\tdeg\t\t\t\tdeg\t', '-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-',
  '06451-1643\tAGC   1\t48915\t50.128\ty\t7.4957\ta\t136.336\t45.400\t1994.5715\ty\t0.59142\t149.161\t1', ''].join('\n');
const [tb] = parseAsu(tsv);
const orb = orbitFromRow(tb.rows[0], tb.units);
assert.equal(orb.el.P, 50.128); assert.equal(orb.el.a, 7.4957); assert.equal(orb.hd, 48915); assert.equal(orb.grade, 1);
// Birim sütunu yoksa birim satırı: dönem gün, eksen mas, T JD
const row2 = { Per: 3652.5, Axis: 250, Incl: 90, Node: 10, T0: 2451545, Ecc: 0.1, omega: 0 };
const o2 = orbitFromRow(row2, { Per: 'd', Axis: 'mas', T0: 'JD' });
near(o2.el.P, 9.99, 10.01, 'gün → yıl'); assert.equal(o2.el.a, 0.25); near(o2.el.T, 1999.99, 2000.01, 'JD → yıl');
assert.equal(orbitFromRow({ P: 10, a: 1, i: 0, Node: 0, T: 2000, e: 1.2, omega: 0 }), null);   // e ≥ 1 geçersiz
console.log('binary: ORB6 ayrıştırma geçti');

// Beyaz cüce yoldaş: dinamik kütle + parlaklık açığı
{
  const { classifyCompanion, whiteDwarfRadius } = await import('../js/binary/derive.js');
  // Nauenberg: Sirius B (1,02 M☉) ölçülen 0,0084 R☉, Procyon B (0,60 M☉) 0,0123 R☉
  near(whiteDwarfRadius(1.02), 0.007, 0.009, 'Sirius B yarıçapı'); near(whiteDwarfRadius(0.6), 0.0115, 0.013, 'Procyon B yarıçapı');
  // Sirius: toplam ~3,1 M☉, birincil 2,06 → yoldaş ~1 M☉; Δm = 9,9 → beyaz cüce, ~25 000 K (ölçülen 25 200 K)
  const sb = deriveBinary(sirius, 379.21, 1.58, 9.9, 2025.0, { mass: 2.06, radius: 1.71, teff: 9940 });
  assert.equal(sb.companion.kind, 'wd'); near(sb.companion.mass, 0.9, 1.15, 'Sirius B kütlesi');
  near(sb.companion.teff, 17000, 32000, 'Sirius B sıcaklığı'); near(sb.q.value, 0.44, 0.56, 'dinamik kütle oranı');
  assert.equal(sb.q.origin, 'derived');
  // Procyon B: 0,6 M☉, Δm = 10,3, birincil 1,5 M☉ / 2,05 R☉ / 6530 K → ~7700 K (ölçülen 7740 K)
  const pb = classifyCompanion(0.6, { mass: 1.5, radius: 2.05, teff: 6530 }, 10.3);
  assert.equal(pb.kind, 'wd'); near(pb.teff, 7000, 8600, 'Procyon B sıcaklığı');
  // α Cen: yoldaş kütlesine uygun parlaklıkta → anakol; birincil bilinmiyorsa eski fotometrik oran
  const ab = deriveBinary(acen, 747.1, 0.5, 1.3, 2016.0, { mass: 1.1, radius: 1.22, teff: 5790 });
  assert.equal(ab.companion.kind, 'ms'); near(ab.q.value, 0.7, 0.95, 'α Cen kütle oranı');
  assert.equal(s.companion.kind, 'ms'); assert.equal(s.q.origin, 'estimated');
  const { binaryVisualParams } = await import('../js/render/binary.js');
  const vp = binaryVisualParams(sirius, sb, 9940, 2025);
  assert.ok(vp.teff2 > 15000 && vp.r2 < 0.02, `Sirius B sahnede sıcak ve küçük: ${vp.teff2}, ${vp.r2}`);
  near(binaryVisualParams(acen, ab, 5790, 2016).r2, 0.05, 0.07, 'anakol yoldaşın sahne yarıçapı');
  console.log('binary: beyaz cüce yoldaş geçti');
}

// Tayfsal çift (SB9): Spica, 1972 yörüngesi P 4,0145 g, e 0,18, ω 142°, K₁ 120, K₂ 189 km/s.
// Bilinen (Tkachenko+ 2016): M₁ 10,25, M₂ 6,97 M☉, i 66° → M₁ sin³i 7,8; eski yörüngeyle ~%9 düşük çıkar.
{
  const { deriveSpectroscopic, radialVelocity, SB_ASSUMED_INCL } = await import('../js/binary/derive.js');
  const spica = { P: 4.0145, T0: 2440284.78, e: 0.18, omega: 142, K1: 120, K2: 189, V0: 0, grade: 3 };
  const sd = deriveSpectroscopic(spica, { mass: 10.25 });
  near(sd.q.value, 0.62, 0.65, 'Spica q = K₁/K₂'); assert.equal(sd.q.origin, 'derived');
  near(sd.m1sin3.value, 6.9, 7.4, 'Spica M₁ sin³i'); near(sd.m2sin3.value, 4.4, 4.7, 'Spica M₂ sin³i');
  near(sd.inclination.value, 60, 65, 'Spica eğiklik kestirimi (gerçek 66°)'); assert.equal(sd.inclAssumed, false);
  near(sd.asiniRsun.value, 23.5, 25, 'Spica a sin i (R☉)');
  // Sahne elemanları: dönem yıl, ikincilin ω'su birincilinkinin karşısı, a keyfi
  near(sd.el.P * 365.25, 4.01, 4.02, 'sahne dönemi'); assert.equal(sd.el.omega, 322); assert.equal(sd.el.i, sd.inclination.value);
  // Hız eğrisi: bir dönemde ortalama ≈ V0, uçlar V0 ± K (e ile kayık), bileşenler zıt yönde
  let s1 = 0, mx = -1e9, mn = 1e9;
  for (let k = 0; k < 2000; k++) { const { v1, v2 } = radialVelocity(spica, k / 2000); mx = Math.max(mx, v1); mn = Math.min(mn, v1); assert.ok(Math.sign(v1 - spica.V0) !== Math.sign(v2 - spica.V0) || Math.abs(v1) < 1); }
  near((mx - mn) / 2, 119.5, 120.5, 'K₁ eğriden');
  // Tek çizgili: kütle işlevi, M₂ varsayılan eğiklikle; eğiklik "varsayıldı"
  const sb1 = deriveSpectroscopic({ ...spica, K2: null }, { mass: 10.25 });
  assert.equal(sb1.m1sin3, null); near(sb1.massFunction.value, 0.65, 0.7, 'f(M)');
  assert.equal(sb1.q.origin, 'estimated'); assert.equal(sb1.inclAssumed, true); assert.equal(sb1.el.i, SB_ASSUMED_INCL);
  // f(M) denklemi çözülmüş olmalı: M₂³ sin³i / (M₁ + M₂)² = f
  const m2 = sb1.q.value * 10.25, si3 = Math.sin(SB_ASSUMED_INCL * Math.PI / 180) ** 3;
  near(m2 ** 3 * si3 / (10.25 + m2) ** 2, sb1.massFunction.value * 0.999, sb1.massFunction.value * 1.001, 'f(M) çözümü');
  // Birincil kütle yoksa: eğiklik kestirilmez, sahne kütle oranı yine K₁/K₂
  const nm = deriveSpectroscopic(spica, null);
  assert.equal(nm.inclination, null); near(nm.sceneBd.q.value, 0.62, 0.65, 'sahne q');
  console.log('binary: tayfsal çift (SB9) geçti');
}

