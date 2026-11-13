// Küçük cisim sahnesi (glview.js üzerinde): işaretli uzaklık alanıyla ışın yürütme. Biçim üç eksenli
// elipsoit + çapa göre genliği değişen gürültü pürüzü; cisim kısa ekseni (y) çevresinde gerçek
// dönemle döner. Aydınlatma Lommel–Seeliger + Lambert karışımı (karanlık, gözenekli yüzeyler),
// yumuşak öz gölge. Kuyruklu yıldızda çekirdeğin çevresinde güneşe doğru parlak koma (1/r² yoğunluk).

import { SKY_GLSL } from './glview.js';
import { bindMap } from './planet.js';
const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes, uShift;
uniform vec3 uCamPos;
uniform float uTanFov, uExposure, uStars;
uniform vec3 uRadii, uColor, uSun;
uniform float uBump, uAlbedo, uAngle, uActivity, uSeed;
uniform sampler2D uTex;
uniform float uHasTex, uTexMean, uTexMono;
uniform vec3 uGas, uLag;   // gaz komasının rengi (C₂), toz kuyruğunun yörüngede geride kaldığı yön
const vec3 ION = vec3(0.42, 0.58, 1.0);    // CO⁺ kuyruğu (427 nm çevresi bantlar)
const vec3 DUST = vec3(1.0, 0.92, 0.78);   // tozdan yansıyan, hafif kızarmış güneş ışığı

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
float fbm(vec3 x) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise(x); x *= 2.07; a *= 0.5; } return s; }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

// Cisim çerçevesine döndürme (y ekseni çevresinde)
vec3 toBody(vec3 p) { float c = cos(uAngle), s = sin(uAngle); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }

// Uzaklık alanı: elipsoit yaklaşımı (Quilez) + pürüz; pürüz genliği uBump
float sdf(vec3 p) {
  vec3 q = toBody(p);
  float k0 = length(q / uRadii), k1 = length(q / (uRadii * uRadii));
  float d = k0 * (k0 - 1.0) / max(k1, 1e-4);
  vec3 s = q * 1.6 + uSeed;
  float lumps = fbm(s) - 0.5;
  float pits = smoothstep(0.55, 0.8, noise(q * 5.0 + uSeed * 1.7));   // küçük çukurlar (krater benzeri)
  return d - uBump * (lumps * 1.4 - pits * 0.25);
}
vec3 normalAt(vec3 p) {
  const vec2 e = vec2(0.002, -0.002);
  return normalize(e.xyy * sdf(p + e.xyy) + e.yyx * sdf(p + e.yyx) + e.yxy * sdf(p + e.yxy) + e.xxx * sdf(p + e.xxx));
}
float shadow(vec3 p, vec3 l) {
  float res = 1.0, t = 0.02;
  for (int i = 0; i < 24; i++) {
    float h = sdf(p + l * t);
    res = min(res, 8.0 * h / t);
    t += clamp(h, 0.02, 0.2);
    if (res < 0.01 || t > 2.5) break;
  }
  return clamp(res, 0.0, 1.0);
}

${SKY_GLSL}

