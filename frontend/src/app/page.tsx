"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <div style={styles.wrapper}>
      {/* Background animated grid */}
      <div style={styles.gridBg} />

      {/* Hero Section */}
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>📈</span>
          <span style={styles.logoText}>PriceCast AI</span>
        </div>
        <div style={styles.navLinks}>
          <button onClick={() => router.push("/login")} style={styles.navBtn}>
            Login
          </button>
          <button onClick={() => router.push("/register")} className="btn-primary" style={styles.navCta}>
            Get Started
          </button>
        </div>
      </nav>

      <main style={styles.main}>
        <div className="animate-fade-in-up" style={styles.hero}>
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            Powered by Prophet AI
          </div>

          <h1 style={styles.heading}>
            Predict Amazon Prices
            <br />
            <span style={styles.gradientText}>Before They Change</span>
          </h1>

          <p style={styles.subtitle}>
            Leverage advanced time-series forecasting to predict future prices of any Amazon product.
            Get 30-day price predictions, best buy recommendations, and trend analysis — all powered by machine learning.
          </p>

          <div style={styles.ctaGroup}>
            <button
              onClick={() => router.push("/register")}
              className="btn-primary"
              style={styles.heroBtn}
            >
              Start Forecasting — Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}>
                <path d="m5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/login")}
              className="btn-secondary"
              style={styles.heroBtnSec}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div style={styles.features} className="animate-fade-in-up stagger-2">
          {[
            {
              icon: "🔗",
              title: "Paste Any URL",
              desc: "Just paste an Amazon product link. We extract the ASIN and fetch historical data automatically.",
            },
            {
              icon: "🤖",
              title: "AI Forecasting",
              desc: "Facebook Prophet model with log transformation, outlier removal, and rolling smoothing for accurate predictions.",
            },
            {
              icon: "📊",
              title: "Visual Insights",
              desc: "Interactive charts showing historical trends, 30-day forecasts, best buy timing, and model evaluation metrics.",
            },
            {
              icon: "💰",
              title: "Best Buy Timing",
              desc: "Know exactly when the price will dip. Our model identifies the optimal purchasing window in the next 30 days.",
            },
          ].map((f, i) => (
            <div key={i} className="glass-card" style={styles.featureCard}>
              <div style={styles.featureIcon}>{f.icon}</div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={styles.stats} className="animate-fade-in-up stagger-3">
          {[
            { value: "30", label: "Day Forecast", suffix: "+" },
            { value: "95", label: "Accuracy Rate", suffix: "%" },
            { value: "24/7", label: "Availability", suffix: "" },
            { value: "< 10s", label: "Prediction Time", suffix: "" },
          ].map((s, i) => (
            <div key={i} style={styles.statItem}>
              <div style={styles.statValue}>
                {s.value}
                <span style={styles.statSuffix}>{s.suffix}</span>
              </div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          © 2026 PriceCast AI — Built by <strong>Biswajit Adak</strong>
        </p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },
  gridBg: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
    backgroundSize: "60px 60px",
    pointerEvents: "none",
    zIndex: 0,
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 40px",
    position: "relative",
    zIndex: 10,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    fontSize: "1.5rem",
  },
  logoText: {
    fontSize: "1.25rem",
    fontWeight: 700,
    background: "linear-gradient(135deg, #00d4ff, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  navBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
    padding: "8px 20px",
    borderRadius: 8,
    transition: "color 0.2s",
    fontFamily: "inherit",
  },
  navCta: {
    padding: "10px 24px",
    fontSize: "0.9rem",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px 80px",
    position: "relative",
    zIndex: 1,
  },
  hero: {
    textAlign: "center",
    maxWidth: 780,
    marginBottom: 80,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 100,
    padding: "8px 18px",
    fontSize: "0.82rem",
    fontWeight: 500,
    color: "var(--accent-indigo)",
    marginBottom: 28,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--accent-green)",
    display: "inline-block",
  },
  heading: {
    fontSize: "clamp(2.5rem, 5vw, 4rem)",
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: 24,
    letterSpacing: "-0.02em",
  },
  gradientText: {
    background: "linear-gradient(135deg, #00d4ff 0%, #6366f1 50%, #8b5cf6 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "1.15rem",
    color: "var(--text-secondary)",
    lineHeight: 1.7,
    maxWidth: 620,
    margin: "0 auto 40px",
  },
  ctaGroup: {
    display: "flex",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap" as const,
  },
  heroBtn: {
    padding: "16px 36px",
    fontSize: "1.05rem",
    display: "inline-flex",
    alignItems: "center",
  },
  heroBtnSec: {
    padding: "16px 36px",
    fontSize: "1.05rem",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 24,
    width: "100%",
    maxWidth: 1100,
    marginBottom: 80,
  },
  featureCard: {
    padding: 32,
    textAlign: "center" as const,
  },
  featureIcon: {
    fontSize: "2.2rem",
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: 10,
  },
  featureDesc: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  stats: {
    display: "flex",
    justifyContent: "center",
    gap: 60,
    flexWrap: "wrap" as const,
  },
  statItem: {
    textAlign: "center" as const,
  },
  statValue: {
    fontSize: "2.5rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #00d4ff, #6366f1)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  statSuffix: {
    fontSize: "1.5rem",
  },
  statLabel: {
    fontSize: "0.9rem",
    color: "var(--text-muted)",
    marginTop: 4,
  },
  footer: {
    textAlign: "center" as const,
    padding: "30px 20px",
    borderTop: "1px solid var(--border-subtle)",
    position: "relative" as const,
    zIndex: 1,
  },
  footerText: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
  },
};
