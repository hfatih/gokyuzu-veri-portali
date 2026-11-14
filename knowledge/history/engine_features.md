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

## 2026-10-09 · Faz 8: küçük cisimler

- **Veri ve arama:** `js/sso/fetch.js`, IMCCE SsODNet (quaero araması + ssoCard). Kimlik `sso:<id>`,
  aramada dördüncü kaynak.
- **Yörünge:** `js/sso/orbit.js`, Kepler konumu, Dünya ortalama yörüngesi, sayısal MOID.
- **Fizik:** `js/sso/derive.js`, sınıf, T_J, vis-viva, sıcaklık, çap (H, albedo), çekim, kaçış hızı,
  moloz yığını dönme sınırı, tehlike ölçütü, bugünkü parlaklık. Kontrolü `dev/check-sso.mjs`.
- **Görünüm:** `js/render/sso.js`, uzaklık alanlı ışın yürütmeyle elipsoit + pürüz, taksonomi rengi,
  albedo, gerçek dönme, bugünkü evre açısı, kuyruklu yıldızda koma.
- **Kart:** `js/ui/sso-card.js`, ekliptiğe yukarıdan yörünge çizimi.

Ayrıntı: [docs/specs/2026-10-09-faz8-kucuk-cisimler-design.md](../../docs/specs/2026-10-09-faz8-kucuk-cisimler-design.md)

## 2026-10-09 · Faz 9: kuasarlar

- **Fizik:** `js/quasar/derive.js`, ΛCDM uzaklıkları, geriye bakış ve o anki yaş, K düzeltmeli mutlak
  parlaklık, bolometrik ışıma, Eddington kütlesi, Lyα. Kontrolü `dev/check-quasar.mjs`.
- **Tayf:** `js/quasar/spectrum.js`, Vanden Berk bileşik tayfı, kırmızıya kayma, Lyα ormanı;
  gözlenen renk (`spectrumRgb`, color.js).
- **Kart:** `js/ui/quasar-card.js`, gözlenen tayf çizimi; NED bağlantısı.
- **Sahne:** kara delik sahnesi Eddington kütlesiyle yeniden kullanılıyor.

Ayrıntı: [docs/specs/2026-10-09-faz9-kuasarlar-design.md](../../docs/specs/2026-10-09-faz9-kuasarlar-design.md)

## 2026-11-05 · Geliştirmeler ve faz 10–12

- **Altyapı:**
  - `npm test` (`dev/check-all.mjs`), `npm run smoke` (`dev/smoke.mjs`, Playwright) ve CI.
  - Tür kaydı (`js/kinds/`).
  - Oturum önbelleği (`js/net/http.js`, kontrolü `dev/check-net.mjs`).
  - Tekrar dene düğmesi.
- **Gökyüzünde:** `js/sky/ephem.js`, `visibility.js` ve `ui/sky-card.js`. Kontrolü
  `dev/check-sky.mjs`.
- **Keşfet:** `js/explore/` (öne çıkanlar, turlar, başvuru çözümü, boyut) ve `ui/compare.js`.
  Kontrolü `dev/check-explore.mjs`.
- **İlişkili cisimler:** `js/search/related.js`.
- **Fizik:** sönümleme ve dev Teff tabloları (`star/derive.js`, `check-derive.mjs`), Wikidata
  aykırı tercih ve Bond albedo (`planet/units.js`, `planet/fetch.js`, `check-planet.mjs`).
- **Faz 10, çift yıldızlar:**
  - Hesap ve veri: `js/binary/` (ORB6, `check-binary.mjs`).
  - Arayüz ve sahne: `ui/binary-card.js`, `render/binary.js`.
- **Faz 11, değişen yıldızlar:**
  - Hesap ve veri: `js/variable/` (VSX, `check-variable.mjs`).
  - Arayüz: `ui/variable-card.js`.
  - Sahne: yıldız sahnesinde `uScale` ve zonklama.
- **Faz 12, uydular:** `planet/solar.js` `SOLAR_MOONS`, `planet/moon.js`, `kinds/moon.js` ve gezegen
  sahnesinde kip 4.

Ayrıntı: [docs/specs/2026-11-05-faz10-12-ve-gelistirmeler-design.md](../../docs/specs/2026-11-05-faz10-12-ve-gelistirmeler-design.md)

## 2026-11-05 · Üst bar, dil seçici, çerez metinleri ve yasal sayfalar

