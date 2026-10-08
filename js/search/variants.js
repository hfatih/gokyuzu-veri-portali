// Kullanıcı girdisini SIMBAD ident.id biçimlerine çevirir. SIMBAD LIKE büyük/küçük harfe ve
// boşluğa duyarlıdır, katalog numaralarını sabit genişliğe dolgular ("M  31", "HD  39801").
// Yanlış desen sunucuda dakikalarca sürebildiği için yalnız bilinen biçimler üretilir.

const GREEK = {
  alpha: 'alf', alfa: 'alf', beta: 'bet', gamma: 'gam', delta: 'del', epsilon: 'eps', zeta: 'zet',
  eta: 'eta', theta: 'tet', teta: 'tet', iota: 'iot', kappa: 'kap', lambda: 'lam', mu: 'mu.',
  nu: 'nu.', xi: 'ksi', omicron: 'omi', pi: 'pi.', rho: 'rho', sigma: 'sig', tau: 'tau',
  upsilon: 'ups', phi: 'phi', chi: 'chi', psi: 'psi', omega: 'ome',
};
const GREEK_ABBR = new Set(Object.values(GREEK));

// IAU takımyıldız kısaltmaları; SIMBAD iç büyük harfleri korur ("* alf CMa")
const CONSTELLATIONS = new Map(('And Ant Aps Aqr Aql Ara Ari Aur Boo Cae Cam Cnc CVn CMa CMi Cap Car Cas Cen Cep '
  + 'Cet Cha Cir Col Com CrA CrB Crv Crt Cru Cyg Del Dor Dra Equ Eri For Gem Gru Her Hor Hya Hyi Ind Lac '
  + 'Leo LMi Lep Lib Lup Lyn Lyr Men Mic Mon Mus Nor Oct Oph Ori Pav Peg Per Phe Pic Psc PsA Pup Pyx Ret '
  + 'Sge Sgr Sco Scl Sct Ser Sex Tau Tel Tri TrA Tuc UMa UMi Vel Vir Vol Vul').split(' ').map((c) => [c.toLowerCase(), c]));

// Katalog adı → numara alanının genişliği (SIMBAD'daki görünüşten)
const CATALOG_WIDTH = { M: 3, NGC: 5, IC: 4, HD: 6, HIP: 6, HR: 4, GJ: 4 };

const titleCase = (s) => s.replace(/(^|[\s-])(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase('en'));

const GLYPH = {
  alf: 'α', bet: 'β', gam: 'γ', del: 'δ', eps: 'ε', zet: 'ζ', eta: 'η', tet: 'θ', iot: 'ι', kap: 'κ',
  lam: 'λ', 'mu.': 'μ', 'nu.': 'ν', ksi: 'ξ', omi: 'ο', 'pi.': 'π', rho: 'ρ', sig: 'σ', tau: 'τ',
  ups: 'υ', phi: 'φ', chi: 'χ', psi: 'ψ', ome: 'ω',
};

/** SIMBAD kimliğini okunur yapar: "NAME Vega" → "Vega", "* alf CMa" → "α CMa", "M  31" → "M 31". */
export function prettyId(id) {
  return id.replace(/^(NAME|\*|V\*|\*\*)\s+/, '').replace(/\s+/g, ' ')
    .replace(/^(alf|bet|gam|del|eps|zet|eta|tet|iot|kap|lam|mu\.|nu\.|ksi|omi|pi\.|rho|sig|tau|ups|phi|chi|psi|ome)(\d*)\s/, (_, g, n) => GLYPH[g] + n + ' ');
}

/** SQL dizgesi için kaçış: tek tırnak ikilenir, LIKE joker karakterleri atılır. */
export const sqlStr = (s) => s.replace(/[%_]/g, '').replace(/'/g, "''");

/**
 * Girdiden { like: [...önekler], exact: [...tam kimlikler] } üretir. Desenlere '%' eklenmez;
 * sorgu katmanı ekler. 2 karakterden kısa girdide boş döner.
 */
export function likeVariants(q) {
  const t = q.trim().replace(/\s+/g, ' ').replace(/[%_']/g, '');
  const out = { like: new Set(), exact: new Set() };
  if (t.length < 2) return { like: [], exact: [] };

  // Bayer adı: "alf ori", "alpha cma" (takımyıldız 3 harfli IAU kısaltması)
  const bayer = /^(\p{L}+)\.?\s+(\p{L}{3})$/u.exec(t);
  const con = bayer && CONSTELLATIONS.get(bayer[2].toLowerCase());
  if (con) {
    const g = GREEK[bayer[1].toLowerCase()] ?? (GREEK_ABBR.has(bayer[1].toLowerCase()) ? bayer[1].toLowerCase() : null);
    if (g) out.like.add(`* ${g} ${con}`);
  }

  if (/[^\x20-\x7E]/.test(t)) {
    // SIMBAD kimlikleri ASCII; Türkçe karakterli girdi Wikidata ve yerel listeye kalır
  } else if (/^[A-Za-z\s'-]+$/.test(t)) {
    // Yalnız harf: özel ad. Ham önekle aranmaz (katalog kodlarına takılır ve yavaştır).
    out.like.add('NAME ' + titleCase(t.toLowerCase()));
  } else {
    out.exact.add(t);
    const cat = /^([A-Za-z]+)\s*(\d+)$/.exec(t);
    const w = cat && CATALOG_WIDTH[cat[1].toUpperCase()];
    if (w) {
      const name = cat[1].toUpperCase(), num = cat[2];
      for (let len = num.length; len <= w; len++) out.like.add(`${name} ${' '.repeat(w - len)}${num}`);
    }
    const gaia = /^gaia\s*dr3\s*(\d+)$/i.exec(t);
    if (gaia) out.like.add(`Gaia DR3 ${gaia[1]}`);
  }
  return { like: [...out.like], exact: [...out.exact] };
}
