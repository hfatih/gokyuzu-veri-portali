// Sayfa çerçevesi: üst bar (dil, menü), alt bar (yasal bağlantılar), çerez / depolama onayı,
// yasal sayfalar (?page=…) ve ana sayfadaki "Bu gece gökyüzünde" listesi.

import { t, lang, num } from './i18n.js';
import { PAGES, pageBySlug, kvkkMailto, siteInfo } from '../legal/pages.js';
import { getConsent, setConsent, prefsAllowed } from '../consent.js';
import { tonightList } from '../explore/tonight.js';
import { getLocation, requestLocation, resetLocation } from '../sky/location.js';
import { jdFromDate, dateFromJd } from '../sky/ephem.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const withLang = (q) => (lang === 'en' ? `${q}${q.includes('?') ? '&' : '?'}lang=en` : q);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let api = null;   // { goHome, choose }

/** main.js açılışta bir kez çağırır. */
export function initChrome(opts) {
  api = opts;
  // Dil bağlantıları: adresin geri kalanı korunur
  const q = new URLSearchParams(location.search);
  q.delete('lang'); const tr = q.toString();
  q.set('lang', 'en'); const en = q.toString();
  $('#lang-tr').href = `?${tr}`; $('#lang-en').href = `?${en}`;
  (lang === 'en' ? $('#lang-en') : $('#lang-tr')).setAttribute('aria-current', 'true');

  // Menü: ana sayfa bölümlerine kaydırır
  document.querySelectorAll('[data-nav]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    if (document.body.dataset.state !== 'home') api.goHome({ focus: false });
    requestAnimationFrame(() => document.getElementById(a.dataset.nav)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }));
  }));
  document.querySelectorAll('a[data-page]').forEach((a) => { a.href = withLang(`?page=${a.dataset.page}`); });

  // Alt bar
  $('#ft-legal-links').innerHTML = PAGES.filter((p) => p.slug !== 'kaynaklar')
    .map((p) => `<li><a href="${withLang(`?page=${p.slug}`)}">${esc(p[lang])}</a></li>`).join('');
  $('#ft-copy').textContent = t('ft.copy', { y: new Date().getFullYear(), owner: siteInfo.owner ?? t('title') });

  initConsent();
  renderTonight();
}

// ---------- Çerez / depolama onayı ----------
function initConsent() {
  const banner = $('#consent'), dlg = $('#consent-dlg'), sw = $('#cs-prefs');
  banner.hidden = !!getConsent();
  const decide = (prefs) => { setConsent({ prefs }); banner.hidden = true; if (dlg.open) dlg.close(); };
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open-consent]');
    if (open) { sw.checked = prefsAllowed(); dlg.showModal(); return; }
    const b = e.target.closest('[data-consent]');
    if (!b) return;
    decide({ reject: false, accept: true, save: sw.checked }[b.dataset.consent]);
  });
  $('#consent-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

// ---------- Bu gece gökyüzünde ----------
const hm = new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

export function renderTonight() {
  const loc = getLocation();
  let items = [];
  try { items = tonightList(loc.lat, loc.lon, jdFromDate(new Date()), lang, 6); } catch (e) { console.warn('bu gece', e); }
  $('#tonight-list').innerHTML = items.length ? items.map((it) => `<li><button type="button" class="tn" data-tn="${esc(it.id)}">
      <span class="tn__name">${esc(it.label)}<span class="tn__kind">${t('tn.kind.' + it.kind)}</span></span>
      <span class="tn__when">${hm.format(dateFromJd(it.best.jd))} · ${num(Math.round(it.best.alt), 2)}° ${esc(it.dir)}</span></button></li>`).join('')
    : `<li class="muted">${t('tn.none')}</li>`;
  const place = loc.isDefault ? t('sky.locDefault', { name: loc.name }) : t('tn.mine');
  $('#tonight-loc').innerHTML = `${place} · <button type="button" class="linkbtn" data-tn-loc="${loc.isDefault ? 'mine' : 'reset'}">${t(loc.isDefault ? 'sky.useMine' : 'sky.useDefault')}</button>`;
  $('#tonight-list').querySelectorAll('[data-tn]').forEach((b) => b.addEventListener('click', () =>
    api.choose({ label: b.querySelector('.tn__name').firstChild.textContent.trim(), mainId: b.dataset.tn, otype: null })));
  $('#tonight-loc [data-tn-loc]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (btn.dataset.tnLoc === 'reset') { resetLocation(); renderTonight(); return; }
    btn.disabled = true; btn.textContent = t('sky.locating');
    try { await requestLocation(); renderTonight(); } catch { btn.disabled = false; btn.textContent = t('sky.locFail'); }
  });
}

// ---------- Yasal sayfalar ----------
/** ?page=slug: yasal sayfayı gösterir. Bilinmeyen slug için false döner. */
export function showPage(slug) {
  const p = pageBySlug(slug);
  if (!p) return false;
  document.body.dataset.state = 'page';
  $('#page').hidden = false;
  $('#page-links').innerHTML = PAGES.map((x) => `<li><a href="${withLang(`?page=${x.slug}`)}"${x.slug === slug ? ' aria-current="page"' : ''}>${esc(x[lang])}</a></li>`).join('');
  const updated = new Date(siteInfo.updated).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  $('#page-body').innerHTML = `
    ${siteInfo.draft ? `<p class="page__draft">${t('pg.draft')}</p>` : ''}
    <p class="page__meta">${t('pg.updated', { d: updated })}</p>
    <h1 class="page__title">${esc(p.tr)}</h1>
    ${lang === 'en' ? `<p class="page__note">${t('pg.trOnly')}</p>` : ''}
    <div class="prose">${p.body()}</div>`;
  document.title = `${p[lang]} · ${t('title')}`;
  $('#page-body [data-kvkk-form]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    location.href = kvkkMailto(Object.fromEntries(new FormData(e.target)));
  });
  return true;
}

export function hidePage() { $('#page').hidden = true; }
