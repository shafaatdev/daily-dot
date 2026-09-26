# AGENTS.md

## Project

Daily Journal with Mood Tracker.

**Stack:** Vite, Angular 22, TypeScript, Tailwind CSS, Supabase.

Strict TypeScript and clean, feature-oriented architecture are expected. Keep services, components, directives, pipes, models, and other concerns appropriately separated.

## Source of Truth

Before modifying code, follow the applicable repository instructions:

- `.github/copilot-instructions.md` — project architecture, domain, Supabase, security, and agent behaviour.
- `.github/instructions/general.instructions.md` — repository-wide engineering standards.
- `.github/instructions/typescript-angular.instructions.md` — TypeScript and Angular standards.
- `.github/instructions/design.instructions.md` — UI/UX standards.
- `.github/instructions/css-tailwind.instructions.md` — Tailwind/CSS standards, when present.

Do not duplicate these rules here.

### Priority

When instructions conflict, use this order:

1. Explicit user/task requirements
2. `AGENTS.md`
3. `.github/copilot-instructions.md`
4. Applicable `.github/instructions/*.instructions.md`
5. Existing repository conventions

More specific applicable instructions override broader ones at the same level. Never interpret a lower-priority rule as permission to weaken security or type safety.

## Workflow

- Inspect relevant existing code before making changes.
- Follow established architecture, naming, and implementation patterns.
- Make the smallest complete change that satisfies the task.
- Reuse existing components, services, utilities, and patterns where appropriate.
- Avoid unrelated cleanup, renaming, dependency changes, or large refactors.
- Propose significant architectural/database changes before implementing them.
- Preserve existing behaviour unless the task explicitly changes it.
- Add or update relevant tests when behaviour changes.

## Security Boundaries

Never:

- Commit or expose secrets, credentials, tokens, or privileged Supabase keys.
- Weaken TypeScript strictness or bypass type errors with unsafe workarounds.
- Bypass authentication, authorization, or other security controls.
- Treat client-side checks as authorization.
- Expose private journal/authentication data through logs or errors.
- Disable security mechanisms merely to make a feature work.

## Commands

Use repository scripts from `package.json` as the authority. Typical commands are:

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

Do not assume a script exists; verify `package.json` first. Prefer existing scripts over introducing new tooling.

## Protected / Generated Files

Do not manually modify:

- `dist/` or other build output
- Generated code/files
- Dependency/vendor directories such as `node_modules/`
- Lockfiles unless an approved dependency operation legitimately updates them
- Supabase-generated types or other generated artifacts except through their intended generation workflow

Do not add, remove, or upgrade dependencies without approval.

## Completion & Reporting

Before finishing, run the relevant available checks for the affected scope and resolve issues caused by the change.

Report concisely:

- What changed
- Key files affected
- Tests/checks run and their result
- Any migration, configuration, dependency, or manual step required
- Any limitation or unresolved issue

Do not claim checks passed unless they were actually run.