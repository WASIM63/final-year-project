"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { predictAPI } from "@/lib/api";
import {
  Sparkles,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Bot,
  Target,
} from "lucide-react";

interface PredictionSummary {
  id: number;
  asin: string;
  trend: string;
  best_day_price: number;
  best_day_date: string;
  mae: number;
  rmse: number;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [predictions, setPredictions] = useState<PredictionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    predictAPI.getAll()
      .then((res) => setPredictions(res.data.predictions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalPredictions = predictions.length;
  const increasingCount = predictions.filter((p) => p.trend === "increasing").length;
  const decreasingCount = predictions.filter((p) => p.trend === "decreasing").length;

  return (
    <div>
      {/* Welcome */}
      <div className="animate-fade-in-up dashboard-welcome" style={styles.welcome}>
        <div>
          <h1 className="dashboard-greeting" style={styles.greeting}>
            Welcome back, <span style={styles.nameHighlight}>{user?.name?.split(" ")[0]}</span>
          </h1>
          <p style={styles.welcomeSub}>
            Ready to forecast some prices? Paste an Amazon URL to get started.
          </p>
        </div>
        <button
          className="btn-primary dashboard-welcome-btn"
          onClick={() => router.push("/dashboard/predict")}
          style={styles.ctaBtn}
        >
          <Sparkles size={18} style={{ marginRight: 8 }} />
          New Prediction
        </button>
      </div>

      {/* Stats Row */}
      <div className="animate-fade-in-up stagger-1 stats-grid" style={styles.statsGrid}>
        <div className="glass-card stat-card" style={styles.statCard}>
          <div className="stat-icon" style={styles.statIcon}>
            <BarChart3 size={22} color="var(--accent-indigo)" />
          </div>
          <div>
            <div className="stat-value" style={styles.statValue}>{totalPredictions}</div>
            <div style={styles.statLabel}>Total Predictions</div>
          </div>
        </div>
        <div className="glass-card stat-card" style={styles.statCard}>
          <div className="stat-icon" style={{ ...styles.statIcon, background: "rgba(16,185,129,0.12)" }}>
            <TrendingDown size={22} color="var(--accent-green)" />
          </div>
          <div>
            <div className="stat-value" style={{ ...styles.statValue, color: "var(--accent-green)" }}>{decreasingCount}</div>
            <div style={styles.statLabel}>Price Dropping</div>
          </div>
        </div>
        <div className="glass-card stat-card" style={styles.statCard}>
          <div className="stat-icon" style={{ ...styles.statIcon, background: "rgba(239,68,68,0.12)" }}>
            <TrendingUp size={22} color="var(--accent-red)" />
          </div>
          <div>
            <div className="stat-value" style={{ ...styles.statValue, color: "var(--accent-red)" }}>{increasingCount}</div>
            <div style={styles.statLabel}>Price Rising</div>
          </div>
        </div>
        <div className="glass-card stat-card" style={styles.statCard}>
          <div className="stat-icon" style={{ ...styles.statIcon, background: "rgba(245,158,11,0.12)" }}>
            <Bot size={22} color="var(--accent-amber)" />
          </div>
          <div>
            <div className="stat-value" style={{ ...styles.statValue, color: "var(--accent-amber)" }}>Prophet</div>
            <div style={styles.statLabel}>ML Model</div>
          </div>
        </div>
      </div>

      {/* Recent predictions */}
      <div className="animate-fade-in-up stagger-2" style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Predictions</h2>
          {predictions.length > 0 && (
            <button
              className="btn-secondary"
              onClick={() => router.push("/dashboard/history")}
              style={{ padding: "8px 20px", fontSize: "0.85rem" }}
            >
              View All
            </button>
          )}
        </div>

        {loading ? (
          <div className="skeleton-grid" style={styles.skeletonGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
            ))}
          </div>
        ) : predictions.length === 0 ? (
          <div className="glass-card-static" style={styles.emptyState}>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Target size={32} color="var(--accent-indigo)" />
              </div>
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>No predictions yet</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 20 }}>
              Start by pasting an Amazon product URL to get your first price forecast.
            </p>
            <button
              className="btn-primary"
              onClick={() => router.push("/dashboard/predict")}
              style={{ padding: "12px 28px" }}
            >
              Make First Prediction
            </button>
          </div>
        ) : (
          <div className="pred-grid" style={styles.predGrid}>
            {predictions.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="glass-card pred-card"
                style={styles.predCard}
                onClick={() => router.push(`/dashboard/prediction/${p.id}`)}
              >
                <div style={styles.predTop}>
                  <div style={styles.asinBadge}>{p.asin}</div>
                  <div
                    style={{
                      ...styles.trendBadge,
                      background:
                        p.trend === "decreasing"
                          ? "rgba(16,185,129,0.12)"
                          : "rgba(239,68,68,0.12)",
                      color:
                        p.trend === "decreasing"
                          ? "var(--accent-green)"
                          : "var(--accent-red)",
                    }}
                  >
                    {p.trend === "decreasing" ? (
                      <TrendingDown size={14} style={{ marginRight: 4 }} />
                    ) : (
                      <TrendingUp size={14} style={{ marginRight: 4 }} />
                    )}
                    {p.trend === "decreasing" ? "Dropping" : "Rising"}
                  </div>
                </div>
                <div style={styles.predMiddle}>
                  <div>
                    <div style={styles.predLabel}>Best Buy Price</div>
                    <div style={styles.predPrice}>₹{p.best_day_price?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={styles.predLabel}>Best Date</div>
                    <div style={styles.predDate}>
                      {new Date(p.best_day_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                </div>
                <div style={styles.predFooter}>
                  {new Date(p.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  welcome: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    flexWrap: "wrap",
    gap: 16,
  },
  greeting: {
    fontSize: "1.75rem",
    fontWeight: 700,
    marginBottom: 6,
  },
  nameHighlight: {
    background: "var(--gradient-primary)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  welcomeSub: {
    color: "var(--text-secondary)",
    fontSize: "0.95rem",
  },
  ctaBtn: {
    padding: "14px 28px",
    fontSize: "0.95rem",
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 40,
  },
  statCard: {
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "rgba(99,102,241,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--accent-cyan)",
  },
  statLabel: {
    fontSize: "0.82rem",
    color: "var(--text-muted)",
    marginTop: 2,
  },
  section: {},
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
  },
  skeletonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16,
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 24px",
  },
  predGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 16,
  },
  predCard: {
    padding: "24px",
    cursor: "pointer",
  },
  predTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  asinBadge: {
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 8,
    padding: "4px 12px",
    fontSize: "0.8rem",
    fontWeight: 600,
    fontFamily: "monospace",
    color: "var(--accent-indigo)",
  },
  trendBadge: {
    borderRadius: 8,
    padding: "4px 12px",
    fontSize: "0.78rem",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
  },
  predMiddle: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  predLabel: {
    fontSize: "0.78rem",
    color: "var(--text-muted)",
    marginBottom: 4,
  },
  predPrice: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--accent-green)",
  },
  predDate: {
    fontSize: "1rem",
    fontWeight: 600,
  },
  predFooter: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    paddingTop: 12,
    borderTop: "1px solid var(--border-subtle)",
  },
};
