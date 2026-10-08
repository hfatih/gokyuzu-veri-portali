// Gezegen kartı: tür, fiziksel değerler (köken etiketiyle), ana yıldız bağlantısı, ölçekli
// yörünge şeması (yıldız, yaşanabilir bölge, yörünge) ve yönlendirme bağlantıları.

import { t, num } from './i18n.js';
import { linkItems } from './card.js';
import { prettyId } from '../search/variants.js';
import { blackbodyCss } from '../render/color.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const badge = (o) => `<span class="badge badge--${o}" title="${esc(t('how.p.' + o))}">${t('origin.' + o)}</span>`;

function rows(pd, props) {
  const f = (x, fmt) => (x ? [fmt(x.value), x.origin] : [null, null]);
  const out = [
    ['mass', ...f(pd.mass, (v) => `${num(v)} M⊕${v > 30 ? ` · ${num(v / 317.83)} M♃` : ''}`)],
    ['radius', ...f(pd.radius, (v) => `${num(v)} R⊕${v > 10 ? ` · ${num(v / 11.21)} R♃` : ''}`)],
    ['density', ...f(pd.density, (v) => `${num(v)} g/cm³`)],
    ['gravity', ...f(pd.gravity, (v) => `${num(v)} m/s²`)],
    ['period', ...f(pd.period, (v) => (v > 730 ? `${num(v / 365.25)} ${t('unit.yr')}` : `${num(v)} ${t('unit.d')}`))],
    ['sma', ...f(pd.sma, (v) => `${num(v)} AU`)],
    ['ecc', ...f(pd.ecc, (v) => num(v))],
    ['temp', ...f(pd.temp, (v) => `${num(v, 3)} K`)],
    ['teq', ...f(pd.teq, (v) => `${num(v, 3)} K${pd.albedoAssumed ? ' (A = 0,3)' : ''}`)],
    ['insol', ...f(pd.insolation, (v) => `${num(v)} S⊕`)],
    ['rot', ...f(pd.rot, (v) => (Math.abs(v) < 2 ? `${num(Math.abs(v) * 24)} ${t('unit.h')}` : `${num(Math.abs(v))} ${t('unit.d')}`) + (pd.tidallyLocked ? ` · ${t('p.locked')}` : ''))],
    ['disc', props.discovered ?? null, props.discovered ? 'measured' : null],
  ];
  return out.filter((r) => r[1] != null);
}

// Ölçekli yörünge şeması: yatay eksen yıldızdan uzaklık (AU), yeşil şerit yaşanabilir bölge
function orbitSvg(pd, hostTeff) {
  if (!pd.sma) return '';
  const a = pd.sma.value, e = pd.ecc?.value ?? 0, hz = pd.hz;
  const max = Math.max(a * (1 + e) * 1.2, hz ? hz.outer * 1.15 : 0);
  const W = 400, x = (d) => 14 + d / max * (W - 28);
  const hzRect = hz ? `<rect x="${x(hz.inner)}" y="22" width="${x(hz.outer) - x(hz.inner)}" height="36" class="orbit__hz"/>` : '';
  const tick = Math.pow(10, Math.floor(Math.log10(max / 2)));
  return `<figure class="orbit"><svg viewBox="0 0 ${W} 80" role="img" aria-label="${esc(t('p.orbitAria', { a: num(a) }))}">
    ${hzRect}
    <line x1="${x(a * (1 - e))}" y1="40" x2="${x(a * (1 + e))}" y2="40" class="orbit__path"/>
    <circle cx="14" cy="40" r="7" fill="${blackbodyCss(hostTeff ?? 5772)}"/>
    <circle cx="${x(a)}" cy="40" r="4.5" class="orbit__planet"/>
    <line x1="${x(0)}" y1="70" x2="${x(tick)}" y2="70" class="orbit__scale"/>
    <text x="${x(tick) + 6}" y="73" class="orbit__label">${num(tick)} AU</text>
  </svg><figcaption>${hz ? t('p.hzCaption', { i: num(hz.inner), o: num(hz.outer) }) : ''}</figcaption></figure>`;
}

/**
 * sel: { label }, planet: fetchPlanet(), pd: derivePlanet(), links: bağlantılar.
 */
export function renderPlanetCard(container, sel, planet, pd, links) {
  const host = planet.host;
  const hostName = planet.solar ? t('p.sun') : host ? prettyId(host.obj.mainId) : null;
  const kind = planet.solar ? t('p.solar') : t('p.exo');
  const hz = pd.inHZ == null ? '' : `<p class="hz ${pd.inHZ ? 'hz--in' : ''}">${t(pd.inHZ ? 'p.inHZ' : 'p.outHZ')}</p>`;
  container.innerHTML = `
    <header class="card__head">
      <span class="swatch swatch--planet"></span>
      <div>
        <h2 class="card__title">${esc(sel.label)}</h2>
        <p class="card__sub">${esc(kind)}${pd.cls ? ` · ${t('cls.' + pd.cls)}` : ''}</p>
      </div>
    </header>
    ${hostName ? `<p class="host">${t('p.host')}: ${planet.solar ? esc(hostName)
      : `<button type="button" class="host__btn" data-host="${esc(host.obj.mainId)}">${esc(hostName)}</button>`}
      · ${host?.teff ? `${num(host.teff, 3)} K` : ''}</p>` : ''}
    ${hz}
    ${orbitSvg(pd, host?.teff)}
    <h3 class="card__h">${t('card.physical')}</h3>
    <dl class="props">${rows(pd, planet.props).map(([k, v, o]) => `
      <div class="props__row"><dt>${t('p.row.' + k)}</dt><dd>${esc(v)} ${o ? badge(o) : ''}</dd></div>`).join('')}
    </dl>
    <p class="note">${t(planet.solar?.texture ? 'p.noteTexture' : pd.cls === 'rocky' ? 'p.noteRocky' : 'p.noteModel')}</p>
    <h3 class="card__h">${t('card.links')}</h3>
    <ul class="links" data-links>${linkItems(links)}</ul>`;
}
