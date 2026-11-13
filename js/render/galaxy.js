// Gökada sahnesi (glview.js üzerinde). Nesne çerçevesi: disk y = 0 düzleminde, optik yarıçap (R25) = 1.
// Disk kalınlığı olan bir katmandır: yıldızlar yarıçapta üstel, düşeyde sech² dağılır (van der Kruit &
// Searle 1981); genç yıldızlar ve toz yarı kalınlıkta daha ince bir katmandadır (Xilouris+ 1999). Işın bu
// katmanı adım adım geçer: her adımda ışınım eklenir, toz geçirgenliği dalga boyuna göre düşürür (mavi
// daha çok soğurulur, toz şeritleri kızıl-kahve görünür). Şişkinlik Sérsic profilinin üç boyutlu karşılığıdır
// (Prugniel & Simien 1997); diskin önü ve arkası ayrı toplanır, arkadaki ışık tozdan geçer.
// Dönme: kol ve çubuk deseni Ωp ile katı döner (yoğunluk dalgası); yıldız ve gaz düz dönme eğrisiyle
// Ω(R) = V/√(R² + Rc²) döner, desenin içinden akar. Madde çerçevesi iki evreli çapraz geçişle örneklenir
// (kayma sınırsız birikmesin diye).
// Aileler (uFamily): 0 eliptik, 1 merceksi (S0), 2 sarmal, 3 düzensiz.

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes, uShift;
uniform vec3 uCamPos;
uniform float uTanFov, uExposure, uStars;
uniform int uFamily;
uniform float uFlat, uPitch, uArms, uArmN, uFloc, uBar, uDust, uSeed;
uniform float uSersicN, uSersicP, uSersicB, uBulgeRe, uBulgeAmp;
uniform float uHz, uYoungFrac, uT, uOmegaP;
uniform vec3 uOld, uYoung, uHii;

vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453);
}
// Üç bağımsız kanallı gürültü: aynı kafes okumalarından üç desen (kol dalgası, yumak, toz)
vec3 noise3(vec3 x) {
  vec3 i = floor(x), f = fract(x), u = f * f * (3.0 - 2.0 * f);
  vec3 a = hash3(i), b = hash3(i + vec3(1,0,0)), c = hash3(i + vec3(0,1,0)), d = hash3(i + vec3(1,1,0));
  vec3 e = hash3(i + vec3(0,0,1)), f1 = hash3(i + vec3(1,0,1)), g = hash3(i + vec3(0,1,1)), h = hash3(i + vec3(1,1,1));
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, f1, u.x), mix(g, h, u.x), u.y), u.z);
}
vec3 fbm3(vec3 x) { vec3 s = vec3(0.0); float a = 0.5; for (int i = 0; i < 3; i++) { s += a * noise3(x); x *= 2.03; a *= 0.5; } return s / 0.875; }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

const float RD = 0.3;      // disk ölçek uzunluğu: Freeman diskinde R25 ≈ 3,2 h
const float RC = 0.08;     // dönme eğrisinin düzleştiği yarıçap
const float TAU = 2.6;     // madde çerçevesi evre uzunluğu (uT biriminde)
const float BAR = 0.28;    // çubuk yarı uzunluğu
const vec3 EXT = vec3(0.78, 1.0, 1.32);   // A_λ / A_V: R, G, B (Cardelli+ 1989, R_V = 3,1)

// Şişkinlik / eliptik: Sérsic profilinin hacim yoğunluğu, ρ ∝ x^−p e^(−b x^(1/n)), x = r / Re
float bulgeDensity(vec3 p) {
  float x = max(length(p / vec3(1.0, uFlat, 1.0)), 0.004) / uBulgeRe;
  return uBulgeAmp * pow(x, -uSersicP) * exp(-uSersicB * pow(x, 1.0 / uSersicN));
}

