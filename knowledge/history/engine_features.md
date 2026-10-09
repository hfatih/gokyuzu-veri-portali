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

## 2026-10-08 · Faz 2: gezegenler

- **Kapsam:** Güneş Sistemi'nin 8 gezegeni (yerel arama, TR/EN) ve SIMBAD'daki ötegezegenler.
  Değerler Wikidata'dan, ana yıldız SIMBAD'dan.
- **Fizik:** `js/planet/derive.js`. Kontrolü `dev/check-planet.mjs`: Jüpiter yoğunluk ve çekim,
  Proxima b T_eq / YB / gelgit kilidi, birim dönüşümleri.
- **Görünüm:** `js/render/planet.js` gezegen sahnesi; `js/render/glview.js` ortak görünüm.
  Satürn halkaları, NASA dokuları (`assets/textures/`, kaynaklar `KAYNAK.md` dosyasında).
- **Kart:** ölçekli yörünge şeması ve yaşanabilir bölge; ana yıldıza tek tıkla geçiş.

Ayrıntı: [docs/specs/2026-10-08-faz2-gezegenler-design.md](../../docs/specs/2026-10-08-faz2-gezegenler-design.md)

## 2026-10-08 · Faz 3: bulutsular ve gözlem görüntüsü

- **Bulutsular:** H II, gezegenimsi, süpernova kalıntısı, yansıma ve karanlık bulutsu.
  `js/nebula/derive.js` (kontrolü `dev/check-nebula.mjs`), `js/render/nebula.js` (hacimsel, durağan).
- **Gözlem görüntüsü:** `js/ui/observation.js`, CDS hips2fits'ten (Pan-STARRS / DSS2) anlık kesit.
  Yıldız, ötegezegen ve bulutsu kartlarında.
- **Renk fonksiyonları:** `lineRgb` ve `scatteredRgb` (`render/color.js`); emisyon çizgisi ve
  toz saçılması renkleri CIE'den hesaplanıyor.

Ayrıntı: [docs/specs/2026-10-08-faz3-bulutsular-design.md](../../docs/specs/2026-10-08-faz3-bulutsular-design.md)

## 2026-10-08 · Faz 4: gökadalar

- **Fizik:** `js/galaxy/derive.js`. Kontrolü `dev/check-galaxy.mjs`: Hubble türü, uzaklık seçimi,
  eğiklik, Tully–Fisher, ΛCDM geriye bakış.
- **Görünüm:** `js/render/galaxy.js`. Analitik disk (sarmal kollar, çubuk, toz) ve iki parçalı
  şişkinlik; varsayılan bakış ölçülen eğiklikten.
- **Kart:** `js/ui/galaxy-card.js`.

Ayrıntı: [docs/specs/2026-10-08-faz4-gokadalar-design.md](../../docs/specs/2026-10-08-faz4-gokadalar-design.md)

## 2026-10-08 · Faz 5: kara delikler

- **Fizik:** `js/bh/derive.js`. Kontrolü `dev/check-bh.mjs`: EHT gölge boyutları, ISCO, Hawking,
  gelgit, disk sıcaklığı.
- **Veri ve arama:** `js/bh/fetch.js`, Wikidata'dan; aramada kara delik öğeleri 'bh:Q…' sayfasına gider.
- **Görünüm:** `js/render/blackhole.js`, piksel başına Schwarzschild jeodeziği, ince disk, Doppler
  ve kırmızıya kayma, merceklenme.
- **Kart:** `js/ui/bh-card.js`.
- **Geliştirme sunucusu:** `dev/serve.py` (no-store).

Ayrıntı: [docs/specs/2026-10-08-faz5-karadelikler-design.md](../../docs/specs/2026-10-08-faz5-karadelikler-design.md)

## 2026-10-09 · Faz 6: yıldız kümeleri

- **Fizik:** `js/cluster/derive.js`. Kontrolü `dev/check-cluster.mjs`: ZAMS, ZAMS uydurmasıyla
  kızarma, ışıma fonksiyonundan bükülme, anakol ömrü.
- **Üyeler:** `js/cluster/fetch.js`, SIMBAD üyeleri, tekilleştirilmiş.
- **Görünüm:** `js/render/cluster.js`, nokta sprite'lı sahne; `glview` sahneye özel vertex shader ve
  çizim desteği.
- **Kart:** `js/ui/cluster-card.js`, gerçek üyelerden HR diyagramı.

Ayrıntı: [docs/specs/2026-10-09-faz6-kumeler-design.md](../../docs/specs/2026-10-09-faz6-kumeler-design.md)

## 2026-10-09 · Faz 7: pulsarlar

- **Fizik:** `js/pulsar/derive.js`. Kontrolü `dev/check-pulsar.mjs`, ATNF'nin kendi türetilmiş
  sütunlarıyla: karakteristik yaş, yüzey alanı, Ė, ışık silindiri, kutup başlığı, ölüm çizgisi,
  ışın genişliği, dağılma gecikmesi, dik hız, sınıf.
- **Veri:** `js/pulsar/fetch.js`, ATNF kataloğu (VizieR B/psr, ASU TSV), SIMBAD konumu ve PSR adıyla eşleme.
- **Görünüm:** `js/render/pulsar.js`, deniz feneri: dönen radyo ışınları, dipol alan çizgileri,
  ışık silindiri, sıcak kutup başlıkları.
- **Kart:** `js/ui/pulsar-card.js`, atım profili ve "Atımları dinle" (`js/pulsar/sound.js`, gerçek
  dönemle ses).

Ayrıntı: [docs/specs/2026-10-09-faz7-pulsarlar-design.md](../../docs/specs/2026-10-09-faz7-pulsarlar-design.md)
