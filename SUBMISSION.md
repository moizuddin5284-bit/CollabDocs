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
  deployment" below), but no live URL is included in this submission. Only i am providing the frontend deployment link     collab-docs-git-main-moizuddin5284-bit.vercel.app. 
- **Walkthrough video.** Video is uploaded in drive.
- Real-time collaboration, comments, version history, PDF/Markdown export,
  and `.docx` import were out of scope by design — see `ARCHITECTURE.md`.

## Next step: deployment

The fastest path with no paid dependency:

1. **Backend** → not deployed
2. **Frontend** → deploy `client/` to [Vercel](https://vercel.com) and url is collab-docs-git-main-moizuddin5284-bit.vercel.app



