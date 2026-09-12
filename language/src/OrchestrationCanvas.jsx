import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import { CapabilityCore } from "./AgentCoreLanguage.jsx";
import { AodlFlowNode } from "./AodlFlowNode.jsx";
import { AodlFlowEdge } from "./AodlFlowEdge.jsx";
import { PROGRAMS, beatmapFromFlow, documentToFlow } from "./aodl-flow.js";
import {
  accuracyFrom,
  approachMs,
  comboAfter,
  hitWindows,
  judge,
  pointToSegmentDistance,
  scoreFor,
  speedForCombo,
  spinDelta,
} from "./osu-controller.js";
import "@xyflow/react/dist/style.css";
import "./orchestration.css";

const NODE_TYPES = { aodlCore: AodlFlowNode };
const EDGE_TYPES = { aodlEdge: AodlFlowEdge };

function measureNode(root, nodeId) {
  if (!root) return null;
  const el = root.querySelector(`.react-flow__node[data-id="${CSS.escape(nodeId)}"]`);
  if (!el) return null;
  const a = root.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  return {
    x: b.left - a.left,
    y: b.top - a.top,
    w: b.width,
    h: b.height,
    cx: b.left - a.left + b.width / 2,
    cy: b.top - a.top + b.height / 2,
  };
}

function playHitsFromFlow(flow) {
  return beatmapFromFlow(flow).filter((hit) => !hit.ghost);
}

