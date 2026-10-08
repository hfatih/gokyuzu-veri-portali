// Küme üyeleri SIMBAD hiyerarşisinden (h_link). Konumlar ve parlaklıklar iki ayrı sorguda
// paralel alınır: üçlü birleştirme büyük kümelerde (Ülker, ω Cen) 6 sn'yi aşıyordu.

import { tap } from '../search/simbad.js';

const TIMEOUT_MS = 15000;

/**
 * oid: kümenin SIMBAD oid'i. Üyelik olasılığı ≥ %50 (ya da belirtilmemiş) ve hem B hem V
 * parlaklığı olan üyeler. Dönüş: [{ B, V, ra, dec }]
 */
export async function fetchMembers(oid, signal) {
  const id = Number(oid);
  const [pos, phot] = await Promise.all([
    // Aynı yıldız h_link'te her üyelik makalesi için ayrı satır olabiliyor (M67: 6171 satır, ~1000 yıldız)
    tap(`SELECT DISTINCT TOP 8000 child, ra, dec FROM h_link JOIN basic ON oid=child
      WHERE parent = ${id} AND (membership IS NULL OR membership >= 50)`, signal, TIMEOUT_MS),
    tap(`SELECT DISTINCT TOP 20000 oidref, filter, flux FROM h_link JOIN flux ON oidref=child
      WHERE parent = ${id} AND filter IN ('B','V')`, signal, TIMEOUT_MS),
  ]);
  const mags = new Map();
  for (const r of phot) {
    const m = mags.get(r.oidref) ?? {};
    m[r.filter] = r.flux;
    mags.set(r.oidref, m);
  }
  const seen = new Set();
  return pos.flatMap((p) => {
    if (seen.has(p.child)) return [];
    seen.add(p.child);
    const m = mags.get(p.child);
    return m?.B != null && m?.V != null && p.ra != null ? [{ B: m.B, V: m.V, ra: p.ra, dec: p.dec }] : [];
  });
}
