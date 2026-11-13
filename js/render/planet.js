// Gezegen sahnesi (glview.js üzerinde). Gezegen çerçevesi: dönme ekseni y, halka düzlemi y = 0,
// eksen eğikliği x çevresinde (izleyiciye doğru) uygulanır. Işık ana yıldızın kara cisim renginde.
// Kipler (uMode): 0 doku (Merkür, Dünya, Mars), 1 bulut bantları (dev ve buz devleri),
// 2 Venüs bulut örtüsü, 3 kayalık ötegezegen yüzey modeli, 4 uydu yüzeyi (iki ton).

import { SKY_GLSL } from './glview.js';
import { SATURN_RING_TAU, SATURN_RING_COLOR } from '../planet/solar.js';

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes, uShift;
uniform vec3 uCamPos;
uniform float uTanFov, uExposure, uStars;
uniform int uMode;
uniform sampler2D uTex;
uniform float uHasTex;
uniform vec3 uTint;
uniform vec3 uLight, uLightDir;
uniform float uRot, uTilt, uOblate, uTime;
uniform float uBands, uContrast, uTeq, uGlow;
uniform vec3 uZone, uBelt, uGlowColor;
uniform vec4 uAtm;
uniform float uRingOn, uRayTau;
uniform sampler2D uRelief, uNight;
uniform float uHasRelief, uHasNight;

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
float fbm(vec3 x) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(x); x *= 2.03; a *= 0.5; } return s; }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1, 0, 0, 0, c, s, 0, -s, c); }

// Halkanın dik optik derinliği: ölçülmüş profil (planet/solar.js SATURN_RING_TAU), ince halkacık dokusuyla
const int RN = ${SATURN_RING_TAU.length};
const float RR[RN] = float[RN](${SATURN_RING_TAU.map((p) => p[0].toFixed(4)).join(', ')});
const float RT[RN] = float[RN](${SATURN_RING_TAU.map((p) => p[1].toFixed(3)).join(', ')});
float ringTau(float r) {
  if (uRingOn < 0.5 || r <= RR[0] || r >= RR[RN - 1]) return 0.0;
  float t = 0.0;
  for (int i = 1; i < RN; i++) {
    if (r < RR[i]) { t = mix(RT[i - 1], RT[i], (r - RR[i - 1]) / (RR[i] - RR[i - 1])); break; }
  }
  return t * (0.8 + 0.4 * hash3(vec3(floor(r * 900.0))).x);
}
const vec3 RAY = vec3(0.66, 1.0, 2.23);   // Rayleigh ∝ λ⁻⁴: 610, 550, 450 nm
// Halka parçacık rengi bölgeye göre (planet/solar.js SATURN_RING_COLOR), sınırlarda yumuşak geçiş
const int RCN = ${SATURN_RING_COLOR.length};
const float RCR[RCN] = float[RCN](${SATURN_RING_COLOR.map((c) => c[0].toFixed(4)).join(', ')});
const vec3 RCC[RCN] = vec3[RCN](${SATURN_RING_COLOR.map((c) => `vec3(${c[1].map((v) => v.toFixed(3)).join(', ')})`).join(', ')});
vec3 ringAlb(float r) {
  vec3 c = RCC[0];
  for (int i = 1; i < RCN; i++) c = mix(c, RCC[i], smoothstep(RCR[i] - 0.004, RCR[i] + 0.004, r));
  return c;
}
vec2 equirect(vec3 q) { return vec2(0.5 + atan(q.x, q.z) / 6.2831853, 0.5 - asin(clamp(q.y, -1.0, 1.0)) / 3.1415927); }

