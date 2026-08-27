---
name: database-migration
description: Workflow for database schema changes — create migration, update schema, verify rollback safety.
allowed_tools: ["Bash", "Read", "Write", "Edit", "Grep", "Glob"]
---

# /database-migration

Use this when making schema changes that require a migration file.

## Suggested Sequence

1. Read the existing schema to understand current state
2. Create the migration file following project naming conventions
3. Make the migration reversible (up + down / change)
4. Update any affected model/type definitions
5. Test the migration locally (up and down)
6. Check for N+1 impacts if adding columns used in queries

## Safety Rules

- Never provide instructions to run migrations directly — provide the command for the user to execute
- Migrations must be reversible unless destructive intent is explicit and confirmed
- Adding a non-nullable column without a default on a populated table requires a multi-step migration
- Removing a column requires the app to stop reading it before the migration runs (two-step deploy)

## Common Files

- Migration files (e.g., `db/migrate/`, `migrations/`)
- Schema file (e.g., `db/schema.rb`, `schema.sql`, `prisma/schema.prisma`)
- Model/entity files affected by schema change

## Typical Commit Sequence

```
feat(db): add [column/table] migration
chore(db): update schema after migration
```

## Notes

- Do not run migrations — provide the command and let the user execute it
- Test rollback: confirm the down/revert path works before committing
- Document non-obvious migration patterns in `docs/kb/`
