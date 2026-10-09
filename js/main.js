// Akışı bağlar: arama → seçim → veri → kart + replika → 3D. Mantık modüllerde; burada yalnız
// durum geçişleri ve DOM olayları var. Sayfa durumu body[data-state]: home | object | 3d.

import { t, lang, otypeName, num, applyStatic } from './ui/i18n.js';
import { createSuggester, SUN_ITEM } from './search/suggest.js';
import { wikipediaFor, wikipediaForQid } from './search/wikidata.js';
import { prettyId } from './search/variants.js';
import { fetchObject, isStar } from './star/fetch.js';
import { deriveStar, starVisualParams } from './star/derive.js';
import { buildLinks } from './star/links.js';
import { renderCard, linkItems } from './ui/card.js';
import { renderPlanetCard } from './ui/planet-card.js';
import { fetchPlanet } from './planet/fetch.js';
import { derivePlanet } from './planet/derive.js';
import { planetVisualParams } from './planet/visual.js';
import { buildPlanetLinks } from './planet/links.js';
import { solarPlanet, isSolarPlanetId } from './planet/solar.js';
import { nebulaKind, deriveNebula } from './nebula/derive.js';
import { nebulaVisualParams } from './nebula/visual.js';
import { renderNebulaCard } from './ui/nebula-card.js';
import { nebulaScene } from './render/nebula.js';
import { isGalaxy, deriveGalaxy } from './galaxy/derive.js';
import { galaxyVisualParams } from './galaxy/visual.js';
import { renderGalaxyCard } from './ui/galaxy-card.js';
import { galaxyScene } from './render/galaxy.js';
import { fetchBlackHole, isBlackHoleId } from './bh/fetch.js';
import { deriveBlackHole } from './bh/derive.js';
import { renderBlackHoleCard, buildBlackHoleLinks } from './ui/bh-card.js';
import { blackHoleScene } from './render/blackhole.js';
import { clusterKind, deriveCluster } from './cluster/derive.js';
import { fetchMembers } from './cluster/fetch.js';
import { clusterVisualParams } from './cluster/visual.js';
import { renderClusterCard } from './ui/cluster-card.js';
import { clusterScene } from './render/cluster.js';
import { isPulsar, derivePulsar } from './pulsar/derive.js';
import { fetchPulsar } from './pulsar/fetch.js';
import { pulsarVisualParams } from './pulsar/visual.js';
import { playPulses, stopPulses } from './pulsar/sound.js';
import { renderPulsarCard, buildPulsarLinks } from './ui/pulsar-card.js';
import { pulsarScene } from './render/pulsar.js';
import { fetchSso, isSsoId } from './sso/fetch.js';
import { deriveSso } from './sso/derive.js';
import { jdNow } from './sso/orbit.js';
import { ssoVisualParams } from './sso/visual.js';
import { renderSsoCard, buildSsoLinks } from './ui/sso-card.js';
import { ssoScene } from './render/sso.js';
import { isQuasar, deriveQuasar } from './quasar/derive.js';
import { observedRgb } from './quasar/spectrum.js';
import { renderQuasarCard, buildQuasarLinks, rgbCss } from './ui/quasar-card.js';
import { createView } from './render/glview.js';
import { starScene } from './render/star.js';
import { planetScene } from './render/planet.js';
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
    if (isBlackHoleId(sel.mainId) || isSsoId(sel.mainId)) {
      await (isSsoId(sel.mainId) ? loadSso : loadBlackHole)(sel, signal);
      history.replaceState(null, '', `?${new URLSearchParams({ star: sel.mainId, ...(lang === 'en' ? { lang: 'en' } : {}) })}`);
      return;
    }
    const obj = isSolarPlanetId(sel.mainId) ? null : await fetchObject(sel.mainId, signal);
    // Adresten açıldıysa okunur ad SIMBAD'ın "NAME …" kimliğinden
    if (sel.fromUrl && obj) sel.label = bestName(obj) ?? sel.label;
    input.value = sel.label;
    if (!obj || obj.basic.otype === 'Pl' || obj.basic.otype === 'Pl?') await loadPlanet(sel, obj, signal);
    else if (nebulaKind(obj.basic.otype)) loadNebula(sel, obj, signal);
    else if (isGalaxy(obj.basic.otype)) loadGalaxy(sel, obj, signal);
    else if (clusterKind(obj.basic.otype)) await loadCluster(sel, obj, signal);
    else if (isPulsar(obj.basic.otype)) await loadPulsar(sel, obj, signal);
    else if (isQuasar(obj.basic.otype)) loadQuasar(sel, obj, signal);
    else loadStar(sel, obj, signal);
    const q = new URLSearchParams({ star: obj?.mainId ?? sel.mainId });
    if (lang === 'en') q.set('lang', 'en');
    history.replaceState(null, '', `?${q}`);
  } catch (e) {
    if (signal.aborted) return;
    card.innerHTML = `<p class="note">${t(e.message === 'not-found' ? 'load.notFound' : 'load.fail')}</p>`;
    toast(t('load.fail'));
  } finally {
    if (!signal.aborted) card.removeAttribute('aria-busy');
  }
}

