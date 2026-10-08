// Kara delik sahnesi (glview.js üzerinde). Birimler: Schwarzschild yarıçapı r_s = 1, c = 1.
// Her piksel için ışık yolu jeodezik olarak izlenir: Schwarzschild'de boş jeodeziğin uzaysal şekli
// x″ = −(3/2) h² x / r⁵ (h = |x × v|, korunur) denklemini sağlar. Işın ince diski (y = 0, r_ISCO = 3
// ile 12 r_s arası) kestiği her noktada ışınım ekler; olay ufkuna düşen ışın karanlık kalır, kaçan
// ışın bükülmüş yönde arka plan yıldızlarını görür.

import { blackbody } from './star.js';

const BB_N = 256, BB_TMIN = 1500, BB_TMAX = 60000;
const SCALE = 12;            // dünya birimi başına r_s: diskin dış kenarı dünya biriminde 1

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes, uShift;
uniform vec3 uCamPos;
uniform float uTanFov, uExposure, uStars;
uniform sampler2D uBB;
uniform vec2 uBBRange;
uniform float uTime, uTmax, uDiskOn;

const float RIN = 3.0, ROUT = 12.0, SCALE = ${SCALE.toFixed(1)};

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
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

vec3 stars(vec3 d) {
  vec3 cell = floor(d * 260.0), h = hash3(cell);
  float sd = length(fract(d * 260.0) - 0.5 - (h - 0.5) * 0.6);
  return uStars * step(0.996, h.x) * (1.0 - smoothstep(0.0, 0.14, sd)) * bb(2500.0 + h.z * 15000.0).rgb * (0.4 + h.y);
}

// İnce disk (Shakura–Sunyaev) sıcaklık profili, en yüksek değeri 1 olacak biçimde: (r⁻³(1 − √(r_in/r)))^¼
float profile(float r) {
  float p = pow(max(pow(r, -3.0) * (1.0 - sqrt(RIN / r)), 0.0), 0.25);
  float rp = RIN * 49.0 / 36.0;
  return p / pow(pow(rp, -3.0) * (1.0 - sqrt(RIN / rp)), 0.25);
}

// Diskin p noktasındaki ışınımı ve örtücülüğü; dir: ışının izlenen yönü (foton tersine gelir)
vec4 disk(vec3 p, vec3 dir) {
  float r = length(p.xz);
  if (r < RIN || r > ROUT) return vec4(0.0);
  // Kepler kesmesi: her yarıçap kendi açısal hızıyla döner (Ω = √(0,5/r³), r_s = c = 1)
  float phi = atan(p.z, p.x) - sqrt(0.5 / (r * r * r)) * uTime;
  float tex = fbm(vec3(cos(phi) * r * 0.9, sin(phi) * r * 0.9, r * 1.7));
  // Doppler: yörünge hızı β = √(0,5/(r − 1)) (yerel durgun gözlemciye göre), φ yönünde
  vec3 vdir = normalize(vec3(-p.z, 0.0, p.x));
  float beta = min(sqrt(0.5 / (r - 1.0)), 0.99), gam = 1.0 / sqrt(1.0 - beta * beta);
  float delta = 1.0 / (gam * (1.0 - beta * dot(vdir, -normalize(dir))));
  float g = delta * sqrt(1.0 - 1.0 / r);                         // + kütleçekimsel kırmızıya kayma
  float T = uTmax * profile(r) * (0.75 + 0.5 * tex);
  float Tobs = g * T;                                            // kara cisim g·T'de kara cisim olarak görünür
  vec3 c = bb(Tobs).rgb / max(bb(Tobs).r, max(bb(Tobs).g, bb(Tobs).b));
  float I = pow(Tobs / uTmax, 4.0);                              // bolometrik ∝ T⁴
  float alpha = 0.92 * smoothstep(RIN, RIN + 0.4, r) * (1.0 - smoothstep(ROUT - 3.0, ROUT, r)) * (0.55 + 0.45 * tex);
  return vec4(c * I * 0.7, alpha);
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y - uShift;
  vec3 fw = normalize(-uCamPos), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  vec3 v = normalize(fw + (uv.x * rt + uv.y * up) * uTanFov);
  vec3 x = uCamPos * SCALE;
  vec3 hv = cross(x, v);
  float h2 = dot(hv, hv);

  vec3 col = vec3(0.0);
  float T = 1.0;
  bool captured = false;
  // Uzaktan geçen ışın için bükülme ihmal edilebilir (b > 40 r_s)
  if (sqrt(h2) < 40.0) {
    for (int i = 0; i < 400; i++) {
      float r = length(x);
      if (r < 1.0) { captured = true; break; }
      if (r > 80.0 && dot(x, v) > 0.0) break;
      float dt = clamp(0.06 * r, 0.015, 2.5);
      // Hız Verlet adımı
      vec3 a = -1.5 * h2 * x / pow(r, 5.0);
      vec3 xn = x + v * dt + 0.5 * a * dt * dt;
      vec3 an = -1.5 * h2 * xn / pow(length(xn), 5.0);
      vec3 vn = v + 0.5 * (a + an) * dt;
      if (uDiskOn > 0.5 && x.y * xn.y < 0.0) {
        vec3 p = mix(x, xn, x.y / (x.y - xn.y));
        vec4 e = disk(p, v);
        col += T * e.rgb * e.a;
        T *= 1.0 - e.a;
        if (T < 0.02) break;
      }
      x = xn; v = vn;
    }
  }
  if (!captured) col += T * stars(normalize(v));
  col *= uExposure;
  float mx = max(col.r, max(col.g, col.b));
  if (mx > 0.0) col *= aces(vec3(mx)).r / mx;
  outColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

const C = 2.998e8;

/**
 * Kara delik sahnesi. params: { rsM (m), tmax (K), iscoPeriodS }.
 * Varsayılan zaman hızı: ISCO'daki bir dolanım ~8 sn.
 */
export const blackHoleScene = {
  id: 'blackhole',
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
    return { tex };
  },
  uniforms(gl, U, p, view, { tex }) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1f(U.uTime, view.t * C / p.rsM);
    gl.uniform1f(U.uTmax, p.tmax);
    gl.uniform1f(U.uDiskOn, 1);
  },
  timeScale: (p) => p.iscoPeriodS / 8,
};
