"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { predictAPI } from "@/lib/api";

interface PredictionSummary {
  id: number;
  asin: string;
  amazon_url: string;
  trend: string;
  best_day_price: number;
  best_day_date: string;
  mae: number;
  rmse: number;
  created_at: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<PredictionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    predictAPI
      .getAll()
      .then((res) => {
        const list = (res.data.predictions || []).map((p: PredictionSummary) => ({
          ...p,
          mae: parseFloat(p.mae as unknown as string) || 0,
          rmse: parseFloat(p.rmse as unknown as string) || 0,
          best_day_price: parseFloat(p.best_day_price as unknown as string) || 0,
        }));
        setPredictions(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this prediction?")) return;

    try {
      await predictAPI.delete(id);
      setPredictions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const filtered = predictions.filter((p) =>
    p.asin.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="animate-fade-in-up" style={styles.header}>
        <div>
          <h1 style={styles.title}>📋 Prediction History</h1>
          <p style={styles.subtitle}>View and manage all your past price predictions.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => router.push("/dashboard/predict")}
          style={{ padding: "12px 24px" }}
        >
          + New Prediction
        </button>
      </div>

      {/* Search */}
      <div className="animate-fade-in-up stagger-1" style={styles.searchRow}>
        <input
          type="text"
          className="input-field"
          placeholder="Search by ASIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
        <span style={styles.countBadge}>
          {filtered.length} prediction{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      <div className="animate-fade-in-up stagger-2">
        {loading ? (
          <div style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card-static" style={styles.empty}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>📭</div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>
              {search ? "No matching predictions" : "No predictions yet"}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {search
                ? "Try a different ASIN search term."
                : "Start by making your first prediction."}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((p) => (
              <div
                key={p.id}
                className="glass-card"
                style={styles.card}
                onClick={() => router.push(`/dashboard/prediction/${p.id}`)}
              >
                <div style={styles.cardTop}>
                  <div style={styles.asinBadge}>{p.asin}</div>
                  <div style={styles.cardActions}>
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
                      {p.trend === "decreasing" ? "📉" : "📈"} {p.trend}
                    </div>
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      style={styles.deleteBtn}
                      title="Delete prediction"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.cardRow}>
                    <div>
                      <div style={styles.cardLabel}>Best Buy Price</div>
                      <div style={styles.cardPrice}>₹{p.best_day_price?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={styles.cardLabel}>Best Date</div>
                      <div style={styles.cardDate}>
                        {new Date(p.best_day_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={styles.metricsRow}>
                    <span style={styles.metric}>MAE: ₹{p.mae?.toFixed(2)}</span>
                    <span style={styles.metricDivider}>·</span>
                    <span style={styles.metric}>RMSE: ₹{p.rmse?.toFixed(2)}</span>
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  {new Date(p.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 16,
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    color: "var(--text-secondary)",
    fontSize: "0.95rem",
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  countBadge: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: 16,
  },
  empty: {
    textAlign: "center",
    padding: "60px 24px",
  },
  card: {
    padding: "24px",
    cursor: "pointer",
  },
  cardTop: {
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
  cardActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  trendBadge: {
    borderRadius: 8,
    padding: "4px 12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "capitalize" as const,
  },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
    opacity: 0.5,
    transition: "opacity 0.2s",
    padding: 4,
  },
  cardBody: {},
  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "var(--accent-green)",
  },
  cardDate: {
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  metricsRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  metric: {
    fontSize: "0.78rem",
    color: "var(--text-muted)",
  },
  metricDivider: {
    color: "var(--text-muted)",
  },
  cardFooter: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    paddingTop: 14,
    borderTop: "1px solid var(--border-subtle)",
    marginTop: 14,
  },
};
