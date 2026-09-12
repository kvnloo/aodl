import React from 'react';
import agentEncodings from '../../encodings/visual.json';

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

export function normalizeRuntimeState(value) {
  const state = String(value || 'unknown').toLowerCase();
  if (['running', 'observed', 'spawned', 'active'].includes(state)) return 'running';
  if (['paused', 'idle'].includes(state)) return 'paused';
  if (state === 'stale') return 'stale';
  if (['blocked', 'error', 'stalled', 'failed'].includes(state)) return 'blocked';
  if (state === 'claimed') return 'claimed';
  return 'unknown';
}

export function CapabilityCore({ level, state = 'running', compact = false }) {
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
