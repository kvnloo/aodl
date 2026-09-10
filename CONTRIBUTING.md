# Contributing to AODL

AODL is the typed IR for agent graphs. It is not a scheduler, Dash, or Keel.

## Use vs contribute

**Use:** validate a document.

```bash
python3 tests/validate.py
python3 tests/validate.py examples/valid/pipeline.json
```

**Contribute:** schema, fixtures, encodings, harness catalog, docs. Open a PR against `main`. Workers do not merge `main`.

## Proof

1. Add or change a construct → one **valid** fixture and one **invalid** fixture.
2. `python3 tests/validate.py` must stay green.
3. Unknown `specVersion`, implicit fan-in, unbounded spawn, payment grants, unknown harness ids, and inferred `swarm` stay fail-closed.

## Do not

- Add a runtime, ledger, or payment executor.
- Infer `swarm` / consensus / intelligence from a drawing.
- File a second GitHub issue for HOTL (use [hermes-agent#88589](https://github.com/NousResearch/hermes-agent/issues/88589)).
- Commit ChatGPT/Hermes transcripts or secrets.
- Invent a harness id that is not in `harnesses/catalog.json`.
- Mix Dash UI or solarpunk HomeForge into this tree beyond `encodings/` + `language/`.

## Ownership

- `schema/`, `spec/`, `examples/`, `tests/validate.py` — IR
- `encodings/` — join table (visual ids compile only through `ir-map.json`)
- `harnesses/catalog.json` — executor / control-room ids
- `language/` — living-night catalog (presentation)

## Related

Network map: [docs/network.md](docs/network.md).
