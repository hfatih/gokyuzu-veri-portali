# Hata düzeltmeleri

## 2026-10-08 · v1 geliştirme sırasında bulunanlar

- **SIMBAD önek sorgusu 100 sn'yi aştı.** `'M 3%'` ile `ORDER BY nbref` birlikte kullanılınca
  sunucu tüm tabloyu taradı. `ORDER BY` kaldırıldı, sıralama istemcide yapılıyor; her isteğe
  6 sn zaman aşımı eklendi.
- **Türkçe karakterli girdide SIMBAD hata verdi** ("kutup yıld", "güneş"). ASCII olmayan girdi
  artık SIMBAD'a gönderilmiyor.
- **Takımyıldız kısaltması yanlış büyük harfle yazılıyordu** (`Cma`). Doğrusu `CMa`; 88 IAU
  kısaltmasıyla düzeltildi.
- **Proxima'nın yarıçapı 0,44 R☉ çıktı.** Torres BC_V polinomu 3300 K altında geçersiz. M
  cücelerinde K bandına geçildi, sonuç 0,158 (literatür 0,154).
- **LMC kartı açılmadı.** Gökadanın binlerce alt cismi `h_link` sorgusunu zaman aşımına
  uğratıyordu. Sorgu SQL'de gezegenlerle süzülüyor; ikincil sorgular `allSettled` ile
  birbirinden bağımsız başarısız olabiliyor.
- **Betelgeuse krem rengi görünüyordu.** Kanal başına ACES tonu kaydırıyordu; ton eşleme yalnız
  en parlak kanala uygulanıyor.
- **`hidden` öznitelikli köşe önizlemesi görünüyordu.** `.corner { display:flex }` gizlemeyi
  eziyordu; `[hidden] { display:none !important }` eklendi.

## 2026-10-08 · Faz 2 sırasında bulunanlar

- **TRAPPIST-1 yarıçapı 1,99 R☉ çıktı** (doğrusu 0,12). Tayf türünde ışıklılık sınıfı yok
  ("M7.5e"); cüce yolu tetiklenmedi ve BC_V 2475 K'e dışdeğerlendi. Sınıfı olmayan ve log g ≥ 4
  olan soğuk yıldızlar artık K bandıyla hesaplanıyor (test eklendi).
- **Satürn "Neptün benzeri" sınıflandı.** Ortalama yarıçapı 9,14 R⊕; tür artık kütleye de
  bakıyor (M ≥ 50 M⊕ → gaz devi).
- **Neptün "mini-Neptün" çıkıyordu** (3,87 R⊕ < 4). Sınır 3,5 R⊕'e çekildi.
- **Satürn halkaları neredeyse yandan görünüyordu.** Eksen eğikliği z yerine x ekseninde
  (izleyiciye doğru) uygulanıyor.
- **Neptün gri görünüyordu.** Güneş ışığının hafif sıcak kara cisim rengi doku ve bulut
  renklerine ikinci kez biniyordu; ışık Güneş'e beyaz dengelendi.

## 2026-10-08 · Faz 3 sırasında bulunanlar

- **Ters `smoothstep` kenarları:** üç shader'da 9 çağrıda edge0 > edge1 vardı; GLSL'de bu tanımsız
  davranış. Hepsi `1.0 - smoothstep(b, a, x)` biçimine çevrildi.
- **M1'in adı "CRAB NEB" görünüyordu.** İlk `NAME` kimliği kısaltma; artık küçük harf içeren en
  uzun ad seçiliyor ("Crab Nebula", "Proxima Centauri").
- **M57 gözlemi DSS2'de doymuştu, Betelgeuse Pan-STARRS'ta maskeliydi.** Tarama seçimi artık
  gökyüzü bölgesine ve parlaklığa göre yapılıyor.
- **CIE fonksiyonları iki kopyaydı.** `blackbodyTable` ortak `cieX/Y/Z` fonksiyonlarını kullanıyor;
  çıktı birebir aynı (3633 K → rgb(255, 203, 147)).

## 2026-10-08 · Faz 4 sırasında bulunanlar

- **Yakın gökada uzaklıkları:** SIMBAD'daki "redshift" yöntemli uzaklıklar yanıltıcı (M33: 4,11
  Mpc, Sefeid 0,84). Başka ölçüm varsa dışlanıyor.
