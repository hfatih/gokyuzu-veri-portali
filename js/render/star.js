// Yıldız sahnesi (glview.js üzerinde). Yüzey piksel başına ışın–elipsoit kesişimiyle bulunur.
// Arka plan, köşe önizlemesi ve 3D görünüm aynı sahneyi farklı kamerayla kullanır.

import { blackbodyTable } from './color.js';
import { pulseState } from '../variable/derive.js';
import { MAX_SPOTS, MAX_FAC } from '../sun/activity.js';

const BB_N = 256, BB_TMIN = 1500, BB_TMAX = 60000;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes, uShift;
uniform vec3 uCamPos;
uniform float uTanFov, uExposure, uStars;
uniform sampler2D uBB;
uniform vec2 uBBRange;
uniform vec4 uSpot[${MAX_SPOTS}], uFac[${MAX_FAC}];
uniform float uFacS[${MAX_FAC}];
uniform int uNSpot, uNFac;
uniform float uScale, uTeff, uGranF, uGranAmp, uGiantAmp, uGranPhase, uSpots, uOblate, uGEq, uBeta, uRot, uU1, uU2;

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
// Hücresel gürültü: F1, F2 uzaklıkları ve en yakın hücrenin kimliği; noktalar zamanla yer
// değiştirir (granül evrimi)
vec3 worley(vec3 x, float t) {
  vec3 i = floor(x), f = fract(x);
  float d1 = 8.0, d2 = 8.0, id = 0.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int k = -1; k <= 1; k++) {
    vec3 g = vec3(k, y, z), h = hash3(i + g);
    vec3 r = g + 0.5 + 0.4 * sin(t + 6.2831 * h) - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = h.z; } else if (d < d2) d2 = d;
  }
  return vec3(sqrt(vec2(d1, d2)), id);
}
// Granül deseni, ortalaması ~0: sıcak yükselen hücre içi (+), dar soğuk şeritler (−).
// Hücreden hücreye parlaklık farkı gerçek granülasyondaki gibi korunur.
float granule(vec3 x, float t) {
  vec3 w = worley(x, t);
  float lane = smoothstep(0.0, 0.3, w.y - w.x);
  float inner = 1.0 - 0.35 * w.x * w.x;
  return (lane * inner * (0.7 + 0.6 * w.z) - 0.62) * 1.6;
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y - uShift;
  vec3 fw = normalize(-uCamPos), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * uTanFov);
  vec3 ro = uCamPos / uScale;   // zonklayan yıldızda yarıçap ölçeği (birim küre uzayına)

  // Elipsoit (ekvator yarıçapı 1, kutup 1 − f) → birim küre uzayı
  vec3 sc = vec3(1.0, 1.0 / (1.0 - uOblate), 1.0);
  vec3 o = ro * sc, d = rd * sc;
  float a = dot(d, d), b = dot(o, d), c = dot(o, o) - 1.0, disc = b * b - a * c;
  vec3 col = vec3(0.0);
  vec4 bbEff = bb(uTeff);

  if (disc > 0.0 && (-b - sqrt(disc)) > 0.0) {
    vec3 p = o + d * ((-b - sqrt(disc)) / a);          // birim küre üzerinde
    vec3 n = normalize(p * sc);                        // elipsoit normali
    float mu = max(dot(n, -rd), 0.0);
    float cr = cos(uRot), sr = sin(uRot);
    vec3 q = vec3(cr * p.x + sr * p.z, p.y, -sr * p.x + cr * p.z);   // yıldızla dönen koordinat

    // von Zeipel: T ∝ g_eff^β, g_eff kutuptan ekvatora uGEq oranında düşer
    float s2 = 1.0 - p.y * p.y;
    float T = uTeff * pow(mix(1.0, uGEq, s2), uBeta) / pow(mix(1.0, uGEq, 0.6667), uBeta);

    // Granülasyon: parlak sıcak hücreler, koyu soğuk şeritler. Piksel altına inen hücreler
    // çözünürlükte silinir (uzaktan bakınca görünmezler).
    vec3 gx = q * uGranF;
    float foot = length(fwidth(gx));
    float amp = uGranAmp * (1.0 - smoothstep(0.35, 1.0, foot));
    if (amp > 0.0) T *= 1.0 + amp * granule(gx, uGranPhase);
    // Süperdevlerde yüzeyi birkaç dev hücre kaplar (Chiavassa+ 2010); daha yavaş evrilir
    if (uGiantAmp > 0.0) T *= 1.0 + uGiantAmp * granule(q * 1.3 + 7.0, uGranPhase * 0.15);

    // Güneş modeli (sun/activity.js): lekeler ve faküller yıldızla dönmeyen çerçevede (p), konumları
    // farklı dönmeyle JS'te hesaplanır. Gölge 4040 K (0,70·T), yarı gölge 5370 K (0,93·T); gölge
    // yarıçapı lekenin ~0,42'si (alan oranı ~1/6, Solanki 2003). Faküller kenara doğru parlar.
    if (uNSpot > 0 || uNFac > 0) {
      float pen = 0.0, umb = 0.0, fac = 0.0;
      for (int i = 0; i < ${MAX_SPOTS}; i++) {
        if (i >= uNSpot) break;
        vec4 s = uSpot[i];
        vec3 dv = p - s.xyz;
        float d2 = dot(dv, dv);
        if (d2 > s.w * s.w * 1.3) continue;
        float d = sqrt(d2);
        pen = max(pen, 1.0 - smoothstep(s.w * 0.82, s.w, d));
        umb = max(umb, 1.0 - smoothstep(s.w * 0.36, s.w * 0.46, d));
      }
      for (int i = 0; i < ${MAX_FAC}; i++) {
        if (i >= uNFac) break;
        vec4 f = uFac[i];
        vec3 dv = p - f.xyz;
        float d2 = dot(dv, dv);
        if (d2 > f.w * f.w) continue;
        fac = max(fac, uFacS[i] * (1.0 - smoothstep(f.w * 0.35, f.w, sqrt(d2))));
      }
      // Fakül: ağsı yapı (fbm) ve kenar parlaması; görünür ışıkta ΔI/I ≈ %10 kenarda ↔ ΔT/T ≈ %2,5
      if (fac > 0.0) T *= 1.0 + 0.03 * fac * smoothstep(0.95, 0.15, mu) * (0.4 + 1.2 * fbm(q * 60.0));
      T *= mix(1.0, 0.93, pen) * mix(1.0, 0.7527, umb);
    }
    // Lekeler: aktivite kuşağında (|enlem| ≈ 5°–40°) eşik üstü gürültü; gölge 0,7·T, yarı gölge 0,85·T
    else if (uSpots > 0.0) {
      float belt = smoothstep(0.08, 0.18, abs(q.y)) * (1.0 - smoothstep(0.55, 0.7, abs(q.y)));
      float nz = fbm(q * 4.0 + 11.0);
      float th = 0.78 - 0.18 * uSpots;
      float pen = smoothstep(th, th + 0.03, nz) * belt, umb = smoothstep(th + 0.04, th + 0.06, nz) * belt;
      T *= mix(1.0, 0.85, pen) * mix(1.0, 0.82, umb);
    }

    float limb = 1.0 - uU1 * (1.0 - mu) - uU2 * (1.0 - mu) * (1.0 - mu);
    vec4 bt = bb(T);
    // Disk merkezinin en parlak kanalı 1 olacak biçimde: turuncu yıldız turuncu kalır
    col = bt.rgb * exp2(bt.a - bbEff.a) * max(limb, 0.0) / max(bbEff.r, max(bbEff.g, bbEff.b));
  } else {
    // Işık hâlesi: ışının merkeze en yakın uzaklığı (yarıçap biriminde)
    float bimp = length(cross(ro, rd));
    float glow = 0.3 * exp(-(bimp - 1.0) * 10.0) + 0.01 / (bimp * bimp * bimp);
    col = bbEff.rgb / max(bbEff.r, max(bbEff.g, bbEff.b)) * glow;
    // Uzak yıldızlar: yöne bağlı seyrek noktalar (kamerayla döner, yıldızla değil)
    vec3 cell = floor(rd * 220.0), h = hash3(cell);
    float sd = length(fract(rd * 220.0) - 0.5 - (h - 0.5) * 0.6);
    col += uStars * step(0.9975, h.x) * (1.0 - smoothstep(0.0, 0.12, sd)) * bb(2500.0 + h.z * 15000.0).rgb * (0.3 + h.y);
  }
  // Ton eşleme en parlak kanala uygulanır, renk tonu korunur (kanal başına ACES sarıya kaydırıyordu)
  col *= uExposure;
  float mx = max(col.r, max(col.g, col.b));
  if (mx > 0.0) col *= aces(vec3(mx)).r / mx;
  outColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

