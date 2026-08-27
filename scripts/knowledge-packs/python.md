# Python Conventions

**Last Updated**: 2026-03-29
**Context**: When writing Python code in this project

## Style
- Follow PEP 8 (or project's ruff/black config)
- `snake_case` for functions/variables, `CamelCase` for classes
- Use type hints everywhere — `def foo(name: str) -> bool:`
- f-strings over `.format()` or `%` for string interpolation
- Use `pathlib.Path` over `os.path` for file operations

## Patterns
- Use dataclasses or Pydantic models for structured data
- Prefer list/dict/set comprehensions over `map`/`filter` with lambdas
- Use `contextlib.contextmanager` for resource management
- Use `enum.Enum` for fixed sets of values
- Prefer `itertools` for complex iteration patterns

## Error Handling
- Catch specific exceptions, never bare `except:`
- Use `logging` module, not `print()` for diagnostics
- Raise custom exceptions for domain errors
- Use `try/except/else/finally` — `else` for success path, `finally` for cleanup

## Dependencies
- Pin versions in `requirements.txt` or `pyproject.toml`
- Use virtual environments always (`venv`, `poetry`, `pipenv`)
- Prefer standard library when it covers the use case

## Common Pitfalls
- Mutable default arguments: `def foo(items=[])` shares the list — use `None` + `if items is None`
- `is` vs `==`: use `is` only for `None`, `True`, `False` singletons
- Circular imports — restructure modules or use local imports
- GIL: threading doesn't help CPU-bound work — use `multiprocessing` or `asyncio`
- `datetime.now()` is timezone-naive — always use `datetime.now(timezone.utc)`
