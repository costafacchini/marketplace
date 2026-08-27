---
name: cross-family-review
description: >-
  Get a second opinion from a model of a different family (GPT, Gemini, Qwen,
  etc.) before merging. Generates a structured critic prompt and records the
  verdict. Prevents the blind spot where the authoring model family validates
  its own assumptions.
auto: false
explicit-only: true
tags: [review, cpd, quality-gate]
argument-hint: "[diff | spec | plan | code]"
---

# Cross-Family Review

## Triggers

### Manual
- `/cross-family-review [diff|spec|plan|code]`
- "get a second opinion", "cross-family review", "cpd review"
- "ask another model", "run CPD", "critic review"
- "verify with GPT", "verify with Gemini", "verify with another AI"

---

Implements the Cross-Provider Verified Development (CPVD) pattern: a critic from
a different model family catches blind spots the authoring model cannot see.

**Why it works**: Different model families (Claude/Anthropic, GPT/OpenAI, Gemini/Google,
Qwen/Alibaba) have different training data, RLHF feedback, and systematic biases.
A bug the author's family considers "fine" is often caught immediately by a critic
from a different family.

**Default mode** (no args): reviews the current diff.

---

## Step 1: Establish Context

Identify:
- **Author family**: which model family wrote or reviewed the code being submitted (e.g., Claude/Anthropic)
- **Critic family**: must be DIFFERENT — choose from GPT (OpenAI), Gemini (Google), Qwen/Minimax (Alibaba), Mistral (European), or any other distinct vendor

If you are Claude, valid critic families: GPT-4o, Gemini 1.5 Pro, Qwen3, Mistral Large, Command R+.

---

## Step 2: Prepare the Critic Brief

Generate the following block and present it to the user to copy into the critic model:

```
--- CRITIC BRIEF ---
You are a senior engineer acting as a cross-family code critic.
Your job is to find real problems — not style preferences.

AUTHORING MODEL FAMILY: [Claude/Anthropic]
YOUR ROLE: Independent critic (different vendor, different blind spots)

SCOPE OF REVIEW:
[paste diff, spec, plan, or code here]

EVALUATE:
1. Correctness — will this work as intended in all cases?
2. Security — any injection, auth bypass, or data exposure risk?
3. Performance — any N+1, unbounded operation, or blocking call?
4. Edge cases — what inputs or states would break this?
5. Design — does this solve the right problem, or a proxy problem?

REQUIRED FORMAT:
- VERDICT: APPROVE | CONCERNS | REJECT
- FINDINGS: [list each finding with severity: critical/major/minor]
- RATIONALE: one paragraph explaining the verdict
- CONFIDENCE: High / Medium / Low (if Low, explain why)

Do NOT comment on style, naming, or formatting unless they create a bug.
--- END BRIEF ---
```

---

## Step 3: Send to Critic

Tell the user to:
1. Open a fresh session in the critic model (do NOT reuse a session that saw the original code)
2. Paste the critic brief above
3. Record the full response

---

## Step 4: Classify the Response

When the critic responds, classify findings into:

| Category | Description | Action |
|----------|-------------|--------|
| **Bug** | Wrong behavior, data corruption, security flaw | Must fix before merge |
| **Risk** | Potential issue under specific conditions | Author decides; document if deferred |
| **Design** | Structural concern with the approach | Discuss; may warrant a spec revision |
| **Noise** | Style preference, not a real problem | Discard |

---

## Step 5: Record the Verdict

Append to `.agents/memory/decisions.md`:

```markdown
## [YYYY-MM-DD] Cross-Family Review — [feature/PR title]

**Author family**: [Claude/Anthropic]
**Critic family**: [GPT-4o / Gemini / Qwen3 / etc.]
**Verdict**: APPROVE | CONCERNS | REJECT
**Bug findings**: [count and descriptions, or "none"]
**Risk findings**: [count and descriptions, or "none"]
**Action taken**: [fixed X, deferred Y with rationale, discarded Z as noise]
**Confidence**: High / Medium / Low
```

---

## When to Run

Run `cross-family-review` before:
- Merging a PR that touches authentication, authorization, or data access
- Shipping a feature with non-trivial business logic
- Making an architectural decision that's hard to reverse
- Any change where "the authoring model thought it was fine" is a concern

Skip for:
- Documentation-only changes
- Trivial mechanical changes (rename, reformat)
- Changes already reviewed by a human with domain expertise
