// Wikidata nicelik değerlerini tek birime çevirir ve birden çok ifadeden birini seçer.
// Hedef birimler: kütle M⊕, yarıçap R⊕, dönem gün, yarı büyük eksen AU, sıcaklık K;
// kara delikte kütle M☉, uzaklık ışık yılı, koordinat derece.

const EARTH_MASS_KG = 5.9722e24, EARTH_RADIUS_KM = 6371.0, AU_KM = 1.495978707e8;

// Birim öğesi (Q kimliği) → hedef birime çarpan; sıcaklık ayrı ele alınır
const FACTORS = {
  mass: { Q11570: 1 / EARTH_MASS_KG, Q613726: 1e21 / EARTH_MASS_KG, Q681996: 1, Q651336: 317.83, Q180892: 332946 },
  radius: { Q828224: 1 / EARTH_RADIUS_KM, Q11573: 1e-3 / EARTH_RADIUS_KM, Q1155470: 1, Q3421309: 11.209, Q48440: 109.2 },
  period: { Q573: 1, Q577: 365.25, Q1092296: 365.25, Q25235: 1 / 24, Q11574: 1 / 86400 },
  sma: { Q1811: 1, Q828224: 1 / AU_KM, Q11573: 1e-3 / AU_KM },
  rot: { Q573: 1, Q25235: 1 / 24, Q11574: 1 / 86400, Q7727: 1 / 1440 },
  unitless: { Q199: 1 },
  // Kara delik (faz 5): kütle M☉, uzaklık ışık yılı
  massSun: { Q180892: 1, Q11570: 1 / 1.989e30, Q613726: 1e21 / 1.989e30 },
  distLy: { Q531: 1, Q12129: 3.26156, Q11929860: 3261.56, Q3773454: 3.26156e6, Q828224: 1 / 9.4607e12, Q1811: 1 / 63241.1 },
  deg: { Q28390: 1 },
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

const median = (xs) => {
  const v = [...xs].sort((a, b) => a - b), m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

/**
 * statements: [{ amount, unit (Q kimliği), rank }]. Deprecated ifadeler atlanır; Preferred varsa
 * yalnız onlar kullanılır; çevrilebilen değerlerin ortancası döner, hiçbiri yoksa null.
 * Wikidata'da tercih edilen değer bazen yanlış birimle girilmiş oluyor (HD 209458 b yarıçapı):
 * tercih edilen, en az iki normal ifadenin ortancasından 3 kattan fazla saparsa tüm değerlerin
 * ortancası kullanılır.
 */
export function pickValue(statements, kind) {
  const conv = (list) => list.map((s) => convert(kind, Number(s.amount), s.unit)).filter((v) => v != null && Number.isFinite(v));
  const live = statements.filter((s) => s.rank !== 'DeprecatedRank');
  const pref = conv(live.filter((s) => s.rank === 'PreferredRank'));
  const normal = conv(live.filter((s) => s.rank !== 'PreferredRank'));
  if (pref.length) {
    const p = median(pref);
    if (normal.length >= 2) {
      const n = median(normal), ratio = Math.abs(p / n);
      if (n !== 0 && (ratio > 3 || ratio < 1 / 3)) return median([...pref, ...normal]);
    }
    return p;
  }
  return normal.length ? median(normal) : null;
}
