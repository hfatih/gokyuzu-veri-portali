// Wikidata: Türkçe/İngilizce adla arama ve Wikipedia bağlantıları. Tek SPARQL sorgusu
// EntitySearch'ü SIMBAD kimliği (P3083) olan öğelerle süzer (~0,6 sn). wbgetentities ile
// süzmek 20 öğe için ~700 KB indiriyordu.

const SPARQL = 'https://query.wikidata.org/sparql';
const TIMEOUT_MS = 8000;

async function sparql(query, signal) {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const res = await fetch(`${SPARQL}?format=json&query=${encodeURIComponent(query)}`, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    headers: { Accept: 'application/sparql-results+json' },
  });
  if (!res.ok) throw new Error(`Wikidata ${res.status}`);
  return (await res.json()).results.bindings;
}

const lit = (s) => '"' + s.replace(/["\\]/g, '\\$&').replace(/\s+/g, ' ') + '"';

/** Ad araması. Dönüş: [{ label, simbadId, qid }], Wikidata'nın alaka sırasıyla. */
export async function searchWikidata(q, lang, signal) {
  const rows = await sparql(`SELECT ?item ?s ?label WHERE {
    SERVICE wikibase:mwapi { bd:serviceParam wikibase:api "EntitySearch"; wikibase:endpoint "www.wikidata.org";
      mwapi:search ${lit(q)}; mwapi:language "${lang}"; mwapi:limit "30".
      ?item wikibase:apiOutputItem mwapi:item. ?num wikibase:apiOrdinal true. }
    ?item wdt:P3083 ?s.
    OPTIONAL { ?item rdfs:label ?label FILTER(lang(?label) = "${lang}") }
  } ORDER BY ?num LIMIT 10`, signal);
  return rows.map((r) => ({
    label: r.label?.value, simbadId: r.s.value, qid: r.item.value.split('/').pop(),
  }));
}

/** SIMBAD kimliğinden Wikipedia TR/EN adresleri. Bulunamazsa {}. */
export async function wikipediaFor(simbadIds, signal) {
  const values = simbadIds.map(lit).join(' ');
  const rows = await sparql(`SELECT ?a WHERE { VALUES ?s { ${values} } ?item wdt:P3083 ?s.
    ?a schema:about ?item; schema:isPartOf ?w. VALUES ?w { <https://tr.wikipedia.org/> <https://en.wikipedia.org/> } }`, signal);
  const out = {};
  for (const r of rows) out[r.a.value.includes('//tr.') ? 'tr' : 'en'] ??= r.a.value;
  return out;
}
