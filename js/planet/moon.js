// Uydu fiziği (saf): gezegen fiziği Güneş'ten ana gezegenin uzaklığında, yörünge gezegen çevresinde.

import { derivePlanet } from './derive.js';

// Ana gezegenlerin yarı büyük eksenleri (AU, Standish 1992)
const PARENT_AU = { earth: 1.00000261, mars: 1.52371034, jupiter: 5.202887, saturn: 9.53667594, neptune: 30.06992276 };
const AU_KM = 1.495978707e8;

/** Uydu değerleri: gezegen fiziği (Güneş'ten uzaklık = ana gezegeninki) ve gezegen çevresindeki yörünge. */
export function deriveMoon(props, parentKey, host) {
  const period = props.period ?? null;
  // Büyük uyduların hepsi gelgit kilitli: dönme verilmemişse yörünge dönemine eşit
  const pd = derivePlanet({ ...props, sma: PARENT_AU[parentKey], rot: props.rot ?? period }, host);
  pd.tidallyLocked = true;
  if (!props.rot && period) pd.rot = { value: period, origin: 'estimated' };
  const orbitKm = props.sma != null ? { value: props.sma * AU_KM, origin: 'measured' } : null;
  return { ...pd, orbitKm, period: period != null ? { value: period, origin: 'measured' } : null, ecc: props.ecc != null ? { value: props.ecc, origin: 'measured' } : null };
}
