// Yıldız kartının "Çift yıldız yörüngesi" bölümü: görünen yörünge (kuzey yukarı, doğu solda),
// bugünkü konum, Kepler III ile toplam kütle ve modeli 3D'de canlandırma düğmesi.

import { t, num } from './i18n.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const badge = (o, tip = '') => `<span class="badge badge--${o}"${tip ? ` title="${esc(tip)}"` : ''}>${t('origin.' + o)}</span>`;

function orbitSvg(path, now, el) {
  const W = 300, c = W / 2, ext = Math.max(...path.map((p) => Math.hypot(p.x, p.y))) * 1.15;
  const k = (c - 14) / ext;
  const X = (p) => (c - p.x * k).toFixed(1), Y = (p) => (c - p.y * k).toFixed(1);   // doğu sola, kuzey yukarı
  const d = path.map((p, i) => `${i ? 'L' : 'M'}${X(p)},${Y(p)}`).join('') + 'Z';
  // Ölçek çubuğu: alanın ~üçte biri, 1–2–5 × 10ⁿ
  const raw = ext / 3, p10 = 10 ** Math.floor(Math.log10(raw));
  const tick = [5, 2, 1].map((m) => m * p10).find((v) => v <= raw) ?? p10;
  return `<figure class="orb orb--binary"><svg viewBox="0 0 ${W} ${W}" role="img" aria-label="${t('b.orbitAria', { a: num(el.a) })}">
    <line x1="${c}" y1="8" x2="${c}" y2="${W - 8}" class="orb__planet"/><line x1="8" y1="${c}" x2="${W - 8}" y2="${c}" class="orb__planet"/>
    <text x="${c + 4}" y="16" class="orbit__label">${t('b.north')}</text><text x="10" y="${c - 4}" class="orbit__label">${t('b.east')}</text>
    <path d="${d}" class="orb__path"/>
    <line x1="${c}" y1="${c}" x2="${X(now)}" y2="${Y(now)}" class="orb__sep"/>
    <circle cx="${c}" cy="${c}" r="5" class="orb__sun"/>
    <circle cx="${X(now)}" cy="${Y(now)}" r="4" class="orb__body"/>
    <line x1="14" y1="${W - 12}" x2="${14 + tick * k}" y2="${W - 12}" class="orbit__scale"/>
    <text x="${18 + tick * k}" y="${W - 9}" class="orbit__label">${num(tick)}″</text>
  </svg><figcaption>${t('b.orbitCaption')}</figcaption></figure>`;
}

/** orb: fetchOrbit(), bd: deriveBinary(), path: apparentOrbit(). */
export function binaryHtml(orb, bd, path) {
  const f = (x, fmt) => (x ? [fmt(x.value), x.origin] : [null, null]);
  const rows = [
    ['P', ...f(bd.periodYr, (v) => (v < 2 ? `${num(v * 365.25)} ${t('unit.d')}` : `${num(v)} ${t('unit.yr')}`))],
    ['a', bd.aArcsec ? `${num(bd.aArcsec.value)}″${bd.aAu ? ` · ${num(bd.aAu.value)} AU` : ''}` : null, 'measured'],
    ['e', ...f(bd.e, (v) => num(v))],
    ['i', ...f(bd.i, (v) => `${num(v)}°`)],
    ['mass', ...f(bd.massSum, (v) => `${num(v)} M☉`), t('b.massTip')],
    ['now', `${num(bd.sepNow.value)}″ · ${t('b.pa')} ${Math.round(bd.paNow.value)}°`, 'derived', t('b.nowTip')],
    ['max', `${num(bd.sepMax.value)}″ (${Math.round(bd.sepMax.year)})`, 'derived'],
    ['min', `${num(bd.sepMin.value)}″ (${Math.round(bd.sepMin.year)})`, 'derived'],
    ['peri', String(Math.round(bd.nextPeri)), 'derived'],
    ['grade', orb.grade != null ? t('b.grade.' + Math.min(5, Math.max(1, Math.round(orb.grade)))) : null, 'measured'],
  ].filter((r) => r[1] != null);
  return `<h3 class="card__h">${t('b.h')}</h3>
    <div class="binary" data-binary>
    ${orbitSvg(path, bd.now, { a: bd.aArcsec.value })}
    <dl class="props">${rows.map(([k, v, o, tip]) => `<div class="props__row"><dt>${t('b.row.' + k)}</dt><dd>${esc(v)} ${o ? badge(o, tip) : ''}</dd></div>`).join('')}</dl>
    <p><button type="button" class="chip chip--small" data-binary-scene aria-pressed="false">${t('b.show3d')}</button></p>
    <p class="note">${t('b.note')}</p></div>`;
}
