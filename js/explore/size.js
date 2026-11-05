// Karşılaştırma için cismin fiziksel yarıçapı (metre). Saf fonksiyon; değer yoksa null.

const RSUN = 6.957e8, REARTH = 6.371e6, PC = 3.0857e16;

/**
 * kind: body[data-kind] değeri, info: ctx.describe() ile gelenler.
 * Dönüş: { m, origin, note? } — note: yarıçapın anlamı (olay ufku, varsayım…) için i18n anahtarı.
 */
export function radiusOf(kind, info) {
  const d = info.derived;
  const v = (x, f, note) => (x?.value > 0 ? { m: x.value * f, origin: x.origin, note } : null);
  switch (kind) {
    case 'star': return v(d?.R, RSUN);
    case 'planet': case 'moon': return v(d?.radius, REARTH);
    case 'nebula': return v(d?.radiusPc, PC);
    case 'cluster': return v(d?.radiusPc, PC);
    case 'galaxy': return d?.diameterKpc?.value > 0 ? { m: d.diameterKpc.value / 2 * 1e3 * PC, origin: d.diameterKpc.origin } : null;
    case 'bh': return v(d?.rsKm, 1e3, 'cmp.horizon');
    case 'quasar': return v(info.bhDerived?.rsKm, 1e3, 'cmp.horizon');
    case 'pulsar': return { m: 1e4, origin: 'estimated', note: 'cmp.nsAssumed' };   // nötron yıldızı ~10 km
    case 'sso': return d?.diameterKm?.value > 0 ? { m: d.diameterKm.value / 2 * 1e3, origin: d.diameterKm.origin } : null;
    default: return null;
  }
}

/** Ölçek için okunur uzunluk: km, R☉, AU, ışık yılı. lang'dan bağımsız birim seçimi. */
export function lengthParts(m) {
  const km = m / 1e3;
  if (km < 1e5) return { v: km, u: 'km' };
  if (m < 3000 * RSUN) return { v: m / RSUN, u: 'R☉' };   // en büyük süperdevler ~2000 R☉
  if (m < 0.05 * 9.4607e15) return { v: m / 1.495978707e11, u: 'AU' };
  return { v: m / 9.4607e15, u: 'ly' };
}

export const REFERENCE = {
  sun: { label: { tr: 'Güneş', en: 'Sun' }, mainId: 'Sun', kind: 'star', m: RSUN, color: '#fff1d8' },
  earth: { label: { tr: 'Dünya', en: 'Earth' }, mainId: 'planet:Q2', kind: 'planet', m: REARTH, color: '#6fa8ff' },
};
