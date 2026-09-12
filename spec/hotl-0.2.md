# HOTL/AODL 0.2 — research specification

Human-facing equations and stack: [`docs/working-note.md`](../docs/working-note.md). This file is the long ASCII dump. GitHub will not typeset `O_t` here.

## Executive synthesis
Prior art covers most mechanics (typed graphs, workflow execution, durable events, policy engines, provenance, telemetry, agent messaging). The missing layer is not “a graph”: it is a vendor-neutral, typed ontology and interchange contract that keeps desired topology, compiled plan, observed runtime, authority, evidence, and human approval distinct. HOTL should therefore be a specification/IR and validator, not a second scheduler.

Build first: versioned IR + canonical hashing + static validator + read-only Kanban projection + dry-run compiler. Research first: dynamic mutation semantics, assurance-preserving equivalence, token economics, and transferable graph-control policies.

## Naming and scope
`HOTL` is retained for continuity with 0.1; `AODL` is a possible future public name. Neither is asserted collision-free. Wire IDs use `hotl-0.2`. Core excludes vendor/model names, payment execution, hidden authority, and transport assumptions.

## Literature / open-source audit (primary sources)
| Area | Reuse | Mismatch / new layer | Sources (version/status) |
|---|---|---|---|
| property/temporal graphs | node/edge identity, labels, intervals | agent ports, authority and assurance are semantic, not merely properties | Angles, “The Property Graph Database Model”, Information Processing Letters 2008, doi:10.1016/j.ipl.2005.05.001 |
| Petri nets/statecharts/BPMN/SCXML | transition, guard, token, lifecycle, visual notation | model/tool/human/evidence ontology and dynamic spawn | OMG BPMN 2.0 (2013), SCXML 1.0 (W3C 2015), Petri net survey portal |
| actor/CSP/session types/capabilities | mailbox, supervision, protocol compatibility, authority discipline | shared state, evidence and heterogeneous model execution | Hewitt et al. actor model CACM 1973 doi:10.1145/359576.359585; W3C WebRTC? (analogy only); session-type literature |
| CWL/WDL/workflow engines | typed inputs, retries, reproducibility, durable execution | LLM uncertainty, human gates, dynamic topology and verifier independence | CWL v1.2; WDL 1.2; Argo Workflows docs; Temporal docs; AWS ASL |
| FIPA ACL/Contract Net/KQML | performatives, announce/bid/award/execute | trust, evidence, capability non-escalation and no autonomous payment | FIPA SC00061, Contract Net SC00029 (2000); KQML specification (1993) |
| policy | deny-by-default evaluation and constraint expressions | binding policy to graph mutation and evidence | OPA/Rego; Cedar; CEL; JSON Logic |
| provenance/telemetry | causal records, trace/span links, cloud events | canonical graph snapshots and assurance claims | W3C PROV-DM (2013); OpenTelemetry 1.x; CloudEvents 1.0 |
| agent runtimes | state graphs, handoffs, tools, memory, multi-agent abstractions | interoperability and common authority/data/evidence semantics | LangGraph docs; AutoGen; CrewAI; Semantic Kernel; OpenAI Agents SDK; Google ADK |
| protocols | tool/resource discovery and agent-to-agent task exchange | protocol ≠ orchestration IR; capability mapping remains adapter-specific | MCP specification (current); A2A specification (current) |
| planning/control | PDDL/HTN operators, RL MDP/POMDP vocabulary, graph control | stochastic model behavior and real-world assurance | PDDL 2.1; HTN planning literature; RL benchmarks |
| recursive context/computation | recursion and context slicing are useful mechanisms | RLM is adjacent research, not proof of dynamic graph interchange | verify against the exact RLM paper/repository before citing; do not claim direct prior art |

Framework reuse estimate is a hypothesis (roughly 60–80% infrastructure), not a measured result. Licenses and current versions must be rechecked before implementation; this report intentionally does not imply compatibility from a URL alone.

## Hermes-native temporal prior art: Starmap / learning graph
The current upstream tree contains a real Hermes-native precedent, not merely a design idea. Read-only audit at commit `32226a6518` (2026-08-17 snapshot):

| Memory graph concept | Exact source | HOTL mapping | Decision |
|---|---|---|---|
| on-demand overlay and profile graph load | `apps/desktop/src/app/starmap/index.tsx`, `store/starmap` | observed graph query/projection | reuse interaction convention; adapt source identity |
| node `{id,kind,timestamp}` and edges | `apps/desktop/src/types/hermes`, `app/starmap` | typed node/event + relation | adapt; memory/skill edges are not dependency/control/message |
| `computeRecency` min/max timestamp, ordinal fallback | `apps/desktop/src/app/starmap/time-axis.ts:22-53` | temporal normalization for `O_0…O_T` | reuse algorithm, rename `recency` to explicit time coordinate |
| `LEAD_IN=0.06` | `time-axis.ts:8-9` | presentation-only origin padding | reuse visually, never semantic time origin |
| rings and force radial layout | `apps/desktop/src/app/starmap/simulation.ts:256-295` | temporal visualization | adapt; preserve edge-type styling and avoid radius ambiguity |
| scrubber histogram/date interpolation | `time-axis.ts:75-105` | snapshot/event replay UI | adapt for event offsets and wall-clock separately |
| GPU canvas renderer and node sprites | `app/starmap/render.ts`, `star-map.tsx` | large graph projection | reuse conventions; benchmark occlusion/mobile/a11y |
| terminal rendition | `agent/learning_graph_render.py:1-109` | textual/phone-safe decoder | reuse age gradient and deterministic fallback only |
| `/journey` aliases and tests | `desktop-slash-commands.ts:201`, `desktop-slash-commands.test.ts:166` | discoverability/accessibility precedent | reuse command/overlay testing pattern |

