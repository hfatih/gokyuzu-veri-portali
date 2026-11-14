// Ortak WebGL 2 görünümü: tek tam ekran üçgen, yörünge kamerası, zaman akışı, boyutlandırma,
// görünmezken durma. Ne çizileceğini "sahne" belirler (star.js, planet.js); bir canvas'ın tek
// WebGL bağlamı olduğu için yıldız ve gezegen aynı görünümde sahne değiştirerek çizilir.

// Gökyüzü (yordamsal, fizik tabanlı): her sahne `${SKY_GLSL}` ile alır ve sky(yön) çağırır. Fotoğraf dokusu
// büyütmede bulanık leke veriyordu; burada her yıldız ekran pikseli ölçeğinde çizilir, her çözünürlükte keskindir.
// - Yer: yön küresini kesen 3B hücre ızgarası, hücre başına en çok bir yıldız. Yıldızın izdüşümü hücre sınırlarından
//   en az 0,3 hücre içeride olmalı (yoksa hücre boş): ışığı komşu hücreye taşmaz, kesik yıldız olmaz. Hücre başına
//   düşme oranı ölçüldü: gökte ≈ 0,9 · p · s² yıldız (s: birim yön başına hücre).
// - Sayı: üç katman, kadir dağılımı N(<m) ∝ 10^(0,45 m) (alan sayımlarının ortalama eğimi). Gök geneli hedef ~25 000
//   yıldız (m ≤ 7,5; gerçek sayım ≈ 25 000): parlaklar seyrek, sönükler galaktik düzlemde 3,5 kata kadar sık.
// - Görüntü: toplam akı Φ ∝ 10^(−0,4 m), piksel cinsinden Gauss nokta yayılım işlevi (σ = 0,6 piksel) + parlaklarda
//   r^−3 saçılma halesi. Sabit σ ile parlak yıldız doğal olarak büyük görünür (fotoğraftaki gibi).
// - Renk: sıcaklıktan, Planck eğrisi 610/550/465 nm'de örneklenir (soldurulmaz: gama zaten soluklaştırır).
// - Samanyolu: galaktik düzlemde (σ ≈ 6°) hafif yaygın ışık, merkeze doğru şişkinlik, fbm toz şeritleri.
// Yön çerçevesi: y gök kuzey kutbu, sağ açıklık atan(z, x); galaktik kutup ve merkez gerçek ekvatoral yönleriyle.
export const SKY_GLSL = `
vec3 skyHash(vec3 p) {   // sinüssüz karma (Hoskins): ızgara deseni bırakmaz
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
float skyNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(skyHash(i).x, skyHash(i + vec3(1,0,0)).x, u.x), mix(skyHash(i + vec3(0,1,0)).x, skyHash(i + vec3(1,1,0)).x, u.x), u.y),
             mix(mix(skyHash(i + vec3(0,0,1)).x, skyHash(i + vec3(1,0,1)).x, u.x), mix(skyHash(i + vec3(0,1,1)).x, skyHash(i + vec3(1,1,1)).x, u.x), u.y), u.z);
}
float skyFbm(vec3 x) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * skyNoise(x); x *= 2.07; a *= 0.5; } return s; }

const vec3 SKY_NGP = vec3(-0.8678, 0.4560, -0.1975);   // galaktik kuzey kutbu (α 192,86°, δ +27,13°)
const vec3 SKY_GC = vec3(-0.0549, -0.4838, -0.8735);   // galaktik merkez (α 266,40°, δ −28,94°)
const vec3 SKY_GY = vec3(-0.4939, -0.7472, 0.4449);    // normalize(cross(SKY_NGP, SKY_GC)), önceden hesaplı

// Sıcaklıktan yıldız rengi: Planck B(λ, T) ∝ λ^−5 / (e^(c₂/λT) − 1), λ µm, c₂ = 14 388 µm·K
vec3 skyStarRgb(float T) {
  vec3 lam = vec3(0.610, 0.550, 0.465);
  vec3 b = 1.0 / (pow(lam, vec3(5.0)) * (exp(14388.0 / (lam * T)) - 1.0));
  return b / max(b.r, max(b.g, b.b));
}

// Bir katman: s hücre/birim yön, [m0, m1] kadir aralığı, p temel olasılık, gal yerel yoğunluk çarpanı
vec3 skyLayer(vec3 d, float s, float m0, float m1, float p, float gal, float pxRad) {
  float cellPx = 1.0 / (s * pxRad);
  float fade = smoothstep(3.0, 6.0, cellPx);   // hücre birkaç pikselden küçükse (küçük görüntü) katman söner
  if (fade <= 0.0) return vec3(0.0);
  vec3 c = floor(d * s), h = skyHash(c);
  if (h.x > p * gal) return vec3(0.0);
  vec3 h2 = skyHash(c + 71.3);
  vec3 sd = normalize((c + h2) / s);
  vec3 f = sd * s - c;
  if (min(min(f.x, f.y), f.z) < 0.3 || max(max(f.x, f.y), f.z) > 0.7) return vec3(0.0);
  float r = length(d - sd) / pxRad;                                   // yıldıza açısal uzaklık, piksel
  float k = 1.0362;                                                   // 0,45 ln 10
  float m = m0 + log(1.0 + h.y * (exp(k * (m1 - m0)) - 1.0)) / k;     // N(<m) ∝ 10^(0,45 m), ters dönüşüm
  float flux = 0.3 * exp(-0.9210 * (m - 7.5));                        // 10^(−0,4 (m − 7,5))
  float I = flux * (0.4421 * exp(-1.3889 * r * r) + 4e-4 / pow(1.0 + r * r / 2.25, 1.5));   // σ = 0,6 px
  I *= 1.0 - smoothstep(0.18, 0.3, r / cellPx);                       // hücre sınırına varmadan söner
  // Sıcaklık: parlaklık sınırlı örneklemde ~%8 B–A, ~%30 F–G, kalanı K–M (devler dahil)
  float T = h.z < 0.08 ? mix(9500.0, 25000.0, h2.x * h2.x) : h.z < 0.38 ? mix(5800.0, 9000.0, h2.x) : mix(3400.0, 5600.0, h2.x);
  return skyStarRgb(T) * I * fade;
}

vec3 sky(vec3 d) {
  if (uStars <= 0.0) return vec3(0.0);
  float pxRad = 2.0 * uTanFov / uRes.y;
  float sb = dot(d, SKY_NGP), absB = asin(min(abs(sb), 1.0));
  float plane = exp(-absB / 0.19);                                    // ölçek ~11°: sönük yıldızlar düzlemde yoğunlaşır
  // Galaktik çerçeve (x merkeze, z kutba): toz ve yıldız bulutları düzlem boyunca uzun, enlemde ince.
  // Düzlemden |b| > ~24° uzakta toz ve yaygın ışık ihmal edilir (exp(−sb²/0,011) < 10⁻⁶): gürültü hesaplanmaz.
  bool near = abs(sb) < 0.4;
  vec3 g = vec3(dot(d, SKY_GC), dot(d, SKY_GY), sb);
  float dust = near ? smoothstep(0.56, 0.74, skyFbm(vec3(g.xy * 4.0, g.z * 24.0) + 3.1)) * exp(-sb * sb / 0.004) : 0.0;   // toz şeritleri
  float gal = (1.0 - 0.7 * dust);
  vec3 col = skyLayer(d, 40.0, -1.0, 3.5, 0.21, (1.0 + 0.5 * plane) / 1.1 * gal, pxRad)
           + skyLayer(d, 120.0, 3.5, 5.5, 0.21, (1.0 + plane) / 1.2 * gal, pxRad)
           + skyLayer(d, 260.0, 5.5, 7.5, 0.36, (1.0 + 2.5 * plane) / 1.5 * gal, pxRad);
  // Samanyolu yaygın ışığı: çözülmemiş yıldızlar; merkeze doğru şişkinlik, toz önünde kararır
  if (near) {
    float bulge = exp(-(1.0 - dot(d, SKY_GC)) / 0.05);
    float glow = exp(-sb * sb / 0.011) * (0.45 + 1.1 * skyFbm(vec3(g.xy * 3.0, g.z * 10.0) + 9.7)) * (1.0 + 2.5 * bulge) * (1.0 - 0.85 * dust);
    col += vec3(0.95, 0.88, 0.76) * glow * 0.02;
  }   // ACES'in karanlık ucunda kaybolmayacak kadar
  return col * uStars;
}`;

