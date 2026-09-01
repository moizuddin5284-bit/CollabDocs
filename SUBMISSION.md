# SUBMISSION.md

## What's included in this folder

- `server/` — Express + SQLite backend (source code)
- `client/` — React (Vite) frontend (source code)
- `README.md` — setup/run instructions, seeded test accounts, known limitations
- `ARCHITECTURE.md` — architecture note: what was prioritized and why
- `AI_WORKFLOW.md` — AI workflow note
- `SUBMISSION.md` — this file
- `.gitignore`

## What is working (verified)

- Create, rename, edit, and reopen documents; content persists across
  refresh and server restart (SQLite).
- Rich text formatting: bold, italic, underline, headings (H1–H3), bulleted
  and numbered lists.
- File upload: `.txt` and `.md` files become new editable documents;
  Markdown is converted to formatted HTML; other file types are rejected
  with a clear error.
- Sharing: document owner grants "view" or "edit" access to another seeded
  user by email; owned vs. shared documents are shown in separate sections;
  access is enforced server-side (a document is invisible to a user it
  hasn't been shared with; view-only access can't save edits).
- Mocked login via four seeded accounts, switchable at any time.
- 8/8 automated tests passing (`cd server && npm test`), covering auth
  gating, ownership, access control, validation, and upload behavior.
- Production client build succeeds (`cd client && npm run build`).

## What is incomplete / not built

- **Live deployment URL.** This exercise was completed inside a sandboxed
  build environment without the ability to create external accounts or
  deploy to a public host. The code is deploy-ready (see "Next step:
  deployment" below), but no live URL is included in this submission.
- **Walkthrough video.** For the same reason, no video was recorded. A
  suggested script/outline is below.
- **Google Drive folder.** This submission is a local folder; it hasn't
  been uploaded to Drive.
- Real-time collaboration, comments, version history, PDF/Markdown export,
  and `.docx` import were out of scope by design — see `ARCHITECTURE.md`.

## Next step: deployment

The fastest path with no paid dependency:

1. **Backend** → deploy `server/` to [Render](https://render.com) (free web
   service tier) or [Railway](https://railway.app): `npm install && npm start`,
   expose port via `PORT` env var (already read from `process.env.PORT`).
   SQLite's `data.sqlite` file will live on the instance's disk — fine for a
   review deployment; note that most free tiers reset the filesystem on
   redeploy, which is worth calling out to reviewers.
2. **Frontend** → deploy `client/` to [Vercel](https://vercel.com) or
   [Netlify](https://netlify.com): `npm run build`, publish `dist/`. Set the
   `VITE_API_URL` env var to the deployed backend's URL.
3. Update this file and the README with the live URL once deployed.

## Next step: walkthrough video (suggested outline, ~4 min)

1. (30s) What this is: a scoped Google Docs-inspired editor — creation,
   editing, upload, sharing, persistence.
2. (60s) Main flow: log in as Amina → create a document → format some text
   → rename it → refresh the page to show it persisted.
3. (45s) Upload: drop in a `.md` file, show it becomes a formatted document.
4. (60s) Sharing: share the new document with Kofi (view access) → switch
   accounts → show it under "Shared with you" → attempt to edit → show it's
   blocked, then go back to Amina and upgrade Kofi to edit access.
5. (30s) What was deprioritized and why (real-time collab, `.docx` import,
   version history) — point to `ARCHITECTURE.md`.
6. (30s) How AI was used — point to `AI_WORKFLOW.md`.

## With another 2–4 hours

See "With another 2–4 hours, I'd build next" in `README.md`.
