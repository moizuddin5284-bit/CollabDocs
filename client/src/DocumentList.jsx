import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { api, clearUserId } from "./api";
import Avatar from "./Avatar";
import LogoIcon from "./LogoIcon";

const TEMPLATES = [
  {
    id: "blank",
    title: "Blank Document",
    desc: "Start fresh with a clean canvas",
    icon: "📄",
    content: "",
  },
  {
    id: "roadmap",
    title: "Project Roadmap",
    desc: "Vision, milestones & quarterly targets",
    icon: "🗺️",
    content: `<h1>Project Roadmap: Q3 & Q4</h1><p><strong>Status:</strong> Draft &middot; <strong>Target Launch:</strong> End of Q4</p><h2>1. Executive Summary</h2><p>Overview of the key initiatives and core deliverables planned for this cycle.</p><h2>2. Key Milestones</h2><ul><li><strong>Milestone 1:</strong> MVP Architecture &amp; Database Design (Week 2)</li><li><strong>Milestone 2:</strong> Core Rich-Text Editor &amp; File Import (Week 4)</li><li><strong>Milestone 3:</strong> Role-based Sharing &amp; Access Controls (Week 6)</li></ul><h2>3. Success Metrics</h2><p>Measure user engagement, load time under 200ms, and zero data loss on concurrent sessions.</p>`,
  },
  {
    id: "meeting",
    title: "Team Meeting Notes",
    desc: "Agenda, discussion points & action items",
    icon: "📝",
    content: `<h1>Team Sync - Meeting Notes</h1><p><strong>Date:</strong> Today &middot; <strong>Facilitator:</strong> Product Team</p><h2>Attendees</h2><ul><li>Amina Yusuf</li><li>Kofi Mensah</li><li>Lena Ortiz</li></ul><h2>Agenda</h2><ol><li>Review active sprint goals</li><li>Product architecture discussion</li><li>Feedback on document editor usability</li></ol><h2>Action Items</h2><ul><li>[ ] Finalize file upload validation logic</li><li>[ ] Test sharing permissions with guest accounts</li></ul>`,
  },
  {
    id: "standup",
    title: "Weekly Standup",
    desc: "Highlights, in-progress tasks & blockers",
    icon: "⚡",
    content: `<h1>Weekly Standup Summary</h1><h2>🌟 What was accomplished</h2><ul><li>Implemented rich-text editing toolbar with headers and lists.</li><li>Added SQLite persistence with foreign keys.</li></ul><h2>🚧 In Progress</h2><ul><li>Testing end-to-end sharing flows across multiple profiles.</li></ul><h2>🛑 Blockers</h2><p>None at the moment!</p>`,
  },
];

