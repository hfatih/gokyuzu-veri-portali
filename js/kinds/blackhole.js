// Kara delik (bh:Q…, Wikidata). Kuasar da aynı sahneyi Eddington kütlesiyle kullanır.

import { fetchBlackHole, isBlackHoleId } from '../bh/fetch.js';
import { deriveBlackHole } from '../bh/derive.js';
import { renderBlackHoleCard, buildBlackHoleLinks } from '../ui/bh-card.js';
import { wikipediaForQid } from '../search/wikidata.js';
import { blackHoleScene } from '../render/blackhole.js';

/** Kara delik sahnesi parametreleri; kütle yoksa ölçeksiz varsayılanlar (görüntü r_s biriminde). */
export const bhParams = (bd, fallback) => (bd
  ? { rsM: bd.rsKm.value * 1e3, tmax: bd.diskTmax.value, iscoPeriodS: bd.iscoPeriodS.value }
  : fallback);

export const blackHoleKind = {
  id: 'bh',
  byId: isBlackHoleId,
  async load(ctx) {
    const { sel, signal } = ctx;
    const bh = await fetchBlackHole(sel.mainId, signal);
    if (sel.fromUrl) ctx.setLabel(bh.label);
    const bd = bh.massSun ? deriveBlackHole({ massSun: bh.massSun, distLy: bh.distLy }) : null;
    ctx.kind('bh');
    renderBlackHoleCard(ctx.card, sel, bh, bd ?? { cls: 'supermassive' }, buildBlackHoleLinks(bh));
    ctx.show(blackHoleScene, bhParams(bd, { rsM: 1.2e10, tmax: 2e5, iscoPeriodS: 1800 }), 1.1, '#000', 0.12);
    ctx.corner(true);
    ctx.wiki(wikipediaForQid(bh.qid, signal), (wiki) => buildBlackHoleLinks(bh, wiki));
    ctx.describe({ bh, derived: bd, sky: bh.ra != null ? { ra: bh.ra, dec: bh.dec } : null });
  },
};