function OsuLayer({ rootRef, beat, beatKey, speed, onVerdict }) {
  const [box, setBox] = useState(null);
  const [toBox, setToBox] = useState(null);
  const [phase, setPhase] = useState("approach");
  const hitAt = useRef(0);
  const judged = useRef(false);
  const spin = useRef({ prev: null, acc: 0 });
  const windows = hitWindows(speed);
  const approach = approachMs(speed);

  useEffect(() => {
    judged.current = false;
    spin.current = { prev: null, acc: 0 };
    setPhase("approach");
    hitAt.current = 0;
    let raf = 0;
    const tick = (now) => {
      const root = rootRef.current;
      if (beat.type === "slider") {
        setBox(measureNode(root, beat.from));
        setToBox(measureNode(root, beat.to));
      } else {
        setBox(measureNode(root, beat.nodeId));
        setToBox(null);
      }
      const ready =
        beat.type === "slider"
          ? Boolean(measureNode(root, beat.from) && measureNode(root, beat.to))
          : Boolean(measureNode(root, beat.nodeId));
      if (ready && hitAt.current === 0) hitAt.current = now + approach;
      if (hitAt.current === 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const delta = now - hitAt.current;
      if (!judged.current && Math.abs(delta) <= windows.ok) setPhase("open");
      if (!judged.current && delta > windows.ok) {
        judged.current = true;
        onVerdict("miss");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [beat, beatKey, approach, windows.ok, onVerdict, rootRef]);

  const resolve = (verdict) => {
    if (judged.current) return;
    judged.current = true;
    onVerdict(verdict);
  };

  const onCircle = () => {
    resolve(judge(performance.now() - hitAt.current, speed));
  };

  const onSliderMove = (event) => {
    if (phase !== "open" || !box || !toBox) return;
    const root = rootRef.current.getBoundingClientRect();
    const px = event.clientX - root.left;
    const py = event.clientY - root.top;
    const dist = pointToSegmentDistance(px, py, box.cx, box.cy, toBox.cx, toBox.cy);
    if (dist > 18) resolve("miss");
  };

  const onSliderUp = (event) => {
    if (phase !== "open" || !toBox) return;
    const root = rootRef.current.getBoundingClientRect();
    const px = event.clientX - root.left;
    const py = event.clientY - root.top;
    const nearEnd = Math.hypot(px - toBox.cx, py - toBox.cy) <= 28;
    resolve(nearEnd ? judge(performance.now() - hitAt.current, speed) : "miss");
  };

  const onSpinMove = (event) => {
    if (!box) return;
    const root = rootRef.current.getBoundingClientRect();
    const next = { x: event.clientX - root.left, y: event.clientY - root.top };
    const prev = spin.current.prev;
    spin.current.prev = next;
    if (!prev) return;
    spin.current.acc += Math.abs(spinDelta(prev, next, { x: box.cx, y: box.cy }));
    if (spin.current.acc >= Math.PI * 2) {
      resolve(judge(performance.now() - hitAt.current, speed));
    }
  };

  if (!beat || !box) return null;
  const remaining = Math.max(0, hitAt.current - performance.now());
  const approachScale = 1 + (remaining / approach) * 2.2;
  const windowAttr = phase === "open" ? String(windows.ok) : undefined;
  const hitAttr = phase === "open" ? "open" : "approach";

  if (beat.type === "slider" && toBox) {
    const x1 = box.cx;
    const y1 = box.cy;
    const x2 = toBox.cx;
    const y2 = toBox.cy;
    return (
      <div className="osu-layer" aria-hidden={false}>
        <svg className="osu-slider">
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className={`osu-slider-path${beat.illegal ? " is-illegal" : ""}`}
          />
        </svg>
        <button
          type="button"
          className="osu-slider-hit"
          data-hit={hitAttr}
          data-window={windowAttr}
          style={{
            left: Math.min(x1, x2) - 16,
            top: Math.min(y1, y2) - 16,
            width: Math.abs(x2 - x1) + 32,
            height: Math.abs(y2 - y1) + 32,
          }}
          onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
          onPointerMove={onSliderMove}
          onPointerUp={onSliderUp}
        >
          slide the corridor
        </button>
      </div>
    );
  }

  const size = Math.max(64, box.w, box.h);
  return (
    <div className="osu-layer">
      <i
        className={`osu-approach${beat.type === "spinner" ? " is-spin" : ""}`}
        style={{
          left: box.cx,
          top: box.cy,
          width: size,
          height: size,
          transform: `translate(-50%, -50%) scale(${approachScale})`,
        }}
      />
      <button
        type="button"
        className={`osu-circle${beat.type === "spinner" ? " is-spin" : ""}`}
        data-hit={hitAttr}
        data-window={windowAttr}
        style={{ left: box.cx - size / 2, top: box.cy - size / 2, width: size, height: size }}
        onClick={beat.type === "spinner" ? undefined : onCircle}
        onPointerMove={beat.type === "spinner" ? onSpinMove : undefined}
        aria-label={beat.type === "spinner" ? "spin to approve" : "hit"}
      />
    </div>
  );
}

function ProgramGraph({ program, mode, combo, score, counts, hp, beat, beatKey, expandedId, onVerdict, onToggleExpand }) {
  const flow = useMemo(() => documentToFlow(program.doc), [program]);
  const [nodes, setNodes, onNodesChange] = useNodesState(flow.nodes);
  const [edges, setEdges] = useEdgesState(flow.edges);
  const rootRef = useRef(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0, trail: [] });
  const speed = speedForCombo(combo);
  const playing = mode === "play";

  useEffect(() => {
    setNodes(
      flow.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          expanded: node.id === expandedId,
          onToggleExpand,
        },
      })),
    );
  }, [flow, expandedId, onToggleExpand, setNodes]);

  useEffect(() => {
    setEdges(flow.edges);
  }, [flow, setEdges]);

  const onPointerMove = (event) => {
    if (!playing) return;
    const root = rootRef.current.getBoundingClientRect();
    const x = event.clientX - root.left;
    const y = event.clientY - root.top;
    setCursor((prev) => {
      const trail = [...prev.trail, `${x},${y}`].slice(-14);
      return { x, y, trail };
    });
  };

  return (
    <div
      className={`aodl-playfield${playing ? " is-play" : " is-explore"}`}
      ref={rootRef}
      onPointerMove={onPointerMove}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.24, minZoom: 0.35, maxZoom: 1.1 }}
        minZoom={0.35}
        maxZoom={1.2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={!playing}
        panOnDrag={!playing}
        zoomOnScroll={!playing}
        zoomOnPinch={!playing}
        zoomOnDoubleClick={false}
        panOnScroll={false}
        preventScrolling
        proOptions={{ hideAttribution: true }}
      />
      {playing ? (
        <OsuLayer
          rootRef={rootRef}
          beat={beat}
          beatKey={beatKey}
          speed={speed}
          onVerdict={onVerdict}
        />
      ) : null}
      {playing ? (
        <div className="osu-cursor" style={{ left: cursor.x, top: cursor.y }} />
      ) : null}
      {playing && cursor.trail.length > 1 ? (
        <svg className="osu-trail" aria-hidden="true">
          <polyline points={cursor.trail.join(" ")} />
        </svg>
      ) : null}
      <div className="osu-hud" aria-hidden="true">
        <span className="osu-combo">{combo}x</span>
        <span className="osu-score">{score}</span>
        <span className="osu-acc">{accuracyFrom(counts).toFixed(1)}%</span>
        {speed > 1 ? <span className="osu-faster">FASTER</span> : null}
        <i className="osu-hp" style={{ "--hp": hp }} />
      </div>
    </div>
  );
}

