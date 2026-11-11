# İlerleme

- [x] Spec ve plan (`docs/`)
- [x] Fizik türetimi ve kontrolü
- [x] Arama: SIMBAD, Wikidata, Türkçe adlar
- [x] Veri çekme ve yönlendirme bağlantıları
- [x] WebGL 2 replika: renk, kenar kararması, granülasyon, dev hücreler, lekeler,
      basıklık ve kütleçekimsel kararma
- [x] 3D görünüm ve ayar paneli
- [x] TR/EN dil, mobil düzen, paylaşılabilir adres
- [x] Yayına alma: GitHub Pages, https://hfatih.github.io/gokyuzu-veri-portali/ — 2026-11-12
- [ ] Alan adı (gokyuzuveriportali) Pages'e bağlanacak
- [x] Faz 2: gezegenler (Güneş Sistemi + ötegezegenler, Wikidata) — 2026-10-08
- [x] Faz 3: bulutsular + tüm kartlarda gözlem görüntüsü (CDS hips2fits) — 2026-10-08
- [x] Faz 4: gökadalar (analitik model, ölçülen eğiklikle bakış) — 2026-10-08
- [x] Faz 5: kara delikler (Wikidata, Schwarzschild ışın izleme) — 2026-10-08
- [x] Faz 6: yıldız kümeleri (SIMBAD üyeleri, HR diyagramı, bükülme yaşı) — 2026-10-09
- [x] Faz 7: pulsarlar (ATNF/VizieR, deniz feneri modeli, atım sesi) — 2026-10-09
- [x] Faz 8: küçük cisimler (IMCCE SsODNet, MOID, cisim replikası, yörünge çizimi) — 2026-10-09
- [x] Faz 9: kuasarlar (ΛCDM, kırmızıya kaymış tayf ve renk, Eddington kütlesi) — 2026-10-09
- [x] Altyapı: npm test, CI, Playwright duman testi, tür kaydı (js/kinds), oturum önbelleği, tekrar dene — 2026-11-05
- [x] Gökyüzünde: doğuş/batış, bu gece en iyi an, 24 saatlik eğri (Standish, AA) — 2026-11-05
- [x] Keşfet, bugünün cismi, 3 rehberli tur, ölçek karşılaştırması, ilişkili cisimler — 2026-11-05
- [x] Sönümleme (renk fazlası), dev/süperdev Teff tabloları, Wikidata aykırı tercih, Bond albedo — 2026-11-05
- [x] Faz 10: çift yıldızlar (ORB6, Kepler III, 3D yörünge) — 2026-11-05
- [x] Faz 11: değişen yıldızlar (VSX, ışık eğrisi, P–L, zonklama) — 2026-11-05
- [x] Faz 12: uydular (Ay, Galile uyduları, Titan…) — 2026-11-05

**Bilinen sınırlar:**
- v sin i, i = 90° kabulüyle kullanılıyor.
- Sönümleme renk fazlasından kaba tahmin (±0,3 mag); B parlaklığı yoksa düzeltme yok.
- ORB6/VSX VizieR sütun adları, uydu QID'leri, kara delik ↔ gökada Wikidata bağı ve albedo niteleyici
  sorgusu canlı serviste doğrulanmadı (2026-11-05 oturumunda ağ kapalıydı); hata olursa sessiz atlanır.
- Işık eğrileri şematik; çift yıldız sahnesinde beyaz cüce yoldaş anakol varsayımıyla yanlış renkte.

- [x] SIMBAD yedek aynası, üst bar/dil seçici, KVKK çerez ve yasal metin güncellemesi — 2026-11-05
