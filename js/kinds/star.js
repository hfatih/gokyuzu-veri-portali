// Yıldız (ve modeli olmayan diğer SIMBAD cisimleri için yedek tür). Kart çizildikten sonra iki ek
// bölüm ayrı gelir: görsel çift yıldız yörüngesi (ORB6) ve değişen yıldız (VSX). Gelmezlerse kart
// yine tamdır.

import { isStar } from '../star/fetch.js';
import { deriveStar, starVisualParams } from '../star/derive.js';
import { buildLinks } from '../star/links.js';
import { renderCard } from '../ui/card.js';
import { wikipediaFor } from '../search/wikidata.js';
import { starScene } from '../render/star.js';
import { blackbodyCss } from '../render/color.js';
import { isBinaryCandidate, fetchOrbit } from '../binary/fetch.js';
import { deriveBinary, apparentOrbit, yearFromJd } from '../binary/derive.js';
import { binaryHtml } from '../ui/binary-card.js';
import { binaryScene, binaryVisualParams } from '../render/binary.js';
import { isVariableCandidate, fetchVariable } from '../variable/fetch.js';
import { deriveVariable, pulseParams } from '../variable/derive.js';
import { variableHtml } from '../ui/variable-card.js';
import { t } from '../ui/i18n.js';
import { sunModel, realSunModel } from '../sun/model.js';
import { sunActivityHtml } from '../ui/sun-card.js';

// Güneş SIMBAD'da olmadığından Wikipedia adresi sabit
const SUN_WIKI = { tr: 'https://tr.wikipedia.org/wiki/G%C3%BCne%C5%9F', en: 'https://en.wikipedia.org/wiki/Sun' };
const jdNow = () => Date.now() / 86400000 + 2440587.5;

export const starKind = {
  id: 'star',
  byObj: () => true,
  load(ctx) {
    const { obj } = ctx;
    const star = isStar(obj.basic.otype);
    const d = star ? deriveStar(obj.raw) : null;
    ctx.kind(star ? (obj.mainId === 'Sun' ? 'sun' : 'star') : 'other');
    renderCard(ctx.card, ctx.sel, obj, d, buildLinks(obj));
    // Sahne durumu: yıldız parametreleri (değişen yıldızda zonklama eklenir) ve çift yıldız görünümü açık mı
    const view = star ? { params: starVisualParams(d), css: blackbodyCss(d.teff?.value ?? 5772), binary: false } : null;
    // Güneş: lekeler ve faküller etkinlik modelinden (sun/activity.js)
    if (obj.mainId === 'Sun') view.params = { ...view.params, sun: sunModel() };
    if (star) ctx.show(starScene, view.params, 1, view.css);
    ctx.corner(star);
    const sun = obj.mainId === 'Sun';
    ctx.wiki(sun ? Promise.resolve(SUN_WIKI) : wikipediaFor(simbadForms(obj.mainId), ctx.signal), (wiki) => buildLinks(obj, wiki));
    ctx.describe({ derived: d });
    if (star && isBinaryCandidate(obj)) addBinary(ctx, d, view);
    if (star && isVariableCandidate(obj)) addVariable(ctx, d, view);
    if (sun) addSunActivity(ctx, view);
  },
};

function addBinary(ctx, d, view) {
  const { obj, signal } = ctx;
  fetchOrbit(obj, signal).then((orb) => {
    if (!orb || signal.aborted) return;
    const year = yearFromJd(jdNow());
    const bd = deriveBinary(orb.el, obj.basic.plx, obj.raw.plxErr, orb.dmag, year);
    ctx.insert(binaryHtml(orb, bd, apparentOrbit(orb.el)));
    const btn = ctx.card.querySelector('[data-binary-scene]');
    btn?.addEventListener('click', () => {
      view.binary = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(view.binary));
      btn.textContent = t(view.binary ? 'b.showStar' : 'b.show3d');
      ctx.kind(view.binary ? 'binary' : 'star');   // Güneş çift değil; bu düğme yalnız ORB6 yıldızlarında
      if (view.binary) ctx.show(binaryScene, binaryVisualParams(orb.el, bd, d.teff?.value ?? 5772, year), 1.15, view.css, 0.12);
      else ctx.show(starScene, view.params, 1, view.css);
    });
  }).catch(() => {});
}

function addVariable(ctx, d, view) {
  const { obj, signal } = ctx;
  fetchVariable(obj, signal).then((v) => {
    if (!v || signal.aborted) return;
    const vd = deriveVariable(v, obj.mags, d.av?.value ?? 0, d.feh?.value ?? null, jdNow());
    ctx.insert(variableHtml(v, vd, d.distancePc?.value ?? null));
    const pulse = pulseParams(vd);
    if (pulse) {
      view.params = { ...view.params, pulse };
      if (!view.binary) ctx.show(starScene, view.params, 1, view.css);
    }
  }).catch(() => {});
}

// Güneş etkinliği bölümü: önce model; NOAA'dan bugünkü bölgeler gelirse görünen yüz onlarla yeniden kurulur
function addSunActivity(ctx, view) {
  ctx.insert(`<div data-sun-activity>${sunActivityHtml(view.params.sun.summary(0), 0)}</div>`);
  realSunModel(ctx.signal).then((m) => {
    if (!m || ctx.signal.aborted) return;
    view.params = { ...view.params, sun: m };
    if (!view.binary) ctx.show(starScene, view.params, 1, view.css);
    const s = m.summary(0), el = ctx.card.querySelector('[data-sun-activity]');
    if (el) el.innerHTML = sunActivityHtml(s, s.realGroups);
  }).catch(() => {});
}

/** SIMBAD kimliğinin Wikidata'daki olası yazımları (çoklu boşluklar teke indirilmiş). */
export const simbadForms = (id) => [...new Set([id, id.replace(/\s+/g, ' ')])];
