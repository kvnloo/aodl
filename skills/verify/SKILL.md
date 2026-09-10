# Verify

Tests are necessary, not sufficient. Generation and verification are separate.

## Pyramid

1. **Unit** — `python3 tests/validate.py` (6 valid, 11 invalid, encodings join, harness catalog).
2. **TDD** — red fixture, then green command (`skills/tdd/SKILL.md`).
3. **Mutation** — `n/a`. Do not invent a score.
4. **Catalog** — `python3 scripts/build-pages.py --current-only` must write `site/index.html` (not committed).

## Receipt

Bind every result to `head_revision`. Tests from another SHA are not evidence. Fill `.github/PULL_REQUEST_TEMPLATE.md`.

The implementer does not self-approve. Workers never merge.

## Fail closed

- Unknown `specVersion`, implicit fan-in, unbounded spawn, payment grants, inferred `swarm` → error, not a warning.
- Runtime you did not exercise → list it under `limitations`.
- Secrets, transcripts, `.env` → stop.
