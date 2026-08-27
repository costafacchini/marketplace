---
name: secrets-hygiene
description: >-
  Scan the current session, staged files, terminal history, and git state for
  accidentally exposed secrets (API keys, tokens, passwords, private keys).
  Reports findings and guides remediation without ever logging the secret values.
auto: false
explicit-only: true
tags: [security, secrets, hygiene]
argument-hint: "[scan | git | session | all]"
---

# Secrets Hygiene

## Triggers

### Manual
- `/secrets-hygiene [scan|git|session|all]`
- "check for secrets", "scan for leaked keys", "secrets audit"
- "did I expose any credentials", "check my commit for secrets"

---

Prevents accidental secret exposure across four surfaces: staged files, git history, session context, and terminal output.

**Default mode** (no args): runs `git` + `session` checks.

---

## Phase 1: Staged Files + Git Scan (`git`)

```bash
# Check staged files for common secret patterns
git diff --cached | grep -inE \
  '(api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|password|passwd|private[_-]?key|-----BEGIN|AWS_SECRET|GITHUB_TOKEN|sk-[a-zA-Z0-9]{20,}|eyJ[a-zA-Z0-9])'
```

Also check:
- `.env`, `.env.local`, `.env.production` — are any staged?
- `*.pem`, `*.key`, `*.p12`, `*.pfx` — are any staged?
- `credentials.json`, `service-account.json` — are any staged?

If anything is found:
1. Report the file path and line number (NOT the secret value)
2. `git reset HEAD <file>` to unstage
3. Add the file to `.gitignore`
4. If the secret was in a previous commit: rotate it NOW, then use `git filter-repo` to purge history

---

## Phase 2: Session Context Scan (`session`)

Review the current conversation for:
- Any secrets the user typed directly into the chat (API keys, tokens, passwords)
- Tool output that printed secret values (env dumps, config reads, debug output)

If found:
1. Warn the user — the session transcript may be logged
2. Advise rotating the exposed credential immediately
3. Do NOT repeat the secret value in your response

---

## Phase 3: Staged File Content (`scan`)

For each staged file, check:
- Hardcoded strings that look like secrets (see patterns above)
- Config files with plaintext credentials instead of env var references
- Test files with real API keys (even "test" keys for paid services)

Report: file path + line number + pattern matched. Never output the matched value.

---

## Remediation Checklist

When a secret is confirmed exposed:

- [ ] **Rotate the credential immediately** — assume it's already compromised
- [ ] Unstage the file: `git reset HEAD <file>`
- [ ] Add to `.gitignore`
- [ ] If in git history: `git filter-repo --path <file> --invert-paths` (requires `pip install git-filter-repo`)
- [ ] If pushed to remote: contact the platform (GitHub, etc.) to purge from their cache
- [ ] Update the credential in your secrets manager (not in `.env` committed to git)

---

## What NOT to Do

- Never log, echo, or repeat secret values in responses or tool output
- Never `cat` a file known to contain secrets — read only what's needed
- Never store secrets in comments, test fixtures, or migration files
- Never commit `.env` — use `.env.example` with placeholder values and reference real values from a secrets manager
