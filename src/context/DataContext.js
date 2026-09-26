"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

const DataContext = createContext();

/* ---- Stall Expense Categories ---- */
export const STALL_EXPENSE_CATEGORIES = [
  { id: "cat-ingredients", name: "Ingredients & Stock", icon: "🥦", color: "#10b981" },
  { id: "cat-packaging", name: "Packaging & Disposable", icon: "📦", color: "#f59e0b" },
  { id: "cat-rent", name: "Stall Rent & Space Fee", icon: "🎪", color: "#8b5cf6" },
  { id: "cat-utilities", name: "Gas, Power & Water", icon: "⚡", color: "#ef4444" },
  { id: "cat-staff", name: "Staff & Helper Wages", icon: "👨‍🍳", color: "#3b82f6" },
  { id: "cat-maintenance", name: "Equipment & Repairs", icon: "🛠️", color: "#ec4899" },
  { id: "cat-marketing", name: "Banners & Promotion", icon: "📢", color: "#06b6d4" },
  { id: "cat-miscellaneous", name: "Miscellaneous", icon: "🌀", color: "#64748b" },
];

/* ---- Default Stall Menu / SKUs Template ---- */
const DEFAULT_SKUS = [
  { id: "sku-1", code: "SKU-001", name: "Masala Chai", category: "Beverages", price: 20, costPrice: 6, stock: 100, unit: "cup" },
  { id: "sku-2", code: "SKU-002", name: "Cold Coffee", category: "Beverages", price: 60, costPrice: 22, stock: 50, unit: "cup" },
  { id: "sku-3", code: "SKU-003", name: "Veg Samosa", category: "Snacks", price: 25, costPrice: 10, stock: 80, unit: "pc" },
  { id: "sku-4", code: "SKU-004", name: "Cheese Grilled Sandwich", category: "Snacks", price: 80, costPrice: 35, stock: 40, unit: "pc" },
  { id: "sku-5", code: "SKU-005", name: "Mineral Water Bottle 500ml", category: "Beverages", price: 10, costPrice: 5, stock: 120, unit: "bottle" },
  { id: "sku-6", code: "SKU-006", name: "French Fries", category: "Snacks", price: 70, costPrice: 25, stock: 30, unit: "plate" },
];

/* ---- Helper for Local Storage Persistence ---- */
const loadLocal = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(`stall_app_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
};

const saveLocal = (key, data) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`stall_app_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
};

