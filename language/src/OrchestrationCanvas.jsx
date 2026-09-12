import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CapabilityCore } from './AgentCoreLanguage.jsx';
import { AodlFlowEdge } from './AodlFlowEdge.jsx';
import { AodlFlowNode } from './AodlFlowNode.jsx';
import { PROGRAMS, documentToFlow } from './aodl-flow.js';
import './orchestration.css';

const nodeTypes = { aodlCore: AodlFlowNode };
const edgeTypes = { aodlEdge: AodlFlowEdge };

function ProgramGraph({ program }) {
  const seed = useMemo(() => documentToFlow(program.doc), [program]);
  const [nodes, setNodes, onNodesChange] = useNodesState(seed.nodes);
  const [edges, , onEdgesChange] = useEdgesState(seed.edges);

  const onPatch = useCallback((nodeId, hotl, visual) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, hotl, visual } } : node,
      ),
    );
  }, [setNodes]);

  const onToggleExpand = useCallback((nodeId, shift) => {
    setNodes((current) => {
      const selected = current.filter((node) => node.selected).map((node) => node.id);
      const targets = new Set(shift ? [...selected, nodeId] : [nodeId]);
      return current.map((node) => {
        if (!targets.has(node.id)) return node;
        const expanded = !node.data.expanded;
        return {
          ...node,
          style: { width: expanded ? 268 : 72, height: expanded ? 'auto' : 72 },
          data: { ...node.data, expanded },
        };
      });
    });
  }, [setNodes]);

  const wired = nodes.map((node) => ({
    ...node,
    data: { ...node.data, onPatch, onToggleExpand },
  }));

  return (
    <div className="aodl-flow" data-events={String(seed.events)}>
      <div className="aodl-time-axis" aria-hidden="true">
        <span>t₀</span>
        <span>t</span>
      </div>
      <ReactFlow
        nodes={wired}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(event, node) => {
          if (event.target.closest('.aodl-flow-sheet')) return;
          onToggleExpand(node.id, event.shiftKey);
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.35}
        maxZoom={1.4}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
      />
    </div>
  );
}

function ProgramShell({ program, open, onOpen, onClose }) {
  const kinds = (program.doc.policies?.kinds || []).join(' · ');
  if (!open) {
    return (
      <button
        type="button"
        className="aodl-program-core"
        data-program={program.id}
        onClick={onOpen}
        aria-label={`expand ${program.label}`}
      >
        <CapabilityCore compact level={program.core} state="running" />
        <span>{program.label}</span>
      </button>
    );
  }
  return (
    <div className="aodl-program-shell" data-program={program.id}>
      <div className="aodl-program-chrome">
        <strong>{program.label}</strong>
        <span className="aodl-program-kinds">{kinds}</span>
        <button type="button" onClick={onClose}>Collapse to core</button>
      </div>
      <ReactFlowProvider>
        <ProgramGraph program={program} />
      </ReactFlowProvider>
    </div>
  );
}

export function OrchestrationCanvas() {
  const [openId, setOpenId] = useState(null);
  return (
    <section className="aodl-orchestration" aria-labelledby="aodl-orch-title">
      <h2 id="aodl-orch-title">Timebound graph</h2>
      <p>
        Control-plane programs as declared cores. Time is <code>eventLog</code> / logical <code>t</code>,
        not radius. Click a unit, or a selected set, to expand a full node and edit the language.
        The same surface can later host an artifact / receipt. o8 is a compiler, not a node.
      </p>
      <div className="aodl-orch-programs">
        {PROGRAMS.map((program) => (
          <ProgramShell
            key={program.id}
            program={program}
            open={openId === program.id}
            onOpen={() => setOpenId(program.id)}
            onClose={() => setOpenId(null)}
          />
        ))}
      </div>
    </section>
  );
}
