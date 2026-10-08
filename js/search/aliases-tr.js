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
  { label: 'Yengeç Bulutsusu', simbadId: 'M 1' },
  { label: 'Orion Bulutsusu', simbadId: 'M 42' },
];

/** Türkçe harfleri ASCII'ye katlar: "Ülker" ve "ulker" eşleşir. */
export const fold = (s) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{M}/gu, '').replace(/ı/g, 'i');

/** Kelime başından önek eşleşmesi. Dönüş: [{ label, simbadId }] */
export function matchAliases(q) {
  const f = fold(q.trim());
  if (f.length < 2) return [];
  return ALIASES.filter((a) => fold(a.label).split(/\s+/).some((_, i, w) => w.slice(i).join(' ').startsWith(f)));
}
