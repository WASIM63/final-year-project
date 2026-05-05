"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { predictAPI } from "@/lib/api";
import dynamic from "next/dynamic";

// Lazy load Recharts to avoid SSR issues
const ForecastChart = dynamic(() => import("@/components/ForecastChart"), { ssr: false });

interface ForecastPoint {
  date: string;
  price: number;
}

interface PredictionDetail {
  id: number;
  asin: string;
  amazon_url: string;
  forecast_data: ForecastPoint[];
  historical_data: ForecastPoint[];
  best_day_date: string;
  best_day_price: number;
  trend: string;
  mae: number;
  rmse: number;
  created_at: string;
}

export default function PredictionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [prediction, setPrediction] = useState<PredictionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    predictAPI
      .getOne(parseInt(resolvedParams.id))
      .then((res) => {
        const p = res.data.prediction;
        // Ensure numeric fields are actual numbers (API may return strings)
        p.mae = parseFloat(p.mae) || 0;
        p.rmse = parseFloat(p.rmse) || 0;
        p.best_day_price = parseFloat(p.best_day_price) || 0;
        if (p.historical_data) {
          p.historical_data = p.historical_data.map((d: ForecastPoint) => ({ ...d, price: parseFloat(d.price as unknown as string) || 0 }));
        }
        if (p.forecast_data) {
          p.forecast_data = p.forecast_data.map((d: ForecastPoint) => ({ ...d, price: parseFloat(d.price as unknown as string) || 0 }));
        }
        setPrediction(p);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load prediction");
      })
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 40, width: 300, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 400, marginBottom: 24 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 120 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="glass-card-static" style={{ padding: 48, textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>⚠️</div>
        <h2 style={{ marginBottom: 8 }}>Prediction Not Found</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>{error || "This prediction does not exist."}</p>
        <button className="btn-primary" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const historicalPrices = prediction.historical_data.map((d) => d.price);
  const avgPrice = historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length;
  const maxPrice = Math.max(...historicalPrices);
  const minPrice = Math.min(...historicalPrices);

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-in-up" style={styles.header}>
        <button onClick={() => router.push("/dashboard")} style={styles.backBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
        <div style={styles.headerInfo}>
          <h1 style={styles.pageTitle}>
            Prediction Results
            <span style={styles.asinBadge}>{prediction.asin}</span>
          </h1>
          <p style={styles.dateInfo}>
            Generated on{" "}
            {new Date(prediction.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="animate-fade-in-up stagger-1" style={styles.metricsRow}>
        {/* Best Buy Day */}
        <div className="glass-card-static" style={{ ...styles.metricCard, borderColor: "rgba(16,185,129,0.3)" }}>
          <div style={{ ...styles.metricIcon, background: "rgba(16,185,129,0.12)" }}>💰</div>
          <div style={styles.metricLabel}>Best Day to Buy</div>
          <div style={{ ...styles.metricValue, color: "var(--accent-green)" }}>
            {new Date(prediction.best_day_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
          <div style={styles.metricSub}>₹{prediction.best_day_price.toLocaleString()}</div>
        </div>

        {/* Trend */}
        <div
          className="glass-card-static"
          style={{
            ...styles.metricCard,
            borderColor:
              prediction.trend === "decreasing"
                ? "rgba(16,185,129,0.3)"
                : "rgba(239,68,68,0.3)",
          }}
        >
          <div
            style={{
              ...styles.metricIcon,
              background:
                prediction.trend === "decreasing"
                  ? "rgba(16,185,129,0.12)"
                  : "rgba(239,68,68,0.12)",
            }}
          >
            {prediction.trend === "decreasing" ? "📉" : "📈"}
          </div>
          <div style={styles.metricLabel}>Price Trend</div>
          <div
            style={{
              ...styles.metricValue,
              color:
                prediction.trend === "decreasing"
                  ? "var(--accent-green)"
                  : "var(--accent-red)",
            }}
          >
            {prediction.trend === "decreasing" ? "Decreasing" : "Increasing"}
          </div>
          <div style={styles.metricSub}>
            {prediction.trend === "decreasing"
              ? "Good time to wait & buy"
              : "Consider buying now"}
          </div>
        </div>

        {/* MAE */}
        <div className="glass-card-static" style={{ ...styles.metricCard, borderColor: "rgba(99,102,241,0.3)" }}>
          <div style={{ ...styles.metricIcon, background: "rgba(99,102,241,0.12)" }}>📏</div>
          <div style={styles.metricLabel}>MAE (Error)</div>
          <div style={{ ...styles.metricValue, color: "var(--accent-indigo)" }}>
            ₹{prediction.mae.toFixed(2)}
          </div>
          <div style={styles.metricSub}>Mean Absolute Error</div>
        </div>

        {/* RMSE */}
        <div className="glass-card-static" style={{ ...styles.metricCard, borderColor: "rgba(139,92,246,0.3)" }}>
          <div style={{ ...styles.metricIcon, background: "rgba(139,92,246,0.12)" }}>📐</div>
          <div style={styles.metricLabel}>RMSE (Error)</div>
          <div style={{ ...styles.metricValue, color: "var(--accent-purple)" }}>
            ₹{prediction.rmse.toFixed(2)}
          </div>
          <div style={styles.metricSub}>Root Mean Squared Error</div>
        </div>
      </div>

      {/* Chart */}
      <div className="animate-fade-in-up stagger-2 glass-card-static" style={styles.chartCard}>
        <h2 style={styles.chartTitle}>📊 Price Forecast Chart</h2>
        <p style={styles.chartSub}>Historical prices (blue) vs AI-predicted prices (cyan)</p>
        <div style={styles.chartWrap}>
          <ForecastChart
            historical={prediction.historical_data}
            forecast={prediction.forecast_data}
          />
        </div>
      </div>

      {/* Historical stats */}
      <div className="animate-fade-in-up stagger-3" style={styles.statsSection}>
        <h2 style={styles.sectionTitle}>📈 Historical Price Statistics</h2>
        <div style={styles.statsGrid}>
          {[
            { label: "Average Price", value: `₹${avgPrice.toFixed(2)}`, color: "var(--accent-cyan)" },
            { label: "Highest Price", value: `₹${maxPrice.toFixed(2)}`, color: "var(--accent-red)" },
            { label: "Lowest Price", value: `₹${minPrice.toFixed(2)}`, color: "var(--accent-green)" },
            { label: "Data Points", value: `${prediction.historical_data.length} days`, color: "var(--accent-amber)" },
          ].map((s, i) => (
            <div key={i} className="glass-card" style={styles.smallStat}>
              <div style={{ ...styles.smallStatValue, color: s.color }}>{s.value}</div>
              <div style={styles.smallStatLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast table */}
      <div className="animate-fade-in-up stagger-4 glass-card-static" style={styles.tableCard}>
        <h2 style={styles.sectionTitle}>📅 30-Day Forecast Data</h2>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Predicted Price</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {prediction.forecast_data.map((row, i) => {
                const isBest = row.date === prediction.best_day_date;
                return (
                  <tr
                    key={i}
                    style={{
                      ...styles.tr,
                      ...(isBest ? styles.trBest : {}),
                    }}
                  >
                    <td style={styles.td}>
                      {new Date(row.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>₹{row.price.toLocaleString()}</td>
                    <td style={styles.td}>
                      {isBest && (
                        <span style={styles.bestBadge}>⭐ Best Day</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: 32,
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    padding: "6px 0",
    marginBottom: 12,
    transition: "color 0.2s",
  },
  headerInfo: {},
  pageTitle: {
    fontSize: "1.75rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
    marginBottom: 6,
  },
  asinBadge: {
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 8,
    padding: "4px 14px",
    fontSize: "0.82rem",
    fontWeight: 600,
    fontFamily: "monospace",
    color: "var(--accent-indigo)",
  },
  dateInfo: {
    color: "var(--text-muted)",
    fontSize: "0.9rem",
  },
  metricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 32,
  },
  metricCard: {
    padding: "24px",
    textAlign: "center" as const,
    borderWidth: 1,
    borderStyle: "solid",
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.3rem",
    margin: "0 auto 12px",
  },
  metricLabel: {
    fontSize: "0.78rem",
    color: "var(--text-muted)",
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  metricValue: {
    fontSize: "1.3rem",
    fontWeight: 700,
    marginBottom: 4,
  },
  metricSub: {
    fontSize: "0.78rem",
    color: "var(--text-muted)",
  },
  chartCard: {
    padding: "28px",
    marginBottom: 32,
  },
  chartTitle: {
    fontSize: "1.15rem",
    fontWeight: 600,
    marginBottom: 4,
  },
  chartSub: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    marginBottom: 20,
  },
  chartWrap: {
    height: 400,
    width: "100%",
  },
  statsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: "1.15rem",
    fontWeight: 600,
    marginBottom: 16,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  smallStat: {
    padding: "20px",
    textAlign: "center" as const,
  },
  smallStatValue: {
    fontSize: "1.25rem",
    fontWeight: 700,
    marginBottom: 4,
  },
  smallStatLabel: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
  },
  tableCard: {
    padding: "28px",
    marginBottom: 40,
  },
  tableWrap: {
    overflowX: "auto" as const,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.9rem",
  },
  th: {
    textAlign: "left" as const,
    padding: "12px 16px",
    borderBottom: "1px solid var(--border-medium)",
    color: "var(--text-muted)",
    fontSize: "0.82rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  tr: {
    borderBottom: "1px solid var(--border-subtle)",
    transition: "background 0.2s",
  },
  trBest: {
    background: "rgba(16,185,129,0.05)",
  },
  td: {
    padding: "12px 16px",
    color: "var(--text-primary)",
  },
  bestBadge: {
    background: "rgba(16,185,129,0.12)",
    color: "var(--accent-green)",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: "0.78rem",
    fontWeight: 600,
  },
};
