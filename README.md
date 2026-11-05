# Gökyüzü Veri Portalı

Bir gök cisminin adını yaz; öneriler bilinirliğe göre (SIMBAD'daki makale sayısı) sıralanır. Bir cisim
seçince fiziksel değerlerini görürsün, ayrıca yıldızın kendi değerlerinden tarayıcıda üretilen canlı bir
modelini inceleyebilir ve kaynak veritabanlarında o cisme ait aramaya gidebilirsin.

`HTML` · `CSS` · `saf JavaScript` · `WebGL 2` · `derleme adımı yok` · `bağımlılık yok`

Yazı tipleri (Jost, IBM Plex Mono; OFL 1.1) kendi sunucumuzdan verilir (`css/fonts.css`, `assets/fonts/`); Google Fonts'a istek gitmez.

Veri saklanmaz. Her şey SIMBAD (CDS), Wikidata, VizieR ve IMCCE'den anlık alınır, tarayıcıda hesaplanır;
yanıtlar yalnız açık sekmenin belleğinde tutulur. Tarayıcıda hatırlanan tek şey kullanıcının seçtiği
gözlem konumu ve karşılaştırma listesidir.

## Çalıştırma

```bash
python dev/serve.py 8047
```

Ardından `http://localhost:8047` adresini aç. ES modülleri kullanıldığı için `file://` ile açmak işe yaramaz.

- `?star=* alf Ori` seçili cismi açar, `?lang=en` arayüzü İngilizceye çevirir.
- `?tour=life&step=1` rehberli turu açar (`life`, `scale`, `solar`).
- Kontroller: `npm test` (tüm `dev/check-*.mjs` betikleri: fizik, arama, gökyüzü, çift ve değişen
  yıldızlar, önbellek).
- Tarayıcı duman testi: `npm run smoke` (Playwright + Chromium; dış servisler sabit yanıtlarla
  karşılanır, `SHOTS=klasör` ile ekran görüntüleri). CI ikisini de her push'ta çalıştırır.

## Arama

| Kaynak | Ne için | Not |
| :--- | :--- | :--- |
| SIMBAD TAP | İngilizce ad, katalog kodu (HD, HIP, M, NGC, Gaia DR3), Bayer adı (`alf ori`, `alpha cma`) | Önek araması `ORDER BY` kullanmaz; katalog numaraları SIMBAD'ın boşluk dolgusuyla aranır |
| Wikidata SPARQL | Türkçe ve İngilizce adlar (`Kutup Yıldızı`, `Büyük Macellan Bulutu`) | `EntitySearch` + SIMBAD kimliği (P3083) süzgeci, tek sorgu |
| `aliases-tr.js` | Wikidata'da olmayan geleneksel adlar (`Akyıldız`, `Demirkazık`, `Ülker`) ve Güneş | Ad eşlemesi, veri değil |

## Fizik

| Büyüklük | Yöntem |
| :--- | :--- |
| Teff, log g, [Fe/H], v sin i | SIMBAD ölçümlerinin ortancası; kartta ölçüm sayısı ve kaynak |
| Uzaklık | 1000 / ϖ (ϖ/σ < 5 ise verilmez) |
| Işıma gücü | Mutlak parlaklık + bolometrik düzeltme (Torres 2010); M cücelerinde K bandı |
| Yarıçap | Stefan–Boltzmann |
| Kütle | Yalnız anakolda, kütle–ışıma bağıntısıyla (tahmini) |
| Dönme | P = 2πR / v (i = 90°, üst sınır); Roche basıklığı |
| Sönümleme | E(B−V) = (B−V) − (B−V)₀(Teff), A_V = 3,1 E(B−V); E < 0,1 ise düzeltilmez |
| Tayf türünden Teff | Anakol (Pecaut & Mamajek), dev ve süperdev (Allen; Levesque+ 2005) tabloları |

Her değerin yanında köken etiketi bulunur: **ölçülen**, **hesaplanan** ya da **tahmini**.

## Model

- **Renk:** Planck × CIE 1931 → sRGB.
- **Kenar kararması:** dörtlü yasa.
- **Granülasyon:** hücre çapı ≈ 10 × basınç ölçek yüksekliği, ömrü H / c_s ile ölçeklenir ve
  Güneş'e kalibre edilir. Piksel altına inen hücreler silinir; bu yüzden Güneş'in granülasyonu
  ancak yakınlaşınca görünür.
- **Soğuk süperdevler:** ek bir dev hücre katmanı (Chiavassa+ 2010).
- **Lekeler:** soğuk cücelerde aktivite kuşağında.
- **Hızlı dönenler:** von Zeipel kütleçekimsel kararması.

Bunlar fiziksel değerlerden üretilmiş bir modeldir, gözlem görüntüsü değildir.

## Gezegenler (faz 2)

- **Kapsam:** Güneş Sistemi'nin 8 gezegeni ve SIMBAD'daki ötegezegenler.
- **Veri:** nicelikler Wikidata'dan; deprecated ifadeler atlanır, birimler çevrilir, ortanca alınır.
- **Fizik:**
  - Eksik kütle ya da yarıçap Chen & Kipping (2017) ile tamamlanır.
  - Denge sıcaklığı, aldığı ışınım ve yaşanabilir bölge (Kopparapu+ 2013).
  - Bant sayısı Rhines ölçeğinden, bulut rengi Sudarsky sınıflarından.
- **Görünüm:**
  - Merkür, Dünya ve Mars: NASA/USGS kamu malı haritaları (`assets/textures/KAYNAK.md`).
  - Venüs: bulut örtüsü.
  - Satürn: halkalar ve karşılıklı gölgeler.
  - Işık ana yıldızın renginde; Proxima b kırmızımsı aydınlanır.

## Bulutsular (faz 3)

- **Türler:** H II, gezegenimsi, süpernova kalıntısı, yansıma, karanlık.
- **Veri:** SIMBAD'dan açısal boyut ve `mesDistance` uzaklıkları.
- **Fizik:**
  - Fiziksel yarıçap.
  - H II: iyonlaştırıcı foton akısı (Strömgren, O7V eşdeğeri).
  - Gezegenimsi: dinamik yaş.
  - Süpernova kalıntısı: süpürülen kütle, evre ve yalnız Sedov evresinde Sedov–Taylor yaşı.
- **Görünüm:** hacimsel ışın yürütme. Emisyon çizgisi renkleri (Hα, [O III], Hβ, [S II]) dalga
  boyundan CIE ile; iyonlaşma katmanları ve toz.

## Gökadalar (faz 4)

- **Veri:** SIMBAD'dan Hubble türü, boyut, z ve uzaklık ölçümleri. Yakın gökadada kırmızıya kayma
  yöntemli uzaklıklar dışlanır; ölçüm yoksa Hubble yasası (H0 = 70) kullanılır.
- **Fizik:** eğiklik, çap, M_B, Tully–Fisher dönüş hızı, dinamik kütle, düz ΛCDM geriye bakış süresi.
- **Görünüm:** analitik disk (logaritmik sarmal kollar, çubuk, toz), şişkinlik ve eliptikler.
  Varsayılan bakış açısı ölçülen eğiklikten gelir.

## Kara delikler (faz 5)

- **Veri:** Wikidata'dan kütle, uzaklık ve koordinat (SIMBAD kara deliği ayrı cisim olarak tutmuyor).
- **Fizik:** olay ufku, gölgenin açısal çapı (Sgr A* 51,7 µas; EHT 51,8), ISCO ve dönemi, Eddington,
  disk sıcaklığı, Hawking, yoğunluk, olay ufkunda gelgit.
- **Görünüm:** piksel başına Schwarzschild jeodeziği. İnce yığılma diski, Doppler ışınlanması ve
  kütleçekimsel kırmızıya kayma, foton halkası, arka plan yıldızlarının merceklenmesi.

## Yıldız kümeleri (faz 6)

- **Veri:** SIMBAD'daki üyeler (tekilleştirilmiş). Gerçek B, V parlaklıklarından renk–parlaklık (HR)
  diyagramı çizilir.
- **Yaş:**
  - Kızarma ZAMS uydurmasıyla bulunur.
  - Anakol bükülmesi ışıma fonksiyonundan çıkarılır.
  - Yaş, bükülme kütlesinin anakol ömrü: Ülker 160 milyon yıl, M67 3,0 milyar yıl, Hyades 681
    milyon yıl.
  - Küresel kümelerde yatay kol yüzünden yaş verilmez.
- **Görünüm:** Üyeler gerçek gökyüzü konumlarıyla 3D nokta bulutu olarak çizilir; derinlik
  izotropik varsayımla örneklenir.

## Pulsarlar (faz 7)

- **Veri:** ATNF Pulsar Kataloğu (VizieR B/psr kopyası, 2015).
- **Fizik:** dönem ve türevinden karakteristik yaş, yüzey manyetik alanı, dönme enerjisi kaybı,
  ışık silindiri, kutup başlığı, ölüm çizgisi, ışın genişliği (Rankin 1993), dağılma gecikmesi.
  Değerler ATNF'nin kendi türetilmiş sütunlarıyla %2 içinde.
- **Görünüm:** deniz feneri modeli. Dönen radyo ışınları, dipol alan çizgileri, ışık silindiri.
- **Ses:** "Atımları dinle" atımları gerçek dönemle çalar.

## Asteroitler ve kuyruklu yıldızlar (faz 8)

- **Veri:** IMCCE SsODNet (arama ve ssoCard); `?star=sso:Ceres` biçiminde açılır.
- **Fizik:**
  - Kepler yörüngesinden bugünkü konum, uzaklık, evre açısı ve parlaklık.
  - Dünya yörüngesine en yakın uzaklık (MOID) elemanlardan hesaplanır; tehlikeli asteroit ölçütü.
  - Çap, kütle, kaçış hızı, moloz yığını dönme sınırı, güneş altı sıcaklığı.
- **Görünüm:**
  - Ölçülen elipsoit biçimi, taksonomi rengi ve albedo; gerçek dönemle döner.
  - Kuyruklu yıldızda Güneş'e uzaklığa göre koma.
  - Kartta ekliptiğe yukarıdan yörünge çizimi.

## Kuasarlar (faz 9)

- **Kozmoloji (düz ΛCDM):** kırmızıya kaymadan uzaklıklar, ışığın yolculuk süresi, o anki evren
  yaşı, ölçek.
- **Işıma ve kütle:** K düzeltmeli mutlak parlaklık, bolometrik ışıma, Eddington kütlesi.
- **Tayf:** SDSS bileşik kuasar tayfı kırmızıya kaydırılır, Lyα ormanı soğurması eklenir. Kartın
  simgesi bu tayfın göze görünen rengindedir.
- **Görünüm:** merkezdeki kara delik ve yığılma diski.

## Arayüz, çerezler ve yasal sayfalar

- **Görünüm:** zemin tam siyah, metin tam beyaz. Vurgu renkleri sarı, turuncu ve amber. Köken etiketleri:
  ölçülen sarı, hesaplanan turuncu, tahmini kum rengi ve kesikli. Gök cisimlerinin kendi renkleri
  (yıldız, bulutsu) fizikten geldiği için değişmez.
- **Kayan yıldızlar:** üç katman, CSS ile. Hareket azaltma tercihinde durur.
- **Üst bar:** Astronews şeridi, TR/EN, menü (Keşfet, Bu gece, Turlar, Hakkında), karşılaştırma.
- **"Bu gece gökyüzünde":** ana sayfada; Ay, gezegenler ve en parlak 12 yıldızdan karanlıkta
  görünenler (`js/explore/tonight.js`), ağ gerekmez.
- **Alt bar:** keşfet, veri kaynakları, kurumsal ve yasal bağlantılar, "Çerez tercihleri".
- **Çerez ve depolama onayı (`js/consent.js`):**
  - Site HTTP çerezi kullanmaz.
  - Seçimin kaydı zorunludur.
  - Konum ve karşılaştırma listesi yalnız onayla kalıcıdır; onay yoksa sekme kapanınca silinir.
  - "Reddet" ve "Kabul et" eşit ağırlıktadır.
- **Yasal sayfalar (`?page=…`, `js/legal/pages.js`):**
  - KVKK Aydınlatma Metni, Gizlilik Politikası, Çerez Politikası, Veri Sahibi Başvuru Formu (e-posta
    taslağı açar, veri göndermez), Kullanım Koşulları, Veri Kaynakları ve Lisanslar, Hakkında ve
    Künye, Erişilebilirlik.
  - **Yayından önce `js/legal/site-info.js` doldurulmalı.** Boş alanlar sarı yer tutucu olarak
    görünür; `draft: true` iken "taslak" uyarısı çıkar.
  - Metinler hukuki görüş değildir; bir KVKK uzmanına kontrol ettirilmelidir.

## Çift yıldızlar (faz 10)

- **Veri:** görsel çift yıldız yörüngesi ORB6 kataloğundan (VizieR `B/orb6`).
- **Fizik:**
  - Bugünkü ayrım ve konum açısı.
  - Kepler III ile toplam kütle: Sirius AB 3,07 M☉, α Cen AB 2,0 M☉.
  - Sonraki periastron, sonraki en geniş ve en dar ayrım.
- **Görünüm:**
  - Kartta görünen yörünge (kuzey yukarı, doğu solda).
  - "Yörüngeyi 3D'de göster" ile iki yıldız ortak kütle merkezi çevresinde dolanır. Boylar
    abartılıdır.

## Değişen yıldızlar (faz 11)

- **Veri:** AAVSO VSX (VizieR `B/vsx`); tür, dönem ve parlaklık aralığı.
- **Fizik:**
  - Sonraki en parlak an ya da tutulma.
  - Dönem–ışıma bağıntısıyla uzaklık: Sefeid, RR Lyrae, Mira (K bandı), δ Scuti. Örnek: δ Cep
    ~265 pc, HST paralaksı 272 pc.
- **Görünüm:**
  - Şematik ışık eğrisi.
  - 3D modelde yıldız gerçek dönemle zonklar: sıcaklık ışık eğrisinden, yarıçap türün tipik
    genliğiyle.

## Uydular (faz 12)

- **Kapsam:** Ay, Fobos, Deimos, İo, Europa, Ganymede, Kallisto, Titan, Enceladus ve Triton
  (`?star=moon:Q405`). Değerler Wikidata'dan.
- **Fizik:** denge sıcaklığı ana gezegenin Güneş'e uzaklığından hesaplanır. Yörünge değerleri
  gezegen çevresindendir.
- **Görünüm:** temsili yüzey tonları; Titan'da turuncu pus.
- **Bağlantılar:** gezegen kartında uydular, uydu kartında gezegen listelenir.

## Gökyüzünde

Koordinatı ya da yörüngesi olan her kartta bu bölüm var:

- Şu anki yükseklik ve yön.
- Doğuş, meridyen geçişi ve batış.
- Bu gece karanlıkta en iyi an.
- Görmek için gereken araç: çıplak göz, dürbün ya da teleskop.
- Önümüzdeki 24 saatin yükseklik eğrisi.

Hesap tarayıcıda yapılır:

- Sabit cisimlerde presesyon kullanılır.
- Gezegenler Standish (1992) ortalama elemanlarından hesaplanır.
- Güneş ve Ay için Astronomical Almanac'ın düşük duyarlıklı formülleri kullanılır.
- Ay için ayrıca evre gösterilir.

Varsayılan konum Ankara'dır. "Konumumu kullan" seçilirse konum yalnız bu tarayıcıda hatırlanır.

## Keşfet, turlar ve karşılaştırma

- **Ana sayfa:**
  - Her türden bir örnek.
  - "Bugünün cismi".
  - Üç rehberli tur: bir yıldızın yaşamı, Ay'dan evrenin kıyısına, Güneş Sistemi.
- **Ölçek karşılaştırması:**
  - Kartlardan eklenen en çok 6 cisim aynı ölçekte çizilir; doğrusal ya da logaritmik.
  - Liste yalnız bu tarayıcıda tutulur.
- **İlişkili cisimler:**
  - SIMBAD hiyerarşisinden (yıldızın kümesi, bulutsunun merkez yıldızı).
  - Wikidata'dan: kara delik ↔ barındıran gökada.

## Gözlem görüntüsü

Koordinatı olan her cismin kartında gerçek bir gökyüzü kesiti bulunur (CDS hips2fits, anlık,
saklanmaz):
- Pan-STARRS DR1, δ > −29°. Renkleri g/z bantlarından, gerçek renk değil.
- DSS2 renkli: güney gökyüzü ve parlak yıldızlar.

Model ile gözlem yan yana durur.

## Yapı

```
js/kinds/    tür kaydı: her tür { id, byId?, byObj?, load(ctx) } (yıldız, gezegen, uydu, bulutsu, …)
js/net/      http (oturum önbelleği, istek paylaşımı), vizier (ASU TSV)
js/search/   variants (SIMBAD desenleri), simbad, wikidata, aliases-tr, suggest (birleştirme), related
js/star/     fetch (SIMBAD verisi), derive (fizik, sönümleme, saf), links (yönlendirme)
js/planet/   fetch (Wikidata + ana yıldız, uydular), units, derive (saf), moon (saf), visual, solar, links
js/nebula/   derive (saf), visual
js/galaxy/   derive (saf), visual
js/bh/       fetch (Wikidata), derive (saf)
js/cluster/  fetch (SIMBAD üyeleri), derive (saf), visual
js/pulsar/   fetch (VizieR ATNF), derive (saf), visual, sound
js/sso/      fetch (IMCCE), orbit (Kepler, MOID), derive (saf), visual
js/quasar/   derive (ΛCDM, saf), spectrum (bileşik tayf, renk)
js/binary/   fetch (VizieR ORB6), derive (görünen yörünge, Kepler III, saf)
js/variable/ fetch (VizieR VSX), derive (ışık eğrisi, P–L, zonklama, saf)
js/sky/      ephem (Güneş, Ay, gezegenler, presesyon), visibility (24 saatlik yol), location
js/explore/  featured, tours, refs (başvuru çözümü), size (karşılaştırma yarıçapı)
js/render/   glview (ortak WebGL görünümü), star / planet / nebula / galaxy / blackhole / cluster / pulsar / sso / binary (sahneler), color, view3d
js/ui/       i18n, chrome (üst/alt bar, onay, yasal sayfa, bu gece), card ve tür kartları, sky-card, binary-card, variable-card, compare, observation
js/legal/    site-info (künye: yayından önce doldur), pages (yasal metinler)
js/consent.js tarayıcı depolaması onayı
js/main.js   durum geçişleri (home → object → 3d), arama kutusu, tur, karşılaştırma, kartın ortak ekleri
```

## Yol haritası

On iki faz tamam: yıldız, gezegen, bulutsu, gökada, kara delik, küme, pulsar, küçük cisim, kuasar,
çift yıldız, değişen yıldız ve uydu. Bunlara ek olarak gökyüzü konumu, turlar, karşılaştırma,
sönümleme, CI ve tarayıcı testi eklendi. Sırada yayına alma var. Ayrıntı ve bilinen sınırlar:
[docs/specs/2026-11-05-faz10-12-ve-gelistirmeler-design.md](docs/specs/2026-11-05-faz10-12-ve-gelistirmeler-design.md).