- **Üst bar:** "Astronews projesi · veriler anlık alınır, saklanmaz" şeridi kaldırıldı. Cümle alt bilgideki tanıtım
  metnine (`ft.about`) taşındı; başlık 32 px kısaldı, sayfa boşlukları buna göre azaltıldı.
- **Dil seçici:** TR/EN ana barın sağında, seçili dilin altında kayan vurgulu iki parçalı hap (`.langs`, `:has()`).
- **Çerez kutusu:** KVKK Çerez Uygulamaları Rehberi'ne göre yeni metinler; eşit ağırlıkta reddet/kabul, "reddetmek
  hiçbir bölümü kapatmaz", bilimsel veri sunucuları için bilgi satırı (`cs.c.third`).
- **Yasal sayfalar (`js/legal/`):** astronews `astro/legal.py` temel alındı. Veri sorumlusu GitHub: hfatih, iletişim
  GitHub Issues (e-posta tanımlanırsa o). Adres yoksa gösterilmez. Harvard aynası sunucu tablosunda, KVKK m. 9
  (7499 sayılı Kanun, 2024) yurt dışı aktarım paragrafı, m. 14 Kurul'a şikâyet, açık rıza ve alenileştirme sebepleri,
  Kullanım Koşulları'na sorumluluk sınırı ve Güneş uyarısı. Barındırma ve kayıt süresi yer tutucu (yer belli değil).

## 2026-11-13 · Gerçek gözlem haritaları: Ay, Jüpiter ve büyük uydular

- **Kapsam:** Ay, Jüpiter, İo, Europa, Ganymede, Kallisto ve Enceladus artık NASA/USGS kamu malı haritasıyla çizilir
  (önce yalnız Merkür, Dünya, Mars). Mevcut üç harita da kaynaktan 4096×2048'e yeniden üretildi (Dünya 3840×1920).
  Kaynak ve işlem ayrıntısı `assets/textures/KAYNAK.md`.
- **`planet/solar.js`:** Jüpiter ve altı uyduya `texture`; tek renkli haritalara `mono: true`.
- **`planet/visual.js`:** haritalı uydu kip 0, `fallback` = eski temsili kip (harita inene kadar çizilir), `tint` =
  tek renkli haritada `look.zone` tonu. Haritalı dev gezegen (Jüpiter) kip 0 ama basıklık, atmosfer kenarı ve
  kenar kararması modelden; `fallback` bant modeli.
- **`render/planet.js`:** `uTint` uniform'u; doku yokken `p.fallback ?? 3`; kip 0 + bant sayısı > 0 iken bulutlu
  atmosfer kenar kararması.
- **Kart:** uydu notu haritalıysa `m.noteTexture`, değilse `m.noteLook`. Yasal sayfadaki doku satırı genişletildi.
- **Dokunulmayan:** Satürn (kamu malı tam harita yok), Venüs/Uranüs/Neptün/Titan (görünür ışıkta yüzey yok),
  Triton/Fobos/Deimos (tam harita yok).
- **Maliyet:** `assets/textures` 1,5 MB → 15 MB; harita başına 0,5–3,2 MB, yalnız o cisim açılınca iner.
- Kontrol: `dev/check-planet.mjs` (doku dosyaları depoda, kipler, renklendirme, Jüpiter basıklığı).

## 2026-11-13 · Fizik yükseltmesi 1/9: gökada sahnesi

- **`render/galaxy.js` (yeniden yazıldı):** sonsuz ince disk yerine kalınlığı olan katman (yarıçapta üstel, düşeyde
  sech²; genç yıldız ve toz yarı kalınlıkta) 28 adımla geçilir; toz geçirgenliği renge göre (A_λ/A_V = 0,78 / 1 / 1,32).
  Şişkinlik Sérsic hacim yoğunluğu (Prugniel & Simien 1997), adımlar merkeze en yakın geçişte sıklaşır (sinh).
  Kol/çubuk deseni Ωp ile katı, madde Ω(R) = V/√(R² + Rc²) ile döner; madde çerçevesi iki evreli çapraz geçişle.
- **`galaxy/visual.js`:** `sersicBulge` (B/T oranını sayısal integralle tutturur), `youngFraction` (B−V → genç ışık payı),
  `ellipticalSersicN` (Graham & Guzmán 2003); tablolar: Sérsic n ve disk kalınlığı türe göre (Graham & Worley 2008,
  de Grijs 1998), tür ortalaması B−V (Roberts & Haynes 1994). Ölçülen B−V tür ortalamasını en çok ±0,15 kaydırır
  (SIMBAD gökada parlaklıkları güvenilmez: M51 için 0,9).
