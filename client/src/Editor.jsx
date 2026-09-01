import { useEffect, useRef, useState, useCallback } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { api } from "./api";
import ShareModal from "./ShareModal";
import Avatar from "./Avatar";
import LogoIcon from "./LogoIcon";

const TOOLBAR_OPTIONS = [
  [{ header: [false, 1, 2, 3] }],
  ["bold", "italic", "underline", "strike"],
  ["blockquote", "code-block"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link", "clean"],
];

const SAVE_IDLE = "idle";
const SAVE_SAVING = "saving";
const SAVE_SAVED = "saved";
const SAVE_ERROR = "error";

export default function Editor({ documentId, currentUser, onDocumentChanged, onBack, notify }) {
  const editorHostRef = useRef(null);
  const quillRef = useRef(null);
  const saveTimer = useRef(null);
  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState(SAVE_IDLE);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [contentStats, setContentStats] = useState({ words: 0, chars: 0, readTime: "1 min" });
  const suppressNextChange = useRef(false);

  const readOnly = doc?.access === "view";

  // Load document on mount or ID change
  useEffect(() => {
    let cancelled = false;
    setLoadError("");
    setDoc(null);
    api
      .getDocument(documentId)
      .then((d) => {
        if (cancelled) return;
        setDoc(d);
        setTitle(d.title);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // Calculate word and character count from text
  const updateStats = useCallback((text) => {
    const cleanText = text.trim();
    if (!cleanText) {
      setContentStats({ words: 0, chars: 0, readTime: "0 min" });
      return;
    }
    const words = cleanText.split(/\s+/).filter(Boolean).length;
    const chars = cleanText.length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    setContentStats({ words, chars, readTime: `${minutes} min read` });
  }, []);

  // Initialize Quill editor
  useEffect(() => {
    const host = editorHostRef.current;
    if (!doc || !host) return;

    const quill = new Quill(host, {
      theme: "snow",
      readOnly,
      modules: { toolbar: readOnly ? false : TOOLBAR_OPTIONS },
      placeholder: "Start typing your document here…",
    });
    quillRef.current = quill;

    suppressNextChange.current = true;
    quill.clipboard.dangerouslyPasteHTML(doc.content || "");
    updateStats(quill.getText());

    const handleChange = (_delta, _old, source) => {
      if (suppressNextChange.current) {
        suppressNextChange.current = false;
        return;
      }
      updateStats(quill.getText());
      if (source !== "user") return;
      scheduleSave({ content: quill.root.innerHTML });
    };

    quill.on("text-change", handleChange);

    return () => {
      quill.off("text-change", handleChange);
      quillRef.current = null;
      if (host) {
        host.innerHTML = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id]);

  const scheduleSave = useCallback(
    (patch) => {
      setSaveState(SAVE_SAVING);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const updated = await api.updateDocument(documentId, patch);
          setDoc(updated);
          setSaveState(SAVE_SAVED);
          onDocumentChanged?.();
        } catch (err) {
          setSaveState(SAVE_ERROR);
          notify?.(err.message, "error");
        }
      }, 600);
    },
    [documentId, onDocumentChanged, notify]
  );

  function handleTitleChange(e) {
    setTitle(e.target.value);
  }

  function handleTitleBlur() {
    const trimmed = title.trim();
    if (!doc || trimmed === doc.title) return;
    if (!trimmed) {
      setTitle(doc.title);
      return;
    }
    scheduleSave({ title: trimmed });
  }

  function handleTitleKeyDown(e) {
    if (e.key === "Enter") {
      e.target.blur();
    }
  }

  // Export handlers
  function exportMarkdown() {
    setExportOpen(false);
    if (!quillRef.current) return;
    const textContent = quillRef.current.getText();
    const blob = new Blob([`# ${title}\n\n${textContent}`], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, `${slugify(title)}.md`);
    notify?.("Exported document as Markdown", "success");
  }

  function exportHtml() {
    setExportOpen(false);
    if (!quillRef.current) return;
    const bodyHtml = quillRef.current.root.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1, h2, h3 { color: #0f172a; margin-top: 1.5em; }
    blockquote { border-left: 4px solid #4f46e5; margin: 0; padding-left: 16px; color: #475569; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${bodyHtml}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, `${slugify(title)}.html`);
    notify?.("Exported document as HTML", "success");
  }

  function handlePrint() {
    setExportOpen(false);
    setTimeout(() => {
      window.print();
    }, 100);
  }

  if (loadError) {
    return (
      <div className="login-screen">
        <div className="login-card" style={{ textAlign: "center" }}>
          <h2 style={{ color: "var(--accent-danger-text)", marginBottom: "8px" }}>Cannot Open Document</h2>
          <p style={{ color: "var(--ink-body)", marginBottom: "20px" }}>{loadError}</p>
          <button className="btn-primary" onClick={onBack}>
            ← Back to Documents
          </button>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--ink-muted)", fontSize: "15px" }}>
          <span className="spinner-icon">⏳</span> Loading document…
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page">
      {/* Editor Topbar */}
      <header className="editor-topbar">
        <div className="editor-topbar-left">
          <button className="btn-icon" onClick={onBack} title="Back to workspace" aria-label="Back">
            ←
          </button>
          <LogoIcon size={28} />
          <div className="title-input-wrap">
            <input
              className="title-input"
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              disabled={readOnly}
              placeholder="Untitled document"
              aria-label="Document Title"
            />
          </div>
          <SaveBadge state={saveState} readOnly={readOnly} />
        </div>

        <div className="editor-topbar-right">
          {/* Active Collaborators Facepile in Editor */}
          {doc.shares?.length > 0 && (
            <div className="collaborators-facepile" title="Teammates with access" style={{ marginRight: "4px" }}>
              {doc.shares.slice(0, 3).map((s) => (
                <Avatar key={s.id} user={s} size="xs" className="facepile-avatar" />
              ))}
              {doc.shares.length > 3 && <span className="facepile-more">+{doc.shares.length - 3}</span>}
            </div>
          )}

          {/* Export dropdown */}
          <div className="dropdown-wrap">
            <button
              className="btn-secondary"
              style={{ padding: "6px 12px", fontSize: "13px" }}
              onClick={() => setExportOpen(!exportOpen)}
            >
              <span>Export</span> ▾
            </button>
            {exportOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={exportMarkdown}>
                  <span>📄</span> Export as Markdown (.md)
                </button>
                <button className="dropdown-item" onClick={exportHtml}>
                  <span>🌐</span> Export as HTML (.html)
                </button>
                <button className="dropdown-item" onClick={handlePrint}>
                  <span>🖨️</span> Print / Save as PDF
                </button>
              </div>
            )}
          </div>

          {/* Share button or Shared pill */}
          {doc.access === "owner" ? (
            <button className="btn-primary" onClick={() => setShareOpen(true)}>
              <span>👥</span> Share {doc.shares?.length > 0 && `(${doc.shares.length})`}
            </button>
          ) : (
            <span className="badge badge-shared">
              Shared by {doc.owner?.name}
            </span>
          )}

          <Avatar user={currentUser} size="sm" />
        </div>
      </header>

      {/* View Only Warning Banner */}
      {readOnly && (
        <div className="view-only-banner">
          🔒 <strong>View-only access:</strong> You cannot make changes to this document. Contact{" "}
          <strong>{doc.owner?.name}</strong> to request edit permission.
        </div>
      )}

      {/* Editor Document Canvas */}
      <div className="editor-body-container" onClick={() => setExportOpen(false)}>
        <div className="editor-document-sheet">
          <h1 className="print-only-title">{title || "Untitled Document"}</h1>
          <div ref={editorHostRef} className="quill-host" />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <footer className="editor-status-bar">
        <div className="editor-status-meta">
          <span>{contentStats.words} words</span>
          <span>&middot;</span>
          <span>{contentStats.chars} characters</span>
          <span>&middot;</span>
          <span>{contentStats.readTime}</span>
        </div>
        <div className="editor-status-meta">
          <span>
            Permission: <strong>{doc.access === "owner" ? "Owner (Full Access)" : doc.access === "edit" ? "Can Edit" : "View Only"}</strong>
          </span>
        </div>
      </footer>

      {/* Share Modal Dialog */}
      {shareOpen && (
        <ShareModal
          doc={doc}
          onClose={() => setShareOpen(false)}
          notify={notify}
          onShared={(updated) => {
            setDoc(updated);
            onDocumentChanged?.();
          }}
        />
      )}
    </div>
  );
}

function SaveBadge({ state, readOnly }) {
  if (readOnly) return null;
  switch (state) {
    case SAVE_SAVING:
      return (
        <span className="save-pill save-pill-saving">
          <span className="spinner-icon">🔄</span> Saving…
        </span>
      );
    case SAVE_SAVED:
      return (
        <span className="save-pill save-pill-saved">
          ✓ Saved
        </span>
      );
    case SAVE_ERROR:
      return (
        <span className="save-pill save-pill-error">
          ⚠️ Couldn't save
        </span>
      );
    default:
      return null;
  }
}

function slugify(text) {
  return (text || "document")
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
