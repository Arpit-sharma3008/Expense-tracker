"use client";

import { useData } from "@/context/DataContext";
import styles from "./Header.module.css";

export default function Header({ title, subtitle }) {
  const { syncCloudData } = useData();

  const handleMenuClick = () => {
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  };

  const handleSyncClick = async () => {
    if (syncCloudData) {
      await syncCloudData();
      alert("☁️ Live Cloud Sync Complete! Phone and PC data updated.");
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={`${styles.menuBtn} hide-desktop`} onClick={handleMenuClick} aria-label="Toggle menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>

      <div className={styles.right}>
        <button
          onClick={handleSyncClick}
          title="Sync live data between Phone and PC"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "8px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
            fontWeight: "700",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          <span>☁️</span>
          <span className="hide-mobile">Sync Cloud</span>
        </button>
      </div>
    </header>
  );
}
