# Gökyüzü Veri Portalı — Faz 4 (Gökadalar) Tasarımı

Tarih: 2026-10-08 · Durum: uygulandı

## Kullanıcı kararı

"Faz 4'ü yap." İçerik önceki mesajda önerilmişti: Hubble türü, boyut, uzaklık, kırmızıya kaymadan
uzaklık; model `Websites/galaksi` fiziğine dayanacaktı.

**Sapma:** Model `galaksi` projesindeki N-cisim simülasyonuna dayandırılmadı. Simülasyon arka
planda sürekli çalışmak için ağır, ayrıca o projeyi okuyan araç adımı Fatih tarafından durduruldu.
Yerine analitik bir gökada modeli yazıldı.

## Veri (SIMBAD `basic` + `mesDistance`)

- `morph_type`: de Vaucouleurs gösterimi (`SA(s)b`, `SB(rs)bc`, `E-E/S0`; M104'te yalnız `1`).
- `galdim_*`: açısal boyut ve konum açısı.
- `rvz_radvel` (cz) ve `rvz_redshift` (z).
- `flux`: B bandı.
- Gökada sayılan türler: G, GiG, GiC, GiP, BiC, AGN, Sy1, Sy2, SyG, LIN, SBG, bCG, LSB, EmG, H2G, rG,
  IG, PaG. Kuasar ve blazar nokta kaynak oldukları için dışarıda.

## Fizik (`js/galaxy/derive.js`, `dev/check-galaxy.mjs`)

| Büyüklük | Yöntem | Kontrol |
| :--- | :--- | :--- |
| Hubble türü | aile (E/S0/S/Irr), T sayısı, çubuk | `SB(rs)bc` → T 4, çubuklu |
| Uzaklık | "redshift" yöntemi dışlanmış ölçümlerin ortancası; yoksa cz > 1000 km/s için Hubble yasası (H0 70) | M33 0,86 Mpc (redshift satırı 4,11 diyor) |
| Eğiklik | Hubble (1926), q0 = 0,2 | M31 73° (lit. 77°) |
| Çap | açısal × uzaklık | M31 45 kpc |
| M_B, L_B | B − 5 log d + 5; sönümleme yok sayıldı | M31 −20,1 |
| Dönüş hızı | Tully–Fisher (Tully & Pierce 2000), yalnız sarmallar | M31 187 km/s (lit. ~250; sönümleme yüzünden düşük) |
| Dinamik kütle | V² R / G | M31 1,8 × 10¹¹ M☉ |
| Geriye bakış | düz ΛCDM, Simpson integrali | z = 1 → 7,7 milyar yıl |

**Bilinen sınır:** Şişkinliği baskın türlerde (T ≤ 1) görünen biçimi şişkinlik belirliyor. Eksen
oranından gelen eğiklik güvenilmez (Sombrero 56° çıkıyor, gerçek ~84°); bu türlerde "tahmini"
etiketi taşır.

## Görünüm (`js/galaxy/visual.js`, `js/render/galaxy.js`)

- **Disk:** Analitik olarak çiziliyor, ışının disk düzlemini kestiği noktada yüzey parlaklığı ve toz
  optik derinliği hesaplanıyor. Eğim çarpanı 1/|cos| ile sınırlı.
  - Üstel disk, R_d = 0,3 R_opt.
  - Logaritmik sarmal kollar, m = 2. Kol açısı T'den: 5° + 2,8°·T (Kennicutt 1981 eğilimi).
  - Çubuk ve H II düğümleri.
  - Toz şeritleri kolların iç kenarında.
- **Şişkinlik:** yumuşatılmış Hernquist yoğunluğu, 40 adımlı yürütme. Disk düzleminin önü ve arkası
  ayrı toplanıyor; arkası diskin toz geçirgenliğiyle zayıflıyor. Böylece kenardan görünen gökadada
  toz şeridi şişkinliğin önünden geçiyor.
- **Şişkinlik/toplam oranı:** T'den (Simien & de Vaucouleurs 1986 eğilimi).
- **Eliptik:** şişkinlik bileşeni tek başına, görünen basıklıkla.
- **Renkler:** yaşlı topluluk 4300 K, genç topluluk 15 000 K kara cisim; H II düğümleri Hα + Hβ.
- **Bakış açısı:** varsayılan bakış yüksekliği 90° − eğiklik; arka plan ve köşe önizlemesi
  gözlemdeki açıyla aynı.
- **Sahne:** durağan.

## Doğrulama

Tarayıcıda M31 (model ve DSS2 gözlemi aynı açıdan), NGC 1300 (çubuk + kollar), M87 (pürüzsüz
eliptik) ve M104 denendi.

## Bilinen sınırlar

- Kol sayısı ve konumu gerçek yapı değil; konum açısı (PA) uygulanmadı.
- Sönümleme yok sayıldığı için M_B ve Tully–Fisher hızı düşük kalır (M31: 187 / ~250 km/s).
- Etkileşen gökadalar (M51'in yoldaşı gibi) modellenmedi.
