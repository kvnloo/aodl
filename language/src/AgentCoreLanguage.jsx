import React, { useState } from 'react';
import { TopologyBlock } from './TopologyBlock.jsx';
import { TopologyBadge } from './TopologyBadge.jsx';
import { CapabilityCore } from './CapabilityCore.jsx';
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

function DecoderLevel({ level, state, selected, exploded, onSelect, onToggle }) {
  return (
    <article
      className={`agent-core-level${selected ? ' is-selected' : ''}${exploded ? ' is-expanded' : ''}`}
      data-zoom={exploded ? 'pattern' : 'core'}
    >
      <div className="agent-core-level__stage">
        <TopologyBlock
          topologyId={level.topologyId}
          providerId={level.providerId}
          level={level}
          exploded={exploded}
          runtimeState={state}
          label={`${level.name} ${level.topology} silhouette`}
          onToggle={onToggle}
        />
      </div>
      <button
        type="button"
        className="agent-core-level__copy"
        aria-pressed={selected}
        onClick={onSelect}
      >
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
      </button>
    </article>
  );
}

function AgentCoreLanguage() {
  const [selectedId, setSelectedId] = useState('council');
  const [state, setState] = useState('running');
  const [expanded, setExpanded] = useState(() => new Set());

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
          <DecoderLevel
            key={level.id}
            level={level}
            state={state}
            selected={selectedId === level.id}
            exploded={expanded.has(level.id)}
            onSelect={() => setSelectedId(level.id)}
            onToggle={(shift) => {
              setSelectedId(level.id);
              setExpanded((current) => {
                const next = new Set(shift ? current : current);
                if (shift) {
                  next.add(level.id);
                  return next;
                }
                if (next.has(level.id)) next.delete(level.id);
                else {
                  next.clear();
                  next.add(level.id);
                }
                return next;
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}

export { AgentCoreLanguage, CapabilityCore, TopologyBadge, CAPABILITY_LEVELS };
