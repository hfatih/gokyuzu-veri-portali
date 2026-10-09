// Asteroit, kuyruklu yıldız ve cüce gezegen verisi IMCCE SsODNet'ten (CORS açık): ad araması quaero,
// parametreler ssoCard (her değerin kaynağı kartta). JPL SBDB API'si CORS başlığı göndermiyor.
// Kimlik biçimi 'sso:<IMCCE id>' (ör. sso:Ceres, sso:1P, sso:Apophis).

const QUAERO = 'https://api.ssodnet.imcce.fr/quaero/1/sso/instant-search';
const SSOCARD = 'https://ssp.imcce.fr/webservices/ssodnet/api/ssocard/';
const TYPES = new Set(['Asteroid', 'Comet', 'Dwarf Planet']);

export const isSsoId = (id) => typeof id === 'string' && id.startsWith('sso:');

async function getJson(url, signal, ms = 8000) {
  const timeout = AbortSignal.timeout(ms);
  const res = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!res.ok) throw new Error(res.status === 404 ? 'not-found' : `IMCCE ${res.status}`);
  return res.json();
}

/**
 * Önek araması. Bilinirlik ölçüsü yok; sıralama için kaba değer: cüce gezegen 5 × 10⁵, numaralı
 * cisim 3000/√numara (Ceres, Halley üstte), numarasız 30.
 * Dönüş: [{ label, mainId, otype, sp, nbref, rankOnly }]
 */
export async function searchSso(q, signal) {
  const { data } = await getJson(`${QUAERO}?q=${encodeURIComponent(q)}&limit=10`, signal, 6000);
  return data.filter((d) => TYPES.has(d.type)).map((d) => {
    const n = Number(/^\((\d+)\)/.exec(d.title)?.[1] ?? /^(\d+)[PID]/.exec(d.id)?.[1]);
    return {
      label: d.title, mainId: 'sso:' + d.id, otype: d.type === 'Comet' ? 'Comet' : d.type === 'Dwarf Planet' ? 'DwarfPl' : 'Asteroid',
      sp: null, nbref: d.type === 'Dwarf Planet' ? 5e5 : n ? 3000 / Math.sqrt(n) : 30, rankOnly: true,
    };
  });
}

const v = (o) => (o && typeof o === 'object' && 'value' in o ? o.value : o ?? null);
const num = (x) => (Number.isFinite(Number(x)) && x !== null && x !== '' ? Number(x) : null);

/** ssoCard → düz nesne. Eksik alan null. */
export function normalizeCard(c) {
  const ph = c.parameters?.physical ?? {}, oe = c.parameters?.dynamical?.orbital_elements ?? {};
  const spin = (ph.spins ?? []).find((s) => num(v(s.period)));
  const absm = ph.absolute_magnitude ?? {};
  return {
    id: c.id, title: c.title ?? c.name, name: c.name, number: c.number ?? null, type: c.type,
    el: {
      a: num(v(oe.semi_major_axis)), e: num(v(oe.eccentricity)), i: num(v(oe.inclination)),
      node: num(v(oe.node_longitude)), peri: num(v(oe.periapsis_argument)), M0: num(v(oe.mean_anomaly)),
      epoch: num(oe.ref_epoch), n: num(v(oe.mean_motion)), periodDays: num(v(oe.orbital_period)),
      q: num(v(oe.periapsis_distance)), Q: num(v(oe.apoapsis_distance)), periDate: num(v(oe.pericenter_date)),
    },
    // Kuyruklu yıldız toplam parlaklığı M1 (H1) ve eğim K1 (IMCCE alan adı R1); 0,0 yer tutucu (2P'de), yok sayılır
    H: num(v(absm.H)), G: num(v(absm.G)), H1: num(v(absm.H1)) || null, K1: num(v(absm.R1)) || null,
    D: num(v(ph.diameter)), albedo: num(v(ph.albedo)), mass: num(v(ph.mass)), density: num(v(ph.density)),
    spinH: spin ? num(v(spin.period)) : null,
    ab: num(v(ph.ellipsoid?.['a/b'])), ac: num(v(ph.ellipsoid?.['a/c'])),
    taxonomy: ph.taxonomy?.class ?? null,
  };
}

/** mainId: 'sso:<id>'. */
export async function fetchSso(mainId, signal) {
  return normalizeCard(await getJson(SSOCARD + encodeURIComponent(mainId.slice(4)), signal));
}