- **`galaxy/derive.js`:** `rotPeriodMyr` (2πR/V), `bv`. Kartta "Dönme dönemi" satırı.
- **`render/glview.js`:** `static` artık parametreye göre işlev olabilir (eliptik durağan, diskli gökada döner).
- Kontrol: `dev/check-galaxy.mjs` (Sérsic integrali, renk → genç pay, tür eğilimleri). Tarayıcıda M51, M33, NGC 1300,
  NGC 4565 (yandan) açıldı.

## 2026-11-13 · Fizik yükseltmesi 2/9: kara delik ve kuasar

Sahne zaten jeodezik izleme, Shakura–Sunyaev profili, Doppler ve kütleçekimsel kırmızıya kayma içeriyordu. Eklenen:
- **Göze görünen disk parlaklığı (`render/blackhole.js` `planckV`):** T⁴ yerine g·T sıcaklığındaki kara cismin 550 nm
  Planck ışınımı. Sıcak diskte T ile doğrusal; iç kenar ve yaklaşan yan artık abartılı parlamıyor. Model denetiminde
  bilinçli bırakılan tek T⁴ sahnesi buydu.
- **Göreli jet (`jet()`):** paraboloit (yarıçap ∝ z^0,58, Asada & Nakamura 2012), sinkrotron rengi f_λ ∝ λ^−1,3,
  Doppler güçlenmesi δ^2,7, Γ = 2 (sahnenin gösterdiği ilk ~40 r_s ivmelenme bölgesi). Jet jeodezik döngüsünde
  toplandığı için kütleçekimsel merceklenir.
- **Ne zaman çizilir (`quasar/derive.js` `hasJet`, `isBlazar`):** blazar türleri ya da 3C / 4C / PKS adı. Blazarda
  kamera eksene ~20° açıyla başlar. Kara delik sayfalarında (Wikidata) jet verisi yok; M87* jetsiz çizilir.
- Dönen (Kerr) kara delik bilinçli olarak yapılmadı.
- Kontrol: `dev/check-quasar.mjs`. Tarayıcıda 3C 273 (blazar), 3C 48 (yandan), Sgr A*.

## 2026-11-13 · Fizik yükseltmesi 3/9: yıldız sahnesi

Sahne zaten çekim kararması (von Zeipel), Roche basıklığı, ölçülmüş kenar kararması, granülasyon, dev hücreler,
aktivite kuşağı lekeleri ve Güneş etkinlik modelini içeriyordu; planda "eklenecek" dediğim çekim kararması ve
lekeler mevcuttu. Eklenen tek şey:
- **Kenar kızarması (`render/star.js`):** renk, gri atmosferde görülen sıcaklıktan T(μ) = T ((3μ + 2)/5)^¼
  (Eddington–Barbier; kenarda 0,80 T). Parlaklık düşüşü yine ölçülmüş kenar kararması yasasından. Yalnız shader;
  tarayıcıda Güneş ve Vega ile bakıldı.

## 2026-11-13 · Fizik yükseltmesi 4/9: bulutsu sahnesi

Kart fiziği (Strömgren, Sedov–Taylor, dinamik yaş) zaten vardı; değişen sahne:
- **H II:** ışınım ∝ n_e², Hα/Hβ = 2,86; yöne göre değişen iyonlaşma cephesi, cephede parlak kenar ve [S II],
  dışında nötr tozlu zarf.
- **Toz:** geçirgenlik renge göre (A_λ/A_V = 0,78 / 1 / 1,32), bütün türlerde; toz arkasındaki ışık kızarır.
- **Yansıma:** Henyey–Greenstein evre işlevi (g = 0,6).
- **Süpernova kalıntısı:** kabuk kalınlığı evreden (`sedov`): Sedov'da R/12, serbest genişlemede kalın + [O III] püskürük.
- **Gezegenimsi:** eksen oranı 0,7'nin altına indikçe çift kutuplu (`bipolar`).
- Yengeç'teki sinkrotron iç bulutsu yapılmadı: bulutsu kaydında pulsar bilgisi yok.
- Kontrol: `dev/check-nebula.mjs`. Tarayıcıda M42, M1, M27, M78, Atbaşı. SIMBAD'ın "ISM" ya da "açık küme" saydığı
  bulutsular (NGC 1435, NGC 7023) bulutsu sahnesine hiç girmiyor; bu eski davranış, dokunulmadı.

