# AODL — notes for agents

IR first. Pretty DSL later. Fail closed.

- Schema + `tests/validate.py` are the IR contract. Every new construct needs a valid fixture and a negative fixture.
- Visual topology ids live in `encodings/visual.json` and compile only through `encodings/ir-map.json`. Add both, plus a silhouette in `topology-graphs.json`, in one change.
- Do not infer `swarm` from graph shape. `swarm` is `not-inferred` until finite dynamic bounds are declared.
- Marketplace is `policies.kinds: ["auction"]`, payment unsupported.
- Provider hue, model geometry, effort orbits, mode runes, and runtime cadence are visual channels. They are not HOTL fields.
- Do not add a runtime, scheduler, or payment executor here.
- Do not commit ChatGPT/Hermes transcripts or secrets.
- Unknown `specVersion` is an error, not a warning.
- Hermes adapter mapping belongs as a **compiler profile**, not as a second Kanban.
- HomeForge/zerOS consumes `encodings/visual.json`. Do not invent topology ids in solarpunk first.
