"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";

export default function ReportsPage() {
  const { sales, expenses, wastage, closures, resetStallData } = useData();
  const [dateFilter, setDateFilter] = useState("all");

  const formatCurrency = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

  // Filtered Datasets
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = null;

    if (dateFilter === "today") {
      startDate = now.toISOString().split("T")[0];
    } else if (dateFilter === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split("T")[0];
    } else if (dateFilter === "month") {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString().split("T")[0];
    }

    const fSales = startDate ? sales.filter((s) => s.date >= startDate) : sales;
    const fExpenses = startDate ? expenses.filter((e) => e.date >= startDate) : expenses;
    const fWastage = startDate ? wastage.filter((w) => w.date >= startDate) : wastage;

    const totalRev = fSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalExp = fExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalWaste = fWastage.reduce((sum, w) => sum + w.estimatedCost, 0);
    const netProfit = totalRev - totalExp - totalWaste;
    const margin = totalRev > 0 ? (netProfit / totalRev) * 100 : 0;

    return {
      fSales,
      fExpenses,
      fWastage,
      totalRev,
      totalExp,
      totalWaste,
      netProfit,
      margin,
    };
  }, [sales, expenses, wastage, dateFilter]);

  /* ---- EXPORT TO CSV ---- */
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header
    csvContent += "Type,Date,Description/Items,Category/Payment,Amount (INR)\n";

    filteredData.fSales.forEach((s) => {
      const itemsStr = s.items?.map(i => `${i.name} x${i.qty}`).join("; ") || "Bulk Sales";
      csvContent += `Sales,${s.date},"${itemsStr}",Sales Revenue,${s.totalAmount}\n`;
    });

    filteredData.fExpenses.forEach((e) => {
      csvContent += `Expense,${e.date},"${e.title.replace(/"/g, '""')}",${e.paymentMethod},${e.amount}\n`;
    });

    filteredData.fWastage.forEach((w) => {
      csvContent += `Wastage,${w.date},"${w.itemName} (${w.quantity} ${w.unit})",${w.reason},${w.estimatedCost}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Stall_Financial_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ---- PRINT PDF REPORT ---- */
  const printReport = () => {
    window.print();
  };

  /* ---- BACKUP JSON ---- */
  const exportJSONBackup = () => {
    const backupData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      sales,
      expenses,
      wastage,
      closures,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StallMaster_Backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header
        title="Financial Reports & Data Export"
        subtitle="Export P&L ledger, download Excel/CSV, print statements & backup data"
        onMenuClick={() => {
          const event = new CustomEvent("toggle-sidebar");
          window.dispatchEvent(event);
        }}
      />

      <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
        {/* ACTION BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {["all", "today", "week", "month"].map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: dateFilter === f ? "var(--color-primary)" : "var(--bg-elevated)",
                  color: dateFilter === f ? "#fff" : "var(--text-primary)",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {f === "all" ? "All Time" : f === "today" ? "Today" : f === "week" ? "Last 7 Days" : "Last 30 Days"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={exportToCSV}
              style={{
                background: "#10b981",
                color: "#fff",
                border: "none",
                padding: "10px 18px",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              📊 Export Excel (CSV)
            </button>

            <button
              onClick={printReport}
              style={{
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                padding: "10px 18px",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              🖨️ Print PDF Report
            </button>

            <button
              onClick={exportJSONBackup}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "10px 16px",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              💾 JSON Backup
            </button>
          </div>
        </div>

        {/* PRINTABLE FINANCIAL STATEMENT CARD */}
        <div className="card" style={{ padding: "32px", borderRadius: "16px", background: "var(--bg-surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid var(--border-color)", paddingBottom: "16px", marginBottom: "20px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem" }}>🏪 Stall Financial Statement</h2>
              <span style={{ fontSize: "0.9rem", color: "var(--text-tertiary)" }}>
                Period: {dateFilter.toUpperCase()} · Generated on {new Date().toLocaleDateString("en-IN")}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>System Status</div>
              <div style={{ fontWeight: "700", color: "#10b981" }}>Active & Verified</div>
            </div>
          </div>

          {/* FINANCIAL SUMMARY TABLE */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            <div style={{ background: "var(--bg-elevated)", padding: "16px", borderRadius: "12px" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>(+) Sales Revenue</div>
              <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#10b981" }}>{formatCurrency(filteredData.totalRev)}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{filteredData.fSales.length} Transactions</div>
            </div>

            <div style={{ background: "var(--bg-elevated)", padding: "16px", borderRadius: "12px" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>(-) Stall Expenses</div>
              <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#ef4444" }}>{formatCurrency(filteredData.totalExp)}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{filteredData.fExpenses.length} Expense Bills</div>
            </div>

            <div style={{ background: "var(--bg-elevated)", padding: "16px", borderRadius: "12px" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>(-) Wastage Loss</div>
              <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#f59e0b" }}>{formatCurrency(filteredData.totalWaste)}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{filteredData.fWastage.length} Wastage Logs</div>
            </div>

            <div style={{ background: filteredData.netProfit >= 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", padding: "16px", borderRadius: "12px", border: `1px solid ${filteredData.netProfit >= 0 ? "#10b981" : "#ef4444"}` }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>(=) Net Profit</div>
              <div style={{ fontSize: "1.4rem", fontWeight: "800", color: filteredData.netProfit >= 0 ? "#10b981" : "#ef4444" }}>{formatCurrency(filteredData.netProfit)}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: "600" }}>Margin: {filteredData.margin.toFixed(1)}%</div>
            </div>
          </div>

          {/* DETAILED LEDGER PREVIEW */}
          <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Transaction Breakdown</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredData.fSales.slice(0, 5).map(s => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: "8px", fontSize: "0.9rem" }}>
                <span>🛒 Sales Entry ({s.date})</span>
                <span style={{ fontWeight: "700", color: "#10b981" }}>+{formatCurrency(s.totalAmount)}</span>
              </div>
            ))}
            {filteredData.fExpenses.slice(0, 5).map(e => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: "8px", fontSize: "0.9rem" }}>
                <span>🧾 Expense: {e.title} ({e.date})</span>
                <span style={{ fontWeight: "700", color: "#ef4444" }}>-{formatCurrency(e.amount)}</span>
              </div>
            ))}
          </div>

          {/* DANGER ZONE / RESET */}
          <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px dashed var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#ef4444" }}>Reset System Data</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>Wipe all local stall records and start fresh</div>
            </div>
            <button
              onClick={resetStallData}
              style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef4444", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer" }}
            >
              ⚠️ Reset All Data
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
