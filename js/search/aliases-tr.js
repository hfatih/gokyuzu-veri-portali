// Wikidata'da karşılığı bulunmayan geleneksel Türkçe adlar → SIMBAD kimliği.
// Veri deposu değil, yalnız ad eşlemesidir. Emin olunmayan halk adları eklenmez.
// ponytail: elle tutulan kısa liste, kaynaklı bir sözlük bulunursa ondan üretilebilir

const ALIASES = [
  { label: 'Akyıldız', simbadId: '* alf CMa' },        // Sirius
  { label: 'Demirkazık', simbadId: '* alf UMi' },      // Kutup Yıldızı
  { label: 'Temir Kazık', simbadId: '* alf UMi' },
  { label: 'Kutup Yıldızı', simbadId: '* alf UMi' },
  { label: 'Ülker', simbadId: 'NAME Pleiades' },
  { label: 'Ülker Yıldızları', simbadId: 'NAME Pleiades' },
  { label: 'Güneş', simbadId: 'Sun' },
  { label: 'Sun', simbadId: 'Sun' },
  { label: 'Andromeda Gökadası', simbadId: 'M 31' },
  // Güneş Sistemi gezegenleri SIMBAD'da yok; kimlik Wikidata öğesi (planet/solar.js)
  { label: 'Merkür', simbadId: 'planet:Q308' }, { label: 'Mercury', simbadId: 'planet:Q308' },
  { label: 'Venüs', simbadId: 'planet:Q313' }, { label: 'Venus', simbadId: 'planet:Q313' },
  { label: 'Dünya', simbadId: 'planet:Q2' }, { label: 'Earth', simbadId: 'planet:Q2' },
  { label: 'Mars', simbadId: 'planet:Q111' },
  { label: 'Jüpiter', simbadId: 'planet:Q319' }, { label: 'Jupiter', simbadId: 'planet:Q319' },
  { label: 'Satürn', simbadId: 'planet:Q193' }, { label: 'Saturn', simbadId: 'planet:Q193' },
  { label: 'Uranüs', simbadId: 'planet:Q324' }, { label: 'Uranus', simbadId: 'planet:Q324' },
  { label: 'Neptün', simbadId: 'planet:Q332' }, { label: 'Neptune', simbadId: 'planet:Q332' },
  { label: 'Yengeç Bulutsusu', simbadId: 'M 1' },
  { label: 'Orion Bulutsusu', simbadId: 'M 42' },
  { label: 'Yengeç Pulsarı', simbadId: 'V* CM Tau' },
  { label: 'Vela Pulsarı', simbadId: 'NAME Vela Pulsar' },
  // Uydular Wikidata öğesiyle (planet/solar.js SOLAR_MOONS)
  { label: 'Ay', simbadId: 'moon:Q405', otype: 'Moon' }, { label: 'Moon', simbadId: 'moon:Q405', otype: 'Moon' },
  { label: 'Fobos', simbadId: 'moon:Q7547', otype: 'Moon' }, { label: 'Phobos', simbadId: 'moon:Q7547', otype: 'Moon' },
  { label: 'Deimos', simbadId: 'moon:Q7548', otype: 'Moon' },
  { label: 'İo', simbadId: 'moon:Q3123', otype: 'Moon' }, { label: 'Io', simbadId: 'moon:Q3123', otype: 'Moon' },
  { label: 'Europa', simbadId: 'moon:Q3143', otype: 'Moon' }, { label: 'Avrupa (uydu)', simbadId: 'moon:Q3143', otype: 'Moon' },
  { label: 'Ganymede', simbadId: 'moon:Q3169', otype: 'Moon' }, { label: 'Ganimed', simbadId: 'moon:Q3169', otype: 'Moon' },
  { label: 'Kallisto', simbadId: 'moon:Q3134', otype: 'Moon' }, { label: 'Callisto', simbadId: 'moon:Q3134', otype: 'Moon' },
  { label: 'Titan', simbadId: 'moon:Q2565', otype: 'Moon' },
  { label: 'Enceladus', simbadId: 'moon:Q3303', otype: 'Moon' },
  { label: 'Triton', simbadId: 'moon:Q3359', otype: 'Moon' },
  // Küçük cisimler IMCCE kimliğiyle (sso/fetch.js)
  { label: 'Plüton', simbadId: 'sso:Pluto', otype: 'DwarfPl' }, { label: 'Pluto', simbadId: 'sso:Pluto', otype: 'DwarfPl' },
  { label: 'Halley Kuyruklu Yıldızı', simbadId: 'sso:1P', otype: 'Comet' },
];

/** Türkçe harfleri ASCII'ye katlar: "Ülker" ve "ulker" eşleşir. */
export const fold = (s) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{M}/gu, '').replace(/ı/g, 'i');

/** Kelime başından önek eşleşmesi. Dönüş: [{ label, simbadId }] */
export function matchAliases(q) {
  const f = fold(q.trim());
  if (f.length < 2) return [];
  return ALIASES.filter((a) => fold(a.label).split(/\s+/).some((_, i, w) => w.slice(i).join(' ').startsWith(f)));
}
