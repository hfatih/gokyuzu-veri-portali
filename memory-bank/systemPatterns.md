# Sistem kalıpları

- **Tür kaydı (2026-11-05):**
  - `js/kinds/index.js` sıralı liste. `byId` SIMBAD'sız kimlikler için (`bh:`, `sso:`, `moon:`,
    `planet:`), `byObj` SIMBAD kaydına göre. Yıldız en sonda yedek türdür.
  - `load(ctx)` kartı ve sahneyi çizer; `ctx.describe()` ile gökyüzü, karşılaştırma ve ilişkili
    cisimler için bilgi bırakır.
  - Sonradan gelen bölümler (çift yıldız, değişen yıldız) `ctx.insert(html)` ile "Gökyüzünde"
    bölümünün önüne eklenir.
  - Ortak ekler (`afterLoad` içinde): tur çubuğu, karşılaştır düğmesi, gökyüzü, ilişkili cisimler,
    kısmi veri uyarısı. `data-goto` düğmeleri cisim açar.
- **HTTP:** bütün ağ çağrıları `js/net/http.js` `get()` üzerinden geçer: zaman aşımı, paylaşım,
  oturum önbelleği. VizieR için `js/net/vizier.js` (`cone`, `parseAsu`, `pick`).

- **Katmanlar:** ağ (`search/simbad`, `search/wikidata`, `star/fetch`) → saf hesap (`star/derive`,
  `search/variants`) → çizim (`render/*`) → arayüz (`ui/*`, `main.js`). Saf hesap katmanı Node ile
  test edilir (`dev/check-*.mjs`).
- **Durum:** `body[data-state]` home | object | 3d; `body[data-kind]` star | planet | moon | binary | nebula | galaxy | bh | cluster | pulsar | sso | quasar | other.
- **Görünüm ve sahne:** `createView(canvas)` (`render/glview.js`) döngü, kamera ve boyutu yönetir.
  Sahne olarak `starScene` ya da `planetScene` takılır:
  `view.setScene(scene, params)`. Bir canvas'ın tek WebGL bağlamı olduğu için tür değişince sahne değişir.
- **Gezegen akışı:** `fetchPlanet` (Wikidata + SIMBAD ana yıldız) → `derivePlanet` → `planetVisualParams`
  → `planetScene`. `body[data-kind]` değeri: star | planet | nebula | other.
- **Bulutsu akışı:** `fetchObject` (boyut + `mesDistance`) → `deriveNebula` → `nebulaVisualParams` →
  `nebulaScene`. Sahne durağan (`static: true`), yalnız istek üzerine çizilir.
- **Gözlem görüntüsü:** `observationFigure(basic, note, vMag)`, her kart başlığın altında çağırır;
  koordinat yoksa boş döner.
- **Gökada akışı:** `fetchObject` (morph_type, z, boyut, mesDistance) → `deriveGalaxy` →
  `galaxyVisualParams` → `galaxyScene` (durağan). `showScene(..., pitch)` ölçülen eğiklikten
  varsayılan bakış yüksekliğini ayarlar.
- **Kara delik akışı:** `bh:Q…` kimliği → `fetchBlackHole` (Wikidata) → `deriveBlackHole` →
  `blackHoleScene` (zaman uzak gözlemci zamanı, t·c/r_s). `body[data-kind]`: star | planet | nebula |
  galaxy | bh | cluster | pulsar | sso | quasar | other.
- **Küme akışı:** `fetchObject` → `fetchMembers` (h_link, tekil) → `deriveCluster` →
  `clusterVisualParams` → `clusterScene`. Bu sahne `vert` ve `draw` verir (nokta sprite'ları);
  diğer sahneler tam ekran üçgen.
- **Pulsar akışı:** `fetchObject` → `fetchPulsar` (VizieR ASU TSV, konum + PSR adı) → `derivePulsar` →
  `pulsarVisualParams` → `pulsarScene` (zaman ölçeği P/2). TAPVizieR kullanılmaz: CORS başlığı çift.
- **Küçük cisim akışı:** `sso:<id>` kimliği (kara delik gibi SIMBAD'sız) → `fetchSso` (IMCCE ssoCard) →
  `deriveSso(b, jdNow())` → `ssoVisualParams` → `ssoScene`. Arama `searchSso` (IMCCE quaero) ile
  dördüncü kaynak; hata sessiz.
- **Kuasar akışı:** `fetchObject` (z, parlaklıklar) → `deriveQuasar` → kart; sahne `blackHoleScene`,
  kütle Eddington kestiriminden (`deriveBlackHole`). Gözlenen renk `observedRgb` → `spectrumRgb`.
- **SIMBAD kuralları:** tablo takma adı yok, `LOWER`/`ILIKE` yok, alt sorgu yok, önek aramasında
  `ORDER BY` yok. Katalog numaraları boşluk dolgulu; `=` ve `IN` dolguyu normalleştirir, `LIKE`
  normalleştirmez.
- **Hata dayanıklılığı:** öneri kaynakları birbirinden bağımsız başarısız olur. Kartın ikincil
  sorguları `allSettled` ile çalışır. Her istekte zaman aşımı ve `AbortController` var.