// SIMBAD'ın "NAME …" kimliklerinden okunur olanı: küçük harf içeren ve en uzun ("CRAB NEB" değil "Crab Nebula")
function bestName(obj) {
  const names = [obj.mainId, ...obj.ids].filter((i) => i.startsWith('NAME ')).map((i) => i.slice(5));
  return names.sort((a, b) => (/[a-z]/.test(b) - /[a-z]/.test(a)) || b.length - a.length)[0];
}

// Wikipedia bağlantıları ayrı gelir; gelmezse kart yine tamdır
function addWiki(promise, build) {
  promise.then((wiki) => { const ul = card.querySelector('[data-links]'); if (ul) ul.innerHTML = linkItems(build(wiki)); }).catch(() => {});
}

function loadStar(sel, obj, signal) {
  const star = isStar(obj.basic.otype);
  const d = star ? deriveStar(obj.raw) : null;
  body.dataset.kind = star ? 'star' : 'other';
  renderCard(card, sel, obj, d, buildLinks(obj));
  if (star) showStar(starVisualParams(d));
  cornerBtn.hidden = !star || !mini;
  addWiki(wikipediaFor(obj.mainId === 'Sun' ? [] : [obj.mainId, obj.mainId.replace(/\s+/g, ' ')], signal),
    (wiki) => buildLinks(obj, sunWiki(obj, wiki)));
}

async function loadBlackHole(sel, signal) {
  const bh = await fetchBlackHole(sel.mainId, signal);
  if (sel.fromUrl) sel.label = bh.label;
  input.value = sel.label;
  const bd = bh.massSun ? deriveBlackHole({ massSun: bh.massSun, distLy: bh.distLy }) : null;
  body.dataset.kind = 'bh';
  renderBlackHoleCard(card, sel, bh, bd ?? { cls: 'supermassive' }, buildBlackHoleLinks(bh));
  // Kütle yoksa da model çizilir: görüntü r_s biriminde ölçeksizdir, yalnız zaman ölçeği ve disk sıcaklığı kütleye bağlı
  const params = bd
    ? { rsM: bd.rsKm.value * 1e3, tmax: bd.diskTmax.value, iscoPeriodS: bd.iscoPeriodS.value }
    : { rsM: 1.2e10, tmax: 2e5, iscoPeriodS: 1800 };
  showScene(blackHoleScene, params, 1.1, '#000', 0.12);
  cornerBtn.hidden = !mini;
  addWiki(wikipediaForQid(bh.qid, signal), (wiki) => buildBlackHoleLinks(bh, wiki));
}

// Asteroit, kuyruklu yıldız, cüce gezegen (IMCCE); bugünkü konum ve evre açısı açılış anından
async function loadSso(sel, signal) {
  const b = await fetchSso(sel.mainId, signal);
  if (sel.fromUrl) sel.label = b.title;
  input.value = sel.label;
  const sd = deriveSso(b, jdNow());
  body.dataset.kind = 'sso';
  renderSsoCard(card, sel, b, sd, buildSsoLinks(b));
  showScene(ssoScene, ssoVisualParams(b, sd), 1, '#9a948c', 0.2);
  cornerBtn.hidden = !mini;
}

// Kuasar: kırmızıya kaymadan kozmoloji; sahne merkezdeki kara delik (Eddington kütlesiyle)
function loadQuasar(sel, obj, signal) {
  const b = obj.basic;
  const qd = deriveQuasar({ z: b.z, mags: obj.mags });
  const rgb = qd ? observedRgb(qd.z.value) : null;
  body.dataset.kind = 'quasar';
  renderQuasarCard(card, sel, obj, qd, rgb, buildQuasarLinks(obj));
  const bd = qd?.massEdd ? deriveBlackHole({ massSun: qd.massEdd.value, distLy: qd.distLy }) : null;
  const params = bd
    ? { rsM: bd.rsKm.value * 1e3, tmax: bd.diskTmax.value, iscoPeriodS: bd.iscoPeriodS.value }
    : { rsM: 1.2e12, tmax: 6e4, iscoPeriodS: 2e5 };
  showScene(blackHoleScene, params, 1.1, rgb ? rgbCss(rgb) : '#cfe0ff', 0.12);
  cornerBtn.hidden = !mini;
  addWiki(wikipediaFor([obj.mainId, obj.mainId.replace(/\s+/g, ' ')], signal), (wiki) => buildQuasarLinks(obj, wiki));
}

async function loadCluster(sel, obj, signal) {
  const members = await fetchMembers(obj.basic.oid, signal).catch((e) => { if (signal.aborted) throw e; return []; });
  const b = obj.basic;
  const cd = deriveCluster({ kind: clusterKind(b.otype), majArcmin: b.dimMaj, distances: obj.distances, members, center: b });
  body.dataset.kind = members.length ? 'cluster' : 'other';
  renderClusterCard(card, sel, obj, cd, buildLinks(obj));
  if (members.length) {
    showScene(clusterScene, clusterVisualParams(cd, members, b, obj.mainId), 1.1, '#fff3dc', 0.3);
    cornerBtn.hidden = !mini;
  } else cornerBtn.hidden = true;
  addWiki(wikipediaFor([obj.mainId, obj.mainId.replace(/\s+/g, ' ')], signal), (wiki) => buildLinks(obj, wiki));
}

