# Encodings — the join table

This directory is the **only** allowed link between HOTL/AODL IR and the visual language. The map is a partial function \(\tau\). Fail closed is \(\bot\).

Normative write-up: [`spec/translation.md`](../spec/translation.md). Machine copy: `ir-map.json`. Live catalog renders both as KaTeX and as React.

| File | Role |
|---|---|
| `visual.json` | Design-language catalog (provider hue, model geometry, effort, topology silhouette, mode rune, runtime cadence). Canonical copy of the zerOS `agent-encodings` contract. |
| `topology-graphs.json` | Node/edge coordinates for each silhouette. Presentation only. |
| `ir-map.json` | \(\tau\): visual topology id → HOTL 0.2. Unknown ids are \(\bot\). |

## \(\tau\)

$$
\tau : \mathsf{Visual} \rightharpoonup \mathsf{HOTL}_{0.2} \cup \{\bot\}
$$

A silhouette compiles iff `topologies[id].status` is `expressible` **and** the listed `policies.kinds` plus typical edges are declared. `not-inferred` and `unspecified` are \(\bot\).

`fromHotl` is \(\tau^{-1}\) (display hint). `retry` maps to \(\bot\): it is a modifier, not a drawing.

## Rules

1. Shape is a **declared** coordination class. Never infer `swarm`, consensus, intelligence, provider, or health from a drawing.
2. Visual channels `provider`, `model`, `operatingMode`, `state` compile as `none`. They may appear beside a graph; they do not become HOTL kinds.
3. `effort` and `economics` compile `declared-only` onto `constraints.budgets` (\(\Gamma_t\)). Never spend evidence. Dashed = unmeasured.
4. `ir-map.json` `status`:
   - `expressible` — there is a HOTL compilation (example fixture when one exists)
   - `not-inferred` — silhouette exists; compiling it requires extra declared policy (`swarm`, unlabeled `hybrid`)
   - `unspecified` — topology was not reported
5. Marketplace is `policies.kinds: ["auction"]` (allocation policy \(\Pi_t\)), not a topology product. Payment stays unsupported.
6. `hybrid` stays `not-inferred`. The named program is **C(RAID)** (`spec/craid.md`, `examples/valid/craid.json`). A hybrid badge is not C(RAID).
7. zerOS / HomeForge consumes `visual.json`. It does not own new topology ids. Add ids here first.

`python3 tests/validate.py` checks the join table as well as IR fixtures.
