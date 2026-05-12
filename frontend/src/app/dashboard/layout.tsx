"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import {
  Zap,
  Sparkles,
  ClipboardList,
  TrendingUp,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <Zap size={18} /> },
  { href: "/dashboard/predict", label: "New Prediction", icon: <Sparkles size={18} /> },
  { href: "/dashboard/history", label: "History", icon: <ClipboardList size={18} /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
      <aside className="dashboard-sidebar" style={styles.sidebar}>
        <div style={styles.sidebarInner}>
          {/* Logo */}
          <Link href="/dashboard" style={styles.logo}>
            <div style={styles.logoIconWrap}>
              <TrendingUp size={18} strokeWidth={2.5} />
            </div>
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
                  <span style={{ display: "flex", alignItems: "center", color: isActive ? "var(--accent-cyan)" : "var(--text-muted)" }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle + User section */}
          <div style={styles.bottomSection}>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              style={{ width: "100%", justifyContent: "flex-start", gap: 12, padding: "10px 16px", borderRadius: 12 }}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              <span style={{ fontSize: "0.88rem", fontWeight: 500 }}>
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </button>

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
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main" style={styles.main}>
        {/* Top bar (mobile) */}
        <div className="dashboard-topbar" style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <div style={styles.logoIconWrapSmall}>
              <TrendingUp size={16} strokeWidth={2.5} />
            </div>
            <span style={styles.topBarTitle}>PriceCast AI</span>
          </div>
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            style={{ width: 36, height: 36, borderRadius: 10 }}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="dashboard-content" style={styles.content}>
          {children}
        </div>

        {/* Mobile bottom nav */}
        <div className="dashboard-mobile-nav" style={styles.mobileNav}>
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
                <span style={{ display: "flex", color: isActive ? "var(--accent-cyan)" : "inherit" }}>
                  {item.icon}
                </span>
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
            <span style={{ display: "flex" }}>
              <LogOut size={18} />
            </span>
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
    background: "var(--sidebar-bg)",
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
  logoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    background: "var(--gradient-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    flexShrink: 0,
  },
  logoIconWrapSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "var(--gradient-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    flexShrink: 0,
  },
  logoText: {
    fontSize: "1.15rem",
    fontWeight: 700,
    background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
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
  bottomSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    borderTop: "1px solid var(--border-subtle)",
    paddingTop: 16,
    marginTop: 8,
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 4px",
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
    color: "white",
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
    display: "flex",
    alignItems: "center",
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
    justifyContent: "space-between",
    gap: 10,
    padding: "16px 20px",
    borderBottom: "1px solid var(--border-subtle)",
    background: "var(--topbar-bg)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 40,
  },
  topBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  topBarTitle: {
    fontWeight: 700,
    background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
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
    background: "var(--mobile-nav-bg)",
    backdropFilter: "blur(20px)",
    borderTop: "1px solid var(--border-subtle)",
    padding: "8px 8px",
    paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
    justifyContent: "space-around",
    zIndex: 50,
  },
  mobileNavLink: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "8px 8px",
    color: "var(--text-muted)",
    textDecoration: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    minWidth: 0,
  },
  mobileNavLinkActive: {
    color: "var(--accent-cyan)",
  },
  mobileNavLabel: {
    fontSize: "0.6rem",
    fontWeight: 500,
  },
};
