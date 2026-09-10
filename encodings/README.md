# Encodings — the join table

This directory is the **only** allowed link between HOTL/AODL IR and the visual language.

| File | Role |
|---|---|
| `visual.json` | Design-language catalog (provider hue, model geometry, effort, topology silhouette, mode rune, runtime cadence). Canonical copy of the zerOS `agent-encodings` contract. |
| `topology-graphs.json` | Node/edge coordinates for each silhouette. Presentation only. |
| `ir-map.json` | Visual topology id → HOTL 0.2. Fail closed on unknown ids. |

## Rules

1. Shape is a **declared** coordination class. Never infer `swarm`, consensus, intelligence, provider, or health from a drawing.
2. Visual channels `provider`, `model`, `effort`, `operatingMode`, `state`, `economics` are **not** HOTL fields. They may appear beside a graph; they do not compile into one.
3. `ir-map.json` `status`:
   - `expressible` — there is a HOTL compilation (example fixture when one exists)
   - `not-inferred` — silhouette exists; compiling it requires extra declared policy (swarm, hybrid)
   - `unspecified` — topology was not reported
4. Marketplace is `policies.kinds: ["auction"]` (allocation policy $\Pi_t$), not a topology product. Payment stays unsupported.
5. `hybrid` stays `not-inferred`. The named program is **C(RAID)** (`spec/craid.md`, `examples/valid/craid.json`). A hybrid badge is not C(RAID).
6. zerOS / HomeForge consumes `visual.json`. It does not own new topology ids. Add ids here first.

`python3 tests/validate.py` checks the join table as well as IR fixtures.
