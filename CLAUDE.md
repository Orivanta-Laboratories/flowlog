# CLAUDE.md

Guidance for AI assistants working in the `flowlog` repository.

Flowlog is a zero-input, git-aware time tracking product: a background desktop
agent (Rust/Tauri), a browser extension, and a web app turn the apps, windows,
and git branches someone works in into a suggested timesheet they confirm
rather than compose from scratch. Every organization is a team of people who
share visibility into each other's tracked time under one owner.

This file describes how this repo is actually built, not a generic stack. If
you're pattern-matching from a different project's CLAUDE.md, don't — read
this one.

---

## 0. Tech stack

| Layer | Choice |
| --- | --- |
| Monorepo | Turborepo + pnpm workspaces |
| Web app | Next.js 16 (App Router), React 19, Tailwind v4 |
| API layer | Hono + oRPC (`packages/api`) |
| Data fetching / cache | TanStack Query |
| ORM | Drizzle ORM, `neon-http` driver |
| Database | PostgreSQL (Neon) |
| Auth | better-auth (email/password + `organization` plugin) |
| UI kit | `packages/ui` — Base UI primitives (`@base-ui/react`), shadcn-style wrappers |
| Icons | `lucide-react` |
| Transactional email | Resend (`packages/auth/src/email.ts`), console fallback when `RESEND_API_KEY` is unset |
| Lint/format | Biome — **tabs**, double quotes, `organizeImports: on` |
| Tests | Node's built-in test runner via `tsx --test` (see `packages/utils`) |
| Desktop agent | Rust, headless CLI (`apps/desktop`) + Tauri GUI (`apps/desktop/gui`) |
| Browser extension | Manifest V3, plain TS + esbuild (`apps/extension`) |

Don't add a new dependency for something the stack above already solves.
When something genuinely isn't covered (there was no email-sending library
before the organization feature needed one), add it deliberately and say why
in the PR/response — don't reach for it silently.

There is **no i18n** — the product is English-only, no `en`/`fr` split, no
translation keys. There is **no `hugeicons`** anywhere in this repo —
`lucide-react` is the icon library, used throughout `packages/ui` and every
app. Don't introduce either based on a different project's conventions.

---

## 1. Layered separation of concerns

Every feature is split across three packages. A router never talks to
Drizzle directly; a query helper never contains business/authorization rules.

- **`packages/db`** — Drizzle schema (`src/schema/*.ts`) and query functions
  (`src/queries/*.ts`). Query functions take primitive scoping args (a
  `userId`, an `organizationId`) and return rows. No oRPC, no HTTP concerns.
- **`packages/api`** — oRPC routers (`src/routers/*.ts`) built on
  `protectedProcedure`/`publicProcedure` (`src/index.ts`). Validates input
  with Zod, calls `packages/db` query functions and `packages/utils` helpers,
  maps typed errors to `ORPCError`s via `to-orpc-error.ts`.
- **`packages/utils`** — pure business logic with no DB/HTTP dependency:
  labeling rules, redaction, segmentation, time formatting, typed error
  classes (`src/errors`).
- **`packages/auth`** — better-auth server config: schema-aware adapter,
  the `organization` plugin, `databaseHooks` for the signup→organization flow,
  invitation email sending. This is the one place allowed to call
  `packages/db` query functions directly for its lifecycle hooks (signup,
  session creation) since those aren't oRPC procedures.
- **Apps** (`apps/web`, `apps/server`) — Next.js pages/components and the
  Hono entrypoint that mounts the oRPC router and better-auth handler. Apps
  never import Drizzle directly.

```ts
// packages/db/src/queries/organization.ts
export async function listMembersWithTrackedSeconds(organizationId: string, from: Date, to: Date) { ... }

// packages/api/src/routers/organization.ts
const listMembersTrackedTime = protectedProcedure
  .input(rangeSchema)
  .handler(async ({ input, context }) => {
    const membership = await requireOwnerMembership(context.session.user.id);
    return listMembersWithTrackedSeconds(membership.organizationId, from, to);
  });
```

---

## 2. Organizations, roles, and scoping

