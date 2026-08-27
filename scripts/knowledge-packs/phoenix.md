# Phoenix Conventions

**Last Updated**: 2026-03-29
**Context**: When working with Phoenix controllers, contexts, LiveView, or Ecto

## Architecture
- Contexts are the public API of your domain — controllers call contexts, not schemas directly
- `lib/app/` for business logic (contexts), `lib/app_web/` for web layer
- One context per domain area (e.g., `Accounts`, `Catalog`, `Orders`)
- Schemas define data shape, changesets define validation

## Ecto
- Use changesets for all data validation and casting
- Preload associations explicitly: `Repo.preload(post, :comments)`
- Use `Repo.all()` with queries, never load unbounded data
- Use `Ecto.Multi` for transactional operations spanning multiple queries
- Migrations: one per change, use `mix ecto.gen.migration`

## Controllers
- Keep thin — delegate to contexts
- Pattern match on action parameters: `def show(conn, %{"id" => id})`
- Use plugs for auth, rate limiting, content type negotiation
- Return proper HTTP status with `put_status/2`

## LiveView
- Use `mount/3` for initial state, `handle_event/3` for user actions
- Keep assigns minimal — large assigns = large diffs over WebSocket
- Use `assign_async/3` for data that can load after initial render
- Components: stateless with `function_component`, stateful with `live_component`

## Common Pitfalls
- N+1 queries — preload in the context, not in templates
- `Repo.get!` raises on nil — use `Repo.get` when nil is expected
- Changeset errors are data, not exceptions — pattern match on `{:ok, _}` / `{:error, changeset}`
- PubSub messages in LiveView: subscribe in `mount`, handle in `handle_info`
- Atoms are never garbage collected — don't create atoms from user input
