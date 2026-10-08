# Özellikler

## 2026-10-08 · v1: yıldızlar

- **Arama:** SIMBAD önek araması, Wikidata SPARQL ile Türkçe ve İngilizce adlar, yerel Türkçe
  ad listesi. Öneriler `nbref`'e göre sıralanır, hızlı kaynaklar önce gelir.
- **Bilgi kartı:** fiziksel değerler köken etiketiyle (ölçülen / hesaplanan / tahmini), ölçüm
  ortancası ve kaynağı; 8–10 dış kaynak bağlantısı.
- **Fizik:** `js/star/derive.js`. Kontrolü `dev/check-derive.mjs`: Güneş, Sirius, Vega, Betelgeuse
  ve Proxima değerleri literatür aralığında.
- **Replika:** `js/render/star.js`, tek WebGL 2 shader'ı, üç görünüm (arka plan, köşe, 3D).
- **3D görünüm:** döndürme ve yakınlaştırma, zaman hızı (1 sn = 1 sn … 10⁹ sn), granülasyon ve
  leke anahtarları, pozlama.
- **Diğer:** TR/EN dil desteği, `?star=` ile paylaşılabilir adres, mobil düzen, hareket azaltma
  tercihi, WebGL olmadan durağan görünüm.

Ayrıntı ve tasarımdan sapmalar: [docs/specs/2026-10-08-v1-yildizlar-design.md](../../docs/specs/2026-10-08-v1-yildizlar-design.md)
