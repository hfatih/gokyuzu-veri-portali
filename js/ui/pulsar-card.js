// Pulsar kartı: sınıf, gözlem, atım profili (W50), zamanlama ve ondan türeyen fizik (yaş, alan,
// Ė, ışık silindiri, kutup başlığı, ölüm çizgisi), dağılma ölçüsü, uzaklık, çift sistem, glitch.

import { t, num, otypeName } from './i18n.js';
import { linkItems } from './card.js';
import { observationFigure } from './observation.js';
import { prettyId } from '../search/variants.js';
import { buildLinks } from '../star/links.js';
import { ASSUME } from '../pulsar/derive.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const badge = (o, tip = '') => `<span class="badge badge--${o}"${tip ? ` title="${esc(tip)}"` : ''}>${t('origin.' + o)}</span>`;
const sci = (x) => { const e = Math.floor(Math.log10(Math.abs(x))); return Math.abs(e) < 4 ? num(x) : `${num(x / 10 ** e)} × 10${String(e).replace(/-/, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; };
const ms = (s) => (s < 1 ? `${num(s * 1e3, 4)} ms` : `${num(s, 4)} ${t('bh.sec')}`);
const years = (y) => (y >= 1e9 ? `${num(y / 1e9)} ${t('c.gyr')}` : y >= 1e6 ? `${num(y / 1e6)} ${t('n.myr')}` : `${num(y, 3)} ${t('unit.yr')}`);

// Atım profili: W50 yarı yükseklik genişliğinde tek Gauss, üç dönem
function pulseSvg(pd) {
  if (!pd.w50Ms) return '';
  const W = 400, H = 110, P = pd.periodS.value, sig = pd.w50Ms.value / 1e3 / 2.355;
  const pts = [];
  for (let i = 0; i <= 600; i++) {
    const x = i / 600 * 3 * P, ph = ((x % P) + P) % P - P / 2;
    pts.push(`${(6 + i / 600 * (W - 12)).toFixed(1)},${(H - 22 - Math.exp(-0.5 * (ph / sig) ** 2) * (H - 34)).toFixed(1)}`);
  }
  const ticks = [0, 1, 2, 3].map((k) => `<text x="${6 + k / 3 * (W - 12)}" y="${H - 6}" class="cmd__tick" text-anchor="middle">${k ? ms(k * P) : '0'}</text>`).join('');
  return `<figure class="cmd"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('ps.profileAria'))}">
    <rect x="6" y="6" width="${W - 12}" height="${H - 28}" class="cmd__frame"/>
    <polyline points="${pts.join(' ')}" class="pulse__line"/>${ticks}
  </svg><figcaption>${t('ps.profileCaption', { w: num(pd.w50Ms.value), d: num(pd.dutyCycle.value * 100) })}</figcaption>
  <button type="button" class="listen" data-listen aria-pressed="false">${t('ps.listen')}</button></figure>`;
}

const COMPANION = { He: 'he', CO: 'co', ONe: 'co', NS: 'ns', MS: 'ms', UL: 'ul' };

function rows(row, pd) {
  const atnf = t('ps.atnfTip'), out = [];
  out.push(['period', `${ms(pd.periodS.value)} · ${num(pd.freqHz.value, 4)} Hz`, 'measured', atnf]);
  if (pd.pdot) out.push(['pdot', sci(pd.pdot.value), 'measured', t('ps.pdotTip')]);
  out.push(['age', pd.ageYr && years(pd.ageYr.value), 'derived', t('ps.ageTip')]);
  out.push(['b', pd.bGauss && `${sci(pd.bGauss.value)} G${pd.bQuantum.value > 0.1 ? ` · ${num(pd.bQuantum.value)} B_Q` : ''}`, 'derived', t('ps.bTip', { r: ASSUME.radiusKm })]);
  out.push(['edot', pd.edotW && `${sci(pd.edotW.value)} W · ${sci(pd.edotLsun.value)} L☉`, 'derived', t('ps.edotTip')]);
  out.push(['rlc', `${sci(pd.rlcKm.value)} km · ${sci(pd.rlcOverR.value)} R`, 'derived', t('ps.rlcTip')]);
  out.push(['cap', `${num(pd.capDeg.value)}°`, 'derived', t('ps.capTip')]);
  out.push(['veq', `${num(pd.vEqC.value)} c · ${t('ps.spinRatio', { r: num(pd.spinGravity.value) })}`, 'derived', t('ps.veqTip')]);
  if (pd.deathRatio) out.push(['death', t(pd.deathRatio.value >= 1 ? 'ps.alive' : 'ps.dead', { r: num(pd.deathRatio.value) }), 'estimated', t('ps.deathTip')]);
  out.push(['beam', `${num(pd.beamDeg.value)}°`, 'estimated', t('ps.beamTip')]);
  out.push(['dist', pd.distKpc && `${num(pd.distKpc.value)} kpc · ${num(pd.distKpc.value * 3261.56)} ${t('unit.ly')}`,
    pd.distKpc?.origin ?? 'measured', t(pd.distFromPlx ? 'ps.distPlxTip' : 'ps.distDmTip')]);
  if (pd.dm) out.push(['dm', `${num(pd.dm.value)} pc cm⁻³ · ${ms(pd.dmDelayS.value)}`, 'measured', t('ps.dmTip', { ne: pd.neCm3 ? num(pd.neCm3.value) : '?' })]);
  if (pd.vTransKms) out.push(['vt', `${num(pd.vTransKms.value)} km/s`, 'derived', t('ps.vtTip')]);
  if (pd.binary) {
    const comp = COMPANION[(row.BINCOMP ?? '').trim().replace(/\[.*$/, '').replace(/T$/, '')];
    out.push(['orbit', `${num(pd.pbDays.value, 4)} ${t('unit.d')}${pd.ecc ? ` · e ${num(pd.ecc.value)}` : ''}${pd.minCompanion ? ` · ≥ ${num(pd.minCompanion.value)} M☉` : ''}${comp ? ` · ${t('ps.comp.' + comp)}` : ''}`, 'measured', t('ps.orbitTip')]);
  }
  if (pd.glitches) out.push(['glitch', num(pd.glitches.value, 3), 'measured', t('ps.glitchTip')]);
  const snr = /SNR:(?:PWN:)?([^,[]+)/.exec(row.Assoc ?? '')?.[1];
  if (snr) out.push(['snr', snr.replace(/_/g, ' '), 'measured', atnf]);
  return out;
}

/** sel: { label }, obj: fetchObject(), row: ATNF satırı ya da null, pd: derivePulsar() ya da null, links. */
export function renderPulsarCard(container, sel, obj, row, pd, links) {
  const alt = prettyId(obj.mainId);
  const sub = pd ? `${t('ps.cls.' + pd.cls)}${pd.binary ? ` · ${t('ps.binary')}` : ''}` : esc(otypeName(obj.basic.otype));
  container.innerHTML = `
    <header class="card__head">
      <span class="swatch swatch--pulsar"></span>
      <div>
        <h2 class="card__title">${esc(sel.label)}</h2>
        <p class="card__sub">${sub}${alt !== sel.label ? ` · ${esc(alt)}` : ''}${row && !`${sel.label} ${alt}`.includes(row.PSRJ) ? ` · PSR ${esc(row.PSRJ)}` : ''}</p>
      </div>
    </header>
    ${observationFigure(obj.basic)}
    ${pd ? pulseSvg(pd) : ''}
    <h3 class="card__h">${t('card.physical')}</h3>
    ${pd ? `<dl class="props">${rows(row, pd).map(([k, v, o, tip]) => `
      <div class="props__row"><dt>${t('ps.row.' + k)}</dt>
      <dd>${v == null ? `<span class="muted">${t('card.unknown')}</span>` : `${esc(v)} ${badge(o, tip)}`}</dd></div>`).join('')}
    </dl>
    <p class="note">${t('ps.note', { a: ASSUME.alphaDeg })}</p>` : `<p class="note">${t('ps.notInCatalogue')}</p>`}
    <h3 class="card__h">${t('card.links')}</h3>
    <ul class="links" data-links>${linkItems(links)}</ul>`;
}

/** Genel bağlantılar + ATNF kataloğundaki kayıt (zamanlama çözümü). */
export function buildPulsarLinks(obj, row, wiki) {
  const links = buildLinks(obj, wiki);
  if (row) links.splice(1, 0, { key: 'atnf', name: 'ATNF Pulsar Catalogue', desc: 'link.atnf',
    url: `https://www.atnf.csiro.au/research/pulsar/psrcat/proc_form.php?pulsar_names=${encodeURIComponent(row.PSRJ)}&ephemeris=long&submit_ephemeris=Get+Ephemeris&style=Long+with+last+digit+error&no_value=*&state=query` });
  return links;
}
