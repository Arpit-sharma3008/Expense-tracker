"use client";

import { useMemo } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, Legend
} from "recharts";
import Link from "next/link";
import styles from "./page.module.css";

export default function StallDashboard() {
  const { sales, expenses, wastage, closures, getCategoryById } = useData();

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const formatCurrency = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

  /* ---- Calculated Financial Stats ---- */
  const stats = useMemo(() => {
    const todaySales = (sales || []).filter((s) => s && s.date === todayStr);
    const todayExpenses = (expenses || []).filter((e) => e && e.date === todayStr);
    const todayWastage = (wastage || []).filter((w) => w && w.date === todayStr);

    const todayRev = todaySales.reduce((s, x) => s + (parseFloat(x?.totalAmount) || 0), 0);
    const todayExp = todayExpenses.reduce((s, x) => s + (parseFloat(x?.amount) || 0), 0);
    const todayWaste = todayWastage.reduce((s, x) => s + (parseFloat(x?.estimatedCost) || 0), 0);
    const todayNet = todayRev - todayExp - todayWaste;

    // Total All-time Stats
    const totalRev = (sales || []).reduce((s, x) => s + (parseFloat(x?.totalAmount) || 0), 0);
    const totalExp = (expenses || []).reduce((s, x) => s + (parseFloat(x?.amount) || 0), 0);
    const totalWaste = (wastage || []).reduce((s, x) => s + (parseFloat(x?.estimatedCost) || 0), 0);
    const netProfit = totalRev - totalExp - totalWaste;
    const margin = totalRev > 0 ? (netProfit / totalRev) * 100 : 0;

    // Payment Mode Split
    const cashTotal = (sales || []).reduce((s, x) => s + (parseFloat(x?.cashAmount) || 0), 0);
    const upiTotal = (sales || []).reduce((s, x) => s + (parseFloat(x?.upiAmount) || 0), 0);
    const cardTotal = (sales || []).reduce((s, x) => s + (parseFloat(x?.cardAmount) || 0), 0);

    return {
      todayRev, todayExp, todayWaste, todayNet,
      totalRev, totalExp, totalWaste, netProfit, margin,
      cashTotal, upiTotal, cardTotal,
    };
  }, [sales, expenses, wastage, todayStr]);

  /* ---- Comprehensive Daily Review & Net Profit Diagnostic ---- */
  const dailyReview = useMemo(() => {
    const todaySales = (sales || []).filter((s) => s && s.date === todayStr);
    const todayExpenses = (expenses || []).filter((e) => e && e.date === todayStr);
    const todayWastage = (wastage || []).filter((w) => w && w.date === todayStr);

    const todayRev = todaySales.reduce((s, x) => s + (parseFloat(x?.totalAmount) || 0), 0);
    const todayExp = todayExpenses.reduce((s, x) => s + (parseFloat(x?.amount) || 0), 0);
    const todayWaste = todayWastage.reduce((s, x) => s + (parseFloat(x?.estimatedCost) || 0), 0);

    let todayBowlsCount = 0;
    const itemBreakdownMap = {};

    todaySales.forEach((s) => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach((item) => {
          const qty = parseInt(item.qty || 1);
          const name = item.name || "Item";
          const price = parseFloat(item.price || 0);
          const rev = price * qty;
          todayBowlsCount += qty;

          if (!itemBreakdownMap[name]) {
            itemBreakdownMap[name] = { name, qty: 0, rev: 0 };
          }
          itemBreakdownMap[name].qty += qty;
          itemBreakdownMap[name].rev += rev;
        });
      }
    });

    // Pure Today Performance: Today Sales - Today Purchases/Expenses - Today Spoilage
    const todayNetProfit = todayRev - todayExp - todayWaste;
    const todayMargin = todayRev > 0 ? (todayNetProfit / todayRev) * 100 : 0;
    const isProfit = todayNetProfit > 0;
    const isLoss = todayNetProfit < 0;

    const itemBreakdown = Object.values(itemBreakdownMap).sort((a, b) => b.rev - a.rev);

    return {
      todayRev,
      todayExp,
      todayWaste,
      todayNetProfit,
      todayMargin,
      isProfit,
      isLoss,
      todayBowlsCount,
      itemBreakdown,
      salesCount: todaySales.length,
      expensesCount: todayExpenses.length,
    };
  }, [sales, expenses, wastage, todayStr]);

  /* ---- Payment Mode Pie Data ---- */
  const paymentData = useMemo(() => {
    return [
      { name: "UPI / QR", value: stats.upiTotal, color: "#10b981" },
      { name: "Cash", value: stats.cashTotal, color: "#f59e0b" },
      { name: "Card", value: stats.cardTotal, color: "#3b82f6" },
    ].filter(item => item.value > 0);
  }, [stats]);

  /* ---- Daily Financial Trend (Last 14 Days) ---- */
  const dailyTrend = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const dayName = `${d.getDate()}/${d.getMonth() + 1}`;

      const dayRev = (sales || []).filter(s => s && s.date === dateKey).reduce((s, x) => s + (parseFloat(x?.totalAmount) || 0), 0);
      const dayExp = (expenses || []).filter(e => e && e.date === dateKey).reduce((s, x) => s + (parseFloat(x?.amount) || 0), 0);
      const dayWaste = (wastage || []).filter(w => w && w.date === dateKey).reduce((s, x) => s + (parseFloat(x?.estimatedCost) || 0), 0);
      const dayNet = dayRev - dayExp - dayWaste;

      days.push({
        date: dayName,
        Revenue: Math.round(dayRev),
        Expenses: Math.round(dayExp),
        Wastage: Math.round(dayWaste),
        NetProfit: Math.round(dayNet),
      });
    }
    return days;
  }, [sales, expenses, wastage]);

  /* ---- Category Expense Breakdown ---- */
  const categoryData = useMemo(() => {
    const map = {};
    (expenses || []).forEach((e) => {
      if (e && e.categoryId) {
        map[e.categoryId] = (map[e.categoryId] || 0) + (parseFloat(e.amount) || 0);
      }
    });
    return Object.entries(map)
      .map(([id, total]) => {
        const cat = getCategoryById ? getCategoryById(id) : null;
        return { 
          name: cat?.name || id || "Miscellaneous", 
          value: Math.round(total), 
          color: cat?.color || "#64748b", 
          icon: cat?.icon || "🧾" 
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses, getCategoryById]);

  // Latest activity combined
  const recentActivities = useMemo(() => {
    const combined = [
      ...(sales || []).map(s => ({ type: "sale", title: `Sales Entry (${s?.items?.length || 'Quick'} items)`, amount: parseFloat(s?.totalAmount) || 0, date: s?.date || todayStr, time: s?.time || "12:00", icon: "🛒", color: "#10b981" })),
      ...(expenses || []).map(e => ({ type: "expense", title: e?.title || "Expense", amount: parseFloat(e?.amount) || 0, date: e?.date || todayStr, time: "Bill", icon: "🧾", color: "#ef4444" })),
      ...(wastage || []).map(w => ({ type: "wastage", title: `Wastage: ${w?.itemName || 'Item'}`, amount: parseFloat(w?.estimatedCost) || 0, date: w?.date || todayStr, time: "Waste", icon: "🗑️", color: "#f59e0b" })),
    ];
    return combined.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);
  }, [sales, expenses, wastage, todayStr]);

  return (
    <>
      <Header
        title="Stall Overview & P&L"
        subtitle={now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        onMenuClick={() => {
          const event = new CustomEvent("toggle-sidebar");
          window.dispatchEvent(event);
        }}
      />

      <div className={styles.page}>
        {/* Quick Shortcut Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          <Link href="/sales" className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px", borderRadius: "12px", textDecoration: "none", fontWeight: 600 }}>
            <span style={{ fontSize: "1.2rem" }}>🛒</span> Record Sales POS
          </Link>
          <Link href="/expenses" className="btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px", borderRadius: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-color)", textDecoration: "none", fontWeight: 600 }}>
            <span style={{ fontSize: "1.2rem" }}>🧾</span> Add Expense & Bill
          </Link>
          <Link href="/inventory" className="btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px", borderRadius: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-color)", textDecoration: "none", fontWeight: 600 }}>
            <span style={{ fontSize: "1.2rem" }}>📦</span> Inventory Stock
          </Link>
          <Link href="/wastage" className="btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px", borderRadius: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-color)", textDecoration: "none", fontWeight: 600 }}>
            <span style={{ fontSize: "1.2rem" }}>🗑️</span> Log Wastage
          </Link>
          <Link href="/closure" className="btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px", borderRadius: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-color)", textDecoration: "none", fontWeight: 600 }}>
            <span style={{ fontSize: "1.2rem" }}>💵</span> Cash Drawer
          </Link>
        </div>

        {/* ---- TODAY'S REAL-TIME P&L REVIEW & PROFIT DIAGNOSTIC ---- */}
        <div className="card" style={{
          padding: "20px",
          borderRadius: "16px",
          marginBottom: "24px",
          border: dailyReview.isProfit
            ? "1px solid rgba(16,185,129,0.4)"
            : dailyReview.isLoss
            ? "1px solid rgba(239,68,68,0.4)"
            : "1px solid var(--border-color)",
          background: dailyReview.isProfit
            ? "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))"
            : dailyReview.isLoss
            ? "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))"
            : "var(--bg-elevated)",
        }}>
          {/* Header & Status Badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.3rem" }}>📋</span>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700" }}>Daily P&L Review</h2>
              </div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                Real-time financial performance for Today ({now.toLocaleDateString("en-IN", { month: "short", day: "numeric" })})
              </span>
            </div>

            {/* Profit/Loss Status Badge */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "12px",
              fontWeight: "800",
              fontSize: "0.9rem",
              background: dailyReview.isProfit ? "rgba(16,185,129,0.15)" : dailyReview.isLoss ? "rgba(239,68,68,0.15)" : "var(--bg-surface)",
              color: dailyReview.isProfit ? "#10b981" : dailyReview.isLoss ? "#ef4444" : "var(--text-secondary)",
              border: dailyReview.isProfit ? "1px solid rgba(16,185,129,0.4)" : dailyReview.isLoss ? "1px solid rgba(239,68,68,0.4)" : "1px solid var(--border-color)",
            }}>
              <span>{dailyReview.isProfit ? "🟢 IN PROFIT TODAY" : dailyReview.isLoss ? "🔴 OPERATING AT LOSS" : "⚪ BREAK EVEN / NO SALES"}</span>
              <span>({dailyReview.todayNetProfit >= 0 ? "+" : ""}{formatCurrency(dailyReview.todayNetProfit)})</span>
            </div>
          </div>

          {/* P&L Metric Breakdown Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "16px" }}>
            <div style={{ background: "var(--bg-surface)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block" }}>Today's Sales Revenue</span>
              <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#10b981" }}>{formatCurrency(dailyReview.todayRev)}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", display: "block" }}>{dailyReview.salesCount} Sales Logged</span>
            </div>

            <div style={{ background: "var(--bg-surface)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block" }}>Today's Purchases & Expenses</span>
              <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#ef4444" }}>-{formatCurrency(dailyReview.todayExp)}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", display: "block" }}>{dailyReview.expensesCount} Bills / Purchases</span>
            </div>

            <div style={{ background: "var(--bg-surface)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block" }}>Today's Spoilage / Wastage</span>
              <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#ec4899" }}>-{formatCurrency(dailyReview.todayWaste)}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", display: "block" }}>Wastage Log</span>
            </div>

            <div style={{
              background: dailyReview.isProfit ? "rgba(16,185,129,0.12)" : dailyReview.isLoss ? "rgba(239,68,68,0.12)" : "var(--bg-surface)",
              padding: "14px",
              borderRadius: "10px",
              border: dailyReview.isProfit ? "1px solid rgba(16,185,129,0.3)" : dailyReview.isLoss ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--border-color)",
            }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block" }}>Today's Net Profit / Loss</span>
              <span style={{ fontSize: "1.2rem", fontWeight: "800", color: dailyReview.isProfit ? "#10b981" : dailyReview.isLoss ? "#ef4444" : "var(--text-primary)" }}>
                {dailyReview.todayNetProfit >= 0 ? "+" : ""}{formatCurrency(dailyReview.todayNetProfit)}
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: dailyReview.isProfit ? "#10b981" : dailyReview.isLoss ? "#ef4444" : "var(--text-tertiary)", display: "block" }}>
                Margin: {dailyReview.todayMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* AI Daily Business Insights */}
          <div style={{
            background: "var(--bg-surface)",
            padding: "14px",
            borderRadius: "12px",
            fontSize: "0.85rem",
            lineHeight: "1.5",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
          }}>
            <div style={{ fontWeight: "700", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px", color: "var(--color-primary)" }}>
              <span>💡 Daily Business Summary:</span>
            </div>
            {dailyReview.todayRev === 0 && dailyReview.todayExp === 0 ? (
              <span style={{ color: "var(--text-tertiary)" }}>
                No sales or expense purchases recorded yet today ({now.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}). Use the buttons above to log sales and daily purchases!
              </span>
            ) : dailyReview.isProfit ? (
              <span>
                Awesome! Your stall collected <strong>{formatCurrency(dailyReview.todayRev)}</strong> in sales today ({dailyReview.todayBowlsCount} items sold) and made <strong>{formatCurrency(dailyReview.todayExp)}</strong> in purchases/expenses. Your net profit for today is <strong style={{ color: "#10b981" }}>+{formatCurrency(dailyReview.todayNetProfit)}</strong> with a net profit margin of <strong style={{ color: "#10b981" }}>{dailyReview.todayMargin.toFixed(1)}%</strong>!
              </span>
            ) : (
              <span>
                Your stall collected <strong>{formatCurrency(dailyReview.todayRev)}</strong> in sales today, while today's purchases & expenses were <strong>{formatCurrency(dailyReview.todayExp)}</strong> ({dailyReview.todayWaste > 0 ? `+ ${formatCurrency(dailyReview.todayWaste)} wastage` : ""}). 
                Today's net status is <strong style={{ color: "#ef4444" }}>{formatCurrency(dailyReview.todayNetProfit)}</strong>. 
                <em> Buying milk, fruits, or packaging in bulk increases today's purchase bill, but stocks your inventory for future sales!</em>
              </span>
            )}
          </div>

          {/* Today's Product Contribution Breakdown */}
          {dailyReview.itemBreakdown.length > 0 && (
            <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed var(--border-color)" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-tertiary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🍱 Today's Item Sales Breakdown
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
                {dailyReview.itemBreakdown.map((item) => (
                  <div key={item.name} style={{ background: "var(--bg-surface)", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border-color)" }}>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "0.85rem" }}>{item.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{item.qty} sold</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "#10b981" }}>{formatCurrency(item.rev)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ---- Stat Cards ---- */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statPrimary}`}>
            <div className={styles.statIcon}>📈</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Net Profit</span>
              <span className={styles.statValue}>{formatCurrency(stats.netProfit)}</span>
              <span className={styles.statMeta} style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                Margin: {stats.margin.toFixed(1)}% · Today: {formatCurrency(stats.todayNet)}
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Total Sales Revenue</span>
              <span className={styles.statValue}>{formatCurrency(stats.totalRev)}</span>
              <span className={styles.statMeta} style={{ color: "#10b981", fontWeight: 600 }}>
                Today: {formatCurrency(stats.todayRev)}
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🧾</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Total Stall Expenses</span>
              <span className={styles.statValue}>{formatCurrency(stats.totalExp)}</span>
              <span className={styles.statMeta} style={{ color: "#ef4444" }}>
                Today: {formatCurrency(stats.todayExp)}
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🗑️</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Wastage / Spoilage Loss</span>
              <span className={styles.statValue}>{formatCurrency(stats.totalWaste)}</span>
              <span className={styles.statMeta} style={{ color: "#f59e0b" }}>
                Today: {formatCurrency(stats.todayWaste)}
              </span>
            </div>
          </div>
        </div>

        {/* ---- Charts Row ---- */}
        <div className={styles.chartsRow}>
          {/* Daily Trend Chart */}
          <div className={`card ${styles.chartCard} ${styles.chartWide}`}>
            <div className={styles.chartHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Financial Trend (14 Days)</h3>
                <span className={styles.chartSubtitle}>Revenue vs Expenses vs Wastage</span>
              </div>
            </div>
            <div className={styles.chartBody}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dailyTrend}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", borderRadius: 10, fontSize: 13 }}
                    formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, ""]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" />
                  <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" />
                  <Area type="monotone" dataKey="Wastage" stroke="#f59e0b" strokeWidth={2} fill="none" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Method Pie */}
          <div className={`card ${styles.chartCard}`}>
            <div className={styles.chartHeader}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Sales Payment Modes</h3>
              <span className={styles.chartSubtitle}>UPI vs Cash vs Card</span>
            </div>
            <div className={styles.chartBody} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              {paymentData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={paymentData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                        {paymentData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", borderRadius: 10, fontSize: 13 }}
                        formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginTop: "10px" }}>
                    {paymentData.map(p => (
                      <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
                        <span>{p.name}: {formatCurrency(p.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ padding: "40px", color: "var(--text-tertiary)", textAlign: "center" }}>No sales logged yet</div>
              )}
            </div>
          </div>
        </div>

        {/* ---- Bottom Row ---- */}
        <div className={styles.bottomRow}>
          {/* Expense Category Breakdown */}
          <div className={`card ${styles.chartCard}`}>
            <div className={styles.chartHeader}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Expense Breakdown</h3>
              <span className={styles.chartSubtitle}>By Stall Category</span>
            </div>
            <div className={styles.chartBody}>
              {categoryData.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {categoryData.map((cat) => (
                    <div key={cat.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.2rem" }}>{cat.icon}</span>
                        <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{cat.name}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "30px", color: "var(--text-tertiary)", textAlign: "center" }}>No expenses logged yet</div>
              )}
            </div>
          </div>

          {/* Recent Operations Log */}
          <div className={`card ${styles.chartCard}`}>
            <div className={styles.chartHeader}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Recent Stall Logs</h3>
              <span className={styles.chartSubtitle}>Latest 7 Transactions</span>
            </div>
            <div className={styles.txList}>
              {recentActivities.length > 0 ? (
                recentActivities.map((act, idx) => (
                  <div key={idx} className={styles.txItem}>
                    <div className={styles.txIcon} style={{ background: act.color + "18" }}>
                      {act.icon}
                    </div>
                    <div className={styles.txInfo}>
                      <span className={styles.txName}>{act.title}</span>
                      <span className={styles.txCat}>{act.date} · {act.time}</span>
                    </div>
                    <span className={styles.txAmount} style={{ color: act.type === "sale" ? "#10b981" : act.color }}>
                      {act.type === "sale" ? "+" : "-"}{formatCurrency(act.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: "30px", color: "var(--text-tertiary)", textAlign: "center" }}>No recent operations recorded</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
