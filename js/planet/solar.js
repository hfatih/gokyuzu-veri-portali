// Güneş Sistemi gezegenleri: SIMBAD'da yoklar; kimlik Wikidata öğesidir (planet:Q…).
// Fiziksel değerler yine Wikidata'dan gelir; burada yalnız ad, doku ve halka geometrisi var.
// Halka yarıçapları gezegen ekvator yarıçapı (60 268 km) biriminde (NASA Saturn Fact Sheet:
// C halkası iç kenarı 74 658 km, B halkası 92 000 km'de başlar, A halkası dış kenarı 136 775 km; Cassini aralığı 117 580–122 170 km).

export const SOLAR_PLANETS = [
  { id: 'planet:Q308', key: 'mercury', tilt: 0.03, tr: 'Merkür', en: 'Mercury', texture: 'assets/textures/mercury.jpg' },
  { id: 'planet:Q313', key: 'venus', tilt: 177.4, tr: 'Venüs', en: 'Venus', clouds: true },
  { id: 'planet:Q2', key: 'earth', tilt: 23.44, tr: 'Dünya', en: 'Earth', texture: 'assets/textures/earth.jpg', atmosphere: [0.35, 0.55, 1.0] },
  { id: 'planet:Q111', key: 'mars', tilt: 25.19, tr: 'Mars', en: 'Mars', texture: 'assets/textures/mars.jpg', atmosphere: [0.85, 0.6, 0.45] },
  { id: 'planet:Q319', key: 'jupiter', tilt: 3.13, tr: 'Jüpiter', en: 'Jupiter' },
  { id: 'planet:Q193', key: 'saturn', tilt: 26.73, tr: 'Satürn', en: 'Saturn', ring: { inner: 1.239, bStart: 1.527, gap: [1.951, 2.027], outer: 2.269 } },
  { id: 'planet:Q324', key: 'uranus', tilt: 97.77, tr: 'Uranüs', en: 'Uranus' },
  { id: 'planet:Q332', key: 'neptune', tilt: 28.32, tr: 'Neptün', en: 'Neptune' },
];

export const solarPlanet = (id) => SOLAR_PLANETS.find((p) => p.id === id) ?? null;
export const isSolarPlanetId = (id) => typeof id === 'string' && id.startsWith('planet:');