// Gerçek harita (cisim çerçevesinde yönden eşdikdörtgen); ortalaması 1'e bölünmüş doğrusal yansıtma.
// Dikişte türev sıçramasını önlemek için iki uv'nin küçük türevlisi seçilir (planet.js ile aynı yol).
vec3 surfaceTex(vec3 q) {
  q = normalize(q);
  vec2 uv = vec2(0.5 + atan(q.x, q.z) / 6.2831853, 0.5 - asin(clamp(q.y, -1.0, 1.0)) / 3.1415927);
  vec2 uv2 = vec2(fract(uv.x + 0.5), uv.y);
  vec2 dx = dFdx(uv), dy = dFdy(uv), dx2 = dFdx(uv2), dy2 = dFdy(uv2);
  if (abs(dx2.x) + abs(dy2.x) < abs(dx.x) + abs(dy.x)) { dx = dx2; dy = dy2; }
  return pow(textureGrad(uTex, uv, dx, dy).rgb, vec3(2.2)) / uTexMean;
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y - uShift;
  vec3 ro = uCamPos, fw = normalize(-ro), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * uTanFov);
  vec3 L = normalize(uSun);
  vec3 col = vec3(0.0);

  // Sınır küresi (yarıçap 1 + pürüz payı)
  float b = dot(ro, rd), c = dot(ro, ro) - 1.4 * 1.4, h = b * b - c;
  bool hit = false;
  float t = 0.0;
  if (h > 0.0) {
    t = max(0.0, -b - sqrt(h));
    float tEnd = -b + sqrt(h);
    for (int i = 0; i < 110; i++) {
      float d = sdf(ro + rd * t);
      if (d < 0.0008) { hit = true; break; }
      t += d * 0.8;
      if (t > tEnd) break;
    }
  }
  if (hit) {
    vec3 p = ro + rd * t, n = normalAt(p);
    float mu0 = max(dot(n, L), 0.0), mu = max(dot(n, -rd), 0.0);
    // Lommel–Seeliger (karanlık regolit) ve Lambert karışımı; albedo doğrusal parlaklık ölçeği
    float ls = mu0 / (mu0 + mu + 1e-4);
    float wl = clamp(uAlbedo * 2.0, 0.3, 0.8);                       // parlak yüzeyde Lambert ağırlığı artar
    float shade = ((1.0 - wl) * ls * 2.0 + wl * mu0) * shadow(p + n * 0.003, L);
    // Yüzey deseni: gerçek harita varsa (Ceres, Vesta, Plüton) ondan, yoksa temsili lekeler
    vec3 surf = uColor * (0.85 + 0.3 * fbm(toBody(p) * 9.0 + uSeed));
    if (uHasTex > 0.5) { vec3 m = surfaceTex(toBody(p)); surf = uTexMono > 0.5 ? uColor * m.r : m; }
    col = surf * uAlbedo * 1.6 * shade;            // Bennu (0,044) kömür gibi, Vesta (0,42) parlak
  } else {
    col = sky(rd);
  }
  // Koma: yoğunluk ∝ 1/r²; ışın boyunca sütun ≈ 1/b. Güneşe bakan taraf daha parlak
  if (uActivity > 0.0) {
    float bimp = length(cross(ro, rd));
    float coma = uActivity * 0.06 / max(bimp, 0.05) * (1.0 + 0.8 * dot(normalize(ro + rd * (-b)), L));
    // Koma: toz (güneş ışığı) + gaz. Gazın görünür ışığı C₂ Swan bantlarıdır (516 nm, yeşil); C₂ güneş
    // ışığıyla parçalandığı için yeşil yalnız komada kalır, kuyruğa taşınmaz.
    col += mix(DUST, uGas, 0.4) * coma * (hit ? 0.5 : 1.0);           // çekirdeğe çarpan ışında yalnız öndeki yarı
    // Kuyruklar (uzunluk ölçekli değil; yön ve renk gerçek). İyon kuyruğu güneş rüzgârıyla Güneş'in tam
    // tersine, dar ve düz; toz kuyruğu ışınım basıncıyla itilir ama yörüngede geride kalır: geniş ve eğri.
    float hT = b * b - dot(ro, ro) + 64.0;
    if (hT > 0.0) {
      float t0 = max(0.0, -b - sqrt(hT)), t1 = hit ? t : -b + sqrt(hT);
      const int NT = 40;
      float dt = (t1 - t0) / float(NT), tt = t0 + dt * hash3(vec3(gl_FragCoord.xy, 5.0)).x, ion = 0.0, dust = 0.0;
      vec3 A = -L;
      for (int i = 0; i < NT; i++) {
        vec3 p = ro + rd * tt;
        float s = dot(p, A);
        if (s > 0.2) {
          // Tüp genişledikçe yoğunluk 1/w² düşer (kütle korunur)
          float wi = 0.10 + 0.035 * s, di = length(p - A * s);
          ion += exp(-di * di / (wi * wi)) * (0.01 / (wi * wi)) * exp(-s / 3.5);
          float wd = 0.25 + 0.16 * s, dd = length(p - A * s - uLag * 0.06 * s * s);
          dust += exp(-dd * dd / (wd * wd)) * (0.0625 / (wd * wd)) * exp(-s / 2.5);
        }
        tt += dt;
      }
      // İyonlaşma hızı da Güneş'e yakınken artar: iyon kuyruğu etkinliğin karesiyle
      col += (ION * ion * uActivity * 1.6 + DUST * dust * 0.9) * uActivity * dt;
    }
  }
  col *= uExposure;
  float mx = max(col.r, max(col.g, col.b));
  if (mx > 0.0) col *= aces(vec3(mx)).r / mx;
  outColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

/** Küçük cisim sahnesi. params: ssoVisualParams(). Varsayılan zaman hızı: bir dönüş ~20 sn. */
export const ssoScene = {
  id: 'sso',
  frag: FRAG,
  init(gl, view, U) {
    gl.uniform1i(U.uTex, 2);
    return {};
  },
  uniforms(gl, U, p, view, st) {
    gl.uniform3fv(U.uRadii, p.radii);
    gl.uniform3fv(U.uColor, p.color);
    gl.uniform3fv(U.uSun, p.sun);
    gl.uniform1f(U.uBump, p.bump);
    gl.uniform1f(U.uAlbedo, p.albedo);
    gl.uniform1f(U.uAngle, (view.t / p.spinS % 1) * 2 * Math.PI);
    gl.uniform1f(U.uActivity, p.activity);
    gl.uniform1f(U.uSeed, p.seed);
    gl.uniform1f(U.uHasTex, bindMap(gl, view, st, 2, p.tex?.url, true));
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1f(U.uTexMean, p.tex?.mean ?? 1);
    gl.uniform1f(U.uTexMono, p.tex?.mono ? 1 : 0);
    gl.uniform3fv(U.uGas, p.gas);
    gl.uniform3fv(U.uLag, p.lag);
  },
  timeScale: (p) => p.spinS / 20,
};
