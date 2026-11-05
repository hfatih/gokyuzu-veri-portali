// node dev/check-explore.mjs — ölçek karşılaştırması ve tur/öne çıkan listelerinin yapısı
import assert from 'node:assert/strict';
import { radiusOf, lengthParts } from '../js/explore/size.js';
import { FEATURED, todaysPick, dayOfYear } from '../js/explore/featured.js';
import { TOURS } from '../js/explore/tours.js';

// Yarıçaplar metreye
assert.equal(radiusOf('star', { derived: { R: { value: 1, origin: 'derived' } } }).m, 6.957e8);
assert.equal(radiusOf('planet', { derived: { radius: { value: 1, origin: 'measured' } } }).m, 6.371e6);
assert.equal(radiusOf('bh', { derived: { rsKm: { value: 12, origin: 'derived' } } }).note, 'cmp.horizon');
assert.equal(radiusOf('galaxy', { derived: { diameterKpc: { value: 2, origin: 'derived' } } }).m, 3.0857e19);
assert.equal(radiusOf('star', { derived: null }), null);
assert.equal(radiusOf('other', {}), null);

// Birim seçimi
assert.equal(lengthParts(6.371e6).u, 'km');
assert.equal(lengthParts(6.957e8 * 700).u, 'R☉');
assert.equal(lengthParts(1.496e11 * 50).u, 'AU');
assert.equal(lengthParts(9.4607e15 * 10).u, 'ly');

// Bugünün cismi: 1 Ocak 1. gün, yıl içinde döner
assert.equal(dayOfYear(new Date(2026, 0, 1)), 1);
assert.equal(todaysPick(new Date(2026, 0, 1)), FEATURED[1]);

// Her kayıt ve tur adımı iki dilde, çözülebilir bir başvuruyla
const refOk = (r) => !!(r.id || r.simbad || r.bh);
for (const f of FEATURED) { assert.ok(f.tr && f.en && refOk(f.ref), JSON.stringify(f)); }
for (const tour of TOURS) {
  assert.ok(tour.tr && tour.en && tour.steps.length >= 5, tour.id);
  for (const s of tour.steps) assert.ok(s.tr && s.en && s.label.tr && s.label.en && refOk(s.ref), `${tour.id}: ${s.label.tr}`);
}
assert.equal(new Set(TOURS.map((x) => x.id)).size, TOURS.length);
console.log('explore: tüm kontroller geçti');
