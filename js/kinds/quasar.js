// Kuasar: kırmızıya kaymadan kozmoloji; sahne merkezdeki kara delik (Eddington kütlesiyle).

import { isQuasar, deriveQuasar, hasJet, isBlazar } from '../quasar/derive.js';
import { observedRgb } from '../quasar/spectrum.js';
import { renderQuasarCard, buildQuasarLinks, rgbCss } from '../ui/quasar-card.js';
import { deriveBlackHole } from '../bh/derive.js';
import { wikipediaFor } from '../search/wikidata.js';
import { blackHoleScene } from '../render/blackhole.js';
import { bhParams } from './blackhole.js';
import { simbadForms } from './star.js';

export const quasarKind = {
  id: 'quasar',
  byObj: (obj) => isQuasar(obj.basic.otype),
  load(ctx) {
    const { obj } = ctx;
    const qd = deriveQuasar({ z: obj.basic.z, mags: obj.mags });
    const rgb = qd ? observedRgb(qd.z.value) : null;
    ctx.kind('quasar');
    renderQuasarCard(ctx.card, ctx.sel, obj, qd, rgb, buildQuasarLinks(obj));
    const bd = qd?.massEdd ? deriveBlackHole({ massSun: qd.massEdd.value, distLy: qd.distLy }) : null;
    const jet = hasJet(obj.basic.otype, obj.ids);
    // Blazarda jet bakış doğrultusuna yakındır: kamera eksene ~20° açıyla başlar
    ctx.show(blackHoleScene, { ...bhParams(bd, { rsM: 1.2e12, tmax: 6e4, iscoPeriodS: 2e5 }), jet }, 1.1, rgb ? rgbCss(rgb) : '#cfe0ff',
      isBlazar(obj.basic.otype) ? 1.22 : 0.12);
    ctx.corner(true);
    ctx.wiki(wikipediaFor(simbadForms(obj.mainId), ctx.signal), (wiki) => buildQuasarLinks(obj, wiki));
    ctx.describe({ derived: qd, bhDerived: bd });
  },
};
