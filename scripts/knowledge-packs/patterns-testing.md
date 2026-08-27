# Testing Patterns

**Last Updated**: 2026-07-17
**Context**: When writing tests, reviewing test quality, or improving slow and flaky test suites

## Defaults

- Test behavior, not implementation details. Tests that assert internal state rather than observable outcomes break on refactors that don't change behavior.
- Ship tests in the same PR as the feature or fix — not before, not later. Security fixes always include a regression test.
- Never add production complexity for testability (no test-induced design damage). If the code is hard to test, the design may need to change — not the test philosophy.
- Keep tests deterministic and parallelizable.

## Coverage Budget

Spend testing effort where it pays off most:

- **Heavy**: domain/model tests (invariants, business rules, edge cases) and integration/controller tests (full request cycle, auth, response formats).
- **Light**: a few end-to-end / system tests for critical happy paths — one smoke test can cover a full flow.
- **None**: view/template rendering tests, exhaustive unit tests for trivial delegations or one-liner methods.
- Don't duplicate the same behavior assertion at multiple layers — pick the layer closest to the behavior.

## Test Isolation

- Keep setup close to assertions; tests should be self-explanatory without scrolling.
- Use deterministic fixtures or factory data; avoid runtime randomness in test inputs.
- Mock and stub only at system boundaries: external APIs, network calls, time, randomness. Never mock internal application code.
- Reset shared global state per test when running in parallel (thread-locals, singletons, caches).
- Use time-freezing helpers (`travel_to`, `freeze_time`, etc.) for any time-dependent assertion.

## Authorization Tests

- Always assert the negative space: cross-tenant, cross-role, or unauthenticated access must return 403 or 404, not just that authorized access succeeds.
- Test that revoking access prevents subsequent operations — not just at the permission check, but on derived data (queries, broadcasts, notifications).

## Async and Side Effects

- Test async side effects from the triggering call (e.g. "after creating a mention, the notification job enqueues"), not by unit-testing trivial job or worker classes.
- Assert the observable outcome (record created, email sent, event emitted), not job internals.
- Provide helpers that run enqueued jobs inline for integration tests rather than mocking the queue.

## External HTTP

- Record and replay external HTTP in tests (VCR / cassettes / fixture files); auto-name cassettes from test class + test name so they're traceable.
- Normalize timestamps in cassette matching to prevent expiry-driven test failures.

## Red Flags

- Tests that mock internal application code — they test the mock, not the behavior.
- Duplicate assertions for the same behavior at model, controller, and system layers.
- Slow suites from expensive per-test setup that fixtures or shared setup would handle once.
- Unit tests for one-line delegations or trivial wrappers.
- Time-dependent assertions without time-freezing.
- Test-only code paths in production classes (feature flags, `if Rails.env.test?` branches).
- Tests that pass in isolation but fail in parallel — hidden shared state.
