// Ortak WebGL 2 görünümü: tek tam ekran üçgen, yörünge kamerası, zaman akışı, boyutlandırma,
// görünmezken durma. Ne çizileceğini "sahne" belirler (star.js, planet.js); bir canvas'ın tek
// WebGL bağlamı olduğu için yıldız ve gezegen aynı görünümde sahne değiştirerek çizilir.

// Gerçek gökyüzü: NASA SVS Deep Star Maps 2020 (Hipparcos-2, Tycho-2, Gaia DR2), ekvatoral koordinatta
// eşdikdörtgen; sağ açıklık sola doğru artar, merkez 0h. Sahnelerde y ekseni gök kuzey kutbudur. Doğrusal
// ışınım × uStars × 0,6 (Samanyolu sahnenin önüne geçmesin). Her sahne `${SKY_GLSL}` ile alır ve sky(yön) çağırır.
export const SKY_GLSL = `uniform sampler2D uSky;
vec3 sky(vec3 d) {
  float ra = atan(d.z, d.x), dec = asin(clamp(d.y, -1.0, 1.0));
  return pow(texture(uSky, vec2(fract(0.5 - ra / 6.2831853), 0.5 - dec / 3.1415927)).rgb, vec3(2.2)) * uStars * 0.6;
}`;

let SKY_IMG = null;
const skyImage = () => (SKY_IMG ??= Object.assign(new Image(), { decoding: 'async', src: 'assets/textures/sky.jpg' }));

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

  // Gökyüzü dokusu 7. birimde (sahneler 0–3'ü kullanır); yüklenene kadar siyah. Büyütmede görülür, mipmap
  // gerekmez (4096 piksel / 360° ≈ 400 piksel / görüş alanı), dikişte türev sıçraması da olmaz.
  const skyTex = gl.createTexture();
  const sky = skyImage();
  const putSky = (src) => {
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, skyTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(3));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.activeTexture(gl.TEXTURE0);
  };
  putSky(null);
  if (sky.complete && sky.naturalWidth) putSky(sky);
  else sky.addEventListener('load', () => { putSky(sky); draw(); }, { once: true });

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
    if (U.uSky) { gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, skyTex); gl.uniform1i(U.uSky, 7); gl.activeTexture(gl.TEXTURE0); }
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
