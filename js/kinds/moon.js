// Güneş Sistemi uyduları (moon:Q…, Wikidata). Gezegen fiziği ve sahnesi kullanılır; denge sıcaklığı
// ana gezegenin Güneş'e uzaklığından, yörünge değerleri gezegen çevresinden.

import { lang } from '../ui/i18n.js';
import { fetchMoon } from '../planet/fetch.js';
import { deriveMoon } from '../planet/moon.js';
import { planetVisualParams } from '../planet/visual.js';
import { isMoonId } from '../planet/solar.js';
import { renderMoonCard, buildMoonLinks } from '../ui/planet-card.js';
import { wikipediaForQid } from '../search/wikidata.js';
import { planetScene } from '../render/planet.js';

const lin2css = (c) => `rgb(${c.map((x) => Math.round(255 * x ** (1 / 2.2))).join(',')})`;

export const moonKind = {
  id: 'moon',
  byId: isMoonId,
  async load(ctx) {
    const { sel, signal } = ctx;
    const m = await fetchMoon(sel.mainId, signal);
    if (sel.fromUrl) ctx.setLabel(m.moon[lang]);
    const md = deriveMoon(m.props, m.parent.key, { teff: m.host.teff, R: m.host.R, L: m.host.L });
    ctx.kind('moon');
    renderMoonCard(ctx.card, sel, m, md, buildMoonLinks(m));
    const vp = planetVisualParams(md, m.moon, 5772);
    const css = lin2css(vp.zone);
    ctx.show(planetScene, vp, 1, css);
    ctx.card.querySelector('.swatch--planet')?.style.setProperty('--planet', css);
    ctx.corner(true);
    ctx.wiki(wikipediaForQid(m.qid, signal), (wiki) => buildMoonLinks(m, wiki));
    const sky = m.moon.key === 'moon'
      ? { src: { type: 'moon' }, opts: { moon: true, instrument: 'eye' } }
      : { src: { type: 'planet', key: m.parent.key }, opts: { instrument: m.moon.inst } };
    ctx.describe({ derived: md, color: css, sky });
  },
};
