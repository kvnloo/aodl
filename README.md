# AODL

**Agent Orchestration Description Language** — a typed IR for agent graphs.

Public name: **AODL**. Wire identifier: **`hotl-0.2`** (Hermes Orchestration Topology Language, kept for continuity with [NousResearch/hermes-agent#88589](https://github.com/NousResearch/hermes-agent/issues/88589)).

This repository has two packages: a **specification** (schema + fail-closed validator) and a **design language** (living-night cores + topology silhouettes). It is not a scheduler, runtime, or payment system.

## Why

Harnesses describe **nodes** (Codex, OMP, Hermes, humans, tools) and then wave at the topology with English: swarm, mesh, supervisor, marketplace. Two systems can share a label and have different computational structure.

An orchestration at logical time \(t\) is

\[
\mathcal{O}_t = (V_t, E_t, S_t, \Pi_t, \Gamma_t)
\]

Keep three objects distinct:

| Object | Meaning |
|---|---|
| Intent graph | what the controller wants (`intentGraph` + `policies` + `constraints` + `provenance`) |
| Compiled plan | what a specific runtime can safely support |
| Observed \(\mathcal{O}_t\) | what actually exists now |

A marketplace is an **allocation policy** \(\Pi_t\) (announce → bid → award → execute → verify → settle), not a separate product. Autonomous payment is unsupported.

Readable DSL is sugar. First proof of generality: the **same primitives** express ReAct and bounded recursion. Architecture search is search over programs in this IR.

## Packages

| Path | Job |
|---|---|
| `schema/` + `spec/` + `tests/validate.py` | HOTL 0.2 IR. Unknown version, implicit fan-in, unbounded spawn, payment grants fail closed. |
| `encodings/` | Join table. Visual topology ids compile **only** through `ir-map.json`. |
| `language/` | UI catalog: capability cores, decode key, IR map. |

```
schema/hotl-0.2.schema.json   current JSON Schema (draft 2020-12)
schema/hotl-0.1.schema.json   archived 0.1
spec/hotl-0.2.md            research spec
encodings/visual.json       design-language catalog (canonical)
encodings/ir-map.json       visual topology → HOTL 0.2
language/                   Vite catalog (port 5178)
examples/valid/             fixtures that must pass
examples/invalid/           fail-closed cases
tests/validate.py           zero-dependency validator + join-table check
```

## Validate

```bash
python3 tests/validate.py
python3 tests/validate.py examples/valid/pipeline.json
cd language && bun install && bun run dev
# http://127.0.0.1:5178/
```

Unknown `specVersion`, implicit fan-in, unbounded spawn, missing ports, dependency cycles, undeclared privileged capability, and payment-execution grants fail closed. A visual `swarm` silhouette does **not** compile unless `ir-map.json` lists the required bounds.

## Non-goals

- Second scheduler or ledger (Hermes Kanban / Keel stay canonical where they exist)
- Inferring swarm / intelligence / consensus from a drawing
- Shipping the private ChatGPT voice thread that motivated the IR
- Mixing this into `kvnloo/dash`
- A second GitHub repo for the same ids (`kvnloo/aodl-ui` is not the contract)

## Provenance

Recovered 2026-08-17 from Hermes Kanban attachments `t_7432ab2d` (0.1) and `t_83991e68` (0.2). `examples/` and `tests/validate.py` were named in the 0.2 README and never attached; this repo is that first implementation milestone.

See `spec/provenance.md`.
