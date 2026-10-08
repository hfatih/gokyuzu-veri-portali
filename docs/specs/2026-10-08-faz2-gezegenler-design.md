# Gökyüzü Veri Portalı — Faz 2 (Gezegenler) Tasarımı

Tarih: 2026-10-08 · Durum: uygulandı

## Kullanıcı kararları (Fatih, doğrudan)

- Faz 2'de hem Güneş Sistemi gezegenleri hem ötegezegenler kapsanır.
- Veri kaynağı Wikidata. NASA Exoplanet Archive CORS vermiyor, proxy kurulmadı.
- Görünüm "C" seçeneği: gaz ve buz devleri fizikten üretilir; Merkür, Dünya ve Mars gerçek NASA/USGS
  dokusuyla çizilir (kamu malı, indirme onaylandı). Venüs'te görünür ışıkta bulut örtüsü göründüğü için
  bulut modeli kullanılır.

## Veri

- **Ötegezegen:**
  - Kaynak: SIMBAD'da `otype` değeri `Pl` ya da `Pl?` olan cisimler.
  - Nicelikler Wikidata'da P3083 ile bulunur. SIMBAD ve Wikidata yazımları farklı olabildiği için
    (`HD 209458b` ile `HD 209458 b`) iki biçim de denenir.
  - Ana yıldız SIMBAD `h_link` tablosundan alınır ve yıldız fiziği ona uygulanır.
- **Güneş Sistemi:** `planet:Q…` kimliği (`planet/solar.js`), değerler Wikidata öğesinden, ana yıldız
  sabit Güneş.
- **Okunan özellikler:** P2067 kütle, P2120 yarıçap, P2146 yörünge dönemi, P2233 yarı büyük eksen,
  P1096 dışmerkezlik, P2076 sıcaklık, P4501 albedo, P2147 dönme süresi, P575 keşif tarihi.
- **Değer seçimi:** Deprecated ifadeler atlanır; Preferred varsa yalnız onlar alınır. Kalanlar tek
  birime çevrilip ortancası kullanılır (`planet/units.js`).

## Fizik (`planet/derive.js`, `dev/check-planet.mjs`)

- **Eksik kütle ya da yarıçap:** Chen & Kipping (2017). Jüpiter dalında yarıçaptan kütle çıkmaz.
- **Tür:**
  - kayalık: < 1,6 R⊕
  - mini-Neptün: < 3,5 R⊕
  - Neptün benzeri: daha büyük
  - gaz devi: R ≥ 8 R⊕ ya da M ≥ 50 M⊕ (Satürn 9,1 R⊕ olduğu için kütle de gerekli)
- **Sıcaklık ve ışınım:**
  - T_eq = T★·√(R★/2a)·(1−A)^¼. A yoksa 0,3 alınır ve kartta yazılır.
  - Işınım S = L★/a².
  - Yaşanabilir bölge: Kopparapu+ (2013) muhafazakâr sınırları.
- **Dönme:** Ölçülen dönme süresi yoksa ve a < 0,1 AU ise gelgit kilidi varsayılır.
- **Bant sayısı:** Rhines ölçeği, U = 100 m/s varsayımıyla. Jüpiter için ~11 bant/yarıküre.

## Görünüm (`planet/visual.js`, `render/planet.js`)

- **Bulut rengi:** Sudarsky sınıfları I–V. Buz devlerinde metan (Irwin+ 2024). Düşük çekim
  kontrastı azaltır (pus).
- **Basıklık:** f ≈ 0,75·q.
- **Eksen eğikliği:** NASA Fact Sheet değerleri; eksen izleyiciye doğru eğilir.
- **Satürn halkaları:** NASA ölçülerinden C/B/Cassini/A yoğunlukları; gezegen ↔ halka gölgeleri.
- **Işık:** ana yıldızın kara cisim rengi, Güneş'e beyaz dengelenmiş.
- **Sıcak dev gezegenler:** gece yüzünde ısıl ışıma.
- **Kayalık ötegezegenler:** sıcaklık sınıfı modeli (buz / kaya / kavrulmuş / lav).
- **Ortak görünüm:** `render/glview.js` ortak döngü ve kamerayı sağlar. Bir canvas'ın tek WebGL
  bağlamı olduğundan yıldız ve gezegen aynı görünümde sahne değiştirir.

## Bilinen sınırlar

- Wikidata'da sıralaması bozuk kayıtlar var: HD 209458 b'nin tek geçerli yarıçapı 0,82 R♃ (doğrusu
  ~1,38), iyi değerler deprecated. Kart Wikidata öğesine bağlantı veriyor.
- Albedo seçimi en küçük değeri alıyor (Bond ≤ geometrik varsayımı); niteleyici okunmuyor.
- Gaz devlerinde Büyük Kırmızı Leke gibi tekil yapılar yok (fizikten çıkmaz).
- Uranüs ve Neptün renkleri aynı sınıftan gelir; aralarındaki pus farkı modellenmedi.
