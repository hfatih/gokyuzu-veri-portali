# Aktif bağlam

**2026-11-05:** Önerilen geliştirme listesinin tamamı yapıldı; yayına alma hariç tutuldu.

**Yapılanlar:**
- **Altyapı:** `npm test`, `npm run smoke` (Playwright), CI, tür kaydı (`js/kinds/`), oturum
  önbelleği (`js/net/http.js`), tekrar dene.
- **Yeni bölümler:** Gökyüzünde (`js/sky/`), keşfet ve turlar (`js/explore/`), ölçek
  karşılaştırması, ilişkili cisimler.
- **Fizik:** sönümleme, dev ve süperdev Teff tabloları, Wikidata aykırı tercih edilen değer, Bond
  albedo.
- **Fazlar:** 10 çift yıldızlar, 11 değişen yıldızlar, 12 uydular.

**Doğrulama:**
- Fizik `dev/check-*.mjs` ile yayımlanmış değerlere karşı sınandı.
- Akış duman testiyle sabit yanıtlar üzerinde sınandı.
- Oturumda SIMBAD, Wikidata, VizieR ve IMCCE'ye ağ erişimi yoktu. İlk iş: canlı serviste kontrol et:
  - Sirius ve α Cen yörüngesi (ORB6 sütunları)
  - δ Cep ve Algol (VSX sütunları)
  - Ay ve İo kartı (Wikidata QID'leri)
  - M87 kartında ilişkili kara delik

**2026-11-05 (devam):**
- **Tasarım:** siyah tema mockup'ları (Design tuvali). Siteye uygulandı: tam siyah zemin,
  sarı/turuncu palet, kayan yıldızlar, üst/alt bar, "Bu gece" kutusu, çerez onayı ve 8 yasal sayfa.
- **Yazı tipleri:** kendi sunucumuzdan veriliyor.
- **Bekleyen:** `js/legal/site-info.js` doldurulacak ve hukuki inceleme yapılacak; sonra `draft: false`.

- **Fiziksel Güneş:** `js/sun/` ve shader'da `uSpot`/`uFac` dizileri. NOAA SWPC biçimi canlı serviste
  doğrulanmadı; ayrıştırıcı esnek, hata olursa istatistiksel modelle devam eder.

**Sıradaki olası işler:**
- Yayına alma (gokyuzuveriportali alan adı; onay gerekir).
- **Küçük işler:**
  - Pulsar rüzgârı bulutsusu
  - Kuasar jeti
  - Gökada PA
  - Kerr kara delik
  - Örten çiftleri 3D'de tutulmayla göstermek
  - Beyaz cüce yoldaşı tanımak