// Disk: p noktasında ışınım (birim hacim) ve toz soğurma katsayısı (V bandı)
void diskSample(vec3 p, out vec3 emis, out float kappa) {
  float R = length(p.xz);
  float edge = 1.0 - smoothstep(0.9, 1.35, R);
  float hy = 0.5 * uHz;
  float sOld = 1.0 / cosh(min(abs(p.y) / uHz, 20.0)), sThin = 1.0 / cosh(min(abs(p.y) / hy, 20.0));
  sOld *= sOld / (2.0 * uHz); sThin *= sThin / (2.0 * hy);   // düşey integrali 1
  float lnR = log(max(R, 0.05));
  float cotP = 1.0 / tan(uPitch);

  // Madde çerçevesi: yerel açısal hızla dönen gürültü, iki evrenin çapraz geçişi
  float omega = 1.0 / sqrt(R * R + RC * RC);
  vec3 n = vec3(0.0); float kn = 0.0;
  for (int k = 0; k < 2; k++) {
    float u = uT / TAU + 0.5 * float(k), f = fract(u), w = 1.0 - abs(2.0 * f - 1.0);
    vec2 xm = rot(p.xz, omega * (f - 0.5) * TAU);
    vec3 s = vec3(uSeed + floor(u) * 7.3 + float(k) * 3.1);
    // Sarmalda gürültü logaritmik sarmal boyunca uzar (kayan lekeler kısa kol parçalarına dönüşür);
    // düzensiz gökadada yönsüzdür
    float a = atan(xm.y, xm.x) - lnR * cotP;
    vec3 q = uFamily == 3 ? vec3(xm * 5.0, 1.0) : vec3(cos(a) * 4.0, sin(a) * 4.0, lnR * 3.2);
    n += w * fbm3(q + s);
    kn += w * noise3(vec3(xm * 26.0, 2.0) + s).x;
  }

  // Desen çerçevesi: kollar ve çubuk Ωp ile katı döner
  vec2 xp = rot(p.xz, uOmegaP * uT);
  float ph = uArmN * (atan(xp.y, xp.x) - log(max(R, BAR)) * cotP) + (n.x - 0.5) * 2.6;
  float grand = pow(0.5 + 0.5 * cos(ph), 5.0) / 0.2461;                    // azimut ortalaması 1
  float floc = smoothstep(0.42, 0.72, n.y) * 3.2;
  float inner = smoothstep(BAR * 0.6, BAR * 1.3, R);
  float arm = uFamily == 3 ? pow(n.y, 2.0) * 4.5 : mix(1.0, mix(grand, floc, uFloc) * inner, uArms);

  // Yaşlı disk + çubuk; genç topluluğun ölçek uzunluğu daha büyük (diskler dışa doğru mavileşir)
  float bar = uBar * 0.9 * exp(-pow(xp.x / BAR, 2.0) - pow(xp.y / (0.3 * BAR), 2.0));
  float old = (1.0 - uYoungFrac) * exp(-R / RD) + bar;
  // Yıldız oluşumu topaklıdır: genç ışık kol boyunca dev bulut ölçeğinde parlayıp söner
  float young = uYoungFrac / 1.5625 * exp(-R / (1.25 * RD)) * arm * (0.4 + 1.4 * smoothstep(0.3, 0.7, n.z));
  float knots = smoothstep(0.72, 0.85, kn) * young * 2.5;                   // H II bölgeleri kolların üstünde
  emis = (uOld * old * sOld + (uYoung * young + uHii * knots) * sThin) * edge;

  // Toz: büyük desenli kolların iç kenarında (şok cephesi), yumak kollarda lekeler boyunca
  float lane = pow(0.5 + 0.5 * cos(ph + 0.9), 6.0) / 0.2256;
  float pat = uFamily == 3 ? n.z * 2.0 : mix(1.0, mix(lane, smoothstep(0.4, 0.7, 1.0 - n.z) * 2.8, uFloc) * smoothstep(0.1, 0.3, R), max(uArms, 0.3));
  kappa = uDust * 0.9 * exp(-R / (1.4 * RD)) * (0.35 + 0.65 * pat) * edge * sThin;
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y - uShift;
  vec3 fw = normalize(-uCamPos), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * uTanFov), ro = uCamPos;
  float jit = hash3(vec3(gl_FragCoord.xy, 3.0)).x;

  vec3 cell = floor(rd * 220.0), hh = hash3(cell);
  float sd = length(fract(rd * 220.0) - 0.5 - (hh - 0.5) * 0.6);
  vec3 bg = uStars * step(0.997, hh.x) * (1.0 - smoothstep(0.0, 0.12, sd)) * vec3(0.85, 0.88, 1.0) * (0.3 + hh.y) * 0.6;

  bool disk = uFamily != 0;
  float b = dot(ro, rd), r2 = dot(ro, ro);
  float tD = abs(rd.y) > 1e-5 ? -ro.y / rd.y : -1.0;   // orta düzlemle kesişim

  // Şişkinlik: adımlar ışının merkeze en yakın geçtiği yerde sıklaşır (t = tc + w sinh u)
  vec3 front = vec3(0.0), back = vec3(0.0);
  float Rb = disk ? 1.0 : 1.45, dB = b * b - r2 + Rb * Rb;
  if (dB > 0.0 && uBulgeAmp > 0.0) {
    float t0 = max(0.0, -b - sqrt(dB)), t1 = -b + sqrt(dB), tc = -b;
    float w = max(sqrt(max(r2 - b * b, 0.0)), 0.02);
    float u0 = asinh((t0 - tc) / w), u1 = asinh((t1 - tc) / w);
    const int NB = 32;
    float du = (u1 - u0) / float(NB), u = u0 + du * jit;
    for (int i = 0; i < NB; i++) {
      float t = tc + w * sinh(u);
      float rho = bulgeDensity(ro + rd * t) * w * cosh(u) * du;
      if (disk && tD > 0.0 && t > tD) back += rho * uOld; else front += rho * uOld;
      u += du;
    }
  }

  // Disk katmanı: |y| < 5 hz ile sınır küresinin kesişimi
  vec3 col = front, T = vec3(1.0);
  float dS = b * b - r2 + 1.45 * 1.45;
  if (disk && dS > 0.0) {
    float t0 = max(0.0, -b - sqrt(dS)), t1 = -b + sqrt(dS);
    float H = 5.0 * uHz;
    if (abs(rd.y) > 1e-5) {
      float ta = (-H - ro.y) / rd.y, tb = (H - ro.y) / rd.y;
      t0 = max(t0, min(ta, tb)); t1 = min(t1, max(ta, tb));
    } else if (abs(ro.y) > H) t1 = t0;
    if (t1 > t0) {
      const int N = 28;
      float dt = (t1 - t0) / float(N), t = t0 + dt * jit;
      for (int i = 0; i < N; i++) {
        vec3 e; float k;
        diskSample(ro + rd * t, e, k);
        col += T * e * dt;
        T *= exp(-k * EXT * dt);
        t += dt;
      }
    }
  }
  col += back * T + bg * T.g;
  col *= 0.45 * uExposure;
  float mx = max(col.r, max(col.g, col.b));
  if (mx > 0.0) col *= aces(vec3(mx)).r / mx;
  outColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

