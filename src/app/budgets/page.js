"use client";

import { useMemo, useState, useCallback } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";
import styles from "./budgets.module.css";

/* ---- Smart Budget Engine ---- */
function generateSmartBudgets({ categories, expenses, monthlyIncome, savingsGoalPct, mode }) {
  const now = new Date();
  const suggestions = [];

  // Gather spending data from past 3 months
  const monthlySpending = {};
  categories.forEach((cat) => {
    monthlySpending[cat.id] = [];
  });

  for (let offset = 1; offset <= 3; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthExpenses = expenses.filter((e) => e.date.startsWith(prefix));

    categories.forEach((cat) => {
      const total = monthExpenses
        .filter((e) => e.categoryId === cat.id)
        .reduce((s, e) => s + e.amount, 0);
      monthlySpending[cat.id].push(total);
    });
  }

  const savingsAmount = monthlyIncome * (savingsGoalPct / 100);
  const spendableBudget = monthlyIncome - savingsAmount;

  categories.forEach((cat) => {
    const history = monthlySpending[cat.id];
    const avg = history.reduce((s, v) => s + v, 0) / Math.max(history.length, 1);
    const max = Math.max(...history, 0);
    const hasHistory = avg > 0;

    let suggested = 0;
    let reasoning = "";

    if (mode === "auto" && hasHistory) {
      // Auto mode: Use past data intelligently
      if (cat.name.includes("Rent") || cat.name.includes("Bills")) {
        // Fixed costs: use the max from history + small buffer
        suggested = Math.ceil(max * 1.05 / 100) * 100;
        reasoning = `Fixed cost — based on your highest month (₹${Math.round(max).toLocaleString("en-IN")}) + 5% buffer`;
      } else if (cat.name.includes("Groceries") || cat.name.includes("Food")) {
        // Essentials: use average + 10% buffer
        suggested = Math.ceil(avg * 1.1 / 100) * 100;
        reasoning = `Essential — 3-month avg (₹${Math.round(avg).toLocaleString("en-IN")}) + 10% flexibility`;
      } else {
        // Discretionary: try to trim by 10-15%
        const trimFactor = 0.9;
        suggested = Math.ceil(avg * trimFactor / 100) * 100;
        reasoning = avg > 0
          ? `Discretionary — trimmed 10% from avg (₹${Math.round(avg).toLocaleString("en-IN")}) to help you save`
          : `No past spending detected — set to ₹0`;
      }
    } else if (mode === "income" && monthlyIncome > 0) {
      // Income-based: allocate proportionally from spendable budget
      const totalAvgSpending = Object.values(monthlySpending).reduce(
        (s, arr) => s + arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1),
        0
      );

      if (totalAvgSpending > 0 && hasHistory) {
        const proportion = avg / totalAvgSpending;
        suggested = Math.ceil((proportion * spendableBudget) / 100) * 100;
        reasoning = `${(proportion * 100).toFixed(0)}% of your spendable budget (₹${Math.round(spendableBudget).toLocaleString("en-IN")})`;
      } else if (hasHistory) {
        suggested = Math.ceil(avg / 100) * 100;
        reasoning = `Based on 3-month average`;
      } else {
        suggested = 0;
        reasoning = `No spending history — skipped`;
      }
    } else {
      // Fallback
      suggested = hasHistory ? Math.ceil(avg / 100) * 100 : 0;
      reasoning = hasHistory ? `Based on 3-month average` : `No past data`;
    }

    suggestions.push({
      categoryId: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      suggested,
      avgSpend: Math.round(avg),
      maxSpend: Math.round(max),
      reasoning,
      hasHistory,
    });
  });

  return suggestions;
}

