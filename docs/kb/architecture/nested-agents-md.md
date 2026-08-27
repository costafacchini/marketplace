# Nested AGENTS.md — Subdirectory Scoping

**Last Updated**: 2026-03-29
**Context**: When setting up monorepos or projects with distinct subsystems

## Overview

The AGENTS.md spec supports **hierarchical scoping**: place an AGENTS.md in any
subdirectory and it applies only to files within that directory tree.

## How Scoping Works

```
my-project/
|-- AGENTS.md              # Global rules (always loaded)
|-- frontend/
|   |-- AGENTS.md          # Frontend-specific (loaded when working in frontend/)
|   +-- src/
|-- backend/
|   +-- AGENTS.md          # Backend-specific (loaded when working in backend/)
+-- infra/
    +-- AGENTS.md          # Infra-specific
```

**Merge order**: Root -> parent -> child. Closer files override earlier ones
because they appear later in the combined prompt (recency effect).

## Tool Behavior

| Tool | Behavior |
|------|----------|
| Claude Code | Loads nearest CLAUDE.md up the directory tree |
| Codex | Walks from root to CWD, concatenates all AGENTS.md found |
| Windsurf | Root = always-on; subdirectory = glob rule `dir/**` |
| Cursor | Use `.cursor/rules/` with glob patterns for similar effect |

## When to Use

- **Monorepos** with distinct stacks (frontend React, backend Go)
- **Packages** that have their own conventions
- **Generated code** directories (add "do not modify generated files" rule)

## Example: Frontend AGENTS.md

```markdown
# AGENTS.md — Frontend

## Stack
- React 19, TypeScript, Vite
- Testing: Vitest + React Testing Library

## Conventions
- Functional components only
- Use `useQuery`/`useMutation` for data fetching
- CSS Modules, no inline styles
- Components in PascalCase directories with index.ts barrel

## Commands
| Task | Command |
|------|---------|
| Dev | `npm run dev` |
| Test | `npm run test` |
| Lint | `npm run lint` |
```
