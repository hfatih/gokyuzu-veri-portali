# Doku kaynakları

Hepsi ABD hükümeti (NASA/USGS) eseri, kamu malıdır; gökyüzü haritası için NASA SVS atıf ister (aşağıda). Eşdikdörtgen izdüşüm, kuzey yukarıda. 2026-11-13'te
kaynaklardan indirilip 4096×2048 JPG'ye (kalite 85) küçültüldü; kaynağı daha küçük olan kendi boyutunda kaldı.
Boylam başlangıcı kaynağın kendi düzenindedir (cisim sahnede döndüğü için görünümü etkilemez).

| Dosya | Boyut | Kaynak | Üreten |
| :--- | :--- | :--- | :--- |
| `earth.jpg` | 4096×2048 | [File:Land ocean ice cloud hires.jpg](https://commons.wikimedia.org/wiki/File:Land_ocean_ice_cloud_hires.jpg) (bulutlu) | NASA Visible Earth, Terra/MODIS |
| `mercury.jpg` | 4096×2048, tek renk | [File:Mercury - complete mono basemap 2500mpp equirectangular.png](https://commons.wikimedia.org/wiki/File:Mercury_-_complete_mono_basemap_2500mpp_equirectangular.png) | NASA/JHU APL, MESSENGER MDIS |
| `mars.jpg` | 4096×2048 | [File:Mars Viking MDIM21 ClrMosaic 1km.jpg](https://commons.wikimedia.org/wiki/File:Mars_Viking_MDIM21_ClrMosaic_1km.jpg) | NASA/USGS, Viking Orbiter MDIM 2.1 |
| `jupiter.jpg` | 3602×1801 | [File:Jupiter Cylindrical Map - Dec 2000 PIA07782.jpg](https://commons.wikimedia.org/wiki/File:Jupiter_Cylindrical_Map_-_Dec_2000_PIA07782.jpg) | NASA/JPL/Space Science Institute, Cassini (Aralık 2000) |
| `moon.jpg` | 4096×2048 | [CGI Moon Kit](https://svs.gsfc.nasa.gov/4720), `lroc_color_poles_4k.tif` | NASA Scientific Visualization Studio, LRO/LROC |
| `io.jpg` | 4096×2048 | USGS Astrogeology, `Io_GalileoSSI-Voyager_Global_Mosaic_ClrMerge_1km.tif` | NASA/JPL/USGS, Galileo SSI + Voyager |
| `europa.jpg` | 4096×2048, tek renk | USGS Astrogeology, `Europa_Voyager_GalileoSSI_global_mosaic_500m.tif` | NASA/JPL/USGS, Galileo SSI + Voyager |
| `ganymede.jpg` | 4096×2048, tek renk | USGS Astrogeology, `Ganymede_Voyager_GalileoSSI_global_mosaic_1km.tif` | NASA/JPL/USGS, Galileo SSI + Voyager |
| `callisto.jpg` | 4096×2048, tek renk | USGS Astrogeology, `Callisto_Voyager_GalileoSSI_global_mosaic_1km.tif` | NASA/JPL/USGS, Galileo SSI + Voyager |
| `enceladus.jpg` | 4096×2048, tek renk | [File:Enceladus Color Map.jpg](https://commons.wikimedia.org/wiki/File:Enceladus_Color_Map.jpg) (PIA18435) | NASA/JPL-Caltech/SSI/LPI, Cassini |
| `ceres.jpg` | 3076×1538, tek renk | [File:PIA19606-Ceres-Dawn-GlobalMap-Unannotated-20150728.jpg](https://commons.wikimedia.org/wiki/File:PIA19606-Ceres-Dawn-GlobalMap-Unannotated-20150728.jpg) | NASA/JPL-Caltech/UCLA/MPS/DLR/IDA, Dawn |
| `vesta.jpg` | 3560×1780, tek renk | [File:Vesta map for GeoHack.png](https://commons.wikimedia.org/wiki/File:Vesta_map_for_GeoHack.png) | NASA/JPL-Caltech/UCLA/MPS/DLR/IDA, Dawn |
| `pluto.jpg` | 4096×2048 | [File:Pluto color mapmosaic.jpg](https://commons.wikimedia.org/wiki/File:Pluto_color_mapmosaic.jpg) | NASA/JHUAPL/SwRI, New Horizons |
| `earth_night.jpg` | 4096×2048, tek renk | [File:City Lights 2012 - Flat map.jpg](https://commons.wikimedia.org/wiki/File:City_Lights_2012_-_Flat_map.jpg) | NASA Earth Observatory/NOAA NGDC, Suomi NPP VIIRS |
| `moon_n.jpg` | 2048×1024, eğim | [CGI Moon Kit](https://svs.gsfc.nasa.gov/4720), `ldem_16_uint.tif` (LRO LOLA) | NASA SVS / LRO LOLA |
| `mars_n.jpg` | 2048×1024, eğim | PDS Geosciences, MGS MOLA MEGDR `megt90n000eb.img` (16 piksel/derece) | NASA/GSFC, MGS MOLA |
| `sky.jpg` | 4096×2048 | [Deep Star Maps 2020](https://svs.gsfc.nasa.gov/4851), `starmap_2020_4k.exr` | NASA/Goddard SVS; Gaia DR2: ESA/Gaia/DPAC |

USGS dosyaları `https://planetarymaps.usgs.gov/mosaic/<dosya adı>` adresinden alındı.

## Yapılan işlemler

- **Europa, Ganymede, Kallisto:** USGS mozaikleri tek renklidir. Sayı değeri yansıtmayla doğru orantılı kabul edildi
  ve 1/2,2 üssüyle kodlandı (shader dokuya 2,2 üssü uygular); haritaların ortalaması böylece cisimlerin gerçek
  albedosuna yakın çıkar (0,58 / 0,29 / 0,23). Hiç görüntülenmemiş kutup bölgeleri (haritanın %4–5'i, kaynakta siyah)
  aynı boylamdaki en yakın tonla doldurulup yumuşatıldı; orada gerçek ayrıntı yoktur.
- **Enceladus:** kaynak harita kızılötesi–yeşil–morötesi süzgeçlerden üretilmiş güçlendirilmiş renklidir; gözün
  göreceği renk değildir. Bu yüzden tek renge çevrildi ve tonu açıldı (üs 0,6).
- **Renk:** tek renkli dört uydu haritası sahnede cismin ana tonuyla çarpılır (`js/planet/solar.js` `look.zone`,
  `js/planet/visual.js` `tint`). Merkür haritası olduğu gibi gridir.

## A grubu işlemleri (2026-11-14)

- **Gökyüzü (`sky.jpg`):** doğrusal EXR, 1/2,2 ile kodlandı. Ekvatoral koordinat, merkez 0h, sağ açıklık sola doğru
  artar (sayfadaki açıklama); doğrulama: en parlak nokta u = 0,889, δ = −60,8° → α = 220°, α Centauri. NASA SVS atıf
  istiyor: "NASA/Goddard Space Flight Center Scientific Visualization Studio. Gaia DR2: ESA/Gaia/DPAC". Takımyıldız
  çizgisi yok. 8k sürüm 404 verdiği için 4k: yakından yıldızlar yumuşak görünür.
- **Kabartma (`*_n.jpg`):** yükseklikten eğim (R doğuya, G kuzeye yükselme, ±0,6 → 0–255). Ay: DN × 0,5 m (CGI Moon Kit
  belgesine göre yarım metre, aralık 19,7 km); Mars: MOLA metre, −8,2…+21,2 km, 0° boylam merkeze kaydırıldı (MOLA
  0°D'den başlar). Ay ve Mars renk haritalarında da gölgeleme gömülü; kabartma onun üstüne eklenir.
- **Ceres:** çerçeve ve eksen yazıları kırpıldı, 30° ızgara çizgileri `cv2.inpaint` ile silindi; görüntülenmemiş kutuplar
  (%9,9) komşu tonla dolduruldu. **Vesta** %6,3, **Plüton** %30,5 dolgu (güney yarıküre geçişte kutup gecesindeydi);
  dolgu yatayda geniş bulanıklaştırıldı, orada gerçek ayrıntı yok.
- **Gece ışıkları:** kaynaktaki kara ve okyanus tonu, yerel taban (aşındırılmış + bulanık görüntü) çıkarılarak silindi.
- **Bulut:** ayrı kamu malı bulut katmanı bulunamadı (NASA Visible Earth sunucusu yanıt vermedi, Commons'taki CC BY-SA);
  bulutlar `earth.jpg` içinde, dönmezler.

## Bilinçli olarak alınmayanlar

- **Satürn:** kamu malı tam harita bulunamadı; fizikten üretilen bant modeli kalır.
- **Venüs, Uranüs, Neptün, Titan:** görünür ışıkta yüzey değil bulut/pus görünür; model kalır.
- **Triton, Fobos, Deimos:** tam küresel harita yok (Triton'un yaklaşık %40'ı görüntülendi).
- **Merkür kabartması:** MESSENGER yükseklik modeli indirilmedi; Merkür düz harita kaldı.
- Commons'taki `Moon Europa color map.jpg` (CC0) kaynağı belirsiz olduğu için kullanılmadı.
