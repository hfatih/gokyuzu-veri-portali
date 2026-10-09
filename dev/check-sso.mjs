// node dev/check-sso.mjs — küçük cisimler: Kepler konumu, MOID (JPL ile), sınıf, Tisserand, hızlar, sıcaklık, çap, dönme sınırı
import assert from 'node:assert/strict';
import { positionAt, earthElements, moid } from '../js/sso/orbit.js';
import { deriveSso, orbitClass, tisserand, apparentMag } from '../js/sso/derive.js';
import { normalizeCard } from '../js/sso/fetch.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);
const JD = 2461300.5;

// Dünya J2000'de (−0,1771, 0,9672, 0) AU (JPL DE)
const e0 = positionAt(earthElements(2451545), 2451545).pos;
near(e0[0], -0.180, -0.174, 'Dünya x'); near(e0[1], 0.964, 0.970, 'Dünya y');

// IMCCE ssoCard elemanları (2026). MOID, IMCCE'nin kendi değerine değil JPL'e karşı: Bennu 0,0032, Eros 0,149, Halley 0,0745 AU
const body = (type, a, e, i, node, peri, M0, epoch, extra = {}) => ({ type, el: { a, e, i, node, peri, M0, epoch, q: a * (1 - e), Q: a * (1 + e) }, H: null, G: null, H1: null, K1: null, D: null, albedo: null, mass: null, density: null, spinH: null, ...extra });
const bennu = body('Asteroid', 1.12591531, 0.2036779, 6.033007, 1.966596, 66.400812, 0, JD, { H: 20.68, D: 0.488, albedo: 0.044, mass: 7.33e10, density: 1204.7, spinH: 4.296057 });
const eros = body('Asteroid', 1.45826463, 0.22284915, 10.828545, 304.268089, 178.922412, 0, JD, { H: 10.4, D: 17.6, mass: 6.687e15, density: 2342.6 });
const halley = body('Comet', 17.8589, 0.967942509101, 162.157751661862, 59.0, 112.0, 0, JD, { H1: 4.43, K1: 10.36, D: 10.28, mass: 3.2e14 });
const ceres = body('Dwarf Planet', 2.76592189, 0.07975072, 10.587505, 80.248993, 73.20809, 295.937548, JD, { H: 3.34, G: 0.15, D: 939.4, albedo: 0.102, mass: 9.384e20, density: 2161.9, spinH: 9.07417 });

const bd = deriveSso(bennu, JD);
near(bd.moidAu.value, 0.002, 0.0045, 'Bennu MOID');
assert.equal(bd.cls, 'apollo');
assert.ok(bd.pha, 'Bennu tehlikeli (MOID ≤ 0,05, H ≤ 22)');
near(bd.pCritH.value, 2.9, 3.1, 'Bennu moloz yığını dönme sınırı (sa)');
near(bd.spinRatio.value, 1.3, 1.5, 'Bennu dönme / sınır (OSIRIS-REx: ekvator çıkıntısı, sınıra yakın)');
near(bd.vEscMs.value, 0.15, 0.25, 'Bennu kaçış hızı (m/s)');

const ed = deriveSso(eros, JD);
near(ed.moidAu.value, 0.14, 0.16, 'Eros MOID');
assert.equal(ed.cls, 'amor');
assert.equal(ed.pha, false);

const hd = deriveSso(halley, JD);
assert.equal(hd.cls, 'htc');
near(hd.periodYr.value, 74, 77, 'Halley dönemi (yıl)');
near(hd.vPeri.value, 53, 56, 'Halley günberi hızı (km/s; 54,55)');
assert.equal(hd.pha, false);                       // kuyruklu yıldızda H yok, ölçüt uygulanmaz

const cd = deriveSso(ceres, JD);
assert.equal(cd.cls, 'mainBelt');
near(cd.tJup.value, 3.30, 3.32, 'Ceres Tisserand (IMCCE 3,3098)');
near(cd.vEscMs.value, 500, 520, 'Ceres kaçış hızı (Dawn: 510 m/s)');
near(cd.gSurf.value, 0.26, 0.29, 'Ceres yüzey çekimi');
near(cd.tPeri.value, 235, 260, 'Ceres günberide güneş altı sıcaklığı');
near(cd.moidAu.value, 1.57, 1.59, 'Ceres MOID (IMCCE 1,5798)');
near(apparentMag(ceres, 2.55, 1.55, 0), 6.2, 6.4, 'Ceres karşı konumda parlaklık');

// Çap yalnız H ve albedodan: Apophis H 19,0, p 0,3838 → 0,34 km (radar 0,34)
const ap = deriveSso(body('Asteroid', 0.92233339, 0.19118287, 3.341087, 203.892611, 126.68411, 0, JD, { H: 19.0, albedo: 0.3838 }), JD);
near(ap.diameterKm.value, 0.32, 0.36, 'Apophis çapı H ve albedodan');
assert.equal(ap.diameterKm.origin, 'estimated');
assert.equal(ap.cls, 'aten');
assert.ok(ap.pha);

// Sınıflar ve Tisserand
assert.equal(orbitClass({ a: 3.4577, e: 0.65, i: 3.87, q: 1.21, Q: 5.7 }, true), 'jfc');      // 67P
assert.equal(orbitClass({ a: 43, e: 0.25, i: 17, q: 32, Q: 54 }, false), 'tno');
assert.equal(orbitClass({ a: 5.2, e: 0.1, i: 20, q: 4.7, Q: 5.7 }, false), 'trojan');
near(tisserand(5.2026, 0, 0), 2.99, 3.01, 'Jüpiter yörüngesinde T_J = 3');

// ssoCard ayrıştırma: değer nesneleri, ilk dönme dönemi, elipsoit oranları
const card = normalizeCard({ id: 'X', title: '(1) X', type: 'Asteroid', parameters: { physical: { diameter: { value: 10 }, spins: [{ period: { value: 5 } }], ellipsoid: { 'a/b': { value: 1.2 }, 'a/c': { value: 1.5 } }, absolute_magnitude: { H: { value: 12 }, G: { value: 0.2 } } }, dynamical: { orbital_elements: { ref_epoch: JD, semi_major_axis: { value: 2.5 }, eccentricity: { value: 0.1 } } } } });
assert.deepEqual([card.D, card.spinH, card.ab, card.ac, card.H, card.G, card.el.a, card.el.epoch], [10, 5, 1.2, 1.5, 12, 0.2, 2.5, JD]);

// 2P/Encke'de IMCCE H1 = R1 = 0,0 yer tutucu: parlaklık hesaplanmamalı (0,2 kadir "çıplak göz" çıkıyordu)
const encke = normalizeCard({ id: '2P', type: 'Comet', parameters: { physical: { absolute_magnitude: { H1: { value: 0 }, R1: { value: 0 } } }, dynamical: { orbital_elements: { ref_epoch: JD, semi_major_axis: { value: 2.22 }, eccentricity: { value: 0.848 }, inclination: { value: 11.4 }, node_longitude: { value: 334 }, periapsis_argument: { value: 187 }, mean_anomaly: { value: 100 } } } } });
assert.equal(encke.H1, null);
assert.equal(deriveSso(encke, JD).magNow, null);

console.log('sso: tüm kontroller geçti');
