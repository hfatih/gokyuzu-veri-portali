// WebGL 2 yıldız çizici. Tek tam ekran üçgen; yüzey piksel başına ışın–elipsoit kesişimiyle
// bulunur. Arka plan, köşe önizlemesi ve 3D görünüm aynı çiziciyi farklı kamerayla kullanır.

import { blackbodyTable } from './color.js';

const BB_N = 256, BB_TMIN = 1500, BB_TMAX = 60000;

const VERT = `#version 300 es
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes, uShift;
uniform vec3 uCamPos;
uniform float uTanFov, uExposure, uStars;
uniform sampler2D uBB;
uniform vec2 uBBRange;
uniform float uTeff, uGranF, uGranAmp, uGiantAmp, uGranPhase, uSpots, uOblate, uGEq, uBeta, uRot, uU1, uU2;

vec4 bb(float T) {
  float u = clamp((log(T) - uBBRange.x) / (uBBRange.y - uBBRange.x), 0.0, 1.0);
  return texture(uBB, vec2((u * ${BB_N - 1}.0 + 0.5) / ${BB_N}.0, 0.5));
}
vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453);
}
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x), u = f * f * (3.0 - 2.0 * f);
  float a = hash3(i).x, b = hash3(i + vec3(1,0,0)).x, c = hash3(i + vec3(0,1,0)).x, d = hash3(i + vec3(1,1,0)).x;
  float e = hash3(i + vec3(0,0,1)).x, f1 = hash3(i + vec3(1,0,1)).x, g = hash3(i + vec3(0,1,1)).x, h = hash3(i + vec3(1,1,1)).x;
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, f1, u.x), mix(g, h, u.x), u.y), u.z);
}
float fbm(vec3 x) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise(x); x *= 2.03; a *= 0.5; } return s; }
// Hücresel gürültü: F1, F2 uzaklıkları ve en yakın hücrenin kimliği; noktalar zamanla yer
// değiştirir (granül evrimi)
vec3 worley(vec3 x, float t) {
  vec3 i = floor(x), f = fract(x);
  float d1 = 8.0, d2 = 8.0, id = 0.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int k = -1; k <= 1; k++) {
    vec3 g = vec3(k, y, z), h = hash3(i + g);
    vec3 r = g + 0.5 + 0.4 * sin(t + 6.2831 * h) - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = h.z; } else if (d < d2) d2 = d;
  }
  return vec3(sqrt(vec2(d1, d2)), id);
}
// Granül deseni, ortalaması ~0: sıcak yükselen hücre içi (+), dar soğuk şeritler (−).
// Hücreden hücreye parlaklık farkı gerçek granülasyondaki gibi korunur.
float granule(vec3 x, float t) {
  vec3 w = worley(x, t);
  float lane = smoothstep(0.0, 0.3, w.y - w.x);
  float inner = 1.0 - 0.35 * w.x * w.x;
  return (lane * inner * (0.7 + 0.6 * w.z) - 0.62) * 1.6;
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y - uShift;
  vec3 fw = normalize(-uCamPos), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * uTanFov);
  vec3 ro = uCamPos;

  // Elipsoit (ekvator yarıçapı 1, kutup 1 − f) → birim küre uzayı
  vec3 sc = vec3(1.0, 1.0 / (1.0 - uOblate), 1.0);
  vec3 o = ro * sc, d = rd * sc;
  float a = dot(d, d), b = dot(o, d), c = dot(o, o) - 1.0, disc = b * b - a * c;
  vec3 col = vec3(0.0);
  vec4 bbEff = bb(uTeff);

  if (disc > 0.0 && (-b - sqrt(disc)) > 0.0) {
    vec3 p = o + d * ((-b - sqrt(disc)) / a);          // birim küre üzerinde
    vec3 n = normalize(p * sc);                        // elipsoit normali
    float mu = max(dot(n, -rd), 0.0);
    float cr = cos(uRot), sr = sin(uRot);
    vec3 q = vec3(cr * p.x + sr * p.z, p.y, -sr * p.x + cr * p.z);   // yıldızla dönen koordinat

    // von Zeipel: T ∝ g_eff^β, g_eff kutuptan ekvatora uGEq oranında düşer
    float s2 = 1.0 - p.y * p.y;
    float T = uTeff * pow(mix(1.0, uGEq, s2), uBeta) / pow(mix(1.0, uGEq, 0.6667), uBeta);

    // Granülasyon: parlak sıcak hücreler, koyu soğuk şeritler. Piksel altına inen hücreler
    // çözünürlükte silinir (uzaktan bakınca görünmezler).
    vec3 gx = q * uGranF;
    float foot = length(fwidth(gx));
    float amp = uGranAmp * (1.0 - smoothstep(0.35, 1.0, foot));
    if (amp > 0.0) T *= 1.0 + amp * granule(gx, uGranPhase);
    // Süperdevlerde yüzeyi birkaç dev hücre kaplar (Chiavassa+ 2010); daha yavaş evrilir
    if (uGiantAmp > 0.0) T *= 1.0 + uGiantAmp * granule(q * 1.3 + 7.0, uGranPhase * 0.15);

    // Lekeler: aktivite kuşağında (|enlem| ≈ 5°–40°) eşik üstü gürültü; gölge 0,7·T, yarı gölge 0,85·T
    if (uSpots > 0.0) {
      float belt = smoothstep(0.08, 0.18, abs(q.y)) * (1.0 - smoothstep(0.55, 0.7, abs(q.y)));
      float nz = fbm(q * 4.0 + 11.0);
      float th = 0.78 - 0.18 * uSpots;
      float pen = smoothstep(th, th + 0.03, nz) * belt, umb = smoothstep(th + 0.04, th + 0.06, nz) * belt;
      T *= mix(1.0, 0.85, pen) * mix(1.0, 0.82, umb);
    }

    float limb = 1.0 - uU1 * (1.0 - mu) - uU2 * (1.0 - mu) * (1.0 - mu);
    vec4 bt = bb(T);
    // Disk merkezinin en parlak kanalı 1 olacak biçimde: turuncu yıldız turuncu kalır
    col = bt.rgb * exp2(bt.a - bbEff.a) * max(limb, 0.0) / max(bbEff.r, max(bbEff.g, bbEff.b));
  } else {
    // Işık hâlesi: ışının merkeze en yakın uzaklığı (yarıçap biriminde)
    float bimp = length(cross(ro, rd));
    float glow = 0.3 * exp(-(bimp - 1.0) * 10.0) + 0.01 / (bimp * bimp * bimp);
    col = bbEff.rgb / max(bbEff.r, max(bbEff.g, bbEff.b)) * glow;
    // Uzak yıldızlar: yöne bağlı seyrek noktalar (kamerayla döner, yıldızla değil)
    vec3 cell = floor(rd * 220.0), h = hash3(cell);
    float sd = length(fract(rd * 220.0) - 0.5 - (h - 0.5) * 0.6);
    col += uStars * step(0.9975, h.x) * smoothstep(0.12, 0.0, sd) * bb(2500.0 + h.z * 15000.0).rgb * (0.3 + h.y);
  }
  // Ton eşleme en parlak kanala uygulanır, renk tonu korunur (kanal başına ACES sarıya kaydırıyordu)
  col *= uExposure;
  float mx = max(col.r, max(col.g, col.b));
  if (mx > 0.0) col *= aces(vec3(mx)).r / mx;
  outColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

let BB_CACHE = null;

/**
 * canvas üzerinde yıldız çizer. opts.scale: çözünürlük çarpanı, opts.stars: arka plan yıldızları.
 * Dönüş: { setStar(params), cam, shift, timeScale, redraw(), destroy() } ya da WebGL 2 yoksa null.
 * params: starVisualParams() çıktısı (derive.js).
 */
export function createStarRenderer(canvas, opts = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const U = {};
  for (let i = 0, n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); i < n; i++) {
    const name = gl.getActiveUniform(prog, i).name;
    U[name] = gl.getUniformLocation(prog, name);
  }

  BB_CACHE ??= blackbodyTable(BB_N, BB_TMIN, BB_TMAX);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, BB_N, 1, 0, gl.RGBA, gl.FLOAT, BB_CACHE.data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.uniform2f(U.uBBRange, Math.log(BB_TMIN), Math.log(BB_TMAX));
  gl.uniform1i(U.uBB, 0);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const self = {
    cam: { yaw: 0.6, pitch: 0.25, dist: 3.2 },
    shift: [0, 0],
    timeScale: 120,          // yıldız saniyesi / gerçek saniye
    exposure: 0.85,
    scale: opts.scale ?? 1,  // çözünürlük çarpanı; arka planda düşük, 3D'de tam
    granulation: true,
    spots: true,
    params: null,
    t: 0,
  };
  let visible = true, raf = 0, last = 0;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2) * self.scale;
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  function draw() {
    const p = self.params;
    if (!p) return;
    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    const { yaw, pitch, dist } = self.cam;
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uShift, self.shift[0], self.shift[1]);
    gl.uniform3f(U.uCamPos, dist * Math.cos(pitch) * Math.sin(yaw), dist * Math.sin(pitch), dist * Math.cos(pitch) * Math.cos(yaw));
    gl.uniform1f(U.uTanFov, Math.tan(17.5 * Math.PI / 180));
    gl.uniform1f(U.uExposure, self.exposure);
    gl.uniform1f(U.uStars, opts.stars === false ? 0 : 1);
    gl.uniform1f(U.uTeff, p.teff);
    gl.uniform1f(U.uGranF, p.granScale / (2 * Math.PI));
    gl.uniform1f(U.uGranAmp, self.granulation ? p.granContrast * p.granAmp : 0);
    gl.uniform1f(U.uGiantAmp, self.granulation ? p.giantCellAmp : 0);
    gl.uniform1f(U.uGranPhase, self.t / p.granLifeSec * 2 * Math.PI);
    gl.uniform1f(U.uSpots, self.spots ? p.spots : 0);
    gl.uniform1f(U.uOblate, p.oblateness);
    gl.uniform1f(U.uGEq, p.gEqRatio);
    gl.uniform1f(U.uBeta, p.gravDarkBeta);
    gl.uniform1f(U.uRot, (self.t / (p.periodDays * 86400)) % 1 * 2 * Math.PI);
    gl.uniform1f(U.uU1, p.u1);
    gl.uniform1f(U.uU2, p.u2);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    self.t += dt * self.timeScale;
    draw();
    schedule();
  }
  function schedule() {
    if (!raf && visible && !document.hidden && !reduced) raf = requestAnimationFrame(frame);
    if (!raf) last = 0;
  }

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); });
  io.observe(canvas);
  const onVis = () => schedule();
  document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(() => draw());
  ro.observe(canvas);

  Object.assign(self, {
    /** Yeni yıldız parametreleri; zaman sıfırlanır ve varsayılan hız granül ömrüne göre seçilir. */
    setStar(params) { self.params = params; self.t = 0; self.timeScale = params.granLifeSec / 4; draw(); schedule(); },
    /** Hareket kapalıyken ya da ayar değişince tek kare çizer. */
    redraw: draw,
    destroy() { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); },
  });
  return self;
}
