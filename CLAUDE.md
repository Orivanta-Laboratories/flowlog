# CLAUDE.md

Guidance for AI assistants working in the `orivantapay` repository.

This file is assembled from two sources that were pasted in verbatim:

1. **`orivantalearn`** (below, "Part 1") — the primary engineering guide. Its stack
   (Turborepo, Hono + oRPC, Drizzle/Postgres, better-auth, TanStack Query, shadcn/Base UI)
   is the same stack this repo runs, so its rules apply here as written.
2. **`leschampions`** ("Part 2") — a second guide, kept for its HTTP-method /
   idempotency / retry conventions, which are directly relevant to a payments API.

> [!IMPORTANT]
> Part 2 was written for a repo with a *different* architecture (Server Actions + Drizzle,
> no API layer, French-only, single-tenant). Where the two parts disagree about the stack —
> in particular Part 2's "What does NOT apply here" section, which rules out oRPC/Hono,
> `packages/api`, TanStack Query, multi-tenancy and i18n — **Part 1 wins for this repo**.
> Those things do exist in `orivantapay`. Read Part 2's stack-specific sections as history
> about `leschampions`, and its HTTP/idempotency section as binding here.

---

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `Orivanta-Laboratories/orivantapay`, driven through the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `CONTEXT.md` and one `docs/adr/` for the whole workspace. See `docs/agents/domain.md`.

---

# Part 1 — from `orivantalearn/CLAUDE.md`

# CLAUDE.md

This file is loaded automatically at the start of every session in this repo.
It is binding for every feature, bug fix, refactor, or enhancement. When a
request conflicts with a rule here, follow this file and flag the conflict
instead of silently picking one side.

Every rule below includes a **Tricky scenario** (the situation that tempts a
shortcut), a ❌ **Bad** example, and a ✅ **Good** example. If you find
yourself about to write the ❌ pattern "just this once," stop and re-read the
rule.

---

## 0. Tech Stack (do not substitute or add libraries)

| Layer | Choice | Docs |
| --- | --- | --- |
| Framework | Next.js (App Router) | <https://nextjs.org/docs> |
| API layer | Hono + oRPC | <https://hono.dev> · <https://orpc.unjs.io> |
| Data fetching / cache | TanStack Query | <https://tanstack.com/query> |
| ORM | Drizzle ORM | <https://orm.drizzle.team> |
| Database | PostgreSQL (Neon) | <https://neon.tech/docs> |
| UI kit | shadcn/ui | <https://ui.shadcn.com> |
| Icons | `hugeicons-react` ONLY | <https://hugeicons.com> |

**Tricky scenario:** You need a small utility (e.g. `date-fns`, `clsx` variant,
a spinner) and it's "just a tiny package, doesn't touch architecture."

- ❌ **Bad:** Silently `npm install` a new dependency to solve a one-off UI or
  date-formatting need.
- ✅ **Good:** Check if the existing stack (Drizzle, date utilities already in
  the repo, Tailwind/shadcn primitives) already solves it. If nothing exists,
  propose the addition explicitly in your response/PR description before
  installing it, with a one-line justification.

---

## 1. Internationalization (English + French)

All UI-facing copy must exist in both `en` and `fr`, resolved dynamically from
user settings — never hardcoded, never inferred from browser locale alone.

**Tricky scenario:** A toast/error message is generated dynamically from a
caught exception or a validation library's default message.

- ❌ **Bad:**

  ```tsx
  toast.error(error.message); // raw exception text, English-only, technical
  ```

- ✅ **Good:**

  ```tsx
  toast.error(t("errors.studentUpdateFailed")); // key resolved via i18n dict
  ```

  Map every known error code to a translated, business-friendly string. Never
  surface `error.message`, stack traces, or validation-library output directly.

**Tricky scenario:** A new feature ships fast and "French can be added later."

- ❌ **Bad:** Merging a feature with only an `en.json` entry and a TODO for
  French.
- ✅ **Good:** Both `en` and `fr` keys are added in the same PR/commit as the
  feature. A missing translation key blocks merge, not just a lint warning.

**Tricky scenario:** Pluralization, dates, or currency formatting differ
between English and French conventions (e.g. "3 students" vs "3 élèves",
`12/31/2025` vs `31/12/2025`).

- ❌ **Bad:** Hardcode `MM/DD/YYYY` formatting everywhere.
- ✅ **Good:** Route all date/number/plural formatting through a locale-aware
  formatter keyed off the active `locale`, not a hardcoded format string.

---

## 2. UI Copy: Business Language Only

No technical terms, implementation details, HTTP codes, DB terms, or internal
jargon ever reach the UI — including in tooltips, empty states, and errors.

**Tricky scenario:** A 500 error or a Drizzle/Postgres constraint violation
bubbles up to the client.

- ❌ **Bad:**

  ```tsx
  <p>Error: duplicate key value violates unique constraint "students_email_unique"</p>
  ```

- ✅ **Good:**

  ```tsx
  <p>{t("errors.emailAlreadyInUse")}</p>
  ```

  Translate the typed error code (see §7) to plain business language before
  it reaches any component.

**Tricky scenario:** A developer wants to show a loading state and types
"Fetching data from server…" for speed.

- ❌ **Bad:** `"Fetching data from server..."` — exposes architecture (client/
  server, "fetching").
- ✅ **Good:** `"Loading students…"` — describes the business action, not the
  mechanism.

**Tricky scenario:** An admin-only debug panel is being built "just for us
developers, doesn't need business language."

- ❌ **Bad:** Skip translation/business-language rules because "only devs see
  this."
- ✅ **Good:** Any UI reachable by any user role — including admin/internal
  tooling — follows the same copy rules. If truly internal-only tooling is
  needed, it must not live inside the product's UI shell; discuss placement
  separately rather than quietly exempting it.

---

## 3. Design System Consistency

Only shadcn/ui components, only the defined font and color tokens, only
`hugeicons-react` for icons. No custom CSS, no inline one-off styling, no
alternate icon packs — even temporarily.

**Tricky scenario:** A designer or ticket references a Lucide icon name
because that's what's in the Figma file/export.

- ❌ **Bad:**

  ```tsx
  import { User } from "lucide-react";
  ```

- ✅ **Good:**

  ```tsx
  import { UserIcon } from "hugeicons-react";
  ```

  Map the Figma/Lucide icon name to its closest `hugeicons-react` equivalent.
  If no equivalent exists, raise it — don't fall back to another package.

**Tricky scenario:** A one-off screen "needs a slightly different shade of
blue" to match a stakeholder's mockup.

- ❌ **Bad:**

  ```tsx
  <div style={{ color: "#3b5fae" }}>Enrollment Open</div>
  ```

- ✅ **Good:** Use the existing design-token color (e.g. `text-primary`) or
  raise adding a new token to the shared theme config — never inline a
  one-off hex value in a component.

**Tricky scenario:** A component needs "just a little extra padding" to look
right on one page.

- ❌ **Bad:** `className="p-[13px] mt-[7px]"` — arbitrary, non-scale values.
- ✅ **Good:** Use the design system's spacing scale (`p-3`, `mt-2`, etc.).
  If the scale genuinely doesn't fit, that's a design-system gap to raise,
  not a one-off override.

**Tricky scenario:** A quick internal prototype "doesn't need shadcn, it's
just a temporary screen."

- ❌ **Bad:** Hand-roll a plain `<select>`/`<div>` stack styled from scratch
  because it's "temporary."
- ✅ **Good:** Use shadcn/ui primitives even for prototypes. Temporary code
  has a way of shipping; consistency isn't optional based on perceived
  lifespan.

---

## 4. UX: Simplify Operational Flows

Apply best-practice UX by default: minimize steps, avoid redundant
confirmations, use optimistic UI where safe, and default to progressive
disclosure over dumping every option on screen.

**Tricky scenario:** A form has 12 fields, 3 of which are rarely used.

- ❌ **Bad:** Render all 12 fields flat, all required-looking, all the time.
- ✅ **Good:** Show the common fields by default; put rare/advanced fields
  behind an "Advanced options" disclosure. Only mark fields required if the
  backend actually requires them.

**Tricky scenario:** A destructive action (e.g. removing a student from a
class) needs confirmation.

- ❌ **Bad:** A generic native `confirm("Are you sure?")` browser dialog.
- ✅ **Good:** A shadcn `AlertDialog` with business-language, action-specific
  copy: "Remove Amina from Grade 6 - Section B?" with clear primary/secondary
  actions.

---

## 5. Frontend Architecture: RSC, Separation of Concerns

