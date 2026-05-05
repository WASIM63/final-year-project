"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⚡" },
  { href: "/dashboard/predict", label: "New Prediction", icon: "🔮" },
  { href: "/dashboard/history", label: "History", icon: "📋" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarInner}>
          {/* Logo */}
          <Link href="/dashboard" style={styles.logo}>
            <span style={{ fontSize: "1.5rem" }}>📈</span>
            <span style={styles.logoText}>PriceCast AI</span>
          </Link>

          {/* Nav */}
          <nav style={styles.nav}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...styles.navLink,
                    ...(isActive ? styles.navLinkActive : {}),
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div style={styles.userSection}>
            <div style={styles.avatar}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userEmail}>{user?.email}</div>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              style={styles.logoutBtn}
              title="Logout"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        {/* Top bar (mobile) */}
        <div style={styles.topBar}>
          <span style={{ fontSize: "1.25rem" }}>📈</span>
          <span style={styles.topBarTitle}>PriceCast AI</span>
        </div>

        <div style={styles.content}>
          {children}
        </div>

        {/* Mobile bottom nav */}
        <div style={styles.mobileNav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...styles.mobileNavLink,
                  ...(isActive ? styles.mobileNavLinkActive : {}),
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                <span style={styles.mobileNavLabel}>{item.label.split(" ").pop()}</span>
              </Link>
            );
          })}
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            style={styles.mobileNavLink}
          >
            <span style={{ fontSize: "1.2rem" }}>🚪</span>
            <span style={styles.mobileNavLabel}>Logout</span>
          </button>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "flex",
    minHeight: "100vh",
  },
  sidebar: {
    width: "var(--sidebar-width)",
    borderRight: "1px solid var(--border-subtle)",
    background: "rgba(5, 10, 24, 0.9)",
    backdropFilter: "blur(20px)",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
  },
  sidebarInner: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "24px 16px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    marginBottom: 40,
    paddingLeft: 8,
  },
  logoText: {
    fontSize: "1.15rem",
    fontWeight: 700,
    background: "linear-gradient(135deg, #00d4ff, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flex: 1,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 12,
    color: "var(--text-secondary)",
    textDecoration: "none",
    fontSize: "0.92rem",
    fontWeight: 500,
    transition: "all 0.2s",
  },
  navLinkActive: {
    background: "rgba(99, 102, 241, 0.12)",
    color: "var(--accent-cyan)",
    borderLeft: "3px solid var(--accent-cyan)",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 12px",
    borderTop: "1px solid var(--border-subtle)",
    marginTop: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "var(--gradient-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.85rem",
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: "0.85rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userEmail: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  logoutBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: 6,
    borderRadius: 8,
    transition: "color 0.2s",
    flexShrink: 0,
  },
  main: {
    flex: 1,
    marginLeft: "var(--sidebar-width)",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  topBar: {
    display: "none",
    alignItems: "center",
    gap: 10,
    padding: "16px 20px",
    borderBottom: "1px solid var(--border-subtle)",
    background: "rgba(5, 10, 24, 0.8)",
    backdropFilter: "blur(12px)",
  },
  topBarTitle: {
    fontWeight: 700,
    background: "linear-gradient(135deg, #00d4ff, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  content: {
    flex: 1,
    padding: "32px 32px 100px",
    maxWidth: 1200,
    width: "100%",
  },
  mobileNav: {
    display: "none",
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "rgba(5, 10, 24, 0.95)",
    backdropFilter: "blur(20px)",
    borderTop: "1px solid var(--border-subtle)",
    padding: "8px 16px",
    justifyContent: "space-around",
    zIndex: 50,
  },
  mobileNavLink: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "8px 12px",
    color: "var(--text-muted)",
    textDecoration: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  mobileNavLinkActive: {
    color: "var(--accent-cyan)",
  },
  mobileNavLabel: {
    fontSize: "0.65rem",
    fontWeight: 500,
  },
};

// Add responsive CSS via a style tag (since we're using inline styles)
if (typeof document !== "undefined") {
  const styleId = "dashboard-responsive";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @media (max-width: 768px) {
        aside[style] { display: none !important; }
        main[style] { margin-left: 0 !important; }
        div[style*="topBar"] { display: flex !important; }
      }
    `;
    document.head.appendChild(style);
  }
}
