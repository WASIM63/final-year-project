"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { predictAPI } from "@/lib/api";

export default function PredictPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"input" | "processing">("input");
  const [progress, setProgress] = useState(0);

  const steps = [
    "Extracting ASIN from URL...",
    "Fetching historical price data...",
    "Preprocessing & cleaning data...",
    "Training Prophet ML model...",
    "Generating 30-day forecast...",
    "Evaluating model accuracy...",
    "Saving prediction results...",
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.includes("amazon")) {
      setError("Please enter a valid Amazon product URL");
      return;
    }

    setLoading(true);
    setStep("processing");

    // Simulate progress while waiting for API
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= steps.length - 1) return prev;
        return prev + 1;
      });
    }, 2500);

    try {
      const res = await predictAPI.predict(url);
      clearInterval(progressInterval);
      setProgress(steps.length - 1);

      // Navigate to prediction result
      setTimeout(() => {
        router.push(`/dashboard/prediction/${res.data.id}`);
      }, 500);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || "Prediction failed. Please try again.");
      setStep("input");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="animate-fade-in-up">
        <h1 style={styles.title}>🔮 New Price Prediction</h1>
        <p style={styles.subtitle}>
          Paste an Amazon product URL and our AI will forecast the price for the next 30 days.
        </p>
      </div>

      {step === "input" ? (
        <div className="animate-fade-in-up stagger-1">
          {/* URL Input Card */}
          <div className="glass-card-static" style={styles.formCard}>
            {error && (
              <div style={styles.errorBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <label className="input-label" htmlFor="amazon-url">Amazon Product URL</label>
              <div style={styles.inputRow}>
                <input
                  id="amazon-url"
                  type="url"
                  className="input-field"
                  placeholder="https://www.amazon.in/dp/B0XXXXXXXXXX"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !url}
                  style={styles.predictBtn}
                >
                  Predict
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                    <path d="m5 12h14" /><path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Tips */}
            <div style={styles.tips}>
              <h3 style={styles.tipsTitle}>💡 Tips</h3>
              <ul style={styles.tipsList}>
                <li>Paste the full Amazon product URL (e.g., https://www.amazon.in/dp/B0XXXXXXXXXX)</li>
                <li>The product must have historical price data in our database</li>
                <li>Prediction takes ~10-20 seconds as the AI trains on real-time data</li>
                <li>Results include a 30-day forecast, best buy timing, and model accuracy metrics</li>
              </ul>
            </div>
          </div>

          {/* How it works */}
          <div style={styles.howItWorks}>
            <h2 style={styles.howTitle}>How It Works</h2>
            <div style={styles.stepsGrid}>
              {[
                { icon: "🔗", title: "1. Paste URL", desc: "We extract the unique ASIN identifier from the Amazon product page." },
                { icon: "📊", title: "2. Fetch Data", desc: "Historical price data is pulled from our MySQL database." },
                { icon: "🧹", title: "3. Preprocess", desc: "Data is cleaned — outliers removed, gaps filled, noise smoothed." },
                { icon: "🤖", title: "4. AI Forecast", desc: "Facebook Prophet model predicts the next 30 days with confidence intervals." },
              ].map((s, i) => (
                <div key={i} className="glass-card" style={styles.stepCard}>
                  <div style={styles.stepIcon}>{s.icon}</div>
                  <h3 style={styles.stepTitle}>{s.title}</h3>
                  <p style={styles.stepDesc}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Processing State */
        <div className="animate-fade-in-up" style={styles.processingCard}>
          <div className="glass-card-static" style={styles.processingInner}>
            <div style={styles.processingIcon}>
              <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
            </div>
            <h2 style={styles.processingTitle}>AI is analyzing your product...</h2>
            <p style={styles.processingUrl}>{url}</p>

            {/* Steps progress */}
            <div style={styles.stepsList}>
              {steps.map((s, i) => (
                <div key={i} style={styles.stepItem}>
                  <div
                    style={{
                      ...styles.stepDot,
                      ...(i < progress
                        ? styles.stepDotDone
                        : i === progress
                        ? styles.stepDotActive
                        : {}),
                    }}
                  >
                    {i < progress ? "✓" : i === progress ? "⋯" : ""}
                  </div>
                  <span
                    style={{
                      color: i <= progress ? "var(--text-primary)" : "var(--text-muted)",
                      fontWeight: i === progress ? 600 : 400,
                    }}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${((progress + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    color: "var(--text-secondary)",
    fontSize: "0.95rem",
    marginBottom: 32,
  },
  formCard: {
    padding: "32px",
    marginBottom: 40,
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
  form: {},
  inputRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  predictBtn: {
    padding: "14px 32px",
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
  tips: {
    marginTop: 28,
    padding: "20px 24px",
    background: "var(--bg-glass)",
    borderRadius: 12,
    border: "1px solid var(--border-subtle)",
  },
  tipsTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    marginBottom: 12,
    color: "var(--accent-amber)",
  },
  tipsList: {
    listStyle: "none",
    padding: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  howItWorks: {
    marginBottom: 40,
  },
  howTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: 20,
  },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  stepCard: {
    padding: 24,
    textAlign: "center" as const,
  },
  stepIcon: {
    fontSize: "2rem",
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  processingCard: {
    display: "flex",
    justifyContent: "center",
  },
  processingInner: {
    padding: "48px 40px",
    textAlign: "center" as const,
    maxWidth: 500,
    width: "100%",
  },
  processingIcon: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 24,
  },
  processingTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: 8,
  },
  processingUrl: {
    fontSize: "0.82rem",
    color: "var(--text-muted)",
    marginBottom: 32,
    wordBreak: "break-all" as const,
  },
  stepsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 14,
    textAlign: "left" as const,
    marginBottom: 28,
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: "0.88rem",
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "var(--bg-glass)",
    border: "1px solid var(--border-subtle)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.65rem",
    flexShrink: 0,
    transition: "all 0.3s",
  },
  stepDotDone: {
    background: "var(--gradient-success)",
    border: "none",
    color: "white",
  },
  stepDotActive: {
    border: "2px solid var(--accent-cyan)",
    color: "var(--accent-cyan)",
    boxShadow: "0 0 12px rgba(0,212,255,0.3)",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    background: "var(--bg-glass)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "var(--gradient-primary)",
    borderRadius: 2,
    transition: "width 0.5s ease",
  },
};
