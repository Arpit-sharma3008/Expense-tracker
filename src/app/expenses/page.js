"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";
import styles from "./expenses.module.css";

export default function ExpensesPage() {
  const { expenses, categories, addExpense, deleteExpense, clearAllExpenses, getCategoryById, uploadReceipt } = useData();
  const [showForm, setShowForm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("this-month");
  const [receiptFile, setReceiptFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewReceiptUrl, setViewReceiptUrl] = useState(null);

  /* Form state */
  const [form, setForm] = useState({
    description: "",
    amount: "",
    categoryId: "cat-1",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    setIsSubmitting(true);
    
    let receiptUrl = null;
    if (receiptFile) {
      receiptUrl = await uploadReceipt(receiptFile);
    }
    
    await addExpense({
      ...form,
      amount: parseFloat(form.amount),
      receiptUrl,
    });
    setForm({ description: "", amount: "", categoryId: "cat-1", date: new Date().toISOString().split("T")[0] });
    setReceiptFile(null);
    setShowForm(false);
    setIsSubmitting(false);
  };

  /* Filter logic */
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];

    // Date range filter
    const now = new Date();
    if (dateRange === "today") {
      const today = now.toISOString().split("T")[0];
      list = list.filter((e) => e.date === today);
    } else if (dateRange === "this-week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      list = list.filter((e) => new Date(e.date) >= weekAgo);
    } else if (dateRange === "this-month") {
      const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      list = list.filter((e) => e.date.startsWith(prefix));
    }

    // Category filter
    if (filter !== "all") {
      list = list.filter((e) => e.categoryId === filter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.description.toLowerCase().includes(q));
    }

    return list;
  }, [expenses, filter, search, dateRange]);

  const totalFiltered = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const formatCurrency = (v) => `₹${v.toLocaleString("en-IN")}`;

  return (
    <>
      <Header title="Expenses" subtitle="Track and manage all your expenses" />

      <div className={styles.page}>
        {/* ---- Toolbar ---- */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.searchBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={styles.select}>
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className={styles.select}>
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.toolbarRight}>
            {expenses.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={() => setShowClearConfirm(true)}>
                🗑️ Clear All
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Add Expense
            </button>
          </div>
        </div>

        {/* ---- Summary Strip ---- */}
        <div className={styles.summary}>
          <span className={styles.summaryLabel}>
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? "s" : ""}
          </span>
          <span className={styles.summaryTotal}>Total: {formatCurrency(totalFiltered)}</span>
        </div>

        {/* ---- Expense List ---- */}
        <div className={styles.list}>
          {filteredExpenses.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📭</span>
              <p>No expenses found</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>Add your first expense</button>
            </div>
          ) : (
            filteredExpenses.map((exp) => {
              const cat = getCategoryById(exp.categoryId);
              return (
                <div key={exp.id} className={styles.expenseItem}>
                  <div className={styles.expIcon} style={{ background: cat?.color + "18" }}>
                    {cat?.icon || "📦"}
                  </div>
                  <div className={styles.expInfo}>
                    <span className={styles.expName}>{exp.description}</span>
                    <span className={styles.expMeta}>{cat?.name} · {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  {exp.receiptUrl && (
                    <button 
                      className={styles.receiptBtn} 
                      onClick={() => setViewReceiptUrl(exp.receiptUrl)} 
                      title="View Receipt"
                    >
                      📎
                    </button>
                  )}
                  <span className={styles.expAmount}>-{formatCurrency(exp.amount)}</span>
                  <button className={styles.deleteBtn} onClick={() => deleteExpense(exp.id)} aria-label="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ---- Add Expense Modal ---- */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add New Expense</h3>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <label className={styles.field}>
                <span>Description</span>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Lunch at cafe"
                  required
                  autoFocus
                />
              </label>
              <label className={styles.field}>
                <span>Amount (₹)</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="500"
                  min="0"
                  step="0.01"
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Category</span>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span>Receipt Image (Optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files[0])}
                />
              </label>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Clear All Confirmation Modal ---- */}
      {showClearConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowClearConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className={styles.modalHeader}>
              <h3>Clear All Expenses?</h3>
              <button className={styles.closeBtn} onClick={() => setShowClearConfirm(false)}>×</button>
            </div>
            <div className={styles.confirmBody}>
              <span className={styles.confirmIcon}>⚠️</span>
              <p>This will archive <strong>{expenses.length}</strong> expenses and reset your list to zero. Archived data will still be available in your reports.</p>
              <div className={styles.autoResetNote}>
                <span>💡</span>
                <span>Tip: Expenses also auto-reset on the 1st of every month so you always start fresh!</span>
              </div>
              <div className={styles.formActions}>
                <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => { clearAllExpenses(); setShowClearConfirm(false); }}>Yes, Clear All</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- View Receipt Modal ---- */}
      {viewReceiptUrl && (
        <div className={styles.modalOverlay} onClick={() => setViewReceiptUrl(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ padding: "16px" }}>
            <div className={styles.modalHeader} style={{ borderBottom: "none", padding: "0 0 16px 0" }}>
              <h3>Receipt Image</h3>
              <button className={styles.closeBtn} onClick={() => setViewReceiptUrl(null)}>×</button>
            </div>
            <img 
              src={viewReceiptUrl} 
              alt="Receipt" 
              style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px" }} 
            />
          </div>
        </div>
      )}
    </>
  );
}
