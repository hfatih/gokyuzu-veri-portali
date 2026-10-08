// Gezegenler için yönlendirme bağlantıları. Wikipedia adresleri sonradan wiki ile eklenir.

const enc = encodeURIComponent;

/**
 * planet: fetchPlanet() çıktısı, obj: SIMBAD kaydı (ötegezegen) ya da null, wiki: { tr?, en? }.
 * Dönüş: [{ key, name, desc, url }]
 */
export function buildPlanetLinks(planet, obj, wiki = {}) {
  const links = [];
  const add = (key, name, url) => links.push({ key, name, desc: `link.${key}`, url });
  if (planet.solar) {
    const k = planet.solar.key;
    add('factsheet', 'NASA Planetary Fact Sheet', `https://nssdc.gsfc.nasa.gov/planetary/factsheet/${k}fact.html`);
    add('nasascience', 'NASA Science', `https://science.nasa.gov/${k}/`);
    add('ads', 'NASA ADS', `https://ui.adsabs.harvard.edu/search/q=${enc(`title:"${planet.solar.en}"`)}&sort=citation_count%20desc`);
  } else {
    const id = obj.mainId.replace(/\s+/g, ' ');
    add('simbad', 'SIMBAD', `https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${enc(obj.mainId)}`);
    add('ads', 'NASA ADS', `https://ui.adsabs.harvard.edu/search/q=${enc(`object:"${id}"`)}&sort=citation_count%20desc`);
    const host = planet.host?.obj.mainId.replace(/^NAME /, '').replace(/\s+/g, ' ');
    if (host) add('exoplanet', 'NASA Exoplanet Archive', `https://exoplanetarchive.ipac.caltech.edu/overview/${enc(host)}`);
  }
  if (planet.qid) add('wikidata', 'Wikidata', `https://www.wikidata.org/wiki/${planet.qid}`);
  if (wiki.tr) add('wikitr', 'Wikipedia (TR)', wiki.tr);
  if (wiki.en) add('wikien', 'Wikipedia (EN)', wiki.en);
  return links;
}
