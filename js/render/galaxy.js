// Gökada sahnesi (glview.js üzerinde, durağan). Nesne çerçevesi: disk y = 0 düzleminde, optik
// yarıçap 1. Işın önce diskin önündeki şişkinliği toplar, sonra disk katmanını (ışınım + toz)
// geçer, sonra diskin arkasındaki şişkinliği toz geçirgenliğiyle zayıflatarak ekler.
// Aileler (uFamily): 0 eliptik, 1 merceksi (S0), 2 sarmal, 3 düzensiz.

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes, uShift;
uniform vec3 uCamPos;
uniform float uTanFov, uExposure, uStars;
uniform int uFamily;
uniform float uBulge, uFlat, uPitch, uArms, uBar, uDust, uSeed;
uniform vec3 uOld, uYoung, uHii;

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

const float RD = 0.3;     // disk ölçek uzunluğu (optik yarıçapın ~1/3'ü)

// Şişkinlik / eliptik: yumuşatılmış Hernquist yoğunluğu (de Vaucouleurs profiline yakın izdüşüm)
float bulgeDensity(vec3 p) {
  float a = uFamily == 0 ? 0.22 : 0.07;
  vec3 q = p / vec3(1.0, uFlat, 1.0);
  float r = length(q);
  return 1.0 / ((r + 0.01) * pow(r + a, 3.0)) * a;
}

// Disk yüzey parlaklığı (eski + genç topluluk) ve toz optik derinliği, düzlemdeki (x, z) noktasında
void diskSurface(vec2 xz, out vec3 light, out float tau) {
  float R = length(xz), phi = atan(xz.y, xz.x);
  float expo = exp(-R / RD) * (1.0 - smoothstep(0.9, 1.35, R));
  vec3 s = vec3(uSeed);
  // Logaritmik sarmal: R = R0 e^(θ tan p) → kol fazı φ − ln R / tan p
  float barLen = 0.28;
  float turb = fbm(vec3(xz * 4.0, 0.0) + s) * 1.2;
  float ph = 2.0 * (phi - log(max(R, barLen)) / tan(uPitch)) + turb;
  float arm = pow(0.5 + 0.5 * cos(ph), 3.0) * smoothstep(barLen * 0.6, barLen * 1.3, R) * uArms;
  float clumps = uFamily == 3 ? pow(fbm(vec3(xz * 5.0, 1.0) + s), 2.0) * 2.5 : 0.0;
  float young = (arm + clumps) * expo * 2.2;
  // H II düğümleri: kolların üzerinde seyrek parlak lekeler
  float knots = smoothstep(0.72, 0.85, noise(vec3(xz * 28.0, 2.0) + s)) * (arm + clumps);
  // Çubuk: x ekseni boyunca uzamış eski yıldız topluluğu
  float bar = uBar * exp(-pow(abs(xz.x) / barLen, 2.0) - pow(abs(xz.y) / (0.3 * barLen), 2.0)) * 0.9;
  float old = expo * (uFamily == 3 ? 0.3 : 1.0) + bar;
  light = uOld * old * 0.55 + uYoung * young + uHii * knots * expo * 3.0;
  // Toz kolların iç kenarında yoğunlaşır (şok cephesi), merkeze doğru artar
  float lane = pow(0.5 + 0.5 * cos(ph + 0.9), 6.0);
  tau = uDust * exp(-R / (RD * 1.3)) * (0.35 + 1.6 * lane * smoothstep(0.1, 0.3, R)) * (1.0 - smoothstep(0.8, 1.3, R)) * 2.0;
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y - uShift;
  vec3 fw = normalize(-uCamPos), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * uTanFov), ro = uCamPos;

  vec3 cell = floor(rd * 220.0), hh = hash3(cell);
  float sd = length(fract(rd * 220.0) - 0.5 - (hh - 0.5) * 0.6);
  vec3 bg = uStars * step(0.997, hh.x) * (1.0 - smoothstep(0.0, 0.12, sd)) * vec3(0.85, 0.88, 1.0) * (0.3 + hh.y) * 0.6;

  // Disk düzlemiyle kesişim (ışın parametresi tD) ve eğim çarpanı (ince katmandan geçen yol)
  float tD = abs(rd.y) > 1e-5 ? -ro.y / rd.y : -1.0;
  float slant = 1.0 / max(abs(rd.y), 0.06);

  // Şişkinlik: sınırlayıcı küre içinde yürütme, disk düzleminin önü ve arkası ayrı toplanır
  float Rb = uFamily == 0 ? 1.2 : 0.7;
  float b = dot(ro, rd), c = dot(ro, ro) - Rb * Rb, disc = b * b - c;
  vec3 front = vec3(0.0), back = vec3(0.0);
  if (disc > 0.0 && uBulge > 0.0) {
    float t0 = max(0.0, -b - sqrt(disc)), t1 = -b + sqrt(disc);
    const int N = 40;
    float dt = (t1 - t0) / float(N), t = t0 + dt * hash3(vec3(gl_FragCoord.xy, 3.0)).x;
    for (int i = 0; i < N; i++) {
      float rho = bulgeDensity(ro + rd * t) * dt;
      if (uFamily != 0 && tD > 0.0 && t > tD) back += rho * uOld; else front += rho * uOld;
      t += dt;
    }
    float k = uFamily == 0 ? 0.08 : 0.05 * uBulge / 0.25;
    front *= k; back *= k;
  }

  vec3 col = front;
  float T = 1.0;
  if (uFamily != 0 && tD > 0.0) {
    vec3 p = ro + rd * tD;
    if (length(p.xz) < 1.4) {
      vec3 light; float tau;
      diskSurface(p.xz, light, tau);
      float tr = exp(-tau * slant);
      // Disk ışığı katman boyunca toplanır; kendi tozu ışığın yarısını örter (yaklaşık)
      col += light * min(slant, 8.0) * 0.12 * (0.5 + 0.5 * tr);
      T = tr;
    }
  }
  col += back * T + bg * T;
  col *= uExposure;
  float mx = max(col.r, max(col.g, col.b));
  if (mx > 0.0) col *= aces(vec3(mx)).r / mx;
  outColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

/** Gökada sahnesi. params: galaxyVisualParams() (galaxy/visual.js). Durağan. */
export const galaxyScene = {
  id: 'galaxy',
  frag: FRAG,
  static: true,
  uniforms(gl, U, p) {
    gl.uniform1i(U.uFamily, p.family);
    gl.uniform1f(U.uBulge, p.bulge);
    gl.uniform1f(U.uFlat, p.flat);
    gl.uniform1f(U.uPitch, p.pitch);
    gl.uniform1f(U.uArms, p.arms);
    gl.uniform1f(U.uBar, p.bar);
    gl.uniform1f(U.uDust, p.dust);
    gl.uniform1f(U.uSeed, p.seed);
    gl.uniform3f(U.uOld, ...p.old);
    gl.uniform3f(U.uYoung, ...p.young);
    gl.uniform3f(U.uHii, ...p.hii);
  },
  timeScale: () => 0,
};
