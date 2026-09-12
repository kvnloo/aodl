import { BaseEdge, getStraightPath } from '@xyflow/react';

export function AodlFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const relation = data?.relation ?? 'dependency';
  const extras = `${data?.soft ? ' is-soft' : ''}${data?.directed ? ' is-directed' : ''}`;
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={`aodl-flow-edge relation-${relation}${extras}`}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        data-relation={relation}
        className={`aodl-flow-edge-hit relation-${relation}${extras}`}
      />
    </>
  );
}
