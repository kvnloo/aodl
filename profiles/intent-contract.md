# Intent-contract compiler profile

AODL is an **intent-and-participation contract**. Wire id stays `hotl-0.2`. This profile tells an LLM how to read and write that contract. It is not a second IR, not a scheduler, and not a widget set.

North star: a person directs increasingly capable systems without losing authorship or continuity of thought.

**Automate unwanted friction. Preserve chosen challenge.**

The same result can be correct while removing the part of the work the human wanted to experience. Outcome (`constraints.termination`, `verifier`) is not participation (`humanGate`, attention budget).

## Three objects, still never substituted

| ChatGPT name | HOTL 0.2 | Not |
|---|---|---|
| Intent contract (normalized intent, outcome, invariants, acceptance, evidence) | this document: `intentGraph` + `policies` + `constraints` + `provenance` | a top-level `intentContract` or `openQuestions` field |
| Orchestration / strategy | compiled `plan` (compiler profile: Hermes Kanban, Firstmate ship, …) | substituting the graph for intent |
| Observed runtime | `eventLog` + node `lifecycle` | a glowing core, a Dash `/roster`, or `eventLog` copied into `intentGraph` |

Forward: natural language → this document → `plan` → runtime.
Backward: `eventLog` → `verification` / `critique` → `observation` → graph mutation (`retry`, `addNode`, `addEdge`). Repair is a **graph mutation**, not a new English topology.

## Failure is not an event type

Schema event types are closed: `spawn`, `bind`, `route`, `retry`, `cancel`, `addNode`, `removeNode`, `addEdge`, `removeEdge`, `stateUpdate`, `snapshot`.

| Gap (payload only) | Acquisition | HOTL |
|---|---|---|
| specification | interrupt only if expected information gain beats the interruption | `humanGate` |
| knowledge | research / memory / tool | `tool`, `memory`, `delegation` |
| observability | trace, receipt, screenshot | `observation`, `evidence` |
| capability | different harness, or fail closed | `executor.harness` from `harnesses/catalog.json` |

A failed attempt is `lifecycle: failed` plus `stateUpdate`. The learning edge is `observation` (same rule as C(RAID) D→R). There is no `fail` event. `examples/invalid/fail-event.json` is `⊥`.

## Participation

`humanGate` is merge / deploy / approve. Review is a `verifier`. Ask the human only when the expected reduction in later error is worth the interrupt. Recoverable questions go to `tool` / `memory`. Unknown stays unspecified — never inferred.

Human attention is a declared budget (`constraints.budgets.attention`). It is not evidence of spend.

Ephemeral UI is a live projection of unresolved $\Gamma_t$ through visual $\tau$. It is not a fourth object and not the source of truth. The brand is **Ripple** (`kvnloo/ripple`): a Dash-consumed ephemeral intent surface. ChatGPT's "Ephemeral Intent Surface" is the kind/gloss, not the product name. S-Pen is an input, not a product. Do not add tldraw, galleries, or catalog widgets here. Do not implement Ripple in this tree.

## Named program (not a kind)

```json
"kinds": ["sequence", "retry", "human_gate"]
```

Fixture: `examples/valid/intent-loop.json` (intent task, hermes executor, recoverable `tool`, taste `memory`, `verifier`, `humanGate`; failure `observation` back to intent; `eventLog` uses `stateUpdate` + `retry`).

`policies.protocol` may be `intent-contract`. Unlabeled `hybrid` stays `not-inferred`. Marketplace stays `auction`. Payment unsupported.

## Not this repo

AODL owns the vocabulary. Sibling planes own the rest:

| Plane | Owns | Do not pull into AODL |
|---|---|---|
| Hermes | contextual memory, runtime | a second Kanban |
| o8 | governed coding execution | `o8` as `executor.harness` |
| Dash | mobile / voice HITL | Dash UI in this tree |
| Ripple | Dash-consumed ephemeral intent surface (brand; AODL does not own it) | widgets, orbs, a third gallery, S-Pen as a product |
| Firstmate | attention governor (captain-hold) | Keel ported here |
| Evolution Lab | experiments / policy learning | LandingPageGym, tiny-net armies |
| Kerdoios | where work runs | speculative execution compiler |
| Blueprint | desired reality | IR |

Reject: HOTL 0.3 kinds, sheaf JSON fields, `langchain` / `llm` harness ids, hue/geometry/mode runes as IR, UI-first builds, training-first, physical-world-first.

Proof: `python3 tests/validate.py`.
