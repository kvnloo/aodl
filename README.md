# AODL

**Agent Orchestration Description Language** — a typed IR for agent graphs.

Public name: **AODL**. Wire identifier: **`hotl-0.2`** (Hermes Orchestration Topology Language, kept for continuity with [NousResearch/hermes-agent#88589](https://github.com/NousResearch/hermes-agent/issues/88589)).

This repository is a **specification** (schema + fail-closed validator) plus a **design-language join table**. It is not a scheduler, runtime, payment system, or paper.

Live catalog: [kvnloo.github.io/aodl](https://kvnloo.github.io/aodl/). Other git branches land at `/preview/<branch>/`.

The formal language is a working note, not a preprint: [`docs/working-note.md`](docs/working-note.md). There is no `.tex` / PDF and nothing on arXiv.

## Why

Harnesses describe **nodes** (Codex, OMP, Hermes, humans, tools) and then wave at the topology with English: swarm, mesh, supervisor, marketplace. Two systems can share a label and have different computational structure.

An orchestration at logical time $t$ is

$$
\mathcal{O}_t = (V_t, E_t, S_t, \Pi_t, \Gamma_t)
$$

| Symbol | Meaning |
|---|---|
| $V_t$ | nodes: agents, models, tools, humans, memories, tasks |
| $E_t$ | typed relations (delegate, verify, depend, observe, …) |
| $S_t$ | runtime state |
| $\Pi_t$ | allocation / routing policy |
| $\Gamma_t$ | goals, budgets, human gates (Keel) |

Keep three objects distinct:

| Object | Meaning |
|---|---|
| Intent graph | what the controller wants (`intentGraph` + `policies` + `constraints` + `provenance`) |
| Compiled plan | what a specific runtime can safely support |
| Observed $\mathcal{O}_t$ | what actually exists now |

A marketplace is an **allocation policy** $\Pi_t$ (announce → bid → award → execute → verify → settle), not a separate product. Autonomous payment is unsupported.

Readable DSL is sugar. First proof of generality: the **same primitives** express ReAct and bounded recursion. Architecture search is search over programs in this IR. Mesh is declared peer edges, not a kind. Keel is $\Gamma_t$, not a silhouette. Cores are a decoder, not the IR. C(RAID) is a named hybrid ([`spec/craid.md`](spec/craid.md)).

## Formal language

| Want | Open |
|---|---|
| Equations + stack | [`docs/working-note.md`](docs/working-note.md) |
| Grammar | [`spec/hotl-0.2.ebnf`](spec/hotl-0.2.ebnf) |
| Checkable IR | [`schema/hotl-0.2.schema.json`](schema/hotl-0.2.schema.json) |
| Long research spec | [`spec/hotl-0.2.md`](spec/hotl-0.2.md) (ASCII; GitHub will not render `O_t` there) |
| Intent → plan → observed | [`spec/architecture.mermaid`](spec/architecture.mermaid) |
| Live UI (KaTeX + React) | [kvnloo.github.io/aodl](https://kvnloo.github.io/aodl/) (branch previews: [`/preview/`](https://kvnloo.github.io/aodl/preview/)) |
| Visual ⇀ IR | [`spec/translation.md`](spec/translation.md) · [`encodings/ir-map.json`](encodings/ir-map.json) |
| Proof | `python3 tests/validate.py` |

## Packages

| Path | Job |
|---|---|
| `schema/` + `spec/` + `tests/validate.py` | HOTL 0.2 IR. Unknown version, implicit fan-in, unbounded spawn, payment grants fail closed. |
| `encodings/` | Join table. Visual topology ids compile **only** through `ir-map.json`. |
| `harnesses/catalog.json` | Formal supported harness ids (`hermes`, `omp`, `o8`, `grok`, `codex`, `claude`, `pi`, `fx`). |
| `language/` | Catalog: $\mathcal{O}_t$ + $\tau$ as KaTeX and React; cores are the decoder below that. |

```
docs/working-note.md        equations + stack (GitHub math)
docs/network.md             sibling repos + harness ids
schema/hotl-0.2.schema.json   checkable IR (draft 2020-12)
schema/hotl-0.1.schema.json   archived 0.1
spec/hotl-0.2.md            research spec (ASCII)
spec/hotl-0.2.ebnf          grammar sketch
spec/craid.md               C(RAID) named hybrid (R→A→I→D)
encodings/visual.json       design-language catalog (canonical)
encodings/ir-map.json       τ: visual topology → HOTL 0.2
spec/translation.md        human form of τ (LaTeX)
harnesses/catalog.json      supported harness + network ids
language/                   Vite catalog: calculus + translation + decoder (port 5178)
examples/valid/             fixtures that must pass
examples/invalid/           fail-closed cases
tests/validate.py           zero-dependency validator + join-table + catalog check
```

## Validate

```bash
python3 tests/validate.py
python3 tests/validate.py examples/valid/pipeline.json
cd language && bun install && bun run dev
# http://127.0.0.1:5178/
python3 scripts/build-pages.py --current-only   # site/ for GitHub Pages
# https://kvnloo.github.io/aodl/  (main)
# https://kvnloo.github.io/aodl/preview/<branch>/
```

Unknown `specVersion`, implicit fan-in, unbounded spawn, missing ports, dependency cycles, undeclared privileged capability, and payment-execution grants fail closed. A visual `swarm` silhouette does **not** compile unless `ir-map.json` lists the required bounds.


## Supported harnesses

Ids are fixed in [`harnesses/catalog.json`](harnesses/catalog.json). Unknown ids fail closed.

| id | kind | Dash | Firstmate | Upstream |
|---|---|---|---|---|
| `hermes` | executor | wired | none | [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) |
| `omp` | executor | wired | primary | [can1357/oh-my-pi](https://github.com/can1357/oh-my-pi) |
| `o8` | control-room | none | none | [hurttlocker/o8](https://github.com/hurttlocker/o8) |
| `grok` | executor | wired | primary | [xai-org/grok-build](https://github.com/xai-org/grok-build) |
| `codex` | executor | wired | primary | [openai/codex](https://github.com/openai/codex) |
| `claude` | executor | wired | primary | [anthropics/claude-code](https://github.com/anthropics/claude-code) |
| `pi` | executor | none | primary | [earendil-works/pi](https://github.com/earendil-works/pi) |
| `fx` | executor | none | none | [vercel-labs/fx](https://github.com/vercel-labs/fx) |

[kunchenguid/firstmate](https://github.com/kunchenguid/firstmate) is a **distro**, not a ninth harness. Fork: [kvnloo/firstmate](https://github.com/kvnloo/firstmate).

## C(RAID)

Named hybrid, not a new kind. Continuous Research → Analysis → Integration → Deployment. Feedback is `observation`. Unlabeled `hybrid` stays closed. Spec: [`spec/craid.md`](spec/craid.md). Fixture: `examples/valid/craid.json`.

Blueprint is the product goal. C(RAID) is the protocol. AODL is the IR. Solarpunk is the digital twin.

## Network

| Repo | Job |
|---|---|
| [kvnloo/aodl](https://github.com/kvnloo/aodl) | this IR |
| [kvnloo/dash](https://github.com/kvnloo/dash) | phone + Tailscale spawn of executor CLIs |
| [kvnloo/frontier-kb](https://github.com/kvnloo/frontier-kb) | research notes |
| [kvnloo/hermes-keel](https://github.com/kvnloo/hermes-keel) | Hermes governance, Level 0 only |
| [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | Kanban / profiles / A2A |
| [kvnloo/blueprint](https://github.com/kvnloo/blueprint) | product goal; autonomous PM is step 1 |
| [kvnloo/evolve](https://github.com/kvnloo/evolve) | legacy C(RAID) / Claude Flow (inspo) |

See [docs/network.md](docs/network.md).

## Non-goals

- Second scheduler or ledger (Hermes Kanban / Keel stay canonical where they exist)
- Inferring swarm / intelligence / consensus from a drawing
- Shipping the private ChatGPT voice thread that motivated the IR
- Mixing this into `kvnloo/dash`
- Treating Firstmate or o8 as AODL graphs
- A second GitHub repo for the same ids (`kvnloo/aodl-ui` is not the contract)
- An arXiv preprint before a compiler dry-run exists

## Provenance

Recovered 2026-08-17 from Hermes Kanban attachments `t_7432ab2d` (0.1) and `t_83991e68` (0.2). `examples/` and `tests/validate.py` were named in the 0.2 README and never attached; this repo is that first implementation milestone.

See `spec/provenance.md`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). MIT. CI: `python3 tests/validate.py`.
