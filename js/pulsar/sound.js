// Atımları gerçek dönemle ses olarak çalar: bir dönemlik tampon (W50 yarı genişlikli Gauss
// pencereli gürültü atımı) döngüde çalınır. Yengeç saniyede 30 kez vızıldar, yavaş pulsar tıklar.

let ctx = null, src = null;

/** periodS: dönem (s), w50Ms: atım yarı yükseklik genişliği (ms); yoksa dönemin %3'ü. */
export function playPulses(periodS, w50Ms) {
  stopPulses();
  ctx ??= new AudioContext();
  ctx.resume();
  const sr = ctx.sampleRate, n = Math.max(2, Math.round(periodS * sr));
  const buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
  const sigma = Math.max(3e-4, (w50Ms ? w50Ms / 1e3 : periodS * 0.03) / 2.355) * sr;
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-0.5 * ((i - n / 2) / sigma) ** 2);
  const gain = ctx.createGain();
  gain.gain.value = 0.35;
  src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  src.connect(gain).connect(ctx.destination);
  src.start();
}

export function stopPulses() {
  src?.stop(); src = null;
}