Maximize React Server Components. Client Components only when interactivity
is strictly required. Components display data only. Hooks query data via
TanStack Query and manage state. Helper functions perform data mutation/
transformation. No computation leaks into JSX.

**Tricky scenario:** A component needs to format a name, compute a status
label, or sum a list of grades before rendering.

- ❌ **Bad:**

  ```tsx
  export default function StudentCard({ id }: { id: string }) {
    const { data } = useQuery(...);
    const fullName = data?.firstName + " " + data?.lastName.toUpperCase();
    return <div>{fullName}</div>;
  }
  ```

- ✅ **Good:**

  ```ts
  // helpers/formatters.ts
  /** Formats a student's full name for UI presentation. */
  export function formatStudentName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName.toUpperCase()}`;
  }
  ```

  ```tsx
  // components/StudentCard.tsx
  export default function StudentCard({ firstName, lastName }: StudentCardProps) {
    return <div>{formatStudentName(firstName, lastName)}</div>;
  }
  ```

**Tricky scenario:** A component only needs `onClick` on one button inside an
otherwise static, data-heavy page.

- ❌ **Bad:** Mark the entire page `"use client"` because one button needs an
  interaction.
- ✅ **Good:** Keep the page a Server Component; extract just the interactive
  button into its own small Client Component island.

**Tricky scenario:** A "quick fix" needs a filter/sort done directly inside
JSX during render.

- ❌ **Bad:**

  ```tsx
  {students.filter(s => s.gradeId === selectedGrade).sort((a,b) => a.name.localeCompare(b.name)).map(...)}
  ```

- ✅ **Good:** Extract to a helper (`filterAndSortStudents(students, selectedGrade)`)
  called before the `return`, or memoized in the hook layer — JSX stays pure
  display.

**Tricky scenario:** A hook is asked to "just also update the record while
it's fetching, to save a round trip."

- ❌ **Bad:** A `useStudent()` query hook that also triggers a mutation as a
  side effect.
- ✅ **Good:** Hooks only read/query and manage local UI state. Mutations
  live in their own mutation hook/helper (e.g. `useUpdateStudent()` wrapping
  a helper function), called explicitly from an event handler — never as a
  hidden side effect of a query.

---

## 6. oRPC Procedures & API Design

Procedure and endpoint names are concise, action-accurate, and follow one
convention project-wide. The RPC path is built from nested lowercase keys;
the verb is always the leaf, never fused onto the resource name.

### Naming conventions

| Layer | Rule | Example |
| --- | --- | --- |
| Top-level router key | lowercase **singular** | `group`, `user`, `template` |
| Sub-resource key | lowercase concatenated | `joinrequest`, `invitecode`, `category` |
| Verb | standard CRUD + domain actions | `list`, `get`, `create`, `update`, `delete`, `mark`, `review`, `pause` |
| TS export in handler file | unchanged (camelCase OK) | `reviewJoinRequest` |
| RPC path | nested lowercase keys only | `group.joinrequest.review` |

The handler's TypeScript export keeps camelCase — only the router *keys*
that compose the RPC path are lowercase.

**Tricky scenario:** A procedure both fetches and creates-if-missing.

- ❌ **Bad:** `getOrCreateStudent` exposed as a single ambiguous procedure
  that silently mutates data on what looks like a read.
- ✅ **Good:** Split into `student.get` (read-only) and `student.create`
  (explicit mutation). If upsert-on-read is truly the business need, name it
  unambiguously (e.g. `student.ensureexists`) and document why in `/docs`.

**Tricky scenario:** Naming drifts across modules — one file uses
`fetchGrades`, another uses `gradesList`, another uses `getAllGrades`.

- ❌ **Bad:** Mixed conventions per developer preference.
- ✅ **Good:** One convention, applied everywhere: `grade.list`, `grade.get`,
  `grade.create`, `grade.update`, `grade.delete`.

**Tricky scenario:** A verb feels natural fused onto the resource, e.g.
`joinrequest.reviewJoinRequest` or a flat `reviewJoinRequest` key.

- ❌ **Bad:** `group.reviewJoinRequest` — the verb is fused into a camelCase
  key, so the path no longer decomposes into resource and action.
- ✅ **Good:** `group.joinrequest.review` — each layer is its own lowercase
  key. The handler it points at may still be exported as
  `reviewJoinRequest`.

---

## 7. Error Handling

Typed, context-adapted error codes per failure state. Never generic
`throw new Error(string)`. Never leak raw DB/HTTP errors to the client (see §2).

**Tricky scenario:** A record isn't found during an update.

- ❌ **Bad:**

  ```ts
  throw new Error("Failed to update student profile");
  ```

- ✅ **Good:**

  ```ts
  export class StudentNotFoundError extends Error {
    readonly code = "STUDENT_NOT_FOUND";
    constructor(studentId: string) {
      super(`Student record with ID ${studentId} could not be located.`);
    }
  }
  ```

  The oRPC error boundary maps `STUDENT_NOT_FOUND` → translated,
  business-language UI copy (§2).

**Tricky scenario:** Two different failure states are "close enough" to reuse
one error class to save time (e.g. "not found" vs "not authorized to view").

- ❌ **Bad:** Reuse `StudentNotFoundError` for a permissions failure because
  the message can be tweaked at the call site.
- ✅ **Good:** Separate typed errors (`StudentNotFoundError`,
  `StudentAccessDeniedError`) — different codes drive different UI copy and
  different client-side handling (e.g. redirect vs inline message).

---

## 8. Database & PostgreSQL (via Drizzle)

Drizzle only; raw SQL only when provably impossible otherwise (and then
isolated, with a `/docs` note explaining why). No N+1 queries. Select only the
columns actually needed. Use Postgres features (indexes, constraints, FKs,
JSONB, CTEs) to push work to the database layer.

**Tricky scenario:** A list view needs each student's current grade name.

- ❌ **Bad:**

  ```ts
  const students = await db.select().from(studentsTable);
  for (const student of students) {
    const grade = await db.select().from(gradesTable).where(eq(gradesTable.id, student.gradeId));
  }
  ```

- ✅ **Good:**

  ```ts
  const studentData = await db
    .select({
      id: studentsTable.id,
      fullName: studentsTable.fullName,
      gradeName: gradesTable.name,
    })
    .from(studentsTable)
    .leftJoin(gradesTable, eq(studentsTable.gradeId, gradesTable.id));
  ```

**Tricky scenario:** A dashboard needs a rollup (e.g. average grade per
class) and it's tempting to compute it in JS after fetching all rows.

- ❌ **Bad:** Fetch every student row and every grade row, then `reduce()` in
  the API handler to compute averages.
- ✅ **Good:** Push the aggregation into Postgres via Drizzle's `sql`
  aggregate helpers or a CTE, returning only the computed rollup rows —
  minimizes data transfer and leverages the DB engine.

**Tricky scenario:** A feature needs to store a flexible, rarely-queried
attribute bag (e.g. per-school custom settings).

- ❌ **Bad:** Create a new `school_settings_key_value` table for every
  arbitrary setting.
- ✅ **Good:** Use a `JSONB` column (e.g. `metadata`) on the existing table
  when the data is genuinely unstructured/variable and not queried
  relationally. Reserve new tables for data with real relational shape.

**Tricky scenario:** A new feature needs one more boolean/date on an
existing entity (e.g. `isArchived` on `students`).

- ❌ **Bad:** Create a new `student_archive_status` table with a foreign key
  back to `students` for a single boolean flag.
- ✅ **Good:** Add the column directly to `students` — no normalization
  violation, no relational complexity, no need for a join to answer a
  single-flag question. Reach for a new table only when the concept is
  genuinely 1-to-many or many-to-many, or independently owned data.

**Tricky scenario:** A query filters on a column that isn't indexed yet, and
it "still works" in dev with small data.

- ❌ **Bad:** Ship the query unindexed because it returns fast on 50 rows in
  a local DB.
- ✅ **Good:** Add the appropriate index (and a FK constraint if it's a
  relationship) as part of the same migration — assume production-scale data
  from day one.

---

## 9. Schema Change Discipline

Alter the schema only when there is no reasonable way to model the need
within existing tables. Prefer a new column over a new table when it doesn't
violate normalization.

**Tricky scenario:** A feature needs to track "last login time" per user.

- ❌ **Bad:** New `user_login_events_summary` table just to hold one
  timestamp per user.
- ✅ **Good:** Add `lastLoginAt` column to the existing `users` table — it's
  a 1-to-1 scalar fact about a user, not a relational concept.

**Tricky scenario:** A feature needs a full audit log of every login (not
just the last one).

- ❌ **Bad:** Try to cram multiple login timestamps into a JSONB array column
  on `users` to "avoid creating a new table."
- ✅ **Good:** This is genuinely 1-to-many, unbounded, and independently
  queried — a new `login_events` table with a FK to `users` is the correct,
  normalized choice. Not every new table is wrong; the rule is "prefer a
  column when it fits," not "never create tables."

---

## 10. Clean Code & Function Design

Single responsibility per function. Concise definitions. No wrapper
functions that add no value. `camelCase` naming that reflects behavior. One
consistent paradigm (functional/declarative) — no mixed classes-and-hooks
styles, no imperative loops where a declarative pipeline reads clearer.

**Tricky scenario:** A function is asked to fetch a student, format their
name, and check their eligibility, "since it's all related to the student."

- ❌ **Bad:**

  ```ts
  async function processStudent(id: string) {
    const student = await getStudent(id);
    const name = student.firstName + " " + student.lastName;
    const eligible = student.age >= 6 && student.enrolled;
    return { name, eligible };
  }
  ```

- ✅ **Good:** Split into `getStudent`, `formatStudentName`, and
  `isStudentEligible` — each independently testable, reusable, and named for
  exactly what it does.

**Tricky scenario:** A developer wraps a Drizzle call in a same-signature
function "in case we need to swap the ORM later."

- ❌ **Bad:**

  ```ts
  async function fetchStudentById(id: string) {
    return db.select().from(studentsTable).where(eq(studentsTable.id, id));
  }
  // called in exactly one place, adds no logic
  ```

- ✅ **Good:** Only wrap when the wrapper adds real value (column selection,
  error typing, joins). A pass-through wrapper used once is dead weight —
  call Drizzle directly in the one place that needs it, or add real logic to
  justify the wrapper.

**Tricky scenario:** Function naming under time pressure.

- ❌ **Bad:** `handleStuff`, `doUpdate`, `process`, `studentUtil2`.
- ✅ **Good:** `formatStudentName`, `isStudentEligible`,
  `calculateAverageGrade` — camelCase, verb-led, behavior-explicit.

**Tricky scenario:** Mixing paradigms — a class-based service creeps into an
otherwise functional codebase because "it's how the dev is used to writing
it."

- ❌ **Bad:**

  ```ts
  class StudentService {
    constructor(private db: Database) {}
    getStudent(id: string) { /* ... */ }
  }
  ```

- ✅ **Good:** Keep to plain functions/modules consistent with the rest of
  the codebase:

  ```ts
  export async function getStudent(id: string) { /* ... */ }
  ```

---

## 11. Typing

Rely on inference from oRPC, Drizzle, and TanStack Query. Declare new types/
interfaces only when inference genuinely can't produce them.

**Tricky scenario:** A component prop type mirrors a Drizzle row type
exactly.

- ❌ **Bad:**

  ```ts
  interface Student {
    id: string;
    firstName: string;
    lastName: string;
    gradeId: string;
  }
  ```

  hand-maintained in parallel with the Drizzle schema, drifting over time.
- ✅ **Good:**

  ```ts
  type Student = typeof studentsTable.$inferSelect;
  ```

  or the inferred oRPC procedure output type — one source of truth.

**Tricky scenario:** A UI needs a shape that's a genuine combination/
transform of two inferred types (e.g. a student plus a computed
`displayName` field not present on any table).

- ❌ **Bad:** Force-fit the inferred DB type and add ad-hoc fields via `any`
  or type assertions.
- ✅ **Good:** This is a legitimate case for a new, explicit type:

  ```ts
  type StudentListItem = typeof studentsTable.$inferSelect & { displayName: string };
  ```

---

## 12. TanStack Query: Caching & Prefetching

Use `staleTime`, cache keys, and prefetching deliberately for every piece of
server state — don't accept default zero-stale-time refetch-on-everything
behavior by omission.

**Tricky scenario:** A list page links to a detail page whose data is
largely known ahead of time.

- ❌ **Bad:** Let the detail page mount and fetch from scratch, showing a
  spinner every time a user navigates from the list.
- ✅ **Good:** Prefetch the detail query (`queryClient.prefetchQuery`) on
  hover/navigation intent from the list, with a shared, consistent query key
  so the cache is reused instantly.

**Tricky scenario:** Reference data (e.g. list of grades/classes) rarely
changes but is refetched on every navigation.

- ❌ **Bad:** Default `staleTime: 0` on rarely-changing reference data,
  causing constant unnecessary refetches.
- ✅ **Good:** Set an appropriately long `staleTime` (and/or `gcTime`) for
  low-churn data, and invalidate explicitly only when a mutation actually
  changes it.

---

## 13. Documentation & Comments

No inline comments, no TSDoc/JSDoc docstrings. Function and variable names
must be neat and behavior-explicit enough that the code reads on its own.
All architectural/extensive documentation lives in Markdown files under
`/docs` at the repo root — the product/architecture docs in `/docs` are the
source of truth, not comments scattered through the code.

**This applies to every edit, not just new files.** Do not add comments to
code you are changing — no explanatory notes, no `// added`/`// changed`
markers, no "why" annotations next to a fix, no commented-out old code left
beside the new version. Code written or modified by an assistant ships with
exactly as many comments as the surrounding code has: none. If a change
genuinely needs explaining, put it in the response or PR description, or in
a `/docs` note — never in the file.

