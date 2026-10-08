// Bulutsu kartı: tür, gözlem görüntüsü, açısal ve fiziksel boyut, uzaklık ve türe özgü fizik
// (H II iyonlaştırıcı foton akısı, gezegenimsi bulutsu yaşı, süpernova kalıntısı evresi).

import { t, num, otypeName } from './i18n.js';
import { linkItems } from './card.js';
import { observationFigure } from './observation.js';
import { prettyId } from '../search/variants.js';
import { ASSUME } from '../nebula/derive.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const badge = (o, tip = '') => `<span class="badge badge--${o}"${tip ? ` title="${esc(tip)}"` : ''}>${t('origin.' + o)}</span>`;
const years = (y) => (y >= 1e6 ? `${num(y / 1e6)} ${t('n.myr')}` : `${num(y, 2)} ${t('unit.yr')}`);

function rows(obj, nd) {
  const b = obj.basic, out = [];
  if (b.dimMaj) out.push(['size', `${num(b.dimMaj)}′${b.dimMin && b.dimMin !== b.dimMaj ? ` × ${num(b.dimMin)}′` : ''}`, 'measured', '']);
  if (nd.distancePc) out.push(['dist', `${num(nd.distancePc.value)} pc · ${num(nd.distancePc.value * 3.26156)} ${t('unit.ly')}`, 'measured', t('n.distTip', { n: nd.distancePc.n })]);
  else out.push(['dist', null, null, '']);
  if (nd.radiusPc) out.push(['radius', `${num(nd.radiusPc.value)} pc · ${num(nd.radiusPc.value * 3.26156)} ${t('unit.ly')}`, 'derived', t('n.radiusTip')]);
  if (nd.qIon) out.push(['q', `${num(nd.qIon.value / 1e49)} × 10⁴⁹ s⁻¹ ≈ ${num(nd.o7Equiv.value)} × O7V`, 'estimated', t('n.qTip', { n: ASSUME.neHII })]);
  if (nd.agePN) out.push(['agePN', years(nd.agePN.value), 'estimated', t('n.agePNTip', { v: ASSUME.vExpPN })]);
  if (nd.sweptMsun) out.push(['swept', `${num(nd.sweptMsun.value)} M☉`, 'estimated', t('n.sweptTip')]);
  if (nd.phase) out.push(['phase', t('n.phase.' + nd.phase), 'estimated', t('n.phaseTip')]);
  if (nd.ageSedov) out.push(['ageSedov', years(nd.ageSedov.value), 'estimated', t('n.sedovTip')]);
  if (b.rv != null) out.push(['rv', `${num(b.rv)} km/s`, 'measured', '']);
  return out;
}

/** sel: { label }, obj: fetchObject(), nd: deriveNebula(), links: bağlantılar. */
export function renderNebulaCard(container, sel, obj, nd, links) {
  const alt = prettyId(obj.mainId);
  container.innerHTML = `
    <header class="card__head">
      <span class="swatch swatch--nebula swatch--${nd.kind}"></span>
      <div>
        <h2 class="card__title">${esc(sel.label)}</h2>
        <p class="card__sub">${esc(otypeName(obj.basic.otype))}${alt !== sel.label ? ` · ${esc(alt)}` : ''}${obj.basic.nbref ? ` · ${t('search.refs', { n: num(obj.basic.nbref, 3) })}` : ''}</p>
      </div>
    </header>
    ${observationFigure(obj.basic)}
    <h3 class="card__h">${t('card.physical')}</h3>
    <dl class="props">${rows(obj, nd).map(([k, v, o, tip]) => `
      <div class="props__row"><dt>${t('n.row.' + k)}</dt>
      <dd>${v == null ? `<span class="muted">${t('card.unknown')}</span>` : `${esc(v)} ${badge(o, tip)}`}</dd></div>`).join('')}
    </dl>
    <p class="note">${t('n.note.' + nd.kind)}</p>
    <h3 class="card__h">${t('card.links')}</h3>
    <ul class="links" data-links>${linkItems(links)}</ul>`;
}
