// Akışı bağlar: arama → seçim → veri → kart + replika → 3D. Mantık modüllerde; burada yalnız
// durum geçişleri ve DOM olayları var. Sayfa durumu body[data-state]: home | object | 3d.

import { t, lang, otypeName, num, applyStatic } from './ui/i18n.js';
import { createSuggester, SUN_ITEM } from './search/suggest.js';
import { prettyId } from './search/variants.js';
import { fetchObject } from './star/fetch.js';
import { deriveStar, starVisualParams } from './star/derive.js';
import { linkItems } from './ui/card.js';
import { isBlackHoleId } from './bh/fetch.js';
import { isSsoId } from './sso/fetch.js';
import { isSolarPlanetId, isMoonId } from './planet/solar.js';
import { stopPulses } from './pulsar/sound.js';
import { kindById, kindByObj } from './kinds/index.js';
import { skyHtml, bindSky } from './ui/sky-card.js';
import { lookupIds } from './search/simbad.js';
import { fetchRelated, blackHolesIn, hostOfBlackHole } from './search/related.js';
import { FEATURED, todaysPick } from './explore/featured.js';
import { TOURS, tourById } from './explore/tours.js';
import { resolveRef } from './explore/refs.js';
import { radiusOf } from './explore/size.js';
import { compareHtml, bindCompare, toggleCompare, inCompare, compareItems, onCompareChange, clearCompare } from './ui/compare.js';
import { createView } from './render/glview.js';
import { starScene } from './render/star.js';
import { attachOrbitControls } from './render/view3d.js';
import { blackbodyCss } from './render/color.js';

const $ = (s) => document.querySelector(s);
const body = document.body;
const input = $('#q'), list = $('#suggest'), status = $('#status'), card = $('#card');
const bgCanvas = $('#bg'), miniCanvas = $('#mini'), cornerBtn = $('#corner');

applyStatic();
document.title = t('title');
$('#lang').textContent = t('lang.switch');

// ---------- Çiziciler ----------
const bg = createView(bgCanvas, { scale: 0.75 });
const mini = createView(miniCanvas, { stars: false });
if (!bg) { body.classList.add('nowebgl'); $('#nowebgl').textContent = t('nowebgl'); }
let extent = 1;   // cismin kadrajdaki boyu (halkalı gezegende halka dış yarıçapı)
let basePitch = 0.25;   // varsayılan bakış yüksekliği (gökadada ölçülen eğiklikten)

function showScene(scene, params, size, fallbackCss, pitch = 0.25) {
  extent = size; basePitch = pitch;
  if (bg) { bg.setScene(scene, params); frameBackground(); }
  if (mini) { Object.assign(mini.cam, { dist: 2.9 * size, pitch }); mini.setScene(scene, params); }
  $('#fallback').style.setProperty('--star', fallbackCss);
}
const showStar = (params) => showScene(starScene, params, 1, blackbodyCss(params.teff));

// Arka plan kadrajı duruma ve ekran oranına göre
function frameBackground() {
  if (!bg) return;
  const wide = innerWidth / innerHeight > 1.1, state = body.dataset.state;
  if (state === 'home') Object.assign(bg.cam, { dist: 2.6, pitch: 0.18 }), (bg.shift = [0, -1.55]);
  // Dar ekranda yıldız üstte, ekran genişliğinin ~%80'i (uv birimi ekran yüksekliğine göre)
  else if (state === 'object') Object.assign(bg.cam, { dist: (wide ? 3.0 : 8) * extent, pitch: basePitch }), (bg.shift = wide ? [0.95, 0] : [0, 0.55]);
  else Object.assign(bg.cam, { dist: 3.2 * extent, pitch: basePitch }), (bg.shift = [0, 0]);
  bg.redraw();
}
addEventListener('resize', frameBackground);

// ---------- Arama kutusu (ARIA combobox) ----------
let items = [], active = -1;

