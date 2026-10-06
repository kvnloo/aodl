# RECEIPT — grok/aodl/42-json-consumer-cli (local only, not pushed)

- Source PR: kvnloo/aodl#42 (draft) "feat(cli): bounded JSON consumer for canonical AODL identity". Head `ba9190a6dadcc5ca747c7766b3b53bfc246ce53e`, base branch `nightly` @ `96c84d1`.
- Base: `origin/main` @ `416736c80a727757202bdeedb02579c3c820f7f6` (fetched 2026-10-06). `nightly` is 17 commits ahead of main.
- Stacked dependency: kvnloo/aodl#39 (open, targets main), head `68231658f0ec0338464c0916a2329b9587444312`. It provides `aodl_contract/canonical.py` (`CANON_VERSION`, `semantic_fingerprint`), which #42 imports. Its `canonical.py` is byte-identical to nightly's `02bf06c`.
- Branch commits (on top of main):
  1. `9840b4c` — cherry-pick of #39 `6823165` (dependency; land #39 first or together)
  2. `fc5d9f8` — cherry-pick of #42 `1230a53`, tests only (RED)
  3. `094120f` — cherry-pick of #42 `ba9190a`, implementation (GREEN)
  4. this RECEIPT commit
- All cherry-picks applied cleanly. No code edits beyond #39 and #42 were needed.

## What changed (from #42)
`aodl-validate --fingerprint --json -` / `python3 -m aodl_contract.cli`: bounded stdin/file JSON validation plus aodl-canon-1 fingerprint, input-bytes digest, no fingerprint on rejection, rejects duplicate keys and nonfinite values, no echo of private values. Adds `docs/consumer-cli.md`, `tests/test_cli_json.py` (18 subprocess tests), and a validate.yml step.

## Commands and results (Python 3.13.5 system python3; the box has no fast 3.12, see risks)
- Dependency probe: #42 cherry-picked straight onto main, without #39 → `test_cli_json` FAILED (failures=5, errors=1). The #39 dependency is real.
- RED at `fc5d9f8` (main + #39 + tests only): `python3 -m unittest discover -s tests -p test_cli_json.py` → Ran 18, FAILED (failures=22 incl. subtests)
- GREEN at `094120f`, same steps as `.github/workflows/validate.yml`:
  - `python3 tests/validate.py` → exit 0 (jsonschema cross-check SKIP by design)
  - `python3 tests/compile.py` → exit 0, "compile corpus matched"
  - `python3 tests/mesh_registry.py` → exit 0, "mesh registry matched — 73 entries"
  - `python3 -m unittest discover -s tests -p test_cli_json.py -v` → Ran 18, OK
  - also `python3 -m unittest discover -s tests -v` → Ran 31, OK
  - CONTRIBUTING proof 4: `python3 scripts/build-pages.py --current-only` → exit 0, "1 catalog(s) in site/" (`site/` is gitignored)
- Not run: `catalog.yml` bun/playwright e2e. `language/` isn't touched by this change.

## Open risks / decisions
- **Python 3.12 not reproduced locally.** CI pins 3.12. On this box the uv-managed 3.12 takes about 18–33 s just to start (load average ~63, shared box). Each of #42's subprocess tests has a 10 s `timeout`, so they error out. That's the environment, not the code. 3.13 passes everything. GitHub's `validate` (3.12) already passed on #42's nightly-based head `ba9190a`.
- **Stacked on #39.** This branch can't land on main without #39. CoS decides: land #39 first, then retarget #42 to main; or push this branch as one stack.
- #42's PR body `base_revision: 96c84d1` (nightly) and `head_revision` must be refreshed for a main-based head. The `tests.red` field can now cite the observed RED above.
