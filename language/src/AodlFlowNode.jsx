import { Handle, Position } from '@xyflow/react';
import { CapabilityCore } from './AgentCoreLanguage.jsx';
import { HARNESS_IDS, KIND_VISUAL, LIFECYCLES, NODE_KINDS, visualForKind } from './aodl-flow.js';

function portOf(ports, direction) {
  return (ports || []).find((p) => p.direction === direction) || { id: direction, schema: '' };
}

export function AodlFlowNode({ id, data, selected }) {
  const visual = data.visual || KIND_VISUAL.task;
  const hotl = data.hotl || { id, kind: 'task', ports: [] };
  const ports = hotl.ports || [];
  const expanded = Boolean(data.expanded);
  const inPort = portOf(ports, 'in');
  const outPort = portOf(ports, 'out');
  const level = {
    id: hotl.id,
    name: hotl.id,
    rank: hotl.kind,
    providerId: visual.providerId,
    modelId: visual.modelId,
    effortId: visual.effortId,
    topologyId: visual.topologyId,
    operatingModeId: visual.operatingModeId,
  };

  const patch = (next) => {
    const merged = { ...hotl, ...next };
    if (next.kind && next.kind !== 'executor') {
      delete merged.harness;
    }
    data.onPatch?.(id, merged, visualForKind(merged.kind));
  };

  const patchPort = (direction, schema) => {
    const nextPorts = (hotl.ports || []).map((p) => (p.direction === direction ? { ...p, schema } : p));
    patch({ ports: nextPorts });
  };

  return (
    <div
      className={`aodl-flow-node${selected ? ' is-selected' : ''}${expanded ? ' is-expanded' : ''}`}
      data-kind={hotl.kind}
      data-expanded={expanded ? 'true' : 'false'}
      data-node={hotl.id}
    >
      <Handle type="target" position={Position.Left} className="aodl-flow-handle" />
      <button
        type="button"
        className="aodl-flow-core-hit nodrag nopan"
        aria-label={`expand ${hotl.id}`}
      >
        <CapabilityCore compact level={level} state={hotl.lifecycle === 'running' ? 'running' : 'claimed'} />
      </button>
      {expanded ? (
        <form
          className="aodl-flow-sheet nodrag nopan"
          onClick={(event) => event.stopPropagation()}
          onSubmit={(event) => event.preventDefault()}
        >
          <p className="sheet-id">{hotl.id}</p>
          <label>
            kind
            <select name="kind" value={hotl.kind} onChange={(event) => patch({ kind: event.target.value })}>
              {NODE_KINDS.map((kind) => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </select>
          </label>
          {hotl.kind === 'executor' ? (
            <label>
              harness
              <select
                name="harness"
                value={hotl.harness || ''}
                onChange={(event) => patch({ harness: event.target.value || undefined })}
              >
                <option value="">omit</option>
                {HARNESS_IDS.map((hid) => (
                  <option key={hid} value={hid}>{hid}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            lifecycle
            <select
              name="lifecycle"
              value={hotl.lifecycle || 'declared'}
              onChange={(event) => patch({ lifecycle: event.target.value })}
            >
              {LIFECYCLES.map((life) => (
                <option key={life} value={life}>{life}</option>
              ))}
            </select>
          </label>
          <label>
            capabilities
            <input
              name="capabilities"
              value={(hotl.capabilities || []).join(', ')}
              onChange={(event) =>
                patch({
                  capabilities: event.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
          <label>
            in schema
            <input
              name="inSchema"
              value={inPort.schema || ''}
              onChange={(event) => patchPort('in', event.target.value)}
            />
          </label>
          <label>
            out schema
            <input
              name="outSchema"
              value={outPort.schema || ''}
              onChange={(event) => patchPort('out', event.target.value)}
            />
          </label>
        </form>
      ) : null}
      <Handle type="source" position={Position.Right} className="aodl-flow-handle" />
    </div>
  );
}
