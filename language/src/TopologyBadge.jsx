import React, { useId } from 'react';
import agentEncodings from '../../encodings/visual.json';
import { MULTI_PROVIDER_NODE_IDS, TOPOLOGY_GRAPHS } from './aodl-flow.js';

export function TopologyBadge({
  topologyId = 'unknown',
  providerId = 'unknown',
  size = 'compact',
  label,
  omitNodes = false,
  omitEdges = false,
}) {
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
      className={`agent-topology-badge agent-topology-badge--${size}${omitNodes ? ' is-deco' : ''}`}
      data-topology={topology.pattern}
      viewBox="0 0 72 44"
      role="img"
      aria-hidden={omitNodes ? 'true' : undefined}
      aria-label={omitNodes ? undefined : accessibleLabel}
      style={{ '--topology-edge': provider.hue }}
    >
      {graph.directed && !omitEdges ? (
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
      {!omitEdges ? (
        <g className={`agent-topology-badge__edges${graph.soft ? ' is-soft' : ''}${graph.directed ? ' is-directed' : ''}`}>
          {graph.edges.map(([from, to], index) => {
            const [x1, y1] = nodeAt(from);
            const [x2, y2] = nodeAt(to);
            return <line key={`${from}-${to}-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} markerEnd={graph.directed ? `url(#${markerId})` : undefined} />;
          })}
        </g>
      ) : null}
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
      {!omitNodes ? (
        <g className="agent-topology-badge__nodes">
          {graph.nodes.map(([x, y, radius], index) => (
            <circle key={`${x}-${y}-${index}`} cx={x} cy={y} r={radius} style={{ '--topology-node': nodeColor(index) }} />
          ))}
        </g>
      ) : null}
    </svg>
  );
}
