# Hermes compiler profile

Hermes is the **backend** (Kanban, profiles, A2A). It is not a control room and not this repository's scheduler. o8 is a control room (`harnesses/catalog.json` `kind: control-room`) and never `executor.harness`. Hermes *is* an executor id, and this profile compiles a valid HOTL 0.2 document into a read-only Kanban `plan`.

Upstream IR issue: [NousResearch/hermes-agent#88589](https://github.com/NousResearch/hermes-agent/issues/88589). Do not open a duplicate. Canonical Kanban remains Hermes. This tree predicts task ids; it does not create cards, spawn a CLI, or start `keel.service`.

Proof: `python3 compiler/hermes.py examples/valid/hermes-dry-run.json` and `python3 tests/compile.py`.

## Sequence

Normalize intent (do not hash-rewrite the fixture) → static `tests/validate.py` → dry-run plan → map nodes to Kanban task ids / parent dependencies / review children. Status leaves `dry-run-unclaimed`. Unsupported **message**, mesh, **auction**, and payment stop compilation (`⊥`).

The three objects stay distinct. Dry-run emits `plan`. It does not overwrite `intentGraph`. It does not invent `eventLog` / observed $\mathcal{O}_t$.

## Mapping

| HOTL 0.2 | Hermes dry-run |
|---|---|
| node `id` | Kanban task id `t_` + 8 hex, stable on `(sourceHash, node id)` |
| `dependency` | parent list on the target task |
| `verification` / `critique` → `verifier` | review children on the source task |
| `executor.harness` | bind catalog id (`hermes`, `omp`, `codex`, …); unknown / `control-room` already fail closed in the validator |
| `humanGate` | not a review child. Merge / deploy / approve |
| `verifier` | review, not the gate |
| `data` into `memory` / `tool` | not a parent; allowed on the intent-contract loop |
| `observation` | learning / C(RAID) D→R; not a parent |
| `delegation` | not a Kanban parent |
| `message` | **stop** |
| mesh silhouette or `policies.kinds` `mesh` | **stop** (no HOTL kind named mesh; peer density is visualization-only) |
| `policies.kinds` / `policies.auction` | **stop** |
| payment / privileged grant | **stop** (validator, then compiler) |

`humanGate` ≠ `verifier`. Ask the human only when expected information gain is worth the interrupt. Attention is `constraints.budgets.attention` — declared, not spend. There is no widget and no Ripple in this tree.

Capability-aware routing is **not** a router here. The compiler binds `executor.harness` from `harnesses/catalog.json` and fails closed on unknown ids. Contextual memory, ephemeral UI, learning, modalities, physical execution, and distillation are other planes.

## Fixtures

| File | Role |
|---|---|
| `examples/valid/hermes-dry-run.json` | claimed dry-run plan (pipeline + `harness: hermes`) |
| `examples/valid/intent-loop.json` | intent-contract loop; plan claimed by this compiler |
| `examples/valid/market.json` | valid IR, compile ⊥ (auction) |
| `examples/compile-stop/message.json` | valid IR, compile ⊥ (message) |
| `examples/compile-stop/mesh.json` | valid IR, compile ⊥ (peer data clique) |
| `examples/invalid/payment-execution.json` | invalid IR, compile ⊥ (payment) |

## Not this repo

| Plane | Owns | Do not pull into AODL |
|---|---|---|
| Hermes | Kanban, memory, runtime | a second Kanban or `hermes` process |
| o8 | control room | `o8` as `executor.harness` |
| Ripple | Dash-consumed ephemeral intent surface | widgets, orbs, S-Pen as a product |
| Keel | `humanGate` receipts (L0) | a second auth system |
| Kerdoios | where work runs | speculative execution compiler |
| Jev | typed probabilistic decisions | TypeSafe System One; not a harness id |

Reject: HOTL 0.3 fields (`fail` event, `openQuestions`, sheaf JSON), `langchain` / `llm` / `jev` harness ids, spawning Hermes from this compiler.
