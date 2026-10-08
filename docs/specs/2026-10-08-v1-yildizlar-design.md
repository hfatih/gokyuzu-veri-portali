# Gökyüzü Veri Portalı — v1 (Yıldızlar) Tasarımı

Tarih: 2026-10-08 · Durum: uygulandı (sapmalar en altta)

## Amaç

Kullanıcı bir gök cisminin herhangi bir adını (Türkçe, İngilizce ya da katalog kodu) yazar,
bilinirliğe göre sıralı öneriler görür, birini seçer. Portal:

1. Cismin fiziksel bilgilerini gösterir,
2. Yıldızın değerlerinden fizikle üretilmiş canlı bir replikasını arka planda ve köşede çizer
   (köşeye tıklayınca tam ekran 3D),
3. Önemli veritabanı ve gözlem arşivlerinde o cisme ait aramaya yönlendirir.

Veriyi biz tutmayız: her şey tarayıcıdan doğrudan kaynaklara sorulur ve tarayıcıda hesaplanır.
Portal bir yönlendirme ve görselleştirme katmanıdır.

## Kapsam

- **v1:** Yıldızlar için tam akış (arama, kart, replika, 3D, bağlantılar).
- **v1'de yıldız olmayan cisimler:** aramada çıkar, kart ve bağlantılar gösterilir; replika yerine
  "bu tür için fizik modeli sonraki fazda" notu.
- **Sonraki fazlar (bu spec dışı):** gezegenler/ötegezegenler, bulutsular, galaksiler
  (`Websites/galaksi`), kara delikler (`Websites/karadelik`), simülasyonlar.
- **Hiç yok:** kendi sunucumuz, veritabanımız, hesap/favori sistemi.

## Teknik temel

Kullanıcının diğer astronomi projeleriyle aynı: saf JavaScript (ES modülleri), WebGL 2, GLSL,
derleme adımı yok, bağımlılık yok. `index.html` doğrudan ya da `python -m http.server` ile açılır.
Arayüz TR + EN, `?lang=en` ile paylaşılabilir.

## Dosya yapısı

```
gokyuzu-veri-portali/
  index.html
  css/style.css
  js/main.js               akışı bağlar (arama → seçim → kart + replika)
  js/search/simbad.js      SIMBAD TAP önerileri (nbref sıralı)
  js/search/wikidata.js    Türkçe/İngilizce ad → SIMBAD kimliği (P3083)
  js/search/aliases-tr.js  geleneksel Türkçe adlar (Akyıldız → * alf CMa ...)
  js/search/suggest.js     üç kaynağı birleştirir, tekilleştirir, sıralar, debounce
  js/star/fetch.js         seçilen cismin fiziksel verisini SIMBAD'dan çeker
  js/star/derive.js        uzaklık, ışıma gücü, yarıçap, kütle, log g türetimi (saf fonksiyonlar)
  js/star/links.js         dış kaynak bağlantılarını üretir
  js/render/star.js        WebGL 2 yıldız çizici (tek shader, üç görünüm)
  js/render/view3d.js      tam ekran 3D: yörünge kamerası, yakınlaştırma, ayar paneli
  js/ui/card.js            bilgi kartı
  js/ui/i18n.js            TR/EN metinler
  dev/check-derive.mjs     derive.js için Node ile çalışan assert kontrolü
  knowledge/, memory-bank/ proje kayıtları
```

## Arama ve öneriler

- **SIMBAD TAP** (`simbad.cds.unistra.fr/simbad/sim-tap/sync`, CORS açık, ~0,3 s):
  `ident JOIN basic` üzerinde `id LIKE '<önek>%'`, `ORDER BY nbref DESC`, `TOP 8`.
  - ADQL'de `LOWER`/`ILIKE` yok ve takma adlı `ORDER BY` hata veriyor. Bu yüzden takma ad
    kullanılmaz.
  - Büyük/küçük harf için girdinin varyantları `OR` ile sorulur: olduğu gibi, baş harfi büyük,
    `NAME ` önekli, katalog önekleri büyük harf (`hd` → `HD`).
- **Wikidata:** `wbsearchentities` (language=tr/en, limit 20). Ardından tek bir `wbgetentities`
  ile `P3083` (SIMBAD kimliği) olmayanlar elenir. Böylece "Kutup Yıldızı" → `* alf UMi` olur.
  Wikipedia TR/EN bağlantıları da buradaki sitelinks'ten gelir.
