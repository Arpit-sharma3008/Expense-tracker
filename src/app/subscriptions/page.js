"use client";

import { useState } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";
import styles from "./subscriptions.module.css";

export default function SubscriptionsPage() {
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", frequency: "monthly", nextBillingDate: "", icon: "📦", active: true });

  const handleSubmit = (e) => {
    e.preventDefault();
    addSubscription({ ...form, amount: parseFloat(form.amount) });
    setForm({ name: "", amount: "", frequency: "monthly", nextBillingDate: "", icon: "📦", active: true });
    setShowForm(false);
  };

  const activeSubs = subscriptions.filter((s) => s.active);
  const inactiveSubs = subscriptions.filter((s) => !s.active);
  const monthlyTotal = activeSubs.reduce((s, sub) => s + sub.amount, 0);
  const yearlyTotal = monthlyTotal * 12;
  const formatCurrency = (v) => `₹${v.toLocaleString("en-IN")}`;

  const ICONS = ["📦", "🎬", "🎵", "☁️", "🏋️", "▶️", "📰", "🎮", "💻", "📱", "🔐", "📧"];

  return (
    <>
      <Header title="Subscriptions" subtitle="Track recurring payments" />

      <div className={styles.page}>
        {/* Overview */}
        <div className={styles.overviewRow}>
          <div className={styles.ovCard}>
            <span className={styles.ovIcon}>🔁</span>
            <div>
              <span className={styles.ovLabel}>Monthly Cost</span>
              <span className={styles.ovValue}>{formatCurrency(monthlyTotal)}</span>
            </div>
          </div>
          <div className={styles.ovCard}>
            <span className={styles.ovIcon}>📅</span>
            <div>
              <span className={styles.ovLabel}>Yearly Cost</span>
              <span className={styles.ovValue}>{formatCurrency(yearlyTotal)}</span>
            </div>
          </div>
          <div className={styles.ovCard}>
            <span className={styles.ovIcon}>✅</span>
            <div>
              <span className={styles.ovLabel}>Active</span>
              <span className={styles.ovValue}>{activeSubs.length}</span>
            </div>
          </div>
        </div>

        {/* Active List */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Active Subscriptions</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add</button>
          </div>
          <div className={styles.subList}>
            {activeSubs.map((sub) => (
              <div key={sub.id} className={styles.subItem}>
                <span className={styles.subIcon}>{sub.icon}</span>
                <div className={styles.subInfo}>
                  <span className={styles.subName}>{sub.name}</span>
                  <span className={styles.subMeta}>
                    Next: {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                  </span>
                </div>
                <span className={styles.subAmount}>{formatCurrency(sub.amount)}<small>/mo</small></span>
                <button className={styles.pauseBtn} onClick={() => updateSubscription(sub.id, { active: false })} title="Pause">⏸</button>
                <button className={styles.delBtn} onClick={() => deleteSubscription(sub.id)} title="Delete">×</button>
              </div>
            ))}
            {activeSubs.length === 0 && <p className={styles.emptyText}>No active subscriptions</p>}
          </div>
        </div>

        {/* Inactive */}
        {inactiveSubs.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Paused</h3>
            </div>
            <div className={styles.subList}>
              {inactiveSubs.map((sub) => (
                <div key={sub.id} className={`${styles.subItem} ${styles.inactive}`}>
                  <span className={styles.subIcon}>{sub.icon}</span>
                  <div className={styles.subInfo}>
                    <span className={styles.subName}>{sub.name}</span>
                    <span className={styles.subMeta}>Paused</span>
                  </div>
                  <span className={styles.subAmount}>{formatCurrency(sub.amount)}<small>/mo</small></span>
                  <button className={styles.resumeBtn} onClick={() => updateSubscription(sub.id, { active: true })} title="Resume">▶</button>
                  <button className={styles.delBtn} onClick={() => deleteSubscription(sub.id)} title="Delete">×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Subscription</h3>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <label className={styles.field}>
                <span>Icon</span>
                <div className={styles.iconPicker}>
                  {ICONS.map((ic) => (
                    <button type="button" key={ic} className={`${styles.iconOption} ${form.icon === ic ? styles.iconActive : ""}`} onClick={() => setForm({ ...form, icon: ic })}>{ic}</button>
                  ))}
                </div>
              </label>
              <label className={styles.field}>
                <span>Name</span>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Netflix" required autoFocus />
              </label>
              <label className={styles.field}>
                <span>Amount (₹)</span>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="649" min="0" required />
              </label>
              <label className={styles.field}>
                <span>Next Billing Date</span>
                <input type="date" value={form.nextBillingDate} onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })} />
              </label>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
