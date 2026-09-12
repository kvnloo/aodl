# AODL 0.2 — working note

Status: **working note**. Not a preprint. Not on arXiv. Claims that need measurement stay unlabeled.

This is the place that holds the stack together: IR, Keel, visual language, mesh, C(RAID). The machine contract is still `schema/` + `tests/validate.py`. This file is the human contract.

## 1. What this is

Harnesses already exist (Hermes, OMP, Codex, Claude Code, Grok, Pi, fx). They name **nodes**. They do not share a typed description of the graph those nodes sit in.

AODL is that description. Wire id: `hotl-0.2`. Public name: AODL.

It is **not** a scheduler, a Kanban, a payment system, or a glowing core.

## 2. Formal object

An orchestration at logical time $t$ is

$$
\mathcal{O}_t = (V_t, E_t, S_t, \Pi_t, \Gamma_t)
$$

| Symbol | Meaning |
|---|---|
| $V_t$ | agents, models, tools, humans, memories, environments, tasks, artifacts |
| $E_t$ | typed relations: dependency, data, message, delegation, critique, verification, allocation, control, observation, artifact |
| $S_t$ | runtime state (lifecycle, events) |
| $\Pi_t$ | routing / execution / allocation policy |
| $\Gamma_t$ | goals, constraints, budgets, verification, human gates |

The system evolves $\mathcal{O}_0 \rightarrow \cdots \rightarrow \mathcal{O}_T$. Spawning a debugger after a coder fails is a **graph mutation**, not a new English topology name.

Readable DSL is sugar. JSON is the IR. EBNF in [`spec/hotl-0.2.ebnf`](../spec/hotl-0.2.ebnf) is the grammar sketch; [`schema/hotl-0.2.schema.json`](../schema/hotl-0.2.schema.json) is the checkable form.

## 3. Three objects, never substituted

| Object | What it is | Owner |
|---|---|---|
| Intent | declared graph + policies + constraints + provenance | AODL document |
| Compiled plan | what *this* runtime can safely support | compiler profile (Hermes Kanban, Firstmate ship, …) |
| Observed $\mathcal{O}_t$ | what is actually running | `eventLog` + `observedGraph` + receipts |

A Dash `/roster` is observed $V$, not $\mathcal{O}_t$. A glowing core is not a plan. A Kanban board is not intent unless the policy was recorded.

Unsupported semantics **fail closed**. The validator does not infer swarm, consensus, intelligence, payment, or health from a drawing.

`humanGate` is the irreversible action (merge, deploy, approve). Review is a `verifier` and may be an orchestrator. See [`profiles/o8.md`](../profiles/o8.md). The catalog timebound graph is a decoder of declared cores plus `eventLog` / `observedGraph`; it is not a scheduler and it is not an artifact viewer. Clicking a node is the same inspect surface those two will share.

## 4. Stack

```
Blueprint                 goal (autonomous PM first)
    │
C(RAID)                   protocol (named hybrid, spec/craid.md)
    │
AODL                      IR: intent / plan / observed
    │
    ├── Keel              Γ_t + authority. Hermes L0 only.
    ├── Hermes            backend: Kanban, profiles, A2A
    ├── Firstmate         distro (optional Keel L9). Not a harness.
    ├── Dash              phone surface over observed V
    └── Solarpunk         digital twin. Decoder, not the language.
```

