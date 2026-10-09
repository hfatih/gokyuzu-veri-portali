// Pulsarın zamanlama verisi ATNF kataloğundan (VizieR B/psr). TAPVizieR https'te CORS başlığını
// iki kez gönderdiği için tarayıcı reddediyor; ASU (TSV) servisi tek başlıkla yanıt veriyor.
// SIMBAD konumunun 10″ çevresi alınır; "PSR J…" / "PSR B…" kimliğiyle eşleşen kayıt, yoksa en yakını.
// ponytail: VizieR kopyası 2015 sürümü (2536 pulsar); güncel ATNF'nin CORS'u yok.

const ASU = 'https://vizier.cds.unistra.fr/viz-bin/asu-tsv';
const COLS = 'PSRJ,Name,P0,P1,DM,Dist,Plx,PMTot,W50,PB,Ecc,minM,NGlt,Type,BINCOMP,Assoc';

/** ASU TSV: # yorumlar, başlık, birim ve çizgi satırları, sonra veri. Sayılar Number, boşlar null. */
export function parseTsv(text) {
  const lines = text.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
  if (lines.length < 4) return [];
  const head = lines[0].split('\t').map((h) => h.trim());
  return lines.slice(3).map((l) => Object.fromEntries(l.split('\t').map((v, i) => {
    const s = v.trim();
    return [head[i], s === '' ? null : /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s) ? Number(s) : s];
  })));
}

/** obj: fetchObject() çıktısı. Dönüş: ATNF satırı ya da katalogda yoksa null. */
export async function fetchPulsar(obj, signal) {
  const { ra, dec } = obj.basic;
  if (ra == null) return null;
  const q = new URLSearchParams({ '-source': 'B/psr/psr', '-out': COLS, '-c': `${ra} ${dec}`, '-c.rs': '10', '-sort': '_r', '-out.max': '50' });
  const timeout = AbortSignal.timeout(8000);
  const res = await fetch(`${ASU}?${q}`, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!res.ok) throw new Error(`VizieR ${res.status}`);
  const rows = parseTsv(await res.text());
  const names = new Set(obj.ids.filter((i) => /^PSR [JB]\d/.test(i)).map((i) => i.slice(4)));
  return rows.find((r) => names.has(r.PSRJ) || names.has(r.Name)) ?? rows[0] ?? null;
}