Every user belongs to **exactly one organization**, always. There is no
multi-org membership and no org switcher — if someone needs to be part of a
second organization, that's a second account. This is enforced at three
layers, not just one:

1. **Database**: `member.userId` has a **unique index on its own** (not
   `(organizationId, userId)`) — a second membership row for the same user
   is a constraint violation, full stop. See `packages/db/src/schema/auth.ts`.
2. **Signup**: `databaseHooks.user.create.after` in `packages/auth/src/index.ts`
   creates a brand-new organization and makes the signing-up user its owner,
   *unless* there's a pending invitation matching their email — in which case
   they join that organization instead and never get one of their own.
3. **Invitation acceptance**: `organizationHooks.beforeAcceptInvitation`
   rejects the accept if the accepting user already has a membership row,
   independent of whether the UI ever exposes an "accept" action.

Two roles only: `owner` and `member` (`ORG_ROLE` in
`packages/db/src/constants.ts`). The creator of an organization is always
`owner`; invitations can only ever be sent for `member`
(`organizationHooks.beforeCreateInvitation` rejects anything else). Don't
introduce `admin` or any other role — better-auth's organization plugin
ships one by default, this product doesn't use it.

Owners can see every member's tracked time and an organization-wide heatmap;
members see only their own tracked time. That split is enforced **server
side** in `packages/api/src/routers/organization.ts`
(`requireOwnerMembership`), never inferred from what the UI shows —
see §6.

Membership/invitation CRUD (list members, invite, cancel, list invitations)
goes through better-auth's own `organization` plugin endpoints via
`authClient.organization.*` on the client — don't reimplement those as oRPC
procedures. Only add a custom `packages/api` procedure for something
better-auth's plugin doesn't know about (tracked time, the heatmap — both
query `activity_session`, which the plugin has no concept of).

**Tricky scenario:** A new procedure needs "all members of the caller's org."

- ❌ **Bad:** Take an `organizationId` from the request input and trust it.
- ✅ **Good:** Look up the caller's own membership row
  (`findMemberByUserId(context.session.user.id)`) and use
  `membership.organizationId` — never a client-supplied org id. A user
  belongs to exactly one org, so there is never a legitimate reason for the
  client to name which one.

---

## 3. oRPC procedures & routing

RPC paths are nested lowercase keys; the verb is the leaf, never fused onto
the resource (`organization.member.trackedtime`, not
`organization.getMemberTrackedTime`). The TypeScript export can stay
camelCase (`listMembersTrackedTime`) — only the router *keys* that compose
the path are lowercase. See `packages/api/src/routers/index.ts` and any
existing router for the pattern.

Every procedure:

- Validates input with Zod (`z.object({...})`), even for "obviously fine"
  internal calls.
- Uses `protectedProcedure` unless it's genuinely public
  (`healthCheck`, device pairing).
- Throws typed error classes from `packages/utils/src/errors` — never a bare
  `throw new Error(string)` — and lets `throwAsOrpcError` in the router map
  them to an `ORPCError` with the right HTTP status. Add new codes to
  `to-orpc-error.ts`'s `NOT_FOUND_CODES`/`CONFLICT_CODES`/`BAD_REQUEST_CODES`/
  `FORBIDDEN_CODES` sets rather than hand-constructing `ORPCError` at the call
  site.
- Scopes every query server-side from `context.session.user.id` (or the
  derived membership/org id) — never from client input, per §2.

Status code choice follows real HTTP semantics: a resource that doesn't
exist **for this caller** (wrong org, wrong owner) is `404`, not `403` —
don't confirm something exists to a caller who isn't allowed to see it. A
caller who is authenticated but lacks the role for an existing resource
(member hitting an owner-only procedure) is `403`. See
`OrganizationNotFoundError` (404) vs `OrganizationOwnerOnlyError` (403) for
the concrete split.

---

## 4. Database (Drizzle + Postgres)

- Schema lives in `packages/db/src/schema/*.ts`, one file per domain
  (`auth.ts` — user/session/org/member/invitation; `tracking.ts` —
  project/device/rawEvent/activitySession/confirmation).
