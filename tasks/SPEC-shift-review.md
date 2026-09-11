# Shift review

## Objective

Configure recurring workdays and hours once, then start the agent automatically
or manually. Collect within shifts, pause outside them, and review suggestions
at the end. Confirmation remains explicit. Users can edit labels and projects,
merge blocks, split time, and confirm their selection.

## Contract and structure

A nullable user workSchedule stores enabled, IANA timezone, weekdays (0 Sunday),
startMinute, and endMinute. Equal start/end is invalid; an end before start is an
overnight shift belonging to the starting weekday. Null/disabled means manual
tracking using existing start/pause controls. Store aiConsentAt separately from
the enabled flag so an explicit decline is recorded. Cloud AI is the recommended
onboarding action but no data is shared until accepted.

Pure schedule evaluation/tests: packages/utils/src/time/shift.ts. User preference
schema/query/API: existing packages. Collectors receive the same schedule through
device config. The server filters incoming events against it. Dashboard onboarding
and settings present readable controls. Existing startup service remains available.

## Acceptance and verification

Test shift start inclusive/end exclusive, days off, overnight rollover, DST,
manual mode, and invalid timezones. Check both collectors pause outside shifts.
Verify accepting/declining AI persists and direct AI endpoints honor the choice.
Run utils tests, workspace types, extension build, cargo tests, and browser flows.
Generate and apply migrations through Drizzle. Preserve tenant boundaries and
never confirm automatically or promise that inferred task labels are facts.