## 2026-11-13 · Fizik yükseltmesi 5/9: yıldız kümesi

- **Derinlik (`cluster/visual.js` `plummerDepth`):** bağımsız Gauss yerine Plummer küresinin tam koşullu dağılımı:
  z = √(a² + R²) · T₄/2 (T₄: 4 serbestlik dereceli Student-t), a = izdüşümde yarı-sayı yarıçapı. Merkezdeki yıldızın
  derinliği dar, kenardakinin geniş. Küresel kümede King profili kullanılmadı (yoğunlaşma verisi yok).
- **`cluster/derive.js`:** `halfRadiusPc`; kartta "Yarı-sayı yarıçapı" satırı.
- **`dev/check-syntax.mjs` (yeni):** js/ altındaki her dosyayı `node --check` ile ayrıştırır. Sebep: 4. aşamada
  `i18n.js` içine kaçışsız kesme işareti ("1/12'si") yazıldı, site açılmaz oldu ama 18 testin hepsi geçti, çünkü
  hiçbiri DOM'a bağlı dosyaları içe aktarmıyor. Hata 6976b40 commit'inde, yayına çıkmadan burada düzeltildi.
- Kontrol: `dev/check-cluster.mjs` (örnekleme tam ise üç boyutlu yarı-kütle yarıçapı 1,305 a). Tarayıcıda Ülker, M13.

## 2026-11-13 · Fizik yükseltmesi 6/9: pulsar

