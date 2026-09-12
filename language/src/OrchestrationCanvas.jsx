import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TopologyBadge } from './TopologyBadge.jsx';
import { AodlFlowEdge } from './AodlFlowEdge.jsx';
import { AodlFlowNode } from './AodlFlowNode.jsx';
import { hueForVisual, silhouetteToFlow, VIEW_H, VIEW_W, visualForKind } from './aodl-flow.js';
import './orchestration.css';

const nodeTypes = { aodlCore: AodlFlowNode };
const edgeTypes = { aodlEdge: AodlFlowEdge };

function SilhouetteGraph({ topologyId, providerId, label }) {
  const seed = useMemo(() => silhouetteToFlow(topologyId, providerId), [topologyId, providerId]);
  const [nodes, setNodes, onNodesChange] = useNodesState(seed.nodes);
  const [edges, , onEdgesChange] = useEdgesState(seed.edges);
  const open = nodes.some((node) => node.data.expanded);

  const onPatch = useCallback((nodeId, hotl, nextVisual) => {
    const visual = nextVisual || visualForKind(hotl.kind);
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            data: {
              ...node.data,
              hotl,
              visual,
              hue: hueForVisual(visual, node.data.hue),
            },
          }
          : node,
      ),
    );
  }, [setNodes]);

  const onToggleExpand = useCallback((nodeId, shift) => {
    setNodes((current) => {
      const already = current.filter((node) => node.data.expanded).map((node) => node.id);
      const targets = new Set(shift ? [...already, nodeId] : [nodeId]);
      return current.map((node) => {
        if (shift) {
          if (!targets.has(node.id)) return node;
          return { ...node, zIndex: 8, data: { ...node.data, expanded: true } };
        }
        if (node.id !== nodeId) return node;
        const expanded = !node.data.expanded;
        return { ...node, zIndex: expanded ? 8 : 1, data: { ...node.data, expanded } };
      });
    });
  }, [setNodes]);

  const wired = nodes.map((node) => ({
    ...node,
    data: { ...node.data, onPatch, onToggleExpand },
  }));

  return (
    <div
      className={`aodl-silhouette-flow${open ? ' is-open' : ''}`}
      data-topology={topologyId}
      data-open={open ? 'true' : 'false'}
      style={{ '--flow-w': `${VIEW_W}px`, '--flow-h': `${VIEW_H}px` }}
    >
      <TopologyBadge
        topologyId={topologyId}
        providerId={providerId}
        label={label}
        omitNodes
        omitEdges
      />
      <ReactFlow
        nodes={wired}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={1}
        maxZoom={1}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        autoPanOnNodeFocus={false}
        selectionOnDrag={false}
        multiSelectionKeyCode="Shift"
      />
    </div>
  );
}

export function SilhouetteFlow({ topologyId, providerId = 'multi', label }) {
  return (
    <ReactFlowProvider>
      <SilhouetteGraph topologyId={topologyId} providerId={providerId} label={label} />
    </ReactFlowProvider>
  );
}
