# Gökyüzü Veri Portalı — Faz 9 (Kuasarlar) Tasarımı

Tarih: 2026-10-09 · Durum: uygulandı

## Kullanıcı kararı

Fatih "Devam et faz falan varsa sıra sıra" dedi. Faz 7 ve 8'den sonra önerilen listenin son fazı,
kuasarlar uygulandı.

## Veri

- **Türler:** SIMBAD `QSO`, `Q?`, `Bla`, `BLL`, `Bz?`, `BL?` (~820 bin cisim). Seyfert ve `AGN`
  gökada akışında kalır.
- **Alanlar:** kırmızıya kayma (`rvz_redshift`) ve parlaklıklar `fetchObject`'ten geliyor; yeni
  sorgu yok.
- **Ad tuzağı:** 3C 273 SIMBAD'da `BLL` türünde.
- **Bağlantı:** NASA/IPAC NED (`byname?objname=`).

## Fizik (`js/quasar/derive.js`, `dev/check-quasar.mjs`)

Kozmoloji düz ΛCDM (H0 = 70, Ωm = 0,3), gökada fazıyla aynı.

- **Uzaklıklar:** eş hareketli uzaklık (Simpson), ışıma uzaklığı (1 + z) D_C, açısal çap uzaklığı
  ve kpc/″ ölçeği.
- **Zaman:** geriye bakış (`galaxy/derive.js`'ten) ve o anki evren yaşı (analitik).
- **Kontrol:** Wright (2006) hesaplayıcısıyla. z = 1'de D_C 3304 Mpc, yaş 5,75 milyar yıl, ölçek 8,0
  kpc/″.
- **Mutlak parlaklık:** f_ν ∝ ν^−0,5 ile K düzeltmeli. Bant sırası g, V, G, r, B, R, i; hepsi AB
  sayılır.
- **Işıma:** νL_ν gözlenen banttan 5100 Å'a taşınır; L_bol = 9,26 × λL_λ(5100) (Richards 2006).
  3C 273 için 10^46,9 erg/s (literatür 10^46,6–47,2).
- **Eddington kütlesi:** L_bol / (1,26 × 10³¹ W/M☉). Kesin bir alt sınır değil, mertebe: 3C 273'te
  6,5 × 10⁸, GRAVITY ölçümü 2,6 × 10⁸ M☉.
- **Lyα:** gözlenen dalga boyu 121,6 (1 + z) nm.

## Tayf (`js/quasar/spectrum.js`)

- **Durgun çerçeve:** Vanden Berk (2001) SDSS bileşik tayfı.
  - Süreklilik f_λ ∝ λ^−1,56; 5000 Å üstünde konak gökada eğimi.
  - On geniş ve dar çizgi, eşdeğer genişlikleriyle.
- **Gözlenen tayf:** (1 + z) kaydırılır.
  - Lyα'nın mavisinde orman soğurması τ = 0,0036 (λ/1216)^3,46 (Madau 1995).
  - 912 Å altı kapalı.
- **Renk:** gözlenen tayf × CIE → sRGB; yeni `spectrumRgb` (color.js). Yakın kuasar mavi-beyaz.
  z ~ 3,5'te Lyα ormanı maviyi kesip kızıllaştırır. z > 5'te görünür ışığın tümü soğurulur.
- **Kart:**
  - Kartın simgesi ve WebGL'siz yedek bu renkte.
  - Tayf çizimi 300–1100 nm, görünür bant işaretli.
  - Soğurulan kesir satırı (APM 08279+5255'te %42).

## Görünüm

Kara delik sahnesi (`render/blackhole.js`) yeniden kullanılır: kütle Eddington kestiriminden,
disk sıcaklığı ve zaman ölçeği `deriveBlackHole`'dan. Jet ve konak gökada çizilmez.

## Bilinen sınırlar

- **Işıma:**
  - Blazarlarda jet ışınlanması ışımayı büyütür; düzeltilmez.
  - Kütleçekimsel merceklenme düzeltilmez: APM 08279+5255 ~10^14,6 L☉ çıkıyor, büyütme ~50–100.
  - Bant ofsetleri (Vega/AB) ve tek kuvvet yasası ~0,2 kadir hata getirir.
- **Tayf:** ortalama kuasar; tek tek kuasarların çizgi güçleri farklı. Lyα ormanı ortalama
  soğurma, tek bir görüş doğrultusu değil.
