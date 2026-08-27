# Go Conventions

**Last Updated**: 2026-03-29
**Context**: When writing Go code in this project

## Style
- Follow `gofmt` / `goimports` — non-negotiable
- Short variable names in small scopes (`i`, `r`, `w`), descriptive in larger scopes
- Exported = PascalCase, unexported = camelCase
- Package names: short, lowercase, no underscores (`http`, `json`, `auth`)
- One package per directory

## Error Handling
- Always check errors: `if err != nil { return fmt.Errorf("context: %w", err) }`
- Wrap errors with `%w` for unwrapping, `%v` when wrapping would leak internals
- Use `errors.Is()` and `errors.As()` for error inspection
- Don't panic in library code — return errors
- Sentinel errors: `var ErrNotFound = errors.New("not found")`

## Concurrency
- Don't communicate by sharing memory; share memory by communicating (channels)
- Always use `context.Context` for cancellation and timeouts
- Use `sync.WaitGroup` for goroutine coordination
- Use `sync.Mutex` for simple shared state, channels for complex coordination
- Beware goroutine leaks — ensure goroutines can exit

## Interfaces
- Define interfaces where they're used, not where they're implemented
- Keep interfaces small (1-3 methods)
- Accept interfaces, return structs
- Use `io.Reader`/`io.Writer` for stream processing

## Testing
- `_test.go` files in the same package
- Table-driven tests for multiple cases
- Use `testify/assert` or standard `testing` — project's choice
- Use `t.Helper()` in test helper functions
- `t.Parallel()` for independent tests

## Common Pitfalls
- Nil pointer on uninitialized map — always `make(map[K]V)` before writing
- Range loop variable capture in goroutines — use `v := v` or loop variable binding (Go 1.22+)
- Struct field alignment affects memory — group fields by size
- `defer` evaluates arguments immediately, body executes at return
- HTTP response body must be closed: `defer resp.Body.Close()`