// Yüzey albedosu (gezegenle dönen q koordinatında)
vec3 surface(vec3 q) {
  float lat = asin(clamp(q.y, -1.0, 1.0));
  if (uMode == 0) {
    float lon = atan(q.x, q.z);
    vec2 uv = vec2(0.5 + lon / 6.2831853, 0.5 - lat / 3.1415927);
    vec2 uv2 = vec2(fract(uv.x + 0.5), uv.y);   // dikiş çizgisinde türev sıçramasını önler
    vec2 dx = dFdx(uv), dy = dFdy(uv), dx2 = dFdx(uv2), dy2 = dFdy(uv2);
    if (abs(dx2.x) + abs(dy2.x) < abs(dx.x) + abs(dy.x)) { dx = dx2; dy = dy2; }
    return pow(textureGrad(uTex, uv, dx, dy).rgb, vec3(2.2)) * uTint;
  }
  if (uMode == 1 || uMode == 2) {
    // Bantlar: yarıküre başına uBands bant (kuşak ve kemer sırayla; uBands/2 çift), sınırlar türbülansla dalgalanır
    float turb = fbm(q * vec3(3.0, 14.0, 3.0) + vec3(uTime * 0.05, 0.0, 0.0)) - 0.5;
    float l = lat + turb * (uMode == 2 ? 0.25 : 0.05);
    float phase = l / 1.5707963 * uBands * 3.1415927;
    float band = 0.5 + 0.5 * cos(phase);
    float id = floor(phase / 3.1415927);
    float vari = hash3(vec3(id, 3.0, 7.0)).x;
    vec3 c = mix(uBelt, uZone, band) * (0.92 + 0.16 * vari);
    float streak = fbm(q * vec3(25.0, 90.0, 25.0) + vec3(uTime * 0.2, 0.0, 0.0));
    c *= 0.94 + 0.12 * streak;
    vec3 avg = 0.5 * (uZone + uBelt);
    return mix(avg, c, uContrast);
  }
  // Uydu yüzeyi: büyük ölçekli koyu/açık bölgeler (Ay'ın denizleri gibi) ve ince ayrıntı
  if (uMode == 4) {
    float big = smoothstep(0.38, 0.62, fbm(q * 1.3 + 2.0));
    float fine = fbm(q * 7.0 + 9.0);
    return mix(uBelt, uZone, clamp(0.7 * big + 0.3 * fine, 0.0, 1.0));
  }
  // Kayalık model: yükseklik gürültüsü + sıcaklık sınıfı
  float h = fbm(q * 3.0 + 5.0);
  vec3 ice = mix(vec3(0.62, 0.70, 0.78), vec3(0.88, 0.92, 0.96), h);
  vec3 rock = mix(vec3(0.36, 0.30, 0.25), vec3(0.58, 0.52, 0.45), h);
  vec3 baked = mix(vec3(0.22, 0.20, 0.19), vec3(0.34, 0.31, 0.28), h);
  vec3 c = mix(ice, rock, smoothstep(170.0, 230.0, uTeq));
  c = mix(c, baked, smoothstep(500.0, 800.0, uTeq));
  return mix(c, vec3(0.10, 0.08, 0.07), smoothstep(900.0, 1200.0, uTeq));
}

