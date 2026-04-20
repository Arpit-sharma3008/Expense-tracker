"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";
import styles from "./reports.module.css";

export default function ReportsPage() {
  const { expenses, categories, debts, subscriptions, getCategoryById } = useData();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const months = useMemo(() => {
    const set = new Set();
    expenses.forEach((e) => {
      const parts = e.date.split("-");
      set.add(`${parts[0]}-${parts[1]}`);
    });
    return [...set].sort().reverse();
  }, [expenses]);

  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const summaryData = useMemo(() => {
    const catMap = {};
    monthExpenses.forEach((e) => {
      if (!catMap[e.categoryId]) catMap[e.categoryId] = { count: 0, total: 0 };
      catMap[e.categoryId].count++;
      catMap[e.categoryId].total += e.amount;
    });
    return Object.entries(catMap)
      .map(([catId, data]) => {
        const cat = getCategoryById(catId);
        return { name: cat?.name || "Other", icon: cat?.icon || "📦", ...data };
      })
      .sort((a, b) => b.total - a.total);
  }, [monthExpenses, getCategoryById]);

  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const formatCurrency = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "SpendWise";
      workbook.created = new Date();

      /* ---- Sheet 1: Expenses ---- */
      const sheet = workbook.addWorksheet("Expenses");

      // Title Row
      sheet.mergeCells("A1:E1");
      const titleCell = sheet.getCell("A1");
      const [sYear, sMonth] = selectedMonth.split("-");
      const monthName = new Date(sYear, sMonth - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      titleCell.value = `Expense Report — ${monthName}`;
      titleCell.font = { size: 16, bold: true, color: { argb: "FF1A1D2E" } };
      titleCell.alignment = { horizontal: "center" };
      sheet.getRow(1).height = 32;

      // Summary Row
      sheet.mergeCells("A2:E2");
      const sumCell = sheet.getCell("A2");
      sumCell.value = `Total: ₹${Math.round(totalSpent).toLocaleString("en-IN")} | Transactions: ${monthExpenses.length}`;
      sumCell.font = { size: 11, color: { argb: "FF5A6178" } };
      sumCell.alignment = { horizontal: "center" };
      sheet.getRow(2).height = 22;

      // Headers
      const headerRow = sheet.addRow(["Date", "Description", "Category", "Amount (₹)", "Running Total"]);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F6EF7" } };
        cell.alignment = { horizontal: "center" };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FF4F6EF7" } },
        };
      });

      // Data rows
      let runningTotal = 0;
      const sortedExpenses = [...monthExpenses].sort((a, b) => new Date(a.date) - new Date(b.date));
      sortedExpenses.forEach((exp, i) => {
        runningTotal += exp.amount;
        const cat = getCategoryById(exp.categoryId);
        const row = sheet.addRow([
          new Date(exp.date).toLocaleDateString("en-IN"),
          exp.description,
          cat?.name || "Other",
          Math.round(exp.amount * 100) / 100,
          Math.round(runningTotal * 100) / 100,
        ]);
        row.getCell(4).numFmt = "#,##0.00";
        row.getCell(5).numFmt = "#,##0.00";
        if (i % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F3F9" } };
          });
        }
      });

      sheet.columns = [
        { width: 14 },
        { width: 30 },
        { width: 20 },
        { width: 15 },
        { width: 18 },
      ];

      /* ---- Sheet 2: Category Summary ---- */
      const catSheet = workbook.addWorksheet("Category Summary");
      catSheet.mergeCells("A1:C1");
      catSheet.getCell("A1").value = `Category Breakdown — ${monthName}`;
      catSheet.getCell("A1").font = { size: 14, bold: true };
      catSheet.getCell("A1").alignment = { horizontal: "center" };

      const catHeader = catSheet.addRow(["Category", "Transactions", "Total (₹)"]);
      catHeader.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F6EF7" } };
      });

      summaryData.forEach((item) => {
        const row = catSheet.addRow([item.name, item.count, Math.round(item.total)]);
        row.getCell(3).numFmt = "#,##0";
      });

      catSheet.addRow([]);
      const totalRow = catSheet.addRow(["TOTAL", monthExpenses.length, Math.round(totalSpent)]);
      totalRow.font = { bold: true };
      totalRow.getCell(3).numFmt = "#,##0";

      catSheet.columns = [{ width: 22 }, { width: 16 }, { width: 16 }];

      /* ---- Download ---- */
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SpendWise_Report_${selectedMonth}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Header title="Reports" subtitle="Download monthly expense reports" />

      <div className={styles.page}>
        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.monthSelect}>
            <label>Select Month</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {months.map((m) => {
                const [y, mo] = m.split("-");
                const label = new Date(y, mo - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
                return <option key={m} value={m}>{label}</option>;
              })}
            </select>
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <><span className="spinner" /> Generating...</>
            ) : (
              <>📥 Download Excel Report</>
            )}
          </button>
        </div>

        {/* Preview */}
        <div className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <h3>📄 Report Preview</h3>
            <span className={styles.previewMeta}>{monthExpenses.length} transactions · {formatCurrency(totalSpent)} total</span>
          </div>

          {/* Category Summary */}
          <div className={styles.catSummary}>
            {summaryData.map((item) => (
              <div key={item.name} className={styles.catRow}>
                <span className={styles.catIcon}>{item.icon}</span>
                <span className={styles.catName}>{item.name}</span>
                <span className={styles.catCount}>{item.count} txn</span>
                <span className={styles.catTotal}>{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>

          {/* Recent preview */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {[...monthExpenses]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 10)
                  .map((exp) => {
                    const cat = getCategoryById(exp.categoryId);
                    return (
                      <tr key={exp.id}>
                        <td>{new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                        <td>{exp.description}</td>
                        <td><span className={styles.badge} style={{ background: cat?.color + "18", color: cat?.color }}>{cat?.name}</span></td>
                        <td className={styles.amtCell}>{formatCurrency(exp.amount)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {monthExpenses.length > 10 && (
              <p className={styles.moreText}>... and {monthExpenses.length - 10} more in the full report</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
