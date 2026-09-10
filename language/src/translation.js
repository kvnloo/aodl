import irMap from '../../encodings/ir-map.json';

export const CLOSED = null;

export const CHANNEL_ORDER = [
  'provider',
  'model',
  'effort',
  'topology',
  'operatingMode',
  'state',
  'economics',
];

export function tauTopology(id) {
  const rec = irMap.topologies[id];
  if (!rec || rec.status !== 'expressible') return CLOSED;
  return rec.policies || null;
}

export function fromHotl(kind) {
  if (!Object.prototype.hasOwnProperty.call(irMap.fromHotl, kind)) return CLOSED;
  return irMap.fromHotl[kind];
}

export function compileLabel(compile) {
  if (compile === 'ir-map') return 'τ';
  if (compile === 'declared-only') return 'declared';
  return '⊥';
}
