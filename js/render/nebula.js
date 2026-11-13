// Bulutsu sahnesi (glview.js üzerinde, durağan). Birim küre içinde hacimsel ışın yürütme:
// her adımda emisyon çizgisi ışınımı eklenir, toz soğurması geçirgenliği düşürür (mavi daha çok
// soğurulur: toz arkasındaki ışık kızarır). Birleşme çizgilerinin ışınımı elektron yoğunluğunun
// karesiyle orantılıdır; Hα/Hβ = 2,86 (B durumu, 10⁴ K).
// Türler (uKind): 0 H II, 1 gezegenimsi, 2 süpernova kalıntısı, 3 yansıma, 4 karanlık bulutsu.

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes, uShift;
uniform vec3 uCamPos;
uniform float uTanFov, uExposure, uStars;
uniform int uKind;
uniform float uAxis, uAngle, uSeed, uSedov, uBipolar;
uniform vec3 uHa, uO3, uHb, uS2, uScat, uStar;

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
float ridged(vec3 x) { float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { s += a * (1.0 - abs(2.0 * noise(x) - 1.0)); x *= 2.1; a *= 0.5; } return s; }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

const vec3 EXT = vec3(0.78, 1.0, 1.32);   // A_λ / A_V: R, G, B (Cardelli+ 1989)
vec3 gRd;                                  // ışın yönü (saçılma açısı için)

