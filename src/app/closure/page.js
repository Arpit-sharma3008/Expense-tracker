"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";

export default function CashClosurePage() {
  const { sales, expenses, closures, addClosure } = useData();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [openingCash, setOpeningCash] = useState("1000");
  const [actualClosingCash, setActualClosingCash] = useState("");
  const [notes, setNotes] = useState("");

  const formatCurrency = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

  /* ---- Calculate Today's Cash Totals ---- */
  const dayStats = useMemo(() => {
    const daySales = sales.filter((s) => s.date === date);
    const dayExp = expenses.filter((e) => e.date === date && e.paymentMethod === "Cash");

    const cashSales = daySales.reduce((sum, s) => sum + (s.cashAmount || 0), 0);
    const cashExpenses = dayExp.reduce((sum, e) => sum + e.amount, 0);

    const float = parseFloat(openingCash) || 0;
    const expectedClosingCash = float + cashSales - cashExpenses;

    const actual = parseFloat(actualClosingCash) || 0;
    const discrepancy = actual > 0 ? actual - expectedClosingCash : 0;

    return {
      cashSales,
      cashExpenses,
      expectedClosingCash,
      actual,
      discrepancy,
    };
  }, [sales, expenses, date, openingCash, actualClosingCash]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!actualClosingCash) return alert("Please enter the actual physical cash counted in your drawer.");

    addClosure({
      date,
      openingCash: parseFloat(openingCash) || 0,
      cashSales: dayStats.cashSales,
      cashExpenses: dayStats.cashExpenses,
      expectedClosingCash: dayStats.expectedClosingCash,
      actualClosingCash: parseFloat(actualClosingCash),
      discrepancy: dayStats.discrepancy,
      notes,
    });

    setActualClosingCash("");
    setNotes("");
    alert("✅ Night Cash Closure Recorded!");
  };

  return (
    <>
      <Header
        title="Night Cash Drawer Closure"
        subtitle="Reconcile morning float + cash sales vs physical cash counted"
        onMenuClick={() => {
          const event = new CustomEvent("toggle-sidebar");
          window.dispatchEvent(event);
        }}
      />

      <div className="responsive-container">
        <div className="responsive-grid-equal">
          {/* RECONCILIATION FORM */}
          <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.15rem" }}>Perform Day End Reconciliation</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Closure Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Morning Opening Cash Float (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              {/* CALCULATED SYSTEM CASH BREAKDOWN */}
              <div style={{ background: "var(--bg-elevated)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-tertiary)", marginBottom: "10px" }}>SYSTEM CALCULATIONS FOR {date}</div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9rem" }}>
                  <span>(+) Opening Morning Float:</span>
                  <span style={{ fontWeight: "600" }}>{formatCurrency(parseFloat(openingCash) || 0)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9rem" }}>
                  <span>(+) Today's Cash Sales Revenue:</span>
                  <span style={{ fontWeight: "600", color: "#10b981" }}>+{formatCurrency(dayStats.cashSales)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "0.9rem" }}>
                  <span>(-) Today's Out-of-Pocket Cash Expenses:</span>
                  <span style={{ fontWeight: "600", color: "#ef4444" }}>-{formatCurrency(dayStats.cashExpenses)}</span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px dashed var(--border-color)", fontSize: "1rem", fontWeight: "700" }}>
                  <span>Expected Drawer Cash:</span>
                  <span style={{ color: "#3b82f6" }}>{formatCurrency(dayStats.expectedClosingCash)}</span>
                </div>
              </div>

              {/* ACTUAL PHYSICAL CASH INPUT */}
              <div>
                <label style={{ fontWeight: "700", fontSize: "0.95rem", display: "block", marginBottom: "4px" }}>
                  Actual Physical Cash Counted in Drawer (₹)
                </label>
                <input
                  type="number"
                  placeholder="Count physical notes & coins..."
                  value={actualClosingCash}
                  onChange={(e) => setActualClosingCash(e.target.value)}
                  required
                  min="0"
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "2px solid var(--color-primary)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "1.1rem", fontWeight: "bold" }}
                />
              </div>

              {/* DISCREPANCY SUMMARY BOX */}
              {actualClosingCash !== "" && (
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: dayStats.discrepancy === 0 ? "#10b98120" : dayStats.discrepancy > 0 ? "#3b82f620" : "#ef444420",
                    border: `1px solid ${dayStats.discrepancy === 0 ? "#10b981" : dayStats.discrepancy > 0 ? "#3b82f6" : "#ef4444"}`,
                    display: "flex",
                    justifySpaceBetween: "center",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "600" }}>
                    {dayStats.discrepancy === 0
                      ? "✅ Perfect Cash Match!"
                      : dayStats.discrepancy > 0
                      ? "🔵 Extra Cash in Drawer (+)"
                      : "🚨 Cash Shortage / Missing (-)"}
                  </span>
                  <span style={{ fontWeight: "800", fontSize: "1.1rem" }}>
                    {formatCurrency(Math.abs(dayStats.discrepancy))}
                  </span>
                </div>
              )}

              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Closure Notes</label>
                <input
                  type="text"
                  placeholder="e.g. ₹50 loose coins given to helper"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: "12px", borderRadius: "10px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer" }}>
                Complete & Save Reconciliation
              </button>
            </form>
          </div>

          {/* AUDIT LOG HISTORY */}
          <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.15rem" }}>Closure Audit History</h3>
            {closures.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "550px", overflowY: "auto" }}>
                {closures.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "14px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>{c.date}</span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: c.discrepancy === 0 ? "#10b98120" : c.discrepancy > 0 ? "#3b82f620" : "#ef444420",
                          color: c.discrepancy === 0 ? "#10b981" : c.discrepancy > 0 ? "#3b82f6" : "#ef4444",
                        }}
                      >
                        {c.discrepancy === 0 ? "Matched" : c.discrepancy > 0 ? `+${formatCurrency(c.discrepancy)}` : `-${formatCurrency(Math.abs(c.discrepancy))}`}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                      <span>Float: {formatCurrency(c.openingCash)}</span>
                      <span>Cash Sales: {formatCurrency(c.cashSales)}</span>
                      <span>Expected: {formatCurrency(c.expectedClosingCash)}</span>
                      <span style={{ fontWeight: "bold", color: "var(--text-primary)" }}>Counted: {formatCurrency(c.actualClosingCash)}</span>
                    </div>
                    {c.notes && <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "6px" }}>Note: {c.notes}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>
                No past night closures logged yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
