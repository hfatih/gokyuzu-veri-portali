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
  if (/FROM basic WHERE main_id = '\* alf CMa'/.test(q)) return table(BASIC, [[1, '* alf CMa', 101.2872, -16.7161, 379.21, 1.58, 'A0mA1Va', 'SB*', -5.5, 3000, null, null, null, null, null]]);
  if (/FROM mesFe_H WHERE oidref = 1\b/.test(q)) return table(['teff', 'log_g', 'fe_h', 'bibcode'], [[9900, 4.3, 0.4, '2000fixt.....1F']]);
  if (/FROM flux WHERE oidref = 1\b/.test(q)) return table(['filter', 'flux'], [['V', -1.46], ['B', -1.46]]);
  if (/FROM ident WHERE oidref = 1\b/.test(q)) return table(['id'], [['* alf CMa'], ['NAME Sirius'], ['HD 48915']]);
  return table([], []);
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
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => {
    const url = new URL(route.request().url());
    if (url.host === 'simbad.cds.unistra.fr') {
      const body = tapReply(url.searchParams.get('QUERY') ?? '');
      return body ? route.fulfill({ contentType: 'application/json', body }) : route.fulfill({ status: 503, body: '' });
    }
    if (url.host === 'query.wikidata.org') return route.fulfill({ contentType: 'application/json', body: '{"results":{"bindings":[]}}' });
    if (url.host === 'api.ssodnet.imcce.fr') return route.fulfill({ contentType: 'application/json', body: '{"data":[]}' });
    if (url.host === 'vizier.cds.unistra.fr') return route.fulfill({ contentType: 'text/plain', body: '' });
    return route.fulfill({ status: 404, body: '' });   // yazı tipleri, gözlem görüntüleri
  });

  // 1. Ana sayfa: Güneş çiziliyor
  await page.goto(BASE);
  await page.waitForTimeout(800);
  assert.equal(await page.getAttribute('body', 'data-state'), 'home');
  assert.ok(await litFraction(page) > 0.01, 'ana sayfada Güneş çizilmedi');
  step('ana sayfa ve Güneş sahnesi');
  assert.ok((await page.$$('#chips .chip')).length >= 10, 'keşfet listesi');
  assert.equal((await page.$$('#tours .tour-btn')).length, 3);
  await snap(page, 'home');
  step('ana sayfa: keşfet ve turlar');

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
async function snap(page, name) {
  if (process.env.SHOTS) await page.screenshot({ path: join(process.env.SHOTS, `${name}.png`), fullPage: true });
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
