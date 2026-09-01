# CollabDocs

A lightweight collaborative document editor — create, edit, upload, and share rich-text documents. Built as a scoped work-sample exercise, not a Google Docs clone.

## What's here

- **Rich text editing** — bold, italic, underline, strikethrough, headings (H1–H3), blockquotes, code blocks, bulleted and numbered lists, links, via [Quill](https://quilljs.com/). Autosaves ~600ms after you stop typing with a live sync status indicator (`Saving…` $\rightarrow$ `✓ Saved`).
- **Template Starters** — quick-start templates for *Blank Document*, *Project Roadmap*, *Team Meeting Notes*, and *Weekly Standup*.
- **Document Management** — inline title renaming, document search, category filters (*All*, *Created by me*, *Shared with me*), and one-click document duplication (*Copy*).
- **Export & Print** — export documents to **Markdown (`.md`)**, **HTML (`.html`)**, or **Print / Save as PDF** with a clean print-ready stylesheet that strips away browser chrome and formats the document cleanly on pure white paper.
- **File upload** — upload a `.txt` or `.md` file and it becomes a new, editable document. Markdown is converted to formatted HTML; other file types are rejected with a clear error, in the UI and here.
- **Sharing & Access Controls** — the owner shares a document with another user by email, with "can view" or "can edit" permission. Owned and shared documents are shown in separate, clearly labeled sections with collaborator facepile avatars.
- **Persistence** — everything is stored in a local SQLite file using Node's native `DatabaseSync` (`node:sqlite`). Refreshing the page or restarting the server preserves all documents, formatting, and permissions.
- **Profile Logins & Avatars** — support for both **One-Click Profile Selection** and **Password Authentication** (`POST /api/login`) with realistic profile photos and role badges.

## Stack

- **Backend:** Node.js, Express, `node:sqlite` (Node 22 native SQLite — zero C++ compilation dependencies), `multer` for uploads, `marked` for Markdown $\rightarrow$ HTML conversion.
- **Frontend:** React (Vite), [Quill](https://quilljs.com/) for the rich text editor, custom modern design tokens (Plus Jakarta Sans + Inter + Source Serif 4).
- **Tests:** Node's built-in test runner (`node --test`) + `supertest`, running 11 automated test cases against an isolated on-disk test database.

## Project layout

```
collabdocs/
  server/        Express API + SQLite persistence
    app.js       All routes, auth logic, and business logic
    db.js        Schema, seed data, user avatars & migrations
    index.js     Starts the HTTP server
    test/        Automated tests (11 test cases)
  client/        React frontend (Vite)
    src/
      App.jsx           Top-level state, routing, and toast notifications
      Avatar.jsx        Reusable profile picture component with fallback
      Login.jsx         Profile selector & password login tabs
      DocumentList.jsx   Templates, search/filter, facepiles, document cards
      Editor.jsx         Rich text editor, export menu, stats, autosave
      ShareModal.jsx     Team member chips, permission toggles, copy link
      api.js             Client fetch wrapper
      app.css            Modern workspace CSS & print-optimized styles
      index.css          Design tokens, typography, animations
  ARCHITECTURE.md
  AI_WORKFLOW.md
  SUBMISSION.md
```

## Run it locally

Requires Node 18+ (tested on Node 22).

### 1. Backend

```bash
cd server
npm install
npm run dev        # starts on http://localhost:4000
```

On first run this creates `server/data.sqlite` and seeds four team user accounts plus an example shared document.

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev        # starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

### Seeded Test Accounts

You can sign in with one click via **Select Profile**, or enter the email and demo password `password123` via **Password Sign-In**:

| Name | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **Amina Yusuf** | Lead Product Manager | `amina@ajaia.test` | `password123` |
| **Kofi Mensah** | Staff Software Engineer | `kofi@ajaia.test` | `password123` |
| **Lena Ortiz** | Principal Product Designer | `lena@ajaia.test` | `password123` |
| **Ravi Patel** | Engineering Director | `ravi@ajaia.test` | `password123` |

### Running Tests

```bash
cd server
npm test
```

11 automated tests cover:
- Authentication gating
- Document creation, editing, and retrieval
- Access controls (invisible to unshared users, view-only write rejection)
- Ownership enforcement (only owners can share/delete)
- Title validation
- Markdown upload & HTML conversion
- Unsupported file type rejection
- Password authentication via `/api/login`
- Document duplication via `/api/documents/:id/duplicate`

## Supported File Types for Upload

Only **`.txt`** and **`.md`** are accepted, capped at 2MB. Stated in the UI and enforced server-side.
