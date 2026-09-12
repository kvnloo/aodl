import { Handle, Position } from "@xyflow/react";
import { CapabilityCore } from "./AgentCoreLanguage.jsx";
import { KIND_VISUAL } from "./aodl-flow.js";

export function AodlFlowNode({ id, data, selected }) {
  const visual = data.visual || KIND_VISUAL.task;
  const hotl = data.hotl || { id, kind: "task", ports: [] };
  const ports = hotl.ports || [];
  const portsIn = ports.filter((p) => p.direction === "in").length;
  const portsOut = ports.filter((p) => p.direction === "out").length;
  const expanded = Boolean(data.expanded);
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
  return (
    <div
      className={`aodl-flow-node nodrag${selected ? " selected" : ""}${expanded ? " sheet-open" : ""}`}
      data-kind={hotl.kind}
      data-expanded={expanded ? "true" : "false"}
    >
      <Handle type="target" position={Position.Left} />
      <button
        type="button"
        className="aodl-flow-core-hit nodrag nopan"
        onClick={() => data.onToggleExpand?.(id)}
        aria-label={`expand ${hotl.id}`}
      >
        <CapabilityCore compact level={level} state="running" />
      </button>
      {expanded ? (
        <div className="aodl-flow-sheet">
          <p className="sheet-id">{hotl.id}</p>
          <p className="sheet-kind">{hotl.kind}</p>
          <p className="sheet-ports">
            in {portsIn} · out {portsOut}
          </p>
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
