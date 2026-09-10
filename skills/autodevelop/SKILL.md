# Autodevelop

Donate one coding pass. Do not invent a parallel process.

## Do

1. Read root `AGENTS.md` and `CONTRIBUTING.md`.
2. `git fetch origin`. Branch from `origin/main` unless the issue names another base.
3. Search open issues and PRs. Stop on overlap.
4. Claim **one** `claimable` issue that is not `claimed`. 24h lease unless the project says otherwise.
5. Fail, then pass (`skills/tdd/SKILL.md`).
6. Run `python3 tests/validate.py`. Mutation is `n/a`.
7. Open a PR with the evidence receipt. **Never merge `main`.**

## Stop

- Nothing is `claimable`.
- A live claim newer than the lease exists.
- A competing PR already covers the scope.
- You would add a runtime, scheduler, payment executor, or Dash UI.
- You were about to write a mutation score.

If you stop, leave a comment with the blocker. Do not open a consolation PR.
