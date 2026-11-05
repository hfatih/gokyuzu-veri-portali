// Asteroit, kuyruklu yıldız, cüce gezegen (IMCCE); bugünkü konum ve evre açısı açılış anından.

import { fetchSso, isSsoId } from '../sso/fetch.js';
import { deriveSso } from '../sso/derive.js';
import { jdNow } from '../sso/orbit.js';
import { ssoVisualParams } from '../sso/visual.js';
import { renderSsoCard, buildSsoLinks } from '../ui/sso-card.js';
import { ssoScene } from '../render/sso.js';

export const ssoKind = {
  id: 'sso',
  byId: isSsoId,
  async load(ctx) {
    const { sel, signal } = ctx;
    const b = await fetchSso(sel.mainId, signal);
    if (sel.fromUrl) ctx.setLabel(b.title);
    const sd = deriveSso(b, jdNow());
    ctx.kind('sso');
    renderSsoCard(ctx.card, sel, b, sd, buildSsoLinks(b));
    ctx.show(ssoScene, ssoVisualParams(b, sd), 1, '#9a948c', 0.2);
    ctx.corner(true);
    ctx.describe({ sso: b, derived: sd });
  },
};
