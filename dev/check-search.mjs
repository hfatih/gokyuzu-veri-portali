// node dev/check-search.mjs — SIMBAD desen üretimi ve Türkçe ad eşlemesi
import assert from 'node:assert/strict';
import { likeVariants, sqlStr } from '../js/search/variants.js';
import { matchAliases } from '../js/search/aliases-tr.js';

assert.deepEqual(likeVariants('betel'), { like: ['NAME Betel'], exact: [] });
assert.deepEqual(likeVariants('alpha ori').like, ['* alf Ori', 'NAME Alpha Ori']);
assert.ok(likeVariants('alf cma').like.includes('* alf CMa'));
assert.deepEqual(likeVariants('m31'), { like: ['M  31', 'M 31'], exact: ['m31'] });
assert.ok(likeVariants('HD 39801').like.includes('HD  39801'));
assert.ok(likeVariants('ngc 2168').like.includes('NGC  2168'));
assert.ok(likeVariants('gaia dr3 123').like.includes('Gaia DR3 123'));
assert.deepEqual(likeVariants('a'), { like: [], exact: [] });
assert.ok(likeVariants('trappist-1 e').like.includes('TRAPPIST-1 e'));
assert.ok(likeVariants('kepler-452').like.includes('Kepler-452'));
assert.equal(sqlStr("o'neil 5%"), "o''neil 5");
// Tehlikeli kısa ham önek ("M 3%" 100 sn sürdü) üretilmez
assert.ok(!likeVariants('m 3').like.includes('m 3'));

assert.equal(matchAliases('akyıl')[0].simbadId, '* alf CMa');
assert.equal(matchAliases('akyil')[0].simbadId, '* alf CMa');
assert.equal(matchAliases('ulker')[0].simbadId, 'NAME Pleiades');
assert.equal(matchAliases('kazık').length, 1);
assert.equal(matchAliases('demir')[0].label, 'Demirkazık');
assert.equal(matchAliases('x').length, 0);
assert.equal(matchAliases('jüp')[0].simbadId, 'planet:Q319');
assert.equal(matchAliases('satur')[0].simbadId, 'planet:Q193');

console.log('search: tüm kontroller geçti');
