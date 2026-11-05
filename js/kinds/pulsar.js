import { isPulsar, derivePulsar } from '../pulsar/derive.js';
import { fetchPulsar } from '../pulsar/fetch.js';
import { pulsarVisualParams } from '../pulsar/visual.js';
import { playPulses, stopPulses } from '../pulsar/sound.js';
import { renderPulsarCard, buildPulsarLinks } from '../ui/pulsar-card.js';
import { wikipediaFor } from '../search/wikidata.js';
import { pulsarScene } from '../render/pulsar.js';
import { simbadForms } from './star.js';

export const pulsarKind = {
  id: 'pulsar',
  byObj: (obj) => isPulsar(obj.basic.otype),
  async load(ctx) {
    const { obj, signal } = ctx;
    let failed = false;
    const row = await fetchPulsar(obj, signal).catch((e) => { if (signal.aborted) throw e; failed = true; return null; });
    const pd = row?.P0 > 0 ? derivePulsar(row) : null;
    // Veri yoksa sahne çizilmez; önceki cismin sahnesi 'other' gibi soluk kalır
    ctx.kind(pd ? 'pulsar' : 'other');
    renderPulsarCard(ctx.card, ctx.sel, obj, row, pd, buildPulsarLinks(obj, row));
    if (failed) ctx.partial();
    if (pd) {
      const vp = pulsarVisualParams(pd);
      // Bakış yüksekliği 90° − α: üst ışın her dönüşte kameranın üzerinden geçer (deniz feneri çakması)
      ctx.show(pulsarScene, vp, 1.25, '#cfe0ff', Math.PI / 2 - vp.alpha);
      const btn = ctx.card.querySelector('[data-listen]');
      btn?.addEventListener('click', () => {
        const on = btn.getAttribute('aria-pressed') !== 'true';
        if (on) playPulses(pd.periodS.value, pd.w50Ms?.value); else stopPulses();
        btn.setAttribute('aria-pressed', String(on));
      });
    }
    ctx.corner(!!pd);
    ctx.wiki(wikipediaFor(simbadForms(obj.mainId), signal), (wiki) => buildPulsarLinks(obj, row, wiki));
    ctx.describe({ derived: pd });
  },
};
