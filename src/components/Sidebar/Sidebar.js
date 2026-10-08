"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import styles from "./Sidebar.module.css";

const MANAGER_NAV = [
  { href: "/", label: "Dashboard (P&L)", icon: "📊" },
  { href: "/sales", label: "Daily Sales POS", icon: "🛒" },
  { href: "/expenses", label: "Expense & Bills", icon: "🧾" },
  { href: "/inventory", label: "Raw Material Stock", icon: "📦" },
  { href: "/wastage", label: "Wastage Log", icon: "🗑️" },
  { href: "/closure", label: "Cash Drawer", icon: "💵" },
  { href: "/vendors", label: "Vendors & Dues", icon: "👥" },
  { href: "/menu", label: "Menu & SKUs", icon: "🏷️" },
  { href: "/staff", label: "Staff & Team", icon: "👨‍🍳" },
  { href: "/reports", label: "Reports & Export", icon: "📄" },
];

const EMPLOYEE_NAV = [
  { href: "/sales", label: "Daily Sales POS", icon: "🛒" },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { role, activeStaff, signOut } = useAuth();

  const isManager = role === "manager";
  const navItems = isManager ? MANAGER_NAV : EMPLOYEE_NAV;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div style={{ fontSize: "1.8rem", marginRight: "8px" }}>🏪</div>
          <div className={styles.logoText}>
            <h1 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0, background: "linear-gradient(135deg, #10b981, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>StallMaster</h1>
            <span style={{ fontSize: "0.75rem", color: isManager ? "#10b981" : "#3b82f6", fontWeight: "600" }}>
              {isManager ? "👑 Manager Mode" : "👨‍🍳 Cashier Terminal"}
            </span>
          </div>
        </div>

        {/* STAFF SESSION INFO TAB (Displayed when Staff is logged in) */}
        {!isManager && activeStaff && (
          <div style={{
            margin: "0 12px 16px 12px",
            padding: "12px",
            background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.1))",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: "12px",
          }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
              👤 Staff Session Info
            </div>
            <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--text-primary)" }}>
              {activeStaff.name}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
              Ref Code: <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{activeStaff.code}</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "600", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} /> Shift Active
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={styles.nav}>
          <span className={styles.navLabel}>{isManager ? "Manager Navigation" : "Cashier Menu"}</span>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                onClick={onClose}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navText}>{item.label}</span>
                {isActive && <div className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section & Logout */}
        <div className={styles.bottom}>
          <button
            onClick={signOut}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              background: "rgba(239,68,68,0.15)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.3)",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            🚪 {isManager ? "Sign Out / Lock Account" : "End Shift & Sign Out"}
          </button>

          <button className={styles.themeToggle} onClick={toggleTheme}>
            <span className={styles.navIcon}>{theme === "light" ? "🌙" : "☀️"}</span>
            <span className={styles.navText}>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
