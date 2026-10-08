// node dev/check-cluster.mjs — küme fiziği: renk → sıcaklık, ZAMS, bükülme noktası yaşı, boyut, konum izdüşümü
import assert from 'node:assert/strict';
import { clusterKind, bvToTeff, zamsMV, deriveCluster, projectPc, msLifetimeYr, turnoffBin, fitReddening } from '../js/cluster/derive.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);

assert.equal(clusterKind('OpC'), 'open');
assert.equal(clusterKind('GlC'), 'globular');
assert.equal(clusterKind('Cl*'), 'open');
assert.equal(clusterKind('G'), null);

// Ballesteros (2012): Güneş B−V = 0,65 → ~5800 K
near(bvToTeff(0.65), 5650, 5900, 'Güneş Teff');
near(bvToTeff(1.4), 3700, 4100, 'M0 Teff');
// Sıfır yaş anakolu (Pecaut & Mamajek): G2V M_V ≈ 4,8
near(zamsMV(0.65), 4.4, 5.2, 'ZAMS G2');
near(zamsMV(0.0), 0.5, 1.4, 'ZAMS A0');

// Anakol ömrü: Güneş ~10 milyar yıl, 4 M☉ ~150 milyon yıl, 2,4 M☉ ~600 milyon yıl
near(Math.log10(msLifetimeYr(1)), 9.95, 10.05, 'Güneş ömrü');
near(Math.log10(msLifetimeYr(4)), 8.0, 8.3, '4 M☉ ömrü');
near(Math.log10(msLifetimeYr(2.4)), 8.6, 8.9, '2,4 M☉ ömrü');

// Bükülme: en kalabalık 0,5 kadirlik kutudan parlağa yürü; bir sonraki kutu max(3, şimdiki/4)'ün
// altına düşünce dur. Örnek dağılımlar SIMBAD sorgusundan (2026-10-09, tekilleştirme öncesi; kutular
// arası oranlar aynı kaldığı için kuralın sınaması olarak geçerli).
// M67: bükülme M_V 3 kutusu; daha parlaktaki seyrek mavi başıboşlar (0–2,5) sayılmaz
const m67 = { 0: 6, 0.5: 5, 1: 5, 1.5: 17, 2.5: 53, 3: 300, 3.5: 729, 4: 703, 4.5: 532 };
assert.equal(turnoffBin(m67), 3);
// Ülker: üst anakol IMF yüzünden seyrek ama kesintisiz → bükülme −0,5 kutusu (geç B yıldızları)
const ple = { '-1': 2, '-0.5': 15, 0: 8, 0.5: 28, 1: 47, 1.5: 37, 2: 72, 2.5: 70, 3: 78, 3.5: 141, 4: 125, 4.5: 116, 5: 177, 5.5: 234, 6: 133, 6.5: 177 };
assert.equal(turnoffBin(ple), -0.5);
// Hyades: anakol 0,5 kutusuna kadar kesintisiz, daha parlağında anakol yıldızı yok
assert.equal(turnoffBin({ 0.5: 17, 1: 35, 1.5: 39, 2: 124, 2.5: 130, 3: 109, 3.5: 147, 4: 179, 4.5: 129, 5: 152, 5.5: 209, 6: 176, 6.5: 131, 7: 134, 7.5: 226, 8: 53 }), 0.5);

