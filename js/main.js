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
import { isSolarPlanetId } from './planet/solar.js';
import { stopPulses } from './pulsar/sound.js';
import { kindById, kindByObj } from './kinds/index.js';
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
    const alt = isBlackHoleId(it.mainId) || isSsoId(it.mainId) ? it.label : prettyId(it.mainId), solar = isSolarPlanetId(it.mainId);
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
    show: showScene,
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

async function choose(sel) {
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
  card.innerHTML = `<p class="card__loading">${t('search.loading')}</p>`;
  frameBackground();
  try {
    let kind = kindById(sel.mainId), obj = null;
    if (!kind) {
      obj = await fetchObject(sel.mainId, signal);
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
    if (lang === 'en') q.set('lang', 'en');
    history.replaceState(null, '', `?${q}`);
    document.title = `${sel.label} · ${t('title')}`;
  } catch (e) {
    if (signal.aborted) return;
    card.innerHTML = `<p class="note">${t(e.message === 'not-found' ? 'load.notFound' : 'load.fail')}</p>
      ${e.message === 'not-found' ? '' : `<button type="button" class="retry" data-retry>${t('load.retry')}</button>`}`;
    card.querySelector('[data-retry]')?.addEventListener('click', () => choose(sel));
    toast(t('load.fail'));
  } finally {
    if (!signal.aborted) card.removeAttribute('aria-busy');
  }
}

// Kartın ortak ekleri: kısmi veri uyarısı (tekrar dene)
function afterLoad(ctx) {
  if (ctx.isPartial) insertBeforeLinks(`<p class="note note--warn">${t('load.partial')}
    <button type="button" class="retry retry--inline" data-retry>${t('load.retry')}</button></p>`);
  card.querySelector('[data-retry]')?.addEventListener('click', () => choose({ ...ctx.sel, fromUrl: false }));
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
  $('.v3d__model').textContent = t({ planet: 'v3d.modelPlanet', nebula: 'v3d.modelNebula', galaxy: 'v3d.modelGalaxy', bh: 'v3d.modelBH', cluster: 'v3d.modelCluster', pulsar: 'v3d.modelPulsar', sso: 'v3d.modelSso', quasar: 'v3d.modelQuasar' }[body.dataset.kind] ?? 'v3d.model');
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
const startId = new URLSearchParams(location.search).get('star');
if (startId) choose(startId === 'Sun' ? { ...SUN_ITEM, label: lang === 'en' ? 'Sun' : 'Güneş' } :{ label: prettyId(startId), mainId: startId, otype: null, fromUrl: true });
else goHome();
