# Elixir Conventions

**Last Updated**: 2026-03-29
**Context**: When writing Elixir code in this project

## Style
- `snake_case` for functions/variables, `CamelCase` for modules
- Use pipe operator `|>` for data transformation chains
- Pattern matching over conditional logic wherever possible
- Use `@moduledoc` and `@doc` for public functions
- `@spec` type specs for public API functions

## Patterns
- Use `with` for happy-path chaining with pattern matching
- Use `GenServer` for stateful processes, `Task` for one-off async work
- Prefer immutable data + message passing over shared state
- Use `Enum` for eager operations, `Stream` for lazy/large datasets
- Prefer `Keyword` lists for options, `Map` for structured data

## Error Handling
- Return `{:ok, result}` / `{:error, reason}` tuples — convention, not exception
- Use `!` suffix functions (`File.read!`) only when failure is unexpected/unrecoverable
- Use `try/rescue` only for truly exceptional situations (not control flow)

## Common Pitfalls
- Atoms are never garbage collected — never create atoms from user input (`String.to_atom`)
- Process mailbox overflow — always handle unexpected messages in GenServer
- Binary pattern matching: `<<header::binary-size(4), rest::binary>>` — sizes are in bits by default
- `Enum.map` + `Enum.filter` = two passes — use `Enum.flat_map` or `for` comprehension for one pass
