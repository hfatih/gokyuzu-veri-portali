// Çift yıldız sahnesi (glview.js üzerinde): iki kara cisim küresi gerçek yörünge elemanlarıyla ortak
// kütle merkezi çevresinde dolanır; yörünge noktalarla çizilir. Konumlar her karede JS'te Kepler
// denkleminden hesaplanır. Yıldız boyları yörüngeye göre abartılıdır (gerçek ölçekte görünmezlerdi).

import { blackbody } from './star.js';
import { relativePosition } from '../binary/derive.js';

const BB_N = 256, BB_TMIN = 1500, BB_TMAX = 60000, PATH_N = 96;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes, uShift;
uniform vec3 uCamPos;
uniform float uTanFov, uExposure, uStars;
uniform sampler2D uBB;
uniform vec2 uBBRange;
uniform vec3 uP1, uP2;
uniform float uR1, uR2, uT1, uT2;
uniform vec3 uPath[${PATH_N}];

vec4 bb(float T) {
  float u = clamp((log(T) - uBBRange.x) / (uBBRange.y - uBBRange.x), 0.0, 1.0);
  return texture(uBB, vec2((u * ${BB_N - 1}.0 + 0.5) / ${BB_N}.0, 0.5));
}
vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453);
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
// Kromatiklik: en parlak kanal 1
vec3 chroma(float T) { vec4 b = bb(T); return b.rgb / max(b.r, max(b.g, b.b)); }
float hitSphere(vec3 ro, vec3 rd, vec3 c, float r) {
  vec3 oc = ro - c;
  float b = dot(oc, rd), h = b * b - dot(oc, oc) + r * r;
  return h < 0.0 ? -1.0 : -b - sqrt(h);
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y - uShift;
  vec3 fw = normalize(-uCamPos), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * uTanFov);
  vec3 ro = uCamPos;
  vec3 col = vec3(0.0);

  float t1 = hitSphere(ro, rd, uP1, uR1), t2 = hitSphere(ro, rd, uP2, uR2);
  float tHit = 1e9;
  // Görünen yıldızın yüzeyi. Yüzey parlaklığı göze görünen (V) ışıkla ölçeklenir: kara cisim tablosunun
  // parlaklık kanalı (yıldız sahnesiyle aynı). T⁴ toplam ışımadır; soğuk yoldaşı olduğundan parlak gösteriyordu.
  // Taban 0,02: çok sönük yoldaş (gerçek oran 10⁻⁴'e iner) ekranda kaybolmasın; ~4 kadirden büyük fark gösterilmez.
  float refL = max(exp2(bb(uT1).a), exp2(bb(uT2).a));
  float l1 = max(exp2(bb(uT1).a), 0.02 * refL), l2 = max(exp2(bb(uT2).a), 0.02 * refL);
  if (t1 > 0.0 && (t2 < 0.0 || t1 < t2)) {
    vec3 n = normalize(ro + rd * t1 - uP1); float mu = max(dot(n, -rd), 0.0);
    col = chroma(uT1) * (1.0 - 0.6 * (1.0 - mu)) * l1 / refL * 1.6; tHit = t1;
  } else if (t2 > 0.0) {
    vec3 n = normalize(ro + rd * t2 - uP2); float mu = max(dot(n, -rd), 0.0);
    col = chroma(uT2) * (1.0 - 0.6 * (1.0 - mu)) * l2 / refL * 1.6; tHit = t2;
  }
  // Işık hâleleri
  for (int k = 0; k < 2; k++) {
    vec3 c = k == 0 ? uP1 : uP2; float r = k == 0 ? uR1 : uR2, T = k == 0 ? uT1 : uT2;
    float tc = dot(c - ro, rd);
    if (tc > tHit) continue;
    float d = length(cross(c - ro, rd)) / r;
    if (d > 1.0) col += chroma(T) * (0.25 * exp(-(d - 1.0) * 4.0)) * (k == 0 ? l1 : l2) / refL;
  }
  // Yörünge (ikincilin birinciye göre yolu, kütle merkezine taşınmış)
  float path = 0.0;
  for (int k = 0; k < ${PATH_N}; k++) {
    vec3 p = uPath[k];
    float tc = dot(p - ro, rd);
    if (tc <= 0.0 || tc > tHit) continue;
    float d = length(cross(p - ro, rd)) / tc;
    path += smoothstep(0.0035, 0.0, d);
  }
  col += vec3(1.0, 0.7, 0.4) * min(path, 1.0) * 0.35;
  // Uzak yıldızlar
  vec3 cell = floor(rd * 220.0), h = hash3(cell);
  float sd = length(fract(rd * 220.0) - 0.5 - (h - 0.5) * 0.6);
  if (tHit > 1e8) col += uStars * step(0.9975, h.x) * (1.0 - smoothstep(0.0, 0.12, sd)) * bb(2500.0 + h.z * 15000.0).rgb * (0.3 + h.y);

  col *= uExposure;
  float mx = max(col.r, max(col.g, col.b));
  if (mx > 0.0) col *= aces(vec3(mx)).r / mx;
  outColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

