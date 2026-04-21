"use client";

import { useMemo, useState, useCallback } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";
import styles from "./budgets.module.css";

/* ---- Category Classification ---- */
const CATEGORY_TYPES = {
  fixed: ["cat-9", "cat-4"],        // Rent, Bills & Utilities
  essential: ["cat-1", "cat-8"],     // Food & Dining, Groceries
  important: ["cat-2", "cat-6", "cat-7", "cat-10"], // Transport, Health, Education, Subscriptions
  discretionary: ["cat-3", "cat-5", "cat-11", "cat-12"], // Shopping, Entertainment, Travel, Other
};

function getCategoryType(catId, catName) {
  if (CATEGORY_TYPES.fixed.includes(catId)) return "fixed";
  if (CATEGORY_TYPES.essential.includes(catId)) return "essential";
  if (CATEGORY_TYPES.important.includes(catId)) return "important";
  if (CATEGORY_TYPES.discretionary.includes(catId)) return "discretionary";
  // Fallback: keyword matching
  const name = catName.toLowerCase();
  if (name.includes("rent") || name.includes("emi") || name.includes("bill") || name.includes("utilit")) return "fixed";
  if (name.includes("food") || name.includes("grocer") || name.includes("dining")) return "essential";
  if (name.includes("transport") || name.includes("health") || name.includes("education") || name.includes("subscri")) return "important";
  return "discretionary";
}

/* ---- Default allocation percentages (of spendable budget) using 50/30/20 adapted ---- */
const DEFAULT_ALLOCATION = {
  fixed:         { share: 0.35, perCatFallback: [0.22, 0.13] },
  essential:     { share: 0.25, perCatFallback: [0.12, 0.13] },
  important:     { share: 0.22, perCatFallback: [0.07, 0.05, 0.05, 0.05] },
  discretionary: { share: 0.18, perCatFallback: [0.06, 0.05, 0.04, 0.03] },
};

