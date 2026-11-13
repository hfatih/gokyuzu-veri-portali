# Doku kaynakları

Hepsi ABD hükümeti (NASA/USGS) eseri, kamu malıdır. Eşdikdörtgen izdüşüm, kuzey yukarıda. 2026-11-13'te
kaynaklardan indirilip 4096×2048 JPG'ye (kalite 85) küçültüldü; kaynağı daha küçük olan kendi boyutunda kaldı.
Boylam başlangıcı kaynağın kendi düzenindedir (cisim sahnede döndüğü için görünümü etkilemez).

| Dosya | Boyut | Kaynak | Üreten |
| :--- | :--- | :--- | :--- |
| `earth.jpg` | 3840×1920 | [File:Blue Marble 2002.png](https://commons.wikimedia.org/wiki/File:Blue_Marble_2002.png) (Commons'ın 3840 px küçültmesi) | NASA Terra/MODIS (Visible Earth) |
| `mercury.jpg` | 4096×2048, tek renk | [File:Mercury - complete mono basemap 2500mpp equirectangular.png](https://commons.wikimedia.org/wiki/File:Mercury_-_complete_mono_basemap_2500mpp_equirectangular.png) | NASA/JHU APL, MESSENGER MDIS |
| `mars.jpg` | 4096×2048 | [File:Mars Viking MDIM21 ClrMosaic 1km.jpg](https://commons.wikimedia.org/wiki/File:Mars_Viking_MDIM21_ClrMosaic_1km.jpg) | NASA/USGS, Viking Orbiter MDIM 2.1 |
| `jupiter.jpg` | 3602×1801 | [File:Jupiter Cylindrical Map - Dec 2000 PIA07782.jpg](https://commons.wikimedia.org/wiki/File:Jupiter_Cylindrical_Map_-_Dec_2000_PIA07782.jpg) | NASA/JPL/Space Science Institute, Cassini (Aralık 2000) |
| `moon.jpg` | 4096×2048 | [CGI Moon Kit](https://svs.gsfc.nasa.gov/4720), `lroc_color_poles_4k.tif` | NASA Scientific Visualization Studio, LRO/LROC |
| `io.jpg` | 4096×2048 | USGS Astrogeology, `Io_GalileoSSI-Voyager_Global_Mosaic_ClrMerge_1km.tif` | NASA/JPL/USGS, Galileo SSI + Voyager |
| `europa.jpg` | 4096×2048, tek renk | USGS Astrogeology, `Europa_Voyager_GalileoSSI_global_mosaic_500m.tif` | NASA/JPL/USGS, Galileo SSI + Voyager |
| `ganymede.jpg` | 4096×2048, tek renk | USGS Astrogeology, `Ganymede_Voyager_GalileoSSI_global_mosaic_1km.tif` | NASA/JPL/USGS, Galileo SSI + Voyager |
| `callisto.jpg` | 4096×2048, tek renk | USGS Astrogeology, `Callisto_Voyager_GalileoSSI_global_mosaic_1km.tif` | NASA/JPL/USGS, Galileo SSI + Voyager |
| `enceladus.jpg` | 4096×2048, tek renk | [File:Enceladus Color Map.jpg](https://commons.wikimedia.org/wiki/File:Enceladus_Color_Map.jpg) (PIA18435) | NASA/JPL-Caltech/SSI/LPI, Cassini |

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

## Bilinçli olarak alınmayanlar

- **Satürn:** kamu malı tam harita bulunamadı; fizikten üretilen bant modeli kalır.
- **Venüs, Uranüs, Neptün, Titan:** görünür ışıkta yüzey değil bulut/pus görünür; model kalır.
- **Triton, Fobos, Deimos:** tam küresel harita yok (Triton'un yaklaşık %40'ı görüntülendi).
- Commons'taki `Moon Europa color map.jpg` (CC0) kaynağı belirsiz olduğu için kullanılmadı.
