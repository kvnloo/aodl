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
- Harness ids live in `harnesses/catalog.json`. The eight supported ids are `hermes`, `omp`, `o8`, `grok`, `codex`, `claude`, `pi`, `fx`. Firstmate is a distro, not a harness id.
- Do not port Keel into this repo or into Firstmate as a second scheduler. Keel is Hermes L0. Firstmate is Keel L9 (subordinate executor) when we use it.
- C(RAID) is a named hybrid program (`spec/craid.md`, `examples/valid/craid.json`). Unlabeled `hybrid` stays `not-inferred`. D→R feedback is `observation`, never `dependency`.
- Network map: `docs/network.md`. Human contract: `docs/working-note.md`. No arXiv; no `.tex`.
- Live catalog is GitHub Pages (`scripts/build-pages.py`, `.github/workflows/pages.yml`). Main → https://kvnloo.github.io/aodl/. Other git branches → `/preview/<slug>/`. Workers never merge `main` or `dev`.

## Proof

This repo follows the [Verified OSS Loop](https://github.com/kvnloo/verified-oss-loop). Issues are not claims. AI work is untrusted until proven.

Rollout is Arch-style `rolling` (`.verified-oss-loop/rollout.yml`). `python3 .verified-oss-loop/rollout.py show`. Branch from `origin/nightly`. Day-pass PRs target `preview`. Overnight PRs target `nightly`. Automerge may land on those channels. **Never merge `main` or `dev`.** Do not merge preview/nightly yourself.

| Layer | Command |
|---|---|
| Unit | `python3 tests/validate.py` |
| Catalog | `python3 scripts/build-pages.py --current-only` (if you touch `language/` or Pages) |
| Mutation | `n/a` — fail-closed fixtures, not a mutator |
| Runtime | `n/a` — static IR |

1. Search open issues and PRs. Do not duplicate.
2. Claim **one** `claimable` issue (24h lease). If nothing is claimable, stop.
3. New construct → one valid fixture and one invalid fixture.
4. Fail, then pass (`skills/tdd/SKILL.md`).
5. Open a PR at `preview` (day) or `nightly` (overnight) with `.github/PULL_REQUEST_TEMPLATE.md`. **Never merge `main` or `dev`.**
