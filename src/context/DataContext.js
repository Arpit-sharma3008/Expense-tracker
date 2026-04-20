"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

const DataContext = createContext();

/* ---- Default Categories (stored in app, not DB) ---- */
const DEFAULT_CATEGORIES = [
  { id: "cat-1", name: "Food & Dining", icon: "🍕", color: "#f59e42" },
  { id: "cat-2", name: "Transport", icon: "🚗", color: "#4f6ef7" },
  { id: "cat-3", name: "Shopping", icon: "🛍️", color: "#a78bfa" },
  { id: "cat-4", name: "Bills & Utilities", icon: "💡", color: "#f472b6" },
  { id: "cat-5", name: "Entertainment", icon: "🎬", color: "#34d399" },
  { id: "cat-6", name: "Health", icon: "💊", color: "#e74c3c" },
  { id: "cat-7", name: "Education", icon: "📚", color: "#38bdf8" },
  { id: "cat-8", name: "Groceries", icon: "🛒", color: "#2ecc71" },
  { id: "cat-9", name: "Rent", icon: "🏠", color: "#f0a500" },
  { id: "cat-10", name: "Subscriptions", icon: "🔁", color: "#6b8aff" },
  { id: "cat-11", name: "Travel", icon: "✈️", color: "#fbbf24" },
  { id: "cat-12", name: "Other", icon: "📦", color: "#8e95a9" },
];

