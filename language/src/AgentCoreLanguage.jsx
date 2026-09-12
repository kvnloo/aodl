import React, { useId, useState } from 'react';
import agentEncodings from '../../encodings/visual.json';
import './agent-core-language.css';

const CAPABILITY_LEVELS = [
  {
    id: 'runner',
    rank: 'C1',
    name: 'Focused runner',
    summary: 'One specialist works live beside a human on a bounded task.',
    provider: 'Single provider',
    providerId: 'cursor',
    model: 'Specialist',
    modelId: 'cursor',
    effort: 'Standard',
    effortId: 'standard',
    topology: 'Paired',
    topologyId: 'paired',
    operatingMode: 'Copilot',
    operatingModeId: 'copilot',
  },
  {
    id: 'frontier',
    rank: 'C3',
    name: 'Frontier specialist',
    summary: 'One frontier model runs autonomously with an independent verification partner.',
    provider: 'Single provider',
    providerId: 'openai',
    model: 'Frontier',
    modelId: 'codex-sol',
    effort: 'Maximum',
    effortId: 'max',
    topology: 'Paired',
    topologyId: 'paired',
    operatingMode: 'Overnight',
    operatingModeId: 'overnight',
  },
  {
    id: 'council',
    rank: 'C5',
    name: 'Frontier council',
    summary: 'A multi-provider council iterates, weighs evidence, and synthesizes.',
    provider: 'Multi-provider',
    providerId: 'multi',
    model: 'Frontier ensemble',
    modelId: 'multi',
    effort: 'Maximum',
    effortId: 'max',
    topology: 'Swarm',
    topologyId: 'swarm',
    operatingMode: 'Tournament',
    operatingModeId: 'tournament',
  },
];

const CORE_STATES = [
  ['claimed', 'Claimed'],
  ['running', 'Running'],
  ['paused', 'Paused'],
  ['stale', 'Stale'],
  ['blocked', 'Blocked'],
];

