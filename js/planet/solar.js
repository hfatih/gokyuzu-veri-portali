// Güneş Sistemi gezegenleri: SIMBAD'da yoklar; kimlik Wikidata öğesidir (planet:Q…).
// Fiziksel değerler yine Wikidata'dan gelir; burada yalnız ad, doku ve halka geometrisi var.
// texture: gerçek gözlem haritası (kaynaklar assets/textures/KAYNAK.md). Kamu malı tam haritası
// olmayan (Satürn) ya da görünür ışıkta yüzeyi görünmeyen (Venüs, Uranüs, Neptün) cisimler modelle çizilir.
// Halka yarıçapları gezegen ekvator yarıçapı (60 268 km) biriminde (NASA Saturn Fact Sheet:
// C halkası iç kenarı 74 658 km, B halkası 92 000 km'de başlar, A halkası dış kenarı 136 775 km; Cassini aralığı 117 580–122 170 km).

export const SOLAR_PLANETS = [
  { id: 'planet:Q308', key: 'mercury', tilt: 0.03, tr: 'Merkür', en: 'Mercury', texture: 'assets/textures/mercury.jpg' },
  { id: 'planet:Q313', key: 'venus', tilt: 177.4, tr: 'Venüs', en: 'Venus', clouds: true },
  { id: 'planet:Q2', key: 'earth', tilt: 23.44, tr: 'Dünya', en: 'Earth', texture: 'assets/textures/earth.jpg', atmosphere: [0.35, 0.55, 1.0] },
  { id: 'planet:Q111', key: 'mars', tilt: 25.19, tr: 'Mars', en: 'Mars', texture: 'assets/textures/mars.jpg', atmosphere: [0.85, 0.6, 0.45] },
  { id: 'planet:Q319', key: 'jupiter', tilt: 3.13, tr: 'Jüpiter', en: 'Jupiter', texture: 'assets/textures/jupiter.jpg' },
  { id: 'planet:Q193', key: 'saturn', tilt: 26.73, tr: 'Satürn', en: 'Saturn', ring: { inner: 1.239, bStart: 1.527, gap: [1.951, 2.027], outer: 2.269 } },
  { id: 'planet:Q324', key: 'uranus', tilt: 97.77, tr: 'Uranüs', en: 'Uranus' },
  { id: 'planet:Q332', key: 'neptune', tilt: 28.32, tr: 'Neptün', en: 'Neptune' },
];

export const solarPlanet = (id) => SOLAR_PLANETS.find((p) => p.id === id) ?? null;
export const isSolarPlanetId = (id) => typeof id === 'string' && id.startsWith('planet:');

// Büyük uydular (faz 12). Kimlik Wikidata öğesi (moon:Q…); değerler Wikidata'dan. Hepsi gelgit
// kilitli (dönme = yörünge dönemi). look: yüzeyin temsili iki tonu (gözlem görüntülerinden kaba
// ortalama, harita değil); kip 4 lekeli yüzey, kip 2 bulut örtüsü (Titan'ın pusu).
// texture varsa gerçek harita çizilir, look yalnız harita inene kadar görünür. mono: harita tek
// renkli (gri); look.zone tonuyla renklendirilir.
// inst: gökyüzünde görmek için gereken araç; konum ana gezegenin konumu alınır.
export const SOLAR_MOONS = [
  { id: 'moon:Q405', key: 'moon', texture: 'assets/textures/moon.jpg', parent: 'planet:Q2', tr: 'Ay', en: 'Moon', inst: 'eye', look: { mode: 4, zone: [0.56, 0.55, 0.53], belt: [0.24, 0.24, 0.23] } },
  { id: 'moon:Q7547', key: 'phobos', parent: 'planet:Q111', tr: 'Fobos', en: 'Phobos', inst: 'large', look: { mode: 4, zone: [0.32, 0.29, 0.26], belt: [0.16, 0.14, 0.13] } },
  { id: 'moon:Q7548', key: 'deimos', parent: 'planet:Q111', tr: 'Deimos', en: 'Deimos', inst: 'large', look: { mode: 4, zone: [0.36, 0.33, 0.29], belt: [0.2, 0.18, 0.16] } },
  { id: 'moon:Q3123', key: 'io', texture: 'assets/textures/io.jpg', parent: 'planet:Q319', tr: 'İo', en: 'Io', inst: 'binoculars', look: { mode: 4, zone: [0.93, 0.86, 0.46], belt: [0.66, 0.44, 0.2] } },
  { id: 'moon:Q3143', key: 'europa', texture: 'assets/textures/europa.jpg', mono: true, parent: 'planet:Q319', tr: 'Europa', en: 'Europa', inst: 'binoculars', look: { mode: 4, zone: [0.9, 0.88, 0.82], belt: [0.62, 0.46, 0.33] } },
  { id: 'moon:Q3169', key: 'ganymede', texture: 'assets/textures/ganymede.jpg', mono: true, parent: 'planet:Q319', tr: 'Ganymede', en: 'Ganymede', inst: 'binoculars', look: { mode: 4, zone: [0.63, 0.59, 0.53], belt: [0.34, 0.3, 0.26] } },
  { id: 'moon:Q3134', key: 'callisto', texture: 'assets/textures/callisto.jpg', mono: true, parent: 'planet:Q319', tr: 'Kallisto', en: 'Callisto', inst: 'binoculars', look: { mode: 4, zone: [0.44, 0.4, 0.35], belt: [0.2, 0.18, 0.16] } },
  { id: 'moon:Q2565', key: 'titan', parent: 'planet:Q193', tr: 'Titan', en: 'Titan', inst: 'small', look: { mode: 2, zone: [0.86, 0.62, 0.3], belt: [0.78, 0.53, 0.25], contrast: 0.12, atm: [0.95, 0.65, 0.3, 0.45] } },
  { id: 'moon:Q3303', key: 'enceladus', texture: 'assets/textures/enceladus.jpg', mono: true, parent: 'planet:Q193', tr: 'Enceladus', en: 'Enceladus', inst: 'large', look: { mode: 4, zone: [0.97, 0.97, 0.98], belt: [0.8, 0.85, 0.9] } },
  { id: 'moon:Q3359', key: 'triton', parent: 'planet:Q332', tr: 'Triton', en: 'Triton', inst: 'large', look: { mode: 4, zone: [0.86, 0.79, 0.73], belt: [0.6, 0.55, 0.55] } },
];

export const solarMoon = (id) => SOLAR_MOONS.find((m) => m.id === id) ?? null;
export const isMoonId = (id) => typeof id === 'string' && id.startsWith('moon:');
