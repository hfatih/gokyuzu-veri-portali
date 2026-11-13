// node dev/check-pulsar.mjs — pulsar fiziği ATNF'nin kendi türetilmiş sütunlarıyla (Age, Bsurf, Edot, BLC) karşılaştırılır
import assert from 'node:assert/strict';
import { derivePulsar, pulsarClass } from '../js/pulsar/derive.js';
import { parseTsv } from '../js/pulsar/fetch.js';

const near = (x, lo, hi, what) => assert.ok(x >= lo && x <= hi, `${what}: ${x} [${lo}, ${hi}] dışında`);
const rel = (x, ref, tol, what) => near(x / ref, 1 - tol, 1 + tol, what);

// Yengeç pulsarı (VizieR B/psr satırı): Age 1260 yıl, Bsurf 3,79 × 10¹² G, Edot 4,5 × 10³⁸ erg/s
const crab = derivePulsar({ P0: 0.0333924123, P1: 4.20972e-13, DM: 56.791, Dist: 2, PMTot: 14.8, W50: 3, NGlt: 24, Type: 'HE[cdt69]' });
rel(crab.ageYr.value, 1260, 0.01, 'Yengeç karakteristik yaş');
rel(crab.bGauss.value, 3.79e12, 0.01, 'Yengeç yüzey alanı');
rel(crab.edotW.value, 4.5e31, 0.02, 'Yengeç Ė (W)');
rel(crab.rlcKm.value, 1593, 0.01, 'Yengeç ışık silindiri');
rel(crab.vTransKms.value, 140.67, 0.01, 'Yengeç dik hız (ATNF VTrans)');
near(crab.dmDelayS.value, 1.3, 1.4, 'Yengeç 400–1400 MHz dağılma gecikmesi');
near(crab.edotLsun.value, 1e5, 1.3e5, 'Yengeç Ė / L☉');
assert.equal(crab.cls, 'young');
assert.equal(crab.distKpc.origin, 'estimated');     // paralaks yok: DM modeli
assert.ok(crab.deathRatio.value > 1, 'Yengeç ölüm çizgisinin üstünde');

// Vela: Age 11 300 yıl, Bsurf 3,38 × 10¹² G; paralakslı uzaklık
const vela = derivePulsar({ P0: 0.089328385024, P1: 1.25008e-13, DM: 67.99, Dist: 0.28, Plx: 3.5, Type: 'HE' });
rel(vela.ageYr.value, 11300, 0.01, 'Vela yaş');
rel(vela.bGauss.value, 3.38e12, 0.01, 'Vela alan');
assert.equal(vela.distKpc.origin, 'measured');

// J0437−4715 (milisaniye, çift): Bsurf 5,81 × 10⁸ G, Age 1,59 × 10⁹ yıl; ekvator hızı ışık hızının ~%4'ü
const j0437 = derivePulsar({ P0: 0.00575745193671, P1: 5.729215e-20, DM: 2.64476, Dist: 0.16, Plx: 6.37, PB: 5.7410459, Ecc: 1.9e-5, minM: 0.140288, Type: 'HE' });
rel(j0437.bGauss.value, 5.81e8, 0.01, 'J0437 alan');
rel(j0437.ageYr.value, 1.59e9, 0.01, 'J0437 yaş');
near(j0437.vEqC.value, 0.03, 0.04, 'J0437 ekvator hızı / c');
assert.ok(j0437.spinGravity.value < 1, 'J0437 dönmeyle dağılmaz');
assert.equal(j0437.cls, 'msp');
assert.ok(j0437.binary);
near(j0437.beamDeg.value, 70, 80, 'J0437 ışın yarı genişliği (Rankin)');

// Sınıflar: SGR 1806−20 magnetar (B kuantum kritik alanın üstünde), RX J1856 ısıl, B1919+21 olağan
const sgr = derivePulsar({ P0: 7.55592, P1: 5.49e-10, Type: 'AXP,NRAD' });
assert.equal(sgr.cls, 'magnetar');
near(sgr.bQuantum.value, 40, 55, 'SGR 1806−20 B / B_Q');
assert.equal(pulsarClass({ P0: 7.05, Type: 'XINS,NRAD' }, 1.5e13, 3.8e6), 'xins');
const cp = derivePulsar({ P0: 1.3373, P1: 1.348e-15, Type: ' ' });
assert.equal(cp.cls, 'normal');

// Pdot yoksa (küme pulsarı J1748−2446ad, ATNF P1 = 0) yalnız dönem kaynaklılar dolar
const ter5 = derivePulsar({ P0: 0.00139595482, P1: 0, Dist: 5.5 });
assert.equal(ter5.ageYr, null);
assert.equal(ter5.bGauss, null);
near(ter5.spinGravity.value, 0.05, 0.2, 'en hızlı pulsar: merkezkaç / kütleçekim');

// ASU TSV ayrıştırma: yorumlar, birim ve çizgi satırları atlanır; boş hücre null, sayı Number
const tsv = '#c\n\nPSRJ\tP0\tPlx\tType\n \ts\tmas\t \n----\t----\t----\t----\nJ0534+2200  \t 0.0333924123\t      \tHE[cdt69]\n';
assert.deepEqual(parseTsv(tsv), [{ PSRJ: 'J0534+2200', P0: 0.0333924123, Plx: null, Type: 'HE[cdt69]' }]);
assert.equal(parseTsv('1.25e-13\n').length, 0);
console.log('pulsar: tüm kontroller geçti');

// Işık bükülmesi (1,4 M☉, 10 km): sıkılık 0,41, yüzeyin ~%85'i görünür, z ≈ 0,31, görünen yarıçap ≈ 13 km
{
  const { compactness, visibleFraction } = await import('../js/pulsar/derive.js');
  const { pulsarVisualParams } = await import('../js/pulsar/visual.js');
  near(compactness(), 0.41, 0.416, 'sıkılık');
  assert.equal(visibleFraction(0), 0.5);                       // düz uzay: yarım küre
  near(visibleFraction(compactness()), 0.84, 0.86, 'görünen yüzey payı');
  assert.equal(visibleFraction(0.6), 1);                       // R < 1,5 r_s... bütün yüzey
  const pd = derivePulsar({ P0: 0.0334, P1: 4.2e-13 });
  near(pd.surfaceZ.value, 0.30, 0.31, 'yüzey kırmızıya kayması');
  near(pd.apparentRadiusKm.value, 13, 13.1, 'görünen yarıçap');
  near(pulsarVisualParams(pd).compact, 0.41, 0.416, 'sahne sıkılığı');
  console.log('pulsar: ışık bükülmesi geçti');
}