${SKY_GLSL}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y - uShift;
  vec3 fw = normalize(-uCamPos), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  vec3 rdW = normalize(fw + (uv.x * rt + uv.y * up) * uTanFov);

  // Gezegen çerçevesine geç: eksen izleyiciye doğru eğilir (halkalar açılır, Uranüs kutbunu gösterir)
  mat3 toP = rotX(-uTilt);
  vec3 ro = toP * uCamPos, rd = toP * rdW, L = toP * uLightDir;

  vec3 sc = vec3(1.0, 1.0 / (1.0 - uOblate), 1.0);
  vec3 o = ro * sc, d = rd * sc;
  float a = dot(d, d), b = dot(o, d), c = dot(o, o) - 1.0, disc = b * b - a * c;
  float tP = disc > 0.0 ? (-b - sqrt(disc)) / a : -1.0;
  bool hitP = tP > 0.0;

  // Arka plan: gerçek gökyüzü (dünya yönüne bağlı)
  vec3 col = sky(rdW);

  if (hitP) {
    vec3 p = o + d * tP;                 // birim küre
    vec3 n = normalize(p * sc);
    vec3 ps = p / sc;                    // gerçek yüzey noktası
    float cr = cos(uRot), sr = sin(uRot);
    vec3 q = vec3(cr * p.x - sr * p.z, p.y, sr * p.x + cr * p.z);
    // Kabartma (Ay: LRO LOLA, Mars: MGS MOLA): eğim haritasından yüzey normali yokuştan öteye eğilir.
    // Doğu yönü cross(y, p): dönme y çevresinde olduğu için dönen çerçevedekiyle aynıdır.
    if (uHasRelief > 0.5) {
      vec2 s = (texture(uRelief, equirect(q)).rg - 0.5) * 1.2;
      vec3 east = normalize(vec3(p.z, 0.0, -p.x) + vec3(1e-5, 0.0, 0.0)), north = cross(p, east);
      n = normalize(n - s.x * east - s.y * north);
    }
    vec3 alb = surface(q);
    float ndl = dot(n, L), mu = max(dot(n, -rd), 0.0);
    float day = max(ndl, 0.0);
    // Bulutlu atmosferde kenar kararması (haritalı dev gezegende de: kip 0 ve bant sayısı > 0)
    if (uMode == 1 || uMode == 2 || (uMode == 0 && uBands > 0.0)) day *= pow(mu, 0.15);
    // Havasız, tozlu yüzey (Ay, Merkür, uydular, çıplak kaya): Lommel–Seeliger ağırlıklı saçılma.
    // Lambert dolunayı kenara doğru karartır; gerçek Ay kenara kadar neredeyse eşit parlaktır.
    else if (uAtm.a < 0.01 && uRayTau <= 0.0) day = mix(2.0 * day / (day + mu + 1e-4), day, 0.3);
    // Halkanın gezegene düşen gölgesi
    float shade = 1.0;
    if (uRingOn > 0.5 && abs(L.y) > 1e-3) {
      float tr = -ps.y / L.y;
      // Güneş ışığı halkadan eğik geçer: geçirgenlik e^(−τ/μ₀). C halkası soluk, B halkası kapkara gölge yapar
      if (tr > 0.0) shade = exp(-ringTau(length((ps + L * tr).xz)) / max(abs(L.y), 0.02));
    }
    col = alb * uLight * day * shade;
    // Rayleigh saçılımı (düzlem-paralel gaz katmanı). Gazın kendi ışığı tek saçılmadan:
    // I = ¼ F P(θ) μ₀/(μ + μ₀) (1 − e^(−τ m)), P = ¾ (1 + cos²θ), m geliş + çıkış hava kütlesi; mavi kenar
    // ve okyanus üstündeki mavi pus buradan çıkar. Yüzeye inen ve yüzeyden çıkan ışık iki akım yaklaşımıyla
    // (saçılan ışık yok olmaz, yarısı yine aşağı iner): geçirgenlik 1/(1 + τ/2μ), yüzeyle gaz arasındaki
    // yansımalar 1/(1 − A r̄), r̄ = ¾τ/(1 + ¾τ). Yalnız tek saçılma parlak bulutların mavisini yanlışlıkla
    // karartıyordu (Neptün gri-yeşil çıkıyordu).
    if (uRayTau > 0.0) {
      float mu0 = max(ndl, 0.0), cs = dot(L, rd), am = 1.0 / max(mu, 0.04), am0 = 1.0 / max(mu0, 0.04);
      vec3 tau = uRayTau * RAY, rs = 0.75 * tau / (1.0 + 0.75 * tau);
      vec3 through = 1.0 / ((1.0 + 0.5 * tau * am0) * (1.0 + 0.5 * tau * am) * (1.0 - alb * rs));
      col = col * through + uLight * shade * 0.1875 * (1.0 + cs * cs) * mu0 / (mu + mu0 + 1e-4) * (1.0 - exp(-tau * (am + am0)));
    }
    // Atmosfer kenar saçılması (gündüz tarafında, sonlandırıcıya doğru yumuşar)
    float rim = pow(1.0 - mu, 3.0) * smoothstep(-0.25, 0.35, ndl);
    col += uAtm.rgb * uLight * rim * uAtm.a;
    // Dünya'nın gece ışıkları (Suomi NPP VIIRS, 2012): gece yüzünde, alacakaranlıkta söner, sodyum lamba rengi.
    // ponytail: bulut örtüsü ayrı katman değil; bulut payı gündüz haritasının parlaklığından kestirilir (buz da
    // parlaktır ama orada ışık yok). Ayrı bulut haritası gelirse buradan okunur.
    if (uHasNight > 0.5) {
      float city = pow(texture(uNight, equirect(q)).r, 2.2);
      float cloud = smoothstep(0.3, 0.7, dot(alb, vec3(0.3333)));
      col += vec3(1.0, 0.72, 0.38) * uLight * city * (1.0 - smoothstep(-0.12, 0.04, ndl)) * (1.0 - cloud) * 0.45;
    }
    // Sıcak gezegenlerde ısıl ışıma: gece yüzünde ve lav çatlaklarında görünür
    if (uGlow > 0.0) {
      float night = 1.0 - smoothstep(-0.15, 0.2, ndl);
      float cracks = uMode == 3 ? 1.0 - smoothstep(0.0, 0.025, abs(fbm(q * 6.0) - 0.5)) : 1.0;   // ince ısıl çatlaklar
      col += uGlowColor * uGlow * (uMode == 3 ? cracks * 1.2 : night * 0.5);
    }
  } else {
    // İnce atmosfer hâlesi diskin hemen dışında
    float bimp = length(cross(ro, rd));
    col += uAtm.rgb * uLight * uAtm.a * 0.6 * exp(-(bimp - 1.0) * 40.0) * step(1.0, bimp);
  }

  // Halka: ışın–düzlem kesişimi, gezegenin önündeyse karıştırılır
  if (uRingOn > 0.5 && abs(rd.y) > 1e-5) {
    float tR = -ro.y / rd.y;
    if (tR > 0.0 && (!hitP || tR < tP)) {
      vec3 pr = ro + rd * tR;
      float tau = ringTau(length(pr.xz));
      if (tau > 0.0) {
        // Gezegenin halkaya düşen gölgesi
        float bb = dot(pr, L), cc = dot(pr, pr) - 1.0;
        float lit = (bb * bb - cc > 0.0 && -bb - sqrt(max(bb * bb - cc, 0.0)) > 0.0) ? 0.05 : 1.0;
        // Halka parçacık katmanı (tek saçılma). Güneş'le aynı yüzden bakınca yansıyan ışık yoğun halkada
        // parlar; karşı yüzden bakınca ışık içinden süzülür: yoğun B halkası kararır, seyrek C halkası ve
        // Cassini Bölümü parlar (Cassini'nin karanlık yüz görüntülerindeki gibi). 1,5: parçacık albedosu,
        // geri saçılma ve çoklu saçılma payını tek katsayıda toplayan etkin değer.
        float mu = max(abs(rd.y), 0.02), mu0 = max(abs(L.y), 0.02), dm = mu - mu0;
        float refl = mu0 / (mu + mu0) * (1.0 - exp(-tau * (1.0 / mu + 1.0 / mu0)));
        float trn = abs(dm) < 1e-3 ? tau / mu * exp(-tau / mu) : mu0 / dm * (exp(-tau / mu) - exp(-tau / mu0));
        vec3 ringCol = ringAlb(length(pr.xz)) * 2.0 * uLight * lit * (-rd.y * L.y > 0.0 ? refl : trn);
        col = col * exp(-tau / mu) + ringCol;
      }
    }
  }

  col *= uExposure;
  float mx = max(col.r, max(col.g, col.b));
  if (mx > 0.0) col *= aces(vec3(mx)).r / mx;
  outColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

