// Güneş Sistemi gezegenleri: SIMBAD'da yoklar; kimlik Wikidata öğesidir (planet:Q…).
// Fiziksel değerler yine Wikidata'dan gelir; burada yalnız ad, doku, halka ve atmosfer basıncı var.
// air: Rayleigh saçılımı için gaz ve yüzey basıncı (bar). Dünya 1,013 bar; Mars 6,4 mbar CO₂.
// texture: gerçek gözlem haritası (kaynaklar assets/textures/KAYNAK.md). relief: yükseklik modelinden eğim
// haritası (R doğuya, G kuzeye yükselme, ±0,6 → 0–255). night: gece ışıkları (tek renk). Kamu malı tam haritası
// olmayan (Satürn) ya da görünür ışıkta yüzeyi görünmeyen (Venüs, Uranüs, Neptün) cisimler modelle çizilir.
// Halka yarıçapları gezegen ekvator yarıçapı (60 268 km) biriminde (NASA Saturn Fact Sheet:
// C halkası iç kenarı 74 658 km, A halkası dış kenarı 136 775 km); iç yapı SATURN_RING_TAU tablosunda.

export const SOLAR_PLANETS = [
  { id: 'planet:Q308', key: 'mercury', tilt: 0.03, tr: 'Merkür', en: 'Mercury', texture: 'assets/textures/mercury.jpg' },
  { id: 'planet:Q313', key: 'venus', tilt: 177.4, tr: 'Venüs', en: 'Venus', clouds: true },
  { id: 'planet:Q2', key: 'earth', tilt: 23.44, tr: 'Dünya', en: 'Earth', texture: 'assets/textures/earth.jpg', night: 'assets/textures/earth_night.jpg', atmosphere: [0.35, 0.55, 1.0], air: { gas: 'air', bar: 1.013 } },
  { id: 'planet:Q111', key: 'mars', tilt: 25.19, tr: 'Mars', en: 'Mars', texture: 'assets/textures/mars.jpg', relief: 'assets/textures/mars_n.jpg', atmosphere: [0.85, 0.6, 0.45], air: { gas: 'co2', bar: 0.0064 } },
  { id: 'planet:Q319', key: 'jupiter', tilt: 3.13, tr: 'Jüpiter', en: 'Jupiter', texture: 'assets/textures/jupiter.jpg' },
  { id: 'planet:Q193', key: 'saturn', tilt: 26.73, tr: 'Satürn', en: 'Saturn', ring: { inner: 1.239, outer: 2.269 } },
  { id: 'planet:Q324', key: 'uranus', tilt: 97.77, tr: 'Uranüs', en: 'Uranus' },
  { id: 'planet:Q332', key: 'neptune', tilt: 28.32, tr: 'Neptün', en: 'Neptune' },
];

// Satürn halkalarının dik optik derinliği: [yarıçap (Satürn ekvator yarıçapı = 60 268 km), τ]. Düğümler
// arasında doğrusal. Cassini yıldız örtülmelerinin özetinden (Colwell+ 2009, "The Structure of Saturn's
// Rings") yuvarlanmış değerler: C halkası 0,05–0,12 (platolarda ~0,35), B halkası 1,2–4+ (B3 en yoğun),
// Huygens aralığı boş, Cassini Bölümü ~0,1, A halkası içte 1, ortada 0,5, Encke aralığı boş.
export const SATURN_RING_TAU = [
  [1.2388, 0], [1.2395, 0.05], [1.30, 0.07], [1.40, 0.10], [1.45, 0.12], [1.455, 0.35], [1.47, 0.35], [1.475, 0.12],
  [1.5260, 0.12], [1.5270, 1.2], [1.6427, 1.3], [1.6510, 2.2], [1.7339, 2.6], [1.7420, 4.0], [1.8252, 4.0],
  [1.8335, 2.6], [1.9330, 2.2], [1.9508, 1.3], [1.9512, 0], [1.9590, 0], [1.9596, 0.10], [2.0265, 0.12],
  [2.0272, 1.0], [2.0575, 0.8], [2.1238, 0.5], [2.2130, 0.55], [2.2136, 0], [2.2191, 0], [2.2196, 0.6],
  [2.2690, 0.65], [2.2695, 0],
];

// Halka parçacıklarının bölgeye göre doğrusal yansıtma rengi: [iç yarıçap, [R, G, B]]. B ve A halkası
// kırmızımsı-kahve, B en kırmızı ve en parlak; C halkası ve Cassini Bölümü koyu ve nötr gri (Cassini ISS/VIMS
// eğilimleri, Cuzzi+ 2009 özeti). Değerler yuvarlanmış, temsili; sınırlar SATURN_RING_TAU ile aynı.
export const SATURN_RING_COLOR = [
  [1.2388, [0.30, 0.29, 0.28]], [1.5270, [0.62, 0.52, 0.40]], [1.9510, [0.36, 0.35, 0.34]], [2.0272, [0.55, 0.49, 0.41]],
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
  { id: 'moon:Q405', key: 'moon', texture: 'assets/textures/moon.jpg', relief: 'assets/textures/moon_n.jpg', parent: 'planet:Q2', tr: 'Ay', en: 'Moon', inst: 'eye', look: { mode: 4, zone: [0.56, 0.55, 0.53], belt: [0.24, 0.24, 0.23] } },
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
