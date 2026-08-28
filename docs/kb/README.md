# Knowledge Base

Curated docs to reduce token usage and improve agent accuracy.
Load ONLY documents relevant to your current task.

## How to Use

1. Read this index
2. Identify matching documents for your task
3. Load only those documents
4. Undocumented pattern discovered? Run `document-solution`

## Index

### Architecture

| Document | When to Read |
|----------|--------------|
| [project-overview](architecture/project-overview.md) | Every session start — stack, commands, key decisions |
| [project-context-pre-setup](architecture/project-context-pre-setup.md) | Historical context before framework setup (2026-08-27) |
| [nested-agents-md](architecture/nested-agents-md.md) | When scoping AGENTS.md to subdirectories |

### Features

| Document | When to Read |
|----------|--------------|
| | |

### Integrations

| Document | When to Read |
|----------|--------------|
| | |

### API

| Document | When to Read |
|----------|--------------|
| | |

### Bug Fixes

| Document | When to Read |
|----------|--------------|
| | |

### AI Patterns

| Document | When to Read |
|----------|--------------|
| [mistake-log](ai-patterns/mistake-log.md) | Session start — avoid repeated errors |
| [trigger-log](ai-patterns/trigger-log.md) | Observability for trigger executions |
| [hooks-reference](ai-patterns/hooks-reference.md) | Configuring Claude Code hooks in `.claude/settings.json` |
| [TRIGGER-CHECKLIST](TRIGGER-CHECKLIST.md) | Quick reference: when to fire each skill, session-start checklist |
| [UPGRADING](UPGRADING.md) | Upgrading the framework in a consumer repo |

### Sessions

| Document | When to Read |
|----------|--------------|
| [sessions/](sessions/) | Continuing paused work |

## Adding Documents

Kebab-case filenames. Place in appropriate category folder.
Each doc must include: **Last Updated**, **Context**, and content sections.

Categories: `architecture/`, `features/`, `integrations/`, `api/`, `bugfixes/`, `ai-patterns/`, `sessions/`
