# Gökyüzü Veri Portalı — Faz 5 (Kara Delikler) Tasarımı

Tarih: 2026-10-08 · Durum: uygulandı

## Kullanıcı kararı

"Diğer faza geç." `Websites/karadelik` projesini okuma izni sorusu cevapsız kaldığı için o projeye
dokunulmadı, model sıfırdan yazıldı.

## Veri

- **SIMBAD kara deliği ayrı cisim olarak tutmuyor:**
  - Sgr A* `X` (X-ışını kaynağı) olarak kayıtlı.
  - "M87*" sorgusu M 87 gökadasına çözülüyor.
  - Cyg X-1 kaydı yoldaş yıldız HD 226868.
- **Kaynak Wikidata:**
  - Kara delik sınıfı (P31/P279* Q589) olan öğeler 'bh:Q…' sayfasına gider.
  - Okunan özellikler: P2067 kütle (M☉), P2583 uzaklık (ışık yılı), P6257/P6258 koordinat.
  - Seçim kuralı `planet/units.js` ile aynı: deprecated atlanır, ortanca alınır.
- **Arama:** Wikidata aramasında P3083'ü olmayan kara delik öğeleri de döner. SIMBAD kaydı varsa
  (Sgr A*) kara delik sayfası onun yerini alır ve makale sayısı korunur. SIMBAD kaydı yoksa sıralama
  dil bağlantısı sayısı × 50 ile yapılır; bu sayı öneride "makale" diye gösterilmez.
- **Sınıflama:** Wikidata'nın kendi sınıflaması kullanılır. Örneğin Cyg X-1 orada kara delik olarak
  değil, X-ışını çifti olarak sınıflanıyor; ayrı bir kara delik sayfası çıkmıyor.

## Fizik (`js/bh/derive.js`, `dev/check-bh.mjs`)

Dönme ölçülmediği için Schwarzschild (a = 0) varsayılır.

| Büyüklük | Yöntem | Kontrol |
| :--- | :--- | :--- |
| Olay ufku | r_s = 2GM/c² | Sgr A* 1,19 × 10⁷ km |
| Gölge açısal çapı | 2√27 GM/(c²D) (Synge 1966) | Sgr A* 51,7 µas (EHT 51,8 ± 2,3); M87* 39,5 µas (EHT halkası 42 ± 3) |
| ISCO ve dönemi | 3 r_s, 2π√(r³/GM) | Sgr A* 30,5 dk |
| Eddington ışıması | 1,26 × 10³¹ W × M/M☉ | |
| Disk en yüksek sıcaklığı | Shakura–Sunyaev, Eddington'ın %10'u, η = 0,057 | 10 M☉ → 4,9 × 10⁶ K |
| Hawking sıcaklığı / buharlaşma | ħc³/(8πGMk), 5120πG²M³/(ħc⁴) | 1 M☉ → 6,2 × 10⁻⁸ K |
| Ortalama yoğunluk | M / olay ufku hacmi | M87* 0,44 kg/m³ (havadan az) |
| Olay ufkunda gelgit | 2GMℓ/r_s³, ℓ = 2 m | 10 M☉ → 2 × 10⁷ g; Sgr A* → 10⁻⁴ g |
| Sınıf | yıldızsal < 100 M☉ ≤ orta kütleli < 10⁵ M☉ ≤ süper kütleli | |

## Görünüm (`js/render/blackhole.js`)

- **Işık yolları:** Piksel başına Schwarzschild boş jeodeziği izlenir. Uzaysal şekil
  x″ = −(3/2) h² x / r⁵ ile tam olarak verilir (h = |x × v| korunur). Adım hız Verlet ile atılır,
  en çok 400 adım; b > 40 r_s olan ışınlar bükülmeden geçer.
- **İnce disk:** y = 0 düzleminde, 3 ile 12 r_s arası. Her kesişimde ışınım eklenir ve örtücülük
  uygulanır; diskin arka yüzü bükülüp üstte ve altta görünür, foton halkası da buradan oluşur.
- **Diskin rengi ve parlaklığı:**
  - Sıcaklık: Shakura–Sunyaev profili × türbülans dokusu.
  - Doppler: β = √(0,5/(r−1)), δ = 1/(γ(1 − β·n̂)), g = δ·√(1 − 1/r). Bu birleştirme yaklaşık.
  - Gözlenen sıcaklık g·T, parlaklık (g·T/T_max)⁴. Yaklaşan taraf parlak çıkar.
- **Kepler kesmesi:** Her yarıçap Ω = √(0,5/r³) hızıyla döner; zaman uzak gözlemci zamanı
  (t·c/r_s). Varsayılan hız: ISCO'daki bir dolanım ~8 sn.
- **Arka plan:** Kaçan ışınlar bükülmüş yönde yıldız alanını görür (merceklenme). Olay ufkuna düşen
  ışınlar karanlık kalır.
- **Varsayılan bakış:** diske 7°, klasik merceklenmiş görünüm.

## Geliştirme ortamı

`python -m http.server` önbellek başlığı göndermiyor. Tarayıcı değişen ES modüllerini (`units.js`)
eski sürümden kullandı ve Sgr A*'nın kütlesi "bilinmiyor" göründü. Bu yüzden `dev/serve.py`
eklendi; her yanıta `Cache-Control: no-store` başlığı koyuyor. Önizleme ayarı bu sunucuya geçirildi.

## Bilinen sınırlar

- Dönme (Kerr) yok; gölge biçimi ve ISCO dönen kara delikte değişir.
- Disk görünür ışıkta mavi-beyaz; EHT görüntüleri radyo dalga boyunda ve yalancı renkli.
- Sgr A* ve M87* gerçekte verimsiz sıcak akışla beslenir, ince diskle değil.
- Wikidata'da kara delik olarak sınıflanmış öğe az: bu çalışma sırasındaki sorguda 10'dan fazla
  dil bağlantısı olan tek öğe Sgr A*'dı.
