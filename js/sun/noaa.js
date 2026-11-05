// Güneş'teki güncel aktif bölgeler: NOAA Uzay Havası Tahmin Merkezi (SWPC), günlük bölge raporu.
// Her bölgenin enlemi, merkez meridyene uzaklığı (CMD) ve leke alanı (MSH). Gelmezse Güneş modeli
// istatistiksel lekelerle çalışır. ABD hükümeti verisi, kamu malı.

import { get } from '../net/http.js';

const URL = 'https://services.swpc.noaa.gov/json/solar_regions.json';

/** "N12W34" → { lat: 12, cmd: 34 } (batı +, doğu −). Ayrıştırılamazsa null. */
export function parseLocation(s) {
  const m = /^\s*([NS])(\d{1,2})\s*([EW])(\d{1,3})\s*$/i.exec(String(s ?? ''));
  if (!m) return null;
  return { lat: (m[1].toUpperCase() === 'N' ? 1 : -1) * Number(m[2]), cmd: (m[3].toUpperCase() === 'W' ? 1 : -1) * Number(m[4]) };
}

/**
 * SWPC satırları → en son gözlem gününün lekeli bölgeleri [{ id, lat, cmd, area, date }].
 * Alan adları sürümler arasında değişebildiği için birkaç ad denenir.
 */
export function parseRegions(rows) {
  if (!Array.isArray(rows)) return [];
  const pick = (r, ks) => { for (const k of ks) if (r[k] != null && r[k] !== '') return r[k]; return null; };
  const parsed = rows.map((r) => {
    const loc = parseLocation(pick(r, ['location', 'Location', 'loc']));
    const lat = loc?.lat ?? Number(pick(r, ['latitude', 'lat']));
    const cmd = loc?.cmd ?? Number(pick(r, ['central_meridian_distance', 'cmd']));
    return { id: String(pick(r, ['region', 'Region', 'region_number']) ?? ''), lat, cmd,
      area: Number(pick(r, ['area', 'Area', 'spot_area'])), date: String(pick(r, ['observed_date', 'date', 'Obsdate']) ?? '') };
  }).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.cmd) && Math.abs(r.cmd) <= 90 && r.area > 0);
  if (!parsed.length) return [];
  const last = parsed.map((r) => r.date).sort().pop();
  return parsed.filter((r) => r.date === last);
}

/** Güncel bölgeler; hata ya da veri yoksa []. */
export async function fetchRegions(signal) {
  try { return parseRegions(await get(URL, { signal, timeoutMs: 6000, name: 'NOAA' })); } catch { return []; }
}