// Dokular bir kez yüklenir; yüklenince görünüm yeniden çizilir
const IMAGES = new Map();
export function loadImage(url, onload) {
  if (!IMAGES.has(url)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    IMAGES.set(url, img);
  }
  const img = IMAGES.get(url);
  if (!img.complete) img.addEventListener('load', onload, { once: true });
  return img;
}

/**
 * Harita dokusunu verilen birime bağlar; görüntü indiyse bir kez yükler. st: sahne durumu (birim başına doku).
 * mip: mipmap (küçültmede titremeyi önler; dikişteki türev sıçramasını shader textureGrad ile çözmeli).
 * Dönüş 1 (hazır) ya da 0. Etkin birim değişir; çağıran sonunda TEXTURE0'a döner.
 */
export function bindMap(gl, view, st, unit, url, mip = false) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  const m = (st[unit] ??= { tex: gl.createTexture(), url: null });
  gl.bindTexture(gl.TEXTURE_2D, m.tex);
  if (!url) return 0;
  const img = loadImage(url, () => view.redraw());
  if (img.complete && img.naturalWidth && m.url !== url) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    m.url = url;
  }
  return m.url === url ? 1 : 0;
}

/**
 * Gezegen sahnesi. params: planetVisualParams() çıktısı (planet/visual.js).
 * Varsayılan zaman hızı: bir dönüş ~20 sn.
 */
