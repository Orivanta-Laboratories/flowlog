# Tracking accuracy

## Objective

Build a trustworthy suggested workday from observed activity. A task description
such as “Implement sign-in on Asynx” is a suggestion supported by repository,
branch, and related activity. It is not proof that a feature was completed.

## Structure and style

Pure segmentation/grouping in packages/utils/src with colocated *.test.ts;
query helpers in packages/db/src/queries; orchestration in packages/api/src/routers;
collectors in apps/desktop/src and apps/extension/src. Follow CLAUDE.md (tabs,
double quotes, named stored constants, server-derived scoping).

## Success criteria

- Same-context contiguous samples form intervals, each sample capped by its source
  cadence and the next observation. Never count an uncovered gap or idle period.
- An idle observation without a window name is still a boundary. Duplicated
  observations do not increase time. Simultaneous OS idle beats browser activity.
- Short visits to unrelated apps cannot become time credited to the previous task.
- Branch grouping requires corroboration for intervening activity. Missing evidence
  stays separate. Groups sum observed work, never elapsed span including breaks.
- Git startup state is not a new commit and cannot attach an unrelated repository
  to the focused window. Ambiguous repository evidence remains unassigned.
- AI output provides suggested labels only. Preserve explicit user confirmations.
- Merge/split and recomputation must not inflate time or reintroduce edited records.

## Test strategy and commands

Write regression tests before fixes; run `pnpm --filter @flowlog/utils test`,
`pnpm check-types`, and Biome on touched files. For collector changes run
`cargo test -p flowlog-agent` from apps/desktop. Add cases for idle, gaps, duplicate
sources, branch switches, unrelated sites, and malformed inputs. Verify query
changes against a disposable database where available.

## Boundaries

Do not widen collection scope or infer intent without evidence. Existing cloud AI
support remains gated on user consent. Keep raw activity out of logs and test
fixtures. Defer presentation and schedule configuration to their own modules.