Observed implementation facts: radius is a linear timestamp bucket (oldest→innermost after a 6% lead-in; newest→outermost); missing timestamps use stable ordinal ordering; co-timed nodes share a ring and fan by deterministic angle; links are rendered only after endpoint lookup. The overlay supports loading, empty and error states plus import/reset. The repository has unit tests for command routing and profile-cache invalidation; no evidence in this audit establishes that the graph is canonical persistence. The graph is a projection loaded from a store, while learning/memory persistence remains the source of truth. Treat it as a native experimental/product visualization component, not an event ledger.

Reuse is sound for a shared temporal coordinate, scrubber, replay affordance, deterministic fallback, rendering conventions and accessible textual decoder. It is misleading to reuse radius as universal time when HOTL has multiple clocks (logical event sequence, validity interval, wall clock), to imply edges mean the same thing, or to promise readability at large node counts/mobile sizes. HOTL should label the axis and clock, permit slices/aggregation, expose a list/table, preserve semantic edge types, and keep snapshot hashes independent of layout. A future shared primitive should accept an explicit `timeDomain`, `origin`, `scale`, and `unknownTimePolicy`; it must not silently import memory semantics.

## Formal object and state separation
`O_t=(V_t,E_t,S_t,Pi_t,Gamma_t)` is the observed graph at logical time t. A document contains `intentGraph`, `policies`, `constraints`, `provenance`; a compiler emits a separate immutable `plan`; a runtime emits an append-only `eventLog` and `observedGraph`. Never substitute plan or observation for intent.

Events have `{eventId,type,candidateId,sourceHash,revision,causalParents,actor,logicalTime,payload}`. Idempotency is `(type,candidateId,sourceHash,revision)`; same key/different content is conflict. Snapshots record event offset and state hash. Replay applies events in causal order and rejects unknown revisions, duplicate conflicting IDs, unauthorized mutations, and nonce reuse.

Nodes minimally distinguish task, executor, model, tool/service, memory/stateStore, humanGate, environment/sandbox, artifact, verifier. Each has lifecycle `declared→ready→running→succeeded|failed|cancelled`, ports, capability declarations and authority ceiling. A model is not automatically an executor; an edge never grants authority implicitly.

`humanGate` is the irreversible action (merge, deploy, approve). Review is a `verifier` and may be an orchestrator. Delegating review is a `verification` or `critique` edge; it does not transfer gate identity. A verifier with a merge grant is invalid. A `delegation` of `humanGate` identity onto an executor is invalid.

An executor node may name a supported id from `harnesses/catalog.json` with `harness`. The catalog row must have kind `executor`; control rooms compile graphs and are not nodes in them.

A document may include optional top-level `observedGraph` with the same shape as `intentGraph`. Runtimes emit `eventLog` and `observedGraph`. Never substitute plan or observation for intent. A mission that is a list of packets is many components with no invented `dependency`. Isolation is a degree-0 orphan, not a requirement that the document be one DAG.

Edges require relation, source/target port, cardinality, data schema/classification, authority grant/delegation depth, guard, delivery/order/idempotency, timeout/retry/backpressure, resource limits, evidence requirement, provenance and validity interval. Data and control are separate relations.

## Safe operational core
A configuration transition is `C --a--> C'` only if schema/type checks, policy guard, capability ceiling, budget reservation and event nonce pass. Deterministic primitives: sequence, bounded parallel/fan-in, explicit reducer, bounded retry, explicit human gate. Nondeterministic: router tie-breaks, race winner, model output, auction bids, external observations; record seed/tie policy or classify replay as observational only. Dynamic spawn requires finite `maxChildren`, authorized parent, unique idempotency key and resource reservation. Unbounded recursion is invalid. Liveness/deadlock and general equivalence are undecidable in the general case; validator reports `unknown` rather than accepting a guarantee.

Policies include static route, router, supervisor, planner-executor, sequence/parallel/race/fanout/reducer, handoff/debate/quorum, bounded recursion, blackboard, retry/replan/critic, human approval, and market allocation. A market is policy, not topology: announce→bid→award→execute→verify→settle. Bid fields are price, cost, time, quality/confidence, capabilities, terms. Trust, escrow/payment and contract boundaries are explicit; autonomous finance/account actions are unsupported.