- **Türkçe ad listesi** (`aliases-tr.js`, ~30 kayıt): Wikidata'da olmayan geleneksel adlar.
  Yalnız ad → SIMBAD kimliği eşlemesidir, veri deposu değildir.
- **Birleştirme:** SIMBAD ana kimliğine göre tekilleştirilir. Sıra `nbref`'e göredir
  (bilinirlik ölçüsü); Wikidata ve Türkçe ad listesinden gelen sonuçların `nbref`'i SIMBAD'dan
  tamamlanır. İstekler 200 ms debounce'ludur, eski istekler `AbortController` ile iptal edilir.
- **Öneri satırı:** görünen ad, ana kimlik, cisim türü (TR çevirisiyle), tayf türü.
- Klavye ile gezinme (↑ ↓ Enter Esc) ve ARIA combobox desteklenir.

## Veri ve fizik türetimi

**SIMBAD'dan alınanlar:**
- `basic`: koordinat, paralaks, tayf türü, radyal hız, `otype`, `nbref`
- `mesFe_H`: Teff, log g, [Fe/H] (en yeni kaynak seçilir)
- `mesRot`: vsini
- `flux`: U B V R I J H K

**`derive.js` hesapları:**

| Büyüklük | Yöntem |
| :--- | :--- |
| Uzaklık | d = 1000 / ϖ (pc). Paralaks yoksa ya da ϖ/σ < 5 ise "belirsiz" |
| Teff (yedek) | Tayf türünden Pecaut & Mamajek tablosu, o da yoksa B−V'den |
| Mutlak parlaklık | M_V = V − 5 log₁₀ d + 5. Sönümleme v1'de yok sayılır, kartta belirtilir |
| Bolometrik düzeltme | Sıcaklıktan, Torres (2010) polinomları |
| Işıma gücü | L/L☉ = 10^(−0,4 (M_bol − 4,74)) |
| Yarıçap | R/R☉ = √(L/L☉) / (Teff/5772)² (Stefan–Boltzmann) |
| Kütle (tahmini) | Yalnız anakol sınıfı (V) için kütle–ışıma bağıntısı; diğerleri "bilinmiyor" |
| log g | SIMBAD'dan. Yoksa ve kütle varsa g = GM/R² |
| Dönme | v_eq ≥ vsini (i = 90° varsayımı). P = 2πR / v_eq |

Kartta her değerin yanında köken etiketi olur: **ölçülen** (bibcode bağlantısıyla),
**hesaplanan** ya da **tahmini**.

## Replika (WebGL 2)

Tek bir yıldız shader'ı üç görünümde kullanılır: arka plan (büyük, sönük), köşe önizlemesi
(canlı, küçük) ve 3D (tam ekran, etkileşimli). Yüzey, ışın–küre kesişimiyle piksel başına çizilir.

- **Renk:** Planck × CIE 1931 → sRGB. `FatihHanAstronom` içindeki uygulamadan alınır.
- **Kenar kararması:** dörtlü yasa, katsayılar Teff/log g'den yaklaşık (Claret tablolarına
  uydurulmuş). Kırmızı devlerde koyu kenar, sıcak yıldızlarda daha düz disk.
- **Granülasyon:** hücre ölçeği basınç ölçek yüksekliğine göre, H ∝ Teff / g, R'ye oranlanır.
  Güneş'te çok sayıda küçük hücre, Betelgeuse'de birkaç dev hücre. Sıcak yıldızlarda (Teff ≳ 8000 K,
  ışınımsal zarf) granülasyon kapanır. Zaman ölçeği H / c_s ile orantılıdır.
- **Dönme:** P'ye göre yüzey dönüşü. v_eq kritik hızın büyük bir kesriyse yassılaşma
  (Roche yaklaşımı) ve von Zeipel kütleçekimsel kararması (Vega, Altair) uygulanır.
- **Lekeler:** Teff < 6000 K yıldızlarda gürültüyle üretilen soğuk lekeler; aktiflik
  dönme hızıyla artar.
- **Korona ve parıltı:** yarıçapın dışında ışık saçılımı benzeri hale, ekran uzayı bloom.
- **3D görünüm:** yörünge kamerası (sürükle/teker/dokunmatik). Panelde zaman hızı, granülasyon,
  leke ve pozlama ayarları.
- **Performans:** ekranda olmayan görünüm durur. `prefers-reduced-motion` durumunda tek kare
  çizilir. WebGL 2 yoksa CSS radyal gradyanla durağan disk çizilir.

