# Sistem kalıpları

- **Katmanlar:** ağ (`search/simbad`, `search/wikidata`, `star/fetch`) → saf hesap (`star/derive`,
  `search/variants`) → çizim (`render/*`) → arayüz (`ui/*`, `main.js`). Saf hesap katmanı Node ile
  test edilir (`dev/check-*.mjs`).
- **Durum:** `body[data-state]` home | object | 3d; `body[data-kind]` star | other.
- **Tek çizici:** `createStarRenderer(canvas)` aynı shader'ı arka planda, köşede ve 3D'de kullanır.
  `setStar(starVisualParams(deriveStar(raw)))`.
- **SIMBAD kuralları:** tablo takma adı yok, `LOWER`/`ILIKE` yok, alt sorgu yok, önek aramasında
  `ORDER BY` yok. Katalog numaraları boşluk dolgulu; `=` ve `IN` dolguyu normalleştirir, `LIKE`
  normalleştirmez.
- **Hata dayanıklılığı:** öneri kaynakları birbirinden bağımsız başarısız olur. Kartın ikincil
  sorguları `allSettled` ile çalışır. Her istekte zaman aşımı ve `AbortController` var.
