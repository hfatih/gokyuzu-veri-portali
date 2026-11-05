import { isGalaxy, deriveGalaxy } from '../galaxy/derive.js';
import { galaxyVisualParams } from '../galaxy/visual.js';
import { renderGalaxyCard } from '../ui/galaxy-card.js';
import { buildLinks } from '../star/links.js';
import { wikipediaFor } from '../search/wikidata.js';
import { galaxyScene } from '../render/galaxy.js';
import { simbadForms } from './star.js';

export const galaxyKind = {
  id: 'galaxy',
  byObj: (obj) => isGalaxy(obj.basic.otype),
  load(ctx) {
    const { obj } = ctx, b = obj.basic;
    const gd = deriveGalaxy({ morph: b.morph, majArcmin: b.dimMaj, minArcmin: b.dimMin, cz: b.rv, z: b.z, mags: obj.mags, distances: obj.distances });
    ctx.kind('galaxy');
    renderGalaxyCard(ctx.card, ctx.sel, obj, gd, buildLinks(obj));
    const vp = galaxyVisualParams(gd, obj);
    // Bakış yüksekliği = 90° − eğiklik: kenardan görünen gökada arka planda da kenardan görünür
    const pitch = Math.min(1.45, Math.max(0.05, (90 - vp.inclination) * Math.PI / 180));
    const css = `rgb(${vp.old.map((c) => Math.round(255 * c ** (1 / 2.2))).join(',')})`;
    ctx.show(galaxyScene, vp, 1.1, css, pitch);
    ctx.corner(true);
    ctx.wiki(wikipediaFor(simbadForms(obj.mainId), ctx.signal), (wiki) => buildLinks(obj, wiki));
    ctx.describe({ derived: gd, color: css });
  },
};
