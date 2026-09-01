import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data.sqlite");

export const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    avatar TEXT,
    password TEXT NOT NULL DEFAULT 'password123',
    role TEXT NOT NULL DEFAULT 'Team Member'
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS shares (
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL DEFAULT 'edit' CHECK (permission IN ('view', 'edit')),
    created_at TEXT NOT NULL,
    PRIMARY KEY (document_id, user_id)
  );
`);

// Graceful schema migration for existing sqlite files
try {
  db.exec("ALTER TABLE users ADD COLUMN avatar TEXT;");
} catch {}
try {
  db.exec("ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'password123';");
} catch {}
try {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'Team Member';");
} catch {}

// Seed realistic team users with high-quality profile avatars and roles
const seedUsers = [
  {
    id: "u_amina",
    name: "Amina Yusuf",
    email: "amina@ajaia.test",
    color: "#D97757",
    role: "Lead Product Manager",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "u_kofi",
    name: "Kofi Mensah",
    email: "kofi@ajaia.test",
    color: "#3E5C76",
    role: "Staff Software Engineer",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "u_lena",
    name: "Lena Ortiz",
    email: "lena@ajaia.test",
    color: "#6B8F71",
    role: "Principal Product Designer",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "u_ravi",
    name: "Ravi Patel",
    email: "ravi@ajaia.test",
    color: "#9C6644",
    role: "Engineering Director",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80",
  },
];

const upsertUser = db.prepare(`
  INSERT INTO users (id, name, email, color, avatar, password, role)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    email = excluded.email,
    color = excluded.color,
    avatar = excluded.avatar,
    password = excluded.password,
    role = excluded.role
`);

for (const u of seedUsers) {
  upsertUser.run(u.id, u.name, u.email, u.color, u.avatar, u.password, u.role);
}

// Seed initial document if empty
const existingDocs = db.prepare("SELECT COUNT(*) AS n FROM documents").get();
if (existingDocs && Number(existingDocs.n) === 0) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    "doc_welcome",
    "Welcome to CollabDocs",
    "<h1>Welcome to CollabDocs</h1><p>This is a sample document owned by <strong>Amina Yusuf</strong> and shared with <strong>Kofi Mensah</strong>.</p><p>Try:</p><ul><li>Editing this text</li><li>Renaming the document</li><li>Uploading a .txt or .md file to create a new document</li><li>Sharing a document with another seeded user</li><li>Exporting to PDF or Markdown</li></ul>",
    "u_amina",
    now,
    now
  );
  db.prepare(
    `INSERT INTO shares (document_id, user_id, permission, created_at) VALUES (?, ?, ?, ?)`
  ).run("doc_welcome", "u_kofi", "edit", now);
}

export default db;