function renderList({ items: next, pending, failed }) {
  items = next; active = -1;
  input.setAttribute('aria-activedescendant', '');
  list.innerHTML = '';
  for (const [i, it] of items.entries()) {
    const li = document.createElement('li');
    li.id = `opt-${i}`; li.role = 'option'; li.className = 'opt';
    const name = document.createElement('span'); name.className = 'opt__name'; name.textContent = it.label;
    const meta = document.createElement('span'); meta.className = 'opt__meta';
    const alt = isBlackHoleId(it.mainId) || isSsoId(it.mainId) || isMoonId(it.mainId) ? it.label : prettyId(it.mainId), solar = isSolarPlanetId(it.mainId);
    meta.textContent = solar ? t('p.solar')
      : [otypeName(it.otype), alt !== it.label ? alt : '', it.sp, Number.isFinite(it.nbref) && !it.rankOnly ? t('search.refs', { n: num(it.nbref, 3) }) : '']
        .filter(Boolean).join(' · ');
    li.append(name, meta);
    li.addEventListener('pointerdown', (e) => { e.preventDefault(); choose(it); });
    list.append(li);
  }
  const open = items.length > 0;
  list.hidden = !open;
  input.setAttribute('aria-expanded', String(open));
  const msgs = [];
  if (failed.includes('simbad')) msgs.push(t('search.failSimbad'));
  if (failed.includes('wikidata') && !pending) msgs.push(t('search.failWikidata'));
  if (!items.length && !pending && input.value.trim().length >= 2) msgs.push(t('search.none'));
  else if (pending) msgs.push(t('search.more'));
  status.textContent = msgs.join(' ');
}

const suggester = createSuggester(renderList, () => lang);

function setActive(i) {
  active = (i + items.length) % items.length;
  list.querySelectorAll('.opt').forEach((el, k) => el.setAttribute('aria-selected', String(k === active)));
  input.setAttribute('aria-activedescendant', `opt-${active}`);
  list.children[active]?.scrollIntoView({ block: 'nearest' });
}

input.addEventListener('input', () => {
  status.textContent = input.value.trim().length >= 2 ? t('search.loading') : '';
  suggester.query(input.value);
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); setActive(active + 1); }
  else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); setActive(active - 1); }
  else if (e.key === 'Enter' && items.length) { e.preventDefault(); choose(items[Math.max(0, active)]); }
  else if (e.key === 'Escape') { list.hidden = true; input.setAttribute('aria-expanded', 'false'); }
});
input.addEventListener('blur', () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); });
input.addEventListener('focus', () => { if (items.length) { list.hidden = false; input.setAttribute('aria-expanded', 'true'); } });

// ---------- Seçim ve kart ----------
let loadCtrl = null;

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('is-on');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('is-on'), 5000);
}

const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Türlerin kullandığı ortak arayüz (kinds/index.js)
function makeCtx(sel, obj, signal) {
  const ctx = {
    sel, obj, signal, card, info: {},
    show: (scene, params, size, css, pitch) => { ctx.color = css; showScene(scene, params, size, css, pitch); },
    corner: (on) => { cornerBtn.hidden = !on || !mini; },
    kind: (k) => { body.dataset.kind = k; },
    setLabel: (label) => { sel.label = label; input.value = label; },
    choose,
    // Wikipedia bağlantıları ayrı gelir; gelmezse kart yine tamdır
    wiki: (promise, build) => promise.then((wiki) => {
      if (signal.aborted) return;
      const ul = card.querySelector('[data-links]');
      if (ul) ul.innerHTML = linkItems(build(wiki));
    }).catch(() => {}),
    partial: () => { ctx.isPartial = true; },
    describe: (info) => Object.assign(ctx.info, info),
  };
  return ctx;
}

let tour = null;   // { def, i } etkin rehberli tur

