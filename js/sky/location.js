// Gözlem yeri: varsayılan Ankara; kullanıcı isterse tarayıcı konumu. Seçim yalnız bu tarayıcıda
// hatırlanır, sunucuya gönderilmez: tercih onayı varsa localStorage, yoksa yalnız sekme açıkken (consent.js).

import { prefStore } from '../consent.js';

const KEY = 'gvp.location';
export const DEFAULT_LOCATION = { lat: 39.93, lon: 32.86, name: 'Ankara', isDefault: true };

export function getLocation() {
  try {
    const v = JSON.parse(prefStore.get(KEY));
    if (Number.isFinite(v?.lat) && Number.isFinite(v?.lon)) return v;
  } catch {}
  return DEFAULT_LOCATION;
}

/** Tarayıcı konumunu ister (kullanıcı izni gerekir). 0,1°'ye yuvarlanır (~10 km). */
export function requestLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('unsupported')); return; }
    navigator.geolocation.getCurrentPosition((p) => {
      const loc = { lat: Math.round(p.coords.latitude * 10) / 10, lon: Math.round(p.coords.longitude * 10) / 10, name: null, isDefault: false };
      prefStore.set(KEY, JSON.stringify(loc));
      resolve(loc);
    }, reject, { timeout: 10000, maximumAge: 3600000 });
  });
}

export function resetLocation() {
  prefStore.remove(KEY);
  return DEFAULT_LOCATION;
}
