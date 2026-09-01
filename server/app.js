import express from "express";
import cors from "cors";
import multer from "multer";
import { nanoid } from "nanoid";
import { marked } from "marked";
import { db } from "./db.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB is plenty for text/markdown
});

const ALLOWED_UPLOAD_EXTENSIONS = [".txt", ".md"];

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  // --- Mocked auth -----------------------------------------------------
  // There is no password flow. A reviewer "logs in" by picking one of the
  // seeded users, and the client sends that user's id on every request via
  // the x-user-id header. This is enough to demonstrate ownership and
  // sharing logic without building real auth for a timeboxed exercise.
  function currentUser(req, res, next) {
    const userId = req.header("x-user-id");
    if (!userId) {
      return res.status(401).json({ error: "Missing x-user-id header. Log in first." });
    }
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user) {
      return res.status(401).json({ error: "Unknown user." });
    }
    req.user = user;
    next();
  }

  function docAccess(doc, userId) {
    if (!doc) return null;
    if (doc.owner_id === userId) return "owner";
    const share = db
      .prepare("SELECT permission FROM shares WHERE document_id = ? AND user_id = ?")
      .get(doc.id, userId);
    return share ? share.permission : null;
  }

  function serializeDoc(doc, access) {
    const owner = db.prepare("SELECT id, name, email, color, avatar, role FROM users WHERE id = ?").get(doc.owner_id);
    const shares = db
      .prepare(
        `SELECT users.id, users.name, users.email, users.color, users.avatar, users.role, shares.permission
         FROM shares JOIN users ON users.id = shares.user_id
         WHERE shares.document_id = ?`
      )
      .all(doc.id);
    return {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      owner,
      shares,
      access,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    };
  }

  // --- Auth & Users ------------------------------------------------------
  app.post("/api/login", (req, res) => {
    const { email, password, userId } = req.body || {};
    let user;
    if (userId) {
      user = db.prepare("SELECT id, name, email, color, avatar, role FROM users WHERE id = ?").get(userId);
    } else if (email) {
      const userWithPwd = db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email.trim());
      if (!userWithPwd) {
        return res.status(401).json({ error: "No account found with this email. Try a seeded demo account." });
      }
      if (password && userWithPwd.password && password !== userWithPwd.password && password !== "password123") {
        return res.status(401).json({ error: "Incorrect password. Default demo password is password123." });
      }
      user = {
        id: userWithPwd.id,
        name: userWithPwd.name,
        email: userWithPwd.email,
        color: userWithPwd.color,
        avatar: userWithPwd.avatar,
        role: userWithPwd.role,
      };
    } else {
      return res.status(400).json({ error: "Email or userId is required." });
    }

    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    res.json(user);
  });

  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, name, email, color, avatar, role FROM users ORDER BY name").all();
    res.json(users);
  });

  app.get("/api/me", currentUser, (req, res) => {
    const me = db.prepare("SELECT id, name, email, color, avatar, role FROM users WHERE id = ?").get(req.user.id);
    res.json(me);
  });

  // --- Documents -----------------------------------------------------
  app.get("/api/documents", currentUser, (req, res) => {
    const owned = db
      .prepare("SELECT * FROM documents WHERE owner_id = ? ORDER BY updated_at DESC")
      .all(req.user.id);
    const shared = db
      .prepare(
        `SELECT documents.* FROM documents
         JOIN shares ON shares.document_id = documents.id
         WHERE shares.user_id = ? ORDER BY documents.updated_at DESC`
      )
      .all(req.user.id);

    res.json({
      owned: owned.map((d) => serializeDoc(d, "owner")),
      shared: shared.map((d) => serializeDoc(d, docAccess(d, req.user.id))),
    });
  });

  app.post("/api/documents", currentUser, (req, res) => {
    const title = (req.body.title || "").trim();
    if (!title) {
      return res.status(400).json({ error: "Title is required." });
    }
    if (title.length > 200) {
      return res.status(400).json({ error: "Title must be 200 characters or fewer." });
    }
    const now = new Date().toISOString();
    const id = `doc_${nanoid(10)}`;
    db.prepare(
      `INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, title, req.body.content || "", req.user.id, now, now);
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(id);
    res.status(201).json(serializeDoc(doc, "owner"));
  });

  app.get("/api/documents/:id", currentUser, (req, res) => {
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found." });
    const access = docAccess(doc, req.user.id);
    if (!access) return res.status(403).json({ error: "You don't have access to this document." });
    res.json(serializeDoc(doc, access));
  });

  app.post("/api/documents/:id/duplicate", currentUser, (req, res) => {
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found." });
    const access = docAccess(doc, req.user.id);
    if (!access) return res.status(403).json({ error: "You don't have access to this document." });

    const now = new Date().toISOString();
    const newId = `doc_${nanoid(10)}`;
    const newTitle = `Copy of ${doc.title}`.slice(0, 200);

    db.prepare(
      `INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(newId, newTitle, doc.content, req.user.id, now, now);

    const created = db.prepare("SELECT * FROM documents WHERE id = ?").get(newId);
    res.status(201).json(serializeDoc(created, "owner"));
  });

  app.put("/api/documents/:id", currentUser, (req, res) => {
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found." });
    const access = docAccess(doc, req.user.id);
    if (!access) return res.status(403).json({ error: "You don't have access to this document." });
    if (access === "view") {
      return res.status(403).json({ error: "You only have view access to this document." });
    }

    const title = req.body.title !== undefined ? req.body.title.trim() : doc.title;
    if (!title) {
      return res.status(400).json({ error: "Title is required." });
    }
    if (title.length > 200) {
      return res.status(400).json({ error: "Title must be 200 characters or fewer." });
    }
    const content = req.body.content !== undefined ? req.body.content : doc.content;
    const now = new Date().toISOString();

    db.prepare("UPDATE documents SET title = ?, content = ?, updated_at = ? WHERE id = ?").run(
      title,
      content,
      now,
      doc.id
    );
    const updated = db.prepare("SELECT * FROM documents WHERE id = ?").get(doc.id);
    res.json(serializeDoc(updated, access));
  });

  app.delete("/api/documents/:id", currentUser, (req, res) => {
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found." });
    if (doc.owner_id !== req.user.id) {
      return res.status(403).json({ error: "Only the owner can delete this document." });
    }
    db.prepare("DELETE FROM documents WHERE id = ?").run(doc.id);
    res.status(204).end();
  });

  // --- Sharing -------------------------------------------------------
  app.post("/api/documents/:id/share", currentUser, (req, res) => {
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found." });
    if (doc.owner_id !== req.user.id) {
      return res.status(403).json({ error: "Only the owner can share this document." });
    }

    const { email, permission = "edit" } = req.body;
    if (!email) return res.status(400).json({ error: "Recipient email is required." });
    if (!["view", "edit"].includes(permission)) {
      return res.status(400).json({ error: "Permission must be 'view' or 'edit'." });
    }
    const target = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
    if (!target) {
      return res.status(404).json({ error: "No user found with that email. Try a seeded test account." });
    }
    if (target.id === doc.owner_id) {
      return res.status(400).json({ error: "The owner already has full access." });
    }

    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO shares (document_id, user_id, permission, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(document_id, user_id) DO UPDATE SET permission = excluded.permission`
    ).run(doc.id, target.id, permission, now);

    const updated = db.prepare("SELECT * FROM documents WHERE id = ?").get(doc.id);
    res.status(201).json(serializeDoc(updated, "owner"));
  });

  app.delete("/api/documents/:id/share/:userId", currentUser, (req, res) => {
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found." });
    if (doc.owner_id !== req.user.id) {
      return res.status(403).json({ error: "Only the owner can change sharing." });
    }
    db.prepare("DELETE FROM shares WHERE document_id = ? AND user_id = ?").run(
      doc.id,
      req.params.userId
    );
    const updated = db.prepare("SELECT * FROM documents WHERE id = ?").get(doc.id);
    res.json(serializeDoc(updated, "owner"));
  });

  // --- File upload -> new document ------------------------------------
  app.post("/api/documents/upload", currentUser, upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const originalName = req.file.originalname || "Untitled";
    const ext = originalName.slice(originalName.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        error: `Unsupported file type "${ext}". Only .txt and .md files are supported.`,
      });
    }

    const text = req.file.buffer.toString("utf-8");
    const title = originalName.replace(/\.[^/.]+$/, "").slice(0, 200) || "Untitled import";
    const html = ext === ".md" ? marked.parse(text) : `<p>${escapeHtml(text).split(/\n{2,}/).join("</p><p>")}</p>`;

    const now = new Date().toISOString();
    const id = `doc_${nanoid(10)}`;
    db.prepare(
      `INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, title, html, req.user.id, now, now);

    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(id);
    res.status(201).json(serializeDoc(doc, "owner"));
  });

  app.use((err, req, res, next) => {
    if (err && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File is too large. Max size is 2MB." });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong on the server." });
  });

  return app;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default createApp;
