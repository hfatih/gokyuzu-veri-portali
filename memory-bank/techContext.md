# Teknik bağlam

- Saf HTML/CSS/JS (ES modülleri), WebGL 2 / GLSL ES 3.00. Bağımlılık ve derleme adımı yok.
- **Yerel çalıştırma:** `python dev/serve.py 8047` (no-store; `python -m http.server` eski modülleri önbellekten verebiliyor). Beynim vault'undaki
  `.claude/launch.json` dosyasında `gokyuzu-veri-portali` adıyla kayıtlı.
- **Dış servisler:**
  - SIMBAD TAP: `simbad.cds.unistra.fr/simbad/sim-tap/sync`, CORS açık
  - Wikidata SPARQL: `query.wikidata.org/sparql`. Node'un varsayılan User-Agent'ı 403 alıyor,
    tarayıcıda çalışıyor.
- **Testler:** `node dev/check-derive.mjs`, `node dev/check-search.mjs` (`package.json` → `type: module`).
- **Yazı tipleri:** Jost ve IBM Plex Mono (Google Fonts), FatihHanAstronom ile aynı aile.
