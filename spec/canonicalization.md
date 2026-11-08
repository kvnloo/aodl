# HOTL 0.2 canonicalization and semantic fingerprint (`aodl-canon-1`)

Status: v1, first slice of kvnloo/aodl#21. Specified here before any proof backend uses it.

`provenance.sourceHash` identifies where a document came from. The **semantic
fingerprint** identifies what it means, so replay, caching, lineage, experiment
attribution and proof attestation do not depend on JSON presentation order. The
fingerprint is derived metadata: it is not a HOTL field and it never replaces
`sourceHash`.

## Preconditions (fail closed)

1. `specVersion` must be `"0.2"` (wire identifier `hotl-0.2`). Other versions are rejected, not approximated.
2. The document must validate with zero issues (`aodl_contract.validate`).
3. Every entry of an id-keyed collection (below) must have a string `id`, unique within
   that collection. Otherwise canonicalization is refused.

The input document is never mutated.

## Rules

Declared ids are preserved. There is no graph isomorphism and no alpha-renaming.

| Location | Treatment | Why |
| --- | --- | --- |
| `intentGraph.nodes`, `observedGraph.nodes` | sort by `id` | declaration order is not semantic |
| `intentGraph.edges`, `observedGraph.edges` | sort by `id` | declaration order is not semantic |
| `nodes[].ports` | sort by `id` | declaration order is not semantic |
| `nodes[].capabilities`, `nodes[].authorityCeiling`, `edges[].authority.grant`, `policies.kinds`, `eventLog[].causalParents` | sort (strings); duplicates kept | set-like |
| `eventLog` | **order preserved** | event order is semantic |
| every other list | order preserved | unknown lists are assumed ordered (conservative) |
| object keys | irrelevant (serialized sorted) | JSON objects are unordered |

## Fingerprint

`semantic_fingerprint(doc) = "aodl-canon-1:" + sha256(S)` where `S` is the canonical
document with every object member named `provenance` removed (at any depth),
serialized as UTF-8 JSON with sorted keys, separators `,` and `:`, and no ASCII
escaping. Values keep their JSON types (`1`, `1.0`, `true` and `"1"` are distinct
as serialized).

## Versioning

Any change to these rules, to the excluded members, or to the serialization is a new
version (`aodl-canon-2`, ...). A fingerprint with an unknown version prefix must be
treated as non-comparable, never as equal or unequal.
