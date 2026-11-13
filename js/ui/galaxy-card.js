// Gökada kartı: Hubble türü, gözlem görüntüsü, uzaklık (yöntemiyle), fiziksel çap, eğiklik,
// mutlak parlaklık, Tully–Fisher dönüş hızı, dinamik kütle, kırmızıya kayma ve geriye bakış süresi.

import { t, num, otypeName } from './i18n.js';
import { linkItems } from './card.js';
import { observationFigure } from './observation.js';
import { prettyId } from '../search/variants.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const badge = (o, tip = '') => `<span class="badge badge--${o}"${tip ? ` title="${esc(tip)}"` : ''}>${t('origin.' + o)}</span>`;

function distance(d) {
  if (!d) return ['dist', null, null, ''];
  const v = d.value, txt = v < 1 ? `${num(v * 1e3)} kpc` : `${num(v)} Mpc`;
  const ly = v * 3.26156;   // milyon ışık yılı
  return ['dist', `${txt} · ${num(ly)} ${t('g.mly')}`, d.origin, t('g.distTip.' + d.method, { n: d.n })];
}

function rows(obj, gd) {
  const b = obj.basic, out = [];
  if (b.morph) out.push(['morph', `${b.morph}${gd.morph ? ` (${t('g.family.' + gd.morph.family)}${gd.morph.bar ? `, ${t('g.barred')}` : ''})` : ''}`, 'measured', '']);
  if (b.dimMaj) out.push(['size', `${num(b.dimMaj)}′${b.dimMin ? ` × ${num(b.dimMin)}′` : ''}`, 'measured', '']);
  out.push(distance(gd.distanceMpc));
  if (gd.diameterKpc) out.push(['diam', `${num(gd.diameterKpc.value)} kpc · ${num(gd.diameterKpc.value * 3261.56)} ${t('unit.ly')}`, 'derived', t('g.diamTip')]);
  if (gd.inclination) out.push(['incl', `${num(gd.inclination.value, 1)}°`, gd.inclination.origin, t(gd.inclination.origin === 'estimated' ? 'g.inclTipBulge' : 'g.inclTip')]);
  if (gd.absB) out.push(['absB', num(gd.absB.value), 'derived', t('g.absBTip')]);
  if (gd.lumB) out.push(['lumB', `${num(gd.lumB.value / 1e10)} × 10¹⁰ L☉`, 'derived', t('g.absBTip')]);
  if (gd.vRot) out.push(['vrot', `${num(gd.vRot.value)} km/s`, 'estimated', t('g.vrotTip')]);
  if (gd.rotPeriodMyr) out.push(['prot', `${num(gd.rotPeriodMyr.value)} ${t('g.protUnit')}`, 'estimated', t('g.protTip')]);
  if (gd.dynMass) out.push(['mdyn', `${num(gd.dynMass.value / 1e11)} × 10¹¹ M☉`, 'estimated', t('g.mdynTip')]);
  if (gd.z != null) out.push(['z', `${num(gd.z, 3)}${b.rv != null ? ` · cz = ${num(b.rv)} km/s` : ''}`, 'measured', gd.z < 0 ? t('g.blueshift') : '']);
  if (gd.lookback) out.push(['lookback', `${num(gd.lookback.value * 1e3)} ${t('g.myrAgo')}`, 'derived', t('g.lookbackTip')]);
  return out;
}

/** sel: { label }, obj: fetchObject(), gd: deriveGalaxy(), links: bağlantılar. */
export function renderGalaxyCard(container, sel, obj, gd, links) {
  const alt = prettyId(obj.mainId);
  const fam = gd.morph?.family ?? 'S';
  container.innerHTML = `
    <header class="card__head">
      <span class="swatch swatch--galaxy swatch--g${fam}"></span>
      <div>
        <h2 class="card__title">${esc(sel.label)}</h2>
        <p class="card__sub">${esc(otypeName(obj.basic.otype))}${alt !== sel.label ? ` · ${esc(alt)}` : ''}${obj.basic.nbref ? ` · ${t('search.refs', { n: num(obj.basic.nbref, 3) })}` : ''}</p>
      </div>
    </header>
    ${observationFigure(obj.basic)}
    <h3 class="card__h">${t('card.physical')}</h3>
    <dl class="props">${rows(obj, gd).map(([k, v, o, tip]) => `
      <div class="props__row"><dt>${t('g.row.' + k)}</dt>
      <dd>${v == null ? `<span class="muted">${t('card.unknown')}</span>` : `${esc(v)} ${badge(o, tip)}`}</dd></div>`).join('')}
    </dl>
    <p class="note">${t('g.note')}</p>
    <h3 class="card__h">${t('card.links')}</h3>
    <ul class="links" data-links>${linkItems(links)}</ul>`;
}
