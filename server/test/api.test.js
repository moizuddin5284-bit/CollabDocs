import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = path.join(__dirname, "test.sqlite");

// Use an isolated on-disk test database so we never touch dev data, and so
// better-sqlite3's synchronous API works the same as it does in production.
for (const suffix of ["", "-wal", "-shm"]) {
  const p = TEST_DB_PATH + suffix;
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
process.env.DB_PATH = TEST_DB_PATH;

const { createApp } = await import("../app.js");
const { db } = await import("../db.js");
const request = (await import("supertest")).default;

const app = createApp();

after(() => {
  try {
    db.close();
  } catch {}
  for (const suffix of ["", "-wal", "-shm"]) {
    const p = TEST_DB_PATH + suffix;
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {}
  }
});

test("rejects requests with no logged-in user", async () => {
  const res = await request(app).get("/api/documents");
  assert.equal(res.status, 401);
});

test("owner can create, edit, and read back a document", async () => {
  const create = await request(app)
    .post("/api/documents")
    .set("x-user-id", "u_amina")
    .send({ title: "Q3 Plan", content: "<p>Draft</p>" });
  assert.equal(create.status, 201);
  assert.equal(create.body.access, "owner");
  const id = create.body.id;

  const update = await request(app)
    .put(`/api/documents/${id}`)
    .set("x-user-id", "u_amina")
    .send({ content: "<p>Updated draft</p>" });
  assert.equal(update.status, 200);
  assert.equal(update.body.content, "<p>Updated draft</p>");

  const fetched = await request(app).get(`/api/documents/${id}`).set("x-user-id", "u_amina");
  assert.equal(fetched.status, 200);
  assert.equal(fetched.body.title, "Q3 Plan");
});

test("a document is not visible to a user it hasn't been shared with", async () => {
  const create = await request(app)
    .post("/api/documents")
    .set("x-user-id", "u_amina")
    .send({ title: "Private notes" });
  const id = create.body.id;

  const res = await request(app).get(`/api/documents/${id}`).set("x-user-id", "u_kofi");
  assert.equal(res.status, 403);
});

test("owner can share a document, and the recipient gains access with the right permission", async () => {
  const create = await request(app)
    .post("/api/documents")
    .set("x-user-id", "u_amina")
    .send({ title: "Roadmap" });
  const id = create.body.id;

  const share = await request(app)
    .post(`/api/documents/${id}/share`)
    .set("x-user-id", "u_amina")
    .send({ email: "kofi@ajaia.test", permission: "view" });
  assert.equal(share.status, 201);

  const asRecipient = await request(app).get(`/api/documents/${id}`).set("x-user-id", "u_kofi");
  assert.equal(asRecipient.status, 200);
  assert.equal(asRecipient.body.access, "view");

  // A view-only share cannot edit the document.
  const editAttempt = await request(app)
    .put(`/api/documents/${id}`)
    .set("x-user-id", "u_kofi")
    .send({ content: "<p>hacked</p>" });
  assert.equal(editAttempt.status, 403);
});

test("only the owner can share or delete a document", async () => {
  const create = await request(app)
    .post("/api/documents")
    .set("x-user-id", "u_amina")
    .send({ title: "Owner only" });
  const id = create.body.id;

  await request(app)
    .post(`/api/documents/${id}/share`)
    .set("x-user-id", "u_amina")
    .send({ email: "kofi@ajaia.test", permission: "edit" });

  const shareAttempt = await request(app)
    .post(`/api/documents/${id}/share`)
    .set("x-user-id", "u_kofi")
    .send({ email: "lena@ajaia.test", permission: "edit" });
  assert.equal(shareAttempt.status, 403);

  const deleteAttempt = await request(app).delete(`/api/documents/${id}`).set("x-user-id", "u_kofi");
  assert.equal(deleteAttempt.status, 403);
});

test("rejects a document with an empty title", async () => {
  const res = await request(app)
    .post("/api/documents")
    .set("x-user-id", "u_amina")
    .send({ title: "   " });
  assert.equal(res.status, 400);
});

test("uploading a .md file creates a new document with converted HTML", async () => {
  const res = await request(app)
    .post("/api/documents/upload")
    .set("x-user-id", "u_amina")
    .attach("file", Buffer.from("# Hello\n\nThis is **bold**."), "notes.md");
  assert.equal(res.status, 201);
  assert.equal(res.body.title, "notes");
  assert.match(res.body.content, /<h1/);
  assert.match(res.body.content, /<strong>/);
});

test("rejects unsupported file types on upload", async () => {
  const res = await request(app)
    .post("/api/documents/upload")
    .set("x-user-id", "u_amina")
    .attach("file", Buffer.from("binary-ish content"), "image.png");
  assert.equal(res.status, 400);
});

test("authenticates user with email and password via /api/login", async () => {
  const res = await request(app)
    .post("/api/login")
    .send({ email: "amina@ajaia.test", password: "password123" });
  assert.equal(res.status, 200);
  assert.equal(res.body.id, "u_amina");
  assert.equal(res.body.name, "Amina Yusuf");
  assert.ok(res.body.avatar);
});

test("rejects invalid password on /api/login", async () => {
  const res = await request(app)
    .post("/api/login")
    .send({ email: "amina@ajaia.test", password: "wrong_password_xyz" });
  assert.equal(res.status, 401);
});

test("duplicates an existing document with /api/documents/:id/duplicate", async () => {
  const create = await request(app)
    .post("/api/documents")
    .set("x-user-id", "u_amina")
    .send({ title: "Original Spec", content: "<p>Original Content</p>" });
  const docId = create.body.id;

  const dup = await request(app)
    .post(`/api/documents/${docId}/duplicate`)
    .set("x-user-id", "u_amina");
  assert.equal(dup.status, 201);
  assert.equal(dup.body.title, "Copy of Original Spec");
  assert.equal(dup.body.content, "<p>Original Content</p>");
  assert.equal(dup.body.access, "owner");
});
