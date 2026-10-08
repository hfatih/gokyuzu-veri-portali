# Gökyüzü Veri Portalı

Bir gök cisminin adını yaz; öneriler bilinirliğe göre (SIMBAD'daki makale sayısı) sıralanır. Bir cisim
seçince fiziksel değerlerini görürsün, ayrıca yıldızın kendi değerlerinden tarayıcıda üretilen canlı bir
modelini inceleyebilir ve kaynak veritabanlarında o cisme ait aramaya gidebilirsin.

`HTML` · `CSS` · `saf JavaScript` · `WebGL 2` · `derleme adımı yok` · `bağımlılık yok`

Veri saklanmaz. Her şey SIMBAD (CDS) ve Wikidata'dan anlık alınır, tarayıcıda hesaplanır.

## Çalıştırma

```bash
python -m http.server 8047
```

Ardından `http://localhost:8047` adresini aç. ES modülleri kullanıldığı için `file://` ile açmak işe yaramaz.

- `?star=* alf Ori` seçili cismi açar, `?lang=en` arayüzü İngilizceye çevirir.
- Kontroller: `node dev/check-derive.mjs`, `node dev/check-planet.mjs`, `node dev/check-search.mjs`.

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

## Yapı

```
js/search/   variants (SIMBAD desenleri), simbad, wikidata, aliases-tr, suggest (birleştirme)
js/star/     fetch (SIMBAD verisi), derive (fizik, saf), links (yönlendirme)
js/planet/   fetch (Wikidata + ana yıldız), units, derive (saf), visual, solar, links
js/render/   glview (ortak WebGL görünümü), star ve planet (sahneler), color, view3d
js/ui/       i18n, card
js/main.js   durum geçişleri: home → object → 3d
```

## Yol haritası

Sonraki fazlar: bulutsular, gökadalar (`Websites/galaksi`),
kara delikler (`Websites/karadelik`).