// Hacim örneği: emis (ışınım, doğrusal RGB), dönüş: soğurma katsayısı
float sampleNeb(vec3 p, out vec3 emis) {
  vec3 s = vec3(uSeed, uSeed * 0.7, uSeed * 1.3);
  float r = length(p);
  emis = vec3(0.0);
  if (uKind == 1) {
    // Gezegenimsi: elipsoit kabuk. İyonlaşma katmanları: içte [O III], dışta Hα + [N II]
    float c = cos(uAngle), sn = sin(uAngle);
    vec3 q = vec3(c * p.x + sn * p.y, -sn * p.x + c * p.y, p.z);
    // Uzamış gezegenimsiler çoğunlukla çift kutupludur: bel ekvatorda dar, loblar kutup ekseninde (x) uzun
    float ct = abs(q.x) / max(length(q), 1e-4);
    float e = mix(length(q / vec3(1.0, uAxis, 1.0)), length(q) / (0.42 + 0.78 * pow(ct, 1.5)), uBipolar);
    float clump = 0.55 + 0.9 * fbm(p * 5.0 + s);
    float shell = exp(-pow((e - 0.72) / 0.13, 2.0)) * clump;
    float inner = exp(-pow((e - 0.6) / 0.12, 2.0)) * (0.6 + 0.6 * fbm(p * 3.0 + s)) + 0.05 * (1.0 - smoothstep(0.0, 0.6, e));
    float halo = 0.06 * (1.0 - smoothstep(0.8, 1.0, e)) * smoothstep(0.75, 0.9, e);
    emis = (uO3 * inner * 1.0 + uHb * inner * 0.2 + uHa * (shell * smoothstep(0.6, 0.8, e) * 1.6 + halo)) * 0.45;
    return 0.0;
  }
  if (uKind == 0) {
    // H II: iyonlaşma sınırlı bölge. İyonlaşma cephesi her yönde farklı uzaklıkta durur (yoğun gaz yönünde
    // yakın); içi iyonlaşmış ve ışır, cephede sıkışmış gaz parlak bir kenar yapar ([S II] burada güçlenir),
    // dışı nötr ve tozludur: ışımaz, arkasındaki ışığı örter. O⁺⁺ yalnız yıldıza yakın bölgede bulunur.
    vec3 dir = p / max(r, 1e-4);
    float rf = 0.78 * (0.62 + 0.55 * fbm(dir * 1.7 + s));
    float fall = 1.0 - smoothstep(0.55, 1.0, r);
    float dens = pow(fbm(p * 2.6 + s) * 2.1, 1.6) * fall;
    dens *= smoothstep(0.04, 0.22, length(p - vec3(0.08, 0.05, 0.1)));   // yıldız rüzgârının açtığı boşluk
    float ion = 1.0 - smoothstep(rf - 0.04, rf + 0.02, r);
    float rim = exp(-pow((r - rf) / 0.035, 2.0));
    float n2 = dens * dens;
    float o3 = exp(-dot(p, p) / (0.35 * rf * rf));
    emis = ((uHa + uHb * 0.35) * (ion + 1.6 * rim) + uS2 * (0.08 * ion + 0.9 * rim)) * n2 * 0.75 + uO3 * o3 * ion * n2 * 1.1;
    float dust = pow(fbm(p * 3.4 + s + 31.0), 3.0) * fall;
    return dust * mix(14.0, 3.0, ion);
  }
  if (uKind == 2) {
    // Süpernova kalıntısı: şok kabuğunda ince lifler; Hα + [S II] kırmızı, dış kenarda [O III]
    // Sedov evresinde süpürülen gaz ince bir kabukta toplanır (kalınlık ≈ R/12); serbest genişlemede
    // kabuk kalın, içi ağır elementçe zengin püskürük topaklarıyla doludur ([O III])
    float band = exp(-pow((r - mix(0.72, 0.86, uSedov)) / mix(0.2, 0.085, uSedov), 2.0));
    float ej = (1.0 - uSedov) * pow(ridged(p * 5.0 + s + 40.0), 6.0) * 3.0 * (1.0 - smoothstep(0.3, 0.7, r));
    float fil = pow(ridged(p * 7.0 + s), 10.0) * 9.0;
    float o3 = pow(ridged(p * 3.0 + s + 17.0), 7.0) * 3.0 * smoothstep(0.75, 0.95, r);
    emis = ((uHa + uS2 * 0.6) * fil * band * 1.6 + uO3 * (o3 * band + ej)) * mix(0.4, 1.0, uSedov);
    return 0.0;
  }
  if (uKind == 3) {
    // Yansıma: toz, yıldız ışığını mavi saçar (parlaklık yıldıza uzaklığın karesiyle düşer)
    float dens = fbm(p * 2.5 + s) * (1.0 - smoothstep(0.2, 1.0, r));
    float illum = 0.06 / (dot(p, p) + 0.03);
    // Toz ileri doğru saçar (Henyey–Greenstein, g = 0,6): yıldızın önündeki toz arkasındakinden parlak
    float cosT = dot(p / max(r, 1e-4), -gRd);
    float hg = 0.64 / pow(1.36 - 1.2 * cosT, 1.5);
    emis = uScat * dens * illum * hg * 1.6;
    return dens * 1.2;
  }
  // Karanlık bulutsu: arkada parlak Hα tabakası, önde ışığı soğuran yoğun toz
  float dens = smoothstep(0.42, 0.62, fbm(p * 2.0 + s)) * (1.0 - smoothstep(0.45, 1.0, r));
  float sheet = (1.0 - smoothstep(-0.45, -0.15, p.z)) * (1.0 - smoothstep(0.6, 1.0, r));
  emis = uHa * sheet * (0.35 + 0.5 * fbm(p * 3.0 + s + 5.0));
  return dens * 9.0 * step(-0.2, p.z);
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y - uShift;
  vec3 fw = normalize(-uCamPos), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * uTanFov), ro = uCamPos;

  // Arka plan yıldızları
  vec3 cell = floor(rd * 220.0), hh = hash3(cell);
  float sd = length(fract(rd * 220.0) - 0.5 - (hh - 0.5) * 0.6);
  vec3 bg = uStars * step(0.997, hh.x) * (1.0 - smoothstep(0.0, 0.12, sd)) * vec3(0.85, 0.88, 1.0) * (0.3 + hh.y) * 0.6;

  float b = dot(ro, rd), c = dot(ro, ro) - 1.0, disc = b * b - c;
  vec3 col = vec3(0.0), T = vec3(1.0);
  gRd = rd;
  if (disc > 0.0) {
    float t0 = max(0.0, -b - sqrt(disc)), t1 = -b + sqrt(disc);
    const int N = 64;
    float dt = (t1 - t0) / float(N);
    float t = t0 + dt * hash3(vec3(gl_FragCoord.xy, 1.0)).x;   // bantlanmayı kıran titreşim
    for (int i = 0; i < N; i++) {
      vec3 e;
      float k = sampleNeb(ro + rd * t, e);
      col += T * e * dt;
      T *= exp(-k * EXT * dt);
      if (T.r < 0.02) break;
      t += dt;
    }
    // Merkez yıldızı (gezegenimsi ve yansıma bulutsusunda): soğurmadan geçen ışık
    if (uKind == 1 || uKind == 3) {
      float dc = length(cross(ro, rd));
      col += T * uStar * exp(-dc * dc / 0.00012) * 3.0;
    }
  }
  col += bg * T.g;
  col *= uExposure;
  float mx = max(col.r, max(col.g, col.b));
  if (mx > 0.0) col *= aces(vec3(mx)).r / mx;
  outColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

/** Bulutsu sahnesi. params: nebulaVisualParams() çıktısı (nebula/visual.js). Durağan: zaman akmaz. */
export const nebulaScene = {
  id: 'nebula',
  frag: FRAG,
  static: true,
  uniforms(gl, U, p) {
    gl.uniform1i(U.uKind, p.kind);
    gl.uniform1f(U.uAxis, p.axis);
    gl.uniform1f(U.uAngle, p.angle);
    gl.uniform1f(U.uSeed, p.seed);
    gl.uniform1f(U.uSedov, p.sedov);
    gl.uniform1f(U.uBipolar, p.bipolar);
    gl.uniform3f(U.uHa, ...p.ha);
    gl.uniform3f(U.uO3, ...p.o3);
    gl.uniform3f(U.uHb, ...p.hb);
    gl.uniform3f(U.uS2, ...p.s2);
    gl.uniform3f(U.uScat, ...p.scatter);
    gl.uniform3f(U.uStar, ...p.star);
  },
  timeScale: () => 0,
};
