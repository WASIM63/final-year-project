"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Rocket,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card-static animate-fade-in-up auth-card" style={styles.card}>
      {/* Logo */}
      <div style={styles.logoSection}>
        <div className="auth-logo-icon" style={styles.logoIcon}>
          <Rocket size={28} strokeWidth={2} />
        </div>
        <h1 className="auth-title" style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Start predicting Amazon prices with AI</p>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={16} color="#ef4444" />
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div>
          <label className="input-label" htmlFor="reg-name">Full Name</label>
          <input
            id="reg-name"
            type="text"
            className="input-field"
            placeholder="Enter Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="input-label" htmlFor="reg-email">Email Address</label>
          <input
            id="reg-email"
            type="email"
            className="input-field"
            placeholder="Enter Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="input-label" htmlFor="reg-password">Password</label>
          <div style={styles.passwordWrap}>
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              className="input-field"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
            </button>
          </div>
        </div>

        <div>
          <label className="input-label" htmlFor="reg-confirm">Confirm Password</label>
          <input
            id="reg-confirm"
            type="password"
            className="input-field"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
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
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p style={styles.footerText}>
        Already have an account?{" "}
        <Link href="/login" style={styles.link}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: "100%",
    maxWidth: 440,
    padding: "40px 40px 48px",
    position: "relative",
    zIndex: 2,
  },
  logoSection: {
    textAlign: "center",
    marginBottom: 28,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: "var(--gradient-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    margin: "0 auto 14px",
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
    gap: 18,
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
    display: "flex",
    alignItems: "center",
    padding: 2,
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
    marginTop: 24,
    fontSize: "0.9rem",
    color: "var(--text-muted)",
  },
  link: {
    color: "var(--accent-cyan)",
    textDecoration: "none",
    fontWeight: 500,
  },
};
