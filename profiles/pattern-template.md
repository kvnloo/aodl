# Pattern-template compiler profile

Status: **incomplete feature branch** (`feat/pattern-templates`). Not merged, not a runtime.

A pattern template is a reusable, parameterized orchestration (council, pipeline, fan-out, …) that compiles to an ordinary HOTL 0.2 document. It is the AODL step between the intent contract and the runtime plan:

```text
intent contract ──► pattern + params ──► HOTL 0.2 doc (+ plan with leases) ──► launcher ──► eventLog
   (what/why)        (how, reusable)       (validated, hashed)                   (Hermes/fx/agy)   (observed)
                                                                      ▲                       │
                                                                      └── enforce(plan, events) ┘
```

Files: `patterns/<id>.pattern.json` (template), `patterns/routes.json` (route aliases + route laws), `patterns/instances/*.json` (owner-approved parameter sets), `compiler/pattern.py`, proof `python3 tests/pattern.py`.

## What a template declares

- `parameters`: every knob with finite limits (rounds, seats, research pool per seat, delegation depth).
- `method`: the round protocol (e.g. Socratic: independent opening → examinations with peer text → closing).
- `laws`: the invariants, each tagged with when it is checked: `compile`, `admit` or `run`.
- `measure`: the receipt fields every run must write, so patterns can be compared.

## Models are aliases, not strings

Seats and pools name an alias from `patterns/routes.json`. The alias fixes provider, launch route and the exact model id. Route laws encode owner rules (GPT only via fx/pi, Gemini only via agy, free tier only via the semantic router). The free class resolves to the vLLM Semantic Router virtual model; the router, not the template, picks the lane.

## Enforcement: three phases, one plan

| Phase | Function | Rejects |
|---|---|---|
| compile | `compile_pattern(template, params)` | unknown alias, broken route law, unbounded or over-limit counts; then the normal AODL validator |
| admit | `admit(doc, preflight)` | any seat whose exact route did not return exit 0 + text + usage + observed model == requested; no substitution |
| run | `enforce(doc, events)` | turn without the current round token, a second turn per round, a round past R, spawn without a remaining lease of that class, depth past the limit, a different observed model, Socratic peer-text violations |

`enforce` is a pure replay, so the same function gates the launcher before each action and audits a finished run.

## Not this profile

No scheduler, queue or launcher lives here (AGENTS.md: no runtime in AODL). The launcher that issues round tokens and spawn leases belongs to the runtime (Hermes hook or z0 launcher) and must call `enforce` before every turn and spawn. `agy` is not yet a harness id in `harnesses/catalog.json`; the Gemini seat carries its route in the plan only.
