"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface DataPoint {
  date: string;
  price: number;
  price_lower?: number;
  price_upper?: number;
}

interface ForecastChartProps {
  historical: DataPoint[];
  forecast: DataPoint[];
}

export default function ForecastChart({ historical, forecast }: ForecastChartProps) {
  const { theme } = useTheme();

  // Check if we have confidence interval data
  const hasCI = forecast.some((d) => d.price_lower != null && d.price_upper != null);

  // Merge historical and forecast into a single dataset
  const chartData = [
    ...historical.map((d) => ({
      date: d.date,
      historical: d.price,
      forecast: null as number | null,
      ci_lower: null as number | null,
      ci_upper: null as number | null,
      ci_range: null as [number, number] | null,
    })),
    // Add overlap point for continuity
    ...(historical.length > 0
      ? [
          {
            date: historical[historical.length - 1].date,
            historical: historical[historical.length - 1].price,
            forecast: forecast.length > 0 ? forecast[0].price : null,
            ci_lower: hasCI && forecast.length > 0 ? forecast[0].price_lower ?? null : null,
            ci_upper: hasCI && forecast.length > 0 ? forecast[0].price_upper ?? null : null,
            ci_range: hasCI && forecast.length > 0
              ? [forecast[0].price_lower ?? 0, forecast[0].price_upper ?? 0] as [number, number]
              : null,
          },
        ]
      : []),
    ...forecast.map((d) => ({
      date: d.date,
      historical: null as number | null,
      forecast: d.price,
      ci_lower: hasCI ? (d.price_lower ?? null) : null,
      ci_upper: hasCI ? (d.price_upper ?? null) : null,
      ci_range: hasCI ? [d.price_lower ?? 0, d.price_upper ?? 0] as [number, number] : null,
    })),
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const formatPrice = (val: number) => `₹${val.toLocaleString()}`;

  const isDark = theme === "dark";

  const tooltipBg = isDark ? "rgba(10, 17, 40, 0.95)" : "rgba(255, 255, 255, 0.97)";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const gridStroke = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const axisStroke = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const textMuted = isDark ? "#64748b" : "#94a3b8";

  const historicalColor = isDark ? "#3b82f6" : "#2563eb";
  const forecastColor = isDark ? "#00d4ff" : "#0891b2";
  const ciColor = isDark ? "rgba(0, 212, 255, 0.1)" : "rgba(8, 145, 178, 0.08)";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="historicalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={historicalColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={historicalColor} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={forecastColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={forecastColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />

        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          stroke={textMuted}
          tick={{ fontSize: 11 }}
          axisLine={{ stroke: axisStroke }}
          tickLine={false}
          interval="preserveStartEnd"
        />

        <YAxis
          tickFormatter={formatPrice}
          stroke={textMuted}
          tick={{ fontSize: 11 }}
          axisLine={{ stroke: axisStroke }}
          tickLine={false}
          width={80}
        />

        <Tooltip
          contentStyle={{
            background: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: 12,
            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.1)",
            padding: "12px 16px",
            color: isDark ? "#f1f5f9" : "#0f172a",
          }}
          labelStyle={{ color: textMuted, marginBottom: 8, fontSize: "0.82rem" }}
          itemStyle={{ fontSize: "0.9rem" }}
          labelFormatter={(label: React.ReactNode) => formatDate(String(label))}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => {
            if (name === "ci_range" || name === "ci_lower" || name === "ci_upper") {
              return [null, null]; // hide CI from tooltip
            }
            const label = name === "historical" ? "Historical Price" : "Forecast Price";
            return [formatPrice(Number(value)), label];
          }}
        />

        <Legend
          wrapperStyle={{ paddingTop: 16, fontSize: "0.85rem" }}
          formatter={(value: string) => {
            if (value === "historical") return "Historical Price";
            if (value === "forecast") return "Forecast Price";
            if (value === "ci_upper") return "90% Confidence Band";
            return "";
          }}
        />

        {/* Confidence interval band (rendered behind forecast line) */}
        {hasCI && (
          <Area
            type="monotone"
            dataKey="ci_upper"
            stroke="none"
            fill={ciColor}
            dot={false}
            activeDot={false}
            connectNulls={false}
            legendType="none"
          />
        )}
        {hasCI && (
          <Area
            type="monotone"
            dataKey="ci_lower"
            stroke="none"
            fill={isDark ? "#0a1128" : "#ffffff"}
            dot={false}
            activeDot={false}
            connectNulls={false}
            legendType="none"
          />
        )}

        <Area
          type="monotone"
          dataKey="historical"
          stroke={historicalColor}
          strokeWidth={2}
          fill="url(#historicalGrad)"
          dot={false}
          activeDot={{ r: 5, fill: historicalColor, strokeWidth: 0 }}
          connectNulls={false}
        />

        <Area
          type="monotone"
          dataKey="forecast"
          stroke={forecastColor}
          strokeWidth={2}
          strokeDasharray="5 5"
          fill="url(#forecastGrad)"
          dot={false}
          activeDot={{ r: 5, fill: forecastColor, strokeWidth: 0 }}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
