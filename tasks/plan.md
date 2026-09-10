# Flowlog improvement plan

Approved build order: tracking-accuracy → device-sign-in → shift-review → console → landing-page.

| Module | Responsibility | Depends on |
| --- | --- | --- |
| tracking-accuracy | Evidence-bounded activity intervals and task suggestions | — |
| device-sign-in | Explicit browser approval for extension and desktop credentials | — |
| shift-review | Work schedules, consent, review and confirmation | tracking-accuracy |
| console | Accessible navigation and readable review controls | shift-review |
| landing-page | Outcome-focused marketing grounded in shipped behavior | verified capabilities |

Use CLAUDE.md for stack, architecture, commands, and style. Tests are colocated
Node tests via tsx and Rust unit tests. Implement and commit one verified slice at
a time. Existing uncommitted feature work is authorized for inclusion after review;
exclude signing keys, generated extensions, and scratch activity data.

Cloud AI is the standard path with an explicit accept/decline choice at onboarding.
Do not send activity to the model until the user accepts. Declining preserves
tracking, local rules, and manual review. Linux remains the desktop target.

## Verification

- `pnpm --filter @flowlog/utils test`
- `pnpm check-types`
- `pnpm exec biome check <touched TypeScript files>`
- `pnpm --filter web build` and `pnpm --filter @flowlog/extension build`
- `cargo test -p flowlog-agent` and `cargo clippy -p flowlog-agent --all-targets -- -D warnings` from apps/desktop
- Native and JavaScript dependency audits, browser checks on desktop/mobile layouts,
  device approval expiry/replay/race checks, and live API checks where available.

## Boundaries

Always derive authorization from server-side identity, generate Drizzle migrations,
and preserve confirmed work. Never log credentials or raw activity. AI may suggest
labels; it may not choose durations, change authorization, or confirm work.