export default function BudgetsPage() {
  const { categories, budgets, setBudget, getExpensesByMonth, expenses } = useData();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  const monthExpenses = useMemo(() => getExpensesByMonth(year, month), [getExpensesByMonth, year, month]);

  const budgetData = useMemo(() => {
    return categories.map((cat) => {
      const budget = budgets.find((b) => b.categoryId === cat.id && b.month === monthKey);
      const spent = monthExpenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0);
      const limit = budget?.monthlyLimit || 0;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      return { ...cat, spent, limit, pct, hasBudget: !!budget };
    });
  }, [categories, budgets, monthExpenses, monthKey]);

  const totalBudget = budgetData.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgetData.reduce((s, b) => s + (b.hasBudget ? b.spent : 0), 0);
  const formatCurrency = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

  const handleLimitChange = (catId, value) => {
    const num = parseFloat(value) || 0;
    setBudget(catId, num, monthKey);
  };

  const getStatusColor = (pct) => {
    if (pct >= 100) return "var(--color-danger)";
    if (pct >= 80) return "var(--color-warning)";
    return "var(--color-success)";
  };

  /* ---- Smart AI Budget State ---- */
  const [showAI, setShowAI] = useState(false);
  const [aiMode, setAiMode] = useState("auto"); // "auto" | "income"
  const [monthlyIncome, setMonthlyIncome] = useState(50000);
  const [savingsGoalPct, setSavingsGoalPct] = useState(20);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    // Simulate a brief "thinking" delay for UX
    setTimeout(() => {
      const suggestions = generateSmartBudgets({
        categories,
        expenses,
        monthlyIncome,
        savingsGoalPct,
        mode: aiMode,
      });
      setAiSuggestions(suggestions);
      setIsGenerating(false);
    }, 800);
  }, [categories, expenses, monthlyIncome, savingsGoalPct, aiMode]);

  const handleApplyAll = useCallback(() => {
    if (!aiSuggestions) return;
    aiSuggestions.forEach((s) => {
      if (s.suggested > 0) {
        setBudget(s.categoryId, s.suggested, monthKey);
      }
    });
    setShowAI(false);
    setAiSuggestions(null);
  }, [aiSuggestions, setBudget, monthKey]);

  const handleApplySingle = useCallback(
    (categoryId, amount) => {
      setBudget(categoryId, amount, monthKey);
    },
    [setBudget, monthKey]
  );

  const totalSuggested = aiSuggestions ? aiSuggestions.reduce((s, item) => s + item.suggested, 0) : 0;

  return (
    <>
      <Header title="Budgets" subtitle={`${now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`} />

      <div className={styles.page}>
        {/* Overview */}
        <div className={styles.overview}>
          <div className={styles.ovMain}>
            <span className={styles.ovLabel}>Total Budget</span>
            <span className={styles.ovValue}>{formatCurrency(totalBudget)}</span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${Math.min((totalSpent / (totalBudget || 1)) * 100, 100)}%`, background: getStatusColor((totalSpent / (totalBudget || 1)) * 100) }} />
            </div>
            <span className={styles.ovMeta}>{formatCurrency(totalSpent)} spent of {formatCurrency(totalBudget)}</span>
          </div>
          <div className={styles.ovSide}>
            <div className={styles.ovMini}>
              <span className={styles.ovMiniLabel}>Remaining</span>
              <span className={styles.ovMiniValue}>{formatCurrency(Math.max(totalBudget - totalSpent, 0))}</span>
            </div>
            <div className={styles.ovMini}>
              <span className={styles.ovMiniLabel}>Categories</span>
              <span className={styles.ovMiniValue}>{budgetData.filter((b) => b.hasBudget).length}</span>
            </div>
          </div>
        </div>

        {/* ---- Smart AI Budget Button ---- */}
        <button className={styles.aiButton} onClick={() => { setShowAI(true); setAiSuggestions(null); }}>
          <span className={styles.aiButtonIcon}>🧠</span>
          <div className={styles.aiButtonText}>
            <strong>Smart Budget Advisor</strong>
            <span>Auto-generate budgets from your past spending data or income</span>
          </div>
          <span className={styles.aiArrow}>→</span>
        </button>

        {/* Budget Cards */}
        <div className={styles.grid}>
          {budgetData.map((item) => (
            <div key={item.id} className={`card ${styles.budgetCard}`}>
              <div className={styles.cardTop}>
                <span className={styles.catIcon} style={{ background: item.color + "18" }}>{item.icon}</span>
                <div className={styles.catInfo}>
                  <span className={styles.catName}>{item.name}</span>
                  <span className={styles.catSpent}>{formatCurrency(item.spent)} spent</span>
                </div>
                {item.hasBudget && item.pct >= 90 && (
                  <span className={`badge ${item.pct >= 100 ? "badge-danger" : "badge-warning"}`}>
                    {item.pct >= 100 ? "Over Budget!" : "Almost!"}
                  </span>
                )}
              </div>

              {item.hasBudget && (
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${Math.min(item.pct, 100)}%`, background: getStatusColor(item.pct) }} />
                </div>
              )}

              <div className={styles.limitRow}>
                <span className={styles.limitLabel}>Monthly Limit</span>
                <div className={styles.limitInput}>
                  <span>₹</span>
                  <input
                    type="number"
                    value={item.limit || ""}
                    onChange={(e) => handleLimitChange(item.id, e.target.value)}
                    placeholder="Set budget"
                    min="0"
                    step="500"
                  />
                </div>
              </div>

              {item.hasBudget && (
                <div className={styles.cardFooter}>
                  <span>{formatCurrency(Math.max(item.limit - item.spent, 0))} remaining</span>
                  <span>{Math.round(item.pct)}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===== SMART AI BUDGET MODAL ===== */}
      {showAI && (
        <div className={styles.modalOverlay} onClick={() => setShowAI(false)}>
          <div className={styles.aiModal} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.aiHeader}>
              <div className={styles.aiHeaderLeft}>
                <span className={styles.aiLogo}>🧠</span>
                <div>
                  <h3>Smart Budget Advisor</h3>
                  <p>Let AI analyze your spending and suggest optimal budgets</p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowAI(false)}>×</button>
            </div>

            {/* Mode Selector */}
            <div className={styles.aiBody}>
              <div className={styles.modeSection}>
                <span className={styles.sectionLabel}>How should we calculate?</span>
                <div className={styles.modeTabs}>
                  <button
                    className={`${styles.modeTab} ${aiMode === "auto" ? styles.modeActive : ""}`}
                    onClick={() => setAiMode("auto")}
                  >
                    <span>📊</span>
                    <div>
                      <strong>Auto (Past Data)</strong>
                      <small>Analyze your last 3 months of spending</small>
                    </div>
                  </button>
                  <button
                    className={`${styles.modeTab} ${aiMode === "income" ? styles.modeActive : ""}`}
                    onClick={() => setAiMode("income")}
                  >
                    <span>💰</span>
                    <div>
                      <strong>Income-Based</strong>
                      <small>Allocate from your income & savings goal</small>
                    </div>
                  </button>
                </div>
              </div>

              {/* Income inputs (shown for income mode) */}
              {aiMode === "income" && (
                <div className={styles.inputSection}>
                  <div className={styles.inputGroup}>
                    <label>Monthly Income (₹)</label>
                    <input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                      min="0"
                      step="1000"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Savings Goal (%)</label>
                    <div className={styles.sliderRow}>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        value={savingsGoalPct}
                        onChange={(e) => setSavingsGoalPct(Number(e.target.value))}
                        className={styles.slider}
                      />
                      <span className={styles.sliderValue}>{savingsGoalPct}%</span>
                    </div>
                    <div className={styles.incomeBreakdown}>
                      <span>Savings: {formatCurrency(monthlyIncome * savingsGoalPct / 100)}</span>
                      <span>Spendable: {formatCurrency(monthlyIncome * (1 - savingsGoalPct / 100))}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button className={styles.generateBtn} onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <><span className="spinner" /> Analyzing your spending patterns...</>
                ) : (
                  <>✨ Generate Smart Budgets</>
                )}
              </button>

              {/* ---- Results ---- */}
              {aiSuggestions && (
                <div className={styles.resultsSection}>
                  <div className={styles.resultsSummary}>
                    <div className={styles.resultsStat}>
                      <span>Total Suggested</span>
                      <strong>{formatCurrency(totalSuggested)}</strong>
                    </div>
                    {aiMode === "income" && (
                      <div className={styles.resultsStat}>
                        <span>Savings Left</span>
                        <strong>{formatCurrency(monthlyIncome - totalSuggested)}</strong>
                      </div>
                    )}
                    <button className={`btn btn-primary ${styles.applyAllBtn}`} onClick={handleApplyAll}>
                      ✅ Apply All
                    </button>
                  </div>

                  <div className={styles.suggestionList}>
                    {aiSuggestions.filter((s) => s.suggested > 0 || s.hasHistory).map((s) => (
                      <div key={s.categoryId} className={styles.suggestionItem}>
                        <div className={styles.suggestionLeft}>
                          <span className={styles.suggestionIcon} style={{ background: s.color + "18" }}>{s.icon}</span>
                          <div className={styles.suggestionInfo}>
                            <span className={styles.suggestionName}>{s.name}</span>
                            <span className={styles.suggestionReason}>{s.reasoning}</span>
                            {s.hasHistory && (
                              <span className={styles.suggestionHistory}>
                                Avg: {formatCurrency(s.avgSpend)} · Max: {formatCurrency(s.maxSpend)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={styles.suggestionRight}>
                          <span className={styles.suggestionAmount}>{formatCurrency(s.suggested)}</span>
                          <button
                            className={styles.applyOneBtn}
                            onClick={() => handleApplySingle(s.categoryId, s.suggested)}
                            title="Apply this budget"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
