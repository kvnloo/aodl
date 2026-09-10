# AODL — notes for agents

IR first. Pretty DSL later. Fail closed.

- Schema + `tests/validate.py` are the contract. Every new construct needs a valid fixture and a negative fixture.
- Do not add a runtime, scheduler, or payment executor here.
- Do not infer `swarm` from graph shape.
- Do not commit ChatGPT/Hermes transcripts or secrets.
- Unknown `specVersion` is an error, not a warning.
- Hermes adapter mapping belongs as a **compiler profile**, not as a second Kanban.
