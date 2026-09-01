# AI workflow note

**A note on how this note is different:** this project wasn't a human using
AI as a coding assistant — it was built directly by Claude (an AI assistant,
Anthropic), end to end, in a single agentic session, in response to the
assignment prompt. If you're submitting this as your own work sample, you
should rewrite this note honestly to describe your own process — reusing
this text as-is would misrepresent how the project was built. What follows
is an accurate description of *this* build process, which you can use as a
reference for what to disclose.

## Which AI tools were used

Claude (via its agentic coding environment: bash, file read/write, and a
sandboxed Node.js runtime) wrote all code, ran the test suite, started both
servers, and hit the live API with `curl` to verify behavior — rather than
just generating code that looked plausible.

## Where AI materially sped things up

- **Boilerplate and repetitive CRUD.** The Express routes, SQL statements,
  and React components follow a repetitive shape (auth check → ownership
  check → validate → mutate → respond). Generating that scaffolding quickly
  freed time for the parts that needed actual judgment: what the sharing
  permission model should be, and what to cut.
- **Test-writing.** Writing eight focused tests (auth gating, ownership,
  share permissions, validation, upload) took a few minutes rather than
  being skipped under time pressure, which is usually the first casualty of
  a timeboxed exercise.
- **CSS/design tokens.** Producing a cohesive, non-templated visual system
  (serif document type, warm paper background, a single accent color) in
  one pass, rather than iterating through several default Tailwind-card
  layouts.

## What AI-generated output was changed or rejected

- The first pass of the document-list endpoint returned a flat array with
  an `isOwner` boolean per document, which pushed the "owned vs. shared"
  grouping logic into the frontend. That's exactly the kind of access logic
  that should live server-side and have one source of truth, so it was
  restructured into `{ owned, shared }` with a shared `docAccess()` helper
  used by both the list and single-document routes.
- Puppeteer was pulled in to take a screenshot for a quick visual sanity
  check, but the sandbox's network policy blocks the Chromium download —
  rather than working around the network restriction, that dependency was
  removed and verification relied on build output, automated tests, and
  direct API calls instead.
- The original upload handler treated any non-`.md` file as plain text
  without validating the extension, which would have silently mangled a
  binary file (e.g. an accidental `.png` upload) into garbage HTML. It was
  changed to explicitly allow-list `.txt`/`.md` and reject anything else
  with a 400, with that limitation stated in the UI and README rather than
  discovered by a reviewer.

## How correctness, UX quality, and implementation reliability were verified

- **Automated tests**: `npm test` (Node's built-in test runner + supertest)
  — 8/8 passing, covering auth, ownership, sharing permissions, validation,
  and upload behavior against an isolated on-disk SQLite test database.
- **Manual API verification**: the dev server was started and exercised
  directly with `curl` (user list, document creation, response shape) to
  confirm the running server — not just the code — behaves as expected.
- **Production build**: `npm run build` on the client was run to catch
  bundling/import errors that only show up outside the dev server.
- **Code review pass**: each component was re-read after writing to check
  that IDs, prop names, and endpoint contracts actually line up end to end
  (e.g. that the share list's user id matches what the unshare endpoint
  expects) — the kind of mismatch that compiles fine but breaks silently at
  runtime.
- **Explicit scope disclosure** in place of unverified claims: rather than
  asserting real-time collaboration or `.docx` import "works," both are
  listed as not built, in the README and here, so a reviewer's expectations
  match what was actually tested.
