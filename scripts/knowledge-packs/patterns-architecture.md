# Architecture Patterns

**Last Updated**: 2026-07-17
**Context**: When designing domain models, background job pipelines, async delivery systems, or evaluating abstractions

## Design Defaults

- **Abstractions must earn their keep.** If you can't point to 3+ real variations that require the abstraction, inline it. Three similar lines is better than a premature helper.
- **YAGNI over defensive design.** Don't design for hypothetical future requirements. Add flexibility when the second real case appears.
- Prefer clear, explicit code over clever patterns. The next reader pays the cost of cleverness.
- Fix root causes, not symptoms — don't add retry loops to mask race conditions; fix the ordering.
- Keep interfaces small; don't add public methods that aren't called anywhere.

## State Modeling

- **State as records, not booleans or status columns.** Instead of a `closed: boolean` field, create a record that captures who changed state and when. You get history, attribution, and trivial scoping for free.
- A state record also makes the transition itself a first-class domain event — you can attach callbacks, metadata, and audit trails without retrofitting.
- Use enumerations for fixed sets of states, but prefer a record when: the transition has actors, timestamps, or metadata; or when the state is frequently queried as a scope.

## Write-Time Over Read-Time

- Compute and persist derived values at write time rather than assembling them at read time.
- Counter caches, precomputed rollups, and denormalized summaries are preferable to complex joins or aggregations in hot read paths.
- The cost of a slower write is predictable and isolated; the cost of a slow read compounds with traffic.

## Naming

- Spend time on names — naming is design. A name that fits the domain concept is worth the iteration.
- Positive names: `active` not `not_deleted`, `visible` not `not_hidden`. Negative names make condition logic harder to reason about.
- Name things for their role in the domain, not their technical function: `creator` not `user`, `recipient` not `target`.
- Consistent domain language throughout: don't use `source`, `resource`, and `container` interchangeably for the same concept.

## Module / Concern Organization

- Organize modules by domain capability, not technical layer — `Closeable`, `Watchable`, `Assignable` rather than `Scopes`, `Callbacks`, `Validations`.
- Each module should be self-contained: its associations, scopes, and methods belong together.
- Reserve shared/global modules for behavior that is genuinely cross-cutting; prefer namespaced modules for domain-specific slices.

## Reliable Async Delivery (Outbox Pattern)

For any delivery that must survive crashes, use the outbox pattern:

1. On the triggering event, create a persisted `Delivery` record with a state enum (`pending → in_progress → completed / errored`).
2. The delivery record auto-enqueues its own send job on creation — persist first, deliver second.
3. The send job owns the delivery lifecycle; crashes restart from the persisted record, not from scratch.
4. Record request and response metadata on the delivery row for audit and debugging.
5. Use a dedicated queue so slow destinations can't starve other work.

## Idempotency

- Background jobs and data migrations must be safe to retry without producing duplicate side effects.
- Guard with unique constraints, conditional inserts (`INSERT ... ON CONFLICT DO NOTHING`), or explicit existence checks before mutating.
- Long-running iterations (fan-out jobs, backfills) use cursor-based continuation so a mid-batch crash resumes rather than restarts.

## Failure Classification

Distinguish two categories of failure in async pipelines:

- **Expected destination failures** (timeout, DNS, connection refused, HTTP 4xx/5xx from the target): record the outcome, mark the job complete. The job ran — the destination failed. Do not retry.
- **Unexpected exceptions** (bugs in your code): mark errored, re-raise for automatic retry.

This split keeps retry behavior, dashboards, and circuit breakers honest.

## Circuit Breaker

- Track consecutive failures + first-failure timestamp per integration endpoint or webhook destination.
- Auto-deactivate after N failures spanning a minimum window to stop hammering dead endpoints.
- Reset the failure counter on success.
- Surface inactive state in the UI with a manual reactivation path.

## Red Flags

- Abstractions added for hypothetical future cases without a third real variation.
- Status boolean columns when a record would capture who/when and enable history.
- Expensive aggregations or joins assembled at read time that could be precomputed.
- Non-idempotent background jobs or migrations with no retry guard.
- Fire-and-forget delivery with no persisted audit trail.
- Retrying expected destination failures (timeouts, 4xx) the same way as code bugs.
- No circuit breaker — hammering failed endpoints indefinitely.
- Module/concern boundaries drawn by technical layer rather than domain capability.
