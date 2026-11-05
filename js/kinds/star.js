// Yıldız (ve modeli olmayan diğer SIMBAD cisimleri için yedek tür).

import { isStar } from '../star/fetch.js';
import { deriveStar, starVisualParams } from '../star/derive.js';
import { buildLinks } from '../star/links.js';
import { renderCard } from '../ui/card.js';
import { wikipediaFor } from '../search/wikidata.js';
import { starScene } from '../render/star.js';
import { blackbodyCss } from '../render/color.js';

// Güneş SIMBAD'da olmadığından Wikipedia adresi sabit
const SUN_WIKI = { tr: 'https://tr.wikipedia.org/wiki/G%C3%BCne%C5%9F', en: 'https://en.wikipedia.org/wiki/Sun' };

export const starKind = {
  id: 'star',
  byObj: () => true,
  load(ctx) {
    const { obj } = ctx;
    const star = isStar(obj.basic.otype);
    const d = star ? deriveStar(obj.raw) : null;
    ctx.kind(star ? 'star' : 'other');
    renderCard(ctx.card, ctx.sel, obj, d, buildLinks(obj));
    if (star) ctx.show(starScene, starVisualParams(d), 1, blackbodyCss(d.teff?.value ?? 5772));
    ctx.corner(star);
    const sun = obj.mainId === 'Sun';
    ctx.wiki(sun ? Promise.resolve(SUN_WIKI) : wikipediaFor(simbadForms(obj.mainId), ctx.signal), (wiki) => buildLinks(obj, wiki));
    ctx.describe({ derived: d });
  },
};

/** SIMBAD kimliğinin Wikidata'daki olası yazımları (çoklu boşluklar teke indirilmiş). */
export const simbadForms = (id) => [...new Set([id, id.replace(/\s+/g, ' ')])];
