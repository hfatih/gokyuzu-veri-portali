// Ölçek karşılaştırması: kartlardan eklenen cisimler (en çok 6) aynı ölçekte yan yana çizilir.
// Liste yalnız bu tarayıcıda tutulur (tercih onayı varsa kalıcı, yoksa sekme açıkken; consent.js). Doğrusal ölçekte en büyük cisim alanı doldurur;
// fark çok büyükse logaritmik ölçek önerilir.

import { t, num, lang } from './i18n.js';
import { lengthParts, REFERENCE } from '../explore/size.js';
import { prefStore } from '../consent.js';

const KEY = 'gvp.compare', MAX = 6;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let items = load();
const listeners = new Set();

function load() {
  try { const v = JSON.parse(prefStore.get(KEY)); return Array.isArray(v) ? v.filter((x) => x?.m > 0).slice(0, MAX) : []; }
  catch { return []; }
}
function save() {
  prefStore.set(KEY, JSON.stringify(items));
  listeners.forEach((f) => f(items));
}

export const compareItems = () => items;
export const onCompareChange = (f) => listeners.add(f);
export const inCompare = (mainId) => items.some((x) => x.mainId === mainId);

/** item: { label, mainId, kind, m (yarıçap, metre), color, origin, note } */
export function toggleCompare(item) {
  if (inCompare(item.mainId)) items = items.filter((x) => x.mainId !== item.mainId);
  else items = [...items, item].slice(-MAX);
  save();
}
export function removeCompare(mainId) { items = items.filter((x) => x.mainId !== mainId); save(); }
export function clearCompare() { items = []; save(); }

export const fmtLength = (m) => { const { v, u } = lengthParts(m); return `${num(v)} ${u === 'ly' ? t('unit.ly') : u}`; };

/** Karşılaştırma görünümü (dialog içeriği). */
export function compareHtml(log = false) {
  if (!items.length) return `<p class="note">${t('cmp.empty')}</p>${refButtons()}`;
  const sorted = [...items].sort((a, b) => b.m - a.m);
  const big = sorted[0].m, small = sorted[sorted.length - 1].m;
  const W = 640, H = 220, gap = 16, base = 200;
  // Doğrusal: en büyük daire yüksekliği doldurur. Log: yarıçapın logaritması.
  const lmin = Math.log10(small) - 0.3, lmax = Math.log10(big);
  const r = (m) => (log ? 12 + (Math.log10(m) - lmin) / Math.max(0.3, lmax - lmin) * 88 : 100 * m / big);
  const radii = sorted.map((x) => r(x.m));
  // Daireler soldan sağa, büyükten küçüğe; tüm satır genişliğe sığacak biçimde ölçeklenir
  const total = radii.reduce((s, x) => s + 2 * Math.max(x, 2.5) + gap, 0);
  const k = Math.min(1, (W - 20) / total);
  let cx = 10;
  const circles = sorted.map((x, i) => {
    const rr = Math.max(radii[i] * k, 0);
    const shown = Math.max(rr, 2.5);
    cx += shown;
    const svg = `<g><circle cx="${cx.toFixed(1)}" cy="${(base - shown).toFixed(1)}" r="${shown.toFixed(2)}" fill="${esc(x.color || '#ccc')}"${rr < 2.5 ? ' class="cmp__dot"' : ''}/>
      <text x="${cx.toFixed(1)}" y="${base + 14}" text-anchor="middle" class="cmp__label">${esc(x.label)}</text></g>`;
    cx += shown + gap;
    return svg;
  }).join('');
  const ratio = big / small;
  const rows = sorted.map((x) => `<tr><td>${esc(x.label)}</td><td>${fmtLength(x.m)}${x.note ? ` <span class="muted">(${t(x.note)})</span>` : ''}</td>
    <td>${x === sorted[0] ? '—' : `1 / ${num(big / x.m)}`}</td>
    <td><button type="button" class="linkbtn" data-cmp-remove="${esc(x.mainId)}">${t('cmp.remove')}</button></td></tr>`).join('');
  return `<p class="cmp__scale">${t(log ? 'cmp.logNote' : 'cmp.linNote')}${!log && ratio > 300 ? ` ${t('cmp.tooBig', { r: num(ratio) })}` : ''}</p>
    <svg class="cmp__svg" viewBox="0 0 ${W} ${H + 20}" role="img" aria-label="${t('cmp.aria')}">${circles}
      <line x1="0" y1="${base}" x2="${W}" y2="${base}" class="cmp__ground"/></svg>
    <table class="cmp__table"><thead><tr><th>${t('cmp.col.name')}</th><th>${t('cmp.col.r')}</th><th>${t('cmp.col.ratio')}</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    ${refButtons()}`;
}

function refButtons() {
  const refs = Object.entries(REFERENCE).filter(([, r]) => !inCompare(r.mainId));
  if (!refs.length) return '';
  return `<p class="cmp__refs">${t('cmp.addRef')} ${refs.map(([k, r]) => `<button type="button" class="chip chip--small" data-cmp-ref="${k}">${esc(r.label[lang])}</button>`).join(' ')}</p>`;
}

/** Dialog içindeki düğmeleri bağlar; değişince yeniden çizer. */
export function bindCompare(root, rerender) {
  root.querySelectorAll('[data-cmp-remove]').forEach((b) => b.addEventListener('click', () => { removeCompare(b.dataset.cmpRemove); rerender(); }));
  root.querySelectorAll('[data-cmp-ref]').forEach((b) => b.addEventListener('click', () => {
    const r = REFERENCE[b.dataset.cmpRef];
    toggleCompare({ label: r.label[lang], mainId: r.mainId, kind: r.kind, m: r.m, color: r.color, origin: 'measured' });
    rerender();
  }));
}