/**
 * params: { el (Campbell), year0 (açılış yılı), q (M₂/M₁), teff1, teff2 }.
 * Sahne birimi: en büyük ayrım (a(1+e)) = 1. Gökyüzü düzlemi x (doğu) – y (kuzey), bakış yönü z.
 */
export const binaryScene = {
  id: 'binary',
  frag: FRAG,
  init(gl, view, U) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, BB_N, 1, 0, gl.RGBA, gl.FLOAT, blackbody().data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.uniform2f(U.uBBRange, Math.log(BB_TMIN), Math.log(BB_TMAX));
    gl.uniform1i(U.uBB, 0);
    return { tex, pathFor: null, path: null };
  },
  uniforms(gl, U, p, view, st) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, st.tex);
    const el = p.el, s = 1 / (el.a * (1 + el.e));
    const f1 = p.q / (1 + p.q), f2 = 1 / (1 + p.q);   // kütle merkezine göre paylar
    const toScene = (r) => [-r.x * s, r.y * s, -r.z * s];   // doğu sola (gökyüzü görünüşü), z gözlemciye
    if (st.pathFor !== p) {
      st.path = new Float32Array(PATH_N * 3);
      for (let k = 0; k < PATH_N; k++) {
        const v = toScene(relativePosition(el, el.T + el.P * k / PATH_N));
        st.path.set([v[0] * f2, v[1] * f2, v[2] * f2], k * 3);
      }
      st.pathFor = p;
    }
    const rel = toScene(relativePosition(el, p.year0 + view.t / 3.15576e7));
    gl.uniform3f(U.uP1, -rel[0] * f1, -rel[1] * f1, -rel[2] * f1);
    gl.uniform3f(U.uP2, rel[0] * f2, rel[1] * f2, rel[2] * f2);
    gl.uniform1f(U.uR1, 0.07);
    gl.uniform1f(U.uR2, 0.07 * p.q ** 0.8);
    gl.uniform1f(U.uT1, p.teff1);
    gl.uniform1f(U.uT2, p.teff2);
    gl.uniform3fv(U['uPath[0]'], st.path);
  },
  // Bir dolanım ~12 sn
  timeScale: (p) => p.el.P * 3.15576e7 / 12,
};

/**
 * deriveBinary() ve birincilin Teff'inden sahne parametreleri. İkincilin Teff'i anakol bağıntılarından kaba:
 * L ∝ M⁴ ve R ∝ M^0,8 (sahnedeki yarıçap oranı) → T⁴ ∝ L / R² ∝ M^2,4, yani T ∝ M^0,6.
 */
export function binaryVisualParams(el, bd, teff1, year0) {
  const q = bd.q.value;
  return { el, year0, q, teff1, teff2: Math.max(2400, teff1 * q ** 0.6) };
}
