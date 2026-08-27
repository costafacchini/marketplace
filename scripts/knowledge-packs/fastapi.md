# FastAPI Conventions

**Last Updated**: 2026-03-29
**Context**: When working with FastAPI endpoints, models, or configuration

## Architecture
- Routers in `app/routers/`, models in `app/models/`, schemas in `app/schemas/`
- Use dependency injection for DB sessions, auth, config
- Pydantic models for request/response schemas (validation is automatic)
- SQLAlchemy or SQLModel for database models

## Endpoints
- Use type hints on all parameters — FastAPI generates docs from them
- Use `Depends()` for shared logic (auth, DB session, pagination)
- Return Pydantic models, not dicts (type safety + serialization)
- Use `status_code=` parameter for non-200 responses
- Use `HTTPException` for error responses

## Pydantic Models
- Request body: `class CreateUser(BaseModel)`
- Response: `class UserResponse(BaseModel)` with `model_config = ConfigDict(from_attributes=True)`
- Use `Field()` for validation constraints and descriptions
- Separate create/update/response schemas (don't reuse one model for everything)

## Async
- Use `async def` for I/O-bound endpoints (DB queries, HTTP calls)
- Use `def` (sync) for CPU-bound endpoints (FastAPI runs them in a thread pool)
- Use `asyncpg` or `databases` for async DB, `httpx` for async HTTP
- Never mix sync DB drivers with async endpoints — it blocks the event loop

## Common Pitfalls
- Circular imports between schemas and models — use `TYPE_CHECKING` guard
- `Depends()` creates a new instance per request — for singletons, use `@lru_cache`
- Background tasks: use `BackgroundTasks` parameter, not `asyncio.create_task()`
- Pydantic v2: `model_validate()` replaces `from_orm()`, `model_dump()` replaces `.dict()`
