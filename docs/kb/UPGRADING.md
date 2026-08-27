# Upgrading the AI Dev Framework

**Last Updated**: 2026-04-01
**Context**: upgrading framework, update skills, new skills, framework version

---

## Quick Upgrade

```bash
# Tell your AI assistant:
/upgrade-framework --source /path/to/ai-dev-framework
```

The skill handles everything: diffs installed vs available, copies skills,
updates AGENTS.md additively, syncs CLAUDE.md, validates, and commits.

---

## What Gets Upgraded

| Path | Behavior |
|------|----------|
| `.agents/skills/` | **Overwritten** — framework-owned |
| `.claude/skills/` | **Overwritten** — shim mirror |
| `AGENTS.md` Skills table | **Additive only** — new rows appended |
| `CLAUDE.md` | **Overwritten** — synced from AGENTS.md |
| `docs/kb/` content | **Never touched** — your knowledge base |
| `docs/kb/ai-patterns/mistake-log.md` | **Never touched** |

---

## Manual Upgrade (Without the Skill)

```bash
SOURCE=/path/to/ai-dev-framework/template

# 1. Copy all skills (overwrites existing)
cp -r $SOURCE/.agents/skills/* .agents/skills/

# 2. Check for new skills not yet in AGENTS.md
diff <(ls .agents/skills/) <(grep '`' AGENTS.md | grep -o '`[^`]*`' | tr -d '`')

# 3. Add new skill rows to AGENTS.md manually

# 4. Sync CLAUDE.md
cp AGENTS.md CLAUDE.md

# 5. Validate
bash scripts/validate.sh

# 6. Commit
git add .agents/skills/ AGENTS.md CLAUDE.md
git commit -m "chore: upgrade AI dev framework skills"
```

---

## What AGENTS.md Customizations Are Preserved

The upgrade skill only **adds** to AGENTS.md — it never modifies:
- Project Context (your project name, stack, commands)
- Critical Constraints
- Things to Avoid
- Any `<!-- CUSTOMIZE -->` sections
- KB keyword mappings you've added

---

## Repo-Specific Skills

Skills in `.agents/skills/` that don't exist in the framework source are treated
as repo-specific and left untouched. If a new framework skill overlaps with one
of yours, the upgrade skill will flag it for your review.

---

## After Upgrading

1. Run your test suite if you have one
2. Skim new `SKILL.md` files for any behavior changes relevant to your project
3. Check `docs/kb/TRIGGER-CHECKLIST.md` for any new auto-trigger phrases
