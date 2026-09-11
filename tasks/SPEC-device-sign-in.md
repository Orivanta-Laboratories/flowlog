# Device sign-in

## Objective and contract

Desktop CLI/GUI and browser extension start a short-lived connection request,
open the web app, and wait while the signed-in user explicitly approves the
named device. The approval URL carries only a public request identifier. A
separate random credential stays with the requesting client; its hash is stored
server-side. Learning the approval URL must never grant the device credential.

The requester polls with its credential in an Authorization header. Approval
atomically creates the device and changes the request state. Requests expire in
five minutes. Revocation stops ingestion. Polling is bounded and retryable.

## Structure and style

Server device endpoints orchestrate bounded Zod input; database operations live
in packages/db/queries/device-pairing.ts. Protected web approval uses oRPC.
Clients live in apps/extension and apps/desktop. Follow CLAUDE.md and use named
constants, generated migrations, and explicit user-scoped queries.

## Verification

Test missing/wrong poll credentials, expiry, double approval, polling before
approval, concurrent approval, and revoked devices. Run pnpm check-types,
utils tests, extension build, cargo test, and actual approval requests with a
disposable test user. Check credential files use owner-only permissions.

## Boundaries

No raw device token in the database, approval URL, UI response, shell arguments,
or logs. HTTP is allowed only on localhost in development. Do not navigate to
an arbitrary server-provided URL. Existing signed-in users still approve each
device explicitly. No claims of full OAuth protocol compliance; this is a
first-party browser approval flow informed by RFC 8628's separation of codes.
