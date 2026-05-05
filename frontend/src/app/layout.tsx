import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "PriceCast AI — Amazon Product Price Forecast",
  description:
    "Predict future Amazon product prices using advanced AI time-series forecasting. Get 30-day price predictions, best buy recommendations, and trend analysis powered by Prophet ML.",
  keywords: "amazon, price forecast, prediction, machine learning, prophet, price tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {/* Decorative orbs */}
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