export const planetScene = {
  id: 'planet',
  frag: FRAG,
  init(gl, view, U) {
    gl.uniform1i(U.uTex, 1);
    gl.uniform1i(U.uRelief, 2);
    gl.uniform1i(U.uNight, 3);
    return { tex: gl.createTexture(), url: null };
  },
  uniforms(gl, U, p, view, st) {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, st.tex);
    let hasTex = 0;
    if (p.texture) {
      const img = loadImage(p.texture, () => view.redraw());
      if (img.complete && img.naturalWidth && st.url !== p.texture) {
        // ponytail: 4096 px harita küçültülmeden yüklenir; WebGL2 cihazlarının hepsi bunu taşır
        // (MAX_TEXTURE_SIZE ≥ 4096). Daha küçük sınırlı bir cihaz çıkarsa burada canvas ile küçült.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        st.url = p.texture;
      }
      hasTex = st.url === p.texture ? 1 : 0;
    }
    // Doku henüz yoksa model geçici olarak çizilir (uydu: iki ton, dev: bantlar, diğer: kayalık)
    gl.uniform1i(U.uMode, p.mode === 0 && !hasTex ? p.fallback ?? 3 : p.mode);
    gl.uniform3f(U.uTint, ...p.tint);
    gl.uniform1f(U.uHasTex, hasTex);
    gl.uniform1f(U.uHasRelief, bindMap(gl, view, st, 2, p.relief));
    gl.uniform1f(U.uHasNight, bindMap(gl, view, st, 3, p.night));
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform3f(U.uLight, ...p.light);
    const l = [-0.35, 0.2, 1.0], ln = Math.hypot(...l);
    gl.uniform3f(U.uLightDir, l[0] / ln, l[1] / ln, l[2] / ln);
    gl.uniform1f(U.uRot, p.retro * (view.t / p.rotSec) % 1 * 2 * Math.PI);
    gl.uniform1f(U.uTilt, p.tilt);
    gl.uniform1f(U.uOblate, p.oblate);
    gl.uniform1f(U.uTime, view.t / p.rotSec);
    gl.uniform1f(U.uBands, p.bands);
    gl.uniform1f(U.uContrast, p.contrast);
    gl.uniform1f(U.uTeq, p.teq);
    gl.uniform1f(U.uGlow, p.glow);
    gl.uniform3f(U.uZone, ...p.zone);
    gl.uniform3f(U.uBelt, ...p.belt);
    gl.uniform3f(U.uGlowColor, ...p.glowColor);
    gl.uniform4f(U.uAtm, ...p.atm);
    const r = p.ring;
    gl.uniform1f(U.uRingOn, r ? 1 : 0);
    gl.uniform1f(U.uRayTau, p.rayTau);
  },
  timeScale: (p) => p.rotSec / 20,
};
