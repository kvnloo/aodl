# Mutation Outcome Receipt profile

Protocol id: `mutation-outcome-receipt/v0`

This profile constrains ordinary HOTL 0.2 `stateUpdate` events. It does not change the HOTL schema or event vocabulary.

A document opts in with:

```json
"policies": {
  "protocol": "mutation-outcome-receipt/v0"
}
```

Every `stateUpdate` event whose payload has `"receiptKind": "mutation-outcome/v0"` is validated by the profile.

Required payload fields:

- `mutationKey`: non-empty stable logical mutation identity;
- `authorityScope`: non-empty scope string;
- `attempted`: boolean;
- `effect`: `none | unknown | observed`;
- `verification`: `unverified | verified`;
- `retryDisposition`: `retry | observe | stop`.

Optional:

- `evidenceRef`: content-free proof reference;
- `effectHash`: lowercase SHA-256 hex of the observed effect.

Normative retry rules are defined in `docs/frontier-lab/mutation-outcome-receipt-v0.md` and enforced by the Python validator.

A receipt is evidence, not authority. It cannot increase `authorityCeiling`, grant a capability, bypass a `humanGate`, or make an irreversible action reversible.
