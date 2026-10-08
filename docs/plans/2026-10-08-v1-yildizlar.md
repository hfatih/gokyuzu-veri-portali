# Gökyüzü Veri Portalı v1 Uygulama Planı

**Hedef:** Spec'teki ([2026-10-08-v1-yildizlar-design.md](../specs/2026-10-08-v1-yildizlar-design.md))
arama → kart → replika → 3D → yönlendirme akışı.

**Mimari:** Saf ES modülleri. Ağ katmanı (`search/`, `star/fetch.js`) ile saf hesap katmanı
(`star/derive.js`, `search/variants`) ayrıdır. Saf hesap katmanı Node ile test edilir. Çizim
`render/star.js` içindeki tek bir shader'dadır.

**Teknoloji:** HTML, CSS, JavaScript (ES2022 modülleri), WebGL 2 / GLSL ES 3.00. Bağımlılık yok.

## Genel kısıtlar

- Bağımlılık yok, derleme adımı yok, `index.html` yerel sunucu ile çalışır.
- Veri saklanmaz; yalnız SIMBAD TAP ve Wikidata API'ye tarayıcıdan istek atılır.
- SIMBAD ADQL'de tablo takma adı yok; `LOWER` ve `ILIKE` yok.
- Her türetilmiş değer bir köken taşır: `measured` | `derived` | `estimated`.
- TR + EN arayüz, `?lang=en`; seçili yıldız `?star=<SIMBAD main_id>` ile paylaşılır.
- Her kaynak dosya 800 satırın, her fonksiyon 100 satırın altında.

---

### Görev 1: Fizik türetimi (`js/star/derive.js`)

**Dosyalar:** `js/star/derive.js`, `dev/check-derive.mjs`

**Üretir:**
- `parseSpType(sp) → { cls, sub, lum }`. Örnek: `"M1-M2Ia-Iab"` → `{cls:'M', sub:1, lum:'I'}`.
- `teffFromSpType(sp) → number|null`
- `bolometricCorrection(teff) → number` (Torres 2010)
- `deriveStar(raw) → { distancePc, L, R, M, logg, teff, vEq, periodDays, scaleHeightKm, oblateness }`.
  Her alan `{ value, origin }` biçimindedir ya da değer `null` olur.
  - `raw` alanları: `{ teff, logg, feh, plx, plxErr, sp, mags:{V,B,...}, vsini }`

**Test** (`node dev/check-derive.mjs`):
- Güneş: L ≈ 1 ve R ≈ 1 (±%5)
- Sirius: R 1,5–2,0 ve L 20–32
- Vega: R 2,2–3,2 ve L 35–65
- Betelgeuse: R 400–1100
- `plx` yoksa `distancePc`, `L` ve `R` null

### Görev 2: Arama (`js/search/*`)

**Dosyalar:**
- `simbad.js`: `tap(adql, signal)`, `prefixSearch(q, signal)`, `lookupIds(ids, signal)`
- `wikidata.js`: `searchWikidata(q, lang, signal)` → `[{label, simbadId, qid}]`;
  `sitelinksForSimbad(mainId)` → `{trwiki, enwiki}`
- `aliases-tr.js`: `matchAliases(q)` → `[{label, simbadId}]`
- `variants.js`: `likeVariants(q)` → SIMBAD `LIKE` önekleri (saf fonksiyon)
- `suggest.js`: `createSuggester(onUpdate)` → `{ query(q), cancel() }`. Sonuçlar
  `[{label, mainId, otype, sp, nbref}]` biçiminde, `nbref` azalan sırada; önce hızlı kaynaklar,
  sonra birleşmiş liste gelir.
- `dev/check-search.mjs`: `likeVariants` ve `matchAliases` için assert kontrolü.

### Görev 3: Veri çekme ve bağlantılar

**Dosyalar:**
- `js/star/fetch.js`: `fetchObject(mainId, signal)` → `{ basic, raw, ids, planetCount }`
- `js/star/links.js`: `buildLinks(obj, wiki)` → `[{key, label, url}]`

URL biçimleri gerçek bir yıldızla (Betelgeuse) tarayıcıda doğrulanır.

### Görev 4: Replika (`js/render/*`)

**Dosyalar:**
- `color.js`: `blackbodyTable(N, Tmin, Tmax)`, FatihHanAstronom `kerr/physics.js` dosyasından alınır
- `star.js`: `createStarRenderer(canvas, {interactive})` → `{ setStar(params), setCamera({yaw,pitch,dist}), setTimeScale(x), destroy() }`
- `view3d.js`: `enable3D(renderer, canvas)` ile işaretçi ve teker kontrolü, ayar paneli

`params` alanları: `{ teff, radiusRsun, granScale, granContrast, spots, oblateness, gravDark, periodDays, granLifeSec, u1, u2 }`.
Bu değerler `derive.js` çıktısından `starVisualParams(derived)` ile üretilir; bu fonksiyon da
`derive.js` içinde yer alır.

### Görev 5: Arayüz

**Dosyalar:** `index.html`, `css/style.css`, `js/ui/i18n.js`, `js/ui/card.js`, `js/main.js`

- Açılış ekranı: ortada arama kutusu, arkada Güneş.
- Seçimden sonra: arama üst çubuğa taşınır, solda kart açılır, arka planda büyük replika,
  sağ altta canlı önizleme durur. Önizlemeye tıklayınca 3D açılır; Esc ile kapanır.
- Öneri listesi ARIA combobox'tır ve klavyeyle gezilir.

### Görev 6: Doğrulama ve kayıt

- `python -m http.server` ile tarayıcı önizlemesi: Betelgeuse, Sirius, Kutup Yıldızı, Akyıldız,
  Vega, M31 (yıldız olmayan cisim), EN dili.
- Proje içi kayıt: `README.md`, `knowledge/`, `memory-bank/`. Ayrıca vault notu ve receipt.
