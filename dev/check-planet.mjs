// node dev/check-planet.mjs — gezegen fiziği ve Wikidata birim dönüşümü
import assert from 'node:assert/strict';
import { radiusFromMass, massFromRadius, planetClass, habitableZone, derivePlanet, rhinesBands, sudarsky } from '../js/planet/derive.js';
import { pickValue } from '../js/planet/units.js';
import { pickAlbedo } from '../js/planet/fetch.js';

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

// Kopparapu 2014 (kaçak sera – en büyük sera): Güneş için 0,95–1,68 AU; TRAPPIST-1 e (0,029 AU) içeride
const hz = habitableZone(5772, 1);
near(hz.inner, 0.945, 0.955, 'YB iç');
near(hz.outer, 1.67, 1.685, 'YB dış');
const hzT1 = habitableZone(2566, 0.000553);
assert.ok(hzT1.inner < 0.0293 && hzT1.outer > 0.0293, 'TRAPPIST-1 e yaşanabilir bölgede');

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
// Tercih edilen değer yanlış birimle (R⊕ yerine R♃ sayısı R⊕ diye) girilmiş: normallerle 11 kat fark → ortanca
near(pickValue([
  { amount: 1.38, unit: 'Q1155470', rank: 'PreferredRank' },
  { amount: 1.38, unit: 'Q3421309', rank: 'NormalRank' },
  { amount: 1.36, unit: 'Q3421309', rank: 'NormalRank' },
], 'radius'), 15, 15.5, 'aykırı tercih edilen değer');
// Tek normal ifade yetmez: tercih edilen kalır
assert.equal(pickValue([{ amount: 2, unit: 'Q1811', rank: 'PreferredRank' }, { amount: 20, unit: 'Q1811', rank: 'NormalRank' }], 'sma'), 2);
assert.equal(pickValue([], 'mass'), null);

// Albedo niteleyicileri: Dünya Bond 0,306, geometrik 0,367; Jüpiter Bond 0,343, geometrik 0,538
assert.equal(pickAlbedo([{ amount: '0.367', ql: 'geometric albedo' }, { amount: '0.306', ql: 'Bond albedo' }]), 0.306);
assert.equal(pickAlbedo([{ amount: '0.538', ql: 'geometric albedo' }, { amount: '0.343' }]), 0.343);
assert.equal(pickAlbedo([{ amount: '0.52', ql: 'geometric albedo' }]), null);

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

// Uydular (faz 12): Ay — Wikidata değerleri: 0,0123 M⊕, 0,2727 R⊕, 27,32 gün, 384 400 km, e 0,0549, albedo 0,11
{
  const { deriveMoon } = await import('../js/planet/moon.js');
  {
    const moon = deriveMoon({ mass: 0.0123, radius: 0.2727, period: 27.32, sma: 384400 / 1.495978707e8, ecc: 0.0549, albedo: 0.11 },
      'earth', { teff: 5772, R: 1, L: 1 });
    near(moon.density.value, 3.3, 3.4, 'Ay yoğunluğu');
    near(moon.gravity.value, 1.6, 1.65, 'Ay yüzey çekimi');
    near(moon.orbitKm.value, 384000, 384800, 'Ay uzaklığı');
    near(moon.teq.value, 265, 275, 'Ay denge sıcaklığı');
    assert.equal(moon.tidallyLocked, true);
    near(moon.rot.value, 27.3, 27.4, 'Ay dönmesi = yörünge dönemi');
  }
}

// Gerçek haritalar: her doku dosyası depoda var; haritalı uydu kip 0 (inene kadar iki ton), tek renkli
// harita ana tonla renklenir; Jüpiter haritayla da basık kalır ve inene kadar bantlarla çizilir
{
  const { existsSync } = await import('node:fs');
  const { SOLAR_PLANETS, SOLAR_MOONS, solarMoon, solarPlanet } = await import('../js/planet/solar.js');
  const { planetVisualParams } = await import('../js/planet/visual.js');
  const textured = [...SOLAR_PLANETS, ...SOLAR_MOONS].filter((x) => x.texture);
  assert.equal(textured.length, 10, 'haritalı cisim sayısı');
  for (const x of textured) assert.ok(existsSync(new URL('../' + x.texture, import.meta.url)), `doku yok: ${x.texture}`);
  for (const key of ['saturn', 'venus', 'uranus', 'neptune']) assert.equal(SOLAR_PLANETS.find((x) => x.key === key).texture, undefined, `${key} modelle çizilir`);

  const rock = { cls: 'rocky', teq: { value: 270 }, rot: { value: 27.3 } };
  const ay = planetVisualParams(rock, solarMoon('moon:Q405'), 5772);
  assert.deepEqual([ay.mode, ay.fallback, ay.tint], [0, 4, [1, 1, 1]], 'Ay: renkli harita');
  const cal = planetVisualParams(rock, solarMoon('moon:Q3134'), 5772);
  assert.equal(cal.mode, 0);
  assert.ok(cal.tint[0] === 1 && cal.tint[2] < cal.tint[1] && cal.tint[1] < 1, `Kallisto sıcak tonla renklenir: ${cal.tint}`);
  const titan = planetVisualParams(rock, solarMoon('moon:Q2565'), 5772);
  assert.equal(titan.mode, 2, 'Titan pus modeli kalır');

  const jup = planetVisualParams({ cls: 'giant', teq: { value: 110 }, rot: { value: 0.4135 }, radius: { value: 11.2 }, mass: { value: 317.8 }, gravity: { value: 24.8 } },
    solarPlanet('planet:Q319'), 5772);
  assert.deepEqual([jup.mode, jup.fallback], [0, 1], 'Jüpiter: harita, inene kadar bantlar');
  near(jup.oblate, 0.05, 0.08, 'Jüpiter basıklığı (gözlenen 0,065)');
  assert.ok(jup.bands > 0, 'kenar kararması için bant sayısı');
  console.log('planet: gerçek harita kontrolleri geçti');
}
