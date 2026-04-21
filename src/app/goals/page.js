"use client";

import { useState } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";
import styles from "./goals.module.css";

export default function GoalsPage() {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useData();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", icon: "🎯", color: "#4F6EF7" });
  
  const [fundModal, setFundModal] = useState(null); // stores the goal being funded
  const [fundAmount, setFundAmount] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addSavingsGoal({ ...form, targetAmount: parseFloat(form.targetAmount) });
    setForm({ name: "", targetAmount: "", icon: "🎯", color: "#4F6EF7" });
    setShowModal(false);
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    if (!fundModal || !fundAmount) return;
    const newAmount = fundModal.currentAmount + parseFloat(fundAmount);
    await updateSavingsGoal(fundModal.id, { currentAmount: newAmount });
    setFundModal(null);
    setFundAmount("");
  };

  const formatCurrency = (v) => `₹${v.toLocaleString("en-IN")}`;

  return (
    <>
      <Header title="Savings Goals" subtitle="Create pots and track your savings" />
      
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <h2>Your Goals</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Goal</button>
        </div>

        {savingsGoals.length === 0 ? (
          <div className={styles.emptyState}>
            <span style={{ fontSize: "3rem" }}>🎯</span>
            <h3>No goals yet</h3>
            <p>Create a savings goal like "Vacation" or "Emergency Fund".</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {savingsGoals.map((goal) => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const isCompleted = progress >= 100;

              return (
                <div key={goal.id} className={`${styles.goalCard} ${isCompleted ? styles.completed : ""}`}>
                  <div className={styles.cardTop}>
                    <div className={styles.iconWrap} style={{ background: goal.color + "20", color: goal.color }}>
                      {goal.icon}
                    </div>
                    <button className={styles.delBtn} onClick={() => deleteSavingsGoal(goal.id)}>×</button>
                  </div>
                  
                  <h3 className={styles.goalName}>{goal.name}</h3>
                  
                  <div className={styles.amounts}>
                    <span className={styles.current}>{formatCurrency(goal.currentAmount)}</span>
                    <span className={styles.target}>of {formatCurrency(goal.targetAmount)}</span>
                  </div>

                  <div className={styles.progressWrap}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${progress}%`, background: goal.color }} 
                      />
                    </div>
                    <span className={styles.percent}>{progress.toFixed(1)}%</span>
                  </div>

                  <button 
                    className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'} ${styles.fundBtn}`}
                    onClick={() => setFundModal(goal)}
                    disabled={isCompleted}
                  >
                    {isCompleted ? "Goal Reached! 🎉" : "Add Funds"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Goal Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create Savings Goal</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <span>Goal Name</span>
                <input type="text" required placeholder="e.g. New Laptop" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className={styles.field}>
                <span>Target Amount (₹)</span>
                <input type="number" required min="1" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <span>Icon</span>
                  <input type="text" maxLength="2" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <span>Color</span>
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ height: "42px", padding: "2px" }} />
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {fundModal && (
        <div className={styles.modalOverlay} onClick={() => setFundModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Funds to {fundModal.icon} {fundModal.name}</h3>
              <button className={styles.closeBtn} onClick={() => setFundModal(null)}>×</button>
            </div>
            <form onSubmit={handleAddFunds} className={styles.form}>
              <div className={styles.field}>
                <span>Amount to Add (₹)</span>
                <input type="number" required min="1" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} autoFocus />
              </div>
              <p className={styles.fundHint}>
                Current: {formatCurrency(fundModal.currentAmount)} | Target: {formatCurrency(fundModal.targetAmount)}
              </p>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setFundModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: fundModal.color, borderColor: fundModal.color }}>Add to Pot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
