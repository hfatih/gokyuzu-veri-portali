// node dev/check-planet.mjs — gezegen fiziği ve Wikidata birim dönüşümü
import assert from 'node:assert/strict';
import { radiusFromMass, massFromRadius, planetClass, habitableZone, derivePlanet, rhinesBands, sudarsky } from '../js/planet/derive.js';
import { pickValue } from '../js/planet/units.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);

// Chen & Kipping 2017: dallar sürekli; Dünya ~1, Neptün (17 M⊕) ~3,9 R⊕
near(radiusFromMass(1), 0.95, 1.05, 'R(1 M⊕)');
near(radiusFromMass(17.15), 3.3, 4.6, 'R(Neptün)');   // ilişkinin saçılması ~%10–20
near(massFromRadius(radiusFromMass(5)), 4.9, 5.1, 'kütle↔yarıçap tersi');
assert.equal(massFromRadius(12), null, 'Jüpiter dalında yarıçaptan kütle çıkmaz');

assert.equal(planetClass(1), 'rocky');
assert.equal(planetClass(2.5), 'subneptune');
assert.equal(planetClass(3.87), 'neptune');   // Neptün'ün kendisi
assert.equal(planetClass(6), 'neptune');
assert.equal(planetClass(11.2), 'giant');
assert.equal(planetClass(9.14, 95.2), 'giant');   // Satürn

// Kopparapu 2013: Güneş için iç sınır ~0,95–0,99 AU, dış ~1,67–1,70 AU
const hz = habitableZone(5772, 1);
near(hz.inner, 0.93, 1.0, 'YB iç');
near(hz.outer, 1.6, 1.75, 'YB dış');

// Rhines: Jüpiter yarıküre başına ~11 bant
near(rhinesBands(69911, 9.925 * 3600), 9, 13, 'Jüpiter bant sayısı');

// Sudarsky sınıfları
assert.equal(sudarsky(120).cls, 'I');
assert.equal(sudarsky(200).cls, 'II');
assert.equal(sudarsky(500).cls, 'III');
assert.equal(sudarsky(1100).cls, 'IV');
assert.equal(sudarsky(1600).cls, 'V');

// Birimler: Deprecated atlanır, Preferred varsa yalnız o, kalanların ortancası
assert.equal(pickValue([
  { amount: 1, unit: 'Q651336', rank: 'NormalRank' },
  { amount: 1898130, unit: 'Q613726', rank: 'DeprecatedRank' },
], 'mass'), 317.83 * 1);
near(pickValue([{ amount: 1898130, unit: 'Q613726', rank: 'NormalRank' }], 'mass'), 317, 319, 'yottagram → M⊕');
near(pickValue([{ amount: 69911, unit: 'Q828224', rank: 'NormalRank' }], 'radius'), 10.9, 11.0, 'km → R⊕');
assert.equal(pickValue([
  { amount: 5, unit: 'Q1811', rank: 'NormalRank' },
  { amount: 9, unit: 'Q1811', rank: 'PreferredRank' },
], 'sma'), 9);
near(pickValue([{ amount: -63, unit: 'Q25267', rank: 'NormalRank' }], 'temp'), 210, 210.2, '°C → K');
assert.equal(pickValue([], 'mass'), null);

// Proxima b: Wikidata kütle 0,00337 M♃ (≈1,07 M⊕), a 0,04856 AU; yıldız 2883 K, 0,158 R☉, 0,00155 L☉
const prox = derivePlanet(
  { mass: 1.071, radius: null, period: 11.1868, sma: 0.04856, ecc: 0.02, temp: null, albedo: null },
  { teff: 2883, R: 0.158, L: 0.00155 },
);
near(prox.radius.value, 0.95, 1.15, 'Proxima b R (tahmini)');
assert.equal(prox.radius.origin, 'estimated');
assert.equal(prox.cls, 'rocky');
near(prox.teq.value, 215, 245, 'Proxima b T_eq');   // literatür ~234 K (A = 0,3)
assert.equal(prox.inHZ, true);
assert.equal(prox.tidallyLocked, true);

// Jüpiter: yoğunluk 1,33 g/cm³, g 24,8 m/s²
const jup = derivePlanet({ mass: 317.83, radius: 10.97, period: 4332.6, sma: 5.2, rot: 9.925 / 24 }, { teff: 5772, R: 1, L: 1 });
near(jup.density.value, 1.2, 1.45, 'Jüpiter ρ');
near(jup.gravity.value, 23, 27, 'Jüpiter g');
assert.equal(jup.cls, 'giant');
assert.equal(jup.inHZ, false);

console.log('planet: tüm kontroller geçti');
