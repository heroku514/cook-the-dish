# Claude Code Instructions

## Documentation Tracking

Whenever you investigate, develop, fix, or explore anything in this repository, create and maintain structured documentation.

### Folder Structure

```text
Documentation/
  <work-topic>/          # One subfolder per task/investigation
    Plan.md              # What you intend to do and how
    Progress.md          # Running log of what's been done
    Findings.md          # Discoveries, observations, data
    Verification.md      # How results were verified, pass/fail status
```

### Rules

1. Before starting work, create the task subfolder and all four Markdown files.
2. Append to existing documentation instead of overwriting it. Add new timestamped sections as work evolves.
3. Use `Plan.md` to outline goals, approach, and steps. Update it when the plan changes.
4. Use `Progress.md` to log each completed step, command run, or file changed.
5. Use `Findings.md` to record discoveries, root causes, data, and unexpected behavior.
6. Use `Verification.md` to document how results were checked, including test runs, manual checks, screenshots, or anything left unverified.
7. Use a descriptive task folder name, such as `fix-login-timeout` or `explore-caching-options`.

### Example

```text
Documentation/
  fix-login-timeout/
    Plan.md
    Progress.md
    Findings.md
    Verification.md
```

`Plan.md` example:

```markdown
# Plan - Fix Login Timeout

## Goal
Resolve 30s timeout on the login page.

## Approach
1. Reproduce locally.
2. Check network calls in DevTools.
3. Trace backend handler.
```

`Progress.md` example:

```markdown
# Progress - Fix Login Timeout

## 2026-04-24

- Reproduced timeout locally with `npm run dev`.
- Identified slow query in `auth.service.ts`.
```