/* ---- Provider ---- */
export function DataProvider({ children }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [dataLoading, setDataLoading] = useState(true);

  /* ---- Fetch all data when user logs in ---- */
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setDebts([]);
      setSubscriptions([]);
      setBudgets([]);
      setDataLoading(false);
      return;
    }

    const fetchAll = async () => {
      setDataLoading(true);
      try {
        const [expRes, debtRes, subRes, budgetRes] = await Promise.all([
          supabase.from("expenses").select("*").eq("user_id", user.id).order("date", { ascending: false }),
          supabase.from("debts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("budgets").select("*").eq("user_id", user.id),
        ]);

        // Map DB snake_case to camelCase
        setExpenses((expRes.data || []).map(mapExpense));
        setDebts((debtRes.data || []).map(mapDebt));
        setSubscriptions((subRes.data || []).map(mapSubscription));
        setBudgets((budgetRes.data || []).map(mapBudget));
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchAll();
  }, [user]);

  /* ---- Mappers (DB snake_case → JS camelCase) ---- */
  const mapExpense = (row) => ({
    id: row.id,
    categoryId: row.category_id,
    description: row.description,
    amount: parseFloat(row.amount),
    date: row.date,
    createdAt: row.created_at,
  });

  const mapDebt = (row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    principal: parseFloat(row.principal),
    remainingBalance: parseFloat(row.remaining_balance),
    interestRate: parseFloat(row.interest_rate),
    minimumPayment: parseFloat(row.minimum_payment),
    dueDate: row.due_date,
    createdAt: row.created_at,
  });

  const mapSubscription = (row) => ({
    id: row.id,
    name: row.name,
    amount: parseFloat(row.amount),
    frequency: row.frequency,
    nextBillingDate: row.next_billing_date,
    icon: row.icon,
    active: row.active,
  });

  const mapBudget = (row) => ({
    id: row.id,
    categoryId: row.category_id,
    monthlyLimit: parseFloat(row.monthly_limit),
    month: row.month,
  });

  /* ======== EXPENSES ======== */
  const addExpense = useCallback(async (expense) => {
    if (!user) return;
    const { data, error } = await supabase.from("expenses").insert({
      user_id: user.id,
      description: expense.description,
      amount: expense.amount,
      category_id: expense.categoryId,
      date: expense.date,
    }).select().single();

    if (!error && data) {
      setExpenses((prev) => [mapExpense(data), ...prev]);
    }
    return data;
  }, [user]);

  const deleteExpense = useCallback(async (id) => {
    await supabase.from("expenses").delete().eq("id", id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateExpense = useCallback(async (id, updates) => {
    const dbUpdates = {};
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
    if (updates.date !== undefined) dbUpdates.date = updates.date;

    await supabase.from("expenses").update(dbUpdates).eq("id", id);
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const clearAllExpenses = useCallback(async () => {
    if (!user) return;
    await supabase.from("expenses").delete().eq("user_id", user.id);
    setExpenses([]);
  }, [user]);

  /* ======== DEBTS ======== */
  const addDebt = useCallback(async (debt) => {
    if (!user) return;
    const { data, error } = await supabase.from("debts").insert({
      user_id: user.id,
      name: debt.name,
      type: debt.type,
      principal: debt.principal,
      remaining_balance: debt.remainingBalance,
      interest_rate: debt.interestRate,
      minimum_payment: debt.minimumPayment,
      due_date: debt.dueDate || null,
    }).select().single();

    if (!error && data) {
      setDebts((prev) => [...prev, mapDebt(data)]);
    }
    return data;
  }, [user]);

  const updateDebt = useCallback(async (id, updates) => {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.remainingBalance !== undefined) dbUpdates.remaining_balance = updates.remainingBalance;
    if (updates.interestRate !== undefined) dbUpdates.interest_rate = updates.interestRate;
    if (updates.minimumPayment !== undefined) dbUpdates.minimum_payment = updates.minimumPayment;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;

    await supabase.from("debts").update(dbUpdates).eq("id", id);
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, []);

  const deleteDebt = useCallback(async (id) => {
    await supabase.from("debts").delete().eq("id", id);
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  /* ======== SUBSCRIPTIONS ======== */
  const addSubscription = useCallback(async (sub) => {
    if (!user) return;
    const { data, error } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      name: sub.name,
      amount: sub.amount,
      frequency: sub.frequency || "monthly",
      next_billing_date: sub.nextBillingDate || null,
      icon: sub.icon || "📦",
      active: sub.active !== undefined ? sub.active : true,
    }).select().single();

    if (!error && data) {
      setSubscriptions((prev) => [...prev, mapSubscription(data)]);
    }
    return data;
  }, [user]);

  const updateSubscription = useCallback(async (id, updates) => {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    if (updates.nextBillingDate !== undefined) dbUpdates.next_billing_date = updates.nextBillingDate;

    await supabase.from("subscriptions").update(dbUpdates).eq("id", id);
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteSubscription = useCallback(async (id) => {
    await supabase.from("subscriptions").delete().eq("id", id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /* ======== BUDGETS ======== */
  const setBudgetValue = useCallback(async (categoryId, monthlyLimit, month) => {
    if (!user) return;

    // Upsert: update if exists, insert if not
    const { data, error } = await supabase.from("budgets").upsert(
      {
        user_id: user.id,
        category_id: categoryId,
        monthly_limit: monthlyLimit,
        month,
      },
      { onConflict: "user_id,category_id,month" }
    ).select().single();

    if (!error && data) {
      setBudgets((prev) => {
        const exists = prev.find((b) => b.categoryId === categoryId && b.month === month);
        if (exists) {
          return prev.map((b) =>
            b.categoryId === categoryId && b.month === month
              ? { ...b, monthlyLimit, id: data.id }
              : b
          );
        }
        return [...prev, mapBudget(data)];
      });
    }
  }, [user]);

  /* ======== HELPERS ======== */
  const getCategoryById = useCallback(
    (id) => categories.find((c) => c.id === id),
    [categories]
  );

  const getExpensesByMonth = useCallback(
    (year, month) => {
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      return expenses.filter((e) => e.date.startsWith(prefix));
    },
    [expenses]
  );

  const getTotalByCategory = useCallback(
    (categoryId, year, month) => {
      const monthExpenses = getExpensesByMonth(year, month);
      return monthExpenses
        .filter((e) => e.categoryId === categoryId)
        .reduce((sum, e) => sum + e.amount, 0);
    },
    [getExpensesByMonth]
  );

  const value = {
    expenses,
    debts,
    subscriptions,
    budgets,
    categories,
    dataLoading,
    addExpense,
    deleteExpense,
    updateExpense,
    clearAllExpenses,
    addDebt,
    updateDebt,
    deleteDebt,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    setBudget: setBudgetValue,
    getCategoryById,
    getExpensesByMonth,
    getTotalByCategory,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
