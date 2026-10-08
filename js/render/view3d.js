// Tam ekran 3D görünüm için kamera kontrolü: sürükleyerek döndürme, teker ya da iki parmakla
// yakınlaştırma, klavye okları. Ayar paneli DOM'u main.js'te; burada yalnız giriş işlenir.

const MIN_DIST = 1.08, MAX_DIST = 14;

/** renderer kamerasını canvas üzerindeki girişe bağlar. Dönüş: bağı kaldıran fonksiyon. */
export function attachOrbitControls(renderer, canvas) {
  const pointers = new Map();
  let pinch0 = 0, dist0 = 0;
  const cam = renderer.cam;
  const zoom = (f) => { cam.dist = Math.min(MAX_DIST, Math.max(MIN_DIST, cam.dist * f)); renderer.redraw(); };

  const down = (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = cam.dist;
    }
  };
  const move = (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    if (pointers.size === 1) {
      // Yakındayken daha yavaş dön: yüzeye yaklaşınca ekrandaki kayma küçük açıya denk gelir
      const k = 0.005 * Math.min(1, (cam.dist - 1) * 0.8 + 0.1);
      cam.yaw -= (e.clientX - p.x) * k;
      cam.pitch = Math.max(-1.5, Math.min(1.5, cam.pitch + (e.clientY - p.y) * k));
    }
    p.x = e.clientX; p.y = e.clientY;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      cam.dist = Math.min(MAX_DIST, Math.max(MIN_DIST, dist0 * pinch0 / Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))));
    }
    renderer.redraw();
  };
  const up = (e) => pointers.delete(e.pointerId);
  // Yüzeye yaklaştıkça adım küçülür: uzaklık yerine yüzey yüksekliği (dist − 1) ölçeklenir
  const wheel = (e) => {
    e.preventDefault();
    const h = Math.max(0.02, cam.dist - 1) * Math.exp(e.deltaY * 0.0015);
    cam.dist = Math.min(MAX_DIST, Math.max(MIN_DIST, 1 + h));
    renderer.redraw();
  };
  const key = (e) => {
    const step = { ArrowLeft: [0.1, 0], ArrowRight: [-0.1, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] }[e.key];
    if (step) { cam.yaw += step[0]; cam.pitch = Math.max(-1.5, Math.min(1.5, cam.pitch + step[1])); renderer.redraw(); }
    if (e.key === '+' || e.key === '=') zoom(0.9);
    if (e.key === '-') zoom(1.1);
  };

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', wheel, { passive: false });
  addEventListener('keydown', key);
  return () => {
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('pointercancel', up);
    canvas.removeEventListener('wheel', wheel);
    removeEventListener('keydown', key);
  };
}
