# Gökyüzü Veri Portalı — Geliştirmeler ve Faz 10–12 Tasarımı

Tarih: 2026-11-05 · Durum: uygulandı

## Kullanıcı kararı

Dokuz fazdan sonra önerilen geliştirme listesi için kullanıcı "Yayına almak hariç hepsini yap" dedi.
Yayına alma ve alan adı bu çalışmanın dışında kaldı. CI iş akışı ve Open Graph etiketleri yayın
gerektirmediği için yapıldı.

## Altyapı

- **Testler:** `npm test` tüm `dev/check-*.mjs` betiklerini çalıştırır (`dev/check-all.mjs`).
- **Duman testi:** `npm run smoke` (`dev/smoke.mjs`), Playwright ve Chromium ile.
  - Dış servisler küçük sabit yanıtlarla karşılanır. Amaç akışın bozulmadığını görmek, veri
    doğruluğunu sınamak değil.
  - Sabitler yayımlanmış değerlerdir: Sirius, δ Cep, ORB6 Sirius AB elemanları, VSX δ Cep.
  - `SHOTS=klasör` verilirse ekran görüntüleri kaydedilir.
- **CI:** `.github/workflows/check.yml` iki iş çalıştırır: `npm test` ve duman testi. Playwright
  yalnız CI'da, `--no-save` ile kurulur; proje bağımlılıksız kalır.
- **Tür kaydı (`js/kinds/`):** `main.js`'teki `if` zinciri kaldırıldı.
  - Her tür `{ id, byId?, byObj?, load(ctx) }` biçiminde. Yeni tür, tek dosya ve `kinds/index.js`'e
    bir satır demek.
  - `ctx` şunları sağlar: `show`, `corner`, `kind`, `setLabel`, `wiki`, `choose`, `partial`,
    `insert` ve `describe`.
- **Önbellek (`js/net/http.js`):** sekme içi bellek önbelleği.
  - Aynı adrese aynı anda gelen istekler tek ağ isteğini paylaşır.
  - Ağ isteği ancak onu bekleyen herkes vazgeçince iptal edilir.
  - Hatalar önbelleğe alınmaz. En eski kayıtlar 400 kaydı aşınca silinir.
  - Diske bir şey yazılmaz.
