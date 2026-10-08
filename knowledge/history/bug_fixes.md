# Hata düzeltmeleri

## 2026-10-08 · v1 geliştirme sırasında bulunanlar

- **SIMBAD önek sorgusu 100 sn'yi aştı.** `'M 3%'` ile `ORDER BY nbref` birlikte kullanılınca
  sunucu tüm tabloyu taradı. `ORDER BY` kaldırıldı, sıralama istemcide yapılıyor; her isteğe
  6 sn zaman aşımı eklendi.
- **Türkçe karakterli girdide SIMBAD hata verdi** ("kutup yıld", "güneş"). ASCII olmayan girdi
  artık SIMBAD'a gönderilmiyor.
- **Takımyıldız kısaltması yanlış büyük harfle yazılıyordu** (`Cma`). Doğrusu `CMa`; 88 IAU
  kısaltmasıyla düzeltildi.
- **Proxima'nın yarıçapı 0,44 R☉ çıktı.** Torres BC_V polinomu 3300 K altında geçersiz. M
  cücelerinde K bandına geçildi, sonuç 0,158 (literatür 0,154).
- **LMC kartı açılmadı.** Gökadanın binlerce alt cismi `h_link` sorgusunu zaman aşımına
  uğratıyordu. Sorgu SQL'de gezegenlerle süzülüyor; ikincil sorgular `allSettled` ile
  birbirinden bağımsız başarısız olabiliyor.
- **Betelgeuse krem rengi görünüyordu.** Kanal başına ACES tonu kaydırıyordu; ton eşleme yalnız
  en parlak kanala uygulanıyor.
- **`hidden` öznitelikli köşe önizlemesi görünüyordu.** `.corner { display:flex }` gizlemeyi
  eziyordu; `[hidden] { display:none !important }` eklendi.

## 2026-10-08 · Faz 2 sırasında bulunanlar

- **TRAPPIST-1 yarıçapı 1,99 R☉ çıktı** (doğrusu 0,12). Tayf türünde ışıklılık sınıfı yok
  ("M7.5e"); cüce yolu tetiklenmedi ve BC_V 2475 K'e dışdeğerlendi. Sınıfı olmayan ve log g ≥ 4
  olan soğuk yıldızlar artık K bandıyla hesaplanıyor (test eklendi).
- **Satürn "Neptün benzeri" sınıflandı.** Ortalama yarıçapı 9,14 R⊕; tür artık kütleye de
  bakıyor (M ≥ 50 M⊕ → gaz devi).
- **Neptün "mini-Neptün" çıkıyordu** (3,87 R⊕ < 4). Sınır 3,5 R⊕'e çekildi.
- **Satürn halkaları neredeyse yandan görünüyordu.** Eksen eğikliği z yerine x ekseninde
  (izleyiciye doğru) uygulanıyor.
- **Neptün gri görünüyordu.** Güneş ışığının hafif sıcak kara cisim rengi doku ve bulut
  renklerine ikinci kez biniyordu; ışık Güneş'e beyaz dengelendi.

## 2026-10-08 · Faz 3 sırasında bulunanlar

- **Ters `smoothstep` kenarları:** üç shader'da 9 çağrıda edge0 > edge1 vardı; GLSL'de bu tanımsız
  davranış. Hepsi `1.0 - smoothstep(b, a, x)` biçimine çevrildi.
- **M1'in adı "CRAB NEB" görünüyordu.** İlk `NAME` kimliği kısaltma; artık küçük harf içeren en
  uzun ad seçiliyor ("Crab Nebula", "Proxima Centauri").
- **M57 gözlemi DSS2'de doymuştu, Betelgeuse Pan-STARRS'ta maskeliydi.** Tarama seçimi artık
  gökyüzü bölgesine ve parlaklığa göre yapılıyor.
- **CIE fonksiyonları iki kopyaydı.** `blackbodyTable` ortak `cieX/Y/Z` fonksiyonlarını kullanıyor;
  çıktı birebir aynı (3633 K → rgb(255, 203, 147)).
