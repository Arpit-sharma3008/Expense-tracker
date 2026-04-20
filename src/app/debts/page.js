"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";
import styles from "./debts.module.css";

const DEBT_TYPES = [
  { value: "credit_card", label: "Credit Card" },
  { value: "personal_loan", label: "Personal Loan" },
  { value: "student_loan", label: "Student Loan" },
  { value: "car_loan", label: "Car Loan" },
  { value: "home_loan", label: "Home Loan" },
  { value: "other", label: "Other" },
];

function calculatePayoff(balance, rate, payment) {
  if (payment <= 0 || balance <= 0) return { months: 0, totalInterest: 0 };
  const monthlyRate = rate / 100 / 12;
  let remaining = balance;
  let months = 0;
  let totalInterest = 0;
  while (remaining > 0 && months < 600) {
    const interest = remaining * monthlyRate;
    totalInterest += interest;
    remaining = remaining + interest - payment;
    months++;
    if (remaining < 0) remaining = 0;
  }
  return { months, totalInterest: Math.round(totalInterest) };
}

export default function DebtsPage() {
  const { debts, addDebt, updateDebt, deleteDebt } = useData();
  const [showForm, setShowForm] = useState(false);
  const [strategy, setStrategy] = useState("avalanche");
  const [extraPayment, setExtraPayment] = useState(2000);

  const [form, setForm] = useState({
    name: "",
    type: "credit_card",
    principal: "",
    remainingBalance: "",
    interestRate: "",
    minimumPayment: "",
    dueDate: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addDebt({
      ...form,
      principal: parseFloat(form.principal),
      remainingBalance: parseFloat(form.remainingBalance),
      interestRate: parseFloat(form.interestRate),
      minimumPayment: parseFloat(form.minimumPayment),
    });
    setForm({ name: "", type: "credit_card", principal: "", remainingBalance: "", interestRate: "", minimumPayment: "", dueDate: "" });
    setShowForm(false);
  };

  /* ---- Smart Strategy ---- */
  const sortedDebts = useMemo(() => {
    const copy = [...debts];
    if (strategy === "avalanche") {
      copy.sort((a, b) => b.interestRate - a.interestRate);
    } else {
      copy.sort((a, b) => a.remainingBalance - b.remainingBalance);
    }
    return copy;
  }, [debts, strategy]);

  const totalDebt = debts.reduce((s, d) => s + d.remainingBalance, 0);
  const totalMinPayment = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const totalPrincipal = debts.reduce((s, d) => s + d.principal, 0);
  const overallProgress = totalPrincipal > 0 ? ((totalPrincipal - totalDebt) / totalPrincipal) * 100 : 0;

  const formatCurrency = (v) => `₹${v.toLocaleString("en-IN")}`;

  return (
    <>
      <Header title="Debt Management" subtitle="Smart strategies to become debt-free" />

      <div className={styles.page}>
        {/* ---- Overview Cards ---- */}
        <div className={styles.overviewGrid}>
          <div className={styles.overviewCard}>
            <span className={styles.ovLabel}>Total Debt</span>
            <span className={styles.ovValue}>{formatCurrency(totalDebt)}</span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${overallProgress}%` }} />
            </div>
            <span className={styles.ovMeta}>{overallProgress.toFixed(1)}% paid off</span>
          </div>
          <div className={styles.overviewCard}>
            <span className={styles.ovLabel}>Monthly Payments</span>
            <span className={styles.ovValue}>{formatCurrency(totalMinPayment)}</span>
            <span className={styles.ovMeta}>{debts.length} active debts</span>
          </div>
          <div className={styles.overviewCard}>
            <span className={styles.ovLabel}>Extra Payment</span>
            <div className={styles.extraInput}>
              <span>₹</span>
              <input
                type="number"
                value={extraPayment}
                onChange={(e) => setExtraPayment(Number(e.target.value))}
                min="0"
                step="500"
              />
            </div>
            <span className={styles.ovMeta}>per month towards debt</span>
          </div>
        </div>

        {/* ---- Strategy Selector ---- */}
        <div className={styles.strategySection}>
          <div className={styles.strategyHeader}>
            <h3>💡 Smart Payoff Strategy</h3>
            <div className={styles.strategyTabs}>
              <button
                className={`${styles.strategyTab} ${strategy === "avalanche" ? styles.activeTab : ""}`}
                onClick={() => setStrategy("avalanche")}
              >
                🏔️ Avalanche
              </button>
              <button
                className={`${styles.strategyTab} ${strategy === "snowball" ? styles.activeTab : ""}`}
                onClick={() => setStrategy("snowball")}
              >
                ⛄ Snowball
              </button>
            </div>
          </div>
          <p className={styles.strategyDesc}>
            {strategy === "avalanche"
              ? "Pay debts with the highest interest rate first. This saves you the most money in the long run."
              : "Pay the smallest debt first for quick wins. This builds momentum and motivation."}
          </p>

          <div className={styles.strategyOrder}>
            <span className={styles.orderLabel}>Recommended payment order:</span>
            <div className={styles.orderList}>
              {sortedDebts.map((debt, i) => {
                const payoff = calculatePayoff(
                  debt.remainingBalance,
                  debt.interestRate,
                  debt.minimumPayment + (i === 0 ? extraPayment : 0)
                );
                return (
                  <div key={debt.id} className={styles.orderItem}>
                    <div className={styles.orderRank}>{i + 1}</div>
                    <div className={styles.orderInfo}>
                      <span className={styles.orderName}>{debt.name}</span>
                      <span className={styles.orderMeta}>
                        {debt.interestRate}% APR · {formatCurrency(debt.remainingBalance)} remaining
                      </span>
                    </div>
                    <div className={styles.orderPayoff}>
                      <span className={styles.orderMonths}>{payoff.months} months</span>
                      <span className={styles.orderInterest}>₹{payoff.totalInterest.toLocaleString("en-IN")} interest</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---- Debt Cards ---- */}
        <div className={styles.debtHeader}>
          <h3>Your Debts</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Debt</button>
        </div>

        <div className={styles.debtGrid}>
          {debts.map((debt) => {
            const progress = ((debt.principal - debt.remainingBalance) / debt.principal) * 100;
            const payoff = calculatePayoff(debt.remainingBalance, debt.interestRate, debt.minimumPayment);
            return (
              <div key={debt.id} className={`card ${styles.debtCard}`}>
                <div className={styles.debtTop}>
                  <div>
                    <h4 className={styles.debtName}>{debt.name}</h4>
                    <span className={`badge badge-primary`}>{DEBT_TYPES.find((t) => t.value === debt.type)?.label}</span>
                  </div>
                  <button className={styles.delDebt} onClick={() => deleteDebt(debt.id)}>×</button>
                </div>
                <div className={styles.debtAmount}>
                  <span className={styles.debtRemaining}>{formatCurrency(debt.remainingBalance)}</span>
                  <span className={styles.debtOf}>of {formatCurrency(debt.principal)}</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
                <div className={styles.debtStats}>
                  <div className={styles.debtStat}>
                    <span>Interest Rate</span>
                    <strong>{debt.interestRate}%</strong>
                  </div>
                  <div className={styles.debtStat}>
                    <span>Min. Payment</span>
                    <strong>{formatCurrency(debt.minimumPayment)}</strong>
                  </div>
                  <div className={styles.debtStat}>
                    <span>Payoff Time</span>
                    <strong>{payoff.months} months</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Add Debt Modal ---- */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add New Debt</h3>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <label className={styles.field}>
                <span>Name</span>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Credit Card" required autoFocus />
              </label>
              <label className={styles.field}>
                <span>Type</span>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {DEBT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Original Amount (₹)</span>
                  <input type="number" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} placeholder="100000" min="0" required />
                </label>
                <label className={styles.field}>
                  <span>Remaining (₹)</span>
                  <input type="number" value={form.remainingBalance} onChange={(e) => setForm({ ...form, remainingBalance: e.target.value })} placeholder="80000" min="0" required />
                </label>
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Interest Rate (%)</span>
                  <input type="number" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} placeholder="12" min="0" step="0.1" required />
                </label>
                <label className={styles.field}>
                  <span>Min. Payment (₹)</span>
                  <input type="number" value={form.minimumPayment} onChange={(e) => setForm({ ...form, minimumPayment: e.target.value })} placeholder="5000" min="0" required />
                </label>
              </div>
              <label className={styles.field}>
                <span>Due Date</span>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </label>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Debt</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
