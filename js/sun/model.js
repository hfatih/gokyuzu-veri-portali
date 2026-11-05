// Ana sayfa ve Güneş kartı için Güneş modeli: bugünün tarihinde başlar; NOAA'dan güncel bölgeler
// gelirse görünen yüzde onlar kullanılır. Gözlemci (kamera) boylamı varsayılan bakış açısıdır (glview yaw 0,6).

import { createSunModel, yearFromJd } from './activity.js';
import { fetchRegions } from './noaa.js';

export const OBS_YAW = 0.6;
const jdNow = () => Date.now() / 86400000 + 2440587.5;

/** İstatistiksel model (hemen). real: NOAA bölgeleri ya da null. */
export function sunModel(real = null) {
  const jd = jdNow();
  return createSunModel({ year0: yearFromJd(jd), seed: Math.floor(jd), real, obsLon: OBS_YAW * 180 / Math.PI });
}

/** NOAA bölgeleri gelirse onlarla kurulmuş model, gelmezse null. */
export async function realSunModel(signal) {
  const regions = await fetchRegions(signal);
  return regions.length ? sunModel(regions) : null;
}
