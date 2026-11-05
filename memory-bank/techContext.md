# Teknik bağlam

- Saf HTML/CSS/JS (ES modülleri), WebGL 2 / GLSL ES 3.00. Bağımlılık ve derleme adımı yok.
- **Yerel çalıştırma:** `python dev/serve.py 8047` (no-store; `python -m http.server` eski modülleri önbellekten verebiliyor). Beynim vault'undaki
  `.claude/launch.json` dosyasında `gokyuzu-veri-portali` adıyla kayıtlı.
- **Dış servisler:**
  - SIMBAD TAP: `simbad.cds.unistra.fr/simbad/sim-tap/sync`, CORS açık
  - Wikidata SPARQL: `query.wikidata.org/sparql`. Node'un varsayılan User-Agent'ı 403 alıyor,
    tarayıcıda çalışıyor.
- **Testler:**
  - `npm test`: `dev/check-all.mjs`, bütün `dev/check-*.mjs` betiklerini çalıştırır.
  - `npm run smoke`: `dev/smoke.mjs`, Playwright + Chromium. CI'da `--no-save` ile kurulur.
  - CI: `.github/workflows/check.yml`.
- **VizieR katalogları:** `B/psr` (pulsar), `B/orb6` (çift yıldız yörüngeleri), `B/vsx` (değişen
  yıldızlar). Hepsi ASU TSV ile alınır.
- **Yazı tipleri:** Jost ve IBM Plex Mono, kendi sunucumuzdan (`css/fonts.css`, `assets/fonts/`, OFL 1.1; Fontsource 5.3.0, latin + latin-ext). Google Fonts kullanılmaz.
