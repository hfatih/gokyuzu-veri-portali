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