/** sel: { label, mainId, otype, fromUrl? }. opts.tour: tur adımı olarak açılıyorsa tur sürer. */
async function choose(sel, opts = {}) {
  if (!opts.tour) tour = null;
  suggester.cancel();
  stopPulses();
  list.hidden = true; input.setAttribute('aria-expanded', 'false');
  input.value = sel.label; input.blur();
  loadCtrl?.abort();
  loadCtrl = new AbortController();
  const signal = loadCtrl.signal;
  body.dataset.state = 'object';
  card.hidden = false;
  card.setAttribute('aria-busy', 'true');
  card.innerHTML = `${tourBar()}<p class="card__loading">${t('search.loading')}</p>`;
  bindTour();
  frameBackground();
  try {
    let kind = kindById(sel.mainId), obj = null;
    if (!kind) {
      obj = await fetchObjectAny(sel.mainId, signal);
      // Adresten açıldıysa okunur ad SIMBAD'ın "NAME …" kimliğinden
      if (sel.fromUrl) sel.label = bestName(obj) ?? sel.label;
      input.value = sel.label;
      kind = kindByObj(obj);
    }
    const ctx = makeCtx(sel, obj, signal);
    await kind.load(ctx);
    if (signal.aborted) return;
    if (obj?.partial) ctx.partial();
    afterLoad(ctx);
    const q = new URLSearchParams({ star: obj?.mainId ?? sel.mainId });
    if (tour) { q.set('tour', tour.def.id); q.set('step', String(tour.i + 1)); }
    if (lang === 'en') q.set('lang', 'en');
    history.replaceState(null, '', `?${q}`);
    document.title = `${sel.label} · ${t('title')}`;
  } catch (e) {
    if (signal.aborted) return;
    card.innerHTML = `${tourBar()}<p class="note">${t(e.message === 'not-found' ? 'load.notFound' : 'load.fail')}</p>
      ${e.message === 'not-found' ? '' : `<button type="button" class="retry" data-retry>${t('load.retry')}</button>`}`;
    bindTour();
    card.querySelector('[data-retry]')?.addEventListener('click', () => choose(sel, { tour: !!tour }));
    toast(t('load.fail'));
  } finally {
    if (!signal.aborted) card.removeAttribute('aria-busy');
  }
}

// main_id değilse (Wikidata'nın verdiği ya da elle yazılan kimlik) SIMBAD kimlik tablosundan çözülür
async function fetchObjectAny(id, signal) {
  try { return await fetchObject(id, signal); } catch (e) {
    if (e.message !== 'not-found') throw e;
    const [hit] = await lookupIds([id], signal);
    if (!hit || hit.mainId === id) throw e;
    return fetchObject(hit.mainId, signal);
  }
}

// Kartın ortak ekleri: tur, karşılaştırma, gökyüzü konumu, ilişkili cisimler, kısmi veri uyarısı
function afterLoad(ctx) {
  card.insertAdjacentHTML('afterbegin', tourBar());
  bindTour();
  addCompareButton(ctx);
  const sky = skySourceFor(ctx);
  if (sky) {
    try { insertBeforeLinks(skyHtml(sky.src, sky.opts)); bindSky(card, sky.src, sky.opts); }
    catch (e) { console.warn('gökyüzü hesabı', e); }
  }
  addRelated(ctx);
  if (ctx.isPartial) {
    insertBeforeLinks(`<p class="note note--warn">${t('load.partial')}
      <button type="button" class="retry retry--inline" data-retry>${t('load.retry')}</button></p>`);
    card.querySelector('[data-retry]')?.addEventListener('click', () => choose({ ...ctx.sel, fromUrl: false }, { tour: !!tour }));
  }
  bindGoto(card);
}

/** data-goto düğmeleri (kart içi bağlantılar) o cismi açar. */
function bindGoto(root) {
  root.querySelectorAll('[data-goto]:not([data-bound])').forEach((b) => {
    b.dataset.bound = '1';
    b.addEventListener('click', () => choose({ label: b.textContent.trim(), mainId: b.dataset.goto, otype: null }));
  });
}

// ---------- İlişkili cisimler (SIMBAD hiyerarşisi, Wikidata "parçası") ----------
function addRelated(ctx) {
  const { obj, info, signal } = ctx, kind = body.dataset.kind;
  let job = null;
  if (info.bh) job = hostOfBlackHole(info.bh.qid, signal);
  else if (obj && obj.mainId !== 'Sun' && obj.basic.oid) {
    const kids = ['star', 'other', 'nebula', 'pulsar'].includes(kind);
    job = Promise.all([
      fetchRelated(obj, signal, kids),
      kind === 'galaxy' ? blackHolesIn(obj.mainId, lang, signal).catch(() => []) : [],
    ]).then(([a, b]) => [...b, ...a]);
  }
  if (!job) return;
  insertBeforeLinks('<div data-related hidden></div>');
  job.then((items) => {
    const el = card.querySelector('[data-related]');
    if (signal.aborted || !el || !items.length) return;
    el.outerHTML = `<h3 class="card__h">${t('rel.h')}</h3><ul class="chips chips--rel">${items.map((it) => `<li>
      <button type="button" class="chip" data-goto="${esc(it.mainId)}">${esc(it.label)}</button>
      <span class="chip__meta">${esc([t('rel.' + it.rel), otypeName(it.otype)].filter(Boolean).join(' · '))}</span></li>`).join('')}</ul>`;
    bindGoto(card);
  }).catch(() => {});
}

