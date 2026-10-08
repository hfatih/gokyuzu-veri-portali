# Gökyüzü Veri Portalı

Bir gök cisminin adını yaz; öneriler bilinirliğe göre (SIMBAD'daki makale sayısı) sıralanır. Bir cisim
seçince fiziksel değerlerini görürsün, ayrıca yıldızın kendi değerlerinden tarayıcıda üretilen canlı bir
modelini inceleyebilir ve kaynak veritabanlarında o cisme ait aramaya gidebilirsin.

`HTML` · `CSS` · `saf JavaScript` · `WebGL 2` · `derleme adımı yok` · `bağımlılık yok`

Veri saklanmaz. Her şey SIMBAD (CDS) ve Wikidata'dan anlık alınır, tarayıcıda hesaplanır.

## Çalıştırma

```bash
python dev/serve.py 8047
```

Ardından `http://localhost:8047` adresini aç. ES modülleri kullanıldığı için `file://` ile açmak işe yaramaz.

- `?star=* alf Ori` seçili cismi açar, `?lang=en` arayüzü İngilizceye çevirir.
- Kontroller: `node dev/check-derive.mjs`, `node dev/check-planet.mjs`, `node dev/check-nebula.mjs`, `node dev/check-galaxy.mjs`, `node dev/check-bh.mjs`, `node dev/check-cluster.mjs`,
  `node dev/check-search.mjs`.

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

## Gözlem görüntüsü

Koordinatı olan her cismin kartında gerçek bir gökyüzü kesiti bulunur (CDS hips2fits, anlık,
saklanmaz):
- Pan-STARRS DR1, δ > −29°. Renkleri g/z bantlarından, gerçek renk değil.
- DSS2 renkli: güney gökyüzü ve parlak yıldızlar.

Model ile gözlem yan yana durur.

## Yapı

```
js/search/   variants (SIMBAD desenleri), simbad, wikidata, aliases-tr, suggest (birleştirme)
js/star/     fetch (SIMBAD verisi), derive (fizik, saf), links (yönlendirme)
js/planet/   fetch (Wikidata + ana yıldız), units, derive (saf), visual, solar, links
js/nebula/   derive (saf), visual
js/galaxy/   derive (saf), visual
js/bh/       fetch (Wikidata), derive (saf)
js/cluster/  fetch (SIMBAD üyeleri), derive (saf), visual
js/render/   glview (ortak WebGL görünümü), star / planet / nebula / galaxy / blackhole / cluster (sahneler), color, view3d
js/ui/       i18n, card, planet-card, nebula-card, galaxy-card, bh-card, cluster-card, observation
js/main.js   durum geçişleri: home → object → 3d
```

## Yol haritası

Altı faz tamam (yıldız, gezegen, bulutsu, gökada, kara delik, küme). Olası sonraki fazlar: pulsarlar,
küçük cisimler, kuasarlar; ayrıca yayına alma.
