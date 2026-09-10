# Verify

Tests are necessary, not sufficient. Generation and verification are separate.

## Pyramid

1. **Unit** — `python3 tests/validate.py` on the touched surface.
2. **TDD** — red command, then green command (`skills/tdd/SKILL.md`).
3. **Mutation** — `n/a`. AODL proves contracts with valid/invalid fixtures, not a mutator. Do not invent a score.
4. **Runtime** — `n/a`. This repo does not execute graphs. If you did not run Pages/catalog locally, say so under `limitations`.

## Receipt

Bind every result to `head_revision`. Tests from another SHA are not evidence. Fill `.github/PULL_REQUEST_TEMPLATE.md`.

The implementer does not self-approve. Independent review is a different person or a frozen evaluator. Workers never merge.

## Fail closed

- Unknown mutation tool → `n/a`, not `80`.
- Runtime you did not exercise → list it under `limitations`.
- Secrets, tokens, `.env` → stop.
