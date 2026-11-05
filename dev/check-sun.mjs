// node dev/check-sun.mjs — Güneş lekesi etkinliği modeli, gözlenmiş değerlerle
import assert from 'node:assert/strict';
import { sunspotNumber, spoererLat, omegaDeg, joyTilt, lifetimeDays, createSunModel, MAX_SPOTS } from '../js/sun/activity.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);

// 25. döngü: Aralık 2019 minimumu, 2024 sonunda ~160 tepe (SILSO), 2026 sonunda azalıyor
let peakY = 0, peak = 0;
for (let y = 2020; y < 2030; y += 0.05) { const r = sunspotNumber(y); if (r > peak) { peak = r; peakY = y; } }
near(peak, 150, 175, 'döngü 25 tepe');
near(peakY, 2023.8, 2025.6, 'tepe yılı');
near(sunspotNumber(2020.0), 0, 15, '2020 başı (minimum)');
near(sunspotNumber(2026.85), 60, 140, 'Kasım 2026');
assert.ok(sunspotNumber(2026.85) < peak, 'tepeden sonra azalıyor');

// Spörer: başta ~28°, 7 yılda ~11°; Joy: 20°'de ~11° eğiklik
near(spoererLat(0), 27.9, 28.1, 'Spörer başlangıç'); near(spoererLat(83), 10, 12.5, 'Spörer 2026');
near(joyTilt(20), 10, 12, 'Joy 20°');
// Snodgrass & Ulrich: ekvator 14,71 °/gün → 24,5 gün yıldızsal; 60°'de ~30 gün
near(360 / omegaDeg(0), 24.4, 24.6, 'ekvator dönme süresi'); near(360 / omegaDeg(60), 29.5, 31, '60° dönme süresi');
// Gnevyshev–Waldmeier: 300 MSH → 30 gün
assert.equal(lifetimeDays(300), 30);

// Model: tekrarlanabilir, görünen grup sayısı leke sayısıyla tutarlı, diziler dolu
const m1 = createSunModel({ year0: 2024.75, seed: 7, obsLon: 0 });
const m2 = createSunModel({ year0: 2024.75, seed: 7, obsLon: 0 });
assert.deepEqual([...m1.stateAt(3).spots.slice(0, 8)], [...m2.stateAt(3).spots.slice(0, 8)]);
let vis = 0;
for (let d = 0; d < 60; d += 3) vis += m1.summary(d).visibleGroups;
near(vis / 20, 7, 22, 'tepe yakınında görünen grup ortalaması (R/12 ≈ 13)');
const minModel = createSunModel({ year0: 2019.95, seed: 3 });
let visMin = 0;
for (let d = 0; d < 60; d += 3) visMin += minModel.summary(d).visibleGroups;
assert.ok(visMin / 20 < 2, 'minimumda neredeyse lekesiz');
const st = m1.stateAt(10);
assert.ok(st.nSpots > 0 && st.nSpots <= MAX_SPOTS && st.nFac > 0);
for (let i = 0; i < st.nSpots; i++) {
  const [x, y, z, r] = st.spots.slice(i * 4, i * 4 + 4);
  near(Math.hypot(x, y, z), 0.999, 1.001, 'birim vektör');
  near(r, 0.002, 0.08, 'leke açısal yarıçapı');
  near(Math.asin(y) * 180 / Math.PI, -50, 50, 'leke enlemi');
}
// Ortalama leke enlemi Spörer kuşağına yakın (2024 sonu: ~16°)
const lats = m1.groupsAt(20).filter((g) => g.area > 0).map((g) => Math.abs(g.g.lat));
near(lats.reduce((s, x) => s + x, 0) / lats.length, 10, 22, 'ortalama enlem');

// Gerçek bölgeler: görünen yüzde model grupları yerine geçer; konum gözlemciye göre
const real = createSunModel({ year0: 2026.85, seed: 7, obsLon: 30, real: [{ lat: 12, cmd: -20, area: 400, id: '14000' }] });
const s0 = real.summary(0);
assert.equal(s0.realGroups, 1);
const g = real.groupsAt(0).find((x) => x.g.real);
near(g.area, 395, 405, 'gerçek bölgenin bugünkü alanı');
console.log('sun: tüm kontroller geçti');

// NOAA SWPC bölge raporu ayrıştırma
const { parseLocation, parseRegions } = await import('../js/sun/noaa.js');
assert.deepEqual(parseLocation('N12W34'), { lat: 12, cmd: 34 });
assert.deepEqual(parseLocation('S05E70'), { lat: -5, cmd: -70 });
assert.equal(parseLocation('xx'), null);
const regs = parseRegions([
  { observed_date: '2026-11-04', region: 14001, location: 'N10E20', area: 200 },
  { observed_date: '2026-11-05', region: 14001, location: 'N10E07', area: 220 },
  { observed_date: '2026-11-05', region: 14002, location: 'S15W40', area: 0 },      // lekesiz plaj
  { observed_date: '2026-11-05', region: 14003, latitude: -8, central_meridian_distance: 55, area: 90 },
]);
assert.equal(regs.length, 2);
assert.deepEqual(regs.map((r) => r.id), ['14001', '14003']);
assert.equal(regs[0].cmd, -7);
assert.deepEqual(parseRegions(null), []);
console.log('sun: NOAA ayrıştırma geçti');
