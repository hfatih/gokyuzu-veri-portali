// Kara cisim renk tablosu: Planck spektrumu × CIE 1931 renk eşleme fonksiyonları
// (Wyman–Sloan–Shirley 2013 analitik yaklaşımı) → XYZ → doğrusal sRGB.
// FatihHanAstronom/assets/js/kerr/physics.js blackbodyTable'dan alındı.

/**
 * N girdilik tablo, T = Tmin·(Tmax/Tmin)^(i/(N−1)). Her girdi: [R, G, B] kromatiklik (Y = 1)
 * ve log2(Y / Y(6500 K)) parlaklık. Dönüş: { data: Float32Array(N·4), Tmin, Tmax }.
 */
export function blackbodyTable(N, Tmin, Tmax) {
  const g = (l, mu, s1, s2) => { const t = (l - mu) / (l < mu ? s1 : s2); return Math.exp(-0.5 * t * t); };
  const xb = (l) => 1.056 * g(l, 599.8, 37.9, 31.0) + 0.362 * g(l, 442.0, 16.0, 26.7) - 0.065 * g(l, 501.1, 20.4, 26.2);
  const yb = (l) => 0.821 * g(l, 568.8, 46.9, 40.5) + 0.286 * g(l, 530.9, 16.3, 31.1);
  const zb = (l) => 1.217 * g(l, 437.0, 11.8, 36.0) + 0.681 * g(l, 459.0, 26.0, 13.8);
  const h = 6.62607015e-34, c = 2.99792458e8, kB = 1.380649e-23;
  const planck = (lnm, T) => {
    const l = lnm * 1e-9;
    return (2 * h * c * c) / (Math.pow(l, 5) * Math.expm1(h * c / (l * kB * T)));
  };
  const XYZ = (T) => {
    let X = 0, Y = 0, Z = 0;
    for (let l = 360; l <= 830; l += 2) {
      const B = planck(l, T);
      X += B * xb(l); Y += B * yb(l); Z += B * zb(l);
    }
    return [X, Y, Z];
  };
  const ref = XYZ(6500)[1];
  const data = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const T = N === 1 ? Tmin : Tmin * Math.pow(Tmax / Tmin, i / (N - 1));
    const [X, Y, Z] = XYZ(T);
    const R = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
    const G = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
    const B = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;
    data[i * 4 + 0] = Math.max(0, R) / Y;
    data[i * 4 + 1] = Math.max(0, G) / Y;
    data[i * 4 + 2] = Math.max(0, B) / Y;
    data[i * 4 + 3] = Math.log2(Math.max(1e-30, Y / ref));
  }
  return { data, Tmin, Tmax };
}

/** CSS rengi (sRGB, en parlak kanal 1'e ölçekli): kart ve WebGL'siz yedek görünüm için. */
export function blackbodyCss(T) {
  const { data } = blackbodyTable(1, T, T);
  const m = Math.max(data[0], data[1], data[2]);
  const enc = (v) => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));
  return `rgb(${enc(data[0] / m)}, ${enc(data[1] / m)}, ${enc(data[2] / m)})`;
}
