# Searchable policy kernel profile

AODL is the **contract around a searchable policy**, not the optimizer that searches it. Wire id stays `hotl-0.2`. This profile does not add node kinds, event types, harness ids, or learned-model fields.

The core separation is:

> **Mechanism defines what is valid. Policy chooses among valid actions. Search may improve policy, but it never gets to redefine validity.**

In the formal object

[
\mathcal{O}_t = (V_t, E_t, S_t, \Pi_t, \Gamma_t)
]

the search surface is primarily `\Pi_t`: routing, allocation, scheduling, retry, cache, batching, or other bounded decision policy. `\Gamma_t` remains the authority boundary: hard constraints, budgets, acceptance, human gates, privacy, and non-regression requirements.

## Why this profile exists

Many systems accumulate policy as growing piles of heuristics:

```text
state
  -> branch
  -> special case
  -> retry rule
  -> another threshold
  -> decision
```

The implementation can become difficult to reason about even when the decision surface itself is small.

A searchable policy kernel turns that into an explicit experiment boundary:

```text
observed state
      |
      v
bounded legal action set
      |
      v
candidate policy
      |
      v
action
      |
      v
independent verifier + measurement
      |
      v
keep / discard / shadow / promote
```

The candidate is not assumed to be a neural network. It may be:

- simpler deterministic code;
- a lookup table;
- a decision tree;
- branchless / SIMD / compiler-generated code;
- an eBPF policy;
- a tiny neural network;
- a learned policy later distilled back into deterministic code.

The representation competes on measured outcomes. AODL does not privilege one implementation family.

## Two different research modes

Keep these separate.

### 1. Compiler / distiller

Goal: reproduce the existing policy while reducing runtime or implementation cost.

[
f_{candidate}(x) \equiv f_{reference}(x)
]

for the declared verification envelope.

Approximate students are not promoted merely because average accuracy is high. If exact behavior is required, semantic equivalence is a hard constraint. A tiny model may still be useful as a **teacher** that is later distilled into a deterministic tree, table, BPF program, or source rewrite.

### 2. Self-evolving policy

Goal: allow different decisions when they improve declared objectives.

[
\Pi_{t+1} = \operatorname{Promote}\left(
\operatorname{Pareto}\{c \in C : \Gamma(c)=\text{pass}\}
\right)
]

where the candidate objective vector may include verified success, latency percentiles, throughput, cost, energy, memory, or human-attention spend.

This is not equivalence optimization. It is policy search under a fixed authority envelope.

## AODL mapping

No new HOTL fields are required.

| Concern | Existing owner / primitive |
|---|---|
| Desired outcome and legal envelope | AODL `intentGraph` + `constraints` + `policies` + provenance |
| Hard safety / authority / human approval | `\Gamma_t`, verifier, `humanGate` |
| Observed runtime | `eventLog` + `observedGraph` + receipts |
| Bounded learned decision | z0int / Jev; represented through existing `model` / decision participants, not a new kind |
| Placement / execution portfolio | Kerdoios |
| Execution | Hermes / OMP / existing harnesses |
| Measurement and verified-outcome economics | Tokenomics |
| Candidate generation, training, Pareto / MAP-Elites selection | Evolution Lab |
| Human ambiguity / taste resolution | Ripple |

AODL carries the portable contract that lets those planes agree on **what was intended, what was allowed, what ran, and what counted as verified success**.

It does not store model weights, optimizer state, training corpora, private personal history, or runtime scheduler internals.

## Promotion loop

The operational loop lives outside the IR, but every step should be explainable through the three AODL objects.

```text
reference policy
    |
    v
candidate generation
    |
    v
offline replay / property tests
    |
    v
shadow execution
    |
    v
canary
    |
    v
independent verification
    |
    +---- fail ---> discard / rollback
    |
    v
promote measured Pareto winner
```

Important invariants:

1. **A decision is not evidence of its own correctness.**
2. **Execution completion is not verified success.**
3. **Unknown measurements stay unknown.**
4. **A learned policy selects among legal actions; it does not define legality.**
5. **Fallback is deterministic and fail-closed when confidence, provenance, or verification is missing.**
6. **Promotion is versioned and replayable.** A candidate must identify the contract, evaluator, and evidence bundle it was promoted against.

This is where Tokenomics receipts and Evolution Lab archives become useful without being pulled into AODL itself.

## Where learned policies are appropriate

Good targets usually have the shape:

[
\text{large or noisy state} \rightarrow \text{small bounded decision}
]

Examples:

- model / provider routing;
- retry / recovery choice;
- scheduler priority or placement preference;
- cache admission / eviction;
- batching;
- speculative execution choice;
- context compression choice;
- tool selection;
- resource allocation.

Bad direct-approximation targets are correctness mechanisms whose mistakes violate the contract rather than merely choose a worse valid action:

- cryptography;
- permissions / authorization;
- filesystem semantics;
- locking / memory safety;
- transaction correctness;
- payment authority;
- schema validation.

Search may optimize implementations around those mechanisms, but it must not learn what “correct” means.

## CachyOS / Linux example

CachyOS is a useful **application**, not a new AODL harness id.

Keep Linux mechanisms deterministic and expose selected policy surfaces to experimentation. `sched_ext` is a particularly clean boundary because the kernel retains the mechanism while a BPF scheduler supplies policy and can fall back to the normal scheduler.

A first experiment need not train a neural scheduler. It can search over existing valid policies:

```text
state:
  PSI CPU / memory / IO stalls
  runqueue depth
  wakeup latency
  cache / branch counters
  foreground workload
  Hermes / compile / inference activity

candidate action:
  scheduler/profile
  cgroup weight
  CPU affinity
  bounded power/performance knob

objective:
  p99 / p99.9 wakeup or input-to-frame latency
  compile throughput
  inference throughput
  energy
  stall time
```

The tradeoff itself belongs in intent / `\Gamma_t`. For example, “sacrifice at most 5% background compile throughput to reduce interactive p99.9 latency” is a declared utility constraint, not something the optimizer should silently infer.

A later loop can train a small policy

[
\pi(s) \rightarrow a
]

and compare it against rules, trees, tables, and generated BPF. If a neural policy discovers a useful boundary, distilling it back into a faster deterministic implementation is preferable when it preserves the verified behavior.

Model the OS testbed through existing tools/services/environments and observations. Do **not** add `cachyos`, `linux`, or `sched-ext` as harness ids merely to describe the experiment.

## Relation to Jev

Jev is a bounded scorer, not authority.

A Jev-style model may score legal options

[
P(a_i \mid s)
]

or act as a teacher for a smaller policy, but:

- the action set comes from the runtime / contract;
- `\Gamma_t` determines which actions are legal;
- verifiers determine whether the result succeeded;
- Evolution Lab decides whether a candidate survives measured comparison;
- AODL records the portable intent and evidence relationships.

This keeps the neural component replaceable.

## Non-goals

- No HOTL 0.3.
- No `neural_policy`, `cachyos`, `scheduler`, or `autoresearch` node kind.
- No training loop in this repository.
- No model weights in AODL documents.
- No learned replacement for authority, validation, or safety semantics.
- No claim that a neural implementation is faster than deterministic code without measurement.