let BB_CACHE = null;

/** Kara cisim tablosu (yıldız ve gezegen sahneleri ortak kullanır). */
export const blackbody = () => (BB_CACHE ??= blackbodyTable(BB_N, BB_TMIN, BB_TMAX));

/**
 * Yıldız sahnesi (glview.js). params: starVisualParams() çıktısı (derive.js).
 * Varsayılan zaman hızı: bir granül ömrü ~4 sn sürer; params.pulse varsa bir zonklama ~6 sn.
 */
export const starScene = {
  id: 'star',
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
    // Değişen yıldız: ışık eğrisinden sıcaklık, sinüsle yarıçap (variable/derive.js)
    const ps = p.pulse ? pulseState(p.pulse, (view.t / p.pulse.periodS) % 1) : null;
    gl.uniform1f(U.uScale, ps ? ps.rScale : 1);
    gl.uniform1f(U.uTeff, ps ? p.teff * ps.tScale : p.teff);
    gl.uniform1f(U.uGranF, p.granScale / (2 * Math.PI));
    gl.uniform1f(U.uGranAmp, view.granulation ? p.granContrast * p.granAmp : 0);
    gl.uniform1f(U.uGiantAmp, view.granulation ? p.giantCellAmp : 0);
    // Zonklamada zaman çok hızlı akar; granüller yine ~4 sn'lik ömürle evrilsin
    const granT = p.pulse ? view.t * (p.granLifeSec / 4) / (p.pulse.periodS / 6) : view.t;
    // Güneş modelinde zaman hızlı akar (lekelerin doğup sönmesi görünsün); granüller gerçek saatle ~4 sn ömürlü
    gl.uniform1f(U.uGranPhase, p.sun ? view.wall / 4 * 2 * Math.PI : granT / p.granLifeSec * 2 * Math.PI);
    const sun = p.sun && view.spots ? p.sun.stateAt(view.t / 86400) : null;
    gl.uniform1i(U.uNSpot, sun ? sun.nSpots : 0);
    gl.uniform1i(U.uNFac, sun ? sun.nFac : 0);
    if (sun) {
      if (sun.nSpots) gl.uniform4fv(U['uSpot[0]'], sun.spots);
      if (sun.nFac) { gl.uniform4fv(U['uFac[0]'], sun.fac); gl.uniform1fv(U['uFacS[0]'], sun.facS); }
    }
    gl.uniform1f(U.uSpots, view.spots ? p.spots : 0);
    gl.uniform1f(U.uOblate, p.oblateness);
    gl.uniform1f(U.uGEq, p.gEqRatio);
    gl.uniform1f(U.uBeta, p.gravDarkBeta);
    gl.uniform1f(U.uRot, (view.t / (p.periodDays * 86400)) % 1 * 2 * Math.PI);
    gl.uniform1f(U.uU1, p.u1);
    gl.uniform1f(U.uU2, p.u2);
  },
  // Zonklayan yıldızda bir dönem ~6 sn
  // Zonklayan yıldızda bir dönem ~6 sn; Güneş modelinde 1 sn = 6 saat (Güneş ~100 sn'de bir döner)
  timeScale: (p) => (p.sun ? 21600 : p.pulse ? p.pulse.periodS / 6 : p.granLifeSec / 4),
};
