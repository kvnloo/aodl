# Read-only consumer CLI

Supports #20 and [o8's authored-intent slice](https://github.com/hurttlocker/o8/issues/3185).
Thanks to Marquise for helping shape the continuity-first integration. This
consumer reuses the canonicalization behind #39; it defines no new hash algorithm.

From an immutable, complete AODL source checkout:

```sh
python3 -m aodl_contract.cli --fingerprint --json - < contract.json
```

The installed entry point is `aodl-validate` with the same arguments. The existing
file-validation form and `-V` remain available. For this experiment use the full
source checkout: wheel/catalog packaging conformance is a separate boundary.

One JSON line is returned for a document invocation. `schema` is
`aodl.validation.v1`; `ok`, `wireSpec`, `validatorRevision`, `canonicalVersion`,
`semanticFingerprint`, `inputSha256`, `issues` and `error` are explicit. Only
`--fingerprint` requests semantic identity. Validation alone returns a null
fingerprint. JSON diagnostics contain issue codes, not private source values.
`inputSha256` binds the response to the exact submitted bytes; it is not the
semantic fingerprint or a replacement for `provenance.sourceHash`.

Exit codes: `0` is validation success, `1` is semantic rejection, `2` is an input,
invocation, or validation/canonicalization error. Consumers must check both the
exit code and the envelope, not the presence of a string. Argument/help errors
retain argparse's normal stderr behavior. Inputs are UTF-8 and bounded to 1 MiB;
duplicate object keys and nonfinite numbers are rejected before validation.

`aodl-canon-1` fingerprints the supplied document, including `plan`, `eventLog`
and `observedGraph` when present. Nothing here strips those fields. For an
immutable authored-intent reference, persist and fingerprint an authored document
without mutable runtime projections, and link observed state separately. Do not
relabel a mutable full-document fingerprint as intent-only identity.

This command validates declared structure. It does not authenticate an operator,
verify task completion, reserve a budget, authorize dispatch, or enforce a
transition. The o8 control plane retains those responsibilities. A Ripple patch
path is not automatically a valid HOTL JSON path: compile a supported projection
before submitting the resulting document; do not add new top-level HOTL fields.

Adapters should invoke an operator-configured executable with argv and stdin, not
a shell command containing the document. Apply an external time limit and output
bound, pin the expected validator/canonicalization revision, and treat missing,
malformed, or mismatched results as unavailable. Do not overwrite existing intent
or silently dispatch without a required contract on validation failure.

Proof: `python3 -m unittest discover -s tests -p test_cli_json.py -v` exercises the
actual subprocess entry point and compares fingerprints to the canonical library.
