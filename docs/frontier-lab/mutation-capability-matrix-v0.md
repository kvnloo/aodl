# Mutation capability matrix v0

This profile classifies **effect boundaries**, not tools by brand. A single tool may expose operations in more than one class.

The machine-readable catalog is `profiles/mutation-capabilities.json`.

## Decision rule

Before an automatic retry, answer these in order:

1. Did the previous attempt cross a mutation/effect boundary?
2. If not, is there evidence proving `effect=none`? If yes, `retry` may be legal.
3. If the effect is unknown, does the receiver durably bind a stable mutation key to the effect and reject same-key/different-content? If yes, `resend` the **same identity/content**.
4. Otherwise, can the target be observed well enough to determine whether the effect landed? If yes, `observe`.
5. If neither exists, `escalate`.

Never mint a new mutation identity merely because the previous acknowledgement was lost.

## Why this is a capability matrix

"POST", "tool call", "shell command", or "click" are not enough to decide retry safety. The relevant capabilities are:

- stable logical identity;
- receiver-durable identity/content binding;
- atomic uniqueness with the effect;
- observability of postconditions;
- whether an exception is known to be pre-effect.

This lets routers reason about retries without importing runtime-specific implementation details.

## Training use

Every Frontier Lab transfer should classify the operation, inject at least one acknowledgement-loss or race fault, and try to falsify the class. If evidence contradicts the registry, change the registry rather than forcing the runtime to fit it.


## Cross-domain resend evidence

`receiver-durable` is not synonymous with "database unique constraint."

- SuperSync binds a logical operation to durable `Operation.id`.
- Hermes Relay binds a sealing draft frame to a sealed-key tombstone; an ambiguous acknowledgement can replay the same frame once and the connector returns the original stream identity rather than opening another stream.

The shared property is receiver-held identity + same-identity replay semantics.

## HTTP-method caution

Do not infer a mutation class from `POST`, `PATCH`, `PUT`, or `DELETE` alone. Some deletes are state-idempotent, but repeated calls may still emit duplicate external events; some POSTs are strongly idempotent under a request/operation key. Classify the concrete receiver contract, not the verb.
