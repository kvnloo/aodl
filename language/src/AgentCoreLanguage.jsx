import React from 'react';
import { Icon } from './icons.jsx';
import agentEncodings from '../../encodings/visual.json';
import './agent-core-language.css';

const { useEffect, useId, useRef, useState } = React;

let coreVisibilityObserver;

function useCoreVisibilityRef() {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    if (!coreVisibilityObserver) {
      coreVisibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { entry.target.dataset.visibility = entry.isIntersecting ? 'visible' : 'offscreen'; });
      }, { rootMargin: '120px' });
    }
    coreVisibilityObserver.observe(node);
    return () => coreVisibilityObserver?.unobserve(node);
  }, []);
  return ref;
}

const CAPABILITY_LEVELS = [
  {
    id: 'runner',
    rank: 'C1',
    name: 'Focused runner',
    summary: 'One declared specialist works live beside a human on a bounded task with a calm cadence.',
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
    summary: 'One declared frontier model runs autonomously through a long window with an independent verification partner.',
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
    summary: 'A declared multi-provider council iterates through swarm experiments, weighs evidence, and synthesizes.',
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

const OPERATING_MODES = ['copilot', 'overnight', 'continuous', 'tournament', 'batch'].map((id) => [
  id,
  agentEncodings.operatingModes[id].label,
  agentEncodings.operatingModes[id].description,
]);

const PROVIDER_KEY = Object.entries(agentEncodings.providers);
const MODEL_KEY = Object.entries(agentEncodings.models);
const EFFORT_KEY = Object.entries(agentEncodings.efforts);
const TOPOLOGY_KEY = Object.entries(agentEncodings.topologies);
const RUNTIME_STATE_KEY = CORE_STATES.map(([id]) => [id, agentEncodings.runtimeStates[id]]);

const TOPOLOGY_GRAPHS = {
  solo: {
    nodes: [[36, 22, 7]],
    edges: [],
  },
  paired: {
    nodes: [[21, 22, 4.8], [51, 22, 4.8]],
    edges: [[0, 1]],
  },
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
  unknown: {
    nodes: [],
    edges: [],
    center: 'unknown',
  },
};

const MULTI_PROVIDER_NODE_IDS = ['openai', 'anthropic', 'moonshot', 'xai', 'cursor', 'fable'];

function TopologyBadge({ topologyId = 'unknown', providerId = 'unknown', size = 'compact', label }) {
  const markerId = useId().replace(/:/g, '');
  const topology = agentEncodings.topologies[topologyId] || agentEncodings.topologies.unknown;
  const graph = TOPOLOGY_GRAPHS[topology.pattern] || TOPOLOGY_GRAPHS.unknown;
  const provider = agentEncodings.providers[providerId] || agentEncodings.providers.unknown;
  const nodeColor = (index) => {
    if (providerId !== 'multi') return provider.hue;
    const mixedProvider = agentEncodings.providers[MULTI_PROVIDER_NODE_IDS[index % MULTI_PROVIDER_NODE_IDS.length]];
    return mixedProvider?.hue || agentEncodings.providers.multi.hue;
  };
  const nodeAt = (index) => graph.nodes[index] || [36, 22, 0];
  const accessibleLabel = label || `${topology.label} topology, ${provider.label} node tint`;

  return (
    <svg
      className={`agent-topology-badge agent-topology-badge--${size}`}
      data-topology={topology.pattern}
      data-provider={providerId}
      viewBox="0 0 72 44"
      role="img"
      aria-label={accessibleLabel}
      style={{ '--topology-edge': provider.hue }}
    >
      {graph.directed && (
        <defs>
          <marker id={markerId} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path className="agent-topology-badge__arrow" d="M0 0 6 3 0 6Z" />
          </marker>
        </defs>
      )}
      {graph.envelope === 'council' && <circle className="agent-topology-badge__envelope" cx="36" cy="22" r="18" />}
      {graph.envelope === 'supervisor' && <circle className="agent-topology-badge__envelope is-alert" cx="36" cy="22" r="19" />}
      {graph.envelope === 'marketplace' && <circle className="agent-topology-badge__envelope is-dashed" cx="36" cy="22" r="18" />}
      {graph.envelope === 'cluster' && (
        <g className="agent-topology-badge__cluster-envelopes">
          <circle cx="16" cy="16" r="12" /><circle cx="50" cy="15" r="12" /><circle cx="34" cy="34" r="11" />
        </g>
      )}
      <g className={`agent-topology-badge__edges${graph.soft ? ' is-soft' : ''}${graph.directed ? ' is-directed' : ''}`}>
        {graph.edges.map(([from, to], index) => {
          const [x1, y1] = nodeAt(from);
          const [x2, y2] = nodeAt(to);
          return <line key={`${from}-${to}-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} markerEnd={graph.directed ? `url(#${markerId})` : undefined} />;
        })}
      </g>
      {graph.center === 'blackboard' && (
        <g className="agent-topology-badge__blackboard">
          <rect x="27" y="14" width="18" height="16" rx="2" />
          <path d="M31 19h10M31 22h10M31 25h7" />
        </g>
      )}
      {graph.center === 'marketplace' && <path className="agent-topology-badge__market" d="M36 14 44 22 36 30 28 22Z" />}
      {graph.center === 'unknown' && (
        <g className="agent-topology-badge__unknown">
          <path d="M28 14 36 8l8 6v16l-8 6-8-6Z" />
          <path d="M33 18c0-2 1.4-3.4 3.5-3.4 2 0 3.5 1.2 3.5 3.1 0 3-3.6 3-3.6 6M36.4 28h.1" />
        </g>
      )}
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

function AgentCoreGlyph({ agent, size = 'small' }) {
  const visibilityRef = useCoreVisibilityRef();
  const profile = agent?.profile;
  const provider = profile?.provider || { id: 'unknown', label: 'Unspecified', hue: '#9ca39a' };
  const model = profile?.model || { id: 'unknown', label: 'Unspecified', core: 'plain', accent: '#9ca39a' };
  const effort = profile?.effort || { id: 'unknown', label: 'Unspecified', orbits: 1, energy: 0.2, accent: '#9ca39a' };
  const topology = profile?.topology || { id: 'unknown', label: 'Unspecified', satellites: 0, power: 0, nodeAccent: '#9ca39a' };
  const operatingMode = profile?.operatingMode || { id: 'unknown', label: 'Unspecified', marker: 'unknown', accent: '#9ca39a', motion: 'none' };
  const orbitCount = Math.max(1, Math.min(4, Number(effort.orbits) || 1));
  const satelliteCount = Math.max(0, Math.min(7, Number(topology.satellites) || 0));
  const energy = clamp(effort.energy || 0.2);
  const power = clamp(energy * 0.62 + clamp(topology.power) * 0.38);
  const reportedState = agent?.state || 'unknown';
  const state = normalizeRuntimeState(reportedState);
  const stateEncoding = agentEncodings.runtimeStates[state] || agentEncodings.runtimeStates.unknown;
  const economics = profile?.economics || { state: 'unmeasured', valueScore: null, tokenCost: null };
  const rawValue = economics.valueScore;
  const bounds = economics.valueScoreBounds || agentEncodings.economics.valueScore;
  const minimumScore = Number(bounds.minimum);
  const maximumScore = Number(bounds.maximum);
  const range = maximumScore - minimumScore;
  const hasBoundedScore = Number.isFinite(rawValue) && rawValue >= minimumScore && rawValue <= maximumScore && range > 0;
  const normalizedValue = hasBoundedScore ? clamp((rawValue - minimumScore) / range) : 0;
  const economicsState = economics.state === 'estimated'
    ? 'estimated'
    : economics.state === 'measured' && hasBoundedScore ? 'measured' : 'unmeasured';
  const label = `${agent?.owner || 'Unassigned agent'}: ${provider.label} provider, ${model.label} model, ${effort.label} effort, ${topology.label} topology, ${operatingMode.label} operating mode, ${reportedState} state, ${economicsState} economics`;

  return (
    <span
      ref={visibilityRef}
      className={`agent-core-glyph agent-core-glyph--${size}`}
      data-state={state}
      data-reported-state={reportedState}
      data-provider={provider.id || 'unknown'}
      data-model={model.id || 'unknown'}
      data-core={model.core || 'plain'}
      data-topology={topology.id || 'unknown'}
      data-economics-state={economicsState}
      data-visibility="visible"
      style={{
        '--agent-hue': provider.hue,
        '--agent-provider': provider.hue,
        '--agent-model': model.accent,
        '--agent-effort': effort.accent,
        '--agent-topology': topology.nodeAccent,
        '--agent-state-accent': stateEncoding.accent,
        '--agent-energy': energy,
        '--agent-power': power,
        '--agent-glow': `${5 + power * 17}px`,
        '--agent-core-inset': `${30 - power * 8}%`,
      }}
      role="img"
      aria-label={label}
      title={label}
    >
      <i className="agent-core-glyph__aura" />
      <i className="agent-core-glyph__topology-envelope" />
      <i className="agent-core-glyph__core" />
      {Array.from({ length: orbitCount }, (_, index) => (
        <i
          key={`orbit-${index}`}
          className="agent-core-glyph__orbit"
          style={{
            '--orbit-inset': `${index * 2}px`,
            '--orbit-duration': `${6.4 - energy * 1.8 + index * 1.2}s`,
            '--orbit-color': effort.accent,
          }}
        />
      ))}
      {Array.from({ length: satelliteCount }, (_, index) => (
        <i
          key={`satellite-${index}`}
          className="agent-core-glyph__satellite"
          style={{
            '--satellite-angle': `${(360 / satelliteCount) * index}deg`,
            '--satellite-color': topology.nodeAccent,
          }}
        />
      ))}
      <i className="agent-core-glyph__signal" />
      <i className={`agent-core-glyph__value is-${economicsState} ${hasBoundedScore ? 'has-score' : 'no-score'}`} style={{ '--agent-value-angle': `${normalizedValue * 360}deg` }} />
      <i className="agent-core-mode-mark agent-core-glyph__mode" data-mode={operatingMode.id || 'unknown'} data-motion={operatingMode.motion || 'none'} style={{ '--mode-accent': operatingMode.accent }} />
      <i className="agent-core-glyph__state" />
    </span>
  );
}

function CapabilityCore({ level, state = 'running', size = 'hero' }) {
  const visibilityRef = useCoreVisibilityRef();
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
  const label = `${level.name}: ${provider.label} provider, ${model.label} model, ${effort.label} effort, ${topology.label} topology, ${operatingMode.label} operating mode, ${normalizedState}`;
  return (
    <span
      ref={visibilityRef}
      className={`agent-capability-core agent-capability-core--${size}`}
      data-tier={level.id}
      data-state={normalizedState}
      data-provider={level.providerId}
      data-model={level.modelId}
      data-core={model.core}
      data-effort={level.effortId}
      data-topology={level.topologyId}
      data-visibility="visible"
      style={{
        '--core-provider': provider.hue,
        '--core-model': model.accent,
        '--core-effort': effort.accent,
        '--core-topology': topology.nodeAccent,
        '--core-energy': energy,
        '--core-power': power,
        '--core-size': `${Math.round(54 + power * 84)}px`,
        '--core-duration': `${16 - power * 10}s`,
        '--agent-state-accent': agentEncodings.runtimeStates[normalizedState]?.accent || agentEncodings.runtimeStates.unknown.accent,
      }}
      role="img"
      aria-label={label}
      title={label}
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
          style={{ '--bolt-angle': `${24 + index * (312 / Math.max(1, level.bolts - 1))}deg`, '--bolt-delay': `${index * -0.77}s` }}
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

function EncodingReference() {
  const [topologyProviderId, setTopologyProviderId] = useState('multi');
  const topologyProvider = agentEncodings.providers[topologyProviderId] || agentEncodings.providers.unknown;
  return (
    <section className="agent-encoding-reference" aria-labelledby="agent-encoding-reference-title">
      <header>
        <strong id="agent-encoding-reference-title">Provider hue key</strong>
        <small>Outer hue identifies provider only.</small>
      </header>
      <div className="agent-encoding-reference__providers">
        {PROVIDER_KEY.map(([id, provider]) => (
          <span key={id}><i style={{ '--provider-swatch': provider.hue }} /><b>{provider.label}</b></span>
        ))}
      </div>
      <details className="agent-encoding-reference__details">
        <summary><span>Decode model, effort, topology, operating mode, and state</span><Icon name="arrow" size={13} /></summary>
        <div className="agent-encoding-reference__grid">
          <section>
            <header><strong>Model</strong><small>Core geometry</small></header>
            <div className="agent-encoding-key-list agent-encoding-key-list--models">
              {MODEL_KEY.map(([id, model]) => <span key={id}><i className="agent-core-model-mark" data-core={model.core} style={{ '--model-accent': model.accent }} /><b>{model.label}</b></span>)}
            </div>
          </section>
          <section>
            <header><strong>Effort</strong><small>Orbit count + intensity</small></header>
            <div className="agent-encoding-key-list">
              {EFFORT_KEY.map(([id, effort]) => (
                <span key={id}>
                  <span className="agent-effort-mark" style={{ '--effort-energy': effort.energy, '--effort-accent': effort.accent }}>{Array.from({ length: 4 }, (_, index) => <i key={index} className={index < effort.orbits ? 'is-active' : ''} />)}</span>
                  <b>{effort.label}</b>
                </span>
              ))}
            </div>
          </section>
          <section className="agent-encoding-reference__topologies">
            <header><strong>Topology</strong><small>Shape = coordination · tint = provider</small></header>
            <div className="agent-topology-provider-picker" role="radiogroup" aria-label="Preview topology provider tint">
              <span>Node tint: {topologyProvider.label}</span>
              <div>
                {PROVIDER_KEY.map(([id, provider]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={topologyProviderId === id}
                    aria-label={`Preview ${provider.label} nodes`}
                    className={topologyProviderId === id ? 'is-active' : ''}
                    style={{ '--provider-swatch': provider.hue }}
                    onClick={() => setTopologyProviderId(id)}
                  />
                ))}
              </div>
            </div>
            <div className="agent-topology-catalog">
              {TOPOLOGY_KEY.map(([id, topology]) => (
                <span key={id} title={topology.description}>
                  <TopologyBadge topologyId={id} providerId={topologyProviderId} label={`${topology.label}: ${topology.description} Previewed with ${topologyProvider.label} node tint.`} />
                  <span><b>{topology.label}</b><small>{topology.description}</small></span>
                </span>
              ))}
            </div>
          </section>
          <section>
            <header><strong>Operating mode</strong><small>Temporal organization rune</small></header>
            <div className="agent-encoding-key-list">
              {OPERATING_MODES.map(([id, label]) => <span key={id}><i className="agent-core-mode-mark" data-mode={id} data-motion={agentEncodings.operatingModes[id].motion} style={{ '--mode-accent': agentEncodings.operatingModes[id].accent }} /><b>{label}</b></span>)}
            </div>
          </section>
          <section>
            <header><strong>Runtime state</strong><small>Marker + cadence</small></header>
            <div className="agent-encoding-key-list">
              {RUNTIME_STATE_KEY.map(([id, runtimeState]) => <span key={id}><i className="agent-state-mark" data-state={id} style={{ '--state-accent': runtimeState.accent }} /><b>{runtimeState.label}</b></span>)}
            </div>
          </section>
          <section>
            <header><strong>Economics</strong><small>Value score 0-100 points · token cost in tokens</small></header>
            <div className="agent-encoding-key-list">
              <span><i className="agent-economics-mark is-unmeasured" /><b>Unmeasured</b></span>
              <span><i className="agent-economics-mark is-estimated" /><b>Estimated</b></span>
              <span><i className="agent-economics-mark is-measured" /><b>Measured score</b></span>
            </div>
          </section>
        </div>
      </details>
    </section>
  );
}

function AgentCoreLanguage() {
  const [selectedId, setSelectedId] = useState('council');
  const [state, setState] = useState('running');
  const selected = CAPABILITY_LEVELS.find((level) => level.id === selectedId) || CAPABILITY_LEVELS[2];
  const productionAgent = {
    owner: selected.name,
    state,
    profile: {
      provider: { id: selected.providerId, ...agentEncodings.providers[selected.providerId] },
      model: { id: selected.modelId, ...agentEncodings.models[selected.modelId] },
      effort: { id: selected.effortId, ...agentEncodings.efforts[selected.effortId] },
      topology: { id: selected.topologyId, ...agentEncodings.topologies[selected.topologyId] },
      operatingMode: { id: selected.operatingModeId, ...agentEncodings.operatingModes[selected.operatingModeId], provenance: 'design_proof' },
      economics: { state: 'unmeasured', valueScore: null, valueScoreBounds: { minimum: 0, maximum: 100 }, tokenCost: null },
    },
  };

  return (
    <div className="agent-core-language">
      <header className="agent-core-language__toolbar">
        <div>
          <span>Capability ladder</span>
          <strong>Declared effort and orchestration determine visual intensity</strong>
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
              <small>{level.rank} / {selectedId === level.id ? 'Selected' : 'Declared profile'}</small>
              <strong>{level.name}</strong>
              <p>{level.summary}</p>
              <span className="agent-core-level__specs">
                <span><b>Provider</b>{level.provider}</span>
                <span><b>Model</b>{level.model}</span>
                <span><b>Effort</b>{level.effort}</span>
                <span><b>Topology</b>{level.topology}</span>
                <span><b>Operating mode</b>{level.operatingMode}</span>
              </span>
            </span>
          </button>
        ))}
      </div>

      <footer className="agent-core-language__footer">
        <div className="agent-core-language__scale" aria-label={`${selected.name} scale proof`}>
          <span><AgentCoreGlyph agent={productionAgent} size="small" /><small>28</small></span>
          <span><AgentCoreGlyph agent={productionAgent} size="medium" /><small>38</small></span>
          <span><AgentCoreGlyph agent={productionAgent} size="large" /><small>58</small></span>
        </div>
        <dl className="agent-core-language__legend">
          <div><dt>Provider</dt><dd>Outer hue key</dd></div>
          <div><dt>Model</dt><dd>Core geometry</dd></div>
          <div><dt>Effort</dt><dd>Energy + orbit count</dd></div>
          <div><dt>Topology</dt><dd>Nodes + envelope</dd></div>
          <div><dt>Operating mode</dt><dd>Mode rune</dd></div>
          <div><dt>State</dt><dd>Cadence + marker</dd></div>
          <div><dt>Economics</dt><dd>Measured perimeter</dd></div>
        </dl>
      </footer>
      <EncodingReference />
      <p className="agent-core-language__truth">
        Visual power describes declared effort and orchestration, not vendor intelligence. Operating mode describes temporal organization, not runtime state. Missing metadata stays visibly unspecified; the console never guesses a capability ranking.
      </p>
    </div>
  );
}

function AgentEncodingInfo({ designHref = '/design.html?theme=living-night#agent-core-language' }) {
  const panelId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const [transientOpen, setTransientOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = transientOpen || pinned;

  useEffect(() => {
    if (!open) return undefined;
    const close = (returnFocus = false) => {
      setPinned(false);
      setTransientOpen(false);
      if (returnFocus) {
        triggerRef.current?.focus({ preventScroll: true });
        queueMicrotask(() => setTransientOpen(false));
      }
    };
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) close();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close(true);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const togglePinned = () => {
    if (pinned) {
      setPinned(false);
      setTransientOpen(false);
      return;
    }
    setPinned(true);
    setTransientOpen(true);
  };

  return (
    <span
      ref={rootRef}
      className={`agent-core-info${open ? ' is-open' : ''}${pinned ? ' is-pinned' : ''}`}
      onPointerEnter={() => setTransientOpen(true)}
      onPointerLeave={() => {
        if (!rootRef.current?.contains(document.activeElement)) setTransientOpen(false);
      }}
      onFocusCapture={() => setTransientOpen(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setTransientOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label="Explain agent core encoding"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={togglePinned}
      ><span className="agent-core-info__mark" aria-hidden="true">i</span></button>
      <span className="agent-core-info__panel" id={panelId} role="region" aria-label="Agent core encoding key" aria-hidden={!open}>
        <strong>Agent core key</strong>
        <small>Declared metadata only. Status remains visible in the row.</small>
        <span><b>Hue</b>Provider</span>
        <span><b>Shape</b>Model family</span>
        <span><b>Energy</b>Effort</span>
        <span><b>Nodes</b>Topology</span>
        <span><b>Rune</b>Operating mode</span>
        <span><b>Cadence</b>Runtime state</span>
        <span><b>Perimeter</b>Economics</span>
        <a href={designHref}>Open the full language <Icon name="arrow" size={13} /></a>
      </span>
    </span>
  );
}

export { AgentCoreGlyph, AgentCoreLanguage, AgentEncodingInfo, TopologyBadge, CAPABILITY_LEVELS };
