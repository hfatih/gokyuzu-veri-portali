// Dış veritabanı ve gözlem arşivlerine yönlendirme bağlantıları. Hepsi cismin adıyla arama
// yapan genel adreslerdir; kimlik gerektirenler (Gaia, ötegezegen) yalnız uygunsa eklenir.

const enc = encodeURIComponent;

/**
 * obj: fetchObject() çıktısı, wiki: { tr?, en? } Wikipedia adresleri.
 * Dönüş: [{ key, name, desc, url }]; desc i18n anahtarıdır.
 */
export function buildLinks(obj, wiki = {}) {
  const id = obj.mainId.replace(/\s+/g, ' ');
  const hip = obj.ids.find((i) => /^HIP\s/.test(i));
  const hasCoord = obj.basic.ra != null;
  const target = hasCoord ? `${obj.basic.ra} ${obj.basic.dec}` : id;
  const links = [];
  const add = (key, name, url) => links.push({ key, name, desc: `link.${key}`, url });

  if (obj.mainId !== 'Sun') add('simbad', 'SIMBAD', `https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${enc(obj.mainId)}`);
  add('ads', 'NASA ADS', `https://ui.adsabs.harvard.edu/search/q=${enc(`object:"${obj.mainId === 'Sun' ? 'Sun' : id}"`)}&sort=citation_count%20desc`);
  if (hasCoord) {
    add('vizier', 'VizieR', `https://vizier.cds.unistra.fr/viz-bin/VizieR-4?-c=${enc(target)}&-c.rs=10`);
    add('aladin', 'Aladin Lite', `https://aladin.cds.unistra.fr/AladinLite/?target=${enc(target)}&fov=0.5`);
    add('esasky', 'ESASky', `https://sky.esa.int/esasky/?target=${enc(target)}&fov=0.5`);
    if (obj.basic.otype?.includes('*')) add('gaia', 'Gaia DR3 (VizieR)', `https://vizier.cds.unistra.fr/viz-bin/VizieR-4?-source=I/355/gaiadr3&-c=${enc(target)}&-c.rs=5`);
  }
  if (obj.planets.length && obj.mainId !== 'Sun') add('exoplanet', 'NASA Exoplanet Archive', `https://exoplanetarchive.ipac.caltech.edu/overview/${enc(id)}`);
  if (hip) add('stellarium', 'Stellarium Web', `https://stellarium-web.org/skysource/${enc(hip.replace(/\s+/g, ' '))}`);
  if (wiki.tr) add('wikitr', 'Wikipedia (TR)', wiki.tr);
  if (wiki.en) add('wikien', 'Wikipedia (EN)', wiki.en);
  return links;
}