- **Sombrero eğikliği:** eksen oranından 56° çıkıyor (gerçek ~84°). Şişkinlik baskın türde bu yöntem
  geçersiz; eğiklik "tahmini" etiketi alıyor.
- **Gaia bağlantısı gökada ve bulutsuda anlamsızdı.** Yalnız yıldızlarda gösteriliyor.

## 2026-10-08 · Faz 5 sırasında bulunanlar

- **Sgr A*'nın kütlesi "bilinmiyor" görünüyordu.** Kod doğruydu; tarayıcı önbellek başlığı olmayan
  `units.js`'in eski sürümünü kullanıyordu. `dev/serve.py` her yanıta no-store başlığı ekliyor.
- **Doppler asimetrisi görünmüyordu.** Disk ışınımı ton eşlemeyi doyuruyordu; çarpan 2,2'den 0,7'ye
  indirildi.
- **Önerilerde yanıltıcı "makale" sayısı:** SIMBAD'sız kara delikte sıralama değeri (dil bağlantısı
  × 50) makale sayısı gibi görünüyordu; artık gösterilmiyor.

## 2026-10-09 · Faz 6 sırasında bulunanlar

- **Gözlem taraması seçimi:** `null < 8` JavaScript'te true döndüğü için parlaklık vermeyen kartlar
  faz 3'ten beri Pan-STARRS yerine DSS2 alıyordu. Açık null kontrolü eklendi.
- **Küme üyeleri kopyalanıyordu.** Aynı yıldız her üyelik makalesi için `h_link`'te ayrı satır.
  Sonuç: sayımlar ~6 kat şişmişti, 3D'de çizgi deseni vardı. `DISTINCT` ve tekilleştirme eklendi.
- **Basit doğrusal eşlik üreteci** ardışık çiftleri çizgilere diziyordu; mulberry32'ye geçildi.
- **İlk yaş kuralı** (üçüncü en parlak anakol yıldızı) mavi başıboş ve yatay kol yıldızlarını bükülme
  sanıyordu (M67 0,5 milyar, ω Cen 0,9 milyar yıl). Işıma fonksiyonu yürüyüşüne geçildi; küresel
  kümede yaş verilmiyor.
- **Kızarma:** Yok sayılınca h Persei 1,5 milyar yıl çıkıyordu. ZAMS uydurmasıyla düzeltiliyor
  (E ≥ 0,15).

## 2026-10-09 · Faz 7 sırasında bulunanlar

- **TAPVizieR tarayıcıda engelleniyor:** https yanıtında `Access-Control-Allow-Origin` iki kez
  ("*, *"). curl testinde fark edilmedi, tarayıcı isteği reddetti. VizieR ASU (TSV) servisine geçildi.
- **VizieR B/psr `A1` sütunu** tek basamağa yuvarlanmış; kütle fonksiyonu bundan hesaplanmıyor,
  katalogdaki `minM` kullanılıyor.
- **Milisaniye pulsarında ışın sahneyi boğuyordu** (ρ ~ 75°). Parlaklık 1/ρ² ile ölçekleniyor.
  Sınır küresinde kesik ışın kenarı da yumuşatıldı.
- **Üyesi gelmeyen küme ve verisi olmayan pulsar:** önceki cismin sahnesi tam parlaklıkta kalıyordu.
  `data-kind="other"` verilerek soluklaştırılıyor.
- **Kart altyazısında tekrar:** "PSR J1808-2024" iki kez yazılıyordu.

## 2026-10-09 · Faz 8 sırasında bulunanlar

- **JPL SBDB API'sinde CORS yok;** IMCCE SsODNet'e geçildi.
- **IMCCE MOID değerleri yanlış ya da eski** (Bennu 0,084, Apophis 0,033 AU). MOID yörünge
  elemanlarından hesaplanıyor (Bennu 0,0028; JPL 0,0032).
- **2P/Encke'de H1 = R1 = 0,0 yer tutucu:** parlaklık 0,2 kadir çıkıyordu; sıfır değerler yok sayılıyor.
- **Arama önerisinde tür yanlıştı:** Halley "Cüce gezegen" görünüyordu. Takma adlar artık kendi türünü
  taşıyor.
- **Parlaklık ölçeği:** albedo × 9 Bennu'yu (0,044) açık gri, Vesta'yı beyaz yapıyordu; × 1,6'ya
  indirildi.