const TOPOLOGY_GRAPHS = {
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

const MULTI_PROVIDER_NODE_IDS = ['openai', 'anthropic', 'moonshot', 'xai', 'cursor', 'fable'];

function TopologyBadge({ topologyId = 'unknown', providerId = 'unknown', size = 'compact', label }) {
  const markerId = useId().replace(/:/g, '');
  const topology = agentEncodings.topologies[topologyId] || agentEncodings.topologies.unknown;
  const graph = TOPOLOGY_GRAPHS[topology.pattern] || TOPOLOGY_GRAPHS.unknown;
  const provider = agentEncodings.providers[providerId] || agentEncodings.providers.unknown;
  const nodeColor = (index) => {
    if (providerId !== 'multi') return provider.hue;
    const mixed = agentEncodings.providers[MULTI_PROVIDER_NODE_IDS[index % MULTI_PROVIDER_NODE_IDS.length]];
    return mixed?.hue || agentEncodings.providers.multi.hue;
  };
  const nodeAt = (index) => graph.nodes[index] || [36, 22, 0];
  const accessibleLabel = label || `${topology.label} topology`;

  return (
    <svg
      className={`agent-topology-badge agent-topology-badge--${size}`}
      data-topology={topology.pattern}
      viewBox="0 0 72 44"
      role="img"
      aria-label={accessibleLabel}
      style={{ '--topology-edge': provider.hue }}
    >
      {graph.directed ? (
        <defs>
          <marker id={markerId} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path className="agent-topology-badge__arrow" d="M0 0 6 3 0 6Z" />
          </marker>
        </defs>
      ) : null}
      {graph.envelope === 'council' ? <circle className="agent-topology-badge__envelope" cx="36" cy="22" r="18" /> : null}
      {graph.envelope === 'supervisor' ? <circle className="agent-topology-badge__envelope is-alert" cx="36" cy="22" r="19" /> : null}
      {graph.envelope === 'marketplace' ? <circle className="agent-topology-badge__envelope is-dashed" cx="36" cy="22" r="18" /> : null}
      {graph.envelope === 'cluster' ? (
        <g className="agent-topology-badge__cluster-envelopes">
          <circle cx="16" cy="16" r="12" /><circle cx="50" cy="15" r="12" /><circle cx="34" cy="34" r="11" />
        </g>
      ) : null}
      <g className={`agent-topology-badge__edges${graph.soft ? ' is-soft' : ''}${graph.directed ? ' is-directed' : ''}`}>
        {graph.edges.map(([from, to], index) => {
          const [x1, y1] = nodeAt(from);
          const [x2, y2] = nodeAt(to);
          return <line key={`${from}-${to}-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} markerEnd={graph.directed ? `url(#${markerId})` : undefined} />;
        })}
      </g>
      {graph.center === 'blackboard' ? (
        <g className="agent-topology-badge__blackboard">
          <rect x="27" y="14" width="18" height="16" rx="2" />
          <path d="M31 19h10M31 22h10M31 25h7" />
        </g>
      ) : null}
      {graph.center === 'marketplace' ? <path className="agent-topology-badge__market" d="M36 14 44 22 36 30 28 22Z" /> : null}
      {graph.center === 'unknown' ? (
        <g className="agent-topology-badge__unknown">
          <path d="M28 14 36 8l8 6v16l-8 6-8-6Z" />
          <path d="M33 18c0-2 1.4-3.4 3.5-3.4 2 0 3.5 1.2 3.5 3.1 0 3-3.6 3-3.6 6M36.4 28h.1" />
        </g>
      ) : null}
      <g className="agent-topology-badge__nodes">
        {graph.nodes.map(([x, y, radius], index) => (
          <circle key={`${x}-${y}-${index}`} cx={x} cy={y} r={radius} style={{ '--topology-node': nodeColor(index) }} />
        ))}
      </g>
    </svg>
  );
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function normalizeRuntimeState(value) {
  const state = String(value || 'unknown').toLowerCase();
  if (['running', 'observed', 'spawned', 'active'].includes(state)) return 'running';
  if (['paused', 'idle'].includes(state)) return 'paused';
  if (state === 'stale') return 'stale';
  if (['blocked', 'error', 'stalled', 'failed'].includes(state)) return 'blocked';
  if (state === 'claimed') return 'claimed';
  return 'unknown';
}

function CapabilityCore({ level, state = 'running', compact = false }) {
  const normalizedState = normalizeRuntimeState(state);
  const provider = agentEncodings.providers[level.providerId] || agentEncodings.providers.unknown;
  const model = agentEncodings.models[level.modelId] || agentEncodings.models.unknown;
  const effort = agentEncodings.efforts[level.effortId] || agentEncodings.efforts.unknown;
  const topology = agentEncodings.topologies[level.topologyId] || agentEncodings.topologies.unknown;
  const operatingMode = agentEncodings.operatingModes[level.operatingModeId] || agentEncodings.operatingModes.unknown;
  const orbitCount = Math.max(1, Math.min(4, Number(effort.orbits) || 1));
  const satelliteCount = Math.max(0, Math.min(7, Number(topology.satellites) || 0));
  const energy = clamp(effort.energy || 0.2);
  const power = clamp(energy * 0.55 + clamp(topology.power) * 0.45);
  const boltCount = Math.min(6, Math.round(Math.max(0, energy + clamp(topology.power) - 1) * 8));
  const label = `${level.name}: ${provider.label} provider, ${model.label} model, ${effort.label} effort, ${topology.label} topology, ${operatingMode.label} mode, ${normalizedState}`;
  return (
    <span
      className={`agent-capability-core${compact ? ' is-compact' : ''}`}
      data-tier={level.id}
      data-state={normalizedState}
      data-core={model.core}
      data-topology={level.topologyId}
      style={{
        '--core-provider': provider.hue,
        '--core-model': model.accent,
        '--core-effort': effort.accent,
        '--core-topology': topology.nodeAccent,
        '--core-energy': energy,
        '--core-power': power,
        '--core-size': compact ? '64px' : `${Math.round(54 + power * 84)}px`,
        '--core-duration': `${16 - power * 10}s`,
        '--agent-state-accent': agentEncodings.runtimeStates[normalizedState]?.accent || agentEncodings.runtimeStates.unknown.accent,
      }}
      role="img"
      aria-label={label}
    >
      <i className="agent-capability-core__aura" />
      <i className="agent-capability-core__topology-envelope" />
      <i className="agent-capability-core__containment" />
      <i className="agent-capability-core__mantle" />
      <i className="agent-capability-core__heart" />
      {Array.from({ length: orbitCount }, (_, index) => (
        <i
          key={`rail-${index}`}
          className={`agent-capability-core__rail${index % 2 ? ' is-reverse' : ''}`}
          style={{
            '--rail-inset': `${7 + index * 4.5}%`,
            '--rail-angle': `${24 + index * 47}deg`,
            '--rail-scale': 0.61 + index * 0.08,
            '--rail-duration': `${(11.8 - energy * 5 + index * 1.2).toFixed(2)}s`,
          }}
        />
      ))}
      {Array.from({ length: boltCount }, (_, index) => (
        <i
          key={`bolt-${index}`}
          className="agent-capability-core__bolt"
          style={{ '--bolt-angle': `${24 + index * (312 / Math.max(1, boltCount - 1))}deg`, '--bolt-delay': `${index * -0.77}s` }}
        />
      ))}
      {Array.from({ length: satelliteCount }, (_, index) => (
        <i
          key={`node-${index}`}
          className="agent-capability-core__node"
          style={{
            '--node-angle': `${index * (360 / satelliteCount)}deg`,
            '--node-delay': `${index * -0.31}s`,
            '--node-color': topology.nodeAccent,
          }}
        />
      ))}
      <i className="agent-core-mode-mark agent-capability-core__mode" data-mode={level.operatingModeId} data-motion={operatingMode.motion} style={{ '--mode-accent': operatingMode.accent }} />
      <i className="agent-capability-core__state" />
    </span>
  );
}

function AgentCoreLanguage() {
  const [selectedId, setSelectedId] = useState('council');
  const [state, setState] = useState('running');
  return (
    <div className="agent-core-language">
      <header className="agent-core-language__toolbar">
        <div>
          <span>Capability ladder</span>
          <strong>Declared effort and orchestration, not vendor intelligence</strong>
        </div>
        <div className="agent-core-language__states" role="group" aria-label="Preview runtime state">
          {CORE_STATES.map(([id, label]) => (
            <button key={id} type="button" className={state === id ? 'is-active' : ''} aria-pressed={state === id} onClick={() => setState(id)}>{label}</button>
          ))}
        </div>
      </header>
      <div className="agent-core-language__levels">
        {CAPABILITY_LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            className={`agent-core-level${selectedId === level.id ? ' is-selected' : ''}`}
            aria-pressed={selectedId === level.id}
            onClick={() => setSelectedId(level.id)}
          >
            <span className="agent-core-level__stage"><CapabilityCore level={level} state={state} /></span>
            <span className="agent-core-level__copy">
              <small>{level.rank}</small>
              <strong>{level.name}</strong>
              <p>{level.summary}</p>
              <span className="agent-core-level__specs">
                <span><b>Provider</b>{level.provider}</span>
                <span><b>Model</b>{level.model}</span>
                <span><b>Effort</b>{level.effort}</span>
                <span><b>Topology</b>{level.topology}</span>
                <span><b>Mode</b>{level.operatingMode}</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { AgentCoreLanguage, CapabilityCore, TopologyBadge, CAPABILITY_LEVELS };
