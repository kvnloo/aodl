# Supported harnesses

Canonical ids live in [`catalog.json`](catalog.json). `python3 tests/validate.py` fails closed if any required id is missing, unknown, or mistyped.

A **harness** here is a coding-agent CLI (or a control room that dispatches those CLIs). It is **not** an AODL topology, a Keel level, or a Dash screen.

## Required ids

| id | kind | bin | Dash | Firstmate | repo |
|---|---|---|---|---|---|
| `hermes` | executor | `hermes` | wired | none | [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) |
| `omp` | executor | `omp` | wired | primary | [can1357/oh-my-pi](https://github.com/can1357/oh-my-pi) |
| `o8` | control-room | `o8` | none | none | [hurttlocker/o8](https://github.com/hurttlocker/o8) |
| `grok` | executor | `grok` | wired | primary | [xai-org/grok-build](https://github.com/xai-org/grok-build) |
| `codex` | executor | `codex` | wired | primary | [openai/codex](https://github.com/openai/codex) |
| `claude` | executor | `claude` | wired | primary | [anthropics/claude-code](https://github.com/anthropics/claude-code) |
| `pi` | executor | `pi` | none | primary | [earendil-works/pi](https://github.com/earendil-works/pi) |
| `fx` | executor | `fx` | none | none | [vercel-labs/fx](https://github.com/vercel-labs/fx) |

## Distros (not harnesses)

| id | kind | repo |
|---|---|---|
| `firstmate` | distro | [kunchenguid/firstmate](https://github.com/kunchenguid/firstmate) · fork [kvnloo/firstmate](https://github.com/kvnloo/firstmate) |

Firstmate sits **on** Claude Code / Grok / Pi / OMP / Codex. It is not a ninth executor. Do not add `firstmate` to `supported`.

## Status fields

- `dash`: `wired` (adapter in `kvnloo/dash` `bridge/src/harnesses.ts`) or `none`
- `firstmate`: `primary` (verified first-mate session) / `crew` / `none`
- `kind`: `executor` | `control-room` | `distro`

Adding an id requires a catalog row **and** a validator update of `REQUIRED_HARNESS_IDS`. Dash adapters and Firstmate primaries are separate proofs.
