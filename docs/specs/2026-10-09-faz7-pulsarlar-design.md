# Gökyüzü Veri Portalı — Faz 7 (Pulsarlar) Tasarımı

Tarih: 2026-10-09 · Durum: uygulandı

## Kullanıcı kararı

Faz 6'dan sonra Fatih "Devam et faz falan varsa sıra sıra" dedi. Önerilen sıradaki faz, pulsarlar
uygulandı.

## Veri (`js/pulsar/fetch.js`)

- **Tür:** SIMBAD `Psr` (3.983 cisim) ve `N*`.
- **Zamanlama:** ATNF Pulsar Kataloğu, VizieR `B/psr/psr` kopyası (2015 sürümü, 2.536 pulsar).
  Güncel ATNF sitesinin CORS'u yok.
- **Servis:** VizieR ASU (TSV). TAPVizieR https'te `Access-Control-Allow-Origin` başlığını iki kez
  gönderiyor ("*, *"); tarayıcı reddediyor, curl'de fark edilmiyor.
- **Eşleme:** SIMBAD konumunun 10″ çevresi, uzaklığa göre sıralı. SIMBAD'daki "PSR J…" / "PSR B…"
  kimliğiyle eşleşen kayıt alınır, yoksa en yakını. Ad listesiyle ASU sorgusu desteklenmiyor;
  küresel küme pulsarları birbirine birkaç yay saniyesi yakın olduğu için ad eşlemesi gerekli.
- **Kullanılmayan sütun:** `A1` (yörünge büyüklüğü) VizieR kopyasında tek anlamlı basamağa
  yuvarlanmış (J0437 için 3,3667 yerine 3). Kütle fonksiyonu hesaplanmaz; katalogdaki en küçük eş
  kütlesi (`minM`) gösterilir.

## Fizik (`js/pulsar/derive.js`, `dev/check-pulsar.mjs`)

Varsayımlar ATNF'nin türetilmiş sütunlarıyla aynı: R = 10 km, I = 10⁴⁵ g cm², M = 1,4 M☉.
Kontroller ATNF'nin kendi `Age`, `Bsurf`, `Edot`, `VTrans` değerleriyle %1–2 içinde.

- **Karakteristik yaş:** τ = P/2Ṗ. Yengeç 1.257 yıl; gerçek yaşı 972 yıl, kartta yazılır.
- **Manyetik alan:** B = 3,2 × 10¹⁹ √(PṖ) G; B_Q = 4,414 × 10¹³ G'ye oranı.
- **Dönme enerjisi kaybı:** Ė = 4π²IṖ/P³.
- **Işık silindiri ve kutup başlığı:** R_LC = cP/2π; θ_pc = asin √(R/R_LC).
- **Dönme:** ekvator hızı ve merkezkaç/kütleçekim oranı.
- **Ölüm çizgisi:** B/P² ≥ 0,17 × 10¹² G s⁻² (Chen ve Ruderman 1993, yaklaşık).
- **Işın yarı genişliği:** ρ = 5,75° P^−½ (Rankin 1993, dış koni).
- **Dağılma:** 400 ile 1400 MHz arası gecikme 4,1488 × 10³ s × DM × (ν₁⁻² − ν₂⁻²); ortalama elektron
  yoğunluğu DM/d.
- **Dik hız:** 4,74 μ d.
- **Sınıf:**
  - ATNF tür kodu AXP: magnetar; XINS: ısıl yalıtık nötron yıldızı.
  - P < 30 ms ve B < 10¹⁰ G: milisaniye pulsarı.
  - τ < 10⁵ yıl: genç; aksi halde olağan.
- **Uzaklık:** ATNF en iyi kestirimi. Paralaks varsa "ölçülen", yoksa "tahmini" (TC93 elektron
  modeli).

## Görünüm (`js/pulsar/visual.js`, `js/render/pulsar.js`)

Deniz feneri modeli. Birim R_LC = 1, dönme ekseni y.

- **Manyetik eksen:** α = 45° eğik (varsayım), gerçek dönemle döner. Varsayılan hız: bir dönüş
  2 sn. 3D'deki hız çubuğu artık 10⁻⁴'e iniyor (yavaşlatma).
- **Hacimsel ışın yürütme:**
  - Radyo ışınları ±m çevresinde ρ genişlikli koniler, yalancı renk mor. Parlaklık ∝ 1/ρ²: aynı güç
    geniş koniye yayılır; yoksa milisaniye pulsarında sahneyi boğuyordu.
  - Kapalı dipol alan çizgileri: r = L sin²θ, L = 0,3 / 0,55 / 0,8, 60°'lik altı düzlem.
  - Işık silindiri.
- **Nötron yıldızı:** analitik küre, ~10⁶ K kara cisim rengi. En az 0,04 R_LC çizilir (Yengeç'te
  gerçek oran 0,006). Kutup başlıkları daha parlak.
- **Bakış yüksekliği:** 90° − α. Üst ışın her dönüşte kameranın üzerinden geçer.

## Kart (`js/ui/pulsar-card.js`)

- **Atım profili:** W50 yarı yüksekliğinde tek Gauss, üç dönem.
- **Atımları dinle:** `js/pulsar/sound.js`, bir dönemlik Gauss pencereli gürültü tamponu döngüde.
  Yengeç vızıldar, yavaş pulsar tıklar. Cisim değişince ya da ana sayfada durur.
- **Satırlar:** dönem, Ṗ, yaş, B, Ė, R_LC, kutup başlığı, ekvator hızı, ölüm çizgisi, ışın, uzaklık,
  DM ve gecikme, dik hız, yörünge (dönem, e, en küçük eş kütlesi, eş türü), glitch sayısı, süpernova
  kalıntısı.
- **Bağlantı:** ATNF kataloğundaki zamanlama çözümü.
- **Katalogda olmayan pulsar** (ör. J0952−0607, 2017'de bulundu): kart yalnız SIMBAD bilgisiyle
  çizilir, sahne çizilmez, arka plan soluklaşır (`data-kind="other"`).

## Arama

Türkçe adlar: "Yengeç Pulsarı" (`V* CM Tau`), "Vela Pulsarı".

## Aynı fazda düzeltilen hata

Üyesi gelmeyen kümede `data-kind` "cluster" kalıyordu. Önceki cismin sahnesi tam parlaklıkta
duruyordu; artık "other" olarak soluklaşıyor.

## Bilinen sınırlar

- **Katalog eski:** VizieR kopyası 2015; sonradan bulunan pulsarlar (~1.200) yok.
- **Manyetik eğiklik:** α ve görüş açısı ölçülmüyor; tek bir varsayım kullanılıyor.
- **Atım profili:** tek Gauss, gerçek profil çok bileşenli.
- **Hulse–Taylor:** yörünge küçülmesi (genel görelilik) hesaplanmıyor, kütleler katalogda yok.