function ProgramShell({ program, open, onOpen, onClose }) {
  const flow = useMemo(() => documentToFlow(program.doc), [program]);
  const hits = useMemo(() => playHitsFromFlow(flow), [flow]);
  const [mode, setMode] = useState("play");
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(1);
  const [beatIndex, setBeatIndex] = useState(0);
  const [counts, setCounts] = useState({ perfect: 0, great: 0, ok: 0, miss: 0 });
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!open) {
      setMode("play");
      setCombo(0);
      setScore(0);
      setHp(1);
      setBeatIndex(0);
      setCounts({ perfect: 0, great: 0, ok: 0, miss: 0 });
      setExpandedId(null);
    }
  }, [open]);

  const onToggleExpand = useCallback((id) => {
    setExpandedId((current) => (current === id ? null : id));
  }, []);

  const onVerdict = useCallback((verdict) => {
    setCounts((current) => ({ ...current, [verdict]: current[verdict] + 1 }));
    setScore((current) => current + scoreFor(verdict));
    setCombo((current) => comboAfter(current, verdict));
    setHp((current) => (verdict === "miss" ? Math.max(0, current - 0.16) : Math.min(1, current + 0.05)));
    setBeatIndex((current) => current + 1);
  }, []);

  const speed = speedForCombo(combo);
  const beat = hits.length ? hits[beatIndex % hits.length] : null;

  if (!open) {
    return (
      <button
        type="button"
        className="aodl-program-core"
        data-program={program.id}
        onClick={onOpen}
      >
        <CapabilityCore compact level={program.core} state="running" />
        <span>{program.label}</span>
      </button>
    );
  }

  return (
    <div
      className="aodl-program-shell"
      data-program={program.id}
      data-combo={String(combo)}
      data-speed={String(speed)}
    >
      <header className="aodl-program-chrome">
        <strong>{program.label}</strong>
        <span className="aodl-program-kinds">{flow.kinds.join(" · ") || "typed graph"}</span>
        <button type="button" data-mode="explore" aria-pressed={mode === "explore"} onClick={() => setMode("explore")}>
          Explore
        </button>
        <button type="button" data-mode="play" aria-pressed={mode === "play"} onClick={() => setMode("play")}>
          Play
        </button>
        <button type="button" onClick={onClose}>
          Collapse to core
        </button>
      </header>
      <ReactFlowProvider>
        <ProgramGraph
          program={program}
          mode={mode}
          combo={combo}
          score={score}
          counts={counts}
          hp={hp}
          beat={mode === "play" ? beat : null}
          beatKey={`${program.id}-${beatIndex}`}
          expandedId={expandedId}
          onVerdict={onVerdict}
          onToggleExpand={onToggleExpand}
        />
      </ReactFlowProvider>
    </div>
  );
}

export function OrchestrationCanvas() {
  const [openId, setOpenId] = useState(null);
  return (
    <section className="aodl-pretotype" aria-labelledby="aodl-pretotype-title">
      <h2 id="aodl-pretotype-title">Pretotype</h2>
      <p>
        Cores are the visual decoder, not the IR. Expand one into a typed graph.
        Play is a timing controller: approach circles, sliders on constraining edges,
        a spin on <code>humanGate</code>. Observation never schedules. Combo raises speed
        so the windows shrink — precision is how you move faster.
      </p>
      <div className="aodl-playfield-stage">
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
