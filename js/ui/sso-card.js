// Küçük cisim kartı: tür ve yörünge sınıfı, yukarıdan yörünge çizimi (gezegen yörüngeleri, bugünkü
// konumlar), fiziksel değerler, yörünge, sıcaklık, Dünya'ya yakınlık ve bugünkü görünürlük.

import { t, num } from './i18n.js';
import { linkItems } from './card.js';
import { positionAtNu } from '../sso/orbit.js';
import { ASSUME } from '../sso/derive.js';
import { ssoTexture } from '../sso/visual.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const badge = (o, tip = '') => `<span class="badge badge--${o}"${tip ? ` title="${esc(tip)}"` : ''}>${t('origin.' + o)}</span>`;
const sci = (x) => { const e = Math.floor(Math.log10(Math.abs(x))); return Math.abs(e) < 4 ? num(x) : `${num(x / 10 ** e)} × 10${String(e).replace(/-/, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; };

const PLANETS = [0.387, 0.723, 1, 1.524, 5.203, 9.537, 19.19, 30.07];   // gezegen yarı büyük eksenleri (AU)

// Ekliptiğe yukarıdan bakış, ölçek: cismin günöte uzaklığına (en çok 50 AU) kadar
function orbitSvg(b, sd) {
  if (!sd.elliptic || !sd.geo) return '';
  const S = 320, c = S / 2, R = Math.min(50, Math.max(1.7, b.el.Q * 1.08));
  const X = (p) => (c + p[0] / R * (c - 8)).toFixed(1), Y = (p) => (c - p[1] / R * (c - 8)).toFixed(1);
  const rings = PLANETS.filter((a) => a < R).map((a) => `<circle cx="${c}" cy="${c}" r="${(a / R * (c - 8)).toFixed(1)}" class="orb__planet"/>`).join('');
  const pts = Array.from({ length: 361 }, (_, k) => positionAtNu(b.el, k / 360 * 2 * Math.PI)).filter((p) => Math.hypot(p[0], p[1]) < R * 1.2);
  return `<figure class="cmd orb"><svg viewBox="0 0 ${S} ${S}" role="img" aria-label="${esc(t('sso.orbitAria'))}">
    <rect x="0" y="0" width="${S}" height="${S}" class="cmd__frame"/>
    ${rings}
    <polyline points="${pts.map((p) => `${X(p)},${Y(p)}`).join(' ')}" class="orb__path"/>
    <circle cx="${c}" cy="${c}" r="4" class="orb__sun"/>
    <circle cx="${X(sd.geo.earth)}" cy="${Y(sd.geo.earth)}" r="3.5" class="orb__earth"/>
    <circle cx="${X(sd.geo.pos)}" cy="${Y(sd.geo.pos)}" r="4" class="orb__body"/>
    <text x="8" y="${S - 8}" class="cmd__tick">${t('sso.orbitScale', { r: num(R) })}</text>
  </svg><figcaption>${t('sso.orbitCaption')}</figcaption></figure>`;
}

function visibility(m) {
  return t(m <= 6 ? 'sso.vis.eye' : m <= 9 ? 'sso.vis.binoc' : m <= 14 ? 'sso.vis.scope' : 'sso.vis.large');
}

function rows(b, sd) {
  const out = [], el = b.el, imcce = t('sso.imcceTip');
  const est = (o, tip) => (o === 'estimated' ? tip : imcce);
  out.push(['diameter', sd.diameterKm && `${num(sd.diameterKm.value)} km`, sd.diameterKm?.origin ?? 'measured', est(sd.diameterKm?.origin, t('sso.dFromHTip', { p: ASSUME.albedo }))]);
  out.push(['albedo', sd.albedo && num(sd.albedo.value), sd.albedo?.origin ?? 'measured', est(sd.albedo?.origin, t('sso.albedoAssumeTip'))]);
  out.push(['mass', sd.massKg && `${sci(sd.massKg.value)} kg`, sd.massKg?.origin ?? 'measured', est(sd.massKg?.origin, t('sso.massAssumeTip', { r: sd.density.value }))]);
  out.push(['density', `${num(sd.density.value)} kg/m³`, sd.density.origin, est(sd.density.origin, t('sso.densityAssumeTip'))]);
  if (sd.gSurf) out.push(['gravity', `${sci(sd.gSurf.value)} m/s² · ${t('sso.vesc', { v: num(sd.vEscMs.value) })}`, sd.gSurf.origin, t(sd.vEscMs.value < 3 ? 'sso.jumpTip' : 'sso.gravityTip')]);
  out.push(['spin', sd.spinH && `${num(sd.spinH.value)} ${t('unit.h')} · ${t('sso.spinLimit', { p: num(sd.pCritH.value), r: num(sd.spinRatio.value) })}`, 'measured', t('sso.spinTip')]);
  if (el.a != null) out.push(['orbit', `a ${num(el.a, 3)} AU · e ${num(el.e, 3)} · i ${num(el.i)}°${sd.periodYr ? ` · ${num(sd.periodYr.value)} ${t('unit.yr')}` : ''}`, 'measured', imcce]);
  if (sd.vPeri) out.push(['qQ', `${num(el.q)}${sd.vAph ? ` – ${num(el.Q)}` : ''} AU · ${num(sd.vPeri.value)}${sd.vAph ? ` – ${num(sd.vAph.value)}` : ''} km/s`, 'derived', t('sso.qQTip')]);
  if (sd.tPeri) out.push(['temp', `${num(sd.tPeri.value, 2)}${sd.tAph ? ` – ${num(sd.tAph.value, 2)}` : ''} K`, 'estimated', t('sso.tempTip', { e: ASSUME.emissivity })]);
  if (sd.tJup) out.push(['tj', num(sd.tJup.value), 'derived', t('sso.tjTip')]);
  if (sd.moidAu) out.push(['moid', `${num(sd.moidAu.value)} AU · ${num(sd.moidLd.value)} ${t('sso.ld')}${sd.pha ? ` · ${t('sso.pha')}` : ''}`, 'derived', t('sso.moidTip')]);
  if (sd.rNow) {
    out.push(['now', `r ${num(sd.rNow.value)} AU · Δ ${num(sd.deltaNow.value)} AU · ${t('sso.phase', { a: num(sd.phaseDeg.value) })}`, 'derived', t('sso.nowTip')]);
    if (sd.magNow) out.push(['mag', `${num(sd.magNow.value)} · ${visibility(sd.magNow.value)}`, 'estimated', t(sd.comet ? 'sso.magCometTip' : 'sso.magTip')]);
  }
  return out;
}

/** sel: { label }, b: fetchSso(), sd: deriveSso(), links. */
export function renderSsoCard(container, sel, b, sd, links) {
  container.innerHTML = `
    <header class="card__head">
      <span class="swatch swatch--sso${sd.comet ? ' swatch--comet' : ''}"></span>
      <div>
        <h2 class="card__title">${esc(sel.label)}</h2>
        <p class="card__sub">${esc(t('sso.type.' + (b.type ?? 'Asteroid')))} · ${t('sso.cls.' + sd.cls)}${b.taxonomy ? ` · ${t('sso.tax', { c: esc(b.taxonomy) })}` : ''}</p>
      </div>
    </header>
    ${orbitSvg(b, sd)}
    <h3 class="card__h">${t('card.physical')}</h3>
    <dl class="props">${rows(b, sd).map(([k, v, o, tip]) => `
      <div class="props__row"><dt>${t('sso.row.' + k)}</dt>
      <dd>${v == null ? `<span class="muted">${t('card.unknown')}</span>` : `${esc(v)} ${badge(o, tip)}`}</dd></div>`).join('')}
    </dl>
    <p class="note">${t(sd.comet ? 'sso.noteComet' : 'sso.note')}${ssoTexture(b.id) ? ` ${t('sso.noteTexture')}` : ''}</p>
    <h3 class="card__h">${t('card.links')}</h3>
    <ul class="links" data-links>${linkItems(links)}</ul>`;
}

export function buildSsoLinks(b) {
  const enc = encodeURIComponent, id = b.id, links = [];
  const add = (key, name, url) => links.push({ key, name, desc: `link.${key}`, url });
  add('imcce', 'IMCCE ssoCard', `https://ssp.imcce.fr/forms/ssocard/${enc(id)}`);
  add('jplsbdb', 'JPL Small-Body Database', `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${enc(b.number ?? id)}`);
  add('mpc', 'Minor Planet Center', `https://minorplanetcenter.net/db_search/show_object?object_id=${enc(b.number ?? id)}`);
  add('ads', 'NASA ADS', `https://ui.adsabs.harvard.edu/search/q=${enc(`abs:"${b.name ?? id}"`)}&sort=citation_count%20desc`);
  return links;
}