Gamma contains objective, acceptance predicate, capability/privacy constraints, declared token/time/money/energy/rate budgets, observed spend (separate), evidence/review/HITL gates, failure/escalation, termination and confidence. Declared budget is never evidence of spend.

## Gap matrix
| Requirement | Existing coverage | Decision |
|---|---|---|
| typed ports/data | CWL/WDL/session types | adapt with classification + agent roles |
| durable events/replay | Temporal/CloudEvents/PROV | adapt; add canonical graph mutation events |
| authority | Cedar/OPA/capability systems | adapt; bind to edges and delegation depth |
| dynamic spawn | workflow loops/actors | new bounded mutation contract |
| verifier independence | testing/provenance patterns | new normative invariant |
| heterogeneous agents/models | MCP/A2A/framework APIs | adapter layer; no lowest common denominator |
| market allocation | FIPA Contract Net/auction literature | policy profile; payment unsupported |
| graph equivalence | bisimulation/trace notions | define multi-axis comparison, not single equivalence |
| human approval | BPMN/Keel-like gates | explicit node + sealed evidence + identity |

## Comparison metrics
Compare systems on structural graph distance; policy trace distance; authority reachability; information visibility/classification; assurance/evidence coverage; resource cost/latency; dynamic mutation behavior and failure recovery. Report per-axis and confidence. Shape equality alone is not behavioral equivalence.

## Identity/factory hypothesis and research
`theta=theta_base+A_identity+A_factory` is an architecture hypothesis, not a learned-model equation. Operationally, A_identity may be private adapters, policy, memory and preferences; A_factory may be reusable orchestration/controller policies. Test with held-out tasks, ablations, privacy leakage tests and transfer—not prose. Keep private personalization outside shared IR.

Factorio/software-factory question: can a controller learn graph edits under constraints and transfer between production-like environments? Define state as typed graph + resources + observations; actions as authorized mutations/routing/allocation; reward as verified throughput minus cost, defects, latency and human attention; constraints as authority, safety, budget and termination. Baselines: static DAG, greedy queue, heuristic supervisor, RL/planner, human policy. Measure correctness, throughput, resource efficiency, resilience, attention and out-of-distribution generalization. Test sim→real drift, delayed rewards, model nonstationarity, adversarial bids and verifier gaming. Falsify transfer if gains vanish under topology/domain shift or violate assurance.

Token efficiency hypothesis: graph slices and trace references reduce context when repeated state is large; IR overhead wins only above a measured break-even. Benchmark full dump vs canonical summary vs query slices across graph size, mutation rate, tool-call count and model context. Measure tokens, latency, cost, task success, missed dependencies and stale-state errors.

## Adapter and Hermes contract
| Target | Category | Boundary |
|---|---|---|
| Hermes Kanban | native/compileable | task IDs and parent dependencies only; canonical Kanban remains scheduler |
| Keel capability/evidence gates | compileable where contract exists | nonce, evidence, HITL identity; fail closed otherwise |
| Hermes runtime observations | projection | map recorded events to observed O_t, never invent data |
| OMP/Pi | unknown until public API/spec audit | projection/compile only where evidenced; no claim from names |
| MCP/A2A | protocol adapter | tool/agent exchange, not full graph semantics |
| LangGraph/AutoGen/etc. | adapter profiles | framework-specific execution, explicit unsupported fields |

Hermes compiler sequence: normalize and hash source; static validate; dry-run plan; map nodes to canonical task IDs/dependencies/review children; require authorized bounded mutation operations; emit receipt; project runtime events back. No second scheduler or ledger. Unsupported message/data/market semantics stop compilation.

## DSL
Readable syntax is sugar only; every authority, data, budget and policy field remains explicit in IR. Example:
```
controller(identity) ->decompose task
auction(task, bidders=[codex, omp, hermes], budget=12USD) ->winner
winner ->execute sandbox ->verify tests
verify.fail ->critic ->retry(max=2)
verify.pass ->human_gate(identity=kevin) ->merge ->memory
```
Names resolve in lexical scopes; unknown names, ambiguous ports, undeclared capabilities, hidden payment, missing bounds and implicit fan-in are errors. Canonical JSON serialization is round-trip stable; comments/formatting are non-semantic.

## Badge decoder and roadmap
Topology glyph derives from normalized class only; explicit marks may show dynamic, recursive, market, shared-memory and independently-verified policies. Runtime state is separate. Small badges show coarse class + text/ARIA decoder; never infer swarm, intelligence, consensus, provider or health.

Roadmap: literature/RFC → IR/schema/validator → read-only Kanban reverse projector → dry-run compiler → bounded authorized mutations → optional adapters → benchmarks. Upstream #88589 already has a privacy-safe parent comment; do not post duplicate or private transcript.

## Direct answer
Prior art: nearly all graph/workflow/event/policy/telemetry machinery. Genuinely new candidate: a conservative cross-runtime ontology tying ports, authority, dynamic mutation, evidence and human gates to one replayable IR. Build validator/projection/compiler first; validate dynamic control, transfer and token claims experimentally before branding them as theory.
