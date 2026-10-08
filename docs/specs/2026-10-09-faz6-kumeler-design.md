# Gökyüzü Veri Portalı — Faz 6 (Yıldız Kümeleri) Tasarımı

Tarih: 2026-10-09 · Durum: uygulandı

## Kullanıcı kararı

Beş faz bitince yeni fazlar önerildi (kümeler, pulsarlar, küçük cisimler, kuasarlar). Fatih
"faza devam et" dedi ve önerilen ilk faz, yıldız kümeleri uygulandı.

## Veri (`js/cluster/fetch.js`)

- **Türler:** SIMBAD `OpC` ve `Cl*` açık küme, `GlC` küresel küme.
- **Üyeler:** SIMBAD hiyerarşisinden (`h_link`). Üyelik olasılığı ≥ %50 ya da belirtilmemiş, hem B
  hem V parlaklığı olanlar alınır.
- **Sorgu:** Konum (`basic`) ve fotometri (`flux`) iki paralel sorguda alınır, zaman aşımı 15 sn.
  Üçlü birleştirme Ülker ve ω Cen'de 6 sn'yi aşıyordu.
- **Tekilleştirme:** Aynı yıldız her üyelik makalesi için `h_link`'te ayrı satır olabiliyor (M67:
  6.171 satır, ~1.600 yıldız). `DISTINCT` ve istemcide tekilleştirme uygulanır. Bu yapılmadan
  sayımlar şişiyor, 3D'de aynı yıldızın kopyaları çizgi deseni oluşturuyordu.

## Fizik (`js/cluster/derive.js`, `dev/check-cluster.mjs`)

- **Renkten sıcaklık:** (B−V) → Teff, Ballesteros (2012).
- **ZAMS:** yaklaşık M_V(B−V) eğrisi, Pecaut & Mamajek (2013) cüce tablosundan.
- **Kızarma (ZAMS uydurması):** Üyeler kızarma vektörü boyunca (A_V = 3,1 E) kaydırılır; ZAMS'a ±0,3
  kadir içinde oturan yıldız sayısını en çoklayan E(B−V) seçilir. E < 0,15 uygulanmaz, çünkü
  evrimleşmiş anakol ve çiftler ~0,1 sistematik kaydırma yapıyor; uygulanınca M67'nin yaşı
  kötüleşiyordu. Küresel kümede uydurma yapılmaz (ω Cen'de anlamsız 1,12 çıkıyordu).
- **Bükülme noktası:**
  - Anakol bandındaki (ZAMS ±1 kadir) yıldızların 0,5 kadirlik ışıma fonksiyonu çıkarılır.
  - En kalabalık kutudan parlak yöne yürünür; bir sonraki kutu max(3, şimdiki/4)'ün altına düşünce
    durulur.
  - Seyrek mavi başıboşlar (M67) kopuştan sonra kalır, genç kümenin seyrek ama kesintisiz üst anakolu
    (Ülker) yürüyüşü durdurmaz.
- **Yaş:** Bükülme kütlesi, bolometrik düzeltme ve kütle–ışıma bağıntısıyla bulunur. Anakol ömrü
  log t = 10 − 3,6 log M + 0,9 (log M)². Basit M^−2,5 yasası B yıldızlarının ömrünü iki kat uzun buluyordu.
- **Küresel kümelerde yaş verilmez:** yatay kol yıldızları anakol bandına düşüyor.

**Sonuçlar** (SIMBAD üyeleri, 2026-10-09):

| Küme | Yaş | Literatür |
| :--- | :--- | :--- |
| Ülker | 160 milyon yıl | 110–125 milyon yıl |
| M67 | 3,0 milyar yıl | 3,5–4,5 milyar yıl |
| Hyades | 681 milyon yıl | 625–700 milyon yıl |
| h Persei | 111 milyon yıl (E = 0,38 düzeltildi) | ~13 milyon yıl; düzeltmesiz 1,5 milyar çıkıyordu |

## Görünüm (`js/cluster/visual.js`, `js/render/cluster.js`)

- **Sahne:** Her üye bir nokta sprite'ı; ışık eklemeli karıştırmayla toplanır.
- **Ortak görünüm genişletildi:** `glview` artık sahnenin kendi vertex shader'ını (`vert`) ve
  çizimini (`draw`) kabul ediyor.
- **Konum:** x, y gerçek gökyüzü konumu (teğet düzlem, pc). z bilinmediği için izotropik normal
  dağılımdan örneklenir (mulberry32, kimlikten sabit tohum).
- **Renk ve parlaklık:** renk (B−V)₀ → Teff → kara cisim; parlaklık M_V'den.

## Kart (`js/ui/cluster-card.js`)

- **HR diyagramı:** gerçek üyelerin (B−V)₀ ve M_V değerleri, ZAMS çizgisi, bükülme halkası.
- **Satırlar:** uzaklık, yarıçap, fotometrili üye sayısı, E(B−V) (uygulandı ya da uygulanmadı),
  bükülme (M_V, Teff, kütle), yaş, toplam V ışıması (alt sınır).

## Aynı fazda düzeltilen hata

`observation.js`: `vMag` varsayılanı `null`; JavaScript'te `null < 8` true döndüğü için parlaklık
vermeyen bütün kartlar (bulutsu, gökada, küme, kara delik) faz 3'ten beri DSS2 alıyordu. Düzeltildi.

## Bilinen sınırlar

- SIMBAD üye listeleri alan yıldızı içerir; HR diyagramında saçılma var.
- Yaş bir mertebe tahmini: metal bolluğu, çiftler ve dönme hesaba katılmadı. Genç ve kızarmış
  kümelerde (h Persei) yanılgı büyük.
- Küresel kümelerde yaş verilmez.
