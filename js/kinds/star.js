// Yıldız (ve modeli olmayan diğer SIMBAD cisimleri için yedek tür).

import { isStar } from '../star/fetch.js';
import { deriveStar, starVisualParams } from '../star/derive.js';
import { buildLinks } from '../star/links.js';
import { renderCard } from '../ui/card.js';
import { wikipediaFor } from '../search/wikidata.js';
import { starScene } from '../render/star.js';
import { blackbodyCss } from '../render/color.js';
import { isBinaryCandidate, fetchOrbit } from '../binary/fetch.js';
import { deriveBinary, apparentOrbit, yearFromJd } from '../binary/derive.js';
import { binaryHtml } from '../ui/binary-card.js';
import { binaryScene, binaryVisualParams } from '../render/binary.js';
import { t } from '../ui/i18n.js';

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
    if (star && isBinaryCandidate(obj)) addBinary(ctx, d);
  },
};

// Görsel çift yıldızsa (ORB6) yörünge bölümü kart çizildikten sonra eklenir; gelmezse kart yine tamdır
function addBinary(ctx, d) {
  const { obj, signal } = ctx;
  fetchOrbit(obj, signal).then((orb) => {
    if (!orb || signal.aborted) return;
    const year = yearFromJd(Date.now() / 86400000 + 2440587.5);
    const bd = deriveBinary(orb.el, obj.basic.plx, obj.raw.plxErr, orb.dmag, year);
    ctx.insert(binaryHtml(orb, bd, apparentOrbit(orb.el)));
    const btn = ctx.card.querySelector('[data-binary-scene]');
    const teff = d.teff?.value ?? 5772, css = blackbodyCss(teff);
    btn?.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = t(on ? 'b.showStar' : 'b.show3d');
      ctx.kind(on ? 'binary' : 'star');
      if (on) ctx.show(binaryScene, binaryVisualParams(orb.el, bd, teff, year), 1.15, css, 0.12);
      else ctx.show(starScene, starVisualParams(d), 1, css);
    });
  }).catch(() => {});
}

/** SIMBAD kimliğinin Wikidata'daki olası yazımları (çoklu boşluklar teke indirilmiş). */
export const simbadForms = (id) => [...new Set([id, id.replace(/\s+/g, ' ')])];
