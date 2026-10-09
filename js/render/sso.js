// Küçük cisim sahnesi (glview.js üzerinde): işaretli uzaklık alanıyla ışın yürütme. Biçim üç eksenli
// elipsoit + çapa göre genliği değişen gürültü pürüzü; cisim kısa ekseni (y) çevresinde gerçek
// dönemle döner. Aydınlatma Lommel–Seeliger + Lambert karışımı (karanlık, gözenekli yüzeyler),
// yumuşak öz gölge. Kuyruklu yıldızda çekirdeğin çevresinde güneşe doğru parlak koma (1/r² yoğunluk).

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes, uShift;
uniform vec3 uCamPos;
uniform float uTanFov, uExposure, uStars;
uniform vec3 uRadii, uColor, uSun;
uniform float uBump, uAlbedo, uAngle, uActivity, uSeed;

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
vec3 stars(vec3 d) {
  vec3 cell = floor(d * 260.0), h = hash3(cell);
  float sd = length(fract(d * 260.0) - 0.5 - (h - 0.5) * 0.6);
  return uStars * step(0.996, h.x) * (1.0 - smoothstep(0.0, 0.14, sd)) * mix(vec3(1.0, 0.8, 0.6), vec3(0.7, 0.8, 1.0), h.z) * (0.4 + h.y);
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
    float tone = 0.85 + 0.3 * fbm(toBody(p) * 9.0 + uSeed);        // yüzey lekeleri
    col = uColor * uAlbedo * 1.6 * shade * tone;            // Bennu (0,044) kömür gibi, Vesta (0,42) parlak
  } else {
    col = stars(rd);
  }
  // Koma: yoğunluk ∝ 1/r²; ışın boyunca sütun ≈ 1/b. Güneşe bakan taraf daha parlak
  if (uActivity > 0.0) {
    float bimp = length(cross(ro, rd));
    float coma = uActivity * 0.06 / max(bimp, 0.05) * (1.0 + 0.8 * dot(normalize(ro + rd * (-b)), L));
    col += vec3(0.75, 0.85, 1.0) * coma * (hit ? 0.5 : 1.0);           // çekirdeğe çarpan ışında yalnız öndeki yarı
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
  uniforms(gl, U, p, view) {
    gl.uniform3fv(U.uRadii, p.radii);
    gl.uniform3fv(U.uColor, p.color);
    gl.uniform3fv(U.uSun, p.sun);
    gl.uniform1f(U.uBump, p.bump);
    gl.uniform1f(U.uAlbedo, p.albedo);
    gl.uniform1f(U.uAngle, (view.t / p.spinS % 1) * 2 * Math.PI);
    gl.uniform1f(U.uActivity, p.activity);
    gl.uniform1f(U.uSeed, p.seed);
  },
  timeScale: (p) => p.spinS / 20,
};
