// node dev/smoke.mjs — tarayıcı duman testi (Playwright + Chromium).
// Sayfa gerçek servislere gitmez: dış istekler aşağıdaki küçük sabit yanıtlarla karşılanır. Amaç verinin
// doğruluğu değil, akışın (arama → kart → sahne → 3D, hata → tekrar dene) bozulmadığını görmek.
// Sirius sabitleri check-derive.mjs'teki yayımlanmış değerlerdir (SIMBAD: ϖ 379,21 mas, V −1,46).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8000 + Math.floor(Math.random() * 900);
const BASE = `http://127.0.0.1:${PORT}/`;

// ---------- Sabit yanıtlar ----------
const table = (cols, rows) => JSON.stringify({ metadata: cols.map((name) => ({ name })), data: rows });
const BASIC = ['oid', 'main_id', 'ra', 'dec', 'plx_value', 'plx_err', 'sp_type', 'otype', 'rvz_radvel', 'nbref',
  'galdim_majaxis', 'galdim_minaxis', 'galdim_angle', 'morph_type', 'rvz_redshift'];
let failSimbad = false;
function tapReply(q) {
  if (failSimbad) return null;
  // δ Cephei (SIMBAD: ϖ 3,77 mas, F5Iab, V 3,75)
  if (/FROM basic WHERE main_id = '\* del Cep'/.test(q)) return table(BASIC, [[2, '* del Cep', 337.2928, 58.4152, 3.77, 0.16, 'F5Iab:', 'cC*', -16.8, 1500, null, null, null, null, null]]);
  if (/FROM mesFe_H WHERE oidref = 2\b/.test(q)) return table(['teff', 'log_g', 'fe_h', 'bibcode'], [[5900, 1.5, 0.1, '2000fixt.....2F']]);
  if (/FROM flux WHERE oidref = 2\b/.test(q)) return table(['filter', 'flux'], [['V', 3.75], ['B', 4.4]]);
  if (/FROM ident WHERE oidref = 2\b/.test(q)) return table(['id'], [['* del Cep'], ['V* del Cep'], ['HD 213306']]);
  if (/FROM basic WHERE main_id = '\* alf CMa'/.test(q)) return table(BASIC, [[1, '* alf CMa', 101.2872, -16.7161, 379.21, 1.58, 'A0mA1Va', 'SB*', -5.5, 3000, null, null, null, null, null]]);
  if (/FROM mesFe_H WHERE oidref = 1\b/.test(q)) return table(['teff', 'log_g', 'fe_h', 'bibcode'], [[9900, 4.3, 0.4, '2000fixt.....1F']]);
  if (/FROM flux WHERE oidref = 1\b/.test(q)) return table(['filter', 'flux'], [['V', -1.46], ['B', -1.46]]);
  if (/FROM ident WHERE oidref = 1\b/.test(q)) return table(['id'], [['* alf CMa'], ['NAME Sirius'], ['HD 48915'], ['WDS J06451-1643AB']]);
  return table([], []);
}

// ORB6: Sirius AB elemanları (check-binary.mjs ile aynı)
function vizierReply(source) {
  // VSX: δ Cephei (AAVSO VSX değerleri)
  if (/vsx/.test(source)) return ['#Table B/vsx/vsx', 'Name\tType\tmax\tn_max\tf_min\tmin\tPeriod\tEpoch',
    '\t\tmag\t\t\tmag\td\td', '-\t-\t-\t-\t-\t-\t-\t-', 'del Cep\tDCEP\t3.48\tV\t\t4.37\t5.366266\t2436075.445', ''].join('\n');
  if (!/orb6/.test(source)) return '';
  return ['#Table B/orb6/orb6orb', 'WDS\tHD\tP\tu_P\ta\tu_a\ti\tNode\tT\tu_T\te\tomega\tGrade',
    '\t\t\t\tarcsec\t\tdeg\tdeg\t\t\t\tdeg\t', '-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-',
    '06451-1643\t48915\t50.128\ty\t7.4957\ta\t136.336\t45.400\t1994.5715\ty\t0.59142\t149.161\t1', ''].join('\n');
}

