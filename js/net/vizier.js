// VizieR ASU (TSV) istemcisi. TAPVizieR https'te CORS başlığını iki kez gönderdiği için tarayıcı
// reddediyor; ASU tek başlıkla yanıt veriyor.

import { get } from './http.js';

// Ana sunucu CDS; Harvard aynası aynı katalogları aynı ASU arayüzüyle ve CORS başlığıyla sunar. CDS bazı
// dönemlerde 404 ya da zaman aşımı veriyor (2026-11-05'ten beri), o zaman aynaya geçilir (simbad.js ile aynı yol).
export const ASUS = ['https://vizier.cds.unistra.fr/viz-bin/asu-tsv', 'https://vizier.cfa.harvard.edu/viz-bin/asu-tsv'];
const TIMEOUT_MS = 8000;
let active = 0;   // bu oturumda son yanıt veren sunucu

/** ASU sorgusu (parametre nesnesi ya da URLSearchParams) → TSV metni. Sunucu düşerse sıradakini dener. */
export async function asu(params, signal, timeoutMs = TIMEOUT_MS) {
  const q = `?${new URLSearchParams(params)}`;
  const start = active;
  for (let k = 0; k < ASUS.length; k++) {
    const i = (start + k) % ASUS.length;
    try {
      const text = await get(ASUS[i] + q, { signal, as: 'text', name: 'VizieR', timeoutMs });
      active = i;
      return text;
    } catch (e) {
      if (e.name === 'AbortError' || k === ASUS.length - 1) throw e;
    }
  }
}

/**
 * ASU TSV çıktısını tablolarına ayırır. Her tablo: # yorumlar, başlık, birim satırı, çizgi satırı,
 * veri; tablolar boş satırla ayrılır. Dönüş: [{ rows: [{sütun: değer}], units: {sütun: birim} }].
 * Sayılar Number, boşlar null.
 */
export function parseAsu(text) {
  const tables = [];
  for (const block of text.split(/\r?\n\s*\r?\n/)) {
    const lines = block.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
    if (lines.length < 3 || !/^-+/.test(lines[2].trim())) continue;
    const head = lines[0].split('\t').map((h) => h.trim());
    const unitCells = lines[1].split('\t').map((u) => u.trim());
    const units = Object.fromEntries(head.map((h, i) => [h, unitCells[i] ?? '']));
    const rows = lines.slice(3).map((l) => Object.fromEntries(l.split('\t').map((v, i) => {
      const s = v.trim();
      return [head[i], s === '' ? null : /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s) ? Number(s) : s];
    })));
    tables.push({ rows, units });
  }
  return tables;
}

/** Koni araması: source katalog/tablo, ra/dec derece, radius yay saniyesi. */
export async function cone(source, ra, dec, radiusArcsec, signal, extra = {}) {
  const q = new URLSearchParams({ '-source': source, '-out.all': '1', '-c': `${ra} ${dec}`, '-c.rs': String(radiusArcsec),
    '-sort': '_r', '-out.max': '20', ...extra });
  return parseAsu(await asu(q, signal));
}

/** Satırda adlardan ilk dolu sütun: [değer, sütun adı]. */
export function pick(row, names) {
  for (const n of names) if (row[n] != null) return [row[n], n];
  return [null, null];
}
