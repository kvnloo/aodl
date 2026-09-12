import { Handle, Position } from '@xyflow/react';
import { HARNESS_IDS, KIND_VISUAL, LIFECYCLES, NODE_KINDS, visualForKind } from './aodl-flow.js';
import './orchestration.css';

function portOf(ports, direction) {
  return (ports || []).find((p) => p.direction === direction) || { id: direction, schema: '' };
}

export function AodlUnit({ id, data, selected }) {
  const visual = data.visual || KIND_VISUAL.task;
  const hotl = data.hotl || { id, kind: 'task', ports: [] };
  const ports = hotl.ports || [];
  const expanded = Boolean(data.expanded);
  const inPort = portOf(ports, 'in');
  const outPort = portOf(ports, 'out');
  const radius = Number(data.radius) || 6;
  const hue = data.hue || '#9ca39a';

  const patch = (next) => {
    const merged = { ...hotl, ...next };
    if (next.kind && next.kind !== 'executor') {
      delete merged.harness;
    }
    const nextVisual = next.kind ? visualForKind(merged.kind) : visual;
    data.onPatch?.(id, merged, nextVisual);
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
      data-mode="silhouette"
      style={{
        '--dot': `${radius * 2}px`,
        '--dot-n': String(radius * 2),
        '--topology-node': hue,
        '--node-x': `${Number(data.left) || 0}px`,
        '--node-y': `${Number(data.top) || 0}px`,
      }}
    >
      <button
        type="button"
        className="aodl-flow-core-hit nodrag nopan"
        aria-label={`edit ${hotl.id}`}
        aria-expanded={expanded}
        onClick={(event) => {
          event.stopPropagation();
          data.onToggleExpand?.(id, event.shiftKey);
        }}
      >
        <span className="aodl-flow-glyph">
          <i className="aodl-flow-glyph__dot" />
        </span>
      </button>
      <div className="aodl-flow-sheet-clip">
        <form
          className="aodl-flow-sheet nodrag nopan"
          onClick={(event) => event.stopPropagation()}
          onSubmit={(event) => event.preventDefault()}
        >
          <p className="sheet-id">{hotl.kind}</p>
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
      </div>
    </div>
  );
}

export function AodlFlowNode({ id, data, selected }) {
  return (
    <>
      <Handle type="target" position={Position.Left} className="aodl-flow-handle" />
      <AodlUnit id={id} data={data} selected={selected} />
      <Handle type="source" position={Position.Right} className="aodl-flow-handle" />
    </>
  );
}
