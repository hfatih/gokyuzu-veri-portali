// Bilgi kartı: başlık, fiziksel değerler (köken etiketiyle) ve yönlendirme bağlantıları.
// Dış kaynaktan gelen her metin esc() ile kaçışlanır.

import { t, num, otypeName, lang } from './i18n.js';
import { prettyId } from '../search/variants.js';
import { blackbodyCss } from '../render/color.js';
import { observationFigure } from './observation.js';
import { SOLAR_PLANETS } from '../planet/solar.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function badge(origin, tip) {
  return `<span class="badge badge--${origin}"${tip ? ` title="${esc(tip)}"` : ''}>${t('origin.' + origin)}</span>`;
}

function period(days) {
  if (days > 730) return `${num(days / 365.25)} ${t('unit.yr')}`;
  if (days < 1) return `${num(days * 24)} ${t('unit.h')}`;
  return `${num(days)} ${t('unit.d')}`;
}

// Satırlar: [anahtar, değer metni, köken, açıklama ipucu]; değer null ise "bilinmiyor"
function rows(obj, d) {
  const m = obj.meas;
  const mt = (k) => (m[k] ? t('origin.measured.tip', { n: m[k].n, bib: m[k].bibcode }) : '');
  const f = (x, fmt) => (x ? [fmt(x.value), x.origin] : [null, null]);
  const out = [
    ['sp', obj.basic.sp, obj.basic.sp && 'measured', ''],
    ['teff', ...f(d.teff, (v) => `${num(v, 3)} K`), d.teff?.origin === 'measured' ? mt('teff') : t('how.teff')],
    ['R', ...f(d.R, (v) => `${num(v)} R☉${v > 50 ? ` ≈ ${num(v * 0.00465)} AU` : ''}`), t('how.R')],
    ['L', ...f(d.L, (v) => `${num(v)} L☉`), t('how.L')],
    ['M', ...f(d.M, (v) => `${num(v)} M☉`), t('how.M')],
    ['logg', ...f(d.logg, (v) => num(v)), d.logg?.origin === 'measured' ? mt('logg') : t('how.logg')],
    ['feh', ...f(d.feh, (v) => `${v > 0 ? '+' : ''}${num(v)} dex`), mt('feh')],
    ['dist', ...f(d.distancePc, (v) => `${num(v)} pc · ${num(v * 3.26156)} ${t('unit.ly')}`), t('how.dist')],
    ['V', obj.mags?.V != null ? num(obj.mags.V) : null, 'measured', ''],
    ['vsini', ...f(d.vEq, (v) => `${num(v)} km/s`), mt('vsini')],
    ['P', ...f(d.periodDays, period), t('how.P')],
    ['obl', d.oblateness?.value > 0.005 ? num(d.oblateness.value) : null, 'estimated', t('how.obl')],
    ['H', ...f(d.scaleHeightKm, (v) => `${num(v)} km`), t('how.H')],
    ['rv', obj.basic.rv != null ? `${num(obj.basic.rv)} km/s` : null, 'measured', ''],
    ['planets', obj.planets.length ? obj.planets.map(prettyId).join(', ') : null, 'measured', ''],
  ];
  // vsini satırı ölçülendir; türetilmiş v_eq varsayımı P satırında
  out[9][2] = d.vEq ? 'measured' : null;
  return out.filter((r) => r[1] != null || ['teff', 'R', 'L', 'dist'].includes(r[0]));
}

/**
 * Kartı container içine çizer.
 * sel: { label, mainId, otype }, obj: fetchObject(), d: deriveStar() ya da null (yıldız değilse).
 */
export function renderCard(container, sel, obj, d, links) {
  const otype = otypeName(obj.basic.otype || sel.otype);
  const alt = prettyId(obj.mainId);
  const swatch = d?.teff ? `<span class="swatch" style="background:${blackbodyCss(d.teff.value)}"></span>` : '';
  const table = d
    ? `<h3 class="card__h">${t('card.physical')}</h3><dl class="props">${rows(obj, d).map(([k, v, o, tip]) => `
        <div class="props__row"><dt>${t('row.' + k)}</dt>
        <dd>${v == null ? `<span class="muted">${t('card.unknown')}</span>` : `${k === 'planets' ? planetButtons(obj.planets) : esc(v)} ${o ? badge(o, tip) : ''}`}</dd></div>`).join('')}
      </dl>${d.L?.origin === 'derived' ? `<p class="note">${t('card.extinction')}</p>` : ''}`
    : `<p class="note">${t('card.notStar')}</p>`;

  container.innerHTML = `
    <header class="card__head">
      ${swatch}
      <div>
        <h2 class="card__title">${esc(sel.label)}</h2>
        <p class="card__sub">${esc(otype)}${alt !== sel.label ? ` · ${esc(alt)}` : ''}${obj.basic.nbref ? ` · ${t('search.refs', { n: num(obj.basic.nbref, 3) })}` : ''}</p>
      </div>
    </header>
    ${observationFigure(obj.basic, '', obj.mags?.V)}
    ${table}
    <h3 class="card__h">${t('card.links')}</h3>
    <ul class="links" data-links>${linkItems(links)}</ul>`;
}

// Gezegen adları tıklanınca o gezegenin kartı açılır (main.js data-goto düğmelerini bağlar)
// Güneş'in gezegenleri ad olarak tutulur (star/fetch.js); Wikidata kimliğine çevrilir
const planetButtons = (ids) => ids.map((id) => {
  const solar = SOLAR_PLANETS.find((p) => p.tr === id);
  return `<button type="button" class="linkbtn" data-goto="${esc(solar ? solar.id : id)}">${esc(solar ? solar[lang] : prettyId(id))}</button>`;
}).join(', ');

export function linkItems(links) {
  return links.filter((l) => l.url.startsWith('https://')).map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
    <span class="links__name">${esc(l.name)}</span><span class="links__desc">${t(l.desc)}</span></a></li>`).join('');
}