/* ---- Smart Budget Engine ---- */
function generateSmartBudgets({ categories, expenses, subscriptions, monthlyIncome, savingsGoalPct, mode }) {
  const now = new Date();
  const suggestions = [];
  const MONTHS_TO_ANALYZE = 6;

  // Gather spending data from past N months
  const monthlySpending = {};
  categories.forEach((cat) => {
    monthlySpending[cat.id] = [];
  });

  let monthsWithData = 0;

  for (let offset = 1; offset <= MONTHS_TO_ANALYZE; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthExpenses = expenses.filter((e) => e.date.startsWith(prefix));

    if (monthExpenses.length > 0) monthsWithData++;

    categories.forEach((cat) => {
      const total = monthExpenses
        .filter((e) => e.categoryId === cat.id)
        .reduce((s, e) => s + e.amount, 0);
      monthlySpending[cat.id].push(total);
    });
  }

  // Also consider current month spending
  const currentPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthExpenses = expenses.filter((e) => e.date.startsWith(currentPrefix));

  const savingsAmount = monthlyIncome * (savingsGoalPct / 100);
  const spendableBudget = monthlyIncome - savingsAmount;

  // Calculate total average spending across all categories
  const totalAvgSpending = Object.values(monthlySpending).reduce(
    (s, arr) => {
      const nonZero = arr.filter((v) => v > 0);
      return s + (nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0);
    },
    0
  );

  // Add active subscription costs (normalized to monthly)
  const monthlySubCosts = (subscriptions || [])
    .filter((s) => s.active)
    .reduce((sum, s) => {
      const amt = parseFloat(s.amount) || 0;
      if (s.frequency === "yearly") return sum + amt / 12;
      if (s.frequency === "quarterly") return sum + amt / 3;
      return sum + amt;
    }, 0);

  // Group categories by type
  const catsByType = { fixed: [], essential: [], important: [], discretionary: [] };
  categories.forEach((cat) => {
    const type = getCategoryType(cat.id, cat.name);
    catsByType[type].push(cat.id);
  });

  const hasAnyHistory = totalAvgSpending > 0;

  categories.forEach((cat) => {
    const history = monthlySpending[cat.id];
    const nonZeroHistory = history.filter((v) => v > 0);
    const avg = nonZeroHistory.length > 0 ? nonZeroHistory.reduce((s, v) => s + v, 0) / nonZeroHistory.length : 0;
    const max = Math.max(...history, 0);
    const min = nonZeroHistory.length > 0 ? Math.min(...nonZeroHistory) : 0;
    const hasHistory = avg > 0;
    const catType = getCategoryType(cat.id, cat.name);

    // Detect spending trend (is spending increasing or decreasing?)
    const recentAvg = nonZeroHistory.slice(0, 2).reduce((s, v) => s + v, 0) / Math.max(nonZeroHistory.slice(0, 2).length, 1);
    const olderAvg = nonZeroHistory.slice(2).reduce((s, v) => s + v, 0) / Math.max(nonZeroHistory.slice(2).length, 1);
    const trend = hasHistory && olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    const trendLabel = trend > 15 ? "↗ trending up" : trend < -15 ? "↘ trending down" : "";

    // Current month spend for this category
    const currentSpend = currentMonthExpenses
      .filter((e) => e.categoryId === cat.id)
      .reduce((s, e) => s + e.amount, 0);

    // Include subscription cost for Subscriptions category
    const isSubCategory = cat.id === "cat-10" || cat.name.toLowerCase().includes("subscri");
    const subCost = isSubCategory ? monthlySubCosts : 0;

    let suggested = 0;
    let reasoning = "";

    if (mode === "auto") {
      if (hasHistory) {
        // Smart analysis based on category type
        if (catType === "fixed") {
          // Fixed costs: use max + 5% buffer (these rarely change)
          suggested = Math.ceil(max * 1.05 / 100) * 100;
          reasoning = `Fixed cost — highest month ₹${Math.round(max).toLocaleString("en-IN")} + 5% buffer`;
        } else if (catType === "essential") {
          // Essentials: use avg + 10% buffer for flexibility
          const base = Math.max(avg, subCost);
          suggested = Math.ceil(base * 1.1 / 100) * 100;
          reasoning = `Essential — avg ₹${Math.round(avg).toLocaleString("en-IN")}/mo + 10% flexibility`;
        } else if (catType === "important") {
          // Important: use avg + 5% buffer
          const base = Math.max(avg, subCost);
          suggested = Math.ceil(base * 1.05 / 100) * 100;
          reasoning = `Important expense — avg ₹${Math.round(avg).toLocaleString("en-IN")}/mo + 5% buffer`;
        } else {
          // Discretionary: try to trim 10-15% to encourage savings
          const trimFactor = trend > 15 ? 0.85 : 0.90;
          suggested = Math.ceil(avg * trimFactor / 100) * 100;
          reasoning = `Discretionary — ${trend > 15 ? "trimmed 15% (spending rising)" : "trimmed 10%"} from avg ₹${Math.round(avg).toLocaleString("en-IN")}`;
        }

        // Ensure subscription category covers known subscriptions
        if (isSubCategory && suggested < Math.ceil(subCost / 100) * 100) {
          suggested = Math.ceil(subCost * 1.1 / 100) * 100;
          reasoning = `Covers ₹${Math.round(subCost).toLocaleString("en-IN")}/mo in active subscriptions + buffer`;
        }

        // Add trend info
        if (trendLabel) reasoning += ` (${trendLabel})`;

      } else if (monthlyIncome > 0) {
        // No history but we have income — use default allocation
        const typeGroup = catsByType[catType];
        const idxInGroup = typeGroup.indexOf(cat.id);
        const fallbacks = DEFAULT_ALLOCATION[catType].perCatFallback;
        const share = fallbacks[Math.min(idxInGroup, fallbacks.length - 1)] || 0.03;
        suggested = Math.ceil((share * spendableBudget) / 100) * 100;
        reasoning = `No history — allocated ${(share * 100).toFixed(0)}% of spendable budget (₹${Math.round(spendableBudget).toLocaleString("en-IN")})`;

        if (isSubCategory && subCost > 0) {
          suggested = Math.max(suggested, Math.ceil(subCost * 1.1 / 100) * 100);
          reasoning = `Covers ₹${Math.round(subCost).toLocaleString("en-IN")}/mo subscriptions`;
        }
      } else {
        suggested = 0;
        reasoning = `No spending history or income data — enter your income for smart allocation`;
      }

    } else if (mode === "income" && monthlyIncome > 0) {
      // Income-based allocation
      if (hasAnyHistory && hasHistory) {
        // Use spending proportions from history, mapped onto spendable budget
        const proportion = avg / totalAvgSpending;
        suggested = Math.ceil((proportion * spendableBudget) / 100) * 100;
        reasoning = `${(proportion * 100).toFixed(0)}% of spendable ₹${Math.round(spendableBudget).toLocaleString("en-IN")} (based on past spending ratio)`;

        // Ensure subscription category covers subscriptions
        if (isSubCategory && subCost > 0 && suggested < Math.ceil(subCost / 100) * 100) {
          suggested = Math.ceil(subCost * 1.1 / 100) * 100;
          reasoning = `Covers ₹${Math.round(subCost).toLocaleString("en-IN")}/mo subscriptions from income`;
        }

        if (trendLabel) reasoning += ` (${trendLabel})`;

      } else {
        // No history — use smart default allocation from income
        const typeGroup = catsByType[catType];
        const idxInGroup = typeGroup.indexOf(cat.id);
        const fallbacks = DEFAULT_ALLOCATION[catType].perCatFallback;
        const share = fallbacks[Math.min(idxInGroup, fallbacks.length - 1)] || 0.03;
        suggested = Math.ceil((share * spendableBudget) / 100) * 100;
        reasoning = `${catType === "fixed" ? "Fixed" : catType === "essential" ? "Essential" : catType === "important" ? "Important" : "Discretionary"} — ${(share * 100).toFixed(0)}% of spendable ₹${Math.round(spendableBudget).toLocaleString("en-IN")}`;

        if (isSubCategory && subCost > 0) {
          suggested = Math.max(suggested, Math.ceil(subCost * 1.1 / 100) * 100);
          reasoning = `Covers ₹${Math.round(subCost).toLocaleString("en-IN")}/mo subscriptions + buffer`;
        }
      }
    } else {
      // Fallback with no income
      suggested = hasHistory ? Math.ceil(avg / 100) * 100 : 0;
      reasoning = hasHistory ? `Based on ${nonZeroHistory.length}-month average` : `No past data — add income for smart allocation`;
    }

    suggestions.push({
      categoryId: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      suggested,
      avgSpend: Math.round(avg),
      maxSpend: Math.round(max),
      minSpend: Math.round(min),
      currentSpend: Math.round(currentSpend),
      reasoning,
      hasHistory,
      catType,
      trend: Math.round(trend),
      trendLabel,
      monthsAnalyzed: nonZeroHistory.length,
    });
  });

  return suggestions;
}

