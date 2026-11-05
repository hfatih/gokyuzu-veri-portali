// node dev/check-sky.mjs — gökyüzü konumları, yayımlanmış tarih ve değerlerle
import assert from 'node:assert/strict';
import { gmst, obliquity, sunPosition, moonPhase, planetPosition, elongation, altAz, precess, jdFromDate } from '../js/sky/ephem.js';
import { skyPath, compass, instrumentFor } from '../js/sky/visibility.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);
const jd = (iso) => jdFromDate(new Date(iso));
const hoursUtc = (j) => ((j - 0.5) % 1) * 24;

// Yıldız zamanı: 2000-01-01 12:00 UT'de 280,46062° (Meeus 12.a)
near(gmst(2451545), 280.4605, 280.4607, 'GMST J2000');
// Meeus 12.b: 1987-04-10 19:21 UT → 128,7378734°
near(gmst(jd('1987-04-10T19:21:00Z')), 128.735, 128.741, 'GMST 1987');

// Güneş: 2024 Haziran gündönümü 20:51 UT → boylam 90°, δ +23,44°; Mart ılımı 03:06 UT → 0°
near(sunPosition(jd('2024-06-20T20:51:00Z')).lon, 89.98, 90.02, 'gündönümü boylamı');
near(sunPosition(jd('2024-06-20T20:51:00Z')).dec, 23.42, 23.45, 'gündönümü δ');
const eq = sunPosition(jd('2024-03-20T03:06:00Z')).lon;
near(eq > 180 ? eq - 360 : eq, -0.02, 0.02, 'ılım boylamı');

// Ay: dolunay 2024-04-23 23:49 UT, yeniay (tam güneş tutulması) 2024-04-08 18:21 UT
near(moonPhase(jd('2024-04-23T23:49:00Z')).illum, 0.995, 1, 'dolunay');
near(moonPhase(jd('2024-04-08T18:21:00Z')).illum, 0, 0.005, 'yeniay');
assert.equal(moonPhase(jd('2024-04-15T00:00:00Z')).waxing, true);

// Karşı konumlar: ekliptik boylam farkı 180° (enlem yüzünden elongasyon 180°'den az olabilir)
// Mars 2025-01-16 02 UT, Jüpiter 2023-11-03 05 UT, Satürn 2024-09-08 04 UT
const R = Math.PI / 180;
const eclLon = (p, j) => { const e = obliquity(j) * R, a = p.ra * R, d = p.dec * R;
  return ((Math.atan2(Math.sin(a) * Math.cos(e) + Math.tan(d) * Math.sin(e), Math.cos(a)) / R) % 360 + 360) % 360; };
for (const [key, iso] of [['mars', '2025-01-16T02:00:00Z'], ['jupiter', '2023-11-03T05:00:00Z'], ['saturn', '2024-09-08T04:00:00Z']]) {
  const j = jd(iso), diff = ((eclLon(planetPosition(key, j), j) - sunPosition(j).lon) % 360 + 360) % 360;
  near(diff, 179, 181, `${key} karşı konum`);
}
// Mars'ın Dünya'ya en yakın olduğu an 2025-01-12: 96,08 milyon km = 0,6423 AU
near(planetPosition('mars', jd('2025-01-12T12:00:00Z')).distAu, 0.636, 0.648, 'Mars en yakın');
// Venüs en büyük doğu uzanımı 2025-01-10: 47,2°
near(elongation(planetPosition('venus', jd('2025-01-10T00:00:00Z')), jd('2025-01-10T00:00:00Z')), 46.6, 47.8, 'Venüs uzanımı');

// Presesyon: Meeus 21.b θ Persei J2000 (41,054063°, +49,227750°) → 2028-11-13: (41,547214°, +49,348483°)
const th = precess(41.054063, 49.22775, 2462088.69);
near(th.ra, 41.5465, 41.5480, 'presesyon α'); near(th.dec, 49.3478, 49.3492, 'presesyon δ');

// Kutup Yıldızı'nın yüksekliği enleme ~eşit (±1°); Ankara 39,93° K
const pol = precess(37.95, 89.264, jd('2026-11-05T20:00:00Z'));
near(altAz(pol.ra, pol.dec, 39.93, 32.86, jd('2026-11-05T20:00:00Z')).alt, 38.9, 41, 'Kutup Yıldızı yüksekliği');

// İstanbul (41,01 K, 28,98 D) 2024-06-21: gün doğumu 05:32, batımı 20:39 (UTC+3)
const sun = skyPath({ type: 'sun' }, 41.01, 28.98, jd('2024-06-21T00:00:00Z'));
near(hoursUtc(sun.rise), 2.45, 2.65, 'İstanbul gün doğumu (UT sa)');
near(hoursUtc(sun.set), 17.55, 17.75, 'İstanbul gün batımı (UT sa)');
assert.equal(sun.best, null);   // Güneş karanlıkta görünmez

// Kutba yakın yıldız batmaz; çok güneydeki yıldız Ankara'dan doğmaz
assert.equal(skyPath({ type: 'fixed', ra: 37.95, dec: 89.26 }, 39.93, 32.86, 2461000.5).always, 'up');
assert.equal(skyPath({ type: 'fixed', ra: 95.99, dec: -52.7 }, 39.93, 32.86, 2461000.5).always, 'down');   // Canopus
// Canopus İstanbul'un güneyinde bir şehirden (Antalya 36,9 K) ufkun hemen üstüne çıkar (90 − 36,9 − 52,7 = 0,4°)
assert.equal(skyPath({ type: 'fixed', ra: 95.99, dec: -52.7 }, 36.9, 30.7, 2461000.5).always, null);

assert.equal(compass(0), 'K'); assert.equal(compass(135), 'GD'); assert.equal(compass(350, 'en'), 'N');
assert.equal(instrumentFor(-1.46), 'eye'); assert.equal(instrumentFor(8), 'binoculars'); assert.equal(instrumentFor(20), 'large');
console.log('sky: tüm kontroller geçti');
