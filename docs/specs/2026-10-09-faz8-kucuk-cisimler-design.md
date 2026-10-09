# Gökyüzü Veri Portalı — Faz 8 (Küçük Cisimler) Tasarımı

Tarih: 2026-10-09 · Durum: uygulandı

## Kullanıcı kararı

Fatih "Devam et faz falan varsa sıra sıra" dedi. Faz 7'den sonra sıradaki faz, asteroitler, kuyruklu
yıldızlar ve cüce gezegenler uygulandı.

## Veri (`js/sso/fetch.js`)

- **JPL SBDB API kullanılamıyor:** CORS başlığı göndermiyor (curl ile `Origin` başlığıyla denendi).
  SIMBAD Güneş Sistemi cisimlerini içermiyor.
- **IMCCE SsODNet (CORS açık):**
  - Arama: quaero `instant-search`, önek eşleşmesi.
  - Parametreler: ssoCard. Her değer özgün kaynağıyla gelir.
- **Kimlik:** `sso:<IMCCE id>` (ör. `sso:Ceres`, `sso:1P`). Türler: Asteroid, Comet, Dwarf Planet.
- **Arama sıralaması:** IMCCE bilinirlik ölçüsü vermiyor, kaba değer kullanılıyor (`rankOnly`):
  - cüce gezegen 5 × 10⁵
  - numaralı cisim 3000/√numara
  - numarasız 30
- **Türkçe adlar:** Plüton, Halley Kuyruklu Yıldızı.
- **Yer tutucu:** 2P/Encke'de toplam parlaklık H1 = R1 = 0,0. Yok sayılır, yoksa parlaklık 0,2 kadir
  ("çıplak göz") çıkıyordu.

## Fizik (`js/sso/orbit.js`, `js/sso/derive.js`, `dev/check-sso.mjs`)

**Yörünge** (`orbit.js`):
- Kepler denklemi; elemanlardan bugünkü konum (iki cisim).
- Dünya'nın ortalama elemanları (Standish).
- **MOID:** 360 × 360 ızgara, ardından yerel adaylarda daralan ızgara. IMCCE'nin MOID değeri
  kullanılmıyor: Bennu için 0,084, Apophis için 0,033 AU veriyor. Elemanlardan hesap Bennu 0,0028,
  Eros 0,149, Halley 0,077 AU; JPL değerleri 0,0032, 0,149 ve 0,0745.

**Fizik** (`derive.js`):
- **Yörünge sınıfı:** MPC/JPL tanımları. Kuyruklu yıldızda dönem ve Tisserand'a göre Jüpiter ailesi,
  Halley türü ya da uzun dönemli.
- **Hızlar:** Tisserand T_J ve vis-viva. Halley'in günberi hızı 54,5 km/s.
- **Çap:** ölçülen; yoksa H ve albedodan D = 1329/√p · 10^(−H/5). Apophis 0,34 km.
- **Kütle, çekim:** kütle (yoksa varsayılan yoğunlukla), yüzey çekimi, kaçış hızı. Ceres 510 m/s,
  Dawn ile aynı.
- **Dönme sınırı:** moloz yığını için P_c = √(3π/Gρ). Bennu 3,0 saat; dönemi 4,3 saat, oran 1,43.
- **Sıcaklık:** günberi ve günötede güneş altı sıcaklığı (Bond albedosu, ε = 0,9).
- **Tehlike:** MOID ≤ 0,05 AU ve H ≤ 22 ise "potansiyel tehlikeli".
- **Bugün:** r, Δ, evre açısı ve görünür parlaklık.
  - Asteroitte H, G sistemi (Bowell 1989).
  - Kuyruklu yıldızda H1 + 5 log Δ + K1 log r. IMCCE `R1` alanı K1 eğimi olarak okunuyor; bu bir
    yorum, alanın tanımı belgede doğrulanmadı.

## Görünüm (`js/sso/visual.js`, `js/render/sso.js`)

- **Biçim:**
  - Uzaklık alanıyla ışın yürütme.
  - Üç eksenli elipsoit: ölçülen a/b, a/c; yoksa boyuta göre varsayım.
  - Gürültü pürüzünün genliği çapla azalır: ~400 km üstü cisimler yuvarlanır.
- **Dönme:** kısa eksen çevresinde gerçek dönemle (varsayılan hızda bir dönüş ~20 sn).
- **Yüzey:**
  - Lommel–Seeliger + Lambert karışımı; parlak yüzeyde Lambert ağırlığı artar.
  - Yumuşak öz gölge.
  - Renk taksonomi sınıfından (DeMeo 2009'dan kaba), parlaklık albedoyla doğrusal.
- **Aydınlatma:** varsayılan kamerayla bugünkü evre açısı kadar ayrık. Uzak cisimler (Plüton, 1,5°)
  bu yüzden dolunay gibi düz görünür.
- **Kuyruk ve koma:**
  - Koma: kuyruklu yıldız ~3 AU içindeyse, etkinlik ~ r⁻⁴; yoğunluk 1/r², Güneş tarafı parlak.
  - Kuyruk: çekirdek ölçeğinde görünmez, çizilmez.

## Kart (`js/ui/sso-card.js`)

- **Yörünge çizimi:** ekliptiğe yukarıdan; gezegen yörüngeleri, cismin yörüngesi, bugünkü Dünya ve
  cisim konumu.
- **Satırlar:**
  - Fiziksel: çap, albedo, kütle, yoğunluk, çekim ve kaçış hızı, dönme ve sınır.
  - Yörünge: elemanlar, günberi–günöte ve hızlar, sıcaklık, T_J, MOID (AU ve Ay uzaklığı, tehlike
    işareti).
  - Bugün: konum ve parlaklık, görünürlük düzeyi.
- **Bağlantılar:** IMCCE ssoCard, JPL SBDB, MPC, ADS.

## Bilinen sınırlar

- **Konum:** iki cisim; gezegen tedirginlikleri yok, elemanların döneminden uzaklaştıkça sapar.
  Dünya'nın konumu ortalama elemanlarla, ~0,01 AU.
- **MOID:** Dünya'nın ortalama yörüngesiyle; JPL'den %10–15 farklı olabilir (Bennu 0,0028 / 0,0032).
- **Görünüm:** biçim gerçek şekil modeli değil; Vesta'nın Rheasilvia havzası gibi ayrıntılar yok.
  Uydular (ör. Charon) çizilmiyor.
- **Hiperbolik cisimler:** yörünge çizimi ve bugünkü konum yok.
