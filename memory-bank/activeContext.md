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

**2026-11-05 (devam 2):**
- **Arama:** SIMBAD Harvard yedek aynası (`tap()`); Betelgeuse kartı canlıda dolu açıldı.
- **Arayüz:** üst şerit kalktı, TR/EN ana barda kayan hap; "veriler anlık alınır, saklanmaz" alt bilgide.
- **Hukuk:** çerez kutusu ve yasal sayfalar astronews metinlerinden uyarlandı. `draft: true` duruyor; barındırma ve
  sunucu kaydı süresi belli olunca `site-info.js` doldurulacak, sonra hukuki inceleme.
- **Yerel çalışma kopyası:** `Desktop/Websites/gokyuzu-veri-portali`, dal `claude/hopeful-edison-mvlabk` (master'a birleşmedi).

**2026-11-12:** Yayında: https://hfatih.github.io/gokyuzu-veri-portali/ (GitHub Pages, `master` kökü, `.nojekyll`).
- Dal `master`'a ileri sarıldı; depo public yapıldı (özel depoda Actions startup_failure veriyordu).
- Canlıda Betelgeuse araması ve kartı, KVKK sayfası doğrulandı. CDS bu gün CORS başlıksız yanıt verdi; SIMBAD
  Harvard'a düştü, VizieR ekleri (ORB6, VSX) eksik.
- Sıradaki: alan adını bağlamak, `site-info.js` barındırma = GitHub, Inc. (ABD) ve kayıt süresi, hukuki inceleme.

**2026-11-13:** Bütün modellerin fizik ve görünüş hesabı denetlendi, 8 bulgu düzeltildi (ayrıntı `knowledge/history/bug_fixes.md`):
zonklama sıcaklığı V bandı Planck'tan, çift yıldız görsel parlaklık oranı, havasız cisimlerde Lommel–Seeliger, uzak gökadada
ΛCDM uzaklıkları ve iç sönümleme, Kopparapu 2014 yaşanabilir bölge, Teff tablosu. CDS bozukken VSX/ORB6 gelmediği için
zonklama ve çift yıldız sahneleri tarayıcıda test parametreleriyle doğrulandı, canlı veriyle değil.

**2026-11-13 (2):** Ay, Jüpiter, İo, Europa, Ganymede, Kallisto ve Enceladus gerçek NASA/USGS haritasıyla çiziliyor; bütün
haritalar 4096×2048 (ayrıntı `knowledge/history/engine_features.md`, kaynaklar `assets/textures/KAYNAK.md`). Satürn ve
bulutlu cisimler modelde kaldı. Tarayıcıda on haritalı cismin hepsi açılıp bakıldı; telefonda ve yavaş bağlantıda
(harita inene kadarki model görünümü) denenmedi.

**2026-11-13 (3):** Dokuz sahnenin fiziği yükseltildi, her biri ayrı commit (ayrıntı `knowledge/history/engine_features.md`,
"Fizik yükseltmesi 1/9 … 9/9"). En büyük değişiklik gökada (kalın disk, Sérsic, dönme). Pulsar, çift yıldız ve etkin
kuyruklu yıldız sahneleri canlı kartla değil, sayfa içinde test parametreleriyle doğrulandı (CDS bozuk / bugün etkin
kuyruklu yıldız yok). Telefonda kare hızı ölçülmedi; gökada sahnesi artık her karede ışın yürütüyor.
Yeni kural: metinlerde kesme işareti kaçışsız yazılırsa site açılmaz; `dev/check-syntax.mjs` bunu yakalar.

**2026-11-14:** Gerçekçilik A grubu: bütün sahnelerde gerçek gökyüzü (NASA Deep Star Maps), Ay ve Mars'ta kabartma, bulutlu
Dünya ve gece ışıkları, Ceres/Vesta/Plüton gerçek haritaları, Satürn halka rengi. Ayrıntı engine_features.md. Telefonda
kare hızı hâlâ ölçülmedi; gökyüzü 1,5 MB her ilk ziyarette iner.

**2026-11-14 (2):** Gökyüzü yordamsal (fotoğraf dokusu geri alındı). VizieR Harvard aynası ile VSX/ORB6/pulsar geri geldi;
tayfsal çiftler SB9'dan iki yıldız olarak çiziliyor. Yasal metinler Keyubu/14 gün/kvkk@ ile güncel. Yayın hedefi
gokyuzuveriportali.com.tr (YunoHost, My Webapp + www için Redirect); kök işleri Fatih yapacak.

**2026-11-14 (3):** Site https://gokyuzuveriportali.com.tr adresinde yayında (Let's Encrypt, www yönlendirmesi, kvkk@ takma adı).
Güncelleme: push + sunucuya tar (engine_features.md "Yayın" bölümü). hfatih.github.io yeni adrese yönlenir.

**2026-11-14 (4):** Performans (gzip + önbellek, font ön yükleme, gökyüzü maliyeti), künye adı Fatih Han, Güneş'in görünen yüzü
NASA SDO fotoğrafından. Sunucuda SDO cron'u ve sun/ önbellek kuralı henüz kurulmadı (bekliyor).
