"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card-static animate-fade-in-up" style={styles.card}>
      {/* Logo */}
      <div style={styles.logoSection}>
        <div style={styles.logoIcon}>📈</div>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to your PriceCast AI account</p>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div>
          <label className="input-label" htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="input-label" htmlFor="login-password">Password</label>
          <div style={styles.passwordWrap}>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
              aria-label="Toggle password visibility"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={styles.submitBtn}
        >
          {loading ? (
            <span style={styles.loadingInner}>
              <span className="spinner" style={{ width: 18, height: 18 }} />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p style={styles.footerText}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={styles.link}>
          Create one
        </Link>
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: "100%",
    maxWidth: 440,
    padding: "48px 40px",
    position: "relative",
    zIndex: 2,
  },
  logoSection: {
    textAlign: "center",
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: "2.5rem",
    marginBottom: 16,
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    color: "var(--text-secondary)",
    fontSize: "0.95rem",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: "0.85rem",
    color: "#fca5a5",
    marginBottom: 20,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  passwordWrap: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    lineHeight: 1,
  },
  submitBtn: {
    width: "100%",
    marginTop: 8,
    padding: "14px 24px",
    fontSize: "1rem",
  },
  loadingInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  footerText: {
    textAlign: "center",
    marginTop: 28,
    fontSize: "0.9rem",
    color: "var(--text-muted)",
  },
  link: {
    color: "var(--accent-cyan)",
    textDecoration: "none",
    fontWeight: 500,
  },
};
