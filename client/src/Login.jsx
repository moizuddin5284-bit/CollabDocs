import { useState } from "react";
import { api, setUserId } from "./api";
import LogoIcon from "./LogoIcon";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError("");
    setSubmitting(true);
    try {
      const user = await api.login({ email: email.trim(), password });
      setUserId(user.id);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      {/* Animated Background Blobs */}
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />
      <div className="login-blob login-blob-3" />

      <div className="login-split">
        {/* Left Panel — Branding */}
        <div className="login-left">
          <div className="login-left-inner">
            <div className="login-logo-lockup">
              <LogoIcon size={44} />
              <span className="login-logo-name">CollabDocs</span>
            </div>
            <h1 className="login-hero-heading">
              Your team's<br />
              <span className="login-hero-accent">shared workspace.</span>
            </h1>
            <p className="login-hero-sub">
              Create, edit, and share rich-text documents with your team — all in one beautifully simple place.
            </p>

            <div className="login-feature-list">
              <div className="login-feature-item">
                <span className="login-feature-icon">✍️</span>
                <span>Rich-text editing with instant autosave</span>
              </div>
              <div className="login-feature-item">
                <span className="login-feature-icon">👥</span>
                <span>Role-based sharing and access controls</span>
              </div>
              <div className="login-feature-item">
                <span className="login-feature-icon">📥</span>
                <span>Import Markdown and plain text files</span>
              </div>
              <div className="login-feature-item">
                <span className="login-feature-icon">🖨️</span>
                <span>Export to Markdown, HTML, or PDF</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Login Form */}
        <div className="login-right">
          <div className="login-form-card">
            <div className="login-form-header">
              <h2>Welcome back</h2>
              <p>Sign in to continue to your workspace</p>
            </div>

            {error && (
              <div className="login-error-banner">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form-body">
              <div className="login-field">
                <label htmlFor="login-email">Email address</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">✉️</span>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@ajaia.test"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="login-field">
                <div className="login-field-label-row">
                  <label htmlFor="login-pwd">Password</label>
                </div>
                <div className="login-input-wrap">
                  <span className="login-input-icon">🔒</span>
                  <input
                    id="login-pwd"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-show-pwd-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={submitting || !email.trim() || !password}
              >
                {submitting ? (
                  <>
                    <span className="spinner-icon">⏳</span> Signing in…
                  </>
                ) : (
                  "Sign in to Workspace"
                )}
              </button>
            </form>

            <div className="login-demo-hint">
              <span className="login-demo-hint-label">Demo accounts</span>
              <div className="login-demo-accounts">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    className="login-demo-pill"
                    onClick={() => { setEmail(a.email); setPassword("password123"); setError(""); }}
                  >
                    {a.emoji} {a.name}
                  </button>
                ))}
              </div>
              <span className="login-demo-pwd-note">All accounts use <code>password123</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DEMO_ACCOUNTS = [
  { email: "amina@ajaia.test", name: "Amina", emoji: "👩🏽‍💼" },
  { email: "kofi@ajaia.test",  name: "Kofi",  emoji: "👨🏾‍💻" },
  { email: "lena@ajaia.test",  name: "Lena",  emoji: "👩🏻‍🎨" },
  { email: "ravi@ajaia.test",  name: "Ravi",  emoji: "👨🏽‍💼" },
];