async function loadPulsar(sel, obj, signal) {
  const row = await fetchPulsar(obj, signal).catch((e) => { if (signal.aborted) throw e; return null; });
  const pd = row?.P0 > 0 ? derivePulsar(row) : null;
  // Veri yoksa sahne çizilmez; önceki cismin sahnesi 'other' gibi soluk kalır
  body.dataset.kind = pd ? 'pulsar' : 'other';
  renderPulsarCard(card, sel, obj, row, pd, buildPulsarLinks(obj, row));
  if (pd) {
    const vp = pulsarVisualParams(pd);
    // Bakış yüksekliği 90° − α: üst ışın her dönüşte kameranın üzerinden geçer (deniz feneri çakması)
    showScene(pulsarScene, vp, 1.25, '#cfe0ff', Math.PI / 2 - vp.alpha);
    cornerBtn.hidden = !mini;
    const btn = card.querySelector('[data-listen]');
    btn?.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      if (on) playPulses(pd.periodS.value, pd.w50Ms?.value); else stopPulses();
      btn.setAttribute('aria-pressed', String(on));
    });
  } else cornerBtn.hidden = true;
  addWiki(wikipediaFor([obj.mainId, obj.mainId.replace(/\s+/g, ' ')], signal), (wiki) => buildPulsarLinks(obj, row, wiki));
}

function loadGalaxy(sel, obj, signal) {
  const b = obj.basic;
  const gd = deriveGalaxy({ morph: b.morph, majArcmin: b.dimMaj, minArcmin: b.dimMin, cz: b.rv, z: b.z, mags: obj.mags, distances: obj.distances });
  body.dataset.kind = 'galaxy';
  renderGalaxyCard(card, sel, obj, gd, buildLinks(obj));
  const vp = galaxyVisualParams(gd, obj);
  // Bakış yüksekliği = 90° − eğiklik: kenardan görünen gökada arka planda da kenardan görünür
  const pitch = Math.min(1.45, Math.max(0.05, (90 - vp.inclination) * Math.PI / 180));
  showScene(galaxyScene, vp, 1.1, `rgb(${vp.old.map((c) => Math.round(255 * c ** (1 / 2.2))).join(',')})`, pitch);
  cornerBtn.hidden = !mini;
  addWiki(wikipediaFor([obj.mainId, obj.mainId.replace(/\s+/g, ' ')], signal), (wiki) => buildLinks(obj, wiki));
}

function loadNebula(sel, obj, signal) {
  const b = obj.basic;
  const nd = deriveNebula({ kind: nebulaKind(b.otype), majArcmin: b.dimMaj, minArcmin: b.dimMin, distances: obj.distances });
  body.dataset.kind = 'nebula';
  renderNebulaCard(card, sel, obj, nd, buildLinks(obj));
  const vp = nebulaVisualParams(nd, obj);
  showScene(nebulaScene, vp, 1, `rgb(${vp.ha.map((c) => Math.round(255 * c)).join(',')})`);
  cornerBtn.hidden = !mini;
  addWiki(wikipediaFor([obj.mainId, obj.mainId.replace(/\s+/g, ' ')], signal), (wiki) => buildLinks(obj, wiki));
}

// Güneş Sistemi gezegeni (obj null) ya da SIMBAD'daki ötegezegen
async function loadPlanet(sel, obj, signal) {
  const planet = await fetchPlanet(sel.mainId, obj, signal);
  if (sel.fromUrl && planet.solar) sel.label = planet.solar[lang];
  input.value = sel.label;
  const pd = derivePlanet(planet.props, planet.host && { teff: planet.host.teff, R: planet.host.R, L: planet.host.L });
  body.dataset.kind = 'planet';
  renderPlanetCard(card, sel, planet, pd, buildPlanetLinks(planet, obj));
  const vp = planetVisualParams(pd, planet.solar, planet.host?.teff);
  showScene(planetScene, vp, vp.ring ? vp.ring.outer * 1.05 : 1, `rgb(${vp.zone.map((c) => Math.round(255 * c ** (1 / 2.2))).join(',')})`);
  card.querySelector('.swatch--planet')?.style.setProperty('--planet', $('#fallback').style.getPropertyValue('--star'));
  card.querySelector('[data-host]')?.addEventListener('click', (e) => choose({ label: e.target.textContent, mainId: e.target.dataset.host, otype: null }));
  cornerBtn.hidden = !mini;
  addWiki(wikipediaForQid(planet.qid, signal), (wiki) => buildPlanetLinks(planet, obj, wiki));
}

// Güneş SIMBAD'da olmadığından Wikipedia adresi sabit
const sunWiki = (obj, wiki) => (obj.mainId === 'Sun' ? { tr: 'https://tr.wikipedia.org/wiki/G%C3%BCne%C5%9F', en: 'https://en.wikipedia.org/wiki/Sun' } : wiki);

function goHome() {
  loadCtrl?.abort();
  stopPulses();
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
