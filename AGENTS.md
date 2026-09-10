# Codex repository guidance

Read and follow [CLAUDE.md](./CLAUDE.md) before working in this repository.
It is the shared source of truth for architecture, authorization, database
migrations, frontend conventions, copy, testing, and commit checks. Read any
nested `AGENTS.md` files for the directories you change as well.

Flowlog's purpose is to remove the effort of reconstructing a workday. Activity
provides evidence for a suggested timesheet that the user reviews, edits, and
confirms. Suggestions must not manufacture work, inflate durations, or silently
turn uncertain activity into confirmed time.

For the current product improvement work:

- Design around configured shifts, clear start/pause controls, and an end-of-shift
  review. Treat these as requirements to implement, not existing capabilities
  to advertise before verification.
- Use readable project and device names in controls, with consistent accessible
  components from the existing Base UI/shadcn stack.
- Shared component styling may evolve as part of the requested console redesign;
  verify affected app and marketing surfaces together.
- Keep device authorization explicit and scope credentials to the approved
  device. Never place credentials in browser approval URLs or logs.
- Verify idle boundaries, gaps, overlapping sources, and unrelated activity when
  changing time reconstruction. Preserve the user's final say on task labels.
- Check Rust code and dependencies as well as TypeScript. Report which security
  checks actually ran and any limitations; passing checks is not proof that the
  application has no vulnerabilities.
- Commit verified changes in focused steps. Preserve pre-existing work and keep
  credentials, signing keys, local debug data, and generated bundles out of commits.
