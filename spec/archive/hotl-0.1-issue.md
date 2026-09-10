# Proposed upstream issue: HOTL: typed topology IR and honest badge decoder (#88580 follow-up)

Related: #88580, #88061

Hermes currently has strong execution primitives (Kanban parent/child dependencies, runs, leases, retries, review lanes, goal/judge loops, profiles, and evidence gates), but no canonical machine-readable vocabulary for describing an agent network. Terms such as `swarm`, `mesh`, `hierarchy`, `orchestrator`, and `council` conflate graph shape, control policy, communication, role, runtime state, and placement. A badge without a decoder can imply guarantees Hermes does not provide.

Proposal: docs/spec first, provisionally HOTL 0.1 (name open for maintainer feedback). The core IR has typed nodes and edges, explicit ports, fan-in/dynamic-fanout policies, coordination substrate, assurance requirements, provenance, annotations, and observations. It classifies from normalized graph + policy and permits composite labels; it never infers swarm/intelligence/consensus from a drawing.

Minimal example:
```json
{"specVersion":"0.1","graphId":"research-fanin","nodes":[{"id":"r1","role":"worker"},{"id":"synth","role":"orchestrator"}],"edges":[{"id":"e","from":"r1","to":"synth","kind":"dependency"}],"policies":{"fanIn":"all","coordination":"ledger","dynamicFanOut":{"allowed":false,"maxChildren":0}},"provenance":{"source":"example","sourceHash":"<sha256>"}}
```

Safe Kanban subset: one task per node; dependency edges become parent lists; explicit review nodes become review children; bounded goal loops use existing goal/judge mechanisms; dry-run receipts include source hash/version and idempotency keys. Data/message/blackboard/auction/ring/mesh constructs are visualization-only until Hermes has a real runtime contract. Reverse projection reports only structural facts and marks policies unknown.

Validation rejects implicit cycles, ambiguous fan-in, unbounded spawn, illegal self edges, unreachable nodes, hidden privileged actions, incompatible ports, and unsupported guarantee claims. Badge glyphs show topology only; state is a separate marker and accessible text.

Requested maintainer decision: should this live first as docs/spec, a shared schema module, or a future Kanban API? Proposed phases: schema/docs → validator → read-only projector → dry-run compiler → earned execution subset. Non-goals: scheduler, graph runtime, execution-authority changes, or ranking agents.

Standards surveyed include BPMN 2.0, Petri nets, CWL/WDL, Argo/Tekton, Temporal/Step Functions, actor model, LangGraph, AutoGen, Semantic Kernel, OpenAI Agents, MCP and A2A. None is a universal agent-topology naming standard; each formalizes a different slice.

Intent: `kvnloo` (assignment may be unavailable; please advise if issue ownership is preferred).
