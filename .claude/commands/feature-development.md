---
name: feature-development
description: Standard workflow for implementing a new feature — understand context, implement, test, document.
allowed_tools: ["Bash", "Read", "Write", "Edit", "Grep", "Glob"]
---

# /feature-development

Use this when implementing a new feature in this project.

## Suggested Sequence

1. Understand the current state — read relevant files before touching anything
2. Check `docs/kb/README.md` for any prior art or patterns
3. Run `create-plan` if the feature spans 3+ files
4. Implement the smallest coherent change that satisfies the goal
5. Write or update tests following the project's test patterns
6. Run `pre-commit-check` before staging

## Common Files

Review these when starting:
- `AGENTS.md` — project conventions, key commands
- `.agents/memory/project-profile.md` — cached project context
- `.agents/memory/decisions.md` — prior architectural decisions

## Typical Commit Sequence

```
feat: implement [feature name]
test: add tests for [feature name]
docs: update [relevant doc]
```

## Notes

- Match existing code patterns — read before writing
- Flag for approval: schema changes, new dependencies, changes touching 5+ files
- Update `docs/kb/` if the feature introduces a non-obvious pattern