- **Hata:** veri gelmeyince ya da bir ölçüm tablosu eksik kalınca kartta "Tekrar dene" çıkar.
- **SIMBAD kimliği:** `main_id` olmayan kimlik (Wikidata'dan ya da elle) gelirse `ident` tablosundan
  çözülür.

## Gökyüzünde (`js/sky/`)

- **Konumlar (`ephem.js`):**
  - GMST (Meeus 12.4) ve presesyon (Lieske 1977).
  - Güneş ve Ay için Astronomical Almanac'ın düşük duyarlıklı formülleri.
  - Gezegenler için Standish (1992) ortalama elemanları.
- **Yol (`visibility.js`):** 24 saat 5 dakika adımla örneklenir. Buradan doğuş, batış, meridyen
  geçişi ve karanlıkta (Güneş < −12°) 10°'nin üstündeki en iyi an bulunur. Kırılma −34′ alınır.
- **Kontrol (`dev/check-sky.mjs`):**
  - Meeus 12.a/12.b ve 21.b örnekleri.
  - 2024 gündönümü ve ılım.
  - Dolunay ve yeniay (2024-04).
  - Mars, Jüpiter ve Satürn karşı konumları; Mars'ın en yakın uzaklığı (0,642 AU); Venüs'ün
    en büyük uzanımı.
  - İstanbul'da 2024-06-21 gün doğumu ve batımı.
  - Kutup Yıldızı'nın yüksekliği; Canopus'un Ankara'dan doğmaması.
- **Konum:** varsayılan Ankara. "Konumumu kullan" tarayıcı konumunu 0,1°'ye yuvarlar ve yalnız
  `localStorage`'da tutar.

## Keşfet, turlar, karşılaştırma, ilişkili cisimler

- **Ana sayfa:** her türden bir örnek (`js/explore/featured.js`). "Bugünün cismi" yılın gününe göre
  seçilir.
- **Başvurular (`refs.js`):** doğrudan kimlik, SIMBAD `ident` çözümü ya da Wikidata'da kara delik
  araması. Çözülemezse ad arama kutusuna yazılır.
- **Turlar (`tours.js`):** üç tur: bir yıldızın yaşamı, Ay'dan evrenin kıyısına, Güneş Sistemi.
  Adres `?tour=…&step=…` biçiminde. Metinlerdeki sayılar yaygın kabul gören yuvarlak değerler.
- **Ölçek karşılaştırması (`ui/compare.js`, `explore/size.js`):**
  - En çok 6 cisim; doğrusal ya da logaritmik ölçek.
  - Güneş ve Dünya başvuru olarak eklenebilir.
  - Kara delikte olay ufku, pulsarda 10 km varsayımı kullanılır.
  - Liste `localStorage`'da tutulur.
- **İlişkili cisimler (`search/related.js`):**
  - SIMBAD `h_link` üst cisimleri. Alt cisimler yalnız yıldız, bulutsu ve pulsarda sorulur;
    gökada ve kümelerde binlerce alt cisim olduğu için sorulmaz.
  - Wikidata'da kara delik ↔ gökada bağı (P361 / P397).
- **Kart içi bağlantılar:** Güneş ve yıldız kartlarında gezegen adları tıklanabilir.

## Fizik düzeltmeleri

- **Sönümleme:** E(B−V) = (B−V) − (B−V)₀(Teff), A_V = 3,1 E(B−V). E < 0,1 ise düzeltme yapılmaz.
  - (B−V)₀ 9700 K altında Ballesteros (2012) bağıntısının tersinden, üstünde Pecaut & Mamajek
    tablosundan gelir.
  - Kontrol: ζ Oph A_V ≈ 1,0; Betelgeuse ~0,8 (Levesque+ 2005: 0,62); Sirius ve Deneb'de düzeltme
    yok.
- **Teff ölçeği:** devler için Allen (Tablo 15.7), süperdevler için Allen ve Levesque+ (2005)
  tabloları. Kontrol: Arcturus, Aldebaran, Rigel, Betelgeuse.
- **Wikidata:** tercih edilen değer en az iki normal değerin ortancasından 3 kattan fazla saparsa
  tüm değerlerin ortancası alınır.
- **Albedo:** albedo ifadeleri birden çoksa niteleyici etiketleri ayrı bir sorguyla okunur ve Bond
  albedosu seçilir.

## Faz 10: çift yıldızlar (`js/binary/`)

- **Veri:** ORB6 (VizieR `B/orb6/orb6orb`, bulunamazsa `B/orb6`), 30″ koni.
  - HD, HIP, ADS ya da WDS kimliğiyle eşleşme aranır; birden çok yörünge varsa en iyi derece seçilir.
  - Sütun ve birim adları birkaç biçimde denenir: önce `u_` sütunu, yoksa TSV'nin birim satırı.
- **Fizik:**
  - Campbell elemanlarından görünen konum: ayrım ve konum açısı.
  - Kepler III ile toplam kütle.
  - Sonraki periastron, sonraki en geniş ve en dar ayrım.
- **Kontrol:** Sirius AB 3,07 M☉ (Bond+ 2017: 3,08); α Cen AB 2,0 M☉; α Cen'in 2016'daki ~4″ ayrımı.
- **Sahne:** iki kara cisim küresi gerçek elemanlarla dolanır; boylar abartılıdır.
  - İkincilin rengi ve boyu Δm'den anakol varsayımıyla tahmin edilir.
  - Bu varsayım beyaz cüce yoldaşlarda geçersizdir; kartta notu var.

## Faz 11: değişen yıldızlar (`js/variable/`)

- **Veri:** AAVSO VSX (VizieR `B/vsx/vsx`), 15″ koni; SIMBAD adıyla eşleşme.
- **Işık eğrisi:** ailenin tipik biçimi (Sefeid, RR Lyrae, Mira, örten çiftler…); ölçülen eğri değil.
- **P–L bağıntıları:** Sefeid (Benedict+ 2007), RR Lyrae (Chaboyer 1999), Mira K bandı
  (Whitelock+ 2008), yüksek genlikli δ Scuti (McNamara 2011).
- **Kontrol:** δ Cep ~265 pc (HST 272), RR Lyr, Mira, Algol'ün sonraki tutulması.
- **Model:** yıldız sahnesine `uScale` (yarıçap) eklendi. Sıcaklık ışık eğrisinden, yarıçap türün
  tipik genliğiyle değişir.

## Faz 12: uydular

- **Kapsam:** Ay, Fobos, Deimos, İo, Europa, Ganymede, Kallisto, Titan, Enceladus ve Triton
  (`moon:Q…`, Wikidata).
- **Fizik:** gezegen fiziği, Güneş'ten ana gezegenin uzaklığında hesaplanır. Yörünge değerleri
  gezegen çevresindendir. Hepsi gelgit kilitlidir.
- **Görünüm:** yeni kip 4 (iki tonlu temsili yüzey); Titan'da turuncu pus.
- **Gökyüzü:** Ay için evre ve kendi konumu, diğer uydular için ana gezegenin konumu.

## Bilinen sınırlar

- Bu çalışmada SIMBAD, Wikidata, VizieR ve IMCCE'ye ağdan erişilemedi; ortamın ağ izni bu alan
  adlarına kapalıydı. Şunlar canlı serviste doğrulanmadı:
  - ORB6 ve VSX'in VizieR'deki tablo ve sütun adları (esnek okunuyor).
  - Uyduların Wikidata kimlikleri (Q405, Q7547, Q7548, Q3123, Q3143, Q3169, Q3134, Q2565, Q3303,
    Q3359).
  - Wikidata'da kara delik ↔ gökada bağının hangi özellikle tutulduğu.
  - Albedo niteleyici sorgusu.
  - Bu sorguların hepsi başarısız olursa sessizce atlanır, kartın geri kalanı etkilenmez.
- **Işık eğrisi:** şematik. İkinci tutulmanın derinliği bilinmiyor.
- **Çift yıldız sahnesi:** beyaz cüce yoldaşlar anakol varsayımıyla yanlış renkte görünür
  (Sirius B).
- **Uydular:** denge sıcaklığı gelgit ve iç ısıyı yok sayar. Yüzey tonları temsilidir.
- **Gökyüzü konumları:** öz hareket, nütasyon ve sapınç yok sayılır. Ay ~0,3°, gezegenler birkaç
  yay dakikası içinde doğrudur.