**Tricky scenario:** A bug fix is subtle and the next reader will wonder why
the line changed, so a short `// fixes the off-by-one` feels helpful.

- ❌ **Bad:**

  ```ts
  // fixed: cursor must be exclusive or the last row repeats
  .where(cursor ? gt(postsTable.id, cursor) : undefined)
  ```

- ✅ **Good:**

  ```ts
  .where(cursor ? gt(postsTable.id, cursor) : undefined)
  ```

  The rationale goes in the PR description or `/docs`, not the file.

**Tricky scenario:** A tricky piece of business logic (e.g. a grade-weighting
calculation) needs explanation.

- ❌ **Bad:**

  ```ts
  // multiply by 0.4 because midterms count less than finals
  const weighted = midterm * 0.4 + final * 0.6;
  ```

- ✅ **Good:**

  ```ts
  function calculateWeightedGrade(midterm: number, final: number): number {
    return midterm * 0.4 + final * 0.6;
  }
  ```

  If the *why* genuinely can't be captured in the name, it belongs in a
  markdown doc under `/docs`, not a comment.

**Tricky scenario:** A new module's design rationale (why oRPC procedures
are grouped a certain way, why a table was denormalized) needs to be
recorded somewhere.

- ❌ **Bad:** A long block comment at the top of the file explaining the
  architecture decision.
- ✅ **Good:** A markdown doc at `/docs/architecture/grading-module.md`
  explaining the rationale; the code itself stays comment-free.

---

## 14. Multi-Tenancy & Data Isolation

Every query that touches school-scoped data (students, grades, classes,
staff, etc.) must be scoped to the current school/tenant. Scoping is enforced
at the query-helper level, never left to the caller to remember.

**Tricky scenario:** An admin dashboard needs "all students," and it's easy
to reach for `db.select().from(studentsTable)` without a tenant filter,
especially in a rush.

- ❌ **Bad:**

  ```ts
  export async function listStudents() {
    return db.select().from(studentsTable);
  }
  ```

- ✅ **Good:**

  ```ts
  /** Lists students for the given school only. */
  export async function listStudents(schoolId: string) {
    return db.select().from(studentsTable).where(eq(studentsTable.schoolId, schoolId));
  }
  ```

  `schoolId` comes from the authenticated session context, never from a
  client-supplied field the user could tamper with.

**Tricky scenario:** A "quick" cross-school report is requested for a
superadmin feature.

- ❌ **Bad:** Bypass the tenant-scoped helper and write a one-off unscoped
  query directly in the procedure "just for this one report."
- ✅ **Good:** Add an explicit, separately-authorized `listStudentsAcrossSchools`
  procedure restricted to the superadmin role (see §15) — unscoped access is
  always an explicit, named, permission-checked path, never a silent default.

**Tricky scenario:** A record's `id` is passed directly from the client to
fetch a single row (e.g. `getStudent(studentId)`).

- ❌ **Bad:** Fetch by `id` alone — any authenticated user could pass another
  school's student ID and read it.