export function DataProvider({ children }) {
  const { user } = useAuth();
  
  // Data State with local fallback initializers
  const [sales, setSales] = useState(() => loadLocal("sales", []));
  const [expenses, setExpenses] = useState(() => loadLocal("expenses", []));
  const [wastage, setWastage] = useState(() => loadLocal("wastage", []));
  const [closures, setClosures] = useState(() => loadLocal("closures", []));
  const [vendors, setVendors] = useState(() => loadLocal("vendors", []));
  const [skus, setSkus] = useState(() => loadLocal("skus", DEFAULT_SKUS));
  const [categories] = useState(STALL_EXPENSE_CATEGORIES);
  const [dataLoading, setDataLoading] = useState(false);

  // Sync state changes to LocalStorage
  useEffect(() => saveLocal("sales", sales), [sales]);
  useEffect(() => saveLocal("expenses", expenses), [expenses]);
  useEffect(() => saveLocal("wastage", wastage), [wastage]);
  useEffect(() => saveLocal("closures", closures), [closures]);
  useEffect(() => saveLocal("vendors", vendors), [vendors]);
  useEffect(() => saveLocal("skus", skus), [skus]);

  // Optional Supabase Fetching if logged in
  useEffect(() => {
    if (!user) return;
    const fetchFromSupabase = async () => {
      setDataLoading(true);
      try {
        const [expRes, saleRes, wasteRes] = await Promise.all([
          supabase.from("expenses").select("*").eq("user_id", user.id).order("date", { ascending: false }),
          supabase.from("sales").select("*").eq("user_id", user.id).order("date", { ascending: false }),
          supabase.from("wastage").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        ]);

        if (expRes.data && expRes.data.length > 0) {
          setExpenses(expRes.data.map(r => ({
            id: r.id,
            categoryId: r.category_id || "cat-miscellaneous",
            title: r.description || r.title || "Expense",
            amount: parseFloat(r.amount),
            date: r.date,
            receiptImage: r.receipt_url || r.receipt_image,
            paymentMethod: r.payment_method || "Cash",
            vendorName: r.vendor_name || "",
            notes: r.notes || "",
            createdAt: r.created_at,
          })));
        }

        if (saleRes.data && saleRes.data.length > 0) {
          setSales(saleRes.data.map(r => ({
            id: r.id,
            date: r.date,
            time: r.time || "12:00",
            totalAmount: parseFloat(r.total_amount || r.amount || 0),
            cashAmount: parseFloat(r.cash_amount || 0),
            upiAmount: parseFloat(r.upi_amount || 0),
            cardAmount: parseFloat(r.card_amount || 0),
            customerCount: r.customer_count || 0,
            items: r.items || [],
            notes: r.notes || "",
            createdAt: r.created_at,
          })));
        }

        if (wasteRes.data && wasteRes.data.length > 0) {
          setWastage(wasteRes.data.map(r => ({
            id: r.id,
            date: r.date,
            itemName: r.item_name,
            quantity: parseFloat(r.quantity),
            unit: r.unit || "pcs",
            estimatedCost: parseFloat(r.estimated_cost),
            reason: r.reason || "Spoiled",
            notes: r.notes || "",
            createdAt: r.created_at,
          })));
        }
      } catch (err) {
        console.warn("Supabase sync optional warning:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchFromSupabase();
  }, [user]);

  /* ======== SALES MANAGEMENT ======== */
  const addSale = useCallback(async (saleData) => {
    const newSale = {
      id: saleData.id || `sale-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: saleData.date || new Date().toISOString().split("T")[0],
      time: saleData.time || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      totalAmount: parseFloat(saleData.totalAmount || 0),
      cashAmount: parseFloat(saleData.cashAmount || 0),
      upiAmount: parseFloat(saleData.upiAmount || 0),
      cardAmount: parseFloat(saleData.cardAmount || 0),
      customerCount: parseInt(saleData.customerCount || 1),
      items: saleData.items || [],
      notes: saleData.notes || "",
      createdAt: new Date().toISOString(),
    };

    setSales((prev) => [newSale, ...prev]);

    // Try background Supabase insert if logged in
    if (user) {
      try {
        await supabase.from("sales").insert({
          user_id: user.id,
          date: newSale.date,
          total_amount: newSale.totalAmount,
          cash_amount: newSale.cashAmount,
          upi_amount: newSale.upiAmount,
          card_amount: newSale.cardAmount,
          customer_count: newSale.customerCount,
          items: newSale.items,
          notes: newSale.notes,
        });
      } catch (err) {
        console.warn("Supabase sale insert silent fallback:", err);
      }
    }

    return newSale;
  }, [user]);

  const deleteSale = useCallback(async (id) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
    if (user) {
      try { await supabase.from("sales").delete().eq("id", id); } catch (e) {}
    }
  }, [user]);

  /* ======== EXPENSES & BILL MANAGEMENT ======== */
  const addExpense = useCallback(async (expData) => {
    const newExpense = {
      id: expData.id || `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: expData.title || expData.description || "Stall Expense",
      amount: parseFloat(expData.amount || 0),
      categoryId: expData.categoryId || "cat-miscellaneous",
      date: expData.date || new Date().toISOString().split("T")[0],
      paymentMethod: expData.paymentMethod || "Cash",
      vendorName: expData.vendorName || "",
      receiptImage: expData.receiptImage || expData.receiptUrl || null,
      notes: expData.notes || "",
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [newExpense, ...prev]);

    if (user) {
      try {
        await supabase.from("expenses").insert({
          user_id: user.id,
          description: newExpense.title,
          amount: newExpense.amount,
          category_id: newExpense.categoryId,
          date: newExpense.date,
          receipt_url: newExpense.receiptImage,
        });
      } catch (err) {
        console.warn("Supabase expense insert silent fallback:", err);
      }
    }

    return newExpense;
  }, [user]);

  const deleteExpense = useCallback(async (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (user) {
      try { await supabase.from("expenses").delete().eq("id", id); } catch (e) {}
    }
  }, [user]);

  /* ======== WASTAGE / SPOILAGE MANAGEMENT ======== */
  const addWastage = useCallback(async (wData) => {
    const newWaste = {
      id: wData.id || `waste-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: wData.date || new Date().toISOString().split("T")[0],
      itemName: wData.itemName || "Spoiled Item",
      quantity: parseFloat(wData.quantity || 1),
      unit: wData.unit || "pcs",
      estimatedCost: parseFloat(wData.estimatedCost || 0),
      reason: wData.reason || "Spoiled/Expired",
      notes: wData.notes || "",
      createdAt: new Date().toISOString(),
    };

    setWastage((prev) => [newWaste, ...prev]);

    if (user) {
      try {
        await supabase.from("wastage").insert({
          user_id: user.id,
          date: newWaste.date,
          item_name: newWaste.itemName,
          quantity: newWaste.quantity,
          unit: newWaste.unit,
          estimated_cost: newWaste.estimatedCost,
          reason: newWaste.reason,
          notes: newWaste.notes,
        });
      } catch (err) {
        console.warn("Supabase wastage insert silent fallback:", err);
      }
    }

    return newWaste;
  }, [user]);

  const deleteWastage = useCallback((id) => {
    setWastage((prev) => prev.filter((w) => w.id !== id));
  }, []);

  /* ======== DAY END CASH DRAWER RECONCILIATION ======== */
  const addClosure = useCallback((cData) => {
    const newClosure = {
      id: cData.id || `closure-${Date.now()}`,
      date: cData.date || new Date().toISOString().split("T")[0],
      openingCash: parseFloat(cData.openingCash || 0),
      cashSales: parseFloat(cData.cashSales || 0),
      cashExpenses: parseFloat(cData.cashExpenses || 0),
      expectedClosingCash: parseFloat(cData.expectedClosingCash || 0),
      actualClosingCash: parseFloat(cData.actualClosingCash || 0),
      discrepancy: parseFloat(cData.discrepancy || 0), // actual - expected
      notes: cData.notes || "",
      createdAt: new Date().toISOString(),
    };

    setClosures((prev) => [newClosure, ...prev.filter(c => c.date !== newClosure.date)]);
    return newClosure;
  }, []);

  /* ======== VENDOR MANAGEMENT ======== */
  const addVendor = useCallback((vData) => {
    const newVendor = {
      id: vData.id || `vendor-${Date.now()}`,
      name: vData.name,
      phone: vData.phone || "",
      category: vData.category || "Supplies",
      pendingAmount: parseFloat(vData.pendingAmount || 0),
      notes: vData.notes || "",
    };
    setVendors((prev) => [newVendor, ...prev]);
    return newVendor;
  }, []);

  const updateVendor = useCallback((id, updates) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  }, []);

  const deleteVendor = useCallback((id) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  }, []);

  /* ======== SKU / MENU MANAGEMENT ======== */
  const addSku = useCallback((skuData) => {
    const newSku = {
      id: skuData.id || `sku-${Date.now()}`,
      code: skuData.code || `SKU-${Math.floor(100 + Math.random() * 900)}`,
      name: skuData.name,
      category: skuData.category || "General",
      price: parseFloat(skuData.price || 0),
      costPrice: parseFloat(skuData.costPrice || 0),
      stock: parseInt(skuData.stock || 0),
      unit: skuData.unit || "pc",
    };
    setSkus((prev) => [newSku, ...prev]);
    return newSku;
  }, []);

  const updateSku = useCallback((id, updates) => {
    setSkus((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteSku = useCallback((id) => {
    setSkus((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /* ======== CLEAR ALL LOCAL DATA ======== */
  const resetStallData = useCallback(() => {
    if (confirm("Are you sure you want to reset all stall tracking data to defaults?")) {
      setSales([]);
      setExpenses([]);
      setWastage([]);
      setClosures([]);
      setVendors([]);
      setSkus(DEFAULT_SKUS);
      localStorage.clear();
      alert("All data reset successfully.");
    }
  }, []);

  /* ======== HELPERS ======== */
  const getCategoryById = useCallback(
    (id) => categories.find((c) => c.id === id) || { name: "Miscellaneous", icon: "🌀", color: "#64748b" },
    [categories]
  );

  const value = {
    sales,
    expenses,
    wastage,
    closures,
    vendors,
    skus,
    categories,
    dataLoading,
    addSale,
    deleteSale,
    addExpense,
    deleteExpense,
    addWastage,
    deleteWastage,
    addClosure,
    addVendor,
    updateVendor,
    deleteVendor,
    addSku,
    updateSku,
    deleteSku,
    resetStallData,
    getCategoryById,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
