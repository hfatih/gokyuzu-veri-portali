// deriveCluster() ve üyelerden küme sahnesinin tampon verisini üretir. Saf fonksiyon.
// x, y gerçek gökyüzü konumu (pc, teğet düzlem). z ölçülemez: küme Plummer küresi sayılır ve her yıldızın
// derinliği, kendi izdüşüm yarıçapında o kürenin verdiği koşullu dağılımdan örneklenir (merkezdeki yıldız
// büyük olasılıkla gerçekten merkezde, kenardaki yıldızın derinliği daha belirsiz).
// Ölçek: üyelerin %90'ının içinde kaldığı yarıçap = 1.

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

/**
 * Plummer küresinde (ρ ∝ (1 + r²/a²)^−5/2) izdüşüm yarıçapı R olan yıldızın bakış doğrultusundaki konumu.
 * Koşullu dağılım p(z | R) ∝ (1 + z²/(a² + R²))^−5/2, yani z = √(a² + R²) · T₄/2 (T₄: 4 serbestlik dereceli
 * Student-t). a Plummer yarıçapıdır; izdüşümde üyelerin yarısını içeren yarıçapa eşittir.
 * ponytail: tek bileşenli Plummer; küresel kümede King profili (yoğunlaşma c) bilinirse buraya gelir.
 */
export function plummerDepth(R, a, rand) {
  const n = Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(2 * Math.PI * rand());   // N(0, 1)
  const chi2 = -2 * Math.log((rand() + 1e-12) * (rand() + 1e-12));                       // χ²(4)
  return Math.hypot(a, R) * 0.5 * n / Math.sqrt(chi2 / 4);
}

/** cd: deriveCluster(), members: [{ ra, dec }] (cmd ile aynı sırada), center: { ra, dec }, id. */
export function clusterVisualParams(cd, members, center, id) {
  const d = cd.distancePc?.value ?? 1000;
  const xy = members.map((m) => projectPc(m, center, d));
  const r = xy.map(([x, y]) => Math.hypot(x, y)).sort((a, b) => a - b);
  const scale = r[Math.floor(r.length * 0.9)] || 1;
  const a = r[r.length >> 1] || scale * 0.5;   // Plummer yarıçapı = izdüşümde yarı-sayı yarıçapı
  const rand = rng([...String(id)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7));
  const data = new Float32Array(members.length * 7);
  members.forEach((m, i) => {
    const p = cd.cmd[i];
    // Uzun kuyruk sahneden taşmasın diye ±3 ölçekte kesilir
    const z = Math.max(-3 * scale, Math.min(3 * scale, plummerDepth(Math.hypot(...xy[i]), a, rand)));
    const c = chroma(bvToTeff(p.bv));
    const lum = p.mv != null ? Math.min(400, 10 ** (-0.4 * (p.mv - 4))) : 1;
    // Doğu solda görünür (gökyüzüne bakış); x işareti çevrilir
    data.set([-xy[i][0] / scale, xy[i][1] / scale, z / scale, ...c, lum], i * 7);
  });
  return { data, n: members.length, plummerPc: a };
}
