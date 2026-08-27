# Django Conventions

**Last Updated**: 2026-03-29
**Context**: When working with Django models, views, templates, or configuration

## Architecture
- Follow MVT: models for data, views for logic, templates for presentation
- Use class-based views (CBVs) for CRUD, function-based views (FBVs) for custom logic
- Business logic in models or `services.py` — not in views
- Use `apps/` directory structure for multi-app projects

## Models
- Always set `verbose_name` and `verbose_name_plural` in `Meta`
- Use `CharField` with `choices` or `TextChoices` for enums
- Add `db_index=True` on frequently queried fields
- Use `select_related()` (FK) and `prefetch_related()` (M2M) to prevent N+1
- Custom managers for complex querysets: `objects = MyManager()`
- Never use `objects.all()` in views without pagination

## Views
- Use `get_object_or_404()` instead of manual try/except
- Always use `LoginRequiredMixin` or `@login_required` for protected views
- Form validation in form classes, not views
- Use `reverse()` for URL resolution, never hardcode URLs

## Migrations
- One migration per logical change
- Never edit merged migrations
- Use `RunPython` for data migrations, keep them idempotent
- Large tables: consider `AddIndex` with `concurrently=True` (PostgreSQL)

## Security
- CSRF protection enabled by default — don't disable
- Use `bleach` or Django's `escape` for user-generated content
- Set `AUTH_PASSWORD_VALIDATORS` in production
- Use `django-environ` for secrets, never commit `.env`

## Common Pitfalls
- Signals (`post_save`, `pre_delete`) create hidden coupling — prefer explicit calls
- `QuerySet` is lazy — won't hit DB until evaluated (iteration, `list()`, slicing)
- `Model.save()` saves ALL fields by default — use `update_fields` for partial saves
- Timezone-aware datetime: use `django.utils.timezone.now()`, never `datetime.now()`
