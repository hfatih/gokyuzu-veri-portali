// Kartın "Gökyüzünde" bölümü: şu anki yükseklik ve yön, doğuş / meridyen / batış, bu gece en iyi
// gözlem anı, gereken araç ve önümüzdeki 24 saatin yükseklik eğrisi. Hesap sky/visibility.js'te.

import { t, num, lang } from './i18n.js';
import { skyPath, compass, instrumentFor } from '../sky/visibility.js';
import { jdFromDate, dateFromJd, moonPhase } from '../sky/ephem.js';
import { getLocation, requestLocation, resetLocation } from '../sky/location.js';

const fmt = new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

function time(jd, now) {
  const d = dateFromJd(jd);
  const tomorrow = d.toDateString() !== now.toDateString();
  return `${fmt.format(d)}${tomorrow ? ` <span class="muted">(${t('sky.tomorrow')})</span>` : ''}`;
}

// 24 saatlik yükseklik eğrisi; arka planda gece (Güneş < −12°) ve alacakaranlık şeritleri
function chart(path, now) {
  const W = 400, H = 120, top = 6, bot = 100, s = path.samples, n = s.length - 1;
  const x = (k) => 8 + k / n * (W - 16);
  const y = (alt) => top + (90 - Math.max(-30, alt)) / 120 * (bot - top);
  const bands = [];
  for (let k = 0; k < n; k++) {
    const sa = (s[k].sunAlt + s[k + 1].sunAlt) / 2;
    const cls = sa < -12 ? 'night' : sa < -0.83 ? 'twilight' : null;
    if (!cls) continue;
    const last = bands[bands.length - 1];
    if (last?.cls === cls && last.k1 === k) last.k1 = k + 1; else bands.push({ cls, k0: k, k1: k + 1 });
  }
  const line = s.map((p, k) => `${k ? 'L' : 'M'}${x(k).toFixed(1)},${y(p.alt).toFixed(1)}`).join('');
  const ticks = [];
  const start = dateFromJd(s[0].jd);
  for (let h = 1; h <= 24; h++) {
    const d = new Date(start.getTime() + h * 3600000);
    if (d.getHours() % 3) continue;
    const k = (h * 60 - start.getMinutes() - start.getSeconds() / 60) / 5;
    if (k < 0 || k > n) continue;
    ticks.push(`<line x1="${x(k)}" y1="${bot}" x2="${x(k)}" y2="${bot + 4}" class="skyc__tick"/>
      <text x="${x(k)}" y="${bot + 15}" class="skyc__label" text-anchor="middle">${String(d.getHours()).padStart(2, '0')}</text>`);
  }
  return `<figure class="skyc"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('sky.chartAria')}">
    ${bands.map((b) => `<rect x="${x(b.k0)}" y="${top}" width="${x(b.k1) - x(b.k0)}" height="${bot - top}" class="skyc__${b.cls}"/>`).join('')}
    <line x1="8" y1="${y(0)}" x2="${W - 8}" y2="${y(0)}" class="skyc__horizon"/>
    <text x="${W - 10}" y="${y(0) - 3}" class="skyc__label" text-anchor="end">${t('sky.horizon')}</text>
    <text x="10" y="${y(60) + 3}" class="skyc__label">60°</text><line x1="30" y1="${y(60)}" x2="${W - 8}" y2="${y(60)}" class="skyc__grid"/>
    <text x="10" y="${y(30) + 3}" class="skyc__label">30°</text><line x1="30" y1="${y(30)}" x2="${W - 8}" y2="${y(30)}" class="skyc__grid"/>
    <path d="${line}" class="skyc__path"/>
    <circle cx="${x(0)}" cy="${y(s[0].alt)}" r="3.5" class="skyc__now"/>
    ${ticks.join('')}
  </svg><figcaption>${t('sky.chartCaption')}</figcaption></figure>`;
}

/**
 * Bölümün HTML'i. src: visibility.positionFn() kaynağı; opts: { vmag, instrument, sun, moon }.
 */
export function skyHtml(src, opts = {}, loc = getLocation(), when = new Date()) {
  const jd0 = jdFromDate(when);
  const p = skyPath(src, loc.lat, loc.lon, jd0);
  const dir = compass(p.now.az, lang);
  const lines = [];
  lines.push(p.now.alt > p.h0
    ? t('sky.nowUp', { alt: num(Math.round(p.now.alt), 2), dir, az: Math.round(p.now.az) })
    : t('sky.nowDown'));
  const rows = [];
  if (p.always === 'up') rows.push(['sky.row.always', t('sky.circumpolar')]);
  else if (p.always === 'down') rows.push(['sky.row.always', t('sky.neverRises')]);
  else {
    if (p.rise) rows.push(['sky.row.rise', time(p.rise, when)]);
    if (p.transit) rows.push(['sky.row.transit', `${time(p.transit.jd, when)} · ${num(Math.round(p.transit.alt), 2)}°`]);
    if (p.set) rows.push(['sky.row.set', time(p.set, when)]);
  }
  if (!opts.sun) {
    rows.push(['sky.row.best', p.best ? `${time(p.best.jd, when)} · ${num(Math.round(p.best.alt), 2)}°` : `<span class="muted">${t('sky.noBest')}</span>`]);
    const inst = opts.instrument ?? instrumentFor(opts.vmag);
    if (inst) rows.push(['sky.row.inst', `${t('sky.inst.' + inst)}${opts.vmag != null ? ` <span class="muted">(V ${num(opts.vmag)})</span>` : ''}`]);
  }
  if (opts.moon) {
    const ph = moonPhase(jd0);
    rows.push(['sky.row.phase', t(ph.waxing ? 'sky.waxing' : 'sky.waning', { pct: Math.round(ph.illum * 100) })]);
  }
  const place = loc.isDefault ? t('sky.locDefault', { name: loc.name })
    : t('sky.locMine', { lat: `${num(Math.abs(loc.lat), 2)}° ${loc.lat >= 0 ? t('sky.N') : t('sky.S')}`, lon: `${num(Math.abs(loc.lon), 2)}° ${loc.lon >= 0 ? t('sky.E') : t('sky.W')}` });
  return `<h3 class="card__h">${t('sky.h')}</h3>
    <div class="sky" data-sky>
      <p class="sky__now">${lines.join(' ')}</p>
      <dl class="props">${rows.map(([k, v]) => `<div class="props__row"><dt>${t(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>
      ${chart(p, when)}
      <p class="sky__loc">${place} ·
        <button type="button" class="linkbtn" data-loc="${loc.isDefault ? 'mine' : 'reset'}">${t(loc.isDefault ? 'sky.useMine' : 'sky.useDefault')}</button></p>
      <p class="note">${t('sky.note')}</p>
    </div>`;
}

/** Bölümü kart içinde bağlar: konum düğmesi bölümü yeniden çizer. */
export function bindSky(root, src, opts) {
  const el = root.querySelector('[data-sky]');
  if (!el) return;
  el.querySelector('[data-loc]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    let loc;
    if (btn.dataset.loc === 'reset') loc = resetLocation();
    else {
      btn.disabled = true; btn.textContent = t('sky.locating');
      try { loc = await requestLocation(); } catch { btn.disabled = false; btn.textContent = t('sky.locFail'); return; }
    }
    const h = el.previousElementSibling;
    const tmp = document.createElement('div');
    tmp.innerHTML = skyHtml(src, opts, loc);
    h.replaceWith(tmp.children[0]);
    el.replaceWith(tmp.children[0]);
    bindSky(root, src, opts);
  });
}
