# Security Patterns

**Last Updated**: 2026-07-17
**Context**: When implementing authentication, authorization, webhooks, external HTTP calls, or any security-sensitive endpoint

## Core Principle

- Fail closed: when access cannot be proven, deny and return 403/404. Never fail open.
- Treat all external/user-provided input as untrusted: URLs, payloads, headers, query params.
- Validate at system entry points; trust internal code and framework guarantees within the boundary.

## Authentication Layering (multi-tenant)

- Three-layer auth: **Identity → Session → tenant-scoped User.** Sessions attach to an Identity; each request resolves the User for the current tenant from that Identity. A valid session in tenant A can never act in tenant B.
- Setters cascade: assigning the session resolves identity; assigning identity resolves user for the current tenant.
- Auth routes (login, signup, magic links) explicitly opt out of tenant scoping and redirect away from tenant-prefixed URLs.
- Magic links / one-time codes: single-use (consuming destroys the row), short-lived, compared with constant-time equality, bound to email via a verified pending-auth cookie. Unknown addresses get the same fake flow/UX as real ones (anti-enumeration).
- API tokens: method-scoped permissions (read-only tokens can't mutate); show generated secrets once via a short-lived signed token, then never again.

## Scoped Lookups

- Params choose *which* record within an already-authorized set — they never establish access.
- Always scope queries through ownership associations: `current_user.accessible_items.find_by!(id: params[:id])`.
- Public sharing: opaque tokens on a join record, never internal IDs.
- Revoking access must clean up derived data (mentions, notifications, watches) — no dangling cross-boundary state.

## SSRF Defense

For webhooks, push endpoints, link unfurling — any user-influenced URL:

1. Resolve DNS and validate the destination IP before the request; block loopback, private, link-local, and IPv4-mapped-IPv6 ranges (link-local = cloud metadata endpoint).
2. Pin the request to the validated IP to prevent DNS rebinding attacks.
3. Validate at creation time **and again** at execution time.
4. Re-resolve and re-validate on every redirect hop — redirect chains are the classic SSRF bypass.
5. Cap response sizes (content-length pre-check + chunked read limit) to prevent memory DoS.
6. Layer destination allowlists on top where the destination set is known.

## Rate Limiting

- Rate-limit authentication and abuse-prone endpoints (login, signup, password reset, API write operations).
- Match the response to the endpoint semantics: redirects for browser flows, JSON errors for API flows.
- Throttle session bookkeeping writes (e.g. `last_active_at` at most hourly, not per request).
- Enforce IP bans only on mutating requests (POST/PUT/PATCH/DELETE); never ban loopback/private ranges.

## Webhook Security (outbound)

- Sign all outbound payloads: HMAC signature header + timestamp header.
- Webhook destination URLs are untrusted user input — apply full SSRF defense on create and again at send time.
- Treat destination URLs as immutable after creation; retargeting requires a new webhook with a new secret.
- Whitelist subscribable event types at the model layer, not in controller params.
- Track consecutive delivery failures; auto-deactivate after N failures spanning a minimum window (circuit breaker). Reset counter on success.

## Webhook Security (inbound)

- Verify the provider signature first before any processing.
- Re-fetch canonical state from the source API rather than trusting payload contents or ordering — payloads can be replayed, reordered, or forged.

## CSRF and Caching

- Never HTTP-cache responses that render forms or CSRF tokens — stale tokens cause 422s.
- Private apps: send `X-Robots-Tag: none`.
- Content Security Policy hard floor: block object embeds, base tag overrides, and unexpected frame ancestors.

## Authorization Defaults

- Simple predicate methods on domain objects (`item.editable_by?(user)`); calling code checks and returns 403.
- Declarative controller/handler macros for auth posture over scattered conditionals.
- Centralize shared guard logic in small, named modules.

## Red Flags

- Unscoped record lookups: `Model.find(params[:id])` in tenant-aware or multi-user contexts.
- User-provided URLs fetched without SSRF validation.
- Redirects followed without re-validating the destination IP.
- Session or auth data that doesn't scope to the current tenant.
- Secrets permanently visible in admin UIs.
- Auth or signup endpoints without rate limiting.
- Inbound webhook payloads trusted without signature verification.
- Security controls in ad-hoc conditionals scattered across handlers rather than centralized.
