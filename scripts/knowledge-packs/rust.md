# Rust Conventions

**Last Updated**: 2026-03-29
**Context**: When writing Rust code in this project

## Ownership & Borrowing
- Prefer borrowing (`&T`) over ownership transfer when the function doesn't need to own
- Use `&mut T` only when mutation is needed
- Clone as last resort — prefer references or `Cow<'_, T>` for conditional ownership
- Use lifetimes explicitly only when the compiler can't infer them

## Error Handling
- Use `Result<T, E>` for recoverable errors, `panic!` only for unrecoverable bugs
- Use `thiserror` for library error types, `anyhow` for application error types
- Propagate with `?` operator — don't `unwrap()` in production code
- `unwrap()` and `expect()` are OK in tests and infallible paths

## Types
- Use `enum` for variants/states (Rust enums are algebraic types)
- Prefer `struct` with named fields over tuples for anything with 3+ fields
- Use `impl` blocks to keep methods close to their types
- Derive `Debug`, `Clone`, `PartialEq` as appropriate

## Patterns
- Use iterators and combinators (`.map()`, `.filter()`, `.collect()`) over manual loops
- Prefer `match` over `if let` chains when exhaustiveness matters
- Use `Option<T>` instead of sentinel values or null equivalents
- Builder pattern for complex struct construction

## Common Pitfalls
- Moved values can't be used — watch for use-after-move
- `String` vs `&str`: own when storing, borrow when reading
- `Vec<T>` reallocation on push — `Vec::with_capacity()` if size is known
- Deadlocks with `Mutex` — hold locks for the shortest duration possible
- Async: `Send + Sync` bounds required for spawned tasks — not all types are Send
