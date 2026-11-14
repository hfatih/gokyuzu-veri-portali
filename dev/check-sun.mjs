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

// SDO görüntüsü: disk merkezi, yarıçapı ve sessiz Güneş parlaklığı yapay bir görüntüden doğru bulunur
{
  const { analyzeDisk } = await import('../js/sun/sdo.js');
  const w = 400, h = 400, px = new Uint8ClampedArray(w * h * 4);
  const cx = 203, cy = 198, R = 180;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    let v = d < R ? 200 : 0;
    if (Math.hypot(x - 230, y - 200) < 6) v = 50;                    // bir leke
    if (y > 380 && x < 120) v = 255;                                 // köşedeki yazı etiketi
    px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255;
  }
  const d = analyzeDisk(px, w, h);
  near(d.cx * w, cx - 1, cx + 1, 'disk merkezi x'); near(d.cy * h, cy - 1, cy + 1, 'disk merkezi y');
  near(d.r * w, R - 1.5, R + 1.5, 'disk yarıçapı');
  near(d.quiet, 199 / 255, 201 / 255, 'sessiz Güneş (leke ortancayı bozmaz)');
  assert.equal(analyzeDisk(new Uint8ClampedArray(w * h * 4), w, h), null, 'boş görüntü');
  // Leke gölgesi (f ≈ 0,25) Planck tersinden ~4300 K, fakül (f 1,1) biraz sıcak: shader'daki bağıntı
  const Tof = (T, f) => 26160 / Math.log(1 + Math.expm1(26160 / T) / f);
  near(Tof(5772, 0.25), 4200, 4500, 'leke gölgesi sıcaklığı'); near(Tof(5772, 1.1), 5850, 5950, 'fakül sıcaklığı');
  console.log('sun: SDO görüntü çözümlemesi geçti');
}
