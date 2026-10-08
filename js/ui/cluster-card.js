// Küme kartı: tür, gözlem, renk–parlaklık (HR) diyagramı (gerçek üyeler, ZAMS, bükülme noktası),
// uzaklık, boyut, kızarma, bükülme kütlesi ve yaş.

import { t, num, otypeName } from './i18n.js';
import { linkItems } from './card.js';
import { observationFigure } from './observation.js';
import { prettyId } from '../search/variants.js';
import { zamsMV, bvToTeff } from '../cluster/derive.js';
import { blackbodyCss } from '../render/color.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const badge = (o, tip = '') => `<span class="badge badge--${o}"${tip ? ` title="${esc(tip)}"` : ''}>${t('origin.' + o)}</span>`;

// Renk–parlaklık diyagramı: x (B−V)₀, y M_V (parlak yukarıda)
function cmdSvg(cd) {
  const pts = cd.cmd.filter((p) => p.mv != null && p.bv > -0.5 && p.bv < 2.2);
  if (pts.length < 5) return '';
  const W = 400, H = 300, L = 34, B = 26;
  const mvs = pts.map((p) => p.mv).sort((a, b) => a - b);
  const yMin = Math.max(-9, Math.floor(mvs[0]) - 0.5), yMax = Math.min(17, Math.ceil(mvs[Math.floor(mvs.length * 0.99)]) + 0.5);
  const X = (bv) => L + (bv + 0.5) / 2.7 * (W - L - 6), Y = (mv) => 6 + (mv - yMin) / (yMax - yMin) * (H - B - 6);
  const color = new Map();
  const css = (bv) => { const k = Math.round(bv * 20) / 20; if (!color.has(k)) color.set(k, blackbodyCss(bvToTeff(k))); return color.get(k); };
  const dots = pts.slice(0, 6000).map((p) => `<circle cx="${X(p.bv).toFixed(1)}" cy="${Y(p.mv).toFixed(1)}" r="1.3" fill="${css(p.bv)}"/>`).join('');
  const zams = [];
  for (let bv = -0.3; bv <= 1.8; bv += 0.05) { const m = zamsMV(bv); if (m >= yMin && m <= yMax) zams.push(`${X(bv).toFixed(1)},${Y(m).toFixed(1)}`); }
  const to = cd.turnoff ? `<circle cx="${X(cd.turnoff.bv)}" cy="${Y(cd.turnoff.mv)}" r="7" class="cmd__to"/>` : '';
  const ticksY = [];
  for (let m = Math.ceil(yMin / 2) * 2; m <= yMax; m += 2) ticksY.push(`<text x="${L - 6}" y="${Y(m) + 3}" class="cmd__tick" text-anchor="end">${m}</text>`);
  const ticksX = [0, 0.5, 1, 1.5].map((bv) => `<text x="${X(bv)}" y="${H - 8}" class="cmd__tick" text-anchor="middle">${num(bv)}</text>`).join('');
  return `<figure class="cmd"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('c.cmdAria', { n: pts.length }))}">
    <rect x="${L}" y="6" width="${W - L - 6}" height="${H - B - 6}" class="cmd__frame"/>
    ${dots}
    <polyline points="${zams.join(' ')}" class="cmd__zams"/>
    ${to}
    ${ticksY.join('')}${ticksX}
    <text x="${(W + L) / 2}" y="${H}" class="cmd__axis" text-anchor="middle">(B−V)₀</text>
    <text x="10" y="${H / 2}" class="cmd__axis" text-anchor="middle" transform="rotate(-90 10 ${H / 2})">M_V</text>
  </svg><figcaption>${t('c.cmdCaption', { n: num(pts.length, 3) })}</figcaption></figure>`;
}

function years(y) { return y >= 1e9 ? `${num(y / 1e9)} ${t('c.gyr')}` : `${num(y / 1e6, 2)} ${t('n.myr')}`; }

function rows(obj, cd) {
  const out = [];
  if (obj.basic.dimMaj) out.push(['size', `${num(obj.basic.dimMaj)}′`, 'measured', '']);
  out.push(['dist', cd.distancePc ? `${num(cd.distancePc.value)} pc · ${num(cd.distancePc.value * 3.26156)} ${t('unit.ly')}` : null, 'measured', t('n.distTip', { n: cd.distancePc?.n })]);
  if (cd.radiusPc) out.push(['radius', `${num(cd.radiusPc.value)} pc`, 'derived', t('n.radiusTip')]);
  out.push(['members', num(cd.n, 3), 'measured', t('c.membersTip')]);
  if (cd.ebv) out.push(['ebv', `${num(cd.ebv.value)}${cd.ebv.applied ? '' : ` (${t('c.notApplied')})`}`, 'estimated', t('c.ebvTip')]);
  if (cd.turnoff) out.push(['turnoff', `M_V ${num(cd.turnoff.mv)} · ${num(cd.turnoff.teff, 2)} K · ${num(cd.turnoff.mass)} M☉`, 'estimated', t('c.turnoffTip')]);
  out.push(['age', cd.age ? years(cd.age.value) : null, 'estimated', t('c.ageTip')]);
  if (cd.totalLv) out.push(['lv', `${num(cd.totalLv.value)} L☉`, 'derived', t('c.lvTip')]);
  return out;
}

/** sel: { label }, obj: fetchObject(), cd: deriveCluster(), links. */
export function renderClusterCard(container, sel, obj, cd, links) {
  const alt = prettyId(obj.mainId);
  container.innerHTML = `
    <header class="card__head">
      <span class="swatch swatch--cluster swatch--${cd.kind}"></span>
      <div>
        <h2 class="card__title">${esc(sel.label)}</h2>
        <p class="card__sub">${esc(otypeName(obj.basic.otype))}${alt !== sel.label ? ` · ${esc(alt)}` : ''}${obj.basic.nbref ? ` · ${t('search.refs', { n: num(obj.basic.nbref, 3) })}` : ''}</p>
      </div>
    </header>
    ${observationFigure(obj.basic)}
    ${cmdSvg(cd)}
    <h3 class="card__h">${t('card.physical')}</h3>
    <dl class="props">${rows(obj, cd).map(([k, v, o, tip]) => `
      <div class="props__row"><dt>${t('c.row.' + k)}</dt>
      <dd>${v == null ? `<span class="muted">${t(k === 'age' && cd.kind === 'globular' ? 'c.ageGlobular' : 'card.unknown')}</span>` : `${esc(v)} ${badge(o, tip)}`}</dd></div>`).join('')}
    </dl>
    <p class="note">${t('c.note')}</p>
    <h3 class="card__h">${t('card.links')}</h3>
    <ul class="links" data-links>${linkItems(links)}</ul>`;
}