// ---------- Ölçek karşılaştırması ----------
const cmpDialog = $('#cmp'), cmpBody = $('#cmp-body'), cmpOpen = $('#cmp-open'), cmpLog = $('#cmp-log');

function addCompareButton(ctx) {
  const r = radiusOf(body.dataset.kind, ctx.info);
  if (!r) return;
  const id = ctx.obj?.mainId ?? ctx.sel.mainId;
  const head = card.querySelector('.card__head');
  if (!head) return;
  head.insertAdjacentHTML('afterend', `<p class="card__actions"><button type="button" class="chip chip--small" data-cmp-add aria-pressed="${inCompare(id)}">${t(inCompare(id) ? 'cmp.added' : 'cmp.add')}</button></p>`);
  const btn = card.querySelector('[data-cmp-add]');
  btn.addEventListener('click', () => {
    toggleCompare({ label: ctx.sel.label, mainId: id, kind: body.dataset.kind, m: r.m, color: ctx.color ?? '#ccc', origin: r.origin, note: r.note });
    const on = inCompare(id);
    btn.textContent = t(on ? 'cmp.added' : 'cmp.add');
    btn.setAttribute('aria-pressed', String(on));
  });
}

function renderCompare() {
  cmpBody.innerHTML = compareHtml(cmpLog.checked);
  bindCompare(cmpBody, renderCompare);
}
function syncComparePill() {
  const n = compareItems().length;
  cmpOpen.hidden = n === 0;
  cmpOpen.innerHTML = `<span aria-hidden="true">⚖</span> <span class="cmp-pill__txt">${t('cmp.open')}</span> ${n}`;
  cmpOpen.setAttribute('aria-label', `${t('cmp.open')} (${n})`);
}
cmpOpen.addEventListener('click', () => { renderCompare(); cmpDialog.showModal(); });
$('#cmp-close').addEventListener('click', () => cmpDialog.close());
$('#cmp-clear').addEventListener('click', () => { clearCompare(); renderCompare(); });
cmpLog.addEventListener('change', renderCompare);
cmpDialog.addEventListener('click', (e) => { if (e.target === cmpDialog) cmpDialog.close(); });
onCompareChange(syncComparePill);
syncComparePill();

// ---------- Ana sayfa: bugünün cismi, keşfet, turlar ----------
async function openRef(ref, label, opts) {
  const ctrl = new AbortController();
  try {
    const sel = await resolveRef(ref, label, lang, ctrl.signal);
    if (sel) return choose(sel, opts);
  } catch {}
  // Çözülemedi: ad arama kutusuna yazılır, öneriler açılır
  tour = null;
  goHome();
  input.value = label;
  suggester.query(label);
  toast(t('ex.resolveFail'));
}

function renderExplore() {
  const today = todaysPick();
  $('#today').innerHTML = `<span class="explore__tag">${t('ex.today')}</span> <button type="button" class="linkbtn" data-feat="${FEATURED.indexOf(today)}">${esc(today[lang])}</button>`;
  $('#chips').innerHTML = FEATURED.map((f, i) => `<li><button type="button" class="chip chip--${f.kind}" data-feat="${i}">${esc(f[lang])}</button></li>`).join('');
  $('#tours').innerHTML = TOURS.map((x) => `<li><button type="button" class="tour-btn" data-tour="${x.id}">
    <span class="tour-btn__name">${esc(x[lang])}</span><span class="tour-btn__meta">${t('ex.steps', { n: x.steps.length })}</span></button></li>`).join('');
  document.querySelectorAll('[data-feat]').forEach((b) => b.addEventListener('click', () => {
    const f = FEATURED[Number(b.dataset.feat)];
    openRef(f.ref, f[lang]);
  }));
  document.querySelectorAll('[data-tour]').forEach((b) => b.addEventListener('click', () => startTour(b.dataset.tour, 0)));
}

