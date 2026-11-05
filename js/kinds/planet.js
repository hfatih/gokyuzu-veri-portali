// Güneş Sistemi gezegeni (planet:Q…, SIMBAD kaydı yok) ya da SIMBAD'daki ötegezegen.

import { lang } from '../ui/i18n.js';
import { fetchPlanet } from '../planet/fetch.js';
import { derivePlanet } from '../planet/derive.js';
import { planetVisualParams } from '../planet/visual.js';
import { buildPlanetLinks } from '../planet/links.js';
import { isSolarPlanetId } from '../planet/solar.js';
import { renderPlanetCard } from '../ui/planet-card.js';
import { wikipediaForQid } from '../search/wikidata.js';
import { planetScene } from '../render/planet.js';

const lin2css = (c) => `rgb(${c.map((x) => Math.round(255 * x ** (1 / 2.2))).join(',')})`;

export const planetKind = {
  id: 'planet',
  byId: isSolarPlanetId,
  byObj: (obj) => obj.basic.otype === 'Pl' || obj.basic.otype === 'Pl?',
  async load(ctx) {
    const { sel, obj, signal } = ctx;
    const planet = await fetchPlanet(sel.mainId, obj, signal);
    if (sel.fromUrl && planet.solar) ctx.setLabel(planet.solar[lang]);
    const pd = derivePlanet(planet.props, planet.host && { teff: planet.host.teff, R: planet.host.R, L: planet.host.L });
    ctx.kind('planet');
    renderPlanetCard(ctx.card, sel, planet, pd, buildPlanetLinks(planet, obj));
    const vp = planetVisualParams(pd, planet.solar, planet.host?.teff);
    const css = lin2css(vp.zone);
    ctx.show(planetScene, vp, vp.ring ? vp.ring.outer * 1.05 : 1, css);
    ctx.card.querySelector('.swatch--planet')?.style.setProperty('--planet', css);
    ctx.card.querySelector('[data-host]')?.addEventListener('click', (e) => ctx.choose({ label: e.target.textContent, mainId: e.target.dataset.host, otype: null }));
    ctx.corner(true);
    ctx.wiki(wikipediaForQid(planet.qid, signal), (wiki) => buildPlanetLinks(planet, obj, wiki));
    ctx.describe({ planet, derived: pd, color: css });
  },
};
