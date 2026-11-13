// fetchSso() + deriveSso() → küçük cisim sahnesinin parametreleri. Saf fonksiyon.
// Biçim: ölçülen elipsoit oranları (a ≥ b ≥ c); yoksa boyuta göre varsayım. ~400 km üstü cisimler
// kendi kütleçekimiyle yuvarlanır; küçükler düzensiz (pürüz genliği çapla azalır).

import { lineRgb } from '../render/color.js';

// Taksonomi sınıfının görünür ışıkta göreli yansıtma rengi (450/550/650 nm, DeMeo ve ark. 2009
// ortalama spektrumlarından kaba); C ve B nötr, S ve V kırmızımsı, D çok kırmızı.
const TAX_RGB = {
  C: [0.97, 0.98, 1.0], B: [0.92, 0.97, 1.04], S: [1.08, 0.97, 0.84], Q: [1.04, 0.98, 0.9], V: [1.08, 0.98, 0.82],
  X: [1.0, 0.98, 0.94], M: [1.0, 0.98, 0.94], E: [1.0, 1.0, 0.98], P: [1.04, 0.97, 0.88], D: [1.12, 0.95, 0.78],
  K: [1.06, 0.97, 0.86], L: [1.08, 0.96, 0.84], A: [1.16, 0.94, 0.74],
};
const COMET_RGB = [1.05, 0.97, 0.88];

// Gerçek yüzey haritaları (assets/textures/KAYNAK.md). mean: haritanın alan ağırlıklı doğrusal ortalaması;
// sahnede harita buna bölünür, ortalama parlaklık ölçülen albedoda kalır. mono: tek renk (taksonomi rengiyle çarpılır).
const TEXTURES = {
  ceres: { url: 'assets/textures/ceres.jpg', mono: true, mean: 0.094 },
  vesta: { url: 'assets/textures/vesta.jpg', mono: true, mean: 0.179 },
  pluto: { url: 'assets/textures/pluto.jpg', mono: false, mean: 0.173 },
};
/** IMCCE kimliğinden gerçek harita (yoksa null). */
export const ssoTexture = (id) => TEXTURES[String(id ?? '').toLowerCase()] ?? null;
const C2_GREEN = lineRgb(516.5);   // C₂ Swan bandı (Δv = 0)

/** Gölgelendirici tohumu: kimlikten sabit. */
const seedOf = (id) => ([...String(id)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7) % 1000) / 10;

export function ssoVisualParams(b, sd) {
  const D = sd.diameterKm?.value ?? 1;
  const measuredShape = b.ab != null && b.ac != null;
  // Eksenler (x = a uzun, z = b orta, y = c kısa = dönme ekseni); en uzun eksen 1
  const radii = measuredShape ? [1, 1 / b.ac, 1 / b.ab] : D > 400 ? [1, 0.95, 1] : [1, 0.72, 0.84];
  const tex = ssoTexture(b.id);
  // Haritalı cisimde gürültü pürüzü haritadaki kraterlerle çakışmasın diye en küçük değerde
  const bump = tex ? 0.01 : D > 800 ? 0.01 : D > 400 ? 0.03 : D > 50 ? 0.09 : 0.16;
  const alpha = sd.phaseDeg ? sd.phaseDeg.value * Math.PI / 180 : Math.PI / 3;
  // Güneş yönü: varsayılan kamera (yaw 0,6) ile bugünkü evre açısı kadar ayrık; Dünya'dan görünen evre
  const sunYaw = 0.6 + alpha;
  // Kuyruklu yıldız etkinliği: su buzu ~3 AU içinde süblimleşir, üretim kabaca r⁻⁴
  const r = sd.rNow?.value ?? 3;
  const activity = sd.comet ? Math.min(1, (2.5 / r) ** 4) : 0;
  return {
    radii, bump, measuredShape,
    color: sd.comet ? COMET_RGB : TAX_RGB[(b.taxonomy ?? '')[0]] ?? [1, 0.98, 0.95],
    albedo: sd.albedo?.value ?? 0.1,
    spinS: (b.spinH ?? 8) * 3600,
    sun: [Math.sin(sunYaw), 0.15, Math.cos(sunYaw)],
    activity, seed: seedOf(b.id), tex,
    gas: C2_GREEN,
    // Toz kuyruğunun eğrildiği yön: Güneş doğrultusuna dik. Gerçekte yörünge hareketinin tersidir; sahnede
    // yörünge düzleminin yönü hesaplanmadığı için hangi yana eğrildiği temsilidir.
    lag: [Math.cos(sunYaw), 0, -Math.sin(sunYaw)],
  };
}