export default function BudgetsPage() {
  const { categories, budgets, setBudget, getExpensesByMonth, expenses, subscriptions } = useData();

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
        subscriptions,
        monthlyIncome,
        savingsGoalPct,
        mode: aiMode,
      });
      setAiSuggestions(suggestions);
      setIsGenerating(false);
    }, 800);
  }, [categories, expenses, subscriptions, monthlyIncome, savingsGoalPct, aiMode]);

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
                      <small>Analyze your last 6 months of spending</small>
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

              {/* Income inputs (shown for both modes — auto mode uses income as fallback when no history) */}
              <div className={styles.inputSection}>
                <div className={styles.inputSectionHeader}>
                  <span className={styles.inputSectionIcon}>{aiMode === "income" ? "💰" : "📋"}</span>
                  <span className={styles.inputSectionTitle}>
                    {aiMode === "income" ? "Your Income Details" : "Income (optional — used when no spending history)"}
                  </span>
                </div>
                <div className={styles.inputGroup}>
                  <label>Monthly Salary / Income (₹)</label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    min="0"
                    step="1000"
                    placeholder="e.g. 50000"
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
                    <span>💚 Savings: {formatCurrency(monthlyIncome * savingsGoalPct / 100)}</span>
                    <span>💳 Spendable: {formatCurrency(monthlyIncome * (1 - savingsGoalPct / 100))}</span>
                  </div>
                </div>
              </div>

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
                    {monthlyIncome > 0 && (
                      <div className={styles.resultsStat}>
                        <span>Remaining from Income</span>
                        <strong style={{ color: monthlyIncome - totalSuggested >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {formatCurrency(monthlyIncome - totalSuggested)}
                        </strong>
                      </div>
                    )}
                    <div className={styles.resultsStat}>
                      <span>Categories</span>
                      <strong>{aiSuggestions.filter((s) => s.suggested > 0).length} / {aiSuggestions.length}</strong>
                    </div>
                    <button className={`btn btn-primary ${styles.applyAllBtn}`} onClick={handleApplyAll}>
                      ✅ Apply All
                    </button>
                  </div>

                  {/* Data insight banner */}
                  {aiSuggestions.some((s) => s.hasHistory) ? (
                    <div className={styles.insightBanner}>
                      <span>📊</span>
                      <span>Based on {Math.max(...aiSuggestions.map(s => s.monthsAnalyzed))} months of spending data across {aiSuggestions.filter(s => s.hasHistory).length} categories</span>
                    </div>
                  ) : (
                    <div className={styles.insightBannerWarn}>
                      <span>💡</span>
                      <span>No past spending data found — budgets are allocated using standard budgeting rules based on your income</span>
                    </div>
                  )}

                  <div className={styles.suggestionList}>
                    {aiSuggestions.filter((s) => s.suggested > 0 || s.hasHistory).map((s) => (
                      <div key={s.categoryId} className={styles.suggestionItem}>
                        <div className={styles.suggestionLeft}>
                          <span className={styles.suggestionIcon} style={{ background: s.color + "18" }}>{s.icon}</span>
                          <div className={styles.suggestionInfo}>
                            <div className={styles.suggestionNameRow}>
                              <span className={styles.suggestionName}>{s.name}</span>
                              <span className={`${styles.catTypeBadge} ${styles[`catType_${s.catType}`]}`}>{s.catType}</span>
                              {s.trendLabel && (
                                <span className={styles.trendBadge} title={`Spending ${s.trend > 0 ? 'increased' : 'decreased'} by ${Math.abs(s.trend)}%`}>
                                  {s.trendLabel}
                                </span>
                              )}
                            </div>
                            <span className={styles.suggestionReason}>{s.reasoning}</span>
                            {s.hasHistory && (
                              <span className={styles.suggestionHistory}>
                                Avg: {formatCurrency(s.avgSpend)} · Max: {formatCurrency(s.maxSpend)}{s.currentSpend > 0 ? ` · This month: ${formatCurrency(s.currentSpend)}` : ""}
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
