// node dev/check-legal.mjs — yasal sayfalar: hepsi çizilir, boş alanlar işaretlidir, doldurulunca işaret kalkar
import assert from 'node:assert/strict';
import { PAGES, pageBySlug, kvkkMailto, siteInfo } from '../js/legal/pages.js';

const slugs = PAGES.map((p) => p.slug);
assert.equal(new Set(slugs).size, slugs.length);
for (const p of PAGES) {
  const html = p.body();
  assert.ok(p.tr && p.en && html.length > 300, p.slug);
  assert.ok(!/undefined|null|\[object/.test(html), `${p.slug}: boş değer sızmış`);
}
// KVKK m. 10 başlıkları ve m. 11'in dokuz hakkı
const kvkk = pageBySlug('kvkk').body();
for (const h of ['Veri sorumlusu', 'İşlenen kişisel veriler', 'hukuki sebepler', 'Aktarım', 'saklama süresi', 'Başvuru']) assert.ok(kvkk.includes(h), h);
assert.equal((kvkk.match(/<li>/g) ?? []).length >= 9 + 4, true);
assert.ok(kvkk.includes('class="ph"'), 'doldurulmamış alan işaretli');

// Künye doldurulunca yer tutucular kalkar
Object.assign(siteInfo, { owner: 'Örnek Yayıncılık', address: 'Adres', email: 'kvkk@example.org', host: 'Örnek Hosting', logRetention: '2 yıl', mailRetention: '3 yıl', court: 'Ankara' });
for (const p of PAGES) assert.ok(!p.body().includes('class="ph"'), `${p.slug}: yer tutucu kaldı`);
const m = kvkkMailto({ name: 'Ada', id: '1', address: 'A', email: 'a@b.c', right: 'Bilgi talep etme', detail: 'x' });
assert.ok(m.startsWith('mailto:kvkk%40example.org?subject='), m);
assert.ok(decodeURIComponent(m).includes('Talep: Bilgi talep etme'));
assert.equal(pageBySlug('yok'), null);
console.log('legal: tüm kontroller geçti');
