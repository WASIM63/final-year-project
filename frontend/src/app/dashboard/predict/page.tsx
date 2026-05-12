"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { predictAPI } from "@/lib/api";
import {
  Sparkles,
  ArrowRight,
  AlertCircle,
  Lightbulb,
  Link2,
  BarChart3,
  Filter,
  Bot,
  CheckCircle2,
  Loader2,
  ClipboardPaste,
} from "lucide-react";

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
        <h1 className="predict-title" style={styles.title}>
          <Sparkles size={24} style={{ marginRight: 10, verticalAlign: "middle" }} />
          New Price Prediction
        </h1>
        <p style={styles.subtitle}>
          Paste an Amazon product URL and our AI will forecast the price for the next 30 days.
        </p>
      </div>

      {step === "input" ? (
        <div className="animate-fade-in-up stagger-1">
          {/* URL Input Card */}
          <div className="glass-card-static predict-form-card" style={styles.formCard}>
            {error && (
              <div style={styles.errorBox}>
                <AlertCircle size={16} color="#ef4444" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <label className="input-label" htmlFor="amazon-url">Amazon Product URL</label>
              <div className="predict-input-row" style={styles.inputRow}>
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
                  type="button"
                  className="btn-secondary"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setUrl(text);
                    } catch {
                      // Clipboard permission denied — ignore
                    }
                  }}
                  style={styles.pasteBtn}
                  title="Paste from clipboard"
                >
                  <ClipboardPaste size={18} />
                  Paste
                </button>
                <button
                  type="submit"
                  className="btn-primary predict-btn"
                  disabled={loading || !url}
                  style={styles.predictBtn}
                >
                  Predict
                  <ArrowRight size={18} style={{ marginLeft: 6 }} />
                </button>
              </div>
            </form>

            {/* Tips */}
            <div className="predict-tips" style={styles.tips}>
              <h3 style={styles.tipsTitle}>
                <Lightbulb size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Tips
              </h3>
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
            <div className="predict-steps-grid" style={styles.stepsGrid}>
              {[
                { icon: <Link2 size={24} />, title: "1. Paste URL", desc: "We extract the unique ASIN identifier from the Amazon product page.", color: "var(--accent-cyan)", bg: "rgba(0,212,255,0.1)" },
                { icon: <BarChart3 size={24} />, title: "2. Fetch Data", desc: "Historical price data is pulled from our MySQL database.", color: "var(--accent-blue)", bg: "rgba(59,130,246,0.1)" },
                { icon: <Filter size={24} />, title: "3. Preprocess", desc: "Data is cleaned — outliers removed, gaps filled, noise smoothed.", color: "var(--accent-purple)", bg: "rgba(139,92,246,0.1)" },
                { icon: <Bot size={24} />, title: "4. AI Forecast", desc: "Facebook Prophet model predicts the next 30 days with confidence intervals.", color: "var(--accent-green)", bg: "rgba(16,185,129,0.1)" },
              ].map((s, i) => (
                <div key={i} className="glass-card predict-step-card" style={styles.stepCard}>
                  <div style={{ ...styles.stepIcon, background: s.bg, color: s.color }}>
                    {s.icon}
                  </div>
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
          <div className="glass-card-static processing-inner" style={styles.processingInner}>
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
                    {i < progress ? (
                      <CheckCircle2 size={14} />
                    ) : i === progress ? (
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    ) : null}
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
    display: "inline-flex",
    alignItems: "center",
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
  pasteBtn: {
    padding: "14px 20px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
    fontSize: "0.9rem",
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
    display: "inline-flex",
    alignItems: "center",
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
    width: 52,
    height: 52,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
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
    color: "var(--text-muted)",
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
