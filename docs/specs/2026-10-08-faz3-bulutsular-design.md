# Gökyüzü Veri Portalı — Faz 3 (Bulutsular) Tasarımı

Tarih: 2026-10-08 · Durum: uygulandı

## Kullanıcı kararları (Fatih, doğrudan)

- Faz 3: SIMBAD'daki beş bulutsu türünün hepsi modellenir: H II, gezegenimsi, süpernova
  kalıntısı, yansıma, karanlık.
- **Gözlem görüntüsü (A seçeneği):** bütün kartlara, koordinatı olan her cisme eklenir. Görüntü
  CDS hips2fits'ten anlık gelir, saklanmaz.

## Veri

- **Bulutsu verisi (SIMBAD `basic`):** `galdim_majaxis`, `galdim_minaxis` (yay dakikası),
  `galdim_angle`, `rvz_radvel`.
- **Uzaklık:** `mesDistance` ölçümleri pc'ye çevrilir (pc / kpc / Mpc), ortancası alınır.
- **Merkez yıldız:** SIMBAD hiyerarşisinde çoğu zaman yok (M57, NGC 7293 boş). Bu yüzden merkez ya
  da aydınlatan yıldız sıcaklığı varsayılır ve kartta yazılır: PN 100 000 K, yansıma 15 000 K.
- **SIMBAD tür eşlemesi:**
  - HII, GNe, SFR, bub → H II
  - PN → gezegenimsi
  - SNR → süpernova kalıntısı
  - RNe → yansıma
  - DNe, MoC, Cld, glb → karanlık

## Fizik (`js/nebula/derive.js`, `dev/check-nebula.mjs`)

| Büyüklük | Yöntem | Kontrol |
| :--- | :--- | :--- |
| Fiziksel yarıçap | açısal boyutun yarısı × uzaklık | M57 0,137 pc |
| H II foton akısı | Strömgren tersinden Q = (4π/3) R³ n² α_B, n = 100 cm⁻³; O7V eşdeğeri (Martins+ 2005) | M42 ~3×10⁴⁹ s⁻¹ ≈ 5 O7V |
| PN dinamik yaşı | R / v, v = 20 km/s | M57 ~6.800 yıl (lit. ~7.000) |
| SNR süpürülen kütle | (4π/3) R³ ρ, n = 1 cm⁻³ | Yengeç 1,2 M☉ |
| SNR evresi | süpürülen > 3 × fırlatılan (3 M☉) ise Sedov | Yengeç serbest genişleme |
| Sedov–Taylor yaşı | yalnız Sedov evresinde | Kuğu İlmeği ~29.000 yıl |

**Neden SNR evresi:** Sedov formülü genç kalıntılarda yanlış sonuç veriyor; Yengeç için 107 yıl
çıkıyor, gerçek yaşı 970 yıl. Bu yüzden önce süpürülen kütleyle evreye bakılıyor ve Sedov yaşı
yalnız geçerli olduğu evrede gösteriliyor.

## Görünüm (`js/nebula/visual.js`, `js/render/nebula.js`)

- **Yöntem:** birim küre içinde 64 adımlı hacimsel ışın yürütme; emisyon eklenir, toz soğurur.
- **Renkler:** çizgilerin dalga boyundan CIE ile hesaplanır (`lineRgb`):
  - Hα 656,28 → saf kırmızı
  - [O III] 500,68 → camgöbeği-yeşil
  - Hβ 486,13
  - [S II] 671,6
- **Yansıma bulutsusu:** Planck × λ^−1,5 saçılma (`scatteredRgb`). 15 000 K'lik yıldızın ışığı
  saçılınca belirgin biçimde mavileşir.
- **Türe göre biçim:**
  - Gezegenimsi: elipsoit kabuk (SIMBAD eksen oranı ve konum açısı), içte [O III], dışta Hα + [N II].
  - H II: türbülanslı gaz, merkezde açılmış boşluk, toz şeritleri.
  - Süpernova kalıntısı: sırtlı gürültüden ince lifler.
  - Karanlık bulutsu: arkadaki Hα tabakasının önünde toz siluet.
- **Durağan sahne:** `glview` sahnesi `static: true`; kare yalnız kamera oynayınca ya da boyut
  değişince çizilir.

## Gözlem görüntüsü (`js/ui/observation.js`)

- **Kaynak:** `alasky.cds.unistra.fr/hips-image-services/hips2fits`, 480×320 JPG, ~1 sn.
- **Görüş alanı:** açısal boyutun 1,6 katı, yoksa 15′.
- **Tarama seçimi:**
  - Pan-STARRS DR1 (δ > −29°): daha derin, parlak bulutsuda doymaz; renkleri g/z bantlarından
    üretilir, gerçek renk değil (altyazıda yazar).
  - DSS2 renkli: güney gökyüzü ve parlak yıldızlar (V < 8). Pan-STARRS parlak yıldızda doyup
    merkezi maskeliyor.
- **Görünmediği yerler:** Güneş ve Güneş Sistemi gezegenleri (koordinat yok). Ötegezegende
  yıldızının çevresi gösterilir.

## Bilinen sınırlar

- Biçimler türün genel yapısıdır; Atbaşı'nın at başı gibi tekil şekiller yalnız gözlemde görülür.
- Pulsar rüzgârı bulutsusu (Yengeç'in içindeki eşzamanlı ışınım) modellenmedi.
- Uzaklığı ya da boyutu olmayan bulutsularda (NGC 1999, Atbaşı'nın uzaklığı) fiziksel değerler
  "bilinmiyor" olarak gösterilir.
- Yoğunluk ve hız varsayımları (n_e = 100, v = 20 km/s, n_ISM = 1) bulutsudan bulutsuya on kat
  değişebilir; sonuçlar mertebe tahminidir ve "tahmini" etiketi taşır.
