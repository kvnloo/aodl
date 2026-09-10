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
                         │
              protocol: C(RAID)  spec/craid.md
                         │
              kvnloo/blueprint   goal (autonomous PM first)
              kvnloo/evolve       legacy Claude Flow (inspo)
              kvnloo/solarpunk    digital twin / cores
```

| Repo | Owns | Does not own |
|---|---|---|
| [kvnloo/aodl](https://github.com/kvnloo/aodl) | $\mathcal{O}_t$, schema, validator, visual join table, harness ids | scheduler, payment, Dash UI, Kanban |
| [kvnloo/dash](https://github.com/kvnloo/dash) | phone + Tailscale spawn of executor CLIs | orchestration calculus, Keel |
| [kvnloo/frontier-kb](https://github.com/kvnloo/frontier-kb) | literature / permanent notes | runtime |
| [kvnloo/hermes-keel](https://github.com/kvnloo/hermes-keel) | Hermes governance, Level 0 | Firstmate, Dash, AODL schema |
| [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | Kanban, profiles, Telegram, A2A | AODL (proposed, #88589) |
| [kunchenguid/firstmate](https://github.com/kunchenguid/firstmate) | captain liaison, worktrees, PRs | Hermes execution truth |
| [kvnloo/blueprint](https://github.com/kvnloo/blueprint) | product / PM goal | IR, scheduler |
| [kvnloo/evolve](https://github.com/kvnloo/evolve) | legacy C(RAID) orchestration (Claude Flow) | current IR |
| `kvnloo/solarpunk` | digital twin / HomeForge cores | HOTL fields |

C(RAID) (`spec/craid.md`) is the named hybrid that compiles Blueprint's CR/CA/CI/CD loop. Solarpunk draws it. AODL validates it.

Ids for executors are `harnesses/catalog.json`. Dash `Harness.id` and Firstmate adapter names must match those ids when they talk about the same CLI (`omp`, `codex`, `grok`, `claude`, `hermes`, `pi`, `fx`).

`o8` and `firstmate` are **not** AODL graphs. They may *compile* a graph (dispatch workers). Observed $\mathcal{O}_t$ still comes from the workers they spawned.

Human contract: [`working-note.md`](working-note.md).
