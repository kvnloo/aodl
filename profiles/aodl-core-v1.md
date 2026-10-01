# AODL Core v1 conformance

`aodl-core-v1` is the canonical identity projection for a valid HOTL 0.2
intent contract. It is owned by AODL and has no Bend, scheduler, model, or
runtime dependency.

## API

```python
from aodl_contract import to_core, semantic_fingerprint

core = to_core(document)
fingerprint = semantic_fingerprint(document)
```

`to_core()` first runs the canonical AODL validator. Invalid input is rejected;
canonicalization is never a competing interpretation of malformed AODL.

## Included semantics

Core v1 contains exactly:

- `specVersion`
- `graphId`
- `revision`
- `intentGraph`
- `policies`
- `constraints`
- `provenance`

Mutable/runtime projections `plan`, `eventLog`, and `observedGraph` are
excluded. They can describe compilation or observation, but cannot change the
identity of the authored intent contract.

## Canonical ordering

Object key order is irrelevant. These arrays are also treated as order-insensitive
for valid HOTL 0.2 documents and are sorted canonically:

- intent nodes and edges
- node ports
- node `capabilities`
- node `authorityCeiling`
- edge `authority.grant`
- `policies.kinds`

Other arrays retain their authored order. In particular, an ordered protocol
such as auction phases is not silently converted into a set.

The canonical JSON uses UTF-8, sorted object keys, no insignificant whitespace,
and then SHA-256 for `semantic_fingerprint()`.

## Trust boundary

The fingerprint proves identity of canonical authored semantics only. It does
not prove successful compilation, runtime conformance, observed truth, or task
success.

Bend may consume AODL Core v1 in CI/proof experiments, but Bend does not define
or own this normalization.