// ---------- Rehberli tur ----------
function startTour(id, i) {
  const def = tourById(id);
  if (!def) return;
  tour = { def, i: Math.max(0, Math.min(def.steps.length - 1, i)) };
  const st = def.steps[tour.i];
  openRef(st.ref, st.label[lang], { tour: true });
}

function tourBar() {
  if (!tour) return '';
  const { def, i } = tour, st = def.steps[i], last = i === def.steps.length - 1;
  return `<aside class="tourbar" aria-label="${esc(def[lang])}">
    <p class="tourbar__head"><span class="tourbar__tag">${t('tour.label')}</span> ${esc(def[lang])} · ${i + 1}/${def.steps.length}</p>
    <p class="tourbar__text">${esc(st[lang])}</p>
    ${last ? `<p class="tourbar__text muted">${t('tour.done')}</p>` : ''}
    <p class="tourbar__nav">
      <button type="button" class="chip chip--small" data-tour-nav="-1"${i === 0 ? ' disabled' : ''}>${t('tour.prev')}</button>
      ${last ? `<button type="button" class="chip chip--small" data-tour-home>${t('tour.home')}</button>`
        : `<button type="button" class="chip chip--small chip--accent" data-tour-nav="1">${t('tour.next')}</button>`}
      <button type="button" class="linkbtn" data-tour-exit>${t('tour.exit')}</button></p>
  </aside>`;
}

function bindTour() {
  card.querySelectorAll('[data-tour-nav]').forEach((b) => b.addEventListener('click', () => startTour(tour.def.id, tour.i + Number(b.dataset.tourNav))));
  card.querySelector('[data-tour-exit]')?.addEventListener('click', () => { tour = null; card.querySelector('.tourbar')?.remove(); history.replaceState(null, '', location.search.replace(/&?(tour|step)=[^&]*/g, '')); });
  card.querySelector('[data-tour-home]')?.addEventListener('click', () => { tour = null; goHome(); });
}

// Gözle görülebilen Güneş Sistemi gezegenleri; Uranüs ve Neptün dürbünle
const PLANET_INST = { mercury: 'eye', venus: 'eye', mars: 'eye', jupiter: 'eye', saturn: 'eye', uranus: 'binoculars', neptune: 'binoculars' };

/** Kartın gökyüzü kaynağı (sky/visibility.js) ya da null (Dünya, koordinatsız cisimler). */
function skySourceFor(ctx) {
  const { obj, info } = ctx;
  if (info.sky?.src) return info.sky;
  if (obj?.mainId === 'Sun') return { src: { type: 'sun' }, opts: { sun: true } };
  const solar = info.planet?.solar;
  if (solar) return PLANET_INST[solar.key] ? { src: { type: 'planet', key: solar.key }, opts: { instrument: PLANET_INST[solar.key] } } : null;
  if (info.planet?.host) {
    const hb = info.planet.host.obj.basic;
    return hb.ra != null ? { src: { type: 'fixed', ra: hb.ra, dec: hb.dec }, opts: { vmag: info.planet.host.obj.mags?.V } } : null;
  }
  if (info.sso) {
    const el = info.sso.el;
    const ok = ['a', 'e', 'i', 'node', 'peri', 'M0', 'epoch'].every((k) => Number.isFinite(el[k])) && el.e < 1;
    return ok ? { src: { type: 'elements', el }, opts: { vmag: info.derived?.magNow?.value } } : null;
  }
  if (info.sky) return { src: { type: 'fixed', ...info.sky }, opts: {} };
  const b = obj?.basic;
  if (b?.ra != null && b?.dec != null) return { src: { type: 'fixed', ra: b.ra, dec: b.dec }, opts: { vmag: obj.mags?.V } };
  return null;
}

/** Kartta "Kaynaklarda ara" başlığının önüne HTML ekler (yoksa sona). */
function insertBeforeLinks(html) {
  const ul = card.querySelector('[data-links]');
  const anchor = ul?.previousElementSibling?.matches('.card__h') ? ul.previousElementSibling : ul;
  if (anchor) anchor.insertAdjacentHTML('beforebegin', html); else card.insertAdjacentHTML('beforeend', html);
}

