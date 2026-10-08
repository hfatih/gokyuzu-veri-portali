// Kara delik kartı: sınıf, kütle, uzaklık, olay ufku, gölgenin açısal boyutu (EHT ile
// karşılaştırılabilir), ISCO, Eddington ışıması, disk sıcaklığı, Hawking, yoğunluk, gelgit.

import { t, num } from './i18n.js';
import { linkItems } from './card.js';
import { observationFigure } from './observation.js';
import { ASSUME } from '../bh/derive.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const badge = (o, tip = '') => `<span class="badge badge--${o}"${tip ? ` title="${esc(tip)}"` : ''}>${t('origin.' + o)}</span>`;
const sci = (x) => { const e = Math.floor(Math.log10(Math.abs(x))); return Math.abs(e) < 4 ? num(x) : `${num(x / 10 ** e)} × 10${String(e).replace(/-/, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; };

function duration(s) {
  if (s < 1) return `${num(s * 1e3)} ms`;
  if (s < 120) return `${num(s)} ${t('bh.sec')}`;
  if (s < 7200) return `${num(s / 60)} ${t('bh.min')}`;
  if (s < 2 * 86400) return `${num(s / 3600)} ${t('unit.h')}`;
  return `${num(s / 86400)} ${t('unit.d')}`;
}

function rows(bd) {
  const out = [];
  out.push(['mass', bd.massSun ? `${sci(bd.massSun.value)} M☉` : null, 'measured', t('bh.wikidataTip')]);
  out.push(['dist', bd.distLy ? `${sci(bd.distLy.value)} ${t('unit.ly')}` : null, 'measured', t('bh.wikidataTip')]);
  if (!bd.rsKm) return out;
  out.push(['rs', `${sci(bd.rsKm.value)} km${bd.rsAU.value > 0.01 ? ` · ${num(bd.rsAU.value)} AU` : ''}`, 'derived', t('bh.rsTip')]);
  if (bd.shadowUas) out.push(['shadow', `${num(bd.shadowUas.value)} µas`, 'derived', t('bh.shadowTip')]);
  out.push(['isco', `${sci(bd.iscoKm.value)} km · ${duration(bd.iscoPeriodS.value)}`, 'derived', t('bh.iscoTip')]);
  out.push(['ledd', `${sci(bd.lEddW.value)} W`, 'derived', t('bh.leddTip')]);
  out.push(['tdisk', `${sci(bd.diskTmax.value)} K`, 'estimated', t('bh.tdiskTip', { r: ASSUME.eddRatio * 100 })]);
  out.push(['hawking', `${sci(bd.hawkingK.value)} K · ${sci(bd.evapYr.value)} ${t('unit.yr')}`, 'derived', t('bh.hawkingTip')]);
  out.push(['density', `${sci(bd.density.value)} kg/m³`, 'derived', t(bd.density.value < 1.2 ? 'bh.densityAir' : 'bh.densityTip')]);
  out.push(['tidal', `${sci(bd.tidalG.value)} g`, 'derived', t('bh.tidalTip', { l: ASSUME.bodyM })]);
  return out;
}

/** sel: { label }, bh: fetchBlackHole(), bd: deriveBlackHole(), links. */
export function renderBlackHoleCard(container, sel, bh, bd, links) {
  container.innerHTML = `
    <header class="card__head">
      <span class="swatch swatch--bh"></span>
      <div>
        <h2 class="card__title">${esc(sel.label)}</h2>
        <p class="card__sub">${t('bh.cls.' + bd.cls)}</p>
      </div>
    </header>
    ${observationFigure({ ra: bh.ra, dec: bh.dec, dimMaj: 6 })}
    <h3 class="card__h">${t('card.physical')}</h3>
    <dl class="props">${rows(bd).map(([k, v, o, tip]) => `
      <div class="props__row"><dt>${t('bh.row.' + k)}</dt>
      <dd>${v == null ? `<span class="muted">${t('card.unknown')}</span>` : `${esc(v)} ${badge(o, tip)}`}</dd></div>`).join('')}
    </dl>
    <p class="note">${t('bh.note')}</p>
    <h3 class="card__h">${t('card.links')}</h3>
    <ul class="links" data-links>${linkItems(links)}</ul>`;
}

/** Kara delik bağlantıları; Wikipedia adresleri sonradan wiki ile eklenir. */
export function buildBlackHoleLinks(bh, wiki = {}) {
  const enc = encodeURIComponent, links = [];
  const add = (key, name, url) => links.push({ key, name, desc: `link.${key}`, url });
  if (bh.simbadId) add('simbad', 'SIMBAD', `https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${enc(bh.simbadId)}`);
  add('ads', 'NASA ADS', `https://ui.adsabs.harvard.edu/search/q=${enc(`abs:"${bh.label}"`)}&sort=citation_count%20desc`);
  if (bh.ra != null) add('aladin', 'Aladin Lite', `https://aladin.cds.unistra.fr/AladinLite/?target=${enc(`${bh.ra} ${bh.dec}`)}&fov=0.5`);
  add('wikidata', 'Wikidata', `https://www.wikidata.org/wiki/${bh.qid}`);
  if (wiki.tr) add('wikitr', 'Wikipedia (TR)', wiki.tr);
  if (wiki.en) add('wikien', 'Wikipedia (EN)', wiki.en);
  return links;
}