## Yönlendirme bağlantıları

`links.js` cismin kimliklerinden şu bağlantıları üretir: SIMBAD, NASA ADS (nesne araması), VizieR,
Aladin Lite, ESASky, Gaia arşivi (Gaia DR3 kimliği varsa), NASA Exoplanet Archive (cisim gezegen
barındırıyorsa), Stellarium Web, Wikipedia TR/EN (Wikidata sitelinks'ten).

Uygulama sırasında her URL biçimi gerçek bir yıldızla doğrulanır.

## Hata durumları

- SIMBAD yanıt vermez ya da hata verirse arama Wikidata ve Türkçe ad listesiyle sürer. Kullanıcıya
  kısa bir uyarı gösterilir; kartta yalnız erişilen veri yer alır.
- Wikidata hata verirse yalnız SIMBAD ve Türkçe ad listesiyle devam edilir.
- Eksik fizik verisi varsa ilgili alan "bilinmiyor" olarak gösterilir. Replika eldeki değerlerle
  ve açık bir varsayımla çizilir (örneğin yarıçap yoksa göreli ölçek yerine yalnız renk ve yüzey).
- Tüm dış istekler `AbortController` ve zaman aşımı ile sınırlanır.

## Test

`dev/check-derive.mjs` (Node, `assert`) şunları doğrular:
- Güneş girdisinde L ≈ 1 L☉ ve R ≈ 1 R☉ çıkar (±%5).
- Sirius A, Betelgeuse ve Vega için R ve L yayımlanmış aralıklarda kalır.
- Paralaks yoksa uzaklık, L ve R "belirsiz" döner.

Arayüz tarayıcı önizlemesiyle doğrulanır: arama, öneri sırası, kart, köşe → 3D geçişi ve
TR/EN dil seçimi.

## Uygulamada değişenler (2026-10-08)

Tasarımdan sapmalar ve nedenleri:

- **SIMBAD önek araması `ORDER BY` kullanmıyor.** Eşleşme az olunca sunucu tüm tabloyu tarıyor
  (`'M 3%'` sorgusu 101 sn sürdü). Sıralama istemcide `nbref`'e göre yapılıyor, sorgular
  `TOP 200` ile sınırlı.
- **Katalog numaraları dolguyla aranıyor.** SIMBAD numaraları sabit genişliğe boşlukla
  dolduruyor (`M  31`, `HD  39801`, `NGC  2168`). Yalnız harf içeren girdi `NAME …` olarak,
  Türkçe karakterli girdi yalnız Wikidata'da ve yerel listede aranıyor.
- **Wikidata tek bir SPARQL sorgusuyla soruluyor.** Sorgu `EntitySearch` ile P3083 süzgecini
  birleştiriyor (~0,6 sn). `wbgetentities` ile süzmek 20 öğe için 700 KB ve 4 sn sürüyordu.
- **Teff, log g ve [Fe/H] tüm ölçümlerin ortancası.** "En yeni kaynak" aykırı girdilere açıktı;
  Betelgeuse için bir kaynak 4039 K ve log g 4,24 veriyor. Kartta ölçüm sayısı ve ortancaya en
  yakın kaynak gösteriliyor.
- **M cücelerinde (Teff < 3800 K, sınıf V) K bandı kullanılıyor.** Torres BC_V polinomu bu
  sıcaklıkta geçersiz: Proxima için R 0,44 çıkıyordu, K bandıyla 0,158 çıkıyor (literatür 0,154).
- **Soğuk süperdevlerde ikinci bir hücre katmanı var** (Chiavassa+ 2010). Yalnız 10 H kuralı
  yüzlerce küçük hücre veriyordu; soğuk süperdevlerin yüzeyini ise birkaç dev hücre kaplıyor.
- **Ton eşleme yalnız en parlak kanala uygulanıyor.** Kanal başına ACES, turuncu yıldızları
  krem rengine kaydırıyordu.
- **Bloom yerine analitik ışık hâlesi kullanılıyor.** Ek bir render geçişi gerekmiyor.
- **Türkçe ad listesi 30 değil 11 kayıt.** Yalnız doğruluğundan emin olunan adlar eklendi.
- **Güneş SIMBAD'da yok.** IAU 2015 nominal değerleri sabit olarak `fetch.js` içinde duruyor.
- **Seçilen cisim adreste tutuluyor** (`?star=<main_id>`); bağlantı paylaşılabiliyor.
