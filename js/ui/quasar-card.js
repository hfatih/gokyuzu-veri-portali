// Kuasar kartı: gözlem, kırmızıya kaymış tayf (görünür bant işaretli), kozmolojik uzaklıklar,
// geriye bakış, ışıma ve Eddington kütlesi, Lyα'nın gözlenen dalga boyu.

import { t, num, otypeName } from './i18n.js';
import { linkItems } from './card.js';
import { observationFigure } from './observation.js';
import { prettyId } from '../search/variants.js';
import { buildLinks } from '../star/links.js';
import { observedFlux, LINES } from '../quasar/spectrum.js';
import { ASSUME } from '../quasar/derive.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const badge = (o, tip = '') => `<span class="badge badge--${o}"${tip ? ` title="${esc(tip)}"` : ''}>${t('origin.' + o)}</span>`;
const sci = (x) => { const e = Math.floor(Math.log10(Math.abs(x))); return Math.abs(e) < 4 ? num(x) : `${num(x / 10 ** e)} × 10${String(e).replace(/-/, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; };
const enc = (v) => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));
export const rgbCss = (rgb) => `rgb(${rgb.map(enc).join(', ')})`;

// Gözlenen tayf 300–1100 nm; altta görünür bant (380–750 nm) gökkuşağı şeridi
function spectrumSvg(z) {
  const W = 400, H = 170, L = 6, R = W - 6, T = 8, B = H - 34, l0 = 300, l1 = 1100;
  const X = (l) => L + (l - l0) / (l1 - l0) * (R - L);
  const f = observedFlux(z), ys = [];
  for (let l = l0; l <= l1; l += 2) ys.push([l, f(l)]);
  const max = Math.max(...ys.map(([, y]) => y)) || 1;
  const pts = ys.map(([l, y]) => `${X(l).toFixed(1)},${(B - y / max * (B - T)).toFixed(1)}`).join(' ');
  const labels = LINES.filter(([n]) => ['Lyα', 'C IV', 'Mg II', 'Hβ', 'Hα'].includes(n)).map(([n, l]) => [n, l * (1 + z) / 10])
    .filter(([, l]) => l > l0 + 15 && l < l1 - 15)
    .map(([n, l]) => `<text x="${X(l).toFixed(1)}" y="${T + 8}" class="cmd__tick" text-anchor="middle">${n}</text>`).join('');
  const ticks = [400, 600, 800, 1000].map((l) => `<text x="${X(l)}" y="${H - 4}" class="cmd__tick" text-anchor="middle">${l} nm</text>`).join('');
  return `<figure class="cmd"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('q.specAria', { z: num(z) }))}">
    <defs><linearGradient id="vis" x1="0" x2="1"><stop offset="0" stop-color="#6a00ff"/><stop offset=".2" stop-color="#0050ff"/><stop offset=".4" stop-color="#00c060"/><stop offset=".6" stop-color="#e0e000"/><stop offset=".8" stop-color="#ff6000"/><stop offset="1" stop-color="#b00000"/></linearGradient></defs>
    <rect x="${L}" y="${T}" width="${R - L}" height="${B - T}" class="cmd__frame"/>
    <rect x="${X(380)}" y="${B + 3}" width="${X(750) - X(380)}" height="6" fill="url(#vis)"/>
    <polyline points="${pts}" class="pulse__line"/>${labels}${ticks}
  </svg><figcaption>${t('q.specCaption')}</figcaption></figure>`;
}

function rows(qd) {
  const out = [];
  out.push(['z', num(qd.z.value, 4), 'measured', t('q.zTip')]);
  out.push(['lookback', `${num(qd.lookbackGyr.value)} ${t('c.gyr')} · ${t('q.ageThen', { a: num(qd.ageThenGyr.value) })}`, 'derived', t('q.lookbackTip')]);
  out.push(['dist', `${num(qd.comovingGly.value)} · ${num(qd.lumDistGly.value)} ${t('q.gly')}`, 'derived', t('q.distTip')]);
  out.push(['scale', `${num(qd.kpcPerArcsec.value)} kpc/″`, 'derived', t('q.scaleTip')]);
  out.push(['absmag', qd.absMag && `${num(qd.absMag.value)} (${qd.band})`, 'estimated', t('q.absTip', { a: ASSUME.alphaNu })]);
  out.push(['lbol', qd.lbolW && `${sci(qd.lbolW.value)} W · ${sci(qd.lbolLsun.value)} L☉`, 'estimated', t('q.lbolTip', { bc: num(ASSUME.bc5100) })]);
  out.push(['medd', qd.massEdd && `${sci(qd.massEdd.value)} M☉`, 'estimated', t('q.meddTip')]);
  out.push(['lya', `${num(qd.lyaNm.value)} nm · ${t(qd.lyaNm.value < 380 ? 'q.uv' : qd.lyaNm.value <= 750 ? 'q.visible' : 'q.ir')}`, 'derived', t('q.lyaTip')]);
  if (qd.visAbsorbed.value > 0.01) out.push(['absorbed', t('q.pct', { v: num(qd.visAbsorbed.value * 100) }), 'derived', t('q.absorbedTip')]);
  return out;
}

/** sel: { label }, obj: fetchObject(), qd: deriveQuasar() ya da null, rgb: gözlenen renk, links. */
export function renderQuasarCard(container, sel, obj, qd, rgb, links) {
  const alt = prettyId(obj.mainId);
  container.innerHTML = `
    <header class="card__head">
      <span class="swatch swatch--quasar" style="--q: ${rgb ? rgbCss(rgb) : '#cfe0ff'}"></span>
      <div>
        <h2 class="card__title">${esc(sel.label)}</h2>
        <p class="card__sub">${esc(otypeName(obj.basic.otype))}${alt !== sel.label ? ` · ${esc(alt)}` : ''}${obj.basic.nbref ? ` · ${t('search.refs', { n: num(obj.basic.nbref, 3) })}` : ''}</p>
      </div>
    </header>
    ${observationFigure(obj.basic)}
    ${qd ? spectrumSvg(qd.z.value) : ''}
    <h3 class="card__h">${t('card.physical')}</h3>
    ${qd ? `<dl class="props">${rows(qd).map(([k, v, o, tip]) => `
      <div class="props__row"><dt>${t('q.row.' + k)}</dt>
      <dd>${v == null ? `<span class="muted">${t('card.unknown')}</span>` : `${esc(v)} ${badge(o, tip)}`}</dd></div>`).join('')}
    </dl>
    <p class="note">${t('q.note')}</p>` : `<p class="note">${t('q.noZ')}</p>`}
    <h3 class="card__h">${t('card.links')}</h3>
    <ul class="links" data-links>${linkItems(links)}</ul>`;
}

/** Genel bağlantılar + NED (gökada dışı veritabanı). */
export function buildQuasarLinks(obj, wiki) {
  const links = buildLinks(obj, wiki);
  links.splice(1, 0, { key: 'ned', name: 'NASA/IPAC NED', desc: 'link.ned', url: `https://ned.ipac.caltech.edu/byname?objname=${encodeURIComponent(obj.mainId.replace(/\s+/g, ' '))}` });
  return links;
}
