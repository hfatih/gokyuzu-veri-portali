// Ana sayfa ve turlardaki cisim başvuruları. Kimlikler ya doğrudan açılır (Güneş, planet:, sso:, moon:)
// ya SIMBAD kimlik tablosundan (ident) ana kimliğe çözülür ya da Wikidata'da kara delik olarak aranır.
// Çözülemezse çağıran taraf adı arama kutusuna yazar.

import { lookupIds } from '../search/simbad.js';
import { searchWikidata } from '../search/wikidata.js';

/**
 * ref: { id } (doğrudan), { simbad } (SIMBAD kimliği), { bh } (Wikidata'da aranacak ad).
 * label: görünen ad. Dönüş: choose() seçimi { label, mainId, otype } ya da null.
 */
export async function resolveRef(ref, label, lang, signal) {
  if (ref.id) return { label, mainId: ref.id, otype: ref.otype ?? null };
  if (ref.simbad) {
    const [hit] = await lookupIds([ref.simbad], signal);
    return hit ? { label, mainId: hit.mainId, otype: hit.otype } : null;
  }
  if (ref.bh) {
    const hit = (await searchWikidata(ref.bh, lang, signal)).find((w) => w.bh);
    return hit ? { label, mainId: 'bh:' + hit.qid, otype: 'BH' } : null;
  }
  return null;
}
