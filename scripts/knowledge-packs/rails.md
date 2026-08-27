# Rails Conventions

**Last Updated**: 2026-08-26
**Context**: When working with Rails controllers, models, views, migrations, jobs, or configuration

## Architecture

- Keep controllers thin — domain behavior lives in models. A controller action should read as a single delegation.
- **State as records, not booleans.** Instead of `closed: boolean`, create a `Closure` record with `creator` and timestamps — who/when for free, trivial scoping:
  ```ruby
  scope :closed, -> { joins(:closure) }
  scope :open,   -> { where.missing(:closure) }
  ```
- **Concerns named for capability**, not technical layer — `Closeable`, `Watchable`, `Assignable`. Each is self-contained (~50-150 lines). Nest under model namespace (`Card::Closeable` in `app/models/card/closeable.rb`); reserve `app/models/concerns/` for genuine cross-model behavior. Never extract concerns containing only private methods.
- POROs live in `app/models/`, not `app/services/` — they are model-adjacent objects (presentation, complex ops, view-context bundles).
- Default values via lambdas: `belongs_to :creator, class_name: "User", default: -> { Current.user }`.
- **Prefer write-time computation** over expensive read-time composition: counter caches, delegated types, precomputed rollups, `dependent: :delete_all` on join tables without callbacks.
- Callbacks for setup/cleanup only, not business logic. Keep callback counts low.
- Rails shortcuts to reach for: `normalizes`, `store_accessor`, `delegated_type`, `generates_token_for`, `after_save_commit`, `touch: true` chains, `delegate`, `insert_all` for bulk creates.
- Let it crash: bang methods (`create!`); handle exceptions at system boundaries only.
- Fix root causes: `enqueue_after_transaction_commit` over retry logic for job-before-data races.

## Naming

- Spend time on names — naming is design. `Closure` beats `CardClose`; `Mention` beats `UserReference`.
- Positive names: `active` not `not_deleted`, `visible` not `not_hidden`.
- Semantic associations named for role: `belongs_to :creator, class_name: "User"`, not `belongs_to :user`.
- Business-focused scopes: `:active`, `:unassigned` — not SQL-ish `:without_pop`.
- Consistent domain language throughout: don't mix `source`/`resource`/`container` for one concept.

## REST & Routing

- Everything is CRUD: turn verbs into nouns. Close → `resource :closure` (POST closes, DELETE reopens); publish → `resource :publication`. No custom member actions.
- Singular `resource` for one-per-parent state; `scope module:` to group nested controllers (`Cards::ClosuresController`).
- Same controllers serve HTML/Turbo/JSON via `respond_to` — no separate API namespace for internal UIs.
- Human-friendly URLs: override `to_param` with a per-tenant `number` rather than exposing raw IDs.

## ActiveRecord

