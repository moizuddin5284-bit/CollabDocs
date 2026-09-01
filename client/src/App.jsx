import { useState, useCallback, useEffect } from "react";
import Login from "./Login";
import DocumentList from "./DocumentList";
import Editor from "./Editor";
import { clearUserId } from "./api";
import "./app.css";

// Which "page" is showing
const PAGE_LOGIN   = "login";
const PAGE_LIST    = "list";
const PAGE_EDITOR  = "editor";

export default function App() {
  const [page, setPage]             = useState(PAGE_LOGIN);   // always start at login
  const [currentUser, setCurrentUser] = useState(null);
  const [openDocId, setOpenDocId]   = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [toasts, setToasts]         = useState([]);
  const [animKey, setAnimKey]       = useState(0);            // forces re-mount → re-animation

  // Clear any stale stored session on app start so login is always required
  useEffect(() => {
    clearUserId();
  }, []);

  const notify = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  function handleLogin(user) {
    setCurrentUser(user);
    setAnimKey((k) => k + 1);
    setPage(PAGE_LIST);
  }

  function handleOpenDocument(docId) {
    setOpenDocId(docId);
    setAnimKey((k) => k + 1);
    setPage(PAGE_EDITOR);
  }

  function handleBackToList() {
    setOpenDocId(null);
    setRefreshToken((t) => t + 1);
    setAnimKey((k) => k + 1);
    setPage(PAGE_LIST);
  }

  function handleLogout() {
    clearUserId();
    setCurrentUser(null);
    setOpenDocId(null);
    setAnimKey((k) => k + 1);
    setPage(PAGE_LOGIN);
    notify("You have been signed out.", "info");
  }

  return (
    <>
      <div key={animKey} className="page-transition">
        {page === PAGE_LOGIN && (
          <Login onLogin={handleLogin} />
        )}

        {page === PAGE_LIST && currentUser && (
          <DocumentList
            currentUser={currentUser}
            onOpenDocument={handleOpenDocument}
            onLogout={handleLogout}
            refreshToken={refreshToken}
            notify={notify}
          />
        )}

        {page === PAGE_EDITOR && currentUser && openDocId && (
          <Editor
            documentId={openDocId}
            currentUser={currentUser}
            onBack={handleBackToList}
            onDocumentChanged={() => setRefreshToken((t) => t + 1)}
            notify={notify}
          />
        )}
      </div>

      {/* Global Toast Notifications */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>
              {t.type === "success" ? "✓" : t.type === "error" ? "⚠️" : "ℹ️"}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
