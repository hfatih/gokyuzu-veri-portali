// derivePulsar() çıktısından sahne parametreleri. Saf fonksiyon.
// Nötron yıldızı gerçek boyunda (R/R_LC, Yengeç'te 0,006) neredeyse görünmez; en az 0,04 çizilir.

import { ASSUME } from './derive.js';
import { blackbodyTable } from '../render/color.js';

const RAD = Math.PI / 180;

export function pulsarVisualParams(pd) {
  // Yüzey ~10⁶ K varsayıldı; 10⁵ K üstünde kara cisim rengi zaten değişmez (mavi-beyaz)
  const d = blackbodyTable(1, 1e6, 1e6).data, mx = Math.max(d[0], d[1], d[2]);
  return {
    periodS: pd.periodS.value,
    alpha: ASSUME.alphaDeg * RAD,
    rho: pd.beamDeg.value * RAD,
    rNs: Math.max(1 / pd.rlcOverR.value, 0.04),
    cap: pd.capDeg.value * RAD,
    ns: [d[0] / mx, d[1] / mx, d[2] / mx],
  };
}