// SIMBAD'ın "NAME …" kimliklerinden okunur olanı: küçük harf içeren ve en uzun ("CRAB NEB" değil "Crab Nebula")
function bestName(obj) {
  const names = [obj.mainId, ...obj.ids].filter((i) => i.startsWith('NAME ')).map((i) => i.slice(5));
  return names.sort((a, b) => (/[a-z]/.test(b) - /[a-z]/.test(a)) || b.length - a.length)[0];
}

function goHome() {
  tour = null;
  loadCtrl?.abort();
  stopPulses();
  body.dataset.state = 'home';
  card.hidden = true; cornerBtn.hidden = true;
  history.replaceState(null, '', lang === 'en' ? '?lang=en' : location.pathname);
  document.title = t('title');
  fetchObject('Sun').then((o) => showStar(starVisualParams(deriveStar(o.raw))));
  frameBackground();
  input.focus();
}
$('#brand').addEventListener('click', (e) => { e.preventDefault(); goHome(); });

$('#lang').addEventListener('click', (e) => {
  e.preventDefault();
  const q = new URLSearchParams(location.search);
  if (lang === 'en') q.delete('lang'); else q.set('lang', 'en');
  location.search = q.toString();
});

// ---------- 3D görünüm ----------
let detach = null;
const speedEl = $('#v3d-speed'), speedOut = $('#v3d-speed-val');

function fmtDuration(s) {
  const units = [[3.15576e7, 'unit.yr'], [86400, 'unit.d'], [3600, 'unit.h']];
  for (const [k, u] of units) if (s >= k) return `${num(s / k)} ${t(u)}`;
  return lang === 'tr' ? `${num(s)} sn` : `${num(s)} s`;
}
function syncSpeed() { speedEl.value = Math.log10(bg.timeScale).toFixed(2); speedOut.textContent = t('v3d.speedVal', { v: fmtDuration(bg.timeScale) }); }

function open3D() {
  if (!bg) return;
  body.dataset.state = '3d';
  $('#v3d').hidden = false;
  $('.v3d__model').textContent = t({ planet: 'v3d.modelPlanet', moon: 'v3d.modelMoon', nebula: 'v3d.modelNebula', galaxy: 'v3d.modelGalaxy', bh: 'v3d.modelBH', cluster: 'v3d.modelCluster', pulsar: 'v3d.modelPulsar', sso: 'v3d.modelSso', quasar: 'v3d.modelQuasar' }[body.dataset.kind] ?? 'v3d.model');
  bg.scale = 1;
  frameBackground();
  detach = attachOrbitControls(bg, bgCanvas);
  syncSpeed();
  $('#v3d-close').focus();
}
function close3D() {
  if (body.dataset.state !== '3d') return;
  detach?.(); detach = null;
  $('#v3d').hidden = true;
  bg.scale = 0.75;
  body.dataset.state = 'object';
  frameBackground();
  cornerBtn.focus();
}
cornerBtn.addEventListener('click', open3D);
$('#v3d-close').addEventListener('click', close3D);
addEventListener('keydown', (e) => { if (e.key === 'Escape') close3D(); });
speedEl.addEventListener('input', () => { bg.timeScale = 10 ** Number(speedEl.value); syncSpeed(); });
$('#v3d-gran').addEventListener('change', (e) => { bg.granulation = e.target.checked; bg.redraw(); });
$('#v3d-spots').addEventListener('change', (e) => { bg.spots = e.target.checked; bg.redraw(); });
$('#v3d-exp').addEventListener('input', (e) => { bg.exposure = Number(e.target.value); bg.redraw(); });
$('#v3d-reset').addEventListener('click', () => { Object.assign(bg.cam, { yaw: 0.6 }); frameBackground(); });

// ---------- Açılış ----------
renderExplore();
const startQ = new URLSearchParams(location.search);
const startId = startQ.get('star');
if (startQ.get('tour') && tourById(startQ.get('tour'))) startTour(startQ.get('tour'), Number(startQ.get('step') || 1) - 1);
else if (startId) choose(startId === 'Sun' ? { ...SUN_ITEM, label: lang === 'en' ? 'Sun' : 'Güneş' } : { label: prettyId(startId), mainId: startId, otype: null, fromUrl: true });
else goHome();
