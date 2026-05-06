"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { predictAPI } from "@/lib/api";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  BadgeDollarSign,
  TrendingDown,
  TrendingUp,
  Ruler,
  Triangle,
  BarChart3,
  Calendar,
  Award,
  Package,
  Database,
  Cloud,
  Sparkles,
} from "lucide-react";

// Lazy load Recharts to avoid SSR issues
const ForecastChart = dynamic(() => import("@/components/ForecastChart"), { ssr: false });

interface ForecastPoint {
  date: string;
  price: number;
  price_lower?: number;
  price_upper?: number;
}

interface PredictionDetail {
  id: number;
  asin: string;
  amazon_url: string;
  product_title: string | null;
  product_image_url: string | null;
  forecast_data: ForecastPoint[];
  historical_data: ForecastPoint[];
  best_day_date: string;
  best_day_price: number;
  trend: string;
  mae: number;
  rmse: number;
  data_source: string | null;
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
          p.forecast_data = p.forecast_data.map((d: ForecastPoint) => ({
            ...d,
            price: parseFloat(d.price as unknown as string) || 0,
            price_lower: d.price_lower != null ? parseFloat(d.price_lower as unknown as string) || 0 : undefined,
            price_upper: d.price_upper != null ? parseFloat(d.price_upper as unknown as string) || 0 : undefined,
          }));
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
        <div className="skeleton" style={{ height: 40, width: "60%", maxWidth: 300, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 300, marginBottom: 24, borderRadius: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="glass-card-static" style={{ padding: "40px 20px", textAlign: "center" }}>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Triangle size={28} color="var(--accent-red)" />
          </div>
        </div>
        <h2 style={{ marginBottom: 8, fontSize: "1.2rem" }}>Prediction Not Found</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: "0.9rem" }}>{error || "This prediction does not exist."}</p>
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
          <ChevronLeft size={18} />
          Back
        </button>
        <div style={styles.headerContent}>
          {prediction.product_image_url && (
            <div style={styles.productImageWrap}>
              <img
                src={prediction.product_image_url}
                alt={prediction.product_title || "Product"}
                style={styles.productImage}
              />
            </div>
          )}
          <div style={styles.headerInfo}>
            {prediction.product_title ? (
              <h1 className="detail-page-title" style={styles.pageTitle}>
                {prediction.product_title}
                <span style={styles.asinBadge}>{prediction.asin}</span>
              </h1>
            ) : (
              <h1 className="detail-page-title" style={styles.pageTitle}>
                Prediction Results
                <span style={styles.asinBadge}>{prediction.asin}</span>
              </h1>
            )}
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
            {!prediction.product_title && (
              <p style={styles.noProductInfo}>
                <Package size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Product details could not be fetched from Amazon
              </p>
            )}
            {prediction.data_source && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
                padding: "4px 12px",
                borderRadius: 8,
                fontSize: "0.75rem",
                fontWeight: 600,
                background: prediction.data_source === "scraped"
                  ? "rgba(245,158,11,0.12)"
                  : prediction.data_source === "mixed"
                  ? "rgba(139,92,246,0.12)"
                  : "rgba(16,185,129,0.12)",
                color: prediction.data_source === "scraped"
                  ? "var(--accent-amber)"
                  : prediction.data_source === "mixed"
                  ? "var(--accent-purple)"
                  : "var(--accent-green)",
              }}>
                {prediction.data_source === "scraped" ? <Cloud size={13} /> :
                 prediction.data_source === "mixed" ? <Sparkles size={13} /> :
                 <Database size={13} />}
                {prediction.data_source === "scraped" ? "Live Scraped" :
                 prediction.data_source === "mixed" ? "DB + Live Data" :
                 "Database"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="animate-fade-in-up stagger-1 detail-metrics-row" style={styles.metricsRow}>
        {/* Best Buy Day */}
        <div className="glass-card-static detail-metric-card" style={{ ...styles.metricCard, borderColor: "rgba(16,185,129,0.3)" }}>
          <div style={{ ...styles.metricIcon, background: "rgba(16,185,129,0.12)", color: "var(--accent-green)" }}>
            <BadgeDollarSign size={22} />
          </div>
          <div style={styles.metricLabel}>Best Day to Buy</div>
          <div className="detail-metric-value" style={{ ...styles.metricValue, color: "var(--accent-green)" }}>
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
          className="glass-card-static detail-metric-card"
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
              color:
                prediction.trend === "decreasing"
                  ? "var(--accent-green)"
                  : "var(--accent-red)",
            }}
          >
            {prediction.trend === "decreasing" ? <TrendingDown size={22} /> : <TrendingUp size={22} />}
          </div>
          <div style={styles.metricLabel}>Price Trend</div>
          <div
            className="detail-metric-value"
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
        <div className="glass-card-static detail-metric-card" style={{ ...styles.metricCard, borderColor: "rgba(99,102,241,0.3)" }}>
          <div style={{ ...styles.metricIcon, background: "rgba(99,102,241,0.12)", color: "var(--accent-indigo)" }}>
            <Ruler size={22} />
          </div>
          <div style={styles.metricLabel}>MAE (Error)</div>
          <div className="detail-metric-value" style={{ ...styles.metricValue, color: "var(--accent-indigo)" }}>
            ₹{prediction.mae.toFixed(2)}
          </div>
          <div style={styles.metricSub}>Mean Absolute Error</div>
        </div>

        {/* RMSE */}
        <div className="glass-card-static detail-metric-card" style={{ ...styles.metricCard, borderColor: "rgba(139,92,246,0.3)" }}>
          <div style={{ ...styles.metricIcon, background: "rgba(139,92,246,0.12)", color: "var(--accent-purple)" }}>
            <Triangle size={22} />
          </div>
          <div style={styles.metricLabel}>RMSE (Error)</div>
          <div className="detail-metric-value" style={{ ...styles.metricValue, color: "var(--accent-purple)" }}>
            ₹{prediction.rmse.toFixed(2)}
          </div>
          <div style={styles.metricSub}>Root Mean Squared Error</div>
        </div>
      </div>

      {/* Chart */}
      <div className="animate-fade-in-up stagger-2 glass-card-static detail-chart-card" style={styles.chartCard}>
        <h2 className="detail-section-title" style={styles.chartTitle}>
          <BarChart3 size={20} style={{ marginRight: 8, verticalAlign: "middle" }} />
          Price Forecast Chart
        </h2>
        <p style={styles.chartSub}>Historical prices (blue) vs AI-predicted prices (cyan)</p>
        <div className="detail-chart-wrap" style={styles.chartWrap}>
          <ForecastChart
            historical={prediction.historical_data}
            forecast={prediction.forecast_data}
          />
        </div>
      </div>

      {/* Historical stats */}
      <div className="animate-fade-in-up stagger-3" style={styles.statsSection}>
        <h2 className="detail-section-title" style={styles.sectionTitle}>
          <TrendingUp size={20} style={{ marginRight: 8, verticalAlign: "middle" }} />
          Historical Price Statistics
        </h2>
        <div className="detail-stats-grid" style={styles.statsGrid}>
          {[
            { label: "Average Price", value: `₹${avgPrice.toFixed(2)}`, color: "var(--accent-cyan)" },
            { label: "Highest Price", value: `₹${maxPrice.toFixed(2)}`, color: "var(--accent-red)" },
            { label: "Lowest Price", value: `₹${minPrice.toFixed(2)}`, color: "var(--accent-green)" },
            { label: "Data Points", value: `${prediction.historical_data.length} days`, color: "var(--accent-amber)" },
          ].map((s, i) => (
            <div key={i} className="glass-card detail-small-stat" style={styles.smallStat}>
              <div className="detail-small-stat-value" style={{ ...styles.smallStatValue, color: s.color }}>{s.value}</div>
              <div style={styles.smallStatLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast table */}
      <div className="animate-fade-in-up stagger-4 glass-card-static detail-table-card" style={styles.tableCard}>
        <h2 className="detail-section-title" style={styles.sectionTitle}>
          <Calendar size={20} style={{ marginRight: 8, verticalAlign: "middle" }} />
          30-Day Forecast Data
        </h2>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th className="detail-th" style={styles.th}>Date</th>
                <th className="detail-th" style={styles.th}>Predicted Price</th>
                <th className="detail-th" style={styles.th}>Status</th>
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
                    <td className="detail-td" style={styles.td}>
                      {new Date(row.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="detail-td" style={{ ...styles.td, fontWeight: 600 }}>₹{row.price.toLocaleString()}</td>
                    <td className="detail-td" style={styles.td}>
                      {isBest && (
                        <span style={styles.bestBadge}>
                          <Award size={14} style={{ marginRight: 4 }} />
                          Best Day
                        </span>
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
    gap: 4,
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
  headerContent: {
    display: "flex",
    gap: 20,
    alignItems: "flex-start",
  },
  productImageWrap: {
    width: 130,
    height: 130,
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid var(--border-subtle)",
    background: "white",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    padding: 8,
  },
  headerInfo: {},
  noProductInfo: {
    fontSize: "0.82rem",
    color: "var(--text-muted)",
    marginTop: 6,
    display: "inline-flex",
    alignItems: "center",
  },
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
    display: "inline-flex",
    alignItems: "center",
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
    display: "inline-flex",
    alignItems: "center",
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
    display: "inline-flex",
    alignItems: "center",
  },
};
