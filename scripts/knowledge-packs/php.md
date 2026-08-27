# PHP Conventions

**Last Updated**: 2026-03-29
**Context**: When writing PHP code in this project

## Style
- Follow PSR-12 coding standard
- Use strict types: `declare(strict_types=1);` at top of every file
- Type hints on all parameters and return types
- `CamelCase` for classes, `camelCase` for methods, `snake_case` for variables (or PSR style)
- Use `readonly` properties (PHP 8.1+) and constructor promotion

## Patterns
- Use enums (PHP 8.1+) for fixed sets of values
- Use named arguments for clarity: `new User(name: 'Alan', role: 'admin')`
- Use null safe operator: `$user?->profile?->avatar`
- Use match expressions over switch for value mapping
- Prefer composition over inheritance

## Error Handling
- Use typed exceptions: `throw new NotFoundException('User not found')`
- Catch specific exceptions, never bare `catch (\Exception $e)` in business logic
- Use `finally` for cleanup
- Log with PSR-3 `LoggerInterface`, not `error_log()`

## Common Pitfalls
- `==` vs `===`: always use strict comparison (`===`)
- Array functions: `array_map` callback order is inconsistent with `array_filter` — be careful
- `null` vs `false` vs `0` vs `""` — all falsy in loose comparison
- Memory: PHP processes die per request (FPM) — long-running workers need explicit cleanup
- Composer autoloading: run `composer dump-autoload` after adding classes
