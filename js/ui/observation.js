// Gerçek gökyüzü görüntüsü: CDS hips2fits servisi koordinat ve görüş alanından anlık bir kesit
// üretir (Pan-STARRS ya da DSS2 renkli). Görüntü saklanmaz; tarayıcı doğrudan CDS'ten yükler.

import { t, num } from './i18n.js';

const HIPS2FITS = 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits';

/** Görüş alanı (derece): açısal boyutun ~1,6 katı, yoksa 15′. */
export function fovDeg(basic) {
  const d = basic.dimMaj ? basic.dimMaj * 1.6 / 60 : 0.25;
  return Math.min(3, Math.max(0.02, d));
}

/**
 * basic: { ra, dec, dimMaj } (derece / yay dakikası). note: altyazıya eklenecek i18n anahtarı.
 * vMag: görünür parlaklık; parlak yıldızda (V < 8) Pan-STARRS doyup merkezi maskelediği için DSS2.
 * Koordinat yoksa boş dizgi döner (Güneş, Güneş Sistemi gezegenleri).
 */
export function observationFigure(basic, note = '', vMag = null) {
  if (basic?.ra == null || basic?.dec == null) return '';
  const fov = fovDeg(basic);
  // Pan-STARRS daha derin ve doymaya dayanıklı ama yalnız δ > −30°'yi kapsar; güneyde DSS2
  const ps = basic.dec > -29 && !(vMag != null && vMag < 8);   // null < 8 JS'te true: açık kontrol şart
  const q = new URLSearchParams({
    hips: ps ? 'CDS/P/PanSTARRS/DR1/color-z-zg-g' : 'CDS/P/DSS2/color', width: '480', height: '320', fov: fov.toFixed(4),
    projection: 'TAN', ra: String(basic.ra), dec: String(basic.dec), format: 'jpg',
  });
  const fovTxt = fov >= 1 ? `${num(fov)}°` : `${num(fov * 60)}′`;
  return `<figure class="obs">
    <img src="${HIPS2FITS}?${q}" width="480" height="320" decoding="async"
      alt="${t('obs.alt')}" onerror="this.closest('figure').hidden = true">
    <figcaption><span class="obs__tag">${t('obs.tag')}</span> ${t('obs.caption', { fov: fovTxt, survey: ps ? t('obs.ps1') : 'DSS2' })}${note ? ` ${t(note)}` : ''}</figcaption>
  </figure>`;
}
