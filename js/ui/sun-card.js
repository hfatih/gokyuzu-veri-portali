// Güneş kartının "Güneş etkinliği" bölümü: döngü evresi, leke sayısı, görünen gruplar, leke kuşağı ve
// farklı dönme. Değerler sun/activity.js modelinden; görünen bölgeler NOAA'dan geldiyse gerçek.

import { t, num } from './i18n.js';
import { omegaDeg } from '../sun/activity.js';

const badge = (o, tip = '') => `<span class="badge badge--${o}"${tip ? ` title="${tip}"` : ''}>${t('origin.' + o)}</span>`;

/** s: model.summary(0); real: NOAA'dan gelen görünen bölge sayısı (0 ise model). */
export function sunActivityHtml(s, real) {
  const rows = [
    ['cycle', t('sun.cycleVal', { n: s.cycle, y: num(s.cycleYears), dir: t(s.rising ? 'sun.rising' : 'sun.falling') }), 'derived', t('sun.cycleTip')],
    ['ssn', num(Math.round(s.ssn), 3), 'estimated', t('sun.ssnTip')],
    ['groups', real ? t('sun.groupsReal', { n: s.visibleGroups }) : `~${s.visibleGroups}`, real ? 'measured' : 'estimated', real ? t('sun.noaaTip') : t('sun.groupsTip')],
    ['belt', s.beltLat != null ? `±${num(s.beltLat)}°` : null, 'estimated', t('sun.beltTip')],
    ['rot', t('sun.rotVal', { eq: num(360 / omegaDeg(0)), p60: num(360 / omegaDeg(60)) }), 'measured', t('sun.rotTip')],
  ].filter((r) => r[1] != null);
  return `<h3 class="card__h">${t('sun.h')}</h3>
    <dl class="props">${rows.map(([k, v, o, tip]) => `<div class="props__row"><dt>${t('sun.row.' + k)}</dt><dd>${v} ${badge(o, tip)}</dd></div>`).join('')}</dl>
    <p class="note">${t(real ? 'sun.noteReal' : 'sun.noteModel')}</p>`;
}
