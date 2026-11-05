// Yıldız kartının "Değişen yıldız" bölümü: tür, dönem, parlaklık aralığı, şematik ışık eğrisi,
// sonraki en parlak / en sönük an ve dönem–ışıma bağıntısından uzaklık.

import { t, num, lang } from './i18n.js';
import { lightCurve } from '../variable/derive.js';
import { dateFromJd } from '../sky/ephem.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const badge = (o, tip = '') => `<span class="badge badge--${o}"${tip ? ` title="${esc(tip)}"` : ''}>${t('origin.' + o)}</span>`;
const when = new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

function period(d) {
  if (d < 1) return `${num(d * 24)} ${t('unit.h')}`;
  if (d > 730) return `${num(d / 365.25)} ${t('unit.yr')}`;
  return `${num(d, 4)} ${t('unit.d')}`;
}

// İki dönemlik ışık eğrisi; parlak yukarıda (kadir ekseni ters)
function curveSvg(vd, v) {
  const W = 400, H = 120, top = 12, bot = 92, n = 240;
  const x = (ph) => 34 + ph / 2 * (W - 44);
  const y = (s) => top + s * (bot - top);
  const d = Array.from({ length: n + 1 }, (_, k) => {
    const ph = 2 * k / n;
    return `${k ? 'L' : 'M'}${x(ph).toFixed(1)},${y(lightCurve(vd.fam, ph)).toFixed(1)}`;
  }).join('');
  const maxTxt = v.max != null ? num(v.max) : '', minTxt = v.max != null && vd.amp ? num(v.max + vd.amp.value) : '';
  return `<figure class="lc"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('v.curveAria')}">
    <line x1="34" y1="${bot + 4}" x2="${W - 10}" y2="${bot + 4}" class="skyc__horizon"/>
    ${[0, 0.5, 1, 1.5, 2].map((ph) => `<text x="${x(ph)}" y="${bot + 18}" class="skyc__label" text-anchor="middle">${num(ph)}</text>`).join('')}
    <text x="30" y="${top + 4}" class="skyc__label" text-anchor="end">${maxTxt}</text>
    <text x="30" y="${bot + 2}" class="skyc__label" text-anchor="end">${minTxt}</text>
    <path d="${d}" class="lc__path"/>
  </svg><figcaption>${t(vd.eclipsing ? 'v.curveCaptionEcl' : 'v.curveCaption', { band: esc(v.band ?? 'V') })}</figcaption></figure>`;
}

/** v: fetchVariable(), vd: deriveVariable(), distPlx: paralaks uzaklığı (pc) ya da null. */
export function variableHtml(v, vd, distPlx) {
  const rows = [
    ['type', `${t('v.fam.' + vd.fam)} · ${esc(v.type)}`, 'measured'],
    ['P', vd.period ? period(vd.period.value) : null, 'measured'],
    ['range', v.max != null && vd.amp ? `${num(v.max)} – ${num(v.max + vd.amp.value)} (${esc(v.band ?? 'V')}) · ${t('v.ampl')} ${num(vd.amp.value)}` : null, 'measured'],
    ['next', vd.nextMax ? when.format(dateFromJd(vd.nextMax.value)) : vd.nextMin ? when.format(dateFromJd(vd.nextMin.value)) : null, 'derived', t('v.nextTip')],
    ['absMag', vd.absMag ? `${num(vd.absMag.value)} (${vd.absMag.band})` : null, 'estimated', vd.absMag ? t('v.plTip', { ref: vd.absMag.ref }) : ''],
    ['distPl', vd.distPl ? `${num(vd.distPl.value)} pc${distPlx ? ` · ${t('v.vsPlx', { d: num(distPlx) })}` : ''}` : null, 'estimated', t('v.distTip')],
  ].filter((r) => r[1] != null);
  return `<h3 class="card__h">${t('v.h')}</h3>
    <div class="variable" data-variable>
    <dl class="props">${rows.map(([k, val, o, tip]) => `<div class="props__row"><dt>${t(k === 'next' && vd.nextMin ? 'v.row.nextMin' : 'v.row.' + k)}</dt><dd>${val} ${o ? badge(o, tip) : ''}</dd></div>`).join('')}</dl>
    ${vd.curve ? curveSvg(vd, v) : ''}
    <p class="note">${t('v.note')}${vd.fam !== 'other' && ['cep', 't2cep', 'rrab', 'rrc', 'mira', 'sr', 'dsct'].includes(vd.fam) ? ` ${t('v.notePulse')}` : ''}</p></div>`;
}