const server = spawn('python3', [join(root, 'dev/serve.py'), String(PORT)], { stdio: 'ignore' });
const errors = [];
let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  const hosts = new Set();
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => {
    const url = new URL(route.request().url());
    hosts.add(url.host);
    if (url.host === 'simbad.cds.unistra.fr') {
      const body = tapReply(url.searchParams.get('QUERY') ?? '');
      return body ? route.fulfill({ contentType: 'application/json', body }) : route.fulfill({ status: 503, body: '' });
    }
    if (url.host === 'query.wikidata.org') return route.fulfill({ contentType: 'application/json', body: '{"results":{"bindings":[]}}' });
    if (url.host === 'api.ssodnet.imcce.fr') return route.fulfill({ contentType: 'application/json', body: '{"data":[]}' });
    if (url.host === 'vizier.cds.unistra.fr') return route.fulfill({ contentType: 'text/plain', body: vizierReply(url.searchParams.get('-source') ?? '') });
    return route.fulfill({ status: 404, body: '' });   // yazı tipleri, gözlem görüntüleri
  });

  // 1. Ana sayfa: Güneş çiziliyor
  await page.goto(BASE);
  await page.waitForTimeout(800);
  assert.equal(await page.getAttribute('body', 'data-state'), 'home');
  assert.ok(await litFraction(page) > 0.01, 'ana sayfada Güneş çizilmedi');
  step('ana sayfa ve Güneş sahnesi');
  // Yazı tipleri kendi sunucumuzdan: Jost yüklü, Google'a istek yok
  assert.ok(await page.evaluate(async () => { await document.fonts.ready; const ok = (fam) => [...document.fonts].some((f) => f.family.replace(/"/g, '') === fam && f.status === 'loaded');
    return ok('Jost') && ok('IBM Plex Mono'); }), 'yerel yazı tipleri yüklenmedi');
  step('yerel yazı tipleri');
  assert.ok((await page.$$('#chips .chip')).length >= 10, 'keşfet listesi');
  assert.equal((await page.$$('#tours-list .tour-btn')).length, 3);
  assert.ok((await page.$$('#tonight-list .tn')).length > 0, 'bu gece listesi boş');
  await snap(page, 'home', false);
  step('ana sayfa: keşfet, bu gece ve turlar');

  // Çerez / depolama onayı: ilk ziyarette bildirim; reddet → kalıcı depoda tercih yok
  assert.equal(await page.isVisible('#consent'), true, 'çerez bildirimi görünmüyor');
  await page.click('#consent [data-consent="reject"]');
  assert.equal(await page.isVisible('#consent'), false);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('gvp.consent')).prefs), false);
  // Alt bardan tercih paneli: tercihleri aç ve kaydet
  await page.click('.site-foot [data-open-consent]');
  await page.check('#cs-prefs');
  await page.click('#consent-dlg [data-consent="save"]');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('gvp.consent')).prefs), true);
  await page.reload();
  assert.equal(await page.isVisible('#consent'), false, 'seçim hatırlanmadı');
  step('çerez onayı ve tercih paneli');

  // Yasal sayfalar: alt bardan KVKK, yan menüden Çerez Politikası
  await page.click('.site-foot a[href*="page=kvkk"]');
  await page.waitForSelector('.page__title');
  assert.match(await page.textContent('.page__title'), /Aydınlatma/);
  assert.match(await page.textContent('.prose'), /KVKK m\. 11/);
  assert.ok(await page.$('.ph'), 'doldurulmamış künye alanları işaretli olmalı');
  await snap(page, 'legal');
  await page.click('#page-links a[href*="page=cerez"]');
  await page.waitForFunction(() => document.querySelector('.page__title')?.textContent.includes('Çerez'));
  assert.equal(await page.getAttribute('body', 'data-state'), 'page');
  step('yasal sayfalar');
  await page.goto(BASE);

  // 2. Arama: yerel ad → gezegen kartı
  await page.fill('#q', 'Mars');
  await page.waitForSelector('#suggest .opt');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.card__title');
  assert.equal(await page.textContent('.card__title'), 'Mars');
  assert.equal(await page.getAttribute('body', 'data-kind'), 'planet');
  step('arama ve gezegen kartı');
  assert.match(await page.textContent('[data-sky]'), /çıplak göz/);
  step('gökyüzünde bölümü (Mars)');
  await snap(page, 'mars');

  // 3. Adresten yıldız: SIMBAD sabitiyle Sirius
  await page.goto(`${BASE}?star=${encodeURIComponent('* alf CMa')}`);
  await page.waitForSelector('.card .props');
  assert.equal(await page.textContent('.card__title'), 'Sirius');
  assert.match(await page.textContent('.card'), /Yarıçap/);
  assert.ok(await litFraction(page) > 0.02, 'yıldız sahnesi çizilmedi');
  assert.match(await page.title(), /Sirius/);
  step('adresten yıldız kartı ve sahnesi');
  assert.match(await page.textContent('[data-sky]'), /Doğuş|hiç/);
  assert.ok(await page.$('.skyc__path'), 'yükseklik eğrisi yok');
  step('gökyüzünde bölümü (Sirius)');
  await snap(page, 'sirius');

  // Çift yıldız yörüngesi (ORB6 sabiti) ve 3D yörünge sahnesi
  await page.waitForSelector('[data-binary]');
  assert.match(await page.textContent('[data-binary]'), /M☉/);
  await page.click('[data-binary-scene]');
  assert.equal(await page.getAttribute('body', 'data-kind'), 'binary');
  await page.waitForTimeout(400);
  assert.ok(await litFraction(page) > 0.001, 'çift yıldız sahnesi çizilmedi');
  await snap(page, 'binary', false);
  await page.click('[data-binary-scene]');
  assert.equal(await page.getAttribute('body', 'data-kind'), 'star');
  step('çift yıldız yörüngesi');

  // Değişen yıldız: δ Cephei (VSX sabiti), ışık eğrisi ve P–L uzaklığı
  await page.goto(`${BASE}?star=${encodeURIComponent('* del Cep')}`);
  await page.waitForSelector('[data-variable]');
  assert.match(await page.textContent('[data-variable]'), /Klasik Sefeid/);
  assert.match(await page.textContent('[data-variable]'), /pc/);
  assert.ok(await page.$('.lc__path'), 'ışık eğrisi yok');
  await snap(page, 'variable');
  step('değişen yıldız');

  // 4. 3D görünüm açılıp kapanıyor
  await page.click('#corner');
  assert.equal(await page.getAttribute('body', 'data-state'), '3d');
  await page.keyboard.press('Escape');
  assert.equal(await page.getAttribute('body', 'data-state'), 'object');
  step('3D görünüm');

  // 5. SIMBAD yanıt vermeyince "tekrar dene", düzelince kart
  failSimbad = true;
  await page.goto(`${BASE}?star=${encodeURIComponent('* alf CMa')}`);
  await page.waitForSelector('[data-retry]');
  failSimbad = false;
  await page.click('[data-retry]');
  await page.waitForSelector('.card .props');
  step('hata ve tekrar dene');

  // 6. Karşılaştırma: Sirius + Güneş başvurusu
  await page.click('[data-cmp-add]');
  assert.equal(await page.getAttribute('[data-cmp-add]', 'aria-pressed'), 'true');
  await page.click('#cmp-open');
  await page.click('[data-cmp-ref="sun"]');
  assert.equal((await page.$$('.cmp__table tbody tr')).length, 2);
  await snap(page, 'compare');
  await page.click('#cmp-close');
  step('ölçek karşılaştırması');

  // 7. Rehberli tur: Güneş Sistemi turu, Güneş → Merkür (yerel kimlikler)
  await page.goto(`${BASE}?tour=solar&step=1`);
  await page.waitForSelector('.tourbar');
  assert.match(await page.textContent('.tourbar'), /1\/13/);
  await page.click('[data-tour-nav="1"]');
  await page.waitForFunction(() => document.querySelector('.card__title')?.textContent === 'Merkür');
  assert.match(await page.textContent('.tourbar'), /2\/13/);
  assert.match(page.url(), /tour=solar&step=2/);
  await snap(page, 'tour');
  step('rehberli tur');

  // 8. Güneş kartındaki gezegen bağlantısı
  await page.goto(`${BASE}?star=Sun`);
  await page.waitForSelector('[data-goto]');
  await page.click('[data-goto="planet:Q2"]');
  await page.waitForFunction(() => document.querySelector('.card__title')?.textContent === 'Dünya');
  step('kart içi bağlantılar');

  // Uydu: Ay (Wikidata sabiti boş; kart, sahne ve evre yine çizilir), Jüpiter'den İo'ya
  await page.goto(`${BASE}?star=moon:Q405`);
  await page.waitForSelector('.card__title');
  assert.equal(await page.textContent('.card__title'), 'Ay');
  assert.match(await page.textContent('[data-sky]'), /aydınlık/);
  assert.ok(await litFraction(page) > 0.02, 'uydu sahnesi çizilmedi');
  await snap(page, 'moon');
  await page.goto(`${BASE}?star=planet:Q319`);
  await page.click('[data-goto="moon:Q3123"]');
  await page.waitForFunction(() => document.querySelector('.card__title')?.textContent === 'İo');
  step('uydular');

  // 9. Dar ekran: yatay taşma yok (ana sayfa ve kart)
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of [BASE, `${BASE}?star=${encodeURIComponent('* alf CMa')}`]) {
    await page.goto(url);
    await page.waitForTimeout(600);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(over <= 0, `dar ekranda ${over}px yatay taşma (${url})`);
  }
  await snap(page, 'mobile');
  await page.setViewportSize({ width: 1280, height: 800 });
  step('dar ekran');

  // 10. İngilizce arayüz
  await page.goto(`${BASE}?lang=en`);
  assert.equal(await page.getAttribute('html', 'lang'), 'en');
  assert.match(await page.textContent('.hero__tagline'), /[A-Za-z]/);
  step('İngilizce arayüz');

  assert.deepEqual([...hosts].filter((h) => /google|gstatic/.test(h)), [], 'Google sunucularına istek gitti');
  assert.deepEqual(errors, [], 'konsol hataları');
  console.log('smoke: tüm adımlar geçti');
} catch (e) {
  console.error(errors.join('\n'));
  throw e;
} finally {
  await browser?.close();
  server.kill();
}

function step(name) { console.log(`✓ ${name}`); }

// SHOTS=klasör verilirse adım ekran görüntüleri (tam sayfa) kaydedilir
async function snap(page, name, fullPage = true) {
  if (process.env.SHOTS) await page.screenshot({ path: join(process.env.SHOTS, `${name}.png`), fullPage });
}

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(BASE)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('sunucu açılmadı');
}

/** Ekran görüntüsünde belirgin parlak piksellerin oranı (WebGL tamponu okunamadığı için görüntüden). */
async function litFraction(page) {
  const png = (await page.screenshot()).toString('base64');
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = new OffscreenCanvas(img.width, img.height), g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    let lit = 0;
    for (let i = 0; i < d.length; i += 16) if (d[i] + d[i + 1] + d[i + 2] > 240) lit++;
    return lit / (d.length / 16);
  }, png);
}
