// node dev/check-galaxy.mjs — gökada fiziği: Hubble türü, uzaklık seçimi, eğiklik, boyut, ışıma, kozmoloji
import assert from 'node:assert/strict';
import { isGalaxy, parseMorph, pickGalaxyDistanceMpc, inclinationDeg, lookbackGyr, deriveGalaxy, internalExtinctionB, comovingMpc } from '../js/galaxy/derive.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);

assert.ok(isGalaxy('G') && isGalaxy('AGN') && isGalaxy('Sy2') && isGalaxy('GiG') && isGalaxy('LIN'));
assert.ok(!isGalaxy('*') && !isGalaxy('PN') && !isGalaxy('ClG'));

// Hubble türü (de Vaucouleurs): T sayısı ve çubuk
assert.deepEqual(parseMorph('SA(s)b'), { family: 'S', T: 3, bar: false });
assert.deepEqual(parseMorph('SB(rs)bc'), { family: 'S', T: 4, bar: true });
assert.deepEqual(parseMorph('SA(s)cd'), { family: 'S', T: 6, bar: false });
assert.deepEqual(parseMorph('SB(s)m'), { family: 'S', T: 9, bar: true });
assert.deepEqual(parseMorph('E-E/S0'), { family: 'E', T: -5, bar: false });
assert.deepEqual(parseMorph('SA0'), { family: 'S0', T: -2, bar: false });
assert.deepEqual(parseMorph('IB(s)m'), { family: 'Irr', T: 10, bar: true });
assert.deepEqual(parseMorph('1'), { family: 'S', T: 1, bar: false });      // SIMBAD bazen yalnız T yazıyor (M104)
assert.deepEqual(parseMorph('S'), { family: 'S', T: 4, bar: false });      // evre yoksa Sbc varsayılır
assert.equal(parseMorph(null), null);

// Uzaklık: yakın gökadada kırmızıya kayma yöntemi dışlanır (M33: 4,11 "redshift" yanlış, Sefeid 0,84–0,88)
const m33 = pickGalaxyDistanceMpc([{ dist: 4.11, unit: 'Mpc', method: 'redshift' }, { dist: 0.84, unit: 'Mpc', method: '' }, { dist: 0.88, unit: 'Mpc', method: 'Cep' }], -179);
near(m33.value, 0.84, 0.88, 'M33 uzaklık');
assert.equal(m33.method, 'measured');
// Ölçüm yoksa ve cz > 1000 km/s ise Hubble yasası (H0 = 70)
const hub = pickGalaxyDistanceMpc([], 1570.5);
near(hub.value, 22, 23, 'Hubble yasası uzaklığı');
assert.equal(hub.method, 'hubble');
assert.equal(pickGalaxyDistanceMpc([], 300), null);   // yakında özel hızlar baskın, Hubble yasası kullanılmaz

// Eğiklik (Hubble 1926, q0 = 0,2): M31 199,5′ × 70,8′ → ~73° (lit. 77°)
near(inclinationDeg(70.79 / 199.53), 65, 80, 'M31 eğiklik');
assert.equal(inclinationDeg(1), 0);

// Düz ΛCDM (H0 70, Ωm 0,3): z = 1 için geriye bakış süresi ~7,7 milyar yıl
near(lookbackGyr(1), 7.5, 8.0, 'z=1 geriye bakış');
near(lookbackGyr(0.0042), 0.055, 0.065, 'M87 geriye bakış');

// M31: B = 4,36, 0,78 Mpc → M_B ≈ −20,1 (sönümleme yok); çap ~45 kpc; Tully–Fisher dönüş hızı yüzlerce km/s
const m31 = deriveGalaxy({
  morph: 'SA(s)b', majArcmin: 199.53, minArcmin: 70.79, cz: -300, mags: { B: 4.36 },
  distances: [{ dist: 0.78, unit: 'Mpc', method: '' }, { dist: 0.8, unit: 'Mpc', method: 'T-F' }, { dist: 0.78, unit: 'Mpc', method: 'Cep' }],
});
near(m31.absB.value, -20.5, -19.8, 'M31 M_B');
near(m31.diameterKpc.value, 40, 50, 'M31 çap');
// İç sönümleme (RC3) düzeltmesiyle M31: A_B ≈ 0,62 kadir, dönüş hızı ~227 km/s (düzeltmesiz 187; gözlenen ~250)
near(m31.intExtB, 0.55, 0.7, 'M31 iç sönümleme');
near(m31.vRot.value, 215, 260, 'M31 Tully–Fisher hızı');
assert.equal(internalExtinctionB(3, 1), 0); assert.equal(internalExtinctionB(-5, 0.5), 0);   // yüzü dönük ve eliptik: düzeltme yok
near(Math.log10(m31.dynMass.value), 11, 12, 'M31 dinamik kütle');
assert.equal(m31.vRot.origin, 'estimated');

// Uzak gökada (z = 0,5, ölçüm yok): doğrusal Hubble yasası yerine düz ΛCDM. Parlaklık ışıma uzaklığıyla
// (2833 Mpc), boyut açısal çap uzaklığıyla (1259 Mpc); cz/H0 = 2141 Mpc ikisini de yanlış verirdi.
near(comovingMpc(0.5), 1880, 1895, 'D_C(z=0,5)');
const far = deriveGalaxy({ morph: 'Sb', majArcmin: 0.5, minArcmin: 0.3, cz: 117000, z: 0.5, mags: { B: 21 }, distances: [] });
assert.equal(far.distanceMpc.method, 'cosmo'); near(far.distanceMpc.value, 2820, 2845, 'z=0,5 ışıma uzaklığı');
near(far.diameterKpc.value, 181, 185, 'z=0,5 çap (açısal çap uzaklığıyla)');
assert.equal(deriveGalaxy({ morph: 'Sb', majArcmin: 2, minArcmin: 1, cz: 5996, z: 0.02, mags: {}, distances: [] }).distanceMpc.method, 'hubble');

