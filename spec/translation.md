# Translation — visual language ⇀ HOTL 0.2

Status: **normative join**. Machine copy: [`encodings/ir-map.json`](../encodings/ir-map.json). Human copy: this file. The live catalog renders both as KaTeX and as React from that JSON.

The design language is a **decoder of declared metadata**. It is not a second IR. Solarpunk / HomeForge `PAGE-ZEROS-AGENT-CORES` consumes `encodings/visual.json`. It does not own topology ids.

## 1. Two languages

| Language | Form | What it is |
|---|---|---|
| AODL / HOTL 0.2 | JSON IR + EBNF sugar | typed orchestration \(\mathcal{O}_t\) |
| Visual | hue, geometry, orbits, silhouette, rune, cadence, perimeter | decoder of *declared* fields |

They share ids only through \(\tau\).

## 2. Formal object (AODL)

An orchestration at logical time \(t\) is

$$
\mathcal{O}_t = (V_t, E_t, S_t, \Pi_t, \Gamma_t)
$$

| Symbol | Meaning | JSON |
|---|---|---|
| \(V_t\) | agents, models, tools, humans, memories, environments, tasks, artifacts | `intentGraph.nodes` |
| \(E_t\) | typed relations | `intentGraph.edges` |
| \(S_t\) | runtime state | observed events / receipts — not the document |
| \(\Pi_t\) | routing / execution / allocation policy | `policies` |
| \(\Gamma_t\) | goals, constraints, budgets, verification, human gates | `constraints` + `humanGate` |

Three objects, never substituted:

$$
\text{intent} \;\neq\; \text{plan} \;\neq\; \mathcal{O}_t^{\mathrm{obs}}
$$

| Object | Owner |
|---|---|
| Intent | AODL document |
| Compiled plan | compiler profile (Hermes Kanban, Firstmate ship, …) |
| Observed \(\mathcal{O}_t\) | events + receipts |

A glowing core is none of these. A Dash `/roster` is observed \(V\), not \(\mathcal{O}_t\).

## 3. Translation \(\tau\)

\(\tau\) is **partial**. Fail closed is \(\bot\).

$$
\tau : \mathsf{Visual} \rightharpoonup \mathsf{HOTL}_{0.2} \cup \{\bot\}
$$

$$
\tau(\mathsf{silhouette}) =
\begin{cases}
(\Pi, E) & \text{if }\texttt{status}=\texttt{expressible} \\
\bot & \text{if }\texttt{status}\in\{\texttt{not-inferred},\texttt{unspecified}\} \text{ or id unknown}
\end{cases}
$$

The inverse, from policy kind to a *display* silhouette, is also partial:

$$
\tau^{-1} : \Pi_t.\mathsf{kinds} \rightharpoonup \mathsf{silhouette} \cup \{\bot\}
$$

Machine table: `fromHotl` in `ir-map.json`.

| \(\Pi_t\) kind | \(\tau^{-1}\) | Notes |
|---|---|---|
| `sequence` | `pipeline` | also covers `solo`, `paired`, `ring` when those edges are declared |
| `fanout` | `parallel` | `mesh`, `star` need every peer/hub edge declared |
| `reducer` | `cluster` | |
| `recursion` | `hierarchy` | finite `maxChildren` / `maxDepth` |
| `auction` | `marketplace` | allocation policy, not a product; payment unsupported |
| `human_gate` | `supervisor` | requires an explicit `humanGate` node |
| `retry` | \(\bot\) | modifier on a sequence; no silhouette |
| `blackboard` | `blackboard` | node kinds `memory` / `stateStore`, not a topology kind |

\(\tau^{-1}\) is a **display hint**. It never infers missing edges. Compiling a document still requires the listed `policies.kinds` *and* the typical edges in `topologies[id]`.

## 4. Channel map (visual ↛ topology)

Visual channels other than topology **do not** become HOTL kinds.

| Channel | Visual | \(\tau\) | \(\mathcal{O}_t\) | Compile |
|---|---|---|---|---|
| Provider | outer hue family | \(\bot\) | — | `none` |
| Model | core geometry | \(\bot\) | — | `none` |
| Effort | orbit count + energy | declared `constraints.budgets` | \(\Gamma_t\) | `declared-only` |
| Topology | coordination silhouette | `policies.kinds` + declared edges | \(\Pi_t + E_t\) | `ir-map` |
| Operating mode | temporal rune | \(\bot\) | — | `none` (not in HOTL 0.2) |
| State | cadence + marker | \(\bot\) | observed \(S_t\) | `none` |
| Economics | value-score perimeter | declared `constraints.budgets` | \(\Gamma_t\) | `declared-only` |

Rules:

1. Hue never becomes a node kind. Geometry never becomes a node kind.
2. Orbits and the economics perimeter are declared budget, never spend evidence. Dashed = unmeasured.
3. Runtime cadence is observed \(S_t\). It is not intent.
4. Operating-mode runes (copilot, overnight, tournament) are **not** `policies.kinds`.
5. Shape is a declared coordination class. Density of a drawing is not connectivity.

## 5. Silhouettes that stay \(\bot\)

| Id | Status | Why |
|---|---|---|
| `swarm` | `not-inferred` | needs finite `maxChildren`, `maxDepth`, reserved budget. The dots are not a kind. |
| `hybrid` | `not-inferred` | unlabeled union is invalid. The named program is **C(RAID)**. |
| `unknown` | `unspecified` | decoder stays dashed; validator does not invent a class. |

C(RAID) is not a silhouette. Required kinds:

```json
["sequence", "retry", "fanout", "reducer", "human_gate"]
```

\(D \to R\) is `observation`, never `dependency`. Spec: [`craid.md`](craid.md). Fixture: `examples/valid/craid.json`. A hybrid badge is not C(RAID).

## 6. What this is not

- A second scheduler
- A compilation of provider hue into executor identity
- Inference of consensus, intelligence, health, or payment from a drawing
- Ownership of ids by zerOS / HomeForge

Proof: `python3 tests/validate.py` checks that visual ids, graph ids, and this map are the same set; that `swarm` stays `not-inferred`; that `hybrid` stays `not-inferred`; that marketplace is `auction` with payment unsupported.
