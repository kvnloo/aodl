# LangChain / LangGraph / LangSmith compiler profile

LangChain is a harness around a model loop. LangGraph is the graph runtime those agents sit on. LangSmith is traces. AODL is none of those products. Compilers live next to the runtime. AODL does not become LangGraph's scheduler, and `langchain` is not a harness id.

Export (runtime side): emit HOTL 0.2 from a compiled `StateGraph` plus LangSmith run tree. Acceptance on this side is `python3 tests/validate.py` against the emitted document.

## Mapping

One-to-one onto **existing** HOTL 0.2. No new node kinds. Hue, geometry, tournament runes, and graph drawings do not compile.

| Lang* | AODL |
|---|---|
| `create_agent` / model + tools harness | compiler profile — never `executor.harness` |
| ChatModel / `init_chat_model` | `model`, or `executor` + a **catalog** harness if that process is what runs |
| Tool / StructuredTool | `tool` |
| Retriever / store | `memory` / `stateStore` |
| LCEL `a \| b \| c` | `policies.kinds: ["sequence"]` + `dependency` edges |
| `RunnableParallel` | `fanout` / `parallel` silhouette |
| `StateGraph` | `intentGraph` |
| Node function | a node in `V_t` with declared `kind` |
| Static edge | declared `dependency` or `data` |
| Conditional edge | declared `policies`, not inferred from a drawing |
| `Send` / map-reduce | `fanout` + `reducer` |
| Subgraph | more nodes in the same `intentGraph`. No subgraph kind. |
| `interrupt()` / HITL | `humanGate` when the act is irreversible (merge / deploy / approve) |
| Review / critique inside a node | `verifier` + `verification` / `critique`. Not the gate. |
| Checkpointer / `thread_id` | `stateStore` |
| `Command(resume=…)` | resume is observed `S_t`, not a new relation |
| LangSmith run tree / `stream_events` | `eventLog` + `observedGraph` |
| Callbacks | `observation` edges, not a fourth object |

`langchain` never appears as `executor.harness`. There is no `langgraph`, `langsmith`, `interrupt`, or `checkpoint` node kind.

## Cycles and conditionals

LangGraph agent loops (model ↔ tools) are **not** `dependency` circuits. Dependency cycles fail closed. A ReAct loop is `message` and/or `data`. Ring silhouettes are the same rule.

A conditional edge is a declared policy (`fanIn`, `kinds`, explicit `humanGate`), not a hidden `if` recovered from source. AgentFlow-style recovery of a graph from framework code is audit, not authority.

`Send` is dynamic fan-out. It still needs finite `policies.dynamic` when spawn is unbounded. Swarm stays `not-inferred` until those bounds exist.

## `humanGate` ≠ `interrupt()` for review

LangGraph `interrupt()` pauses a thread. AODL's gate is the irreversible action. If the pause is "look at this" / "edit state", that is a `verifier` (or observed `S_t`). If the pause is merge / deploy / approve, that is `humanGate`. Checkpointers keep place; they are not the gate.

Fixture: `examples/valid/langchain-stategraph.json` (model → tool → verifier → humanGate, checkpointer as `stateStore`, no `langchain` harness). Negative: `examples/invalid/langchain-as-harness.json`.
