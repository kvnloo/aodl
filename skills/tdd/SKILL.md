# TDD

Fail, then pass. The red command is part of the evidence receipt.

## Do

1. Name the intended behavior vs the current behavior in one sentence each.
2. Write or extend a fixture that fails for the right reason. Run `python3 tests/validate.py`.
3. Record that command and the failure as `tests.red`.
4. Change schema/validator until the same command passes. Record `tests.green`.
5. Optional sabotage: break one assertion, rerun, expect fail. That is `tests.sabotage`.
6. Do not delete the red proof to make the log look clean.

## Stack

Unit command: `python3 tests/validate.py`. Mutation is `n/a` until mutmut is adopted. Do not copy Dash `bun test` or `mutate.ts` into this repo.

## Do not

- Start with the fix and add a fixture that could only pass.
- Call `build-pages.py` a unit test of the IR.
- Infer `swarm` from a drawing to make a fixture pass.
