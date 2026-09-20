import visual from '../../encodings/visual.json';
import irMap from '../../encodings/ir-map.json';

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

export const NODE_KINDS = Object.keys(KIND_VISUAL);
export const LIFECYCLES = ['declared', 'ready', 'running', 'succeeded', 'failed', 'cancelled'];
export const HARNESS_IDS = ['hermes', 'omp', 'grok', 'codex', 'claude', 'pi', 'fx'];
export const VIEW_W = 72;
export const VIEW_H = 44;
export const MULTI_PROVIDER_NODE_IDS = ['openai', 'anthropic', 'moonshot', 'xai', 'cursor', 'fable'];

const LEGAL_REL = new Set([
  'dependency',
  'verification',
  'data',
  'control',
  'message',
  'allocation',
  'delegation',
  'observation',
]);

export function visualForKind(kind) {
  return KIND_VISUAL[kind] || UNKNOWN_VISUAL;
}

export function hueForVisual(channels, fallback) {
  return visual.providers[channels?.providerId]?.hue || fallback || visual.providers.unknown.hue;
}

/** Same drawings as the Silhouettes SVG. Coordinates are viewBox 72×44. */
export const TOPOLOGY_GRAPHS = {
  solo: { nodes: [[36, 22, 7]], edges: [] },
  paired: { nodes: [[21, 22, 4.8], [51, 22, 4.8]], edges: [[0, 1]] },
  council: {
    nodes: [[36, 22, 6], [36, 6, 3.3], [53, 22, 3.3], [36, 38, 3.3], [19, 22, 3.3]],
    edges: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 3], [3, 4], [4, 1]],
    envelope: 'council',
  },
  hierarchy: {
    nodes: [[36, 5, 3.8], [23, 19, 3.3], [49, 19, 3.3], [14, 36, 3], [29, 36, 3], [43, 36, 3], [58, 36, 3]],
    edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]],
  },
  mesh: {
    nodes: [[36, 5, 3.2], [54, 13, 3.2], [54, 32, 3.2], [36, 39, 3.2], [18, 32, 3.2], [18, 13, 3.2]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 2], [0, 3], [1, 3], [1, 4], [2, 4], [2, 5], [3, 5]],
  },
  ring: {
    nodes: [[36, 5, 3.2], [51, 11, 3.2], [57, 26, 3.2], [46, 38, 3.2], [26, 38, 3.2], [15, 26, 3.2], [21, 11, 3.2]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]],
    directed: true,
  },
  star: {
    nodes: [[36, 22, 5.5], [36, 5, 3], [54, 12, 3], [56, 31, 3], [36, 39, 3], [16, 31, 3], [18, 12, 3]],
    edges: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]],
  },
  swarm: {
    nodes: [[10, 15, 3], [24, 7, 3], [40, 11, 3], [59, 7, 3], [64, 24, 3], [49, 36, 3], [30, 31, 3], [13, 38, 3]],
    edges: [[0, 1], [0, 6], [1, 2], [1, 6], [2, 3], [2, 4], [2, 6], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]],
    soft: true,
  },
  cluster: {
    nodes: [[16, 10, 2.8], [9, 21, 2.8], [23, 21, 2.8], [50, 9, 2.8], [43, 20, 2.8], [57, 20, 2.8], [34, 29, 2.8], [27, 39, 2.8], [41, 39, 2.8]],
    edges: [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [6, 7], [7, 8], [8, 6], [2, 6], [4, 6]],
    envelope: 'cluster',
  },
  parallel: {
    nodes: [[12, 22, 4], [52, 7, 3.2], [60, 22, 3.2], [52, 37, 3.2]],
    edges: [[0, 1], [0, 2], [0, 3]],
    directed: true,
  },
  pipeline: {
    nodes: [[9, 22, 3.5], [22, 22, 3.5], [36, 22, 3.5], [50, 22, 3.5], [63, 22, 3.5]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
    directed: true,
  },
  supervisor: {
    nodes: [[36, 22, 6], [36, 5, 3.2], [53, 16, 3.2], [47, 36, 3.2], [25, 36, 3.2], [19, 16, 3.2]],
    edges: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [2, 3], [3, 4], [4, 5], [5, 1]],
    envelope: 'supervisor',
  },
  blackboard: {
    nodes: [[36, 5, 3], [55, 12, 3], [57, 33, 3], [36, 39, 3], [15, 33, 3], [17, 12, 3]],
    edges: [[0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6]],
    center: 'blackboard',
  },
  marketplace: {
    nodes: [[36, 5, 3], [55, 12, 3], [57, 33, 3], [36, 39, 3], [15, 33, 3], [17, 12, 3]],
    edges: [[0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6]],
    center: 'marketplace',
    envelope: 'marketplace',
  },
  hybrid: {
    nodes: [[11, 12, 3.2], [21, 6, 3], [21, 19, 3], [34, 22, 3.4], [49, 8, 3], [60, 22, 3], [49, 36, 3]],
    edges: [[0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 4], [3, 6]],
    soft: true,
  },
  unknown: { nodes: [], edges: [], center: 'unknown' },
};