| Piece | Repo | Compiles to |
|---|---|---|
| IR | [kvnloo/aodl](https://github.com/kvnloo/aodl) | documents + validator |
| Constitution | [kvnloo/hermes-keel](https://github.com/kvnloo/hermes-keel) | `humanGate`, `authorityCeiling`, privileged grants |
| Backend | [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | Kanban ids, parent deps, review children ([#88589](https://github.com/NousResearch/hermes-agent/issues/88589)) |
| Distro | [kunchenguid/firstmate](https://github.com/kunchenguid/firstmate) | captain-hold on D. Do not port Keel here. |
| Twin | `kvnloo/solarpunk` | `encodings/visual.json` only |
| Phone | [kvnloo/dash](https://github.com/kvnloo/dash) | spawn of catalog ids |
| Notes | [kvnloo/frontier-kb](https://github.com/kvnloo/frontier-kb) | literature, not runtime |
| Goal | [kvnloo/blueprint](https://github.com/kvnloo/blueprint) | product; PM is step 1 |

Ids for executors live in [`harnesses/catalog.json`](../harnesses/catalog.json): `hermes`, `omp`, `o8`, `grok`, `codex`, `claude`, `pi`, `fx`. `firstmate` is a distro. `o8` is a control room.

## 5. Mesh, Keel, language — three different layers

These words keep collapsing. They must not.

### Mesh is declared edges

There is no HOTL kind named `mesh`. A mesh silhouette compiles only if every peer `message` / `data` edge is declared (`encodings/ir-map.json`). Density of a drawing is not connectivity. `swarm` stays `not-inferred` until finite `maxChildren`, `maxDepth`, and a reserved budget exist.

Hermes `keel-mesh` / `mesh.poll` is a **runtime service**. It is not this silhouette. Do not start `keel.service`.

### Keel is $\Gamma_t$ and authority

Keel Level 0: the Telegram-facing default router cannot execute project work. Proof is capability receipts + sealed nonce evidence, not model refusal. AODL `humanGate` and undeclared `payment` / `sudo` compile *to* that invariant. They do not grow a second auth system.

Firstmate hard rule 1 is the same *shape* on a different product: the liaison does not write the project. Do not dump Keel L1–10 into Firstmate.

### Language is a decoder

Living-night cores (hue, geometry, orbits, rune, cadence) are **visual channels**. They are not HOTL fields. The translation is the partial map $\tau$ in [`spec/translation.md`](../spec/translation.md) / [`encodings/ir-map.json`](../encodings/ir-map.json). Shape is a declared coordination class. Provider hue never becomes a node kind. The live catalog ([kvnloo.github.io/aodl](https://kvnloo.github.io/aodl/)) typesets $\mathcal{O}_t$ and $\tau$ in KaTeX and binds the same JSON in React.

Solarpunk draws $\mathcal{O}_t$. It does not define it.

## 6. C(RAID) is the named hybrid

C(RAID) = Continuous Research → Analysis → Integration → Deployment.

Not a new kind. Required `policies.kinds`:

```json
["sequence", "retry", "fanout", "reducer", "human_gate"]
```

| Phase | HOTL |
|---|---|
| R | `fanout` |
| A | `reducer` + `verification` |
| I | `data` into `memory` / `stateStore` |
| D | `control` → `humanGate` |
| C (loop) | `observation` D → R |

A `dependency` on D→R is a cycle and fails closed. Unlabeled `hybrid` stays `not-inferred`. A hybrid badge is not C(RAID).

Autonomous product management is this graph over a backlog. That is Blueprint step 1. Spec: [`spec/craid.md`](../spec/craid.md). Fixture: `examples/valid/craid.json`.

## 7. Where to read the language

| Want | Open |
|---|---|
| Equation on GitHub | this file, and the README (both use `$$`) |
| Live (LaTeX + React) | [kvnloo.github.io/aodl](https://kvnloo.github.io/aodl/) |
| Visual ⇀ IR | [`spec/translation.md`](../spec/translation.md) · [`encodings/ir-map.json`](../encodings/ir-map.json) |
| Grammar | [`spec/hotl-0.2.ebnf`](../spec/hotl-0.2.ebnf) |
| Checkable IR | [`schema/hotl-0.2.schema.json`](../schema/hotl-0.2.schema.json) |
| Research dump (ASCII, long) | [`spec/hotl-0.2.md`](../spec/hotl-0.2.md) |
| Pipeline of intent → plan → observed | [`spec/architecture.mermaid`](../spec/architecture.mermaid) |
| Named hybrid | [`spec/craid.md`](../spec/craid.md) |
| C(RAID) R-phase capture (2026-09-11) | [`research-craid-20260911.md`](research-craid-20260911.md) |
| Branch previews | [kvnloo.github.io/aodl/preview/](https://kvnloo.github.io/aodl/preview/) |
| o8 compiler profile | [`profiles/o8.md`](../profiles/o8.md) |
| LangChain / LangGraph / LangSmith profile | [`profiles/langchain.md`](../profiles/langchain.md) |
| Proof | `python3 tests/validate.py` |

There is **no** `.tex` source and **no** PDF in this repository. GitHub Flavored Markdown with `$` / `$$` is the typeset form until a compiler dry-run exists.

## 8. What would make a paper later

Prior art already covers graphs, workflows, actors, auctions, provenance, and policy engines. The honest candidate is a **conservative interchange**: ports, authority, bounded mutation, evidence, and human gates in one replayable IR that existing harnesses can compile.

A paper is premature until at least:

1. Hermes dry-run compiler (intent → Kanban ids + deps; message/mesh/auction stop compilation)
2. Keel profile (`humanGate` → L0 receipts; router cannot be an `execute` node)
3. One measured claim (token-slice break-even, or transfer of a controller policy) that can fail

Until then this note, the schema, and the fixtures *are* the language.

## 9. Research capture (not a paper)

A 2026-09-11 C(RAID) R-phase pass is [`research-craid-20260911.md`](research-craid-20260911.md). It does not change the schema. Closest academic cousins: $\lambda_A$ (intra-node calculus), Pact/MPST (message choreography), sheaf readings of the three objects, RLM/rate-distortion for slices, Evo-Bench for search over programs. Protocol layers MCP / A2A / AG-UI stay adapters. Frontier-kb holds the literature notes. A paper is still premature until §8.

Catalog **Readings** and **Adapters** sections are on the language page (no schema change). The 100-wide competitor join stays in Dash `docs/research/competitors-100-20260911.md` and frontier-kb `inbox/cursor/`. Same conclusion: cousins and ports, not HOTL 0.3 kinds. Keyword search bleeds astrophysics and municipal-water papers; the join table is the filter.
