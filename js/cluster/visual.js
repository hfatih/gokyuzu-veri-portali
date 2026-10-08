// deriveCluster() ve üyelerden küme sahnesinin tampon verisini üretir. Saf fonksiyon.
// x, y gerçek gökyüzü konumu (pc, teğet düzlem); z bilinmediği için izotropik varsayımla
// ölçülen yarıçap dağılımından örneklenir. Ölçek: üyelerin %90'ının içinde kaldığı yarıçap = 1.

import { projectPc, bvToTeff } from './derive.js';
import { blackbodyTable } from '../render/color.js';

// Sıcaklık → kromatiklik önbelleği (100 K adımlı); binlerce yıldız için tablo bir kez hesaplanır
const CHROMA = new Map();
function chroma(T) {
  const k = Math.round(Math.min(40000, Math.max(2500, T)) / 100) * 100;
  if (!CHROMA.has(k)) {
    const d = blackbodyTable(1, k, k).data, m = Math.max(d[0], d[1], d[2]);
    CHROMA.set(k, [d[0] / m, d[1] / m, d[2] / m]);
  }
  return CHROMA.get(k);
}

// Kimlikten sabit tohumlu üreteç (mulberry32): derinlikler her açılışta aynı. Basit doğrusal
// eşlik üreteci ardışık çiftleri çizgilere dizdiği için Box–Muller'da ızgara deseni veriyordu.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** cd: deriveCluster(), members: [{ ra, dec }] (cmd ile aynı sırada), center: { ra, dec }, id. */
export function clusterVisualParams(cd, members, center, id) {
  const d = cd.distancePc?.value ?? 1000;
  const xy = members.map((m) => projectPc(m, center, d));
  const r = xy.map(([x, y]) => Math.hypot(x, y)).sort((a, b) => a - b);
  const scale = r[Math.floor(r.length * 0.9)] || 1;
  const rand = rng([...String(id)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7));
  const data = new Float32Array(members.length * 7);
  members.forEach((m, i) => {
    const p = cd.cmd[i];
    // Box–Muller: derinlik, izdüşüm yarıçapıyla aynı genişlikte normal dağılım
    const z = Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand()) * scale * 0.6;
    const c = chroma(bvToTeff(p.bv));
    const lum = p.mv != null ? Math.min(400, 10 ** (-0.4 * (p.mv - 4))) : 1;
    // Doğu solda görünür (gökyüzüne bakış); x işareti çevrilir
    data.set([-xy[i][0] / scale, xy[i][1] / scale, z / scale, ...c, lum], i * 7);
  });
  return { data, n: members.length };
}
