# Authority scopes (HOTL 0.2, optional node fields)

`authorityCeiling` says *which kinds* of effect a node may ever hold. It does not say *where*.
A runtime that enforces authority per action (a `git push`, a `gh pr create`, an `ssh`) needs
the where: which repo, which branch, which host. These two optional node fields carry it.
Wire id stays `hotl-0.2`; documents without them are unchanged.

```json
{
  "id": "agent", "kind": "executor", "harness": "claude",
  "authorityCeiling": ["execute", "push", "pr"],
  "authorityScopes": [
    {"effect": "push", "targets": {"repos": ["~/workspace/aodl"], "branches": ["feat/authority-scopes"]}},
    {"effect": "pr",   "targets": {"repos": ["~/workspace/aodl"]}}
  ],
  "prohibitions": [{"effect": "push", "targets": {"branches": ["main"]}}, {"effect": "merge"}]
}
```

## `authorityScopes` (executor nodes only)

Each entry is `{effect, targets}` and narrows one ceiling entry to exact targets.

- `effect` is a lower-case effect id (`^[a-z][a-z0-9_]{0,63}$`) and **must be on the node's
  `authorityCeiling`**. A scope narrows; it never widens (`widens authorityCeiling`).
- `targets` is required and non-empty. Keys are closed: `repos`, `branches`, `paths`, `hosts`,
  `units`, `packages`, `envs`, `prs`. Each value is a non-empty array of non-empty strings.
- Scopes are **exact**. `*`, `?`, `any`, `all`, `every`, `everything`, `anything` and
  `non_default` are rejected (`scopes are exact`). Name the branch.
- Only executors carry scopes: the executor is the principal that acts. A task node's ceiling
  remains a declaration of intent, not a grant.
- Payment vocabulary (`payment`, `finance`, `pay`, `transfer`, `wallet`) is unsupported, as on edges.

## `prohibitions` (any node)

Each entry is `{effect, targets?}`. Without `targets` it removes the whole effect. A consumer must
apply a prohibition on **any** node to **every** executor in the document (a prohibition anywhere in
the contract binds everyone), and must let it win over any scope or runtime grant.

## What the validator does not decide

AODL owns the vocabulary, not the effect taxonomy. Whether `branches` is meaningful for `pr`, or
how `repos` matches a worktree, is the enforcing runtime's profile (z0intelligence:
`docs/aodl-enforcement.md`). A runtime must fail closed on an effect or target key it does not
understand: an entry it cannot enforce exactly grants nothing.

## Fingerprint

`aodl-canon-1` does not reorder these arrays (entries have no `id`). Reordering them changes the
fingerprint; that is the conservative direction, since a changed fingerprint only ever revokes a
pinned contract, never extends one.

Fixtures: `examples/valid/authority-scopes.json`, `examples/invalid/scope-widens-ceiling.json`,
`examples/invalid/scope-wildcard-target.json`. Tests: `tests/test_authority_scopes.py`.
