# Sistem kalıpları

- **Katmanlar:** ağ (`search/simbad`, `search/wikidata`, `star/fetch`) → saf hesap (`star/derive`,
  `search/variants`) → çizim (`render/*`) → arayüz (`ui/*`, `main.js`). Saf hesap katmanı Node ile
  test edilir (`dev/check-*.mjs`).
- **Durum:** `body[data-state]` home | object | 3d; `body[data-kind]` star | other.
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
  galaxy | bh | cluster | other.
- **Küme akışı:** `fetchObject` → `fetchMembers` (h_link, tekil) → `deriveCluster` →
  `clusterVisualParams` → `clusterScene`. Bu sahne `vert` ve `draw` verir (nokta sprite'ları);
  diğer sahneler tam ekran üçgen.
- **SIMBAD kuralları:** tablo takma adı yok, `LOWER`/`ILIKE` yok, alt sorgu yok, önek aramasında
  `ORDER BY` yok. Katalog numaraları boşluk dolgulu; `=` ve `IN` dolguyu normalleştirir, `LIKE`
  normalleştirmez.
- **Hata dayanıklılığı:** öneri kaynakları birbirinden bağımsız başarısız olur. Kartın ikincil
  sorguları `allSettled` ile çalışır. Her istekte zaman aşımı ve `AbortController` var.
