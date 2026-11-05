import { nebulaKind, deriveNebula } from '../nebula/derive.js';
import { nebulaVisualParams } from '../nebula/visual.js';
import { renderNebulaCard } from '../ui/nebula-card.js';
import { buildLinks } from '../star/links.js';
import { wikipediaFor } from '../search/wikidata.js';
import { nebulaScene } from '../render/nebula.js';
import { simbadForms } from './star.js';

export const nebulaKindDef = {
  id: 'nebula',
  byObj: (obj) => !!nebulaKind(obj.basic.otype),
  load(ctx) {
    const { obj } = ctx, b = obj.basic;
    const nd = deriveNebula({ kind: nebulaKind(b.otype), majArcmin: b.dimMaj, minArcmin: b.dimMin, distances: obj.distances });
    ctx.kind('nebula');
    renderNebulaCard(ctx.card, ctx.sel, obj, nd, buildLinks(obj));
    const vp = nebulaVisualParams(nd, obj);
    const css = `rgb(${vp.ha.map((c) => Math.round(255 * c)).join(',')})`;
    ctx.show(nebulaScene, vp, 1, css);
    ctx.corner(true);
    ctx.wiki(wikipediaFor(simbadForms(obj.mainId), ctx.signal), (wiki) => buildLinks(obj, wiki));
    ctx.describe({ derived: nd, color: css });
  },
};
