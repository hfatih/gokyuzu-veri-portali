// Gezegen sahnesi (glview.js üzerinde). Gezegen çerçevesi: dönme ekseni y, halka düzlemi y = 0,
// eksen eğikliği x çevresinde (izleyiciye doğru) uygulanır. Işık ana yıldızın kara cisim renginde.
// Kipler (uMode): 0 doku (Merkür, Dünya, Mars), 1 bulut bantları (dev ve buz devleri),
// 2 Venüs bulut örtüsü, 3 kayalık ötegezegen yüzey modeli.

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes, uShift;
uniform vec3 uCamPos;
uniform float uTanFov, uExposure, uStars;
uniform int uMode;
uniform sampler2D uTex;
uniform float uHasTex;
uniform vec3 uLight, uLightDir;
uniform float uRot, uTilt, uOblate, uTime;
uniform float uBands, uContrast, uTeq, uGlow;
uniform vec3 uZone, uBelt, uGlowColor;
uniform vec4 uAtm;
uniform vec4 uRing;      // iç, B başlangıcı, Cassini iç, Cassini dış
uniform float uRingOuter, uRingOn;

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

// Halka yoğunluğu (optik kalınlığa benzer, 0–1): C soluk, B yoğun, Cassini boş, A orta; ince halkacıklar
float ringDensity(float r) {
  if (uRingOn < 0.5 || r < uRing.x || r > uRingOuter) return 0.0;
  float d = r < uRing.y ? 0.18 : r < uRing.z ? 0.92 : r < uRing.w ? 0.04 : 0.62;
  return d * (0.75 + 0.25 * hash3(vec3(floor(r * 900.0))).x);
}

// Yüzey albedosu (gezegenle dönen q koordinatında)
vec3 surface(vec3 q) {
  float lat = asin(clamp(q.y, -1.0, 1.0));
  if (uMode == 0) {
    float lon = atan(q.x, q.z);
    vec2 uv = vec2(0.5 + lon / 6.2831853, 0.5 - lat / 3.1415927);
    vec2 uv2 = vec2(fract(uv.x + 0.5), uv.y);   // dikiş çizgisinde türev sıçramasını önler
    vec2 dx = dFdx(uv), dy = dFdy(uv), dx2 = dFdx(uv2), dy2 = dFdy(uv2);
    if (abs(dx2.x) + abs(dy2.x) < abs(dx.x) + abs(dy.x)) { dx = dx2; dy = dy2; }
    return pow(textureGrad(uTex, uv, dx, dy).rgb, vec3(2.2));
  }
  if (uMode == 1 || uMode == 2) {
    // Bantlar: yarıküre başına uBands kuşak/kemer çifti, sınırlar türbülansla dalgalanır
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
  // Kayalık model: yükseklik gürültüsü + sıcaklık sınıfı
  float h = fbm(q * 3.0 + 5.0);
  vec3 ice = mix(vec3(0.62, 0.70, 0.78), vec3(0.88, 0.92, 0.96), h);
  vec3 rock = mix(vec3(0.36, 0.30, 0.25), vec3(0.58, 0.52, 0.45), h);
  vec3 baked = mix(vec3(0.22, 0.20, 0.19), vec3(0.34, 0.31, 0.28), h);
  vec3 c = mix(ice, rock, smoothstep(170.0, 230.0, uTeq));
  c = mix(c, baked, smoothstep(500.0, 800.0, uTeq));
  return mix(c, vec3(0.10, 0.08, 0.07), smoothstep(900.0, 1200.0, uTeq));
}

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

  // Arka plan yıldızları (dünya yönüne bağlı)
  vec3 cell = floor(rdW * 220.0), hh = hash3(cell);
  float sd = length(fract(rdW * 220.0) - 0.5 - (hh - 0.5) * 0.6);
  vec3 col = uStars * step(0.9975, hh.x) * smoothstep(0.12, 0.0, sd) * vec3(0.8, 0.85, 1.0) * (0.3 + hh.y) * 0.6;

  if (hitP) {
    vec3 p = o + d * tP;                 // birim küre
    vec3 n = normalize(p * sc);
    vec3 ps = p / sc;                    // gerçek yüzey noktası
    float cr = cos(uRot), sr = sin(uRot);
    vec3 q = vec3(cr * p.x - sr * p.z, p.y, sr * p.x + cr * p.z);
    vec3 alb = surface(q);
    float ndl = dot(n, L), mu = max(dot(n, -rd), 0.0);
    float day = max(ndl, 0.0);
    if (uMode == 1 || uMode == 2) day *= pow(mu, 0.15);   // bulutlu atmosferde kenar kararması
    // Halkanın gezegene düşen gölgesi
    float shade = 1.0;
    if (uRingOn > 0.5 && abs(L.y) > 1e-3) {
      float tr = -ps.y / L.y;
      if (tr > 0.0) shade = 1.0 - 0.85 * ringDensity(length((ps + L * tr).xz));
    }
    col = alb * uLight * day * shade;
    // Atmosfer kenar saçılması (gündüz tarafında, sonlandırıcıya doğru yumuşar)
    float rim = pow(1.0 - mu, 3.0) * smoothstep(-0.25, 0.35, ndl);
    col += uAtm.rgb * uLight * rim * uAtm.a;
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
      float dens = ringDensity(length(pr.xz));
      if (dens > 0.0) {
        // Gezegenin halkaya düşen gölgesi
        float bb = dot(pr, L), cc = dot(pr, pr) - 1.0;
        float lit = (bb * bb - cc > 0.0 && -bb - sqrt(max(bb * bb - cc, 0.0)) > 0.0) ? 0.05 : 1.0;
        vec3 ringCol = vec3(0.85, 0.78, 0.66) * uLight * lit * min(1.0, 0.35 + 2.0 * abs(L.y));
        col = mix(col, ringCol, dens * 0.9);
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
function loadImage(url, onload) {
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
 * Gezegen sahnesi. params: planetVisualParams() çıktısı (planet/visual.js).
 * Varsayılan zaman hızı: bir dönüş ~20 sn.
 */
export const planetScene = {
  id: 'planet',
  frag: FRAG,
  init(gl, view, U) {
    gl.uniform1i(U.uTex, 1);
    return { tex: gl.createTexture(), url: null };
  },
  uniforms(gl, U, p, view, st) {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, st.tex);
    let hasTex = 0;
    if (p.texture) {
      const img = loadImage(p.texture, () => view.redraw());
      if (img.complete && img.naturalWidth && st.url !== p.texture) {
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
    // Doku henüz yoksa kayalık model geçici olarak çizilir
    gl.uniform1i(U.uMode, p.mode === 0 && !hasTex ? 3 : p.mode);
    gl.uniform1f(U.uHasTex, hasTex);
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
    gl.uniform4f(U.uRing, r?.inner ?? 0, r?.bStart ?? 0, r?.gap[0] ?? 0, r?.gap[1] ?? 0);
    gl.uniform1f(U.uRingOuter, r?.outer ?? 0);
  },
  timeScale: (p) => p.rotSec / 20,
};
