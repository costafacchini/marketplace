# Ruby Conventions

**Last Updated**: 2026-03-29
**Context**: When writing Ruby code in this project

## Style
- Use `frozen_string_literal: true` magic comment
- Prefer `&.` (safe navigation) over `try`
- Guard clauses over nested conditionals
- `snake_case` for methods/variables, `CamelCase` for classes
- Single-line blocks: `{ }`, multi-line: `do...end`

## Patterns
- Prefer `each` / `map` / `select` over `for` loops
- Use `Hash#fetch` with default instead of `[]` when key might be missing
- Prefer keyword arguments for methods with 3+ parameters
- Use `Struct` or `Data` (Ruby 3.2+) for value objects

## Common Pitfalls
- `nil` propagation — use `&.` or explicit nil checks at boundaries
- Mutable default arguments — `def foo(arr = [])` shares the array across calls; use `nil` + `||=`
- String encoding — always specify encoding when reading files
- `require` vs `require_relative` — use `require_relative` for project files