// Eliptikte Tully–Fisher uygulanmaz
const m87 = deriveGalaxy({ morph: 'E-E/S0', majArcmin: 6.3, minArcmin: 5.7, cz: 1256, mags: { B: 9.59 }, distances: [{ dist: 17, unit: 'Mpc', method: '' }] });
assert.equal(m87.vRot, null);
assert.equal(m87.morph.family, 'E');

// Şişkinlik baskın (T ≤ 1) gökadada eksen oranı diski yansıtmaz: eğiklik "tahmini" (Sombrero 56° çıkar, gerçek ~84°)
const m104 = deriveGalaxy({ morph: '1', majArcmin: 8.51, minArcmin: 5.01, cz: 1095, mags: { B: 9.55 }, distances: [] });
assert.equal(m104.inclination.origin, 'estimated');
assert.equal(m31.inclination.origin, 'derived');

console.log('galaxy: tüm kontroller geçti');

// Dönme dönemi: M31 optik yarıçapta ~230 km/s ile birkaç yüz milyon yıl; Samanyolu ölçeği (220 km/s, 15 kpc) 419 Myr
near(m31.rotPeriodMyr.value, 400, 800, 'M31 dönme dönemi (Myr)');
assert.equal(deriveGalaxy({ morph: 'Sb', majArcmin: 10, minArcmin: 5, cz: 800, mags: { B: 10, V: 9.3 }, distances: [] }).bv.value.toFixed(2), '0.70');

// Sahne parametreleri: Sérsic şişkinlik B/T oranını verir, renk genç payını belirler
{
  const { galaxyVisualParams, sersicBulge, youngFraction, ellipticalSersicN } = await import('../js/galaxy/visual.js');
  // Yoğunluğun sayısal hacim integrali istenen ışığı vermeli (n = 1 ve n = 4, basık)
  for (const [n, re] of [[1, 0.07], [4, 0.3]]) {
    const s = sersicBulge(n, re, 0.5, 0.6, 1.2);
    let sum = 0;
    for (let r = 5e-5; r < 1.2; r *= 1.002) sum += s.amp * (r / re) ** -s.p * Math.exp(-s.b * (r / re) ** (1 / n)) * 4 * Math.PI * 0.6 * r ** 3 * 0.002;
    near(sum, 0.49, 0.51, `Sérsic n=${n} toplam ışık`);
  }
  // Prugniel–Simien: n = 4'te p ≈ 0,851, b ≈ 7,669
  const s4 = sersicBulge(4, 0.3, 1, 1, 1.45);
  near(s4.p, 0.85, 0.852, 'p(n=4)'); near(s4.b, 7.66, 7.68, 'b(n=4)');
  // Renk → genç ışık payı: eliptik rengi 0, Sb ~0,2, Sc ~0,35; tekdüze artar
  assert.equal(youngFraction(0.95), 0);
  near(youngFraction(0.65), 0.2, 0.26, 'Sb genç payı'); near(youngFraction(0.5), 0.33, 0.4, 'Sc genç payı');
  // Graham & Guzmán: M_B = −21'de n ≈ 5, −18'de ≈ 2,5
  near(ellipticalSersicN(-21), 4.8, 5.6, 'dev eliptik n'); near(ellipticalSersicN(-18), 2.2, 2.8, 'cüce eliptik n');

  const obj = { mainId: 'M  31' };
  const vp = galaxyVisualParams(m31, obj);
  assert.equal(vp.family, 2);
  near(vp.sersic.n, 2.1, 2.3, 'Sb şişkinliği Sérsic n');
  near(vp.hz, 0.05, 0.065, 'Sb disk kalınlığı (R25 = 1)');
  assert.ok(vp.rotRate > 0 && vp.omegaP > 0 && vp.youngFrac > 0 && vp.youngFrac < 0.85);
  // Mavi gökada daha çok genç ışık taşır; geç tür daha ince, daha yumak, şişkinliği küçük
  const blue = galaxyVisualParams({ ...m31, bv: { value: 0.45 } }, obj), red = galaxyVisualParams({ ...m31, bv: { value: 0.85 } }, obj);
  assert.ok(blue.youngFrac > red.youngFrac, 'mavi gökadada genç pay büyük');
  const sd = galaxyVisualParams({ ...m31, morph: { family: 'S', T: 7, bar: false }, bv: null }, obj);
  assert.ok(sd.hz < vp.hz && sd.floc > vp.floc && sd.sersic.amp * sd.sersic.re ** 3 < vp.sersic.amp * vp.sersic.re ** 3);
  // Eliptik: disk yok, durağan
  const e = galaxyVisualParams(m87, { mainId: 'M  87' });
  assert.deepEqual([e.family, e.youngFrac, e.arms], [0, 0, 0]);
  const { galaxyScene } = await import('../js/render/galaxy.js');
  assert.equal(galaxyScene.static(e), true); assert.equal(galaxyScene.static(vp), false);
  assert.equal(galaxyScene.timeScale(e), 0); assert.ok(galaxyScene.timeScale(vp) > 1e10, 'bir tur yüz milyonlarca yıl');
  console.log('galaxy: sahne parametreleri geçti');
}
