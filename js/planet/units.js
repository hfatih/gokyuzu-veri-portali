// Wikidata nicelik değerlerini tek birime çevirir ve birden çok ifadeden birini seçer.
// Hedef birimler: kütle M⊕, yarıçap R⊕, dönem gün, yarı büyük eksen AU, sıcaklık K.

const EARTH_MASS_KG = 5.9722e24, EARTH_RADIUS_KM = 6371.0, AU_KM = 1.495978707e8;

// Birim öğesi (Q kimliği) → hedef birime çarpan; sıcaklık ayrı ele alınır
const FACTORS = {
  mass: { Q11570: 1 / EARTH_MASS_KG, Q613726: 1e21 / EARTH_MASS_KG, Q681996: 1, Q651336: 317.83, Q180892: 332946 },
  radius: { Q828224: 1 / EARTH_RADIUS_KM, Q11573: 1e-3 / EARTH_RADIUS_KM, Q1155470: 1, Q3421309: 11.209, Q48440: 109.2 },
  period: { Q573: 1, Q577: 365.25, Q1092296: 365.25, Q25235: 1 / 24, Q11574: 1 / 86400 },
  sma: { Q1811: 1, Q828224: 1 / AU_KM, Q11573: 1e-3 / AU_KM },
  rot: { Q573: 1, Q25235: 1 / 24, Q11574: 1 / 86400, Q7727: 1 / 1440 },
  unitless: { Q199: 1 },
};

function convert(kind, amount, unit) {
  if (kind === 'temp') {
    if (unit === 'Q11579') return amount;
    if (unit === 'Q25267') return amount + 273.15;
    if (unit === 'Q42289') return (amount - 32) * 5 / 9 + 273.15;
    return null;
  }
  const f = FACTORS[kind]?.[unit];
  return f == null ? null : amount * f;
}

/**
 * statements: [{ amount, unit (Q kimliği), rank }]. Deprecated ifadeler atlanır; Preferred varsa
 * yalnız onlar kullanılır; çevrilebilen değerlerin ortancası döner, hiçbiri yoksa null.
 */
export function pickValue(statements, kind) {
  const live = statements.filter((s) => s.rank !== 'DeprecatedRank');
  const pref = live.filter((s) => s.rank === 'PreferredRank');
  const vals = (pref.length ? pref : live)
    .map((s) => convert(kind, Number(s.amount), s.unit))
    .filter((v) => v != null && Number.isFinite(v))
    .sort((a, b) => a - b);
  if (!vals.length) return null;
  const m = vals.length >> 1;
  return vals.length % 2 ? vals[m] : (vals[m - 1] + vals[m]) / 2;
}