- ✅ **Good:** Always filter by `id` **and** `schoolId` from the session:
  `where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, sessionSchoolId)))`.
  A not-found result (rather than another school's data) is the correct
  response when the ID belongs to a different tenant.

---

## 15. Authorization (RBAC)

Every procedure declares which roles may call it. Authorization is checked
server-side in the procedure, never inferred from what the UI happens to
show or hide.

**Tricky scenario:** A "delete student" button is hidden from teachers in the
UI, so the reasoning is "the procedure doesn't need its own check."

- ❌ **Bad:** Rely on the button being hidden for non-admins; the
  `deleteStudent` procedure itself performs no role check.
- ✅ **Good:**

  ```ts
  /** Deletes a student. Requires the admin role. */
  export const deleteStudent = protectedProcedure
    .use(requireRole("admin"))
    .handler(async ({ input, context }) => { /* ... */ });
  ```

  Hiding UI is a UX nicety; the server-side check is the actual security
  boundary.

**Tricky scenario:** A teacher should see only their own classes, while an
admin sees all classes in the school — same procedure, different scope.

- ❌ **Bad:** One `listClasses` procedure with no scope difference,
  relying on the frontend to filter what it displays.
- ✅ **Good:** The procedure itself branches on role: admins get
  school-wide scope, teachers get `where(eq(classesTable.teacherId, userId))`
  applied server-side. The client never receives data it isn't allowed to see.

**Tricky scenario:** A new "parent" role is added and an existing procedure
is reused for it without re-checking what it exposes.

- ❌ **Bad:** Grant the parent role access to `getStudent` unchanged, which
  also returns internal fields (e.g. disciplinary notes) meant for staff only.
- ✅ **Good:** Define role-specific output shaping — either a separate
  procedure or an explicit field allowlist per role — so adding a role is a
  reviewed decision about exposed fields, not an accidental grant.

---

## 16. Input Validation

Every procedure validates its input with a schema (Zod, or oRPC's built-in
schema support) at the API boundary, before any DB access. Never trust
client-supplied shape, even for "obviously fine" internal tools.

**Tricky scenario:** An internal admin form posts a payload that "should
always be well-formed since we control the form."

- ❌ **Bad:**

  ```ts
  export const updateStudent = procedure.handler(async ({ input }) => {
    return db.update(studentsTable).set(input).where(eq(studentsTable.id, input.id));
  });
  ```

  No shape/type validation — `input` could contain unexpected fields or
  wrong types and gets passed straight into `.set()`.
- ✅ **Good:**

  ```ts
  const updateStudentSchema = z.object({
    id: z.string().uuid(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
  });

  export const updateStudent = procedure
    .input(updateStudentSchema)
    .handler(async ({ input }) => { /* ... */ });
  ```

  Only the exact validated fields are ever passed to Drizzle's `.set()` —
  never a raw spread of unvalidated input.

**Tricky scenario:** Client-side form validation already checks the fields,
so server-side validation feels redundant.

- ❌ **Bad:** Skip server-side schema validation because the form already
  validates, assuming the request always comes from that form.
- ✅ **Good:** Client-side validation is a UX convenience for fast feedback;
  server-side schema validation is the actual guarantee, since any client
  can call the procedure directly (browser devtools, scripts, other clients).

---

## 17. Soft Deletes & Data Retention

Student, grade, and enrollment records are never hard-deleted by default —
use a `deletedAt`/`archivedAt` column and filter it out of normal queries.
Hard deletion is a separate, explicitly-authorized, rare operation.

**Tricky scenario:** A "remove student" feature is requested and the
straightforward implementation is a real `DELETE`.

- ❌ **Bad:**

  ```ts
  await db.delete(studentsTable).where(eq(studentsTable.id, studentId));
  ```

- ✅ **Good:**

  ```ts
  /** Archives a student record; does not permanently delete it. */
  await db.update(studentsTable)
    .set({ archivedAt: new Date() })
    .where(eq(studentsTable.id, studentId));
  ```

  All standard list/get queries add `where(isNull(studentsTable.archivedAt))`
  by default (ideally via a shared query helper, not repeated ad hoc).

**Tricky scenario:** An archived student's data still shows up in a
"total enrolled students" count because a query forgot the filter.

- ❌ **Bad:** Each query re-writes `isNull(archivedAt)` by hand, and one gets
  missed, silently corrupting a report.
- ✅ **Good:** Centralize the "active students" condition in one reusable
  query helper (`activeStudentsQuery()`) so every consumer gets it
  automatically and consistently.

**Tricky scenario:** A school genuinely needs a record permanently erased
(e.g. legal/GDPR-style request).

- ❌ **Bad:** Add a generic `hardDeleteStudent` procedure callable by any
  admin with no additional guardrails.
- ✅ **Good:** A separate, tightly-scoped, superadmin-only, logged procedure
  (see §24) for permanent erasure — distinct from the everyday archive flow,
  with its own explicit confirmation step in the UI.

---

## 18. Testing Expectations

New helpers, procedures, and non-trivial hooks ship with tests. Business
logic (formatting, eligibility, grade calculations, authorization branching)
is unit-tested; procedures get integration-level coverage for their main
success and failure paths.

**Tricky scenario:** A grade-weighting helper (§13 example) is added under
time pressure, "tests can follow later."

- ❌ **Bad:** Merge `calculateWeightedGrade` with no test, relying on manual
  spot-checking in the browser.
- ✅ **Good:**

  ```ts
  test("calculateWeightedGrade weights midterm 40% and final 60%", () => {
    expect(calculateWeightedGrade(80, 90)).toBe(86);
  });
  ```

  Pure helper functions are cheap to test — there's rarely a good reason to
  skip it.

**Tricky scenario:** A procedure's "happy path" is tested, but its
authorization/tenant-scoping branch (§14, §15) isn't.

- ❌ **Bad:** Only test that an admin can successfully call `deleteStudent`.
- ✅ **Good:** Also test that a teacher calling `deleteStudent` is rejected,
  and that a school cannot delete another school's student — the security
  boundary is exactly the thing most worth testing.

---

## 19. Loading, Error, and Empty States

Every data-driven view handles three states consistently: loading, error,
and empty — using shared, reusable components rather than bespoke markup
per screen.

**Tricky scenario:** A new list view is built quickly and only the "happy
path with data" is implemented.

- ❌ **Bad:**

  ```tsx
  const { data } = useStudents();
  return <div>{data.map(s => <StudentRow key={s.id} student={s} />)}</div>;
  ```

  Crashes or shows nothing meaningful while loading, on error, or when the
  school has zero students.
- ✅ **Good:**

  ```tsx
  const { data, isPending, isError } = useStudents();
  if (isPending) return <StudentListSkeleton />;
  if (isError) return <ErrorState messageKey="errors.studentsLoadFailed" />;
  if (data.length === 0) return <EmptyState messageKey="empty.noStudentsYet" />;
  return <div>{data.map(s => <StudentRow key={s.id} student={s} />)}</div>;
  ```

  Use shared `ErrorState`/`EmptyState`/skeleton components everywhere so
  every screen behaves the same way and copy stays business-language and
  translated (§1, §2).

---

## 20. Accessibility

shadcn/ui gives accessible primitives by default — don't undo that with
custom markup, missing labels, or mouse-only interactions.

**Tricky scenario:** A custom clickable `<div>` is used instead of a
button/shadcn component "because it was faster to style."

- ❌ **Bad:**

  ```tsx
  <div onClick={handleSubmit}>Save</div>
  ```

  Not focusable, not keyboard-activatable, not announced as a button to
  screen readers.
- ✅ **Good:**

  ```tsx
  <Button onClick={handleSubmit}>{t("actions.save")}</Button>
  ```

  Use shadcn's `Button` (or a real `<button>`) so focus, keyboard activation,
  and semantics come for free.

**Tricky scenario:** An icon-only action button (e.g. delete icon) has no
accessible name.

- ❌ **Bad:**

  ```tsx
  <Button size="icon"><TrashIcon /></Button>
  ```

- ✅ **Good:**

  ```tsx
  <Button size="icon" aria-label={t("actions.deleteStudent")}><TrashIcon /></Button>
  ```

---

## 21. Pagination

One consistent pagination pattern across all list views and list procedures
— cursor-based, since it scales correctly for growing tables and avoids the
performance cliff of large `OFFSET` values.

**Tricky scenario:** A new list endpoint is added and offset/limit feels
simplest to implement quickly.

- ❌ **Bad:**

  ```ts
  .limit(pageSize).offset(page * pageSize)
  ```

  Works fine in dev, degrades badly at scale and drifts inconsistently if
  rows are added/removed between page loads.
- ✅ **Good:**

  ```ts
  /** Lists students after the given cursor, ordered by id. */
  .where(cursor ? gt(studentsTable.id, cursor) : undefined)
  .orderBy(asc(studentsTable.id))
  .limit(pageSize)
  ```

  Return the last row's id as `nextCursor`; the frontend hook manages this
  via TanStack Query's `useInfiniteQuery`, not manual page-number state.

---

## 22. File Uploads

Files (student documents, assignment submissions, profile photos) are
uploaded to object storage, never stored as blobs in Postgres. The database
stores only a reference (URL/key), plus validated metadata.

**Tricky scenario:** A "quick" attachment feature is needed and storing the
raw file bytes in a `bytea` column seems like the fastest path.

- ❌ **Bad:**

  ```ts
  fileData: bytea("file_data") // storing raw file bytes in Postgres
  ```

- ✅ **Good:**

  ```ts
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  ```

  Upload the actual file to the configured object storage; store only the
  resulting reference and metadata in Postgres.

**Tricky scenario:** An upload procedure accepts any file type/size "to keep
it simple."

- ❌ **Bad:** No server-side check on file type or size — a user could
  upload an executable or a 2GB file as a "profile photo."
- ✅ **Good:** Validate MIME type and enforce a max size server-side (not
  just via an HTML `accept` attribute, which is only a client-side hint) and
  reject anything outside the allowed set with a typed error (§7).

---

## 23. Migrations Discipline

Every schema change goes through a generated Drizzle migration, reviewed
like code — never a manual, undocumented change applied directly to a
database.

**Tricky scenario:** A column needs a quick fix in production "just this
once" to unblock something urgent.

- ❌ **Bad:** Connect directly to the production database and run
  `ALTER TABLE` by hand to fix it fast.
- ✅ **Good:** Generate the migration locally, review the diff, apply it
  through the normal migration pipeline — even under time pressure, since an
  undocumented manual change means the schema and migration history silently
  diverge.

**Tricky scenario:** A migration renames or drops a column that's still
read by older, in-flight client code during a rolling deploy.

- ❌ **Bad:** Drop/rename in one migration deployed at the same time as the
  code that depends on the old name — a brief window causes real errors.
- ✅ **Good:** Expand-then-contract: add the new column, deploy code that
  writes to both, backfill, deploy code that reads only the new column, then
  drop the old column in a later migration.

---

## 24. Logging & Observability (PII-Safe)

Use structured logging for procedures and errors; never log raw student PII
(names, emails, grades, health/behavior notes) in plaintext logs.

**Tricky scenario:** Debugging a failed update, it's tempting to log the
full input object to see what went wrong.

- ❌ **Bad:**

  ```ts
  console.log("Update failed for input:", input); // may include student PII
  ```

- ✅ **Good:**

  ```ts
  logger.error("student.update.failed", { studentId: input.id, errorCode: err.code });
  ```

  Log identifiers and error codes, not names, contact info, or sensitive
  fields — enough to trace the issue without exposing PII in log storage.

**Tricky scenario:** A permanent-erasure or role-escalation action (§17, §15)
happens with no record of who did it.

- ❌ **Bad:** Perform sensitive admin actions with no audit trail.
- ✅ **Good:** Write an audit log entry (`actorId`, `action`, `targetId`,
  `timestamp`) for sensitive operations — deletions, role changes, data
  exports — independent of the debug/application logger.

---

## 25. Skill Discovery & Usage

Before starting any non-trivial task (new feature, migration, complex
refactor, doc generation, etc.), check whether an existing skill already
encodes the right process for it, and use it instead of improvising from
scratch. If no matching skill exists but the task is one you'll hit
repeatedly, use the skill-finder/skill-creator skill to locate or scaffold
one rather than solving it ad hoc every time.

**Tricky scenario:** A task looks like something a skill should cover (e.g.
generating a Drizzle migration, scaffolding a new oRPC procedure + hook +
component trio, writing a `/docs` architecture note), but no skill is
obviously named for it.

- ❌ **Bad:** Assume no skill exists and hand-roll the process from memory
  every time, leading to drift between how different features get scaffolded.
- ✅ **Good:** Search available skills first (project-level and global). If
  nothing fits, invoke the skill-finder/skill-creator skill to check for a
  closer match or to scaffold a new skill capturing the correct process —
  then use that skill going forward instead of repeating the same
  from-scratch reasoning.

**Tricky scenario:** A relevant skill exists but only partially covers the
task (e.g. it covers the migration but not the matching `/docs` entry this
project requires).

- ❌ **Bad:** Use the skill for the part it covers and quietly freehand the
  rest, so the gap never gets fixed for next time.
- ✅ **Good:** Use the skill for what it covers, then flag the gap explicitly
  and use skill-creator to extend or create a companion skill so the missing
  piece is captured for future tasks too.

**Tricky scenario:** Several skills seem to overlap for the same task (e.g.
one for "API endpoint," one for "database schema change") and it's unclear
which to invoke first.

- ❌ **Bad:** Pick one arbitrarily and ignore the other, potentially missing
  steps the skipped skill would have caught.
- ✅ **Good:** Read each plausibly-relevant skill before starting, the same
  way multiple document-format skills are checked before writing a file —
  combine them (e.g. schema-change skill for the migration, API skill for
  the procedure) rather than picking just one.

---

## 26. Stored-String Constants

Every string value that gets written into a database column — role names,
status/enum values, discriminator types, provider/method identifiers — is
referenced in code via a named constant, never a raw string literal typed
inline at each call site. Constants live in a dedicated constants file (e.g.
`packages/db/src/constants.ts` for values tied to the schema), grouped by the
column/domain they belong to, and both the Drizzle schema (`pgEnum` values,
`.default(...)`) and every read/write site import from that one file.

**Tricky scenario:** A `member.role` check is needed in a new procedure and
it's fastest to just type the role name again.

- ❌ **Bad:**

  ```ts
  if (member.role === "ADMIN" || member.role === "OWNER") { /* ... */ }
  ```

  A typo (`"Admin"`, `"OWNERS"`) compiles fine and fails silently at runtime.

- ✅ **Good:**

  ```ts
  // packages/db/src/constants.ts
  export const ORG_ROLE = {
    OWNER: "OWNER",
    ADMIN: "ADMIN",
    TEACHER: "TEACHER",
    STAFF: "STAFF",
    STUDENT: "STUDENT",
    PARENT: "PARENT",
  } as const;

  export type OrgRole = (typeof ORG_ROLE)[keyof typeof ORG_ROLE];
  ```

  ```ts
  import { ORG_ROLE } from "@orivantapay/db/constants";

  if (member.role === ORG_ROLE.ADMIN || member.role === ORG_ROLE.OWNER) { /* ... */ }
  ```

  A typo becomes a compile error instead of a silent runtime bug, and
  renaming a value is a one-file change.

**Tricky scenario:** A Drizzle `pgEnum` or a `.default(...)` value is defined
once in the schema file, so it feels redundant to also pull it from a
constants file there.

- ❌ **Bad:**

  ```ts
  export const transferStatus = pgEnum("transfer_status", [
    "PENDING",
    "ACCEPTED",
    "DECLINED",
    "CANCELLED",
  ]);
  ```

  The same four strings then get retyped at every call site that checks or
  sets a transfer's status, with no single source of truth.

- ✅ **Good:**

  ```ts
  // packages/db/src/constants.ts
  export const TRANSFER_STATUS = {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    DECLINED: "DECLINED",
    CANCELLED: "CANCELLED",
  } as const;
  ```

  ```ts
  // packages/db/src/schema/schema.ts
  import { TRANSFER_STATUS } from "../constants";

  export const transferStatus = pgEnum("transfer_status", Object.values(TRANSFER_STATUS) as [string, ...string[]]);
  ```

  The schema and every consumer both derive from the same constant, so
  adding or renaming a status value is one edit instead of a grep-and-hope.

**Tricky scenario:** A one-off script or seed file needs to insert a row with
a known status, "just this once, doesn't need the import."

- ❌ **Bad:** `db.insert(member).values({ role: "STUDENT", ... })` in a seed
  script, bypassing the constant because it's "not application code."
- ✅ **Good:** Seed scripts, migrations' data-backfill steps, and tests all
  import the same constants as application code — there is no tier of code
  that's exempt from this rule, since drift between a seed script and the
  real enum is exactly how silent bugs get introduced.

---

## Quick Checklist Before Committing

- [ ] Every new string of UI copy has both `en` and `fr` keys, business
      language only.
- [ ] Every icon import is from `hugeicons-react`.
- [ ] No inline styles/arbitrary Tailwind values; only design tokens.
- [ ] Components contain no computation; logic lives in helpers/hooks.
- [ ] No unnecessary `"use client"` — RSC by default.
- [ ] No raw SQL unless justified in a `/docs` note explaining why.
- [ ] No N+1 queries; only required columns selected.
- [ ] Schema change checked against "can this be a column instead of a table?"
- [ ] Errors are typed classes with a `code`, never a bare `Error(string)`.
- [ ] Function names are camelCase and behavior-explicit; no wrapper with no
      added logic.
- [ ] New types only where inference truly can't reach.
- [ ] Query keys and `staleTime`/prefetching considered for new queries.
- [ ] No inline comments or docstrings anywhere, including in edits to
      existing files; no `// added`/`// changed` markers, no commented-out old
      code; names carry the meaning; architecture notes go in `/docs`.
- [ ] RPC paths are nested lowercase keys with the verb as the leaf
      (`group.joinrequest.review`), never a fused camelCase key.
- [ ] Every school-scoped query filters by `schoolId` from the session, not
      a client-supplied value.
- [ ] Every procedure has an explicit role check server-side, not just a
      hidden UI element.
- [ ] Every procedure input is validated with a schema before touching the DB.
- [ ] Deletions of student/grade/enrollment data are soft (archivedAt), not
      hard, unless the operation is the explicit, separate erasure path.
- [ ] New helpers/procedures have tests covering both the happy path and the
      authorization/tenant-scoping failure path.
- [ ] Every list/detail view handles loading, error, and empty states with
      shared components.
- [ ] Interactive elements use real buttons/shadcn primitives with accessible
      names, not clickable `div`s.
- [ ] New list endpoints use cursor-based pagination, not offset/limit.
- [ ] File uploads go to object storage with validated type/size; only a
      reference is stored in Postgres.
- [ ] Schema changes go through a reviewed Drizzle migration, never a manual
      production edit.
- [ ] No raw PII in application logs; sensitive actions get an audit log entry.
- [ ] Checked for an existing skill covering this task before improvising;
      used skill-finder/skill-creator to fill any real gap found.
- [ ] Every string stored in a DB column (role, status, type, enum value) is
      referenced via a named constant from the constants file, never a raw
      string literal at the call site.
- [ ] DB queries live in `packages/db`, routers/procedures in `packages/api`,
      business/helper logic in `packages/utils` — no layer crosses another.
- [ ] UI need checked against the §28 component map (toast vs. Alert, Item vs.
      hand-rolled row, chart vs. new library, etc.) before writing new markup.

---

## 27. Layered Separation of Concerns

Every feature is split across three layers, each in its own package, no
exceptions: database queries live in `packages/db`, oRPC routers/procedures
live in `packages/api`, and business/helper logic lives in `packages/utils`.
A router never talks to Drizzle directly, and a query helper never contains
business rules.

**Tricky scenario:** A new oRPC procedure needs to fetch a row and also
decide whether the caller is allowed to see it.

- ❌ **Bad:**

  ```ts
  // packages/api/src/routers/students.ts
  export const getStudent = protectedProcedure.handler(async ({ input, context }) => {
    const [row] = await db.select().from(studentsTable).where(eq(studentsTable.id, input.id));
    if (row.schoolId !== context.session.activeOrganizationId) throw new StudentAccessDeniedError();
    return row;
  });
  ```

- ✅ **Good:**

  ```ts
  // packages/db/src/queries/students.ts
  export async function getStudentById(studentId: string, schoolId: string) {
    return db.select().from(studentsTable)
      .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)));
  }

  // packages/utils/src/students.ts
  export function assertStudentEligible(student: Student) { /* ... */ }

  // packages/api/src/routers/students.ts
  export const getStudent = protectedProcedure.handler(async ({ input, context }) => {
    const student = await getStudentById(input.id, context.session.activeOrganizationId);
    assertStudentEligible(student);
    return student;
  });
  ```

**Tricky scenario:** A helper needs a shared type or constant across the
db/api/utils split.

- ❌ **Bad:** Re-declare the same type or constant in each package because
  "it's easier than sorting out the import."
- ✅ **Good:** Export it once from the package that owns it (types inferred
  from Drizzle stay in `packages/db`; constants stay in
  `packages/db/src/constants.ts` per §26) and import it from there in
  `packages/api` and `packages/utils`.

---

## 28. shadcn/ui Component Selection Map

Every one of these primitives already exists in `packages/ui/src/components`
(imported as `@orivantapay/ui/components/*`, or re-exported from
`packages/ui` where an app-level wrapper adds i18n/business logic). Per §3,
never hand-roll markup that one of these already solves. This table is the
lookup — check it before reaching for a `<div>`.

| Situation | Component | Not |
| --- | --- | --- |
| Any success/error/info notification | `sonner` (`toast(...)`) | a hand-rolled banner or `alert()` |
| Inline, persistent success/error/warning block inside a page | `alert` (`Alert`, `AlertTitle`, `AlertDescription`) | `sonner` — sonner is transient, `Alert` stays on screen |
| Free-form multi-line text input (notes, descriptions) | `textarea` | `input` stretched with CSS |
| Tabular list data with columns | `table` (+ TanStack Table for sort/filter/pagination logic, per the shadcn Data Table pattern) | a `div`/CSS-grid layout |
| Boolean on/off setting | `switch` | a two-option `radio-group` or checkbox styled to look like a toggle |
| Inline loading indicator (button submitting, small async region) | `spinner` | a custom CSS spinner or emoji |
| Placeholder shape while content loads | `skeleton` | rendering nothing, or a spinner over a whole list (§19) |
| Visual divider between sections/items | `separator` | a `border-t` div |
| Single choice from a list, dropdown style | `select` | a native `<select>` styled from scratch |
| Scrollable fixed-height region (long list in a card, chat log) | `scroll-area` | `overflow-y-auto` with default browser scrollbar styling |
| Single choice from a small, always-visible list of options | `radio-group` | `select` when there are ≤4 options and all should be visible at once |
| Bounded, determinate progress (upload %, multi-step wizard) | `progress` | a custom div-width-percentage bar |
| Floating panel anchored to a trigger (date picker, inline filter panel) | `popover` | a manually positioned absolute `div` |
| Page-number navigation controls for a paginated view | `pagination` (UI only) | — see the tricky scenario below on how this coexists with §21 |
| Top-level section navigation with flyout content | `navigation-menu` | a hand-rolled dropdown nav |
| Displaying a keyboard shortcut hint | `kbd` | plain styled `<span>` |
| Row/list entry with media + title + description + actions (staff list row, notification row) | `item` (`Item`, `ItemMedia`, `ItemContent`, `ItemActions`) | a bespoke flex `div` stack repeated per screen |
| Input with an icon, button, or unit affixed to it | `input-group` | absolutely-positioned icons inside a plain `input` |
| Picking a single date or date range | Compose `popover` + `calendar` (shadcn's documented Date Picker pattern — there is no standalone `date-picker` component) | a native `<input type="date">` or a third-party date-picker package (§0) |
| Charts/graphs (attendance trends, fee collection, grade distributions) | `chart` (Recharts primitives wrapped by `ChartContainer`/`ChartTooltipContent`) | a new charting library (§0) |

**Tricky scenario:** A dashboard needs an attendance-rate trend chart, and
Recharts feels like "just installing a chart library" (§0's dependency rule).

- ❌ **Bad:** `npm install chart.js` because it's more familiar.
- ✅ **Good:** `chart` is already installed and wraps Recharts (a dependency
  already in `packages/ui`) via `ChartContainer`/`ChartConfig`. Build the
  chart with Recharts primitives composed inside `ChartContainer`, not a new
  charting package.

**Tricky scenario:** A paginated list (e.g. staff roster) needs page
controls, but §21 mandates cursor-based pagination, not page numbers.

- ❌ **Bad:** Build a numbered `pagination` UI backed by an `offset`/`page`
  query param, reintroducing the `OFFSET` performance cliff §21 forbids.
- ✅ **Good:** The `pagination` component is a rendering primitive only — wire
  its "Previous"/"Next" controls to `useInfiniteQuery`'s `fetchPreviousPage`/
  `fetchNextPage` driven by the cursor the procedure returns. Never wire it to
  a raw page-number state variable.

**Tricky scenario:** A toast is used to show a validation error that needs to
stay visible while the user fixes a form, not disappear after a few seconds.

- ❌ **Bad:** `toast.error(t("errors.formInvalid"))` for an error the user
  needs to reference while correcting multiple fields.
- ✅ **Good:** Use `Alert`/`AlertDescription` inline in the form for anything
  the user must keep referencing; reserve `sonner` toasts for one-off,
  dismiss-and-forget confirmations (save succeeded, item deleted).

**Tricky scenario:** A list of students needs a name, avatar, and a
"Remove" action per row, and it's tempting to lay it out by hand since "it's
just a flex row."

- ❌ **Bad:**

  ```tsx
  <div className="flex items-center gap-3 p-2">
    <img src={avatarUrl} className="h-8 w-8 rounded-full" />
    <div>
      <p>{studentName}</p>
      <p className="text-sm text-muted-foreground">{gradeName}</p>
    </div>
    <Button className="ml-auto">Remove</Button>
  </div>
  ```

- ✅ **Good:**

  ```tsx
  <Item>
    <ItemMedia variant="avatar"><Avatar>...</Avatar></ItemMedia>
    <ItemContent>
      <ItemTitle>{studentName}</ItemTitle>
      <ItemDescription>{gradeName}</ItemDescription>
    </ItemContent>
    <ItemActions>
      <Button aria-label={t("actions.removeStudent")}>{t("actions.remove")}</Button>
    </ItemActions>
  </Item>
  ```

  `Item` already handles spacing, alignment, and the size/variant scale
  consistently across every list in the app — a hand-rolled row drifts from
  it screen by screen.


---

# Part 2 — from `leschampions/CLAUDE.md`

# CLAUDE.md

Guidance for AI assistants working in this repository. This file is a scoped-down
version of a reference doc the team supplied — the source doc described a different
project's stack (Hono + oRPC + TanStack Query, multi-tenant, i18n framework). This repo
doesn't have any of that. What follows is only the subset of rules that actually apply
here, adapted to how this codebase is really built.

## Stack

- Turborepo monorepo: `apps/web` (Next.js 16, App Router) + `packages/{ui,db,auth,env,config}`.
- Data access: Next.js Server Actions (`"use server"`) calling Drizzle ORM directly —
  no API layer, no oRPC, no TanStack Query. Server Components fetch data directly from
  `packages/db` query functions; client components mutate via server actions, typically
  with `useActionState` (full-page forms with server-validated state) or `useTransition`
  (dialogs, inline row edits, batch-save screens).
- Postgres via Neon (`packages/db`, `neon-http` driver).
- Auth: better-auth, email/password only. Role lives on `user.role` (Postgres enum,
  `packages/auth/src/rbac.ts` is the canonical role/module-access source — DB-independent
  by design, so class-scoped and student/parent-scoped authorization live in
  app-level files (`class-access.ts`, `portal-access.ts`) instead.
- UI: shadcn/ui via `@leschampions/ui` (style `base-lyra`, Base UI primitives).
- Single-tenant. One school, one deployment. Do not add `schoolId`/tenant scoping —
  there is nothing to scope against.
- French-only UI. There is no i18n framework and none should be added unless asked —
  don't hardcode English strings, but there's no `en`/`fr` switching to wire up either.

## Icons — Hugeicons only

`@hugeicons/react` (`<HugeiconsIcon icon={IconObject} />`) + `@hugeicons/core-free-icons`
(icon data, e.g. `Add01Icon`, `ArrowLeft01Icon`). Never `lucide-react`, never the
deprecated unscoped `hugeicons-react` package — not even temporarily. `packages/ui`'s
`components.json` has `"iconLibrary": "hugeicons"`, so `npx shadcn@latest add <name>`
regenerates primitives with the correct imports automatically.

## Components — shadcn only, use the right one

Don't hand-roll what a `@leschampions/ui` primitive already does. Before building a UI
pattern, check whether an existing component covers it:

| Situation | Use | Not |
|---|---|---|
| Inline validation/server error | `Alert` / `AlertTitle` / `AlertDescription` | a hand-rolled `role="alert"` div |
| Loading indicator | `Spinner` | `<HugeiconsIcon icon={Loading03Icon} className="animate-spin" />` inlined ad hoc |
| Empty table/list state | `Empty` / `EmptyTitle` (see `data-table.tsx` for the pattern) | a bare `<p>` |
| Toast notifications | `sonner.tsx`'s `Toaster` + `toast()` from `"sonner"` | the unused Base UI `toast.tsx` primitive (removed — see below) |
| Deferred-save boolean in a form or editable row | `Checkbox` | a fake-switch styled checkbox |
| Multi-select filter, >4 options | `Select` | `RadioGroup` |

If you're about to write `<div role="alert">`, a spinner icon by hand, or a raw
`<select>`, stop and check `packages/ui/src/components` first.

One deliberate exception: dozens of pre-existing screens across every module
(admissions, finances, pilotage, académique) use a plain
`<p className="text-sm text-muted-foreground">Aucun…</p>` for small inline empty
states inside cards/sections (not full-page states, and not table empty-states — those
go through `DataTable`, which already renders `Empty` internally). Converting all of
them to the `Empty` component would be a large, purely cosmetic, whole-app visual change
that wasn't specifically requested — left alone for now. Ask before doing that sweep.

## No comments

Code written or modified here ships with exactly as many comments as necessary for a
reader who doesn't have the original spec doc — which in practice means none for
straightforward code. This applies to every edit, not just new files: if you touch a
file that has stale doc-comments (especially ones citing an external spec, e.g. `§6.7`),
strip them as part of the edit rather than leaving them.

This is a firmer rule for `apps/web` UI code than for `packages/db/src/schema/*`, where
some non-obvious modeling decisions (e.g. why `faultTypes.recidiveDeId` is a soft
reference with no DB FK, why conduct/TD-eligibility are computed on read rather than
stored) used to be documented inline and no longer are, per this rule. If you need that
rationale, it now lives only in `docs/school-engine-architecture.md` and git history —
worth checking before assuming a modeling choice is arbitrary.

## UI copy

- No text that reveals implementation (spec section numbers, enum/column names, formula
  internals like "20 minus points removed"). Say what happens in plain business language.
- Business/plain language applies to `/app` and `/portail` (the staff and
  parent/student-facing product). The institutional/marketing site (the `(marketing)`
  route group — home page, `/en-chiffres`, `/admissions` public flow, legal pages) is a
  distinct register and out of scope for this rule; it already reads as marketing copy.
- Within `/app`, favor plain, clear, functional copy over persuasive/marketing tone —
  this is a staff admin tool, not an acquisition surface. Reserve warmer, more
  reassuring phrasing for `/portail` (parents/students), where it's more appropriate
  than in dense internal CRUD screens.
- Server actions throw plain `Error`s whose `message` is already business language
  (`"Élève introuvable."`, `"Vous n'avez pas accès à cette classe."`) — that's what
  callers display via `error.message`, by convention. Never let a raw driver/network
  exception reach that path uncaught; catch it and throw/return a business-language
  message instead, the same way every existing action does.

## Accessibility

- Icon-only buttons need `aria-label`.
- Interactive elements need real keyboard paths, not just mouse/touch (e.g. a row's
  primary action must be reachable without relying on a double-click shortcut).
- Server + client validation errors surface via `Alert`, not color alone.

## Authorization

Every server action re-checks authorization itself. A role-gated layout or a hidden
button is a UX nicety, not the security boundary — the action is reachable directly
(devtools, another client, a stale URL), so it has to reject on its own. This isn't
hypothetical: `saveGrades`/`saveAttendance` in `academique.ts` shipped for a while
checking only that *a* session existed, with no role or class check, before this was
caught and fixed.

- Module-level access: `requireModuleAccess(module)` / `requireRole(allowedRoles)`
  from `@/lib/auth-guard` — `direction` is always implicitly allowed by `requireRole`.
- Class-scoped access — a `teacher` may only act on classes they're assigned to;
  `direction`/`censeur`/`surveillant_general` are unrestricted by design (see
  `class-access.ts`'s `CLASSES_ILLIMITEES`): compose with
  `requireClassAccess(role, userId, classId)` from `@/lib/class-access`.
- Portal access: `requirePortalAccess()` / `requireOwnStudent(...)` from
  `@/lib/portal-access` — a portal account only ever resolves to its own linked
  student(s), never a role-wide list.

When a new action accepts an id chosen by the client (`classId`, `studentId`, ...),
ask what stops a caller from substituting someone else's — if the answer isn't "an
explicit check in this function," add one before merging.

## Data-layer discipline

- Server actions validate `FormData`/input with a Zod schema (`safeParse`) before
  touching the DB — every existing action does this; a new one skipping it "just this
  once" is the gap to avoid, not a shortcut to take.
- Schema changes go through a generated Drizzle migration (`pnpm db:generate`,
  reviewed as a normal file diff in `packages/db/src/migrations`) — never a manual
  edit against the Neon database.
- Mutating actions that touch student/staff/financial records call `logAudit`
  (`@/lib/audit`) with actor, action, entity, and before/after — this is the
  compliance-relevant trail `docs/incident-response.md` and the retention job
  (`purgeExpiredData`) rely on existing; don't skip it for a new mutation because the
  field feels minor.

## What does NOT apply here (present in some reference docs, not in this repo)

If you're pattern-matching against a different project's CLAUDE.md or a pasted
spec, these are explicitly out of scope for `leschampions` — don't introduce them:

- oRPC/Hono, `resource.subresource.verb` procedure naming, typed RPC error classes.
- `packages/api` / `packages/utils` split. This repo's layering is `packages/db`
  (schema + queries) → `apps/web/src/lib/actions/*` (server actions, calls db directly)
  → components. There is no separate API package.
- TanStack Query, `staleTime`/prefetch patterns, client-side data cache. Server
  Components fetch on render; client mutations go through server actions and
  `router.refresh()`.
- Multi-tenant `schoolId` scoping on every query.
- i18n `en`/`fr` dynamic switching — the app is French-only.
- Cursor-based pagination — existing tables use the `DataTable` component's
  client-side pagination (`@tanstack/react-table`), which is fine at this data scale.
- A dedicated `packages/db/src/constants.ts` of named string constants for every
  DB-persisted enum value. This repo gets the same typo-safety a different way:
  `as const` arrays and Zod `z.enum(...)` schemas defined once and imported for their
  derived union type (see `CYCLES`, `TERMS`, `ATTENDANCE_STATUS_VALUES`) — don't
  introduce a parallel constants file for values already modeled that way.

## Where the domain rules live

`docs/school-engine-architecture.md` is the canonical reference for grading
(double-weighted average), passage/redoublement/exclusion rules, discipline escalation,
TD/remediation triggers, admission campaigns, and RBAC roles. Read it before changing
any of that logic — it's the source of truth now that the in-code `§`-citations have
been removed.

# HTTP method semantics and safe retries

Conventions to follow when designing, implementing or reviewing any HTTP endpoint in this project. These are requirements, not suggestions.

## The underlying problem

A lost response is indistinguishable from a lost request. When a client times out it cannot tell whether the work happened or not. This is the Two Generals' Problem, and it is provably unsolvable — no finite number of messages produces certainty over a channel that can drop things.

The consequence for design: **do not try to achieve exactly-once delivery.** Assume at-least-once delivery and make repeated processing harmless instead. Never write code whose correctness depends on a request arriving exactly once.

## Definitions to use precisely

- **Safe** — the request does not change server state. It only reads.
- **Idempotent** — sending the same request N times leaves the server in the same state as sending it once.

When judging idempotency, compare **server state**, not response bodies or status codes. A second DELETE returning 404 where the first returned 204 is still idempotent, because the resulting state is identical.

Every safe method is idempotent. The reverse does not hold: DELETE changes state and is still idempotent.

## Method contracts

| Method | Who chooses the identifier | Safe | Idempotent |
| --- | --- | --- | --- |
| GET | client (resource already exists) | yes | yes |
| PUT | client | no | yes |
| DELETE | client | no | yes |
| POST | **server** | no | **no** |
| PATCH | client | no | **depends on the body** |

- `GET` — read only. Retry freely.
- `PUT` — full replacement at a client-chosen URL. Describes a final state, so repeats overwrite with the same value.
- `DELETE` — removal at a client-chosen URL. Repeats change nothing further.
- `POST` — creates something the server names. Each call is a new piece of work, so repeats duplicate it.
- `PATCH` — partial update. See below.

## The classification test

To classify any endpoint, do not reason from the method name. Instead:

> Imagine the same request arriving three times because the client kept timing out. Describe the server state afterwards in plain words. If it matches the state after one call, the endpoint is idempotent. If it does not, retrying is unsafe.

Apply this test to every new write endpoint and state the answer in the PR description or the handler's docstring.

## PATCH: relative vs absolute changes

PATCH is not inherently idempotent or non-idempotent. The body decides.

- **Relative** (not idempotent): `{ "increment_balance": 50 }`, `{ "append_tag": "x" }`, "add one to the count". Three deliveries move the value three times.
- **Absolute** (idempotent): `{ "balance": 150 }`, `{ "status": "shipped" }`, `{ "address": "12 KG 7 Avenue" }`. Three deliveries write the same value three times.

**Prefer absolute wording wherever the domain allows it.** Expressing an operation as a final state rather than a step buys repeatability with no extra machinery. Reach for idempotency keys only when the operation genuinely cannot be expressed as a final state (charging a card, sending a message, creating a new entity).

The same reasoning explains POST: it is risky because "create a new charge" is inherently a relative instruction — do this again, rather than make it so.

## Idempotency keys

Required for **any POST that moves money, ships goods, sends a message or otherwise has an irreversible external side effect.**

Contract:

- The **client** generates the key — a UUID — once, at the moment the user expresses the intent, and reuses it for every retry of that same intent. A genuine new intent gets a new key.
- The key travels in the `Idempotency-Key` header.
- The server stores the key and, once complete, the response it produced, and returns that stored response for any later request bearing the same key.

Implementation requirements:

1. **Write the key before performing the side effect**, in the same transaction, with a uniqueness constraint on the column. Recording it afterwards leaves a window in which a retry starts a second charge.
2. **Handle in-flight duplicates.** If the key exists but no response has been stored, the first attempt is still running: return `409` and let the client back off. Never start a second attempt and never block indefinitely.
3. **Bind the key to its request.** Store a fingerprint (hash) of the body. The same key arriving with a different body is a client bug — reject it explicitly rather than silently replaying the old response.
4. **Expire keys** after roughly 24 hours.

## Client-side retry policy

- Retry freely on GET, PUT and DELETE.
- Retry POST **only** when it carries an idempotency key.
- Use a bounded number of attempts with exponential backoff and jitter. Never retry in a tight loop.
- Treat a timeout as missing information, not as failure. Do not assume the work did not happen.
- Method safety/idempotency says a retry is *safe*. The status code you actually got
  back says whether a retry is *useful*. Check both — see below.

## Status codes: retryable vs. client-must-fix-it-first

A failed request is either a transient problem on the server's side (retrying the
same bytes might succeed) or a defect in the request itself (retrying the same bytes
will fail identically, forever). Branch on which one it is before deciding to retry.

**Retryable — the request was fine, the failure was transient:**

- `500` / `502` / `503` / `504` — server-side failure. Retry with backoff, still
  subject to the method/idempotency-key rules above (never retry a bare POST here
  without a key — a 500 doesn't tell you whether the write already landed).
- `429` — rate limited. Retry with backoff; honor a `Retry-After` header if the
  response sends one instead of guessing the delay.
- A timeout, connection reset, or DNS failure — no response arrived at all, so (per
  above) the outcome is unknown, not a failure. Retry under the same rules.

**Not retryable as-is — the request itself is the problem:**

- `400` / `422` — invalid payload. Retrying the identical body reproduces the
  identical error. The caller must change the data first; what it sends next is a new
  attempt, not a retry of the old one (a new idempotency key, if one applies).
- `401` — not authenticated. Refresh credentials before trying again; retrying as-is
  fails the same way every time.
- `403` — authenticated but not authorized. Retrying never helps here — this is a
  stop, not a backoff case.
- `404` — the resource doesn't exist (or, for a scoped lookup, doesn't exist *for
  this caller* — a class/student id outside the caller's scope should read as 404,
  not 403, so it doesn't confirm the id exists at all; see the Authorization
  section). Don't retry against the same URL unchanged.
- `409` — conflict. For an idempotency-key collision this means "the first attempt is
  still running," per the section above. For a general conflict (e.g. an
  optimistic-concurrency version mismatch) it means re-fetch current state and decide
  whether to reapply — not resend the same body again.

A retry loop that doesn't branch on status first will happily hammer a `400` fifty
times with exponential backoff and jitter — which is just a slower way of doing
nothing.

## Review checklist for new write endpoints

- [ ] The three-times test has been applied and its answer written down.
- [ ] PATCH bodies use absolute wording unless the domain requires relative.
- [ ] Any irreversible POST accepts and enforces an idempotency key.
- [ ] The key is persisted before the side effect, with a uniqueness constraint.
- [ ] Concurrent duplicates return 409 rather than duplicating work.
- [ ] The client retry policy is bounded and uses backoff with jitter.
- [ ] Retry logic branches on status code (5xx/429/timeout vs. 4xx) before retrying —
      a 4xx is a signal to fix the request, not to try it again unchanged.
