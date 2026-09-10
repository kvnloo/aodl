# HOTL 0.1 reference

## Core semantics
A graph is a finite typed directed multigraph. `dependency` edges constrain completion; `data` and `artifact` edges describe values; `message` edges describe communication; `delegation`, `review`, `control`, and `observation` are explicit relations. Edges never imply a transport. Ports make type compatibility checkable. A group is a named subgraph, not a scheduler.

Control policy is separate: `fanIn` must be explicit; quorum requires `quorum`; reducer requires `reducer`. Dynamic fan-out requires `allowed=true` and a finite `maxChildren`. Loops are represented only by a future explicit loop construct; dependency cycles are otherwise invalid. Guards are predicates, not executable authority.

Informal EBNF: `Graph := Header Nodes Edges Policies Provenance`; `Node := id role ports*`; `Edge := from to kind`; `kind := dependency|data|message|delegation|review|control|observation|artifact`. Extensions must use `x-` keys and cannot change core meaning.

## Validation
Reject duplicate IDs, missing endpoints/ports, self-edges, unreachable nodes, dependency cycles, implicit fan-in, unbounded spawn, incompatible port types, undeclared human/privileged action, and guarantee claims not backed by the target runtime. A graph with non-dependency message cycles is valid. A dependency DAG does not prove communication, consensus, intelligence, or execution success.

## Normalization and labels
Sort IDs and edges by `(kind,from,to,id)`; omit observations and non-semantic annotations before hashing. Classification is a set, not a scalar:
- `solo`: one node; `pair`: two nodes and one relation.
- `pipeline`: dependency graph is a path.
- `fanout-fanin`: one source, >=2 branches, explicit fan-in.
- `supervisor-tree`: directed delegation/control tree with supervisor role and no peer links.
- `orchestrator-star`: hub has >=2 direct relations but no tree/peer policy; this is shape only.
- `ring`: every node has exactly one successor in a message/data cycle.
- `mesh`: peer-to-peer relation density is explicit; `swarm` is never inferred.
- `blackboard`: coordination=`blackboard` and shared artifact/data object is declared.
- `marketplace`: auction policy is declared; no runtime support is implied.
- `hybrid`: two or more non-nested classes, or an explicit composite group.

Hierarchy is structure; supervisor is a role/policy. Orchestrator is a role; star is shape. Mesh is connectivity; swarm is an informal adaptive behavior claim. Cluster is placement/administration, not topology. Council is a role arrangement; quorum is a decision policy. Blackboard is shared-state coordination; broker is mediated message routing.

## Hermes mapping
| HOTL | Hermes status | Boundary |
|---|---|---|
| node/task identity | native | Kanban task identity |
| dependency edge | native | parent→child only |
| data/message/artifact edge | observable-only | never infer from parent edge |
| fan-in all | compileable | parent list; completion semantics remain Kanban |
| review edge/node | compileable | review child/lane |
| bounded goal loop | compileable | existing goal/judge mechanism only |
| run/status/lease/retry | native/observable | runtime records, not graph identity |
| profile/capability/provider | annotation | never topology |
| human/evidence gate | native where Keel contract exists | fail closed otherwise |
| dynamic children | compileable only bounded | idempotent collision keys required |
| broker/blackboard/auction/ring/mesh | visualization-only | no unsupported runtime claim |

Safe compiler: normalize, hash, dry-run task creation, create one task per node, translate dependency edges to parent lists, create explicit review children, and emit a receipt containing source hash/version and idempotency key. Unsupported edge kinds/policies stop compilation. Reverse projection reports only nodes and dependency edges; all other dimensions are `unknown` unless recorded.

## Badge decoder
At 28px draw only coarse class glyph plus a separate state dot; no provider/model or ranking. At 38px add up to five structural marks and an accessible text label. At 58px show fan-in, role gate, and explicit transport/policy marks. Runtime state is an independently colored/ARIA-labelled marker. Composite/unknown is visibly `hybrid`/`unspecified`, never guessed. Every image has text: `Topology: pipeline. State: running. Coordination: unknown.`

## Rollout
1 docs and schema; 2 parser/validator with negative fixtures; 3 read-only Kanban projector; 4 dry-run compiler and receipts; 5 earned execution subset after independent verification. No scheduler or parallel authority is introduced by HOTL.

## Standards landscape (primary references, accessed 2026-08-17)
Graph terminology: https://doi.org/10.1016/j.ipl.2005.05.001 . BPMN 2.0: https://www.omg.org/spec/BPMN/2.0/ . Petri nets: https://www.informatik.uni-hamburg.de/TGI/PetriNets/ . CWL: https://www.commonwl.org/specification/ . WDL: https://openwdl.org/spec/ . Argo: https://argo-workflows.readthedocs.io/en/latest/ . Tekton: https://tekton.dev/docs/pipelines/ . Temporal: https://docs.temporal.io/ . Step Functions: https://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html . LangGraph: https://langchain-ai.github.io/langgraph/ . AutoGen: https://microsoft.github.io/autogen/ . Semantic Kernel: https://learn.microsoft.com/semantic-kernel/ . OpenAI Agents: https://openai.github.io/openai-agents-python/ . MCP: https://modelcontextprotocol.io/specification/ . A2A: https://a2a-protocol.org/latest/specification/ . Actor model: https://doi.org/10.1145/359576.359585 .

These sources formalize graphs, workflows, messages, or APIs—not a universal agent topology vocabulary. Framework labels are useful presets but must be decoded into HOTL dimensions.

## Collision matrix
| Label | Common collision | HOTL resolution |
| swarm | adaptive peer behavior, any multi-agent graph | explicit policy/coordination; never inferred |
| mesh | full peer connectivity, network fabric | edge structure + substrate |
| hierarchy | tree shape, authority policy | structure separate from role/control |
| supervisor | parent node, Erlang-style restart tree, reviewer | role + control/retry policy |
| orchestrator | hub role, centralized scheduler, star drawing | role != graph shape |
| pipeline | sequence, any workflow | dependency path + ordering |
| council | group of critics, consensus, quorum | roles + decision policy |
| blackboard | shared memory, event bus | substrate + declared artifact |
| cluster | hosts, tenant, graph | placement annotation |
| marketplace | task queue, auction, broker | auction policy + broker substrate |