export function drawingNodes(graph) {
  const nodes = graph.nodes.map((triple) => [...triple]);
  if (graph.center && graph.center !== 'unknown') {
    nodes.push([36, 22, 5]);
  }
  return nodes;
}

export function nodeHue(providerId, index) {
  if (providerId !== 'multi') {
    return visual.providers[providerId]?.hue || visual.providers.unknown.hue;
  }
  const mixed = visual.providers[MULTI_PROVIDER_NODE_IDS[index % MULTI_PROVIDER_NODE_IDS.length]];
  return mixed?.hue || visual.providers.multi.hue;
}

function kindForDrawingNode(topologyId, index, centerKind) {
  if (centerKind) return centerKind;
  const listed = irMap.topologies[topologyId]?.typicalNodes || [];
  if (listed.length) return listed[index % listed.length];
  return 'task';
}

function relationForDrawingEdge(topologyId, index) {
  const listed = (irMap.topologies[topologyId]?.typicalEdges || []).filter((rel) => LEGAL_REL.has(rel));
  if (listed.length) return listed[index % listed.length];
  return 'dependency';
}

function portsFor(id) {
  return [
    { id: `${id}-in`, direction: 'in', schema: '' },
    { id: `${id}-out`, direction: 'out', schema: '' },
  ];
}

export function silhouetteToFlow(topologyId, providerId = 'multi') {
  const topology = visual.topologies[topologyId] || visual.topologies.unknown;
  const graph = TOPOLOGY_GRAPHS[topology.pattern] || TOPOLOGY_GRAPHS.unknown;
  const nodes = drawingNodes(graph);
  const centerIndex = graph.center && graph.center !== 'unknown' ? nodes.length - 1 : -1;
  const centerKind = graph.center === 'blackboard' ? 'memory' : graph.center === 'marketplace' ? 'task' : null;

  return {
    topologyId,
    providerId,
    graph,
    nodes: nodes.map(([x, y, radius], index) => {
      const kind = kindForDrawingNode(topologyId, index, index === centerIndex ? centerKind : null);
      const id = `n${index}`;
      return {
        id,
        type: 'aodlCore',
        position: { x: x - radius, y: y - radius },
        draggable: false,
        zIndex: 1,
        data: {
          hotl: {
            id,
            kind,
            ports: portsFor(id),
            lifecycle: 'declared',
            capabilities: [],
          },
          visual: visualForKind(kind),
          expanded: false,
          hue: nodeHue(providerId, index),
          radius,
          left: x - radius,
          top: y - radius,
          mode: 'silhouette',
        },
      };
    }),
    edges: graph.edges.map(([from, to], index) => ({
      id: `e${index}`,
      source: `n${from}`,
      target: `n${to}`,
      type: 'aodlEdge',
      selectable: false,
      data: {
        relation: relationForDrawingEdge(topologyId, index),
        soft: Boolean(graph.soft),
        directed: Boolean(graph.directed),
      },
    })),
  };
}

/** Declared visual channels for a topology unit. Mode stays unknown; it is not IR. */
export function topologyUnit(topologyId, providerId = 'multi') {
  const topology = visual.topologies[topologyId] || visual.topologies.unknown;
  return {
    id: topologyId,
    name: topology.label,
    providerId,
    modelId: providerId === 'multi' ? 'multi' : 'unknown',
    effortId: 'standard',
    topologyId,
    operatingModeId: 'unknown',
  };
}

