# Frontier Lab: Mutation Outcome Receipt v0

Status: experimental profile. It does not add a new HOTL event type or scheduler.

## Hypothesis

A mutation with an ambiguous outcome must never be retried under a **new logical identity**.

After dispatch with an unknown effect, a runtime has three safe paths:

1. **observe/reconcile** before deciding what to do next;
2. **resend the identical mutation** only when a durable receiver-side idempotency contract binds the same mutation key to the same content; or
3. **escalate unresolved** when neither a reliable observation nor a safe same-ID resend exists.

A fresh mutation identity after an ambiguous attempt is invalid. An unresolved ambiguity must never be relabeled as successful completion.

### Revision from the first hypothesis

The initial study hypothesis allowed automatic retry only after proving that the prior attempt had no effect. Super Productivity falsified that stronger claim: its server can safely receive the same operation again after a lost acknowledgement because `Operation.id` is durably unique and same-ID/different-content is rejected. The retry is safe even when the first effect may already exist.

This is the intended research loop: preserve the counterexample and refine the invariant rather than forcing every runtime into CUA's weaker stop-and-observe model.

## Why this study exists

Three current systems already implement pieces of the same safety boundary:

| Runtime | Evidence already present | Gap exposed by normalization |
|---|---|---|
| CUA guarded completion | session-bound authority, exact-single-candidate admission, fresh refs, one-shot plan consumption, content-free route receipts | `dispatch_attempted` proves dispatch, not whether the external mutation landed when acknowledgement is lost |
| Super Productivity sync | unique operation id, client id, vector clock, local sequence, `syncedAt`, rejection/application status | rich causal history exists, but the retry/no-retry decision is not named as a portable receipt |
| Hermes | admission receipts are explicitly not execution acknowledgements; completed terminal processes can write atomic, redacted durable result receipts; disk failure never claims durability | a process completion receipt does not by itself prove every external side effect of the command |

The experiment asks whether one conservative receipt can describe the shared decision boundary without erasing those differences.

## Normalized receipt

A Mutation Outcome Receipt is carried in an ordinary HOTL `stateUpdate` event payload:

```json
{
  "receiptKind": "mutation-outcome/v0",
  "mutationKey": "stable logical mutation identity",
  "authorityScope": "session/task/device scope that authorized it",
  "attempted": true,
  "effect": "none | unknown | observed",
  "verification": "unverified | verified",
  "retryDisposition": "retry | observe | resend | escalate | stop",
  "idempotency": "none | receiver-durable",
  "mutationHash": "optional sha256 binding the mutation content",
  "evidenceRef": "content-free reference to the proof",
  "effectHash": "optional sha256 of the observed effect"
}
```

The receipt is intentionally content-free. Raw prompts, commands, credentials, screenshots, tool arguments, and model reasoning do not belong in it.

### Required safety rules

1. `effect=unknown` => `retryDisposition=observe|resend|escalate`; never ordinary `retry` or success-like `stop`.
2. `retryDisposition=resend` is legal only when:
   - `effect=unknown`;
   - `idempotency=receiver-durable`;
   - `mutationHash` is present;
   - `evidenceRef` identifies the durable dedupe contract.
3. Every receipt for the same `mutationKey` that carries `mutationHash` must carry the same hash. Same identity/different content is a conflict.
4. `retryDisposition=escalate` is legal only for an attempted mutation with `effect=unknown`; `evidenceRef` must name the unresolved boundary handed to a human/higher-level reconciler.
5. `effect=observed` => `retryDisposition=stop` and `effectHash` is required.
6. `verification=verified` => `retryDisposition=stop` and `evidenceRef` is required.
7. Ordinary `retryDisposition=retry` is legal only when `effect=none`; if an attempt occurred, `evidenceRef` must prove the pre-effect boundary.
8. `attempted=false` cannot claim `effect=unknown|observed`.
9. The same `mutationKey` may progress from unknown to observed/verified, but two observed receipts for that key with different `effectHash` values are a conflict.
10. The receipt never grants authority. Existing AODL authority rules still govern the mutation.

