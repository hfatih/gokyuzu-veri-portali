// Akışı bağlar: arama → seçim → veri → kart + replika → 3D. Mantık modüllerde; burada yalnız
// durum geçişleri ve DOM olayları var. Sayfa durumu body[data-state]: home | object | 3d.

import { t, lang, otypeName, num, applyStatic } from './ui/i18n.js';
import { createSuggester, SUN_ITEM } from './search/suggest.js';
import { wikipediaFor } from './search/wikidata.js';
import { prettyId } from './search/variants.js';
import { fetchObject, isStar } from './star/fetch.js';
import { deriveStar, starVisualParams } from './star/derive.js';
import { buildLinks } from './star/links.js';
import { renderCard, linkItems } from './ui/card.js';
import { createStarRenderer } from './render/star.js';
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
const bg = createStarRenderer(bgCanvas, { scale: 0.75 });
const mini = createStarRenderer(miniCanvas, { stars: false });
if (!bg) { body.classList.add('nowebgl'); $('#nowebgl').textContent = t('nowebgl'); }

function showStar(params) {
  if (bg) bg.setStar(params);
  if (mini) { mini.cam.dist = 2.9; mini.setStar(params); }
  $('#fallback').style.setProperty('--star', blackbodyCss(params.teff));
}

// Arka plan kadrajı duruma ve ekran oranına göre
function frameBackground() {
  if (!bg) return;
  const wide = innerWidth / innerHeight > 1.1, state = body.dataset.state;
  if (state === 'home') Object.assign(bg.cam, { dist: 2.6, pitch: 0.18 }), (bg.shift = [0, -1.55]);
  // Dar ekranda yıldız üstte, ekran genişliğinin ~%80'i (uv birimi ekran yüksekliğine göre)
  else if (state === 'object') Object.assign(bg.cam, { dist: wide ? 3.0 : 8, pitch: 0.25 }), (bg.shift = wide ? [0.95, 0] : [0, 0.55]);
  else Object.assign(bg.cam, { dist: 3.2, pitch: 0.25 }), (bg.shift = [0, 0]);
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
    const alt = prettyId(it.mainId);
    meta.textContent = [otypeName(it.otype), alt !== it.label ? alt : '', it.sp, Number.isFinite(it.nbref) ? t('search.refs', { n: num(it.nbref, 3) }) : '']
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

async function choose(sel) {
  suggester.cancel();
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
    const obj = await fetchObject(sel.mainId, signal);
    const star = isStar(obj.basic.otype);
    const d = star ? deriveStar(obj.raw) : null;
    body.dataset.kind = star ? 'star' : 'other';
    // Adresten açıldıysa okunur ad SIMBAD'ın "NAME …" kimliğinden
    if (sel.fromUrl) sel.label = [obj.mainId, ...obj.ids].find((i) => i.startsWith('NAME '))?.slice(5) ?? sel.label;
    input.value = sel.label;
    renderCard(card, sel, obj, d, buildLinks(obj));
    if (star) showStar(starVisualParams(d));
    cornerBtn.hidden = !star || !mini;
    const q = new URLSearchParams({ star: obj.mainId });
    if (lang === 'en') q.set('lang', 'en');
    history.replaceState(null, '', `?${q}`);
    // Wikipedia bağlantıları ayrı gelir; gelmezse kart yine tamdır
    wikipediaFor(obj.mainId === 'Sun' ? [] : [obj.mainId, obj.mainId.replace(/\s+/g, ' ')], signal)
      .then((wiki) => { const ul = card.querySelector('[data-links]'); if (ul) ul.innerHTML = linkItems(buildLinks(obj, sunWiki(obj, wiki))); })
      .catch(() => {});
  } catch (e) {
    if (signal.aborted) return;
    card.innerHTML = `<p class="note">${t(e.message === 'not-found' ? 'load.notFound' : 'load.fail')}</p>`;
    toast(t('load.fail'));
  } finally {
    if (!signal.aborted) card.removeAttribute('aria-busy');
  }
}

// Güneş SIMBAD'da olmadığından Wikipedia adresi sabit
const sunWiki = (obj, wiki) => (obj.mainId === 'Sun' ? { tr: 'https://tr.wikipedia.org/wiki/G%C3%BCne%C5%9F', en: 'https://en.wikipedia.org/wiki/Sun' } : wiki);

function goHome() {
  loadCtrl?.abort();
  body.dataset.state = 'home';
  card.hidden = true; cornerBtn.hidden = true;
  history.replaceState(null, '', lang === 'en' ? '?lang=en' : location.pathname);
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