// Sentetik genç küme (135 pc, Ülker benzeri): anakol B8'e kadar → bükülme kütlesi ~3–5 M☉, yaş ~10⁸ yıl mertebesi
const d = 135, mu = 5 * Math.log10(d) - 5;
const members = [];
for (let bv = -0.11; bv <= 1.3; bv += 0.01) members.push({ B: zamsMV(bv) + mu + bv, V: zamsMV(bv) + mu, ra: 56.75, dec: 24.12 });
members.push({ B: 3.5, V: 2.9, ra: 56.8, dec: 24.1 });   // evrimleşmiş dev (anakol dışı): bükülmeyi bozmamalı
const young = deriveCluster({ kind: 'open', majArcmin: 76.86, distances: [{ dist: 135, unit: 'pc' }], members, center: { ra: 56.75, dec: 24.12 } });
near(young.radiusPc.value, 1.4, 1.6, 'Ülker yarıçapı');
near(young.turnoff.mass, 3, 5, 'bükülme kütlesi');
near(Math.log10(young.age.value), 7.8, 8.8, 'genç küme log yaş');
assert.equal(young.age.origin, 'estimated');
assert.equal(young.cmd.length, members.length);

// Yaşlı küme: anakol yalnız G0'a kadar (B−V ≥ 0,59) → bükülme ~1,1 M☉, yaş ~ milyarlarca yıl
const old = deriveCluster({
  kind: 'open', majArcmin: 30, distances: [{ dist: 850, unit: 'pc' }],
  members: Array.from({ length: 80 }, (_, i) => { const bv = 0.59 + i * 0.01; const m = zamsMV(bv) + 5 * Math.log10(850) - 5; return { B: m + bv, V: m, ra: 132.8, dec: 11.8 }; }),
  center: { ra: 132.8, dec: 11.8 },
});
near(Math.log10(old.age.value), 9.4, 10.2, 'yaşlı küme log yaş');

// ZAMS uydurması: E(B−V) = 0,5 ile kızartılmış sentetik anakol (A_V = 3,1 E) geri bulunur
const red = [];
for (let bv = -0.25; bv <= 1.2; bv += 0.005) red.push({ bv: bv + 0.5, mv: zamsMV(bv) + 1.55 });
near(fitReddening(red), 0.45, 0.55, 'E(B−V)');
assert.equal(fitReddening(red.map((p) => ({ bv: p.bv - 0.5, mv: p.mv - 1.55 }))), 0);

// Kızarmış genç küme: düzeltmeden sonra yaş yine ~10⁸ yıl mertebesi (h Persei düzeltmesiz 1,5 milyar çıkıyordu)
const redMembers = members.map((m) => ({ ...m, B: m.B + 0.5 + 1.55, V: m.V + 1.55 }));
const redYoung = deriveCluster({ kind: 'open', majArcmin: 76.86, distances: [{ dist: 135, unit: 'pc' }], members: redMembers, center: { ra: 56.75, dec: 24.12 } });
near(redYoung.ebv.value, 0.45, 0.55, 'kümede E(B−V)');
assert.equal(redYoung.ebv.applied, true);
assert.equal(young.ebv.applied, false);   // kızarmamış küme düzeltilmez
near(Math.log10(redYoung.age.value), 7.8, 8.8, 'kızarmış genç küme log yaş');

// Anakol yıldızı yoksa (yalnız devler) yaş verilmez
// Küresel kümede yatay kol anakolla karıştığı için yaş verilmez
const glob = deriveCluster({ kind: 'globular', majArcmin: 20, distances: [{ dist: 7400, unit: 'pc' }], members: old.cmd.map(() => ({ B: 15, V: 14.5, ra: 0, dec: 0 })), center: { ra: 0, dec: 0 } });
assert.equal(glob.age, null);

const giants = deriveCluster({ kind: 'globular', majArcmin: 20, distances: [{ dist: 7400, unit: 'pc' }], members: [{ B: 13, V: 12, ra: 0, dec: 0 }], center: { ra: 0, dec: 0 } });
assert.equal(giants.age, null);

// Gökyüzü konumunun teğet düzlem izdüşümü (pc): 1° doğuya, δ = 60°'de cos δ = 0,5
const p = projectPc({ ra: 11, dec: 60 }, { ra: 10, dec: 60 }, 1000);
near(p[0], 8.6, 8.9, 'x (pc)');
near(p[1], -0.1, 0.1, 'y (pc)');

console.log('cluster: tüm kontroller geçti');
