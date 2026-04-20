"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/expenses", label: "Expenses", icon: "💸" },
  { href: "/debts", label: "Debts", icon: "🏦" },
  { href: "/subscriptions", label: "Subscriptions", icon: "🔁" },
  { href: "/budgets", label: "Budgets", icon: "🎯" },
  { href: "/reports", label: "Reports", icon: "📄" },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <img src="/logo.svg" alt="SpendWise" className={styles.logoImg} />
          <div className={styles.logoText}>
            <h1>SpendWise</h1>
            <span>Smart Finance</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          <span className={styles.navLabel}>Menu</span>
          {NAV_ITEMS.map((item) => {
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

        {/* Bottom Section */}
        <div className={styles.bottom}>
          <button className={styles.themeToggle} onClick={toggleTheme}>
            <span className={styles.navIcon}>{theme === "light" ? "🌙" : "☀️"}</span>
            <span className={styles.navText}>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          </button>

          <div className={styles.userCard}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userEmail}>{displayEmail}</span>
            </div>
            <button className={styles.signOutBtn} onClick={signOut} title="Sign out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
