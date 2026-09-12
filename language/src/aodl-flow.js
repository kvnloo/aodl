import craid from '../../examples/valid/craid.json';
import pipeline from '../../examples/valid/pipeline.json';
import fanout from '../../examples/valid/fanout-fanin.json';
import o8list from '../../examples/valid/o8-mission-list.json';

/** Visual channels for a HOTL kind. Never infers swarm from shape. */
export const KIND_VISUAL = {
  task: {
    providerId: 'cursor',
    modelId: 'cursor',
    effortId: 'standard',
    topologyId: 'solo',
    operatingModeId: 'copilot',
  },
  executor: {
    providerId: 'openai',
    modelId: 'codex',
    effortId: 'high',
    topologyId: 'pipeline',
    operatingModeId: 'overnight',
  },
  model: {
    providerId: 'openai',
    modelId: 'codex-sol',
    effortId: 'max',
    topologyId: 'solo',
    operatingModeId: 'overnight',
  },
  tool: {
    providerId: 'xai',
    modelId: 'grok-lite',
    effortId: 'min',
    topologyId: 'solo',
    operatingModeId: 'copilot',
  },
  service: {
    providerId: 'xai',
    modelId: 'grok',
    effortId: 'standard',
    topologyId: 'star',
    operatingModeId: 'batch',
  },
  verifier: {
    providerId: 'anthropic',
    modelId: 'claude-haiku',
    effortId: 'high',
    topologyId: 'paired',
    operatingModeId: 'overnight',
  },
  humanGate: {
    providerId: 'fable',
    modelId: 'fable',
    effortId: 'standard',
    topologyId: 'supervisor',
    operatingModeId: 'copilot',
  },
  memory: {
    providerId: 'moonshot',
    modelId: 'kimi',
    effortId: 'min',
    topologyId: 'blackboard',
    operatingModeId: 'continuous',
  },
  stateStore: {
    providerId: 'moonshot',
    modelId: 'kimi',
    effortId: 'standard',
    topologyId: 'blackboard',
    operatingModeId: 'continuous',
  },
  environment: {
    providerId: 'cursor',
    modelId: 'cursor',
    effortId: 'min',
    topologyId: 'solo',
    operatingModeId: 'batch',
  },
  artifact: {
    providerId: 'anthropic',
    modelId: 'claude-haiku',
    effortId: 'min',
    topologyId: 'blackboard',
    operatingModeId: 'batch',
  },
};

const UNKNOWN_VISUAL = {
  providerId: 'unknown',
  modelId: 'unknown',
  effortId: 'unknown',
  topologyId: 'unknown',
  operatingModeId: 'unknown',
};

const CONSTRAIN = new Set(['dependency', 'verification', 'data', 'control', 'message', 'allocation']);

export const NODE_KINDS = Object.keys(KIND_VISUAL);
export const LIFECYCLES = ['declared', 'ready', 'running', 'succeeded', 'failed', 'cancelled'];
export const HARNESS_IDS = ['hermes', 'omp', 'grok', 'codex', 'claude', 'pi', 'fx'];

export function visualForKind(kind) {
  return KIND_VISUAL[kind] || UNKNOWN_VISUAL;
}

export const PROGRAMS = [
  {
    id: 'craid',
    label: 'C(RAID)',
    doc: craid,
    core: {
      id: 'craid',
      name: 'C(RAID)',
      rank: 'named',
      providerId: 'multi',
      modelId: 'multi',
      effortId: 'max',
      topologyId: 'cluster',
      operatingModeId: 'continuous',
    },
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    doc: pipeline,
    core: {
      id: 'pipeline',
      name: 'Pipeline',
      rank: 'seq',
      providerId: 'openai',
      modelId: 'codex',
      effortId: 'standard',
      topologyId: 'pipeline',
      operatingModeId: 'copilot',
    },
  },
  {
    id: 'fanout',
    label: 'Fan-out',
    doc: fanout,
    core: {
      id: 'fanout',
      name: 'Fan-out',
      rank: 'π',
      providerId: 'cursor',
      modelId: 'cursor',
      effortId: 'high',
      topologyId: 'parallel',
      operatingModeId: 'overnight',
    },
  },
  {
    id: 'o8list',
    label: 'o8 list',
    doc: o8list,
    core: {
      id: 'o8list',
      name: 'o8 list',
      rank: 'list',
      providerId: 'multi',
      modelId: 'multi',
      effortId: 'standard',
      topologyId: 'cluster',
      operatingModeId: 'overnight',
    },
  },
];

export function layoutPositions(nodes, edges) {
  const ids = nodes.map((n) => n.id);
  const incoming = Object.fromEntries(ids.map((id) => [id, 0]));
  const adj = Object.fromEntries(ids.map((id) => [id, []]));
  for (const e of edges) {
    if (!CONSTRAIN.has(e.relation)) continue;
    if (!adj[e.from] || incoming[e.to] === undefined) continue;
    adj[e.from].push(e.to);
    incoming[e.to] += 1;
  }
  const layer = Object.fromEntries(ids.map((id) => [id, 0]));
  const q = ids.filter((id) => incoming[id] === 0);
  const seen = new Set();
  while (q.length) {
    const id = q.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    for (const t of adj[id]) {
      layer[t] = Math.max(layer[t], layer[id] + 1);
      incoming[t] -= 1;
      if (incoming[t] === 0) q.push(t);
    }
  }
  const byLayer = {};
  for (const id of ids) {
    const L = layer[id] || 0;
    (byLayer[L] ||= []).push(id);
  }
  const pos = {};
  for (const [L, row] of Object.entries(byLayer)) {
    row.forEach((id, i) => {
      const spread = (i - (row.length - 1) / 2) * 168;
      pos[id] = { x: Number(L) * 230 + 24, y: 40 + spread + 180 };
    });
  }
  return pos;
}

export function documentToFlow(doc) {
  const graph = doc.intentGraph || { nodes: [], edges: [] };
  const pos = layoutPositions(graph.nodes, graph.edges);
  const kinds = doc.policies?.kinds || [];
  return {
    graphId: doc.graphId,
    kinds,
    protocol: doc.policies?.protocol || '',
    events: Array.isArray(doc.eventLog) ? doc.eventLog.length : 0,
    nodes: graph.nodes.map((n) => ({
      id: n.id,
      type: 'aodlCore',
      position: pos[n.id] || { x: 0, y: 0 },
      draggable: false,
      style: { width: 72, height: 72 },
      data: {
        hotl: n,
        visual: visualForKind(n.kind),
        expanded: false,
      },
    })),
    edges: graph.edges.map((e) => ({
      id: e.id,
      source: e.from,
      target: e.to,
      type: 'aodlEdge',
      selectable: false,
      data: { relation: e.relation },
    })),
  };
}
