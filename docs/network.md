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
| [kvnloo/aodl](https://github.com/kvnloo/aodl) | $\mathcal{O}_t$, schema, validator, visual join table, harness ids | scheduler, payment, Dash UI, Kanban, Ripple |
| [kvnloo/verified-oss-loop](https://github.com/kvnloo/verified-oss-loop) | claim leases, evidence receipts, never-merge | AODL schema, Dash UI |
| [kvnloo/dash](https://github.com/kvnloo/dash) | phone + Tailscale spawn of executor CLIs | orchestration calculus, Keel |
| [kvnloo/ripple](https://github.com/kvnloo/ripple) | Dash-consumed ephemeral intent surface (Ripple is the brand; ChatGPT's phrase is the kind/gloss) | AODL IR, this catalog, S-Pen as a product (S-Pen is an input) |
| [kvnloo/frontier-kb](https://github.com/kvnloo/frontier-kb) | literature / permanent notes | runtime |
| [kvnloo/z0intelligence](https://github.com/kvnloo/z0intelligence) | live cognition; bounded learned specialists / Jev runtime | AODL schema, authority, placement |
| [kvnloo/tokenomics](https://github.com/kvnloo/tokenomics) | measurement contracts: cost, latency, experiments, verified outcomes | routing policy, AODL schema |
| [kvnloo/kerdoios](https://github.com/kvnloo/kerdoios) | execution portfolio / heterogeneous compute placement | orchestration truth, verification |
| [kvnloo/evolution-lab](https://github.com/kvnloo/evolution-lab) | experiment genomes, Pareto / MAP-Elites policy search | AODL runtime or schema |
| [kvnloo/hermes-keel](https://github.com/kvnloo/hermes-keel) | Hermes governance, Level 0 | Firstmate, Dash, AODL schema |
| [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | Kanban, profiles, Telegram, A2A | AODL (proposed, #88589) |
| [kunchenguid/firstmate](https://github.com/kunchenguid/firstmate) | captain liaison, worktrees, PRs | Hermes execution truth |
| [kvnloo/blueprint](https://github.com/kvnloo/blueprint) | product / PM goal | IR, scheduler |
| [kvnloo/evolve](https://github.com/kvnloo/evolve) | legacy C(RAID) orchestration (Claude Flow) | current IR |
| `kvnloo/solarpunk` | digital twin / HomeForge cores | HOTL fields |

C(RAID) (`spec/craid.md`) is the named hybrid that compiles Blueprint's CR/CA/CI/CD loop. Solarpunk draws it. AODL validates it.

Ids for executors are `harnesses/catalog.json`. Dash `Harness.id` and Firstmate adapter names must match those ids when they talk about the same CLI (`omp`, `codex`, `grok`, `claude`, `hermes`, `pi`, `fx`).

`o8` and `firstmate` are **not** AODL graphs. They may *compile* a graph (dispatch workers). Observed $\mathcal{O}_t$ still comes from the workers they spawned.

Human contract: [`working-note.md`](working-note.md). Intent/participation profile: [`profiles/intent-contract.md`](../profiles/intent-contract.md). Hermes dry-run: [`profiles/hermes.md`](../profiles/hermes.md). Mesh Registry (domain tools, not harness ids): [`mesh-registry.md`](mesh-registry.md). AODL owns the formal contract. Hermes owns contextual runtime. Dash/OMP/o8 decode it. Ripple is the Dash-consumed ephemeral intent surface; AODL does not own it. Do not grow a second harness catalog or scheduler here.


Searchable policies are a cross-repo contract, not a new runtime in this tree: AODL fixes intent and the legal/evidence envelope; z0int/Jev may score bounded choices; Kerdoios places work; Tokenomics measures; Evolution Lab searches and promotes verified candidates. See [`profiles/searchable-policy-kernel.md`](../profiles/searchable-policy-kernel.md).
