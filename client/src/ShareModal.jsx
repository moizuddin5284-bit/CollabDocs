import { useEffect, useState } from "react";
import { api } from "./api";
import Avatar from "./Avatar";

export default function ShareModal({ doc, onClose, onShared, notify }) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("edit");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    api
      .listUsers()
      .then((users) => {
        // Exclude document owner from suggestions
        setAllUsers(users.filter((u) => u.id !== doc.owner.id));
      })
      .catch(() => {});
  }, [doc.owner.id]);

  async function handleShare(e) {
    e?.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError("");
    try {
      const updated = await api.shareDocument(doc.id, email.trim(), permission);
      onShared(updated);
      notify?.(`Shared "${doc.title}" with ${email.trim()}`, "success");
      setEmail("");
    } catch (err) {
      setError(err.message);
      notify?.(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(userId, userName) {
    setBusy(true);
    try {
      const updated = await api.unshareDocument(doc.id, userId);
      onShared(updated);
      notify?.(`Removed access for ${userName}`, "info");
    } catch (err) {
      setError(err.message);
      notify?.(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    notify?.("Document link copied to clipboard!", "success");
    setTimeout(() => setLinkCopied(false), 2500);
  }

  // Already shared user IDs
  const sharedUserIds = new Set(doc.shares.map((s) => s.id));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Share document">
        <div className="modal-header">
          <div>
            <h2>Share Document</h2>
            <p className="modal-subtitle">&ldquo;{doc.title}&rdquo;</p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Quick Team Member Chips */}
        {allUsers.length > 0 && (
          <div className="suggested-users-wrap">
            <p className="suggested-users-label">Quick select teammate</p>
            <div className="suggested-chips-list">
              {allUsers.map((u) => {
                const isAlreadyShared = sharedUserIds.has(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    className="suggested-chip"
                    onClick={() => {
                      setEmail(u.email);
                    }}
                    title={isAlreadyShared ? "Already shared (click to update)" : "Click to select"}
                  >
                    <Avatar user={u} size="xs" />
                    <span>{u.name}</span>
                    {isAlreadyShared ? (
                      <span style={{ fontSize: "10px", color: "var(--ink-muted)" }}>✓</span>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--primary)" }}>+</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Share Form */}
        <form className="share-form" onSubmit={handleShare}>
          <label className="field-label" htmlFor="share-email">
            Add team member by email
          </label>
          <div className="share-input-group">
            <input
              id="share-email"
              className="share-input"
              type="email"
              placeholder="e.g. kofi@ajaia.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <select
              className="share-select"
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
            >
              <option value="edit">Can edit</option>
              <option value="view">Can view</option>
            </select>
            <button className="btn-primary" type="submit" disabled={busy || !email.trim()}>
              {busy ? "Sharing…" : "Share"}
            </button>
          </div>
          {error && <p className="form-error" style={{ marginTop: "8px" }}>{error}</p>}
        </form>

        {/* Active Collaborators List */}
        <div className="share-list-section">
          <p className="share-list-title">People with access</p>
          <ul className="share-users-list">
            {/* Owner item */}
            <li className="share-user-row">
              <Avatar user={doc.owner} size="sm" />
              <div className="share-user-info">
                <span className="share-user-name">{doc.owner.name}</span>
                <span className="share-user-email">{doc.owner.email}</span>
              </div>
              <span className="badge badge-owner">Owner</span>
            </li>

            {/* Shared users */}
            {doc.shares.map((s) => (
              <li key={s.id} className="share-user-row">
                <Avatar user={s} size="sm" />
                <div className="share-user-info">
                  <span className="share-user-name">{s.name}</span>
                  <span className="share-user-email">{s.email}</span>
                </div>
                {s.permission === "edit" ? (
                  <span className="badge badge-shared">Can edit</span>
                ) : (
                  <span className="badge badge-view">Can view</span>
                )}
                <button
                  className="btn-danger-outline"
                  onClick={() => handleRemove(s.id, s.name)}
                  disabled={busy}
                >
                  Remove
                </button>
              </li>
            ))}

            {doc.shares.length === 0 && (
              <li style={{ fontSize: "13px", color: "var(--ink-muted)", padding: "8px 0" }}>
                This document is private and not shared with anyone yet.
              </li>
            )}
          </ul>
        </div>

        {/* Footer with Copy Link */}
        <div className="share-link-footer">
          <button className="btn-secondary" onClick={handleCopyLink}>
            <span>{linkCopied ? "✓" : "🔗"}</span> {linkCopied ? "Link Copied!" : "Copy Link"}
          </button>
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
