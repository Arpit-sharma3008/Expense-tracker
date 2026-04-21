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
  const [credits, setCredits] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [dataLoading, setDataLoading] = useState(true);

  /* ---- Mappers (DB snake_case → JS camelCase) ---- */
  const mapExpense = (row) => ({
    id: row.id,
    categoryId: row.category_id,
    description: row.description,
    amount: parseFloat(row.amount),
    date: row.date,
    receiptUrl: row.receipt_url,
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

  const mapCredit = (row) => ({
    id: row.id,
    personName: row.person_name,
    totalAmount: parseFloat(row.total_amount),
    receivedAmount: parseFloat(row.received_amount),
    expectedDate: row.expected_date,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  });

  /* ---- Fetch all data when user logs in ---- */
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setDebts([]);
      setCredits([]);
      setSubscriptions([]);
      setBudgets([]);
      setIncomes([]);
      setSavingsGoals([]);
      setDataLoading(false);
      return;
    }

    const fetchAll = async () => {
      setDataLoading(true);
      try {
        const [expRes, debtRes, creditRes, subRes, budgetRes, incomeRes, goalRes] = await Promise.all([
          supabase.from("expenses").select("*").eq("user_id", user.id).order("date", { ascending: false }),
          supabase.from("debts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("credits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("budgets").select("*").eq("user_id", user.id),
          supabase.from("incomes").select("*").eq("user_id", user.id).order("date", { ascending: false }),
          supabase.from("savings_goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        ]);

        // Map DB snake_case to camelCase
        setExpenses((expRes.data || []).map(mapExpense));
        setDebts((debtRes.data || []).map(mapDebt));
        setCredits((creditRes.data || []).map(mapCredit));
        
        const loadedSubs = (subRes.data || []).map(mapSubscription);
        setSubscriptions(loadedSubs);
        
        setBudgets((budgetRes.data || []).map(mapBudget));
        setIncomes((incomeRes.data || []).map(mapIncome));
        setSavingsGoals((goalRes.data || []).map(mapSavingsGoal));

        // ---- AUTO-SUBSCRIPTIONS ----
        // Check if any active subscriptions have a billing date that is today or past
        const today = new Date().toISOString().split("T")[0];
        
        for (const sub of loadedSubs) {
          if (sub.active && sub.nextBillingDate && sub.nextBillingDate <= today) {
            // Auto-log expense
            const expenseCat = DEFAULT_CATEGORIES.find(c => c.name === "Subscriptions");
            await supabase.from("expenses").insert({
              user_id: user.id,
              description: `Auto-billed: ${sub.name}`,
              amount: sub.amount,
              category_id: expenseCat ? expenseCat.id : "cat-10",
              date: sub.nextBillingDate,
            });

            // Calculate next billing date
            const dateObj = new Date(sub.nextBillingDate);
            if (sub.frequency === "monthly") dateObj.setMonth(dateObj.getMonth() + 1);
            if (sub.frequency === "yearly") dateObj.setFullYear(dateObj.getFullYear() + 1);
            if (sub.frequency === "weekly") dateObj.setDate(dateObj.getDate() + 7);
            
            const nextDateStr = dateObj.toISOString().split("T")[0];
            
            // Update subscription
            await supabase.from("subscriptions").update({ next_billing_date: nextDateStr }).eq("id", sub.id);
            
            // If we generated expenses, we should trigger a refetch of expenses and subscriptions to keep state fresh.
            // But to avoid complexity, we can just do a fast local state update or simple refetch.
          }
        }

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchAll();
  }, [user]);

  /* ======== EXPENSES ======== */
  const addExpense = useCallback(async (expense) => {
    if (!user) return;
    
    const payload = {
      user_id: user.id,
      description: expense.description,
      amount: expense.amount,
      category_id: expense.categoryId,
      date: expense.date,
    };
    
    // Only add receipt_url if it exists, to prevent crashes if the user hasn't updated their DB schema
    if (expense.receiptUrl) {
      payload.receipt_url = expense.receiptUrl;
    }

    const { data, error } = await supabase.from("expenses").insert(payload).select().single();

    if (error) {
      console.error("Error adding expense:", error);
      alert("Database Error: " + error.message);
      return null;
    }

    if (data) {
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
    if (updates.receiptUrl !== undefined) dbUpdates.receipt_url = updates.receiptUrl;

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

  /* ======== CREDITS ======== */
  const addCredit = useCallback(async (credit) => {
    if (!user) return;
    const { data, error } = await supabase.from("credits").insert({
      user_id: user.id,
      person_name: credit.personName,
      total_amount: credit.totalAmount,
      received_amount: credit.receivedAmount || 0,
      expected_date: credit.expectedDate || null,
      status: credit.status || "pending",
      notes: credit.notes || "",
    }).select().single();

    if (!error && data) {
      setCredits((prev) => [...prev, mapCredit(data)]);
    }
    return data;
  }, [user]);

  const updateCredit = useCallback(async (id, updates) => {
    const dbUpdates = {};
    if (updates.personName !== undefined) dbUpdates.person_name = updates.personName;
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
    if (updates.receivedAmount !== undefined) dbUpdates.received_amount = updates.receivedAmount;
    if (updates.expectedDate !== undefined) dbUpdates.expected_date = updates.expectedDate;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    await supabase.from("credits").update(dbUpdates).eq("id", id);
    setCredits((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCredit = useCallback(async (id) => {
    await supabase.from("credits").delete().eq("id", id);
    setCredits((prev) => prev.filter((c) => c.id !== id));
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

  /* ======== INCOMES ======== */
  const addIncome = useCallback(async (income) => {
    if (!user) return;
    const { data, error } = await supabase.from("incomes").insert({
      user_id: user.id,
      source: income.source,
      amount: income.amount,
      date: income.date,
      notes: income.notes || "",
    }).select().single();

    if (error) {
      console.error("Error adding income:", error);
      alert("Database Error: You likely need to update your Supabase database schema. " + error.message);
      return null;
    }

    if (data) {
      setIncomes((prev) => [mapIncome(data), ...prev]);
    }
    return data;
  }, [user]);

  const updateIncome = useCallback(async (id, updates) => {
    const dbUpdates = {};
    if (updates.source !== undefined) dbUpdates.source = updates.source;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    await supabase.from("incomes").update(dbUpdates).eq("id", id);
    setIncomes((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, []);

  const deleteIncome = useCallback(async (id) => {
    await supabase.from("incomes").delete().eq("id", id);
    setIncomes((prev) => prev.filter((i) => i.id !== id));
  }, []);

  /* ======== SAVINGS GOALS ======== */
  const addSavingsGoal = useCallback(async (goal) => {
    if (!user) return;
    const { data, error } = await supabase.from("savings_goals").insert({
      user_id: user.id,
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount || 0,
      target_date: goal.targetDate || null,
      icon: goal.icon || "🎯",
      color: goal.color || "#4F6EF7",
    }).select().single();

    if (error) {
      console.error("Error adding savings goal:", error);
      alert("Database Error: You likely need to update your Supabase database schema. " + error.message);
      return null;
    }

    if (data) {
      setSavingsGoals((prev) => [...prev, mapSavingsGoal(data)]);
    }
    return data;
  }, [user]);

  const updateSavingsGoal = useCallback(async (id, updates) => {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
    if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.color !== undefined) dbUpdates.color = updates.color;

    await supabase.from("savings_goals").update(dbUpdates).eq("id", id);
    setSavingsGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  }, []);

  const deleteSavingsGoal = useCallback(async (id) => {
    await supabase.from("savings_goals").delete().eq("id", id);
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  /* ======== STORAGE HELPERS ======== */
  const uploadReceipt = useCallback(async (file) => {
    if (!user || !file) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from("receipts")
      .upload(fileName, file);
      
    if (error) {
      console.error("Error uploading receipt:", error);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName);
      
    return publicUrlData.publicUrl;
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
    credits,
    subscriptions,
    budgets,
    incomes,
    savingsGoals,
    categories,
    dataLoading,
    addExpense,
    deleteExpense,
    updateExpense,
    clearAllExpenses,
    addDebt,
    updateDebt,
    deleteDebt,
    addCredit,
    updateCredit,
    deleteCredit,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    setBudget: setBudgetValue,
    addIncome,
    updateIncome,
    deleteIncome,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    uploadReceipt,
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
