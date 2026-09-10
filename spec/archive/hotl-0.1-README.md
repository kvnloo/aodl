# HOTL draft (Hermes Orchestration Topology Language)

Status: proposal, not an implementation. HOTL is a deliberately small, versioned IR that separates graph structure from policy, transport, roles, guarantees, evidence, and observations.

## Decision summary
No universal agent-orchestration naming standard exists. BPMN, Petri nets, workflow DSLs, actor systems, and graph frameworks each formalize a slice; labels such as swarm, mesh, council, and marketplace remain overloaded. Hermes should standardize an explicit typed IR and derive badges from it, rather than standardize one badge vocabulary.

Canonical identity is `(specVersion, sourceHash, graphId)`. Unknown versions and unknown required fields fail closed. Provider/model/effort, runtime freshness, and health are annotations/observations and never alter topology identity.

## Repository contents
- `hotl.schema.json`: draft-2020-12 strict core schema.
- `hotl.md`: semantics, grammar, validation, classification, compiler/projection and badge decoder.
- `examples/`: valid and negative fixtures.
- `tests/test_fixtures.py`: dependency-free reference checks.
- `issue.md`: proposed upstream issue text and links.

Run: `python3 tests/test_fixtures.py`