- Every stored string (role, status, event source, platform...) is a named
  constant in `packages/db/src/constants.ts`
  (`{ CONST_OBJECT, CONST_VALUES, TypeAlias }` triplet), and the matching
  `pgEnum` is built from `*_VALUES`. Never a raw string literal at a call
  site or inline in a `pgEnum(...)` call.
- Soft deletes: `archivedAt`/`revokedAt` columns, filtered with
  `isNull(table.archivedAt)` — see `project`, `matchingRule`,
  `activitySession`, `device`. No hard deletes of tracking data.
- Cursor-based pagination for list endpoints
  (`where(cursor ? gt(table.startedAt, cursor) : undefined)`), not
  offset/limit — see `listActivitySessionsInRange`.
- Push aggregation into Postgres (Drizzle's `sql` helper for `sum`,
  `date_trunc`, `groupBy`) instead of fetching rows and reducing in JS — see
  `listMembersWithTrackedSeconds` / `dailyTrackedSecondsForOrganization` for
  the pattern used by the organization heatmap.
- Prefer a new column on an existing table over a new table when the data is
  a 1:1 scalar fact; reach for a new table when the relationship is genuinely
  1:many or many:many (the `member`/`invitation` tables, not a
  `role` column with an array).

**Migrations**: schema changes go through `pnpm db:generate` (Drizzle
migration files under `packages/db/src/migrations`), reviewed as a normal
diff, then `pnpm db:migrate` to apply. Never hand-edit the database. The
first migration (`0000_wet_leo.sql`) captures the full schema as of the
organization feature landing — before that, the project used `db:push`
without tracked migrations; going forward, every change is a migration.

---

## 5. Auth & the `organization` plugin

`packages/auth/src/index.ts` is the only file that configures better-auth.
Notable non-obvious pieces:

- `allowUserToCreateOrganization: false` — organizations are never created
  through the plugin's own endpoint; only through the signup hook (§2).
- `databaseHooks.session.create.before` sets `activeOrganizationId` on every
  new session by looking up the user's membership — this runs on *every*
  session (sign in, not just sign up), so `authClient.useActiveOrganization()`
  always resolves correctly without the client ever calling
  `setActiveOrganization`.
- `sendInvitationEmail` builds the accept link as
  `${CORS_ORIGIN}/login?invite=...&email=...&org=...` and calls
  `packages/auth/src/email.ts`. That file no-ops to a `console.log` of the
  link when `RESEND_API_KEY` isn't set — this is the dev/local fallback,
  intentional, not a bug.

When adding a new better-auth plugin or hook, read the installed package's
`.d.mts` files under `node_modules/.pnpm/better-auth@*/node_modules/better-auth/`
before writing config against it — the docs site can drift from the pinned
version. Verify with `tsc --noEmit`, and if a real Postgres connection is
available (`DATABASE_URL` in `apps/server/.env`), actually run
`pnpm --filter server dev` and hit `/api/auth/get-session` — a plugin
misconfiguration usually surfaces as a 500 there, not a type error.

---

## 6. Authorization

Every procedure/action that differs by role checks that role **server side**,
never by trusting what the UI hid. `apps/web/src/components/user-menu.tsx`
hiding a link for non-owners is a UX nicety; `requireOwnerMembership` in the
organization router is the actual boundary. When you add a new
owner-only or member-only view, ask: what stops someone from hitting the
underlying procedure directly (devtools, curl, another client)? If the
answer isn't "an explicit check in the handler," add one.

---

## 7. Frontend architecture

- Next.js App Router with **route groups by audience**:
  `apps/web/src/app/(marketing)` (public landing page, its own
  `MarketingHeader`/`MarketingFooter`, indexed), `apps/web/src/app/(app)`
  (authenticated app shell, `AppHeader`, `robots: noindex` since it's a
  private surface), and `apps/web/src/app/login` (minimal, its own tiny
  layout). Don't reuse the app shell's header on marketing pages or vice
  versa — they're deliberately different audiences with different nav.
- RSC by default. A component gets `"use client"` only when it needs
  interactivity or a browser-only hook (`authClient.useSession()`,
  `useTheme()`) — and even then, keep the client boundary as small as
  possible (`MarketingCta`, `ModeToggle` are their own tiny client islands,
  not the whole page).
