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

export default function MoneyManagerPage() {
  const { debts, addDebt, updateDebt, deleteDebt, credits, addCredit, updateCredit, deleteCredit } = useData();
  const [activeTab, setActiveTab] = useState("debts"); // "debts" | "credits"
  
  // Debt State
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [strategy, setStrategy] = useState("avalanche");
  const [extraPayment, setExtraPayment] = useState(2000);
  const [debtForm, setDebtForm] = useState({
    name: "", type: "credit_card", principal: "", remainingBalance: "", interestRate: "", minimumPayment: "", dueDate: "",
  });

  // Credit State
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [creditForm, setCreditForm] = useState({
    personName: "", totalAmount: "", expectedDate: "", notes: "",
  });

  // Record Payment State
  const [paymentModalData, setPaymentModalData] = useState(null); // { id, amount }
  const [paymentAmount, setPaymentAmount] = useState("");

  const handleDebtSubmit = (e) => {
    e.preventDefault();
    addDebt({
      ...debtForm,
      principal: parseFloat(debtForm.principal),
      remainingBalance: parseFloat(debtForm.remainingBalance),
      interestRate: parseFloat(debtForm.interestRate),
      minimumPayment: parseFloat(debtForm.minimumPayment),
    });
    setDebtForm({ name: "", type: "credit_card", principal: "", remainingBalance: "", interestRate: "", minimumPayment: "", dueDate: "" });
    setShowDebtForm(false);
  };

  const handleCreditSubmit = (e) => {
    e.preventDefault();
    addCredit({
      personName: creditForm.personName,
      totalAmount: parseFloat(creditForm.totalAmount),
      expectedDate: creditForm.expectedDate || null,
      notes: creditForm.notes || "",
    });
    setCreditForm({ personName: "", totalAmount: "", expectedDate: "", notes: "" });
    setShowCreditForm(false);
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!paymentModalData) return;
    const credit = credits.find(c => c.id === paymentModalData.id);
    if (!credit) return;

    const newReceived = credit.receivedAmount + parseFloat(paymentAmount);
    const newStatus = newReceived >= credit.totalAmount ? "received" : "partial";

    updateCredit(credit.id, {
      receivedAmount: newReceived,
      status: newStatus
    });

    setPaymentModalData(null);
    setPaymentAmount("");
  };

  /* ---- Smart Strategy (Debts) ---- */
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
  const debtProgress = totalPrincipal > 0 ? ((totalPrincipal - totalDebt) / totalPrincipal) * 100 : 0;

  /* ---- Credits Summary ---- */
  const totalExpectedCredits = credits.reduce((s, c) => s + c.totalAmount, 0);
  const totalReceivedCredits = credits.reduce((s, c) => s + c.receivedAmount, 0);
  const pendingCredits = totalExpectedCredits - totalReceivedCredits;

  const netPosition = pendingCredits - totalDebt;

  const formatCurrency = (v) => `₹${v.toLocaleString("en-IN")}`;

  return (
    <>
      <Header title="Money Manager" subtitle="Track debts & credits in one place" />

      <div className={styles.page}>
        {/* ---- Overview Cards ---- */}
        <div className={styles.overviewGrid}>
          <div className={styles.overviewCard}>
            <span className={styles.ovLabel}>Total Debts</span>
            <span className={styles.ovValue} style={{ color: "var(--color-danger)" }}>{formatCurrency(totalDebt)}</span>
            <span className={styles.ovMeta}>You owe to others</span>
          </div>
          <div className={styles.overviewCard}>
            <span className={styles.ovLabel}>Total Credits</span>
            <span className={styles.ovValue} style={{ color: "var(--color-success)" }}>{formatCurrency(pendingCredits)}</span>
            <span className={styles.ovMeta}>Owed to you</span>
          </div>
          <div className={`${styles.overviewCard} ${netPosition >= 0 ? styles.netPositive : styles.netNegative}`}>
            <span className={styles.ovLabel}>Net Position</span>
            <span className={styles.ovValue}>{formatCurrency(Math.abs(netPosition))}</span>
            <span className={styles.ovMeta}>{netPosition >= 0 ? "Surplus (Good)" : "Deficit (Need to pay)"}</span>
          </div>
        </div>

        {/* ---- Tabs ---- */}
        <div className={styles.tabBar}>
          <button 
            className={`${styles.tabBtn} ${activeTab === "debts" ? styles.activeTabBtn : ""}`}
            onClick={() => setActiveTab("debts")}
          >
            🏦 Debts
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === "credits" ? styles.activeTabBtn : ""}`}
            onClick={() => setActiveTab("credits")}
          >
            💵 Credits
          </button>
        </div>

        {/* =========================================
            DEBTS TAB
        ========================================== */}
        {activeTab === "debts" && (
          <div className={styles.tabContent}>
            {/* Strategy Selector */}
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

            {/* Debt Cards */}
            <div className={styles.sectionHeader}>
              <h3>Your Debts</h3>
              <button className="btn btn-primary" onClick={() => setShowDebtForm(true)}>+ Add Debt</button>
            </div>

            <div className={styles.grid}>
              {debts.map((debt) => {
                const progress = ((debt.principal - debt.remainingBalance) / debt.principal) * 100;
                const payoff = calculatePayoff(debt.remainingBalance, debt.interestRate, debt.minimumPayment);
                return (
                  <div key={debt.id} className={`card ${styles.itemCard}`}>
                    <div className={styles.cardTop}>
                      <div>
                        <h4 className={styles.itemName}>{debt.name}</h4>
                        <span className={`badge badge-primary`}>{DEBT_TYPES.find((t) => t.value === debt.type)?.label}</span>
                      </div>
                      <button className={styles.delBtn} onClick={() => deleteDebt(debt.id)}>×</button>
                    </div>
                    <div className={styles.itemAmount}>
                      <span className={styles.amountMain}>{formatCurrency(debt.remainingBalance)}</span>
                      <span className={styles.amountOf}>of {formatCurrency(debt.principal)}</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                    <div className={styles.itemStats}>
                      <div className={styles.itemStat}>
                        <span>Interest Rate</span>
                        <strong>{debt.interestRate}%</strong>
                      </div>
                      <div className={styles.itemStat}>
                        <span>Min. Payment</span>
                        <strong>{formatCurrency(debt.minimumPayment)}</strong>
                      </div>
                      <div className={styles.itemStat}>
                        <span>Payoff Time</span>
                        <strong>{payoff.months} months</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================
            CREDITS TAB
        ========================================== */}
        {activeTab === "credits" && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h3>Owed to You</h3>
              <button className="btn btn-primary" onClick={() => setShowCreditForm(true)}>+ Add Credit</button>
            </div>

            <div className={styles.grid}>
              {credits.map((credit) => {
                const progress = (credit.receivedAmount / credit.totalAmount) * 100;
                return (
                  <div key={credit.id} className={`card ${styles.itemCard}`}>
                    <div className={styles.cardTop}>
                      <div>
                        <h4 className={styles.itemName}>{credit.personName}</h4>
                        <span className={`${styles.statusBadge} ${styles[credit.status]}`}>
                          {credit.status.toUpperCase()}
                        </span>
                      </div>
                      <button className={styles.delBtn} onClick={() => deleteCredit(credit.id)}>×</button>
                    </div>
                    <div className={styles.itemAmount}>
                      <span className={styles.amountMain}>{formatCurrency(credit.totalAmount - credit.receivedAmount)}</span>
                      <span className={styles.amountOf}>remaining of {formatCurrency(credit.totalAmount)}</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={`${styles.progressFill} ${styles.creditProgress}`} style={{ width: `${progress}%` }} />
                    </div>
                    <div className={styles.itemStats}>
                      <div className={styles.itemStat}>
                        <span>Received</span>
                        <strong>{formatCurrency(credit.receivedAmount)}</strong>
                      </div>
                      <div className={styles.itemStat}>
                        <span>Expected Date</span>
                        <strong>{credit.expectedDate ? new Date(credit.expectedDate).toLocaleDateString("en-IN") : "N/A"}</strong>
                      </div>
                      <div className={styles.itemStat}>
                        <button 
                          className={styles.recordBtn} 
                          onClick={() => setPaymentModalData({ id: credit.id, amount: credit.totalAmount - credit.receivedAmount })}
                          disabled={credit.status === "received"}
                        >
                          Record Pay
                        </button>
                      </div>
                    </div>
                    {credit.notes && <div className={styles.itemNotes}>{credit.notes}</div>}
                  </div>
                );
              })}
              {credits.length === 0 && (
                <div className={styles.emptyState}>
                  <p>No credits found. Add one if someone owes you money.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---- Add Debt Modal ---- */}
      {showDebtForm && (
        <div className={styles.modalOverlay} onClick={() => setShowDebtForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add New Debt</h3>
              <button className={styles.closeBtn} onClick={() => setShowDebtForm(false)}>×</button>
            </div>
            <form onSubmit={handleDebtSubmit} className={styles.form}>
              <label className={styles.field}>
                <span>Name</span>
                <input type="text" value={debtForm.name} onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })} placeholder="e.g. Credit Card" required autoFocus />
              </label>
              <label className={styles.field}>
                <span>Type</span>
                <select value={debtForm.type} onChange={(e) => setDebtForm({ ...debtForm, type: e.target.value })}>
                  {DEBT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Original Amount (₹)</span>
                  <input type="number" value={debtForm.principal} onChange={(e) => setDebtForm({ ...debtForm, principal: e.target.value })} placeholder="100000" min="0" required />
                </label>
                <label className={styles.field}>
                  <span>Remaining (₹)</span>
                  <input type="number" value={debtForm.remainingBalance} onChange={(e) => setDebtForm({ ...debtForm, remainingBalance: e.target.value })} placeholder="80000" min="0" required />
                </label>
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Interest Rate (%)</span>
                  <input type="number" value={debtForm.interestRate} onChange={(e) => setDebtForm({ ...debtForm, interestRate: e.target.value })} placeholder="12" min="0" step="0.1" required />
                </label>
                <label className={styles.field}>
                  <span>Min. Payment (₹)</span>
                  <input type="number" value={debtForm.minimumPayment} onChange={(e) => setDebtForm({ ...debtForm, minimumPayment: e.target.value })} placeholder="5000" min="0" required />
                </label>
              </div>
              <label className={styles.field}>
                <span>Due Date</span>
                <input type="date" value={debtForm.dueDate} onChange={(e) => setDebtForm({ ...debtForm, dueDate: e.target.value })} />
              </label>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDebtForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Debt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Add Credit Modal ---- */}
      {showCreditForm && (
        <div className={styles.modalOverlay} onClick={() => setShowCreditForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Expected Credit</h3>
              <button className={styles.closeBtn} onClick={() => setShowCreditForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreditSubmit} className={styles.form}>
              <label className={styles.field}>
                <span>Person Name</span>
                <input type="text" value={creditForm.personName} onChange={(e) => setCreditForm({ ...creditForm, personName: e.target.value })} placeholder="e.g. John Doe" required autoFocus />
              </label>
              <label className={styles.field}>
                <span>Total Amount (₹)</span>
                <input type="number" value={creditForm.totalAmount} onChange={(e) => setCreditForm({ ...creditForm, totalAmount: e.target.value })} placeholder="5000" min="1" required />
              </label>
              <label className={styles.field}>
                <span>Expected Date</span>
                <input type="date" value={creditForm.expectedDate} onChange={(e) => setCreditForm({ ...creditForm, expectedDate: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Notes (Optional)</span>
                <input type="text" value={creditForm.notes} onChange={(e) => setCreditForm({ ...creditForm, notes: e.target.value })} placeholder="Dinner split..." />
              </label>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreditForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Credit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Record Payment Modal ---- */}
      {paymentModalData && (
        <div className={styles.modalOverlay} onClick={() => setPaymentModalData(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Record Received Payment</h3>
              <button className={styles.closeBtn} onClick={() => setPaymentModalData(null)}>×</button>
            </div>
            <form onSubmit={handleRecordPayment} className={styles.form}>
              <label className={styles.field}>
                <span>Amount Received (₹)</span>
                <input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value)} 
                  placeholder={`e.g. ${paymentModalData.amount}`}
                  min="1" 
                  max={paymentModalData.amount}
                  required 
                  autoFocus 
                />
              </label>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setPaymentModalData(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
