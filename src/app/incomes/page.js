"use client";

import { useState } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";
import styles from "./incomes.module.css";

export default function IncomesPage() {
  const { incomes, addIncome, deleteIncome } = useData();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ source: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await addIncome({ ...form, amount: parseFloat(form.amount) });
    setForm({ source: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "" });
    setShowModal(false);
    setIsSubmitting(false);
  };

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const formatCurrency = (v) => `₹${v.toLocaleString("en-IN")}`;

  return (
    <>
      <Header title="Incomes" subtitle="Track your salary, freelance, and other earnings" />
      
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.stats}>
            <span className={styles.statLabel}>Total Income</span>
            <span className={styles.statValue}>{formatCurrency(totalIncome)}</span>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Income
          </button>
        </div>

        {incomes.length === 0 ? (
          <div className={styles.emptyState}>
            <span style={{ fontSize: "3rem" }}>💵</span>
            <h3>No income recorded yet</h3>
            <p>Add your salary or other earnings to get started.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {incomes.map((inc) => (
              <div key={inc.id} className={styles.incomeCard}>
                <div className={styles.icon}>💰</div>
                <div className={styles.info}>
                  <h4>{inc.source}</h4>
                  <span className={styles.date}>{new Date(inc.date).toLocaleDateString("en-IN")}</span>
                  {inc.notes && <span className={styles.notes}>{inc.notes}</span>}
                </div>
                <div className={styles.amountWrap}>
                  <span className={styles.amount}>+{formatCurrency(inc.amount)}</span>
                  <button className={styles.delBtn} onClick={() => deleteIncome(inc.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Income</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <span>Source Name</span>
                <input type="text" required placeholder="e.g. Salary, Freelance" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
              </div>
              <div className={styles.field}>
                <span>Amount (₹)</span>
                <input type="number" required min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className={styles.field}>
                <span>Date</span>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className={styles.field}>
                <span>Notes (Optional)</span>
                <input type="text" placeholder="Additional details..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Income"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
