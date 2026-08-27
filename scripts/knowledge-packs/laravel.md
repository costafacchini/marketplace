# Laravel Conventions

**Last Updated**: 2026-03-29
**Context**: When working with Laravel controllers, models, or configuration

## Architecture
- Follow MVC: models for data, controllers for HTTP, services for business logic
- Use Form Requests for validation (not inline in controllers)
- Use Resource Controllers for CRUD operations
- Use Actions or Services for complex business logic

## Eloquent
- Use `::query()` for readable query chains
- `with()` for eager loading (prevent N+1)
- Scopes for reusable query logic: `scopeActive($query)`
- Use `$fillable` or `$guarded` on every model — mass assignment protection
- Accessors/mutators via `Attribute` cast (Laravel 9+)
- Use `chunk()` or `cursor()` for large datasets

## Controllers
- Keep thin — delegate to services/actions
- Use route model binding (`User $user`) instead of manual `find()`
- Return Resources/JsonResources for API responses
- Use middleware for auth, rate limiting, CORS

## Migrations
- One migration per change, descriptive name
- Use `$table->foreignId('user_id')->constrained()` for foreign keys
- Never edit merged migrations
- Use `artisan migrate:fresh --seed` for dev resets

## Common Pitfalls
- N+1 queries — always use `with()` for relationships displayed in loops
- `$model->save()` vs `$model->update()`: save validates, update mass-assigns
- Queue jobs: always implement `ShouldQueue`, pass IDs not models
- `Carbon::now()` vs `now()` helper — use helper for brevity
- Facade testing: `Bus::fake()`, `Event::fake()`, `Mail::fake()` before assertions
