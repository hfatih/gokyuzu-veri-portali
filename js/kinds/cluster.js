import { clusterKind, deriveCluster } from '../cluster/derive.js';
import { fetchMembers } from '../cluster/fetch.js';
import { clusterVisualParams } from '../cluster/visual.js';
import { renderClusterCard } from '../ui/cluster-card.js';
import { buildLinks } from '../star/links.js';
import { wikipediaFor } from '../search/wikidata.js';
import { clusterScene } from '../render/cluster.js';
import { simbadForms } from './star.js';

export const clusterKindDef = {
  id: 'cluster',
  byObj: (obj) => !!clusterKind(obj.basic.otype),
  async load(ctx) {
    const { obj, signal } = ctx, b = obj.basic;
    let failed = false;
    const members = await fetchMembers(b.oid, signal).catch((e) => { if (signal.aborted) throw e; failed = true; return []; });
    const cd = deriveCluster({ kind: clusterKind(b.otype), majArcmin: b.dimMaj, distances: obj.distances, members, center: b });
    ctx.kind(members.length ? 'cluster' : 'other');
    renderClusterCard(ctx.card, ctx.sel, obj, cd, buildLinks(obj));
    if (failed) ctx.partial();
    if (members.length) ctx.show(clusterScene, clusterVisualParams(cd, members, b, obj.mainId), 1.1, '#fff3dc', 0.3);
    ctx.corner(members.length > 0);
    ctx.wiki(wikipediaFor(simbadForms(obj.mainId), signal), (wiki) => buildLinks(obj, wiki));
    ctx.describe({ derived: cd, members });
  },
};
