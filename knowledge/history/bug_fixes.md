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