- Any component reading `authClient.useSession()` (or
  `useActiveOrganization()`) needs a `mounted` guard
  (`useState` + `useEffect(() => setMounted(true), [])`) before branching
  render on the session, or you'll get a hydration mismatch — better-auth's
  client can resolve synchronously on the client before the server-rendered
  "pending" output has a chance to hydrate. See `MarketingCta`,
  `MarketingHeader`, `UserMenu` for the pattern.
- `Button`'s `render` prop swaps in `next/link`'s `Link` (which renders an
  `<a>`) for navigation-flavored buttons. Base UI's `Button` expects a real
  `<button>` by default — pass `nativeButton={false}` whenever `render` isn't
  a native button, or you'll get a console warning on every render. Never
  nest a `<Button>` inside a `<Link>` either (invalid HTML, two nested
  interactive elements) — use `render`, not children-wrapping.
- `packages/ui`'s `Card`/`Badge` default to `text-xs` and `rounded-none` —
  correct for dense app UI (dashboard widgets, tables), wrong for marketing
  content. Override per usage (`className="rounded-2xl text-sm"`) rather
  than changing the shared component, which would ripple into the app shell.
- Theme toggle (`ModeToggle`) is a direct one-click flip between light/dark
  via `resolvedTheme`, not a three-way Light/Dark/System dropdown — that's a
  deliberate simplification, don't reintroduce the dropdown.

---

## 8. UI copy

Flowlog is a small, honest product — copy should read like a person wrote
it, not generated marketing boilerplate:

- Use contractions (`don't`, `you're`, `there's`) — avoiding them to dodge a
  style rule about hyphens produces stiff, AI-sounding copy. That's a real
  mistake this codebase made once; don't repeat it.
- No round, unverifiable numbers or vague feature-speak ("streamline",
  "seamless", "Ready to...?"). Say the specific, checkable thing
  ("Linux today, with more platforms on the way", not "cross-platform").
- Never claim something the code doesn't do. The desktop agent is Linux-only
  today (GNOME/X11 window detection) — don't write copy claiming macOS/Windows
  support because it sounds better.
- Never surface a raw error message, stack trace, or DB constraint name to
  the UI. Typed errors from `packages/utils/src/errors` carry a `message`
  that's already safe to show — that's what components display.

---

## 9. Testing

`packages/utils` has the precedent: colocated `*.test.ts` files, run via
`tsx --test` (`pnpm --filter @flowlog/utils test`). New pure business logic
(labeling rules, redaction, segmentation, time math, the organization
role/scoping helpers) gets the same treatment. Procedures that branch on
role or org membership are exactly the thing most worth testing — an
untested owner-only check is a real access-control bug waiting to happen,
not a hypothetical one.

---

## 10. Logging

The server logs structured request events (`flowlog-server` logger, request
id, resolved auth state) — see the `apps/server` dev output for the shape.
Don't log raw window titles, app names, or full activity session payloads at
info level; they're the closest thing this product has to PII (what someone
was looking at). Log identifiers and counts, not content.

---

## 11. Before committing

- [ ] `pnpm check-types` (or the specific package's `tsc --noEmit`) passes.
- [ ] `pnpm check` (Biome) run on touched files — tabs, double quotes,
      organized imports.
- [ ] Every DB-stored string is a named constant from `packages/db/src/constants.ts`.
- [ ] Every procedure validates input with Zod and scopes queries from
      `context.session`, never client-supplied ids, per §2/§3.
- [ ] Role-gated views have the check in the handler, not just hidden UI (§6).
- [ ] New client components with `useSession()`/`useActiveOrganization()`
      have a `mounted` guard (§7).
- [ ] `Button render={<Link .../>}` usages pass `nativeButton={false}` (§7).
- [ ] No inline comments — names carry the meaning; anything that needs
      explaining goes in the PR description, not the file.
- [ ] Schema changes are a generated Drizzle migration, not a manual edit (§4).
- [ ] UI copy read back out loud — does it sound like a person, or a
      template? (§8)
