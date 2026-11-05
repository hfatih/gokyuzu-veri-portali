// Cisim türleri kaydı. Her tür { id, byId?(mainId), byObj?(obj), load(ctx) } biçimindedir:
// byId SIMBAD'a sormadan tanınan kimlikler (bh:, sso:, planet:), byObj SIMBAD kaydına göre seçim.
// Sıra önemlidir; ilk eşleşen kazanır, yıldız en sonda yedek türdür.
//
// ctx (main.js): { sel, obj, signal, card, show(scene, params, size, fallbackCss, pitch?),
//   corner(on), kind(k), setLabel(label), wiki(promise, build), choose(sel), partial(), describe(info) }

import { blackHoleKind } from './blackhole.js';
import { ssoKind } from './sso.js';
import { planetKind } from './planet.js';
import { nebulaKindDef } from './nebula.js';
import { galaxyKind } from './galaxy.js';
import { clusterKindDef } from './cluster.js';
import { pulsarKind } from './pulsar.js';
import { quasarKind } from './quasar.js';
import { starKind } from './star.js';

export const KINDS = [blackHoleKind, ssoKind, planetKind, nebulaKindDef, galaxyKind, clusterKindDef, pulsarKind, quasarKind, starKind];

/** SIMBAD'a sormadan tanınan tür (yoksa null). */
export const kindById = (mainId) => KINDS.find((k) => k.byId?.(mainId)) ?? null;

/** SIMBAD kaydına göre tür. */
export const kindByObj = (obj) => KINDS.find((k) => k.byObj?.(obj));
