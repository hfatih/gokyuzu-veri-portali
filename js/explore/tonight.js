// "Bu gece gökyüzünde": konum ve zamandan önümüzdeki 24 saatte karanlıkta (Güneş < −12°) 10°'nin
// üstüne çıkan parlak cisimler. Ağ gerekmez; konumlar sky/ephem.js'ten. Saf fonksiyon.

import { skyPath, positionFn, compass } from '../sky/visibility.js';
import { altAz } from '../sky/ephem.js';

// En parlak yıldızlar (J2000, SIMBAD) ve görünür parlaklıkları
export const BRIGHT_STARS = [
  { id: '* alf CMa', tr: 'Sirius', en: 'Sirius', ra: 101.2872, dec: -16.7161, V: -1.46 },
  { id: '* alf Boo', tr: 'Arcturus', en: 'Arcturus', ra: 213.9153, dec: 19.1824, V: -0.05 },
  { id: '* alf Lyr', tr: 'Vega', en: 'Vega', ra: 279.2347, dec: 38.7837, V: 0.03 },
  { id: '* alf Aur', tr: 'Capella', en: 'Capella', ra: 79.1723, dec: 45.998, V: 0.08 },
  { id: '* bet Ori', tr: 'Rigel', en: 'Rigel', ra: 78.6345, dec: -8.2016, V: 0.13 },
  { id: '* alf CMi', tr: 'Procyon', en: 'Procyon', ra: 114.8255, dec: 5.225, V: 0.37 },
  { id: '* alf Ori', tr: 'Betelgeuse', en: 'Betelgeuse', ra: 88.7929, dec: 7.4071, V: 0.42 },
  { id: '* alf Aql', tr: 'Altair', en: 'Altair', ra: 297.6958, dec: 8.8683, V: 0.76 },
  { id: '* alf Tau', tr: 'Aldebaran', en: 'Aldebaran', ra: 68.9802, dec: 16.5093, V: 0.86 },
  { id: '* alf Sco', tr: 'Antares', en: 'Antares', ra: 247.3519, dec: -26.432, V: 0.96 },
  { id: '* alf Vir', tr: 'Spika', en: 'Spica', ra: 201.2983, dec: -11.1613, V: 0.97 },
  { id: '* alf Cyg', tr: 'Deneb', en: 'Deneb', ra: 310.358, dec: 45.2803, V: 1.25 },
];

const PLANETS = [
  { key: 'mercury', id: 'planet:Q308', tr: 'Merkür', en: 'Mercury' },
  { key: 'venus', id: 'planet:Q313', tr: 'Venüs', en: 'Venus' },
  { key: 'mars', id: 'planet:Q111', tr: 'Mars', en: 'Mars' },
  { key: 'jupiter', id: 'planet:Q319', tr: 'Jüpiter', en: 'Jupiter' },
  { key: 'saturn', id: 'planet:Q193', tr: 'Satürn', en: 'Saturn' },
];

/**
 * lat/lon derece, jd: başlangıç anı. Dönüş: en iyi ana göre sıralı
 * [{ id, label, kind: 'moon' | 'planet' | 'star', best: { jd, alt }, az, dir }]; karanlıkta görünmeyenler yok.
 * limit: en çok kaç cisim (Ay ve gezegenler her zaman öne alınır).
 */
export function tonightList(lat, lon, jd, lang = 'tr', limit = 8) {
  const items = [
    { id: 'moon:Q405', label: lang === 'en' ? 'Moon' : 'Ay', kind: 'moon', src: { type: 'moon' } },
    ...PLANETS.map((p) => ({ id: p.id, label: p[lang], kind: 'planet', src: { type: 'planet', key: p.key } })),
    ...BRIGHT_STARS.map((s) => ({ id: s.id, label: s[lang], kind: 'star', src: { type: 'fixed', ra: s.ra, dec: s.dec } })),
  ];
  const out = [];
  for (const it of items) {
    const p = skyPath(it.src, lat, lon, jd);
    if (!p.best) continue;
    const pos = positionFn(it.src)(p.best.jd);
    const az = altAz(pos.ra, pos.dec, lat, lon, p.best.jd).az;
    out.push({ id: it.id, label: it.label, kind: it.kind, best: { jd: p.best.jd, alt: p.best.alt }, az, dir: compass(az, lang) });
  }
  const solar = out.filter((x) => x.kind !== 'star'), stars = out.filter((x) => x.kind === 'star');
  return [...solar, ...stars].slice(0, limit).sort((a, b) => a.best.jd - b.best.jd);
}