const VERT = `#version 300 es
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function link(gl, frag, vert = VERT) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  const U = {};
  for (let i = 0, n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); i < n; i++) {
    const name = gl.getActiveUniform(prog, i).name;
    U[name] = gl.getUniformLocation(prog, name);
  }
  return { prog, U };
}

/**
 * Sahne: { id, frag, vert?, init?(gl, view, U) → durum, uniforms(gl, U, params, view, durum),
 *   draw?(gl, params, view, durum), timeScale(params), static? (boolean ya da params → boolean) }. vert ve draw verilmezse tam ekran üçgen çizilir.
 * Ortak uniform'lar (uRes, uShift, uCamPos, uTanFov, uExposure, uStars) burada atanır.
 * opts.scale: çözünürlük çarpanı, opts.stars: arka plan yıldızları. WebGL 2 yoksa null döner.
 */
export function createView(canvas, opts = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) return null;
  const programs = new Map();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Telefon ve tabletlerde (dokunmatik, küçük ekran) piksel yoğunluğu ve kare hızı sınırlanır:
  // tam ekran ışın yürütme pil ve ısı için en pahalı iş
  const handheld = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 900;
  const maxDpr = handheld ? 1.25 : 2, minFrameMs = 1000 / (opts.maxFps ?? (handheld ? 30 : 60)) - 2;
  const view = {
    gl, canvas,
    cam: { yaw: 0.6, pitch: 0.25, dist: 3.2 },
    shift: [0, 0],
    timeScale: 1,            // sahne saniyesi / gerçek saniye
    exposure: 0.85,
    scale: opts.scale ?? 1,  // arka planda düşük, 3D'de tam
    granulation: true,
    spots: true,
    scene: null,
    params: null,
    t: 0,
    wall: 0,                 // gerçek saniye (zaman hızından bağımsız; granülasyon gibi hızlı süreçler için)
    onDraw: null,            // her kareden sonra (ör. 3D panelindeki saat)
  };
  let visible = true, raf = 0, last = 0;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, maxDpr) * view.scale;
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  function draw() {
    const sc = view.scene;
    if (!sc || !view.params) return;
    let entry = programs.get(sc.id);
    if (!entry) {
      entry = link(gl, sc.frag, sc.vert);
      gl.useProgram(entry.prog);
      entry.state = sc.init?.(gl, view, entry.U) ?? null;
      programs.set(sc.id, entry);
    }
    const { prog, U, state } = entry;
    gl.useProgram(prog);
    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    const { yaw, pitch, dist } = view.cam;
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uShift, view.shift[0], view.shift[1]);
    gl.uniform3f(U.uCamPos, dist * Math.cos(pitch) * Math.sin(yaw), dist * Math.sin(pitch), dist * Math.cos(pitch) * Math.cos(yaw));
    gl.uniform1f(U.uTanFov, Math.tan(17.5 * Math.PI / 180));
    gl.uniform1f(U.uExposure, view.exposure);
    gl.uniform1f(U.uStars, opts.stars === false ? 0 : 1);
    sc.uniforms(gl, U, view.params, view, state);
    if (sc.draw) sc.draw(gl, view.params, view, state);
    else gl.drawArrays(gl.TRIANGLES, 0, 3);
    view.onDraw?.();
  }

  function frame(now) {
    raf = 0;
    if (last && now - last < minFrameMs) { schedule(); return; }   // kare hızı sınırı
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    view.t += dt * view.timeScale;
    view.wall += dt;
    draw();
    schedule();
  }
  function schedule() {
    // Durağan sahne (bulutsu) yalnız istek üzerine çizilir: kamera oynayınca ya da boyut değişince
    const st = view.scene?.static, still = typeof st === 'function' ? st(view.params) : st;   // sahne ya da parametreye göre
    if (!raf && visible && !document.hidden && !reduced && !still) raf = requestAnimationFrame(frame);
    if (!raf) last = 0;
  }

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); });
  io.observe(canvas);
  const onVis = () => schedule();
  document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(() => draw());
  ro.observe(canvas);

  Object.assign(view, {
    /** Sahne ve parametreleri değiştirir; zaman sıfırlanır, varsayılan hızı sahne seçer. */
    setScene(scene, params) {
      view.scene = scene; view.params = params; view.t = 0;
      view.timeScale = scene.timeScale(params);
      draw(); schedule();
    },
    /** Hareket kapalıyken ya da ayar değişince tek kare çizer. */
    redraw: draw,
    destroy() { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); },
  });
  return view;
}