- Always use `.includes()` or `.preload()` to prevent N+1 queries.
- Never call `.all` without pagination or limits in controllers.
- Use `find_each` / `in_batches` for batch processing — never one giant read.
- Validate at model level; favor DB constraints for hard invariants over AR `validates uniqueness` (the validation races; the index doesn't).
- Use `enum :status, %w[drafted published].index_by(&:itself)` for string-backed enums (Rails 7+).
- Scoped queries through ownership: `Current.user.accessible_cards.find_by!(number: params[:id])` — params choose *which* record within an already-authorized set, never establish access.
- Public sharing uses opaque tokens (`has_secure_token :key` on a `Publication` record), never internal IDs.

## Controllers

- Keep actions under 10 lines — delegate to model methods.
- Use `before_action` for auth and record loading, not business logic.
- Strong params: `params.expect(...)` in modern Rails; `params.require().permit()` otherwise.
- Respond with proper HTTP status codes; `head :forbidden` when access cannot be proven (fail closed).

## Migrations

- Make migrations reversible (`reversible` blocks); use raw SQL for data manipulation inside migrations — avoid referencing app models that drift over time.
- Never lock large tables; split risky work into deploy-safe steps: add nullable column → backfill → enforce `NOT NULL`.
- Add index concurrently when needed; dedupe data before adding a unique index.
- Long-running backfills live in `script/migrations/*.rb`, run manually — not in the deploy migration window. Backfills must be idempotent and batched (`find_each`), never one giant write.
- Staged column replacement: Deploy 1 add nullable → Deploy 2 dual-write/backfill → Deploy 3 read from new → Deploy 4 enforce constraints, drop old column later.
- Multi-tenant index strategy: replace global indexes with `[account_id, ...]` composites; scoped uniqueness at DB level (`add_index :tags, [:account_id, :title], unique: true`).

## Background Jobs

- Keep jobs shallow — one line calling a model method: `def perform(card) = card.notify_recipients`.
- Make jobs idempotent and safe to retry; fail loudly on real errors, avoid silent rescues.
- Set `ActiveJob::Base.enqueue_after_transaction_commit = true` — fixes job-before-data races at the root.
- Naming: plain name does the work, `_later` enqueues (`notify_recipients` / `notify_recipients_later`).
- Pass records (GlobalID) or IDs, never full object graphs. Serialize tenant context at enqueue time — never read `Current` inside `perform`.
- Queues split by criticality (`default`, `backend`, `webhooks`); stagger recurring jobs at odd minutes to avoid load spikes.
- Prefer Solid Queue (database-backed) over Redis for new apps.
- Retry transient failures with `retry_on ..., wait: :polynomially_longer`; don't retry permanent failures — classify by error class, log at `:info`, and move on.

## Rails 8.1 Features

- **Active Job Continuations**: long-running jobs can now survive restarts and resume from a checkpoint. Use `checkpoint!` inside `perform` to persist state. Enables pause/resume, human-in-the-loop steps, and durable multi-step workflows without custom orchestration.
- **Structured Event Reporting**: use `ActiveSupport::EventedFileUpdateChecker`-adjacent new `event_report` API for structured observability hooks — emit named events with a payload hash instead of raw logging.
- **Ruby 4.0** (current runtime): ships ZJIT (optimizing JIT) and Ruby Box (memory isolation). No breaking API changes from Ruby 3.x for typical Rails code; ZJIT is on by default and improves CPU-bound throughput.

## Authorization

- No Pundit/CanCanCan: predicate methods on models (`card.editable_by?(user)`, `user.can_administer_board?(board)`); controllers check and `head :forbidden`.
- Declarative controller macros for auth posture (`allow_unauthenticated_access`, `ensure_can_administer`) over scattered conditionals.

## Testing

- Minitest + fixtures; no RSpec, no FactoryBot.
- Test behavior, not implementation details; ship tests in the same PR as behavior changes.
- Coverage budget — heavy: model tests (domain invariants) and controller/integration tests (request cycle, auth, formats); light: system tests for critical happy paths; none: view tests, JS unit tests.
- Fixtures over factories — deterministic, fast. Mirror `app/models/` structure in `test/models/`.
- Mock/stub only at system boundaries (external APIs, network, time, `SecureRandom`).
- Authorization tests assert the negative space: cross-tenant/cross-role access returns 403/404, not just that allowed access works.
- Test both response formats where controllers serve them: `as: :turbo_stream` and `as: :json`.

## Dependencies

Before adding a gem: can vanilla Rails do this? Is 50-150 lines in-repo simpler than a dependency? Commonly skipped: Devise, Pundit, ViewComponent, RSpec, FactoryBot, Redis (Solid Queue/Cache/Cable use the DB), service objects, form objects, GraphQL, SPA frameworks.

## Red Flags

- Unscoped record lookups in tenant-aware flows (`Comment.find(params[:id])`).
- New dependencies without strong justification.
- In-memory filtering/sorting that belongs in SQL (`.map(&:name)` where `.pluck(:name)` works).
- Service objects replacing straightforward model methods.
- Non-RESTful custom actions when resource modeling is clearer.
- Boolean state columns where a record would capture who/when.
- `validates :x, uniqueness: true` without a backing unique index.
- `default_scope` — use named scopes.
- Referencing app models inside migrations.
- Callbacks for business logic rather than setup/cleanup.
- Private-only concerns — inline them.
- Background jobs enqueuing before required records are committed.
- Reading `Current.user`/`Current.account` inside `perform` without serializing at enqueue time.
- Metaprogramming for 2-3 cases — just write the methods.
