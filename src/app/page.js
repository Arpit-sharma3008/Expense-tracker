"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import styles from "./page.module.css";

export default function Dashboard() {
  const { expenses, debts, subscriptions, categories, getCategoryById } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
  const lastMonthPrefix = currentMonth === 1
    ? `${currentYear - 1}-12`
    : `${currentYear}-${String(currentMonth - 1).padStart(2, "0")}`;

  /* ---- Stats ---- */
  const stats = useMemo(() => {
    const thisMonth = expenses.filter((e) => e.date.startsWith(monthPrefix));
    const lastMonth = expenses.filter((e) => e.date.startsWith(lastMonthPrefix));
    const thisTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
    const lastTotal = lastMonth.reduce((s, e) => s + e.amount, 0);
    const change = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : 0;

    const totalDebt = debts.reduce((s, d) => s + d.remainingBalance, 0);
    const activeSubs = subscriptions.filter((s) => s.active);
    const monthlySubCost = activeSubs.reduce((s, sub) => s + sub.amount, 0);

    const today = now.toISOString().split("T")[0];
    const todayTotal = expenses
      .filter((e) => e.date === today)
      .reduce((s, e) => s + e.amount, 0);

    return { thisTotal, lastTotal, change, totalDebt, monthlySubCost, todayTotal, txCount: thisMonth.length };
  }, [expenses, debts, subscriptions, monthPrefix, lastMonthPrefix]);

  /* ---- Category Breakdown (Pie) ---- */
  const categoryData = useMemo(() => {
    const thisMonth = expenses.filter((e) => e.date.startsWith(monthPrefix));
    const map = {};
    thisMonth.forEach((e) => {
      map[e.categoryId] = (map[e.categoryId] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([id, total]) => {
        const cat = getCategoryById(id);
        return { name: cat?.name || "Other", value: Math.round(total), color: cat?.color || "#8e95a9", icon: cat?.icon || "📦" };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses, monthPrefix, getCategoryById]);

  /* ---- Daily Spend Trend (Area) ---- */
  const dailyTrend = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const total = expenses
        .filter((e) => e.date === key)
        .reduce((s, e) => s + e.amount, 0);
      days.push({ date: `${d.getDate()}/${d.getMonth() + 1}`, amount: Math.round(total) });
    }
    return days;
  }, [expenses]);

  /* ---- Weekly Bar ---- */
  const weeklyData = useMemo(() => {
    const weekLabels = ["This Week", "Last Week", "2 Weeks Ago", "3 Weeks Ago"];
    return weekLabels.map((label, i) => {
      const start = new Date(now);
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const total = expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d >= start && d < end;
        })
        .reduce((s, e) => s + e.amount, 0);
      return { week: label, amount: Math.round(total) };
    }).reverse();
  }, [expenses]);

  /* ---- Recent Expenses ---- */
  const recentExpenses = expenses.slice(0, 8);

  const formatCurrency = (v) => `₹${v.toLocaleString("en-IN")}`;

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        onMenuClick={() => {
          const event = new CustomEvent("toggle-sidebar");
          window.dispatchEvent(event);
        }}
      />

      <div className={styles.page}>
        {/* ---- Stat Cards ---- */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statPrimary}`}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>This Month</span>
              <span className={styles.statValue}>{formatCurrency(stats.thisTotal)}</span>
              <span className={`${styles.statChange} ${stats.change <= 0 ? styles.positive : styles.negative}`}>
                {stats.change <= 0 ? "↓" : "↑"} {Math.abs(stats.change).toFixed(1)}% vs last month
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Today</span>
              <span className={styles.statValue}>{formatCurrency(stats.todayTotal)}</span>
              <span className={styles.statMeta}>{stats.txCount} transactions this month</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏦</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Total Debt</span>
              <span className={styles.statValue}>{formatCurrency(stats.totalDebt)}</span>
              <span className={styles.statMeta}>{debts.length} active debts</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔁</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Subscriptions</span>
              <span className={styles.statValue}>{formatCurrency(stats.monthlySubCost)}</span>
              <span className={styles.statMeta}>{subscriptions.filter((s) => s.active).length} active</span>
            </div>
          </div>
        </div>

        {/* ---- Charts Row ---- */}
        <div className={styles.chartsRow}>
          {/* Daily Trend */}
          <div className={`card ${styles.chartCard} ${styles.chartWide}`}>
            <div className={styles.chartHeader}>
              <h3>Spending Trend</h3>
              <span className={styles.chartSubtitle}>Last 30 days</span>
            </div>
            <div className={styles.chartBody}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dailyTrend}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", borderRadius: 10, fontSize: 13 }}
                    formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Spent"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#areaGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Pie */}
          <div className={`card ${styles.chartCard}`}>
            <div className={styles.chartHeader}>
              <h3>By Category</h3>
              <span className={styles.chartSubtitle}>This month</span>
            </div>
            <div className={styles.chartBody} style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", borderRadius: 10, fontSize: 13 }}
                    formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.pieLegend}>
                {categoryData.slice(0, 5).map((entry) => (
                  <div key={entry.name} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: entry.color }} />
                    <span className={styles.legendLabel}>{entry.icon} {entry.name}</span>
                    <span className={styles.legendValue}>{formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ---- Bottom Row ---- */}
        <div className={styles.bottomRow}>
          {/* Weekly Comparison */}
          <div className={`card ${styles.chartCard}`}>
            <div className={styles.chartHeader}>
              <h3>Weekly Comparison</h3>
              <span className={styles.chartSubtitle}>Last 4 weeks</span>
            </div>
            <div className={styles.chartBody}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", borderRadius: 10, fontSize: 13 }}
                    formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Spent"]}
                    cursor={{ fill: "var(--color-primary-subtle)" }}
                  />
                  <Bar dataKey="amount" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className={`card ${styles.chartCard}`}>
            <div className={styles.chartHeader}>
              <h3>Recent Expenses</h3>
              <a href="/expenses" className={styles.viewAll}>View all →</a>
            </div>
            <div className={styles.txList}>
              {recentExpenses.map((exp) => {
                const cat = getCategoryById(exp.categoryId);
                return (
                  <div key={exp.id} className={styles.txItem}>
                    <div className={styles.txIcon} style={{ background: cat?.color + "18" }}>
                      {cat?.icon || "📦"}
                    </div>
                    <div className={styles.txInfo}>
                      <span className={styles.txName}>{exp.description}</span>
                      <span className={styles.txCat}>{cat?.name} · {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    </div>
                    <span className={styles.txAmount}>-{formatCurrency(exp.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