Atım profili grafiği (W50'den) zaten vardı. Eklenen:
- **Işık bükülmesi (`render/pulsar.js`):** nötron yıldızı R/√(1 − u) boyunda görünür; yüzey noktası Beloborodov (2002)
  yaklaşımıyla bulunur: 1 − cos α = (1 − cos ψ)(1 − u). Arka yüzdeki kutup başlığı ψ ≈ 135°'ye kadar görünür.
- **`pulsar/derive.js`:** `compactness` (1,4 M☉, 10 km → 0,41), `visibleFraction` (%85), `surfaceZ` (0,31),
  `apparentRadiusKm` (13 km). Kartta "Işık bükülmesi" satırı.
- Kontrol: `dev/check-pulsar.mjs`. Pulsar verisi (ATNF, VizieR) CDS bozukken gelmediği için sahne canlı kartla değil,
  sayfa içinde Yengeç pulsarı parametreleriyle çizdirilerek doğrulandı (iki başlık aynı anda görünüyor).

## 2026-11-13 · Fizik yükseltmesi 7/9: gezegen

- **Rayleigh saçılımı:** `planet/derive.js` `rayleighTau(gas, bar, g)` = σ P / (μ m_u g) (550 nm). Dünya 0,097,
  Mars 0,002 (kenar rengi tozdan, temsili kalır), modellenen devlerde bulut tepesi 0,7 bar varsayımıyla (Satürn 0,145,
  Neptün 0,135). Haritalı Jüpiter'de yok (harita atmosferi içerir). Shader: gazın ışığı tek saçılmadan, yüzey ışığı iki
  akım yaklaşımıyla. İlk denemede yalnız tek saçılma parlak bulutların mavisini kararttı (Neptün gri-yeşil); düzeltildi.
  Dünya'nın temsili mavi kenar parıltısı kapatıldı.
- **Satürn halkaları:** `planet/solar.js` `SATURN_RING_TAU` (Colwell+ 2009 özetinden yuvarlanmış dik optik derinlik);
  shader tablosu bu veriden üretilir. Aydınlık yüzde yansıma, karanlık yüzde içinden süzülme (yoğun B halkası kararır,
  C ve Cassini Bölümü parlar); gezegene düşen gölge e^(−τ/μ₀). Tablo değerleri bellekten yazıldı, kaynaktan tek tek
  doğrulanmadı.
- **`dev/check-syntax.mjs`:** artık sahne modüllerini de içe aktarır (şablon içindeki tanımsız ad yakalanır; bu aşamada
  eksik bir import böyle bulundu).
- Kontrol: `dev/check-planet.mjs`. Tarayıcıda Satürn, Dünya, Neptün.

## 2026-11-13 · Fizik yükseltmesi 8/9: kuyruklu yıldız

- **Koma rengi:** tozun yansıttığı güneş ışığı + C₂ Swan bandı yeşili (516,5 nm, `lineRgb`); önce düz mavi-beyazdı.
- **İki kuyruk (`render/sso.js`):** iyon kuyruğu (CO⁺ mavisi) Güneş'in tam tersine dar ve düz, etkinliğin karesiyle;
  toz kuyruğu sarımsı, geniş, yörüngede geride kalan yöne eğri. Sınır küresinde 40 adım.
- **Bilinçli sınırlar:** kuyruk uzunluğu ölçekli değil (gerçekte çekirdeğin milyonlarca katı; eski not bu yüzden hiç
  çizmiyordu). Toz kuyruğunun hangi yana eğrildiği temsili: sahnede yörünge düzleminin yönü hesaplanmıyor.
- Kontrol: `dev/check-sso.mjs`. Bugün etkin bir kuyruklu yıldız kartı olmadığı için sayfa içinde 1 AU'daki bir çekirdek
  parametreleriyle çizdirilerek bakıldı.

## 2026-11-13 · Fizik yükseltmesi 9/9: çift yıldız

- **Dinamik kütle oranı (`binary/derive.js`):** M₂ = (Kepler III toplamı) − M₁ (yıldızın kendi türetiminden);
  0,05–1,5 aralığındaysa kullanılır (`q.origin: 'derived'`), yoksa eski fotometrik oran.
- **Beyaz cüce yoldaş (`classifyCompanion`, `whiteDwarfRadius`):** kütlesine göre anakoldan ≥ 4 kadir sönük ve
  < 1,44 M☉ ise beyaz cüce. Yarıçap Nauenberg (1972), sıcaklık V bandı yüzey parlaklığının Planck tersinden.
  Sirius B: 1,01 M☉, 0,0077 R☉, ~21 500 K (ölçülen 1,02 / 0,0084 / 25 200); Procyon B ~7900 K (ölçülen 7740).
- **Sahne:** beyaz cüce sıcak ve küçük çizilir (`r2`), kütle merkezi dinamik orana göre. Kartta "Yoldaş" satırı.
- Bilinen hata (progress.md: "beyaz cüce yoldaş anakol varsayımıyla yanlış renkte") kapandı.
- Kontrol: `dev/check-binary.mjs`. ORB6 (VizieR) CDS bozukken gelmediği için sahne sayfa içinde Sirius elemanlarıyla
  çizdirilerek bakıldı.

## 2026-11-14 · Gerçekçilik A grubu: gökyüzü, kabartma, Dünya gecesi, cüce gezegenler, halka rengi

- **(Aynı gün geri alındı, aşağıya bak)** **Gerçek gökyüzü (bütün ışın sahneleri):** `render/glview.js` `SKY_GLSL` + `sky(yön)`; doku 7. birimde, her görünüm
  bir kez yükler. Yıldız, gezegen, gökada, bulutsu, kara delik (merceklenir), pulsar, küçük cisim ve çift yıldız
  sahnelerinde rastgele nokta yıldızlar kaldırıldı. Küme sahnesi (nokta çizimi) arka plansız kaldı.
- **Kabartma:** `planet/solar.js` `relief` (Ay, Mars); `render/planet.js` eğim haritasından normal bükülür.
- **Dünya:** bulutlu harita (`earth.jpg` değişti) + `night` gece ışıkları; bulut altı ışık gündüz parlaklığından kısılır.
- **Ceres, Vesta, Plüton:** `sso/visual.js` `ssoTexture`; `render/sso.js` haritayı ortalamasına bölüp ölçülen albedoyla
  çarpar (tek renkliler taksonomi rengiyle). Kartta `sso.noteTexture`.
- **Satürn halka rengi:** `SATURN_RING_COLOR` (C ve Cassini Bölümü koyu-gri, B en parlak ve kırmızı); değerler temsili.
- **`render/planet.js` `bindMap`, `loadImage` dışa açıldı** (küçük cisim sahnesi kullanır).
- `assets/textures` 15 → 22 MB; gökyüzü (1,5 MB) her ilk ziyarette iner, diğerleri yalnız o cisimde.
- Kontrol: `dev/check-planet.mjs`, `dev/check-sso.mjs`. Tarayıcıda Ay (gece-gündüz çizgisinde krater gölgesi), Dünya
  gece yüzü (sayfa içi kamera), Satürn, Ceres, Plüton, Vesta, kara delik (sayfa içi).

## 2026-11-14 · Gökyüzü: fotoğraf yerine yordamsal yıldız alanı

- **Neden:** NASA Deep Star Maps 4k dokusu büyütmede yıldızları bulanık leke gibi gösterdi; Fatih "eski yapay yıldızlar
  daha iyi, fizik ve matematikle net ve keskin kendin yap" dedi. `sky.jpg` silindi, doku yükleme kodu kaldırıldı.
- **`render/glview.js` `SKY_GLSL`:** 3B hücre ızgarası, hücre başına en çok bir yıldız (izdüşüm sınırdan ≥ 0,3 hücre
  içeride; kesik yıldız olmaz). Üç katman, N(<m) ∝ 10^(0,45 m), gök geneli ~25 000 yıldız (m ≤ 7,5). Hücre başına düşme
  oranı Monte Carlo ile ölçüldü: ≈ 0,9 p s². Nokta yayılım işlevi piksel cinsinden Gauss (σ 0,6 px) + r^−3 hale: her
  çözünürlükte keskin, parlaklar doğal olarak büyük. Renk Planck eğrisinden (610/550/465 nm), sıcaklık parlaklık sınırlı
  örneklem karışımından. Samanyolu: gerçek galaktik kutup/merkez yönleri, sönük yıldızlar düzlemde 3,5 kat yoğun, yaygın
  ışık + düzlem boyunca uzun toz şeritleri. Doğrulama: galaktik merkez yönünde ortalama piksel 16,9, kutupta 0,4.
- **Yasal sayfa yıldızları (CSS):** box-shadow deseni 2000 px genişti; geniş ekranda sağ boş kalıyordu. `.stars.far`
  ile yatayda bir kopya.

## 2026-11-14 · Tayfsal çiftler (SB9), VizieR aynası, yasal metinler

- **VizieR Harvard aynası (`net/vizier.js` `asu`, `ASUS`):** CDS 404 ya da zaman aşımında `vizier.cfa.harvard.edu`
  (CORS açık); `pulsar/fetch.js` de buradan geçer. Değişen yıldız (VSX), görsel çift (ORB6) ve pulsar (ATNF) verisi
  2026-11-05'ten beri gelmiyordu, geri geldi. Kontrol: `dev/check-vizier.mjs`.
- **Tayfsal çiftler:** `binary/fetch.js` `fetchSb9` (B/sb9/main + orbits; K2'li, en yüksek notlu, en yeni yörünge),
  `binary/derive.js` `deriveSpectroscopic` (q = K₁/K₂, M sin³i, f(M), a sin i, birincil kütlesinden eğiklik; SB1'de M₂
  kütle işlevinden 60° varsayımıyla Newton), `radialVelocity`. Kartta dikine hız eğrisi ve 3D düğmesi; görsel yörünge
  (ORB6) yoksa devreye girer. Düğüm açısı ölçülemez, 90° seçildi (yörünge ekranda yatay). Spica testi: q 0,635, M₁ sin³i
  7,14 (bilinen 7,8; 1972 yörüngesi).
- **Yasal (`legal/site-info.js`, `pages.js`):** barındırma Keyubu (Türkiye), sunucu kayıtları 14 gün (nginx logrotate),
  iletişim kvkk@gokyuzuveriportali.com.tr, yurt dışı paragrafı sunucu Türkiye'de olacak biçimde, SB9 ve VizieR aynası
  kaynaklarda. Taslak uyarısı kalıyor (hukukçu incelemesi yok).
- **`index.html`:** hfatih.github.io açılırsa gokyuzuveriportali.com.tr'ye yönlenir (aynı dosyalar iki yerde).

## 2026-11-14 · Yayın: gokyuzuveriportali.com.tr

- YunoHost (Keyubu VM, 45.155.124.197): `my_webapp__6` alan adının köküne, ziyaretçilere açık, PHP ve veritabanı yok.
  `www` klasörü `/var/www/gokyuzu-veri-portali`'ye sembolik bağ (sahibi fatihbtw:www-data, 2775); astronews ile aynı yol,
  güncelleme kök yetkisi istemez: `tar czf - index.html css js assets | ssh -p 107 fatihbtw@45.155.124.197 'tar xzf - -C /var/www/gokyuzu-veri-portali'`.
- Let's Encrypt sertifikası (ana ve www). `www.gokyuzuveriportali.com.tr` YunoHost alan adı + `redirect__3` (302, yol ve
  sorgu korunur). http → https 301 YunoHost'tan.
- Posta: kvkk@gokyuzuveriportali.com.tr, fatihbtw kullanıcısının takma adı (MX kaydı vardı).
- GitHub Pages kopyası `index.html` içindeki betikle yeni alan adına yönlenir; ikisi birlikte güncellenmeli.
