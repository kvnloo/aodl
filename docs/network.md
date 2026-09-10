# Network

These repos are separate products that share ids. They are not a monorepo.

```
                    kvnloo/aodl
                 IR + catalog + encodings
                    /      |       \
                   /       |        \
          kvnloo/dash   frontier-kb   hermes-keel
          phone+bridge  research KB   Hermes L0 only
                   \       |        /
                    \      |       /
                     existing harnesses
         hermes  omp  grok  codex  claude  pi  fx
                         o8 (control room)
                      firstmate (distro)
```

| Repo | Owns | Does not own |
|---|---|---|
| [kvnloo/aodl](https://github.com/kvnloo/aodl) | \(\mathcal{O}_t\), schema, validator, visual join table, harness ids | scheduler, payment, Dash UI, Kanban |
| [kvnloo/dash](https://github.com/kvnloo/dash) | phone + Tailscale spawn of executor CLIs | orchestration calculus, Keel |
| [kvnloo/frontier-kb](https://github.com/kvnloo/frontier-kb) | literature / permanent notes | runtime |
| [kvnloo/hermes-keel](https://github.com/kvnloo/hermes-keel) | Hermes governance, Level 0 | Firstmate, Dash, AODL schema |
| [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | Kanban, profiles, Telegram, A2A | AODL (proposed, #88589) |
| [kunchenguid/firstmate](https://github.com/kunchenguid/firstmate) | captain liaison, worktrees, PRs | Hermes execution truth |

Ids for executors are `harnesses/catalog.json`. Dash `Harness.id` and Firstmate adapter names must match those ids when they talk about the same CLI (`omp`, `codex`, `grok`, `claude`, `hermes`, `pi`, `fx`).

`o8` and `firstmate` are **not** AODL graphs. They may *compile* a graph (dispatch workers). Observed \(\mathcal{O}_t\) still comes from the workers they spawned.
