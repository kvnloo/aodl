import craid from '../../examples/valid/craid.json';
import pipeline from '../../examples/valid/pipeline.json';
import fanout from '../../examples/valid/fanout-fanin.json';
import market from '../../examples/valid/market.json';

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
  tool: {
    providerId: 'xai',
    modelId: 'grok-lite',
    effortId: 'min',
    topologyId: 'solo',
    operatingModeId: 'copilot',
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
};

const UNKNOWN_VISUAL = {
  providerId: 'unknown',
  modelId: 'unknown',
  effortId: 'unknown',
  topologyId: 'unknown',
  operatingModeId: 'unknown',
};

const CONSTRAIN = new Set(['dependency', 'verification', 'data', 'control', 'message']);

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
    id: 'market',
    label: 'Market',
    doc: market,
    core: {
      id: 'market',
      name: 'Market',
      rank: 'Π',
      providerId: 'anthropic',
      modelId: 'claude-haiku',
      effortId: 'standard',
      topologyId: 'marketplace',
      operatingModeId: 'tournament',
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
      pos[id] = { x: Number(L) * 230 + 24, y: 40 + spread + 220 };
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
    nodes: graph.nodes.map((n) => ({
      id: n.id,
      type: 'aodlCore',
      position: pos[n.id] || { x: 0, y: 0 },
      draggable: false,
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

export function beatmapFromFlow(flow) {
  const nodes = flow.nodes.map((n) => n.data.hotl);
  const edges = flow.edges.map((e) => ({
    id: e.id,
    relation: e.data.relation,
    from: e.source,
    to: e.target,
  }));
  const ids = nodes.map((n) => n.id);
  const remaining = Object.fromEntries(ids.map((id) => [id, 0]));
  const out = Object.fromEntries(ids.map((id) => [id, []]));
  for (const e of edges) {
    if (!CONSTRAIN.has(e.relation)) continue;
    remaining[e.to] += 1;
    out[e.from].push(e);
  }
  const hits = [];
  const q = ids.filter((id) => remaining[id] === 0);
  const done = new Set();
  while (q.length) {
    const id = q.shift();
    if (done.has(id)) continue;
    done.add(id);
    const node = nodes.find((n) => n.id === id);
    hits.push({
      type: node.kind === 'humanGate' ? 'spinner' : 'circle',
      id: `hit-${id}`,
      nodeId: id,
      kind: node.kind,
    });
    for (const e of out[id]) {
      hits.push({
        type: 'slider',
        id: `hit-${e.id}`,
        edgeId: e.id,
        relation: e.relation,
        from: e.from,
        to: e.to,
        illegal: false,
      });
      remaining[e.to] -= 1;
      if (remaining[e.to] === 0) q.push(e.to);
    }
  }
  for (const e of edges) {
    if (e.relation !== 'observation') continue;
    hits.push({
      type: 'slider',
      id: `hit-${e.id}`,
      edgeId: e.id,
      relation: 'observation',
      from: e.from,
      to: e.to,
      illegal: false,
      ghost: true,
    });
  }
  return hits;
}