export default function DocumentList({ currentUser, onOpenDocument, onLogout, refreshToken, notify }) {
  const [data, setData] = useState({ owned: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "owned" | "shared"
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [deleteDocTarget, setDeleteDocTarget] = useState(null); // { id, title }
  const fileInputRef = useRef(null);

  const refresh = useCallback(() => {
    api
      .listDocuments()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        notify?.(err.message, "error");
        setLoading(false);
      });
  }, [notify]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshToken]);

  async function handleCreateWithTemplate(tpl) {
    setCreating(true);
    try {
      const title = tpl.id === "blank" ? "Untitled document" : tpl.title;
      const doc = await api.createDocument(title, tpl.content);
      notify?.(`Created "${doc.title}"`, "success");
      onOpenDocument(doc.id);
    } catch (err) {
      notify?.(err.message, "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDuplicate(id, title) {
    try {
      const copy = await api.duplicateDocument(id);
      notify?.(`Duplicated "${title}"`, "success");
      refresh();
      onOpenDocument(copy.id);
    } catch (err) {
      notify?.(err.message, "error");
    }
  }

  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".txt", ".md"].includes(ext)) {
      notify?.(`Unsupported file type "${ext}". Only .txt and .md files are supported.`, "error");
      return;
    }

    setUploading(true);
    try {
      const doc = await api.uploadDocument(file);
      notify?.(`Uploaded and converted "${file.name}"!`, "success");
      onOpenDocument(doc.id);
    } catch (err) {
      notify?.(err.message, "error");
    } finally {
      setUploading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteDocTarget) return;
    try {
      await api.deleteDocument(deleteDocTarget.id);
      notify?.(`Deleted "${deleteDocTarget.title}"`, "info");
      setDeleteDocTarget(null);
      refresh();
    } catch (err) {
      notify?.(err.message, "error");
    }
  }

  function handleLogout() {
    clearUserId();
    onLogout();
  }

  // Filter documents based on active tab and search query
  const filteredOwned = useMemo(() => {
    return data.owned.filter((d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data.owned, searchQuery]);

  const filteredShared = useMemo(() => {
    return data.shared.filter(
      (d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.owner?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data.shared, searchQuery]);

  const totalCount = data.owned.length + data.shared.length;

  return (
    <div className="app-shell" onClick={() => setProfileDropdownOpen(false)}>
      {/* Top Navigation Bar */}
      <header className="topbar">
        <div className="brand" onClick={() => setActiveTab("all")}>
          <LogoIcon size={34} />
          <span className="brand-name">CollabDocs</span>
          <span className="brand-badge">Workspace</span>
        </div>

        <div className="topbar-right">
          {/* User Profile Dropdown */}
          <div className="dropdown-wrap" onClick={(e) => e.stopPropagation()}>
            <button
              className="user-profile-chip"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              title="Account options"
            >
              <Avatar user={currentUser} size="sm" />
              <span>{currentUser.name}</span>
              <span style={{ fontSize: "11px", color: "var(--ink-muted)" }}>▾</span>
            </button>

            {profileDropdownOpen && (
              <div className="dropdown-menu profile-menu-dropdown">
                <div className="profile-menu-header">
                  <Avatar user={currentUser} size="lg" />
                  <div className="profile-menu-info">
                    <span className="profile-menu-name">{currentUser.name}</span>
                    <span className="profile-menu-role">{currentUser.role || "Team Member"}</span>
                    <span className="profile-menu-email">{currentUser.email}</span>
                  </div>
                </div>
                <div className="profile-menu-divider" />
                <button
                  className="dropdown-item"
                  style={{ color: "var(--accent-danger-text)" }}
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    handleLogout();
                  }}
                >
                  <span>🚪</span> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="doc-list-main">
        {/* Dashboard Hero Greeting */}
        <div className="dashboard-hero">
          <div className="dashboard-title-wrap">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
              <Avatar user={currentUser} size="md" />
              <h2>Welcome back, {currentUser.name}</h2>
            </div>
            <p>
              {currentUser.role ? `${currentUser.role} &middot; ` : ""}
              Collaborate on documents, import Markdown notes, or start from a template.
            </p>
          </div>

          <div className="dashboard-actions">
            <button
              className="btn-primary"
              onClick={() => handleCreateWithTemplate(TEMPLATES[0])}
              disabled={creating}
            >
              <span>+</span> New Document
            </button>
            <button
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <span>{uploading ? "⏳" : "📥"}</span> {uploading ? "Importing…" : "Upload .txt / .md"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              hidden
              onChange={handleFileChosen}
            />
          </div>
        </div>

        {/* Quick Start Templates */}
        <section className="template-starters-section">
          <p className="section-eyebrow">Start a new document</p>
          <div className="templates-grid">
            {TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className={`template-card ${tpl.id === "blank" ? "template-card-blank" : ""}`}
                onClick={() => handleCreateWithTemplate(tpl)}
              >
                <div className="template-icon">{tpl.icon}</div>
                <div className="template-title">{tpl.title}</div>
                <div className="template-desc">{tpl.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Search & Filter Toolbar */}
        <div className="filter-toolbar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search documents or teammates…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All ({totalCount})
            </button>
            <button
              className={`filter-tab ${activeTab === "owned" ? "active" : ""}`}
              onClick={() => setActiveTab("owned")}
            >
              Created by me ({data.owned.length})
            </button>
            <button
              className={`filter-tab ${activeTab === "shared" ? "active" : ""}`}
              onClick={() => setActiveTab("shared")}
            >
              Shared with me ({data.shared.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-muted)" }}>
            <span className="spinner-icon">⏳</span> Loading documents…
          </div>
        ) : (
          <>
            {/* Owned Documents Section */}
            {(activeTab === "all" || activeTab === "owned") && (
              <section className="doc-section">
                <div className="doc-section-header">
                  <h3 className="doc-section-title">Created by you</h3>
                  <span className="doc-count-badge">{filteredOwned.length}</span>
                </div>
                {filteredOwned.length === 0 ? (
                  <div className="doc-empty-state">
                    {searchQuery ? "No matching documents found." : "You haven't created any documents yet. Pick a template above to start!"}
                  </div>
                ) : (
                  <div className="doc-list-cards">
                    {filteredOwned.map((doc) => (
                      <div key={doc.id} className="doc-row-card">
                        <button className="doc-row-link" onClick={() => onOpenDocument(doc.id)}>
                          <div className="doc-type-icon">📄</div>
                          <div className="doc-row-info">
                            <span className="doc-row-title">{doc.title}</span>
                            <div className="doc-row-meta">
                              <span>Updated {formatDate(doc.updatedAt)}</span>
                              <span className="badge badge-owner">Owner</span>
                              {doc.shares.length > 0 && (
                                <div className="collaborators-facepile">
                                  {doc.shares.slice(0, 3).map((s) => (
                                    <Avatar key={s.id} user={s} size="xs" className="facepile-avatar" />
                                  ))}
                                  {doc.shares.length > 3 && (
                                    <span className="facepile-more">+{doc.shares.length - 3}</span>
                                  )}
                                  <span style={{ marginLeft: "4px", fontSize: "12px", color: "var(--ink-muted)" }}>
                                    Shared with {doc.shares.length}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>

                        <div className="doc-row-actions">
                          <button
                            className="btn-secondary"
                            style={{ padding: "6px 12px", fontSize: "13px" }}
                            onClick={() => onOpenDocument(doc.id)}
                          >
                            Open
                          </button>
                          <button
                            className="btn-ghost"
                            style={{ padding: "6px 10px", fontSize: "13px" }}
                            title="Duplicate document"
                            onClick={() => handleDuplicate(doc.id, doc.title)}
                          >
                            📋 Copy
                          </button>
                          <button
                            className="btn-danger-outline"
                            onClick={() => setDeleteDocTarget({ id: doc.id, title: doc.title })}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Shared with Me Section */}
            {(activeTab === "all" || activeTab === "shared") && (
              <section className="doc-section">
                <div className="doc-section-header">
                  <h3 className="doc-section-title">Shared with you</h3>
                  <span className="doc-count-badge">{filteredShared.length}</span>
                </div>
                {filteredShared.length === 0 ? (
                  <div className="doc-empty-state">
                    {searchQuery
                      ? "No matching shared documents found."
                      : "No documents have been shared with your account yet."}
                  </div>
                ) : (
                  <div className="doc-list-cards">
                    {filteredShared.map((doc) => (
                      <div key={doc.id} className="doc-row-card">
                        <button className="doc-row-link" onClick={() => onOpenDocument(doc.id)}>
                          <Avatar user={doc.owner} size="sm" />
                          <div className="doc-row-info">
                            <span className="doc-row-title">{doc.title}</span>
                            <div className="doc-row-meta">
                              <span>Updated {formatDate(doc.updatedAt)}</span>
                              <span>&middot;</span>
                              <span>
                                Owned by <strong>{doc.owner?.name}</strong>
                              </span>
                              {doc.access === "edit" ? (
                                <span className="badge badge-shared">Can edit</span>
                              ) : (
                                <span className="badge badge-view">Can view</span>
                              )}
                            </div>
                          </div>
                        </button>
                        <div className="doc-row-actions">
                          <button
                            className="btn-secondary"
                            style={{ padding: "6px 12px", fontSize: "13px" }}
                            onClick={() => onOpenDocument(doc.id)}
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteDocTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteDocTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <h2>Delete Document?</h2>
              <button className="btn-icon" onClick={() => setDeleteDocTarget(null)}>
                ✕
              </button>
            </div>
            <p style={{ fontSize: "14px", color: "var(--ink-body)", marginBottom: "24px", lineHeight: "1.5" }}>
              Are you sure you want to permanently delete <strong>&ldquo;{deleteDocTarget.title}&rdquo;</strong>? This action cannot be undone and will remove access for all shared collaborators.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="btn-secondary" onClick={() => setDeleteDocTarget(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ background: "#dc2626", borderColor: "#dc2626" }}
                onClick={confirmDelete}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
