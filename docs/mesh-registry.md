# AODL Mesh Registry

Status: **catalog only**. Not a runtime. Not HOTL 0.3. Not adapters.

AODL already describes **intent**. Domain tools already check **code, pixels, meshes, audio, robots**. The Mesh Registry is the fail-closed join table between those two worlds: which existing tool can satisfy which evidence need at which pipeline stage.

```
AODL intent → domain-specific deterministic verifier → auto-repair
if verifier reveals genuine ambiguity → Ripple → human resolves → AODL intent updates
```

This PR records the interface and a representative catalog. It does **not** implement repair loops, routers, or adapters.

Machine files:

| File | Job |
|---|---|
| [`mesh/registry.json`](../mesh/registry.json) | Catalog |
| [`schema/mesh-registry.schema.json`](../schema/mesh-registry.schema.json) | Fail-closed schema for that file, not for HOTL documents |
| [`tests/mesh_registry.py`](../tests/mesh_registry.py) | Validator. HOTL stays `tests/validate.py` |

## Pipeline stages

Lowercase enum, in order:

`specify` → `resolve` → `render` → `plan` → `execute` → `verify` → `evaluate` → `learn`

Domain- and modality-agnostic. Modalities in the catalog include web, code, documents, images, audio, video, 3d, cad, games, robotics, smart-home, physical, rendered-ui, ui.

Each row has one **primary** `stage`. Tools that span stages use `alsoStages` plus a note. Unknown stage fails closed.

## Status

| Status | Means |
|---|---|
| `native` | In-tree and canonical for that stage (AODL specify) |
| `adapter` | In-tree compiler/profile that talks to the tool (Hermes plan dry-run) |
| `candidate` | Named and wanted; runtime or repo is elsewhere, or URL unknown |
| `reference` | External tool or profile-only mapping; not wired here |

A catalog row is **not** proof an adapter exists.

## Requirement side (not HOTL fields)

Intent documents do **not** grow `evidence_required`. The need still exists, as documentation and as `satisfies` on registry rows:

```yaml
evidence_required:
  - visual_similarity
  - accessibility
  - geometric_validity
  - behavioral_correctness
```

Closed vocabulary (unknown ids fail closed **in the registry**, never as HOTL 0.3):

| Evidence | Typical use |
|---|---|
| `specification_validity` | Schema / typed intent |
| `intent_resolution` | Underspecification, elicitation |
| `retrieval` | Memory / search |
| `human_judgment` | Taste, aesthetic, HITL |
| `design_system_compliance` | shadcn/lint and kin |
| `type_correctness` | tsc, typed lint |
| `security_advisory` | npm audit |
| `dependency_health` | npm doctor |
| `behavioral_correctness` | Playwright, Storybook |
| `accessibility` | axe, Lighthouse |
| `visual_similarity` | Chromatic, SSIM/LPIPS, VQM |
| `geometric_validity` | dimensions, manifold, bbox |
| `loudness` | LUFS, clipping |
| `asr_transcript` | speech-to-text as evidence |
| `codec_validity` | ffmpeg / container probe |
| `temporal_consistency` | video frame-to-frame |
| `collision` | 3D or workspace |
| `manufacturability` | slicer |
| `safety_constraint` | robotics / physical / smart-home |
| `observed_outcome` | receipts, HIL, physical D→R |
| `telemetry` | traces for learn |

Entry shape:

```yaml
id: shadcn-lint
stage: verify
domain: web-ui
modalities: [code, rendered-ui]
role: design-system-compliance
status: reference
satisfies: [design_system_compliance]
```

## In-tree honesty

Scanned every origin branch before seeding. Reused, did not duplicate:

| Already in AODL | Mesh row |
|---|---|
| `schema/` + `tests/validate.py` | `aodl` specify/`native` |
| `compiler/hermes.py` (plan only; never overwrites intent; never fakes observed) | `hermes` plan/`adapter` |
| `harnesses/catalog.json` (`hermes`, `omp`, `o8`, `grok`, `codex`, `claude`, `pi`, `fx`) | `harnessId` only when the id already exists |
| `profiles/hermes.md`, `profiles/intent-contract.md` (preview) | notes, not copied |
| `profiles/o8.md`, `profiles/langchain.md` (nightly / PR #9 only) | `o8` candidate, `langgraph` reference — **not** harness ids |
| `kvnloo/ripple` (separate repo) | `ripple` resolve/`candidate` |

`langchain` and `shadcn` are **not** harness ids. `langgraph` is profile-only. `shadcn-lint` is the first worked example.

## Ripple

Ripple is the ephemeral human-intent-resolution primitive. It is **not this tree** ([kvnloo/ripple](https://github.com/kvnloo/ripple)).

Do **not** invent another UI protocol. Ripple is the fallback when a deterministic verifier cannot resolve intent (taste, underspecification). It can eventually project through A2UI, AG-UI, MCP elicitation, MCP Apps, assistant-ui, CopilotKit, OpenUI, tldraw, image annotation, timeline editors, 3D viewers, Blender / Figma / Photoshop. **Modality follows the unresolved variable.**

HITL render rows in the catalog are projection targets, not AODL widgets.

## Worked example — shadcn/lint

Web UI, `verify`, `design_system_compliance`.

1. Specify the intent in AODL (invariants: tokens, components, accessibility).
2. Run a deterministic verifier (`shadcn-lint`, plus axe / Playwright as needed).
3. Auto-repair what the verifier can prove.
4. If the failure is genuine ambiguity (which variant, taste), **Ripple** — human resolves — intent document updates.
5. Do not encode the live widget as `openQuestions`. Do not add a `fail` event. Failure stays `lifecycle: failed` plus `observation`.

The same pattern generalizes: image metrics, 3D manifold checks, loudness, ffmpeg probe, robotics collision, HIL. This PR does not implement those loops.

## Kerdoios

Seeded as `execute` / `candidate`. Profiles already name it as “where work runs” / speculative execution compiler. No canonical public URL was found at seed time; the row has **no** `url`. Do not invent one.

## Non-goals (this PR and this file)

- Adapters, routers, Evolution Lab, SFT, payment, swarm inference
- HOTL 0.2 schema / EBNF / kind / event changes
- New node kinds, `fail` event, `openQuestions`, sheaf JSON
- Harness ids `langchain` or `shadcn`
- UI in AODL (Ripple owns ephemeral UI)
- Growing silhouette dots into CapabilityCore orbs
- Treating D→R as `dependency` (it is `observation`)
- Inferring unlabeled `hybrid` or `swarm`

Proof: `python3 tests/mesh_registry.py`. HOTL: `python3 tests/validate.py` and `python3 tests/compile.py` stay about documents.
