"use client";

import React from "react";
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
}

interface ForecastChartProps {
  historical: DataPoint[];
  forecast: DataPoint[];
}

export default function ForecastChart({ historical, forecast }: ForecastChartProps) {
  // Merge historical and forecast into a single dataset
  const chartData = [
    ...historical.map((d) => ({
      date: d.date,
      historical: d.price,
      forecast: null as number | null,
    })),
    // Add overlap point for continuity
    ...(historical.length > 0
      ? [
          {
            date: historical[historical.length - 1].date,
            historical: historical[historical.length - 1].price,
            forecast: forecast.length > 0 ? forecast[0].price : null,
          },
        ]
      : []),
    ...forecast.map((d) => ({
      date: d.date,
      historical: null as number | null,
      forecast: d.price,
    })),
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const formatPrice = (val: number) => `₹${val.toLocaleString()}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="historicalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          stroke="var(--text-muted)"
          tick={{ fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          tickLine={false}
          interval="preserveStartEnd"
        />

        <YAxis
          tickFormatter={formatPrice}
          stroke="var(--text-muted)"
          tick={{ fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          tickLine={false}
          width={80}
        />

        <Tooltip
          contentStyle={{
            background: "rgba(10, 17, 40, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            padding: "12px 16px",
          }}
          labelStyle={{ color: "var(--text-secondary)", marginBottom: 8, fontSize: "0.82rem" }}
          itemStyle={{ fontSize: "0.9rem" }}
          labelFormatter={(label: React.ReactNode) => formatDate(String(label))}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [
            formatPrice(Number(value)),
            name === "historical" ? "Historical Price" : "Forecast Price",
          ]}
        />

        <Legend
          wrapperStyle={{ paddingTop: 16, fontSize: "0.85rem" }}
          formatter={(value: string) =>
            value === "historical" ? "Historical Price" : "Forecast Price"
          }
        />

        <Area
          type="monotone"
          dataKey="historical"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#historicalGrad)"
          dot={false}
          activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 0 }}
          connectNulls={false}
        />

        <Area
          type="monotone"
          dataKey="forecast"
          stroke="#00d4ff"
          strokeWidth={2}
          strokeDasharray="5 5"
          fill="url(#forecastGrad)"
          dot={false}
          activeDot={{ r: 5, fill: "#00d4ff", strokeWidth: 0 }}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
