import React from 'react';
import { CapabilityCore } from './CapabilityCore.jsx';
import { SilhouetteFlow } from './OrchestrationCanvas.jsx';
import { topologyUnit } from './aodl-flow.js';

export function TopologyBlock({
  topologyId,
  providerId = 'multi',
  level,
  exploded,
  runtimeState = 'running',
  label,
  onToggle,
}) {
  const unit = level || topologyUnit(topologyId, providerId);
  return (
    <div
      className={`aodl-topology-block${exploded ? ' is-exploded' : ''}`}
      data-zoom={exploded ? 'pattern' : 'core'}
      data-topology={topologyId}
    >
      {exploded ? (
        <SilhouetteFlow topologyId={topologyId} providerId={providerId} label={label} />
      ) : (
        <button
          type="button"
          className="aodl-topology-block__core"
          aria-expanded="false"
          aria-label={`open ${unit.name} pattern`}
          onClick={(event) => {
            event.stopPropagation();
            onToggle?.(event.shiftKey);
          }}
        >
          <CapabilityCore level={unit} state={runtimeState} />
        </button>
      )}
    </div>
  );
}
