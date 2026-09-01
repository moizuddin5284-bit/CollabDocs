# Architecture note

## What I prioritized

Given the timebox, I optimized for a **coherent, working slice** over broad
shallow coverage:

1. **Correct access control over real-time collaboration.** The brief lists
   real-time collaboration as an *optional* stretch goal, and sharing/access
   control as a *core* requirement. I spent my depth budget making sure
   ownership and sharing permissions are actually enforced server-side (not
   just hidden in the UI) and covered by tests — a document owned by one user
   returns a 403 for a user it isn't shared with, and a "view" share can't
   write. Real-time presence/co-editing was cut entirely; last-write-wins on
   save is an explicit, disclosed limitation.

2. **A real rich text editor, not a textarea.** I used Quill rather than
   hand-rolling `contenteditable` + `document.execCommand`, which is
   deprecated and inconsistent across browsers. Quill gives reliable
   bold/italic/underline/headings/lists, stores clean semantic HTML, and is
   small enough to not bloat the bundle.

3. **Boring, provable persistence.** SQLite via `better-sqlite3` (synchronous
   API, no connection pooling headaches, a single file to inspect or delete)
   was the fastest path to "documents survive a refresh and a server
   restart" without standing up Postgres or an external service, while still
   using real SQL and real foreign keys/constraints rather than a JSON blob
   on disk.

4. **Testing the thing most likely to be silently wrong.** Access control
   bugs (a user seeing a document they shouldn't) are the highest-severity,
   least-visible class of bug in a sharing feature — they don't show up
   just from clicking around happily. That's why the automated tests focus
   there, plus validation and the upload path, rather than trying to test
   UI rendering.

## Key decisions and tradeoffs

- **Mocked auth via seeded accounts, sent as an `x-user-id` header.** Real
  auth (password hashing, sessions/JWTs, email verification) is a well-solved
  problem that wouldn't showcase product judgment as much as it would eat
  the clock. The header-based approach is intentionally visible as "not real
  auth" rather than dressed up to look production-grade.

- **Autosave over an explicit Save button.** Google Docs' core interaction
  model is "you never think about saving." An explicit save button would be
  easier to build and easier to demo, but it's the wrong default for a
  document editor and would misrepresent the product's intended feel. I
  debounce saves (600ms after the last keystroke) rather than saving on
  every keystroke, to keep write volume reasonable.

- **SQLite, not Postgres/Supabase.** For this scope, a hosted Postgres
  instance adds deployment surface area (connection strings, migrations,
  another service to keep alive) without adding to what a reviewer can
  actually evaluate. SQLite is a drop-in swap to Postgres later — the schema
  uses standard SQL and normal foreign keys, not SQLite-specific features.

- **Sharing by email against a closed set of seeded users**, not open
  invite. Real products need to handle "share with someone who doesn't have
  an account yet" (invite emails, pending-share state). That's a real
  feature, but it's orthogonal to demonstrating the core access-control
  logic, so I scoped it out and said so rather than half-building it.

- **One combined `documents` list endpoint** (`GET /api/documents` returns
  `{ owned, shared }`) instead of the client fetching all documents and
  filtering client-side. Filtering ownership/access is exactly the kind of
  logic that should never trust the client — it happens once, server-side,
  and both the list endpoint and the single-document endpoint use the same
  `docAccess()` helper so there's one source of truth for "can this user see
  this document."

## What I deliberately did not build

- Real-time collaboration / multiplayer cursors (explicit stretch goal in
  the brief — cut in favor of core correctness).
- Comments or suggestion mode.
- Version history.
- Export to PDF/Markdown.
- Granular roles beyond "view" / "edit" (no "comment-only", no
  organization-level permissions).
- `.docx` import (only `.txt`/`.md`, stated clearly in the UI and README).

Each of these is real, scoped work rather than a small addition, and the
brief explicitly asks for depth in a few areas over shallow coverage
everywhere — so I picked editing + sharing + persistence as the areas to go
deep on, and left the rest as clearly labeled future work.
