// Ana sayfadaki "Keşfet" listesi: her türden tanınmış bir örnek. "Bugünün cismi" yılın gününe göre
// bu listeden döner (herkes aynı gün aynı cismi görür).

export const FEATURED = [
  { tr: 'Güneş', en: 'Sun', kind: 'star', ref: { id: 'Sun', otype: '*' } },
  { tr: 'Betelgeuse', en: 'Betelgeuse', kind: 'star', ref: { simbad: '* alf Ori' } },
  { tr: 'Satürn', en: 'Saturn', kind: 'planet', ref: { id: 'planet:Q193', otype: 'Pl' } },
  { tr: 'Ay', en: 'Moon', kind: 'moon', ref: { id: 'moon:Q405', otype: 'Moon' } },
  { tr: 'Orion Bulutsusu', en: 'Orion Nebula', kind: 'nebula', ref: { simbad: 'M 42' } },
  { tr: 'Andromeda Gökadası', en: 'Andromeda Galaxy', kind: 'galaxy', ref: { simbad: 'M 31' } },
  { tr: 'Ülker', en: 'Pleiades', kind: 'cluster', ref: { simbad: 'M 45' } },
  { tr: 'Yengeç Pulsarı', en: 'Crab Pulsar', kind: 'pulsar', ref: { simbad: 'V* CM Tau' } },
  { tr: 'Sagittarius A*', en: 'Sagittarius A*', kind: 'bh', ref: { bh: 'Sagittarius A*' } },
  { tr: 'Ceres', en: 'Ceres', kind: 'sso', ref: { id: 'sso:Ceres', otype: 'DwarfPl' } },
  { tr: '3C 273', en: '3C 273', kind: 'quasar', ref: { simbad: '3C 273' } },
  { tr: 'Halka Bulutsusu', en: 'Ring Nebula', kind: 'nebula', ref: { simbad: 'M 57' } },
  { tr: 'Delta Cephei', en: 'Delta Cephei', kind: 'variable', ref: { simbad: '* del Cep' } },
  { tr: 'Alfa Centauri', en: 'Alpha Centauri', kind: 'binary', ref: { simbad: '* alf Cen' } },
  { tr: 'Algol', en: 'Algol', kind: 'variable', ref: { simbad: '* bet Per' } },
  { tr: 'Jüpiter', en: 'Jupiter', kind: 'planet', ref: { id: 'planet:Q319', otype: 'Pl' } },
];

/** Yılın günü (yerel saat). */
export function dayOfYear(d = new Date()) {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);
}

export const todaysPick = (d = new Date()) => FEATURED[dayOfYear(d) % FEATURED.length];
