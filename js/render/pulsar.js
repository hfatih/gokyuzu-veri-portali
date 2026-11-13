// Pulsar sahnesi (glview.js üzerinde): deniz feneri modeli. Birim: ışık silindiri yarıçapı
// R_LC = cP/2π = 1. Dönme ekseni y; manyetik eksen ondan α kadar eğik ve gerçek dönemle döner.
// Hacimsel ışın yürütmeyle üç şey toplanır: manyetik kutuplardan çıkan iki radyo ışını konisi
// (yarı genişlik Rankin 1993), kapalı dipol alan çizgileri (r = L sin²θ, L < R_LC) ve ışık
// silindiri. Nötron yıldızı analitik küre; kutup başlıkları (θ_pc = asin √(R/R_LC)) daha sıcak.

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes, uShift;
uniform vec3 uCamPos;
uniform float uTanFov, uExposure, uStars;
uniform float uPhase, uAlpha, uRho, uRns, uCap, uCompact;
uniform vec3 uNs;

const float BOUND = 1.6;
const vec3 BEAM = vec3(0.55, 0.45, 1.0), FIELD = vec3(0.35, 0.6, 1.0), LC = vec3(0.55, 0.65, 0.85);

vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453);
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

vec3 stars(vec3 d) {
  vec3 cell = floor(d * 260.0), h = hash3(cell);
  float sd = length(fract(d * 260.0) - 0.5 - (h - 0.5) * 0.6);
  return uStars * step(0.996, h.x) * (1.0 - smoothstep(0.0, 0.14, sd)) * mix(vec3(1.0, 0.8, 0.6), vec3(0.7, 0.8, 1.0), h.z) * (0.4 + h.y);
}

// p noktasındaki ışınım; m manyetik eksen, e1 ve e2 ona dik taban
vec3 emit(vec3 p, vec3 m, vec3 e1, vec3 e2) {
  float r = length(p);
  if (r < uRns) return vec3(0.0);
  float c = dot(p, m) / r, s2 = max(1.0 - c * c, 1e-4);
  // Radyo ışınları: ±m çevresinde ρ yarı genişlikli koniler
  float th = acos(min(abs(c), 1.0));
  // Aynı güç geniş koniye yayılınca yüzey parlaklığı ∝ 1/ρ² (milisaniye pulsarında ρ ~ 75°)
  vec3 e = BEAM * 1.6 * min(1.0, pow(0.5 / uRho, 2.0)) * exp(-pow(th / (0.55 * uRho), 2.0)) * smoothstep(uRns, uRns * 4.0, r) * exp(-0.8 * r)
    * (1.0 - smoothstep(1.0, BOUND - 0.05, r));   // sınır küresinde kesik görünmesin
  // Kapalı dipol çizgileri: L = r / sin²θ kabukları (0,3 / 0,55 / 0,8 R_LC) × 60°'lik altı düzlem
  float L = r / s2;
  float Lk = clamp(0.3 + 0.25 * floor((L - 0.3) / 0.25 + 0.5), 0.3, 0.8);
  float k = 3.14159265 / 3.0, phi = atan(dot(p, e2), dot(p, e1));
  float dphi = (fract(phi / k + 0.5) - 0.5) * k;
  float dPlane = r * sqrt(s2) * abs(sin(dphi)), dShell = abs(L - Lk) * s2;
  float w = 0.008 + 0.012 * r;
  e += FIELD * 0.5 * exp(-(dPlane * dPlane + dShell * dShell) / (w * w)) * step(L, 0.95);
  // Işık silindiri: eş dönen plazmanın ışık hızına ulaştığı yüzey
  e += LC * 0.12 * exp(-pow((length(p.xz) - 1.0) / 0.012, 2.0)) * (1.0 - smoothstep(0.2, 0.9, abs(p.y)));
  return e;
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y - uShift;
  vec3 ro = uCamPos, fw = normalize(-ro), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * uTanFov);
  vec3 m = vec3(sin(uAlpha) * cos(uPhase), cos(uAlpha), sin(uAlpha) * sin(uPhase));
  vec3 e1 = normalize(cross(vec3(0, 1, 0), m)), e2 = cross(m, e1);

  vec3 col = vec3(0.0);
  float b = dot(ro, rd), cc = dot(ro, ro);
  float hB = b * b - cc + BOUND * BOUND;
  // Nötron yıldızı ışığı büker: uzaktan R / √(1 − u) yarıçaplı görünür ve yüzeyin yarısından fazlası seçilir
  float rApp = uRns / sqrt(1.0 - uCompact);
  float tNs = 1e9;
  float hN = b * b - cc + rApp * rApp;
  if (hN > 0.0) tNs = -b - sqrt(hN);
  if (hB > 0.0) {
    float t0 = max(0.0, -b - sqrt(hB)), t1 = min(-b + sqrt(hB), tNs);
    const int N = 140;
    float dt = (t1 - t0) / float(N);
    float t = t0 + dt * hash3(vec3(gl_FragCoord.xy, 1.0)).x;
    for (int i = 0; i < N; i++) { col += emit(ro + rd * t, m, e1, e2) * dt; t += dt; }
  }
  if (tNs < 1e8) {
    // Nötron yıldızı yüzeyi: hafif kenar kararması, manyetik kutup başlıkları daha parlak.
    // Işının merkeze en yakın geçiş vektörü bv; çıkış açısı sin α = |bv| / R_görünen. Yüzey noktasının
    // bakış doğrultusuna açısı ψ (Beloborodov 2002): 1 − cos α = (1 − cos ψ)(1 − u). ψ > 90° olabilir:
    // yıldızın arka yüzü de görünür.
    vec3 bv = ro - rd * b;
    float sa = min(length(bv) / rApp, 1.0), mu = sqrt(1.0 - sa * sa);
    float cpsi = 1.0 - (1.0 - mu) / (1.0 - uCompact), spsi = sqrt(max(1.0 - cpsi * cpsi, 0.0));
    vec3 n = normalize(-rd * cpsi + bv / max(length(bv), 1e-6) * spsi);
    float cap = smoothstep(cos(uCap * 1.6), cos(uCap), abs(dot(n, m)));
    col += uNs * (0.6 + 0.4 * mu) * (1.4 + 3.0 * cap);
  } else {
    // Yıldızın ışık hâlesi ve uzak yıldızlar
    float bimp = length(cross(ro, rd)) / rApp;
    col += uNs * 0.25 / (bimp * bimp * bimp) + stars(rd);
  }
  col *= uExposure;
  float mx = max(col.r, max(col.g, col.b));
  if (mx > 0.0) col *= aces(vec3(mx)).r / mx;
  outColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

/**
 * Pulsar sahnesi. params: pulsarVisualParams() { periodS, alpha, rho, rNs, cap, compact, ns }.
 * Varsayılan zaman hızı: bir dönüş 2 sn (Yengeç 33 ms'de döner, gerçek hızda çakar gibi görünür).
 */
export const pulsarScene = {
  id: 'pulsar',
  frag: FRAG,
  uniforms(gl, U, p, view) {
    gl.uniform1f(U.uPhase, (view.t / p.periodS % 1) * 2 * Math.PI);
    gl.uniform1f(U.uAlpha, p.alpha);
    gl.uniform1f(U.uRho, p.rho);
    gl.uniform1f(U.uRns, p.rNs);
    gl.uniform1f(U.uCap, p.cap);
    gl.uniform1f(U.uCompact, p.compact);
    gl.uniform3fv(U.uNs, p.ns);
  },
  timeScale: (p) => p.periodS / 2,
};
