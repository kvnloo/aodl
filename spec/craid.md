# C(RAID) — named hybrid program

C(RAID) is **Continuous** **R**esearch, **A**nalysis, **I**ntegration, **D**eployment.

It is not a new HOTL kind, not a scheduler, and not a silhouette. It is a **named program** in HOTL 0.2: a hybrid of primitives that already exist. Unlabeled `hybrid` stays `not-inferred`. This file is the compilation.

Source of the name: [kvnloo/blueprint](https://github.com/kvnloo/blueprint) (`claudedocs/03-vision/CR-CA-CI-CD.md`, website Pipeline). Legacy orchestration lived in [kvnloo/evolve](https://github.com/kvnloo/evolve) (Claude Flow). Distilled here.

## Why it is hybrid, not pipeline

A pipeline is `sequence` + `retry`. C(RAID) is that **and**:

| Phase | Lived name | HOTL |
|---|---|---|
| **R** | Continuous Research | `fanout` of scouts, bounded |
| **A** | Continuous Analysis | `reducer` + `verification` / `critique` |
| **I** | Continuous Integration | `data` into `memory` / `stateStore` (blackboard) |
| **D** | Continuous Deployment | `control` to an explicit `humanGate` |
| **C** | Continuous (the loop) | `observation` from D back to R |

The loop is the part that looks like a cycle. It is **not** a dependency cycle. `D → R` is `observation` (or `control`). A `dependency` from deploy/captain back to research **fails closed**.

```
product → research ─┬→ scoutA ─┐
                    └→ scoutB ─┴→ analysis → critic → integrate ─┬→ memory
                                                                └→ deploy → captain
                                                                        │
                                   observation ─────────────────────────────┘
```

## Declared policy (required)

```json
"kinds": ["sequence", "retry", "fanout", "reducer", "human_gate"]
```

Every active pattern is listed. That is what makes this hybrid **expressible**. A hybrid drawing without this list does not compile.

Fan-in at analysis is `reducer`. Unbounded scout spawn is the same as any other dynamic graph: finite `maxChildren`, `maxDepth`, reserved budget, or it fails closed. Payment stays unsupported.

## Three objects

| Object | C(RAID) |
|---|---|
| Intent | this document (`examples/valid/craid.json`) |
| Compiled plan | Hermes Kanban / Firstmate ship+scout / Dash spawn — whatever the runtime actually has |
| Observed $\mathcal{O}_t$ | what those workers did |

Reverse-projecting a Claude Flow board or a Firstmate fleet into “C(RAID)” is a lie unless the policy was on the intent.

## Stack (how this becomes Blueprint)

Blueprint is the **goal**: an autonomous product (first slice: autonomous product management). C(RAID) is the **protocol** that gets there. AODL is the **IR** for that protocol. Solarpunk / HomeForge is the **digital twin** (visual cores), not the language.

| Layer | Repo | Job |
|---|---|---|
| Goal | [kvnloo/blueprint](https://github.com/kvnloo/blueprint) | product; PM is step 1 |
| Protocol | this file | R→A→I→D + observation loop |
| IR | `kvnloo/aodl` | validate, do not schedule |
| Constitution | [kvnloo/hermes-keel](https://github.com/kvnloo/hermes-keel) | Hermes L0: default router cannot execute |
| Backend | [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | Kanban / profiles / A2A |
| Distro (optional, Keel L9) | [kunchenguid/firstmate](https://github.com/kunchenguid/firstmate) | captain liaison; `humanGate` → captain-hold |
| Twin | `kvnloo/solarpunk` | cores / living-night; consume `encodings/` |
| Phone | [kvnloo/dash](https://github.com/kvnloo/dash) | observed $V$, not $\mathcal{O}_t$ |

Autonomous PM is this graph over a backlog: research tickets fan out, analysis reduces, integration writes the spec/board, deploy is a gated ship. Firstmate's first mate **must not** do project work (hard rule 1) — that is the same shape as Keel L0, not a second Keel. Do not port `hermes-keel` into Firstmate.

## Fail closed

- Feedback as `dependency` → cycle (`examples/invalid/craid-feedback-cycle.json`)
- Missing `humanGate` on D → this is no longer C(RAID); it is a pipeline
- `swarm` silhouette, Claude Flow “hive”, or a hybrid badge → not inferred
- Evolve / Claude Flow as a second IR → no

Proof of generality: ReAct is `examples/valid/pipeline.json`. C(RAID) is the same primitives plus fan-out, blackboard, and a human gate. Architecture search is search over programs like these two.

Fixture: `examples/valid/craid.json`.