The important distinction is **retry vs resend vs escalate**. `retry` authorizes another logical mutation because the prior effect is proven absent. `resend` retransmits the same logical mutation key/content so a durable receiver can return or reconstruct the prior result without duplicating the effect. `escalate` preserves the ambiguity as ambiguity when automation has no safe next move.

## Adversarial corpus

The executable corpus includes:

- safe pre-effect failure -> retry;
- acknowledgement lost after dispatch without durable idempotency -> observe, not retry;
- acknowledgement lost with durable receiver idempotency -> resend same key/content;
- acknowledgement/delivery ambiguous with no observable state and no durable dedupe -> escalate unresolved;
- observed effect -> stop;
- verified effect -> stop;
- unknown + ordinary retry -> invalid;
- unknown + resend without durable idempotency proof -> invalid;
- same mutation key + conflicting mutation hashes -> invalid;
- observed + retry -> invalid;
- same mutation key + conflicting observed hashes -> invalid.

## Transfer plan

### CUA

Map existing `BoundCompletionEvidence` / `TwoActionContinuationJournal` into the admission half of the receipt, then add one new fault-injection case:

1. dispatch mutation;
2. apply effect in the fixture world;
3. drop acknowledgement;
4. assert the normalized result is `effect=unknown, retryDisposition=observe`;
5. observe world state;
6. resolve to `effect=observed|verified, retryDisposition=stop`;
7. assert no second mutation dispatch.

This is deliberately different from the existing "failed proof clears pending authority" test: that test prevents a *next* guarded child; this one prevents replaying the *same* possibly-landed mutation.

### Super Productivity

Use `Operation.id` as the mutation key. Candidate mapping:

- local op before upload: attempted locally, remote effect unresolved;
- server acknowledgement (`syncedAt`) or later download of the same op id: observed/verified remote durability;
- explicit rejection (`rejectedAt`) before server acceptance: no remote effect, eligible for the resolver/rebase path;
- network ambiguity with no acknowledgement: safely resend the exact same `Operation.id` and immutable operation content. Durable duplicate detection is the observation/reconciliation mechanism: the server either accepts once or reports the existing duplicate; it rejects same-ID/different-content.

The vector clock remains causal evidence; this profile does not replace it.

### Hermes

Keep the explicit distinction already documented in `MessageEvent._gateway_accepted`: admission is not execution acknowledgement.

Hermes already has two directly relevant fail-closed behaviors:

- failed turns containing tool activity use `PARTIAL_FAILED_TURN_NOTICE`: "Some actions may already have run; verify their effects before resending." This maps to `effect=unknown, retryDisposition=escalate`;
- an explicitly ambiguous full-final delivery timeout does not blindly send the message again because a duplicate user-visible delivery is possible.

For terminal processes, an atomic retained process-result file can provide execution-completion evidence. If persistence fails, Hermes already logs the failure and does not claim durability. For commands with external side effects, a process exit alone remains insufficient; the adapter needs a domain observation before `verification=verified`.

The Frontier Lab transfer also found a lower-level gap: the foreground terminal retry loop treated every unexpected `env.execute()` exception as pre-effect. The downstream experiment now marks exceptions after process spawn as ambiguous and fences automatic replay.

## Metrics

For each runtime and fault class record:

- duplicate external mutations;
- false suppression of a needed retry;
- time to reconcile an ambiguous outcome;
- extra observations/tool calls;
- bytes in the normalized receipt;
- whether raw user/tool content leaks into the receipt.

The target is zero duplicate mutations and zero false "verified" claims. Latency is secondary until those hold.

## Non-goals

- exactly-once delivery as a global guarantee;
- replacing vector clocks, operation logs, browser refs, process receipts, or runtime-specific journals;
- a new event type;
- encoding raw execution content;
- claiming novelty for idempotency or distributed retry theory.

The candidate contribution is the **portable fail-closed decision boundary and benchmark**, not the underlying distributed-systems ideas.
