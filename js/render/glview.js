// Ortak WebGL 2 görünümü: tek tam ekran üçgen, yörünge kamerası, zaman akışı, boyutlandırma,
// görünmezken durma. Ne çizileceğini "sahne" belirler (star.js, planet.js); bir canvas'ın tek
// WebGL bağlamı olduğu için yıldız ve gezegen aynı görünümde sahne değiştirerek çizilir.

const VERT = `#version 300 es
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function link(gl, frag) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
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
 * Sahne: { id, frag, init?(gl, view) → durum, uniforms(gl, U, params, view, durum), timeScale(params) }.
 * Ortak uniform'lar (uRes, uShift, uCamPos, uTanFov, uExposure, uStars) burada atanır.
 * opts.scale: çözünürlük çarpanı, opts.stars: arka plan yıldızları. WebGL 2 yoksa null döner.
 */
export function createView(canvas, opts = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) return null;
  const programs = new Map();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    onDraw: null,            // her kareden sonra (ör. 3D panelindeki saat)
  };
  let visible = true, raf = 0, last = 0;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2) * view.scale;
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  function draw() {
    const sc = view.scene;
    if (!sc || !view.params) return;
    let entry = programs.get(sc.id);
    if (!entry) {
      entry = link(gl, sc.frag);
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
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    view.onDraw?.();
  }

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    view.t += dt * view.timeScale;
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