/**
 * Gökada sahnesi. params: galaxyVisualParams() (galaxy/visual.js). Diskli gökada döner
 * (varsayılan hız: yarı optik yarıçapta bir tur ~75 sn); eliptik durağandır.
 */
export const galaxyScene = {
  id: 'galaxy',
  frag: FRAG,
  static: (p) => p.family === 0,
  uniforms(gl, U, p, view) {
    gl.uniform1i(U.uFamily, p.family);
    gl.uniform1f(U.uFlat, p.flat);
    gl.uniform1f(U.uPitch, p.pitch);
    gl.uniform1f(U.uArms, p.arms);
    gl.uniform1f(U.uArmN, p.armN);
    gl.uniform1f(U.uFloc, p.floc);
    gl.uniform1f(U.uBar, p.bar);
    gl.uniform1f(U.uDust, p.dust);
    gl.uniform1f(U.uSeed, p.seed);
    gl.uniform1f(U.uSersicN, p.sersic.n);
    gl.uniform1f(U.uSersicP, p.sersic.p);
    gl.uniform1f(U.uSersicB, p.sersic.b);
    gl.uniform1f(U.uBulgeRe, p.sersic.re);
    gl.uniform1f(U.uBulgeAmp, p.sersic.amp);
    gl.uniform1f(U.uHz, p.hz);
    gl.uniform1f(U.uYoungFrac, p.youngFrac);
    gl.uniform1f(U.uT, view.t * p.rotRate);
    gl.uniform1f(U.uOmegaP, p.omegaP);
    gl.uniform3f(U.uOld, ...p.old);
    gl.uniform3f(U.uYoung, ...p.young);
    gl.uniform3f(U.uHii, ...p.hii);
  },
  timeScale: (p) => (p.family === 0 ? 0 : Math.PI / p.rotRate / 75),
};
