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

/* ---- Stall Menu / SKUs Template ---- */
export const DEFAULT_SKUS = [
  { id: "sku-oat-bowl", code: "SKU-OAT", name: "Oat Meal Bowl", category: "Bowls", price: 49, costPrice: 18.5, stock: 100, unit: "bowl" },
  { id: "sku-muesli-bowl", code: "SKU-MUESLI", name: "Muesli Bowl", category: "Bowls", price: 59, costPrice: 21.5, stock: 100, unit: "bowl" },
  { id: "sku-choco-bowl", code: "SKU-CHOCO", name: "Chocolate Bowl", category: "Bowls", price: 69, costPrice: 24.5, stock: 100, unit: "bowl" },
  { id: "addon-peanut-butter", code: "ADDON-PB", name: "Peanut Butter Add-on", category: "Add-ons", price: 10, costPrice: 4.5, stock: 200, unit: "portion" },
];

/* ---- Packaging Rates ---- */
export const PACKAGING_RATES = {
  dine_in: {
    id: "dine_in",
    name: "Dine-In",
    items: [
      { key: "paper_bowl", name: "Paper Bowl", qty: 1, cost: 3.50, unit: "pcs" },
      { key: "spoon", name: "Spoon", qty: 1, cost: 0.60, unit: "pcs" },
    ],
    costPerBowl: 4.10,
  },
  parcel: {
    id: "parcel",
    name: "Parcel / Delivery",
    items: [
      { key: "packaging_box", name: "Packaging Box", qty: 1, cost: 5.00, unit: "pcs" },
      { key: "carry_bag", name: "Carry Bag", qty: 1, cost: 1.30, unit: "pcs" },
      { key: "spoon", name: "Spoon", qty: 1, cost: 0.60, unit: "pcs" },
    ],
    costPerBowl: 6.90,
  },
};

/* ---- Recipes / Bill of Materials (BOM) per Bowl ---- */
export const RECIPES = {
  "sku-oat-bowl": [
    { key: "oats", name: "Oats", qty: 50, unit: "g" },
    { key: "milk", name: "Milk", qty: 60, unit: "g" },
    { key: "apple", name: "Apple", qty: 20, unit: "g" },
    { key: "banana", name: "Banana", qty: 0.286, unit: "pcs" },
    { key: "pomegranate", name: "Pomegranate", qty: 15, unit: "g" },
    { key: "pumpkin_seeds", name: "Pumpkin Seeds", qty: 2, unit: "g" },
    { key: "chia_seeds", name: "Chia Seeds", qty: 3, unit: "g" },
    { key: "sunflower_seeds", name: "Sunflower Seeds", qty: 3, unit: "g" },
    { key: "alsi", name: "Alsi (Flaxseeds)", qty: 1, unit: "g" },
    { key: "almond_flakes", name: "Almond Flakes", qty: 1.5, unit: "g" },
    { key: "walnut_raw", name: "Raw Walnut (Yield 49%)", qty: 2.04, unit: "g" },
    { key: "honey", name: "Honey", qty: 3, unit: "g" },
  ],
  "sku-muesli-bowl": [
    { key: "muesli", name: "Muesli", qty: 50, unit: "g" },
    { key: "milk", name: "Milk", qty: 60, unit: "g" },
    { key: "apple", name: "Apple", qty: 20, unit: "g" },
    { key: "banana", name: "Banana", qty: 0.286, unit: "pcs" },
    { key: "pomegranate", name: "Pomegranate", qty: 15, unit: "g" },
    { key: "pumpkin_seeds", name: "Pumpkin Seeds", qty: 2, unit: "g" },
    { key: "chia_seeds", name: "Chia Seeds", qty: 3, unit: "g" },
    { key: "sunflower_seeds", name: "Sunflower Seeds", qty: 3, unit: "g" },
    { key: "alsi", name: "Alsi (Flaxseeds)", qty: 1, unit: "g" },
    { key: "almond_flakes", name: "Almond Flakes", qty: 1.5, unit: "g" },
    { key: "walnut_raw", name: "Raw Walnut (Yield 49%)", qty: 2.04, unit: "g" },
    { key: "honey", name: "Honey", qty: 3, unit: "g" },
  ],
  "sku-choco-bowl": [
    { key: "oats", name: "Oats", qty: 50, unit: "g" },
    { key: "chocolate_powder", name: "Chocolate Powder", qty: 5, unit: "g" },
    { key: "milk", name: "Milk", qty: 60, unit: "g" },
    { key: "apple", name: "Apple", qty: 20, unit: "g" },
    { key: "banana", name: "Banana", qty: 0.286, unit: "pcs" },
    { key: "pomegranate", name: "Pomegranate", qty: 15, unit: "g" },
    { key: "pumpkin_seeds", name: "Pumpkin Seeds", qty: 2, unit: "g" },
    { key: "chia_seeds", name: "Chia Seeds", qty: 3, unit: "g" },
    { key: "sunflower_seeds", name: "Sunflower Seeds", qty: 3, unit: "g" },
    { key: "alsi", name: "Alsi (Flaxseeds)", qty: 1, unit: "g" },
    { key: "almond_flakes", name: "Almond Flakes", qty: 1.5, unit: "g" },
    { key: "walnut_raw", name: "Raw Walnut (Yield 49%)", qty: 2.04, unit: "g" },
    { key: "honey", name: "Honey", qty: 3, unit: "g" },
  ],
  "addon-peanut-butter": [
    { key: "peanut_butter", name: "Peanut Butter", qty: 15, unit: "g" },
  ],
};

/* ---- Default Raw Material Inventory Template ---- */
export const DEFAULT_INVENTORY = {
  oats: { key: "oats", name: "Oats", stock: 0, unit: "g", costPerUnit: 0.12, category: "Grains" },
  muesli: { key: "muesli", name: "Muesli", stock: 0, unit: "g", costPerUnit: 0.18, category: "Grains" },
  chocolate_powder: { key: "chocolate_powder", name: "Chocolate Powder", stock: 0, unit: "g", costPerUnit: 0.35, category: "Flavoring" },
  milk: { key: "milk", name: "Milk", stock: 0, unit: "g", costPerUnit: 0.06, category: "Dairy" },
  apple: { key: "apple", name: "Apple", stock: 0, unit: "g", costPerUnit: 0.10, category: "Fruits" },
  banana: { key: "banana", name: "Banana", stock: 0, unit: "pcs", costPerUnit: 4.00, category: "Fruits" },
  pomegranate: { key: "pomegranate", name: "Pomegranate", stock: 0, unit: "g", costPerUnit: 0.22, category: "Fruits" },
  pumpkin_seeds: { key: "pumpkin_seeds", name: "Pumpkin Seeds", stock: 0, unit: "g", costPerUnit: 0.60, category: "Seeds & Nuts" },
  chia_seeds: { key: "chia_seeds", name: "Chia Seeds", stock: 0, unit: "g", costPerUnit: 0.50, category: "Seeds & Nuts" },
  sunflower_seeds: { key: "sunflower_seeds", name: "Sunflower Seeds", stock: 0, unit: "g", costPerUnit: 0.40, category: "Seeds & Nuts" },
  alsi: { key: "alsi", name: "Alsi (Flaxseeds)", stock: 0, unit: "g", costPerUnit: 0.25, category: "Seeds & Nuts" },
  almond_flakes: { key: "almond_flakes", name: "Almond Flakes", stock: 0, unit: "g", costPerUnit: 1.10, category: "Seeds & Nuts" },
  walnut_raw: { key: "walnut_raw", name: "Raw Walnut (Yield 49%)", stock: 0, unit: "g", costPerUnit: 0.95, category: "Seeds & Nuts" },
  honey: { key: "honey", name: "Honey", stock: 0, unit: "g", costPerUnit: 0.40, category: "Sweeteners" },
  peanut_butter: { key: "peanut_butter", name: "Peanut Butter", stock: 0, unit: "g", costPerUnit: 0.35, category: "Add-ons" },
  paper_bowl: { key: "paper_bowl", name: "Paper Bowl", stock: 0, unit: "pcs", costPerUnit: 3.50, category: "Packaging" },
  spoon: { key: "spoon", name: "Spoon", stock: 0, unit: "pcs", costPerUnit: 0.60, category: "Packaging" },
  packaging_box: { key: "packaging_box", name: "Packaging Box", stock: 0, unit: "pcs", costPerUnit: 5.00, category: "Packaging" },
  carry_bag: { key: "carry_bag", name: "Carry Bag", stock: 0, unit: "pcs", costPerUnit: 1.30, category: "Packaging" },
};

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
  const [inventory, setInventory] = useState(() => loadLocal("inventory", DEFAULT_INVENTORY));
  const [categories] = useState(STALL_EXPENSE_CATEGORIES);
  const [dataLoading, setDataLoading] = useState(false);

  // Sync state changes to LocalStorage
  useEffect(() => saveLocal("sales", sales), [sales]);
  useEffect(() => saveLocal("expenses", expenses), [expenses]);
  useEffect(() => saveLocal("wastage", wastage), [wastage]);
  useEffect(() => saveLocal("closures", closures), [closures]);
  useEffect(() => saveLocal("vendors", vendors), [vendors]);
  useEffect(() => saveLocal("skus", skus), [skus]);
  useEffect(() => saveLocal("inventory", inventory), [inventory]);

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
    const packagingType = saleData.packagingType || "dine_in";
    const items = saleData.items || [];
    
    // Compute total bowls sold in order
    let totalBowls = 0;
    items.forEach(i => {
      if (i.category === "Bowls" || i.id?.startsWith("sku-") || i.name?.toLowerCase().includes("bowl")) {
        totalBowls += (i.qty || 1);
      }
    });

    // Calculate ingredient & packaging consumption & COGS
    let calculatedCogs = 0;
    const stockDeductions = {}; // key -> qty to deduct

    // 1. Bowl Recipes & Addons
    items.forEach((item) => {
      const qty = item.qty || 1;
      const recipeKey = item.id || item.code || item.name;
      // Match recipe by SKU ID or code or name
      let recipe = RECIPES[recipeKey];
      if (!recipe) {
        const lowerName = (item.name || "").toLowerCase();
        if (lowerName.includes("oat")) recipe = RECIPES["sku-oat-bowl"];
        else if (lowerName.includes("muesli")) recipe = RECIPES["sku-muesli-bowl"];
        else if (lowerName.includes("choco")) recipe = RECIPES["sku-choco-bowl"];
        else if (lowerName.includes("peanut")) recipe = RECIPES["addon-peanut-butter"];
      }

      if (recipe) {
        recipe.forEach((ing) => {
          const needed = ing.qty * qty;
          stockDeductions[ing.key] = (stockDeductions[ing.key] || 0) + needed;
        });
      }
    });

    // 2. Packaging items deduction
    const packRate = PACKAGING_RATES[packagingType] || PACKAGING_RATES.dine_in;
    if (totalBowls > 0) {
      packRate.items.forEach((pItem) => {
        const needed = pItem.qty * totalBowls;
        stockDeductions[pItem.key] = (stockDeductions[pItem.key] || 0) + needed;
      });
    }

    // Apply stock deductions to inventory & compute total COGS
    setInventory((prevInv) => {
      const nextInv = { ...prevInv };
      Object.entries(stockDeductions).forEach(([key, qtyDeducted]) => {
        if (nextInv[key]) {
          const currentStock = nextInv[key].stock || 0;
          const costPerUnit = nextInv[key].costPerUnit || 0;
          calculatedCogs += qtyDeducted * costPerUnit;
          nextInv[key] = {
            ...nextInv[key],
            stock: Math.max(0, currentStock - qtyDeducted),
          };
        }
      });
      return nextInv;
    });

    const newSale = {
      id: saleData.id || `sale-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: saleData.date || new Date().toISOString().split("T")[0],
      time: saleData.time || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      totalAmount: parseFloat(saleData.totalAmount || 0),
      cashAmount: parseFloat(saleData.cashAmount || 0),
      upiAmount: parseFloat(saleData.upiAmount || 0),
      cardAmount: parseFloat(saleData.cardAmount || 0),
      customerCount: parseInt(saleData.customerCount || 1),
      packagingType,
      packagingCost: packRate.costPerBowl * totalBowls,
      cogs: Math.round(calculatedCogs * 100) / 100,
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
    const amount = parseFloat(expData.amount || 0);
    const itemKey = expData.inventoryKey;
    const itemQty = parseFloat(expData.itemQty || 0);

    const newExpense = {
      id: expData.id || `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: expData.title || expData.description || "Stall Expense",
      amount,
      categoryId: expData.categoryId || "cat-miscellaneous",
      date: expData.date || new Date().toISOString().split("T")[0],
      paymentMethod: expData.paymentMethod || "Cash",
      vendorName: expData.vendorName || "",
      receiptImage: expData.receiptImage || expData.receiptUrl || null,
      inventoryKey: itemKey || null,
      itemQty: itemQty || null,
      notes: expData.notes || "",
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [newExpense, ...prev]);

    // If an inventory key and quantity are specified, update inventory stock and unit cost
    if (itemKey && itemQty > 0) {
      setInventory((prevInv) => {
        const target = prevInv[itemKey] || { name: itemKey, stock: 0, unit: "g", costPerUnit: 0 };
        const newStock = (target.stock || 0) + itemQty;
        const newUnitCost = amount / itemQty;
        return {
          ...prevInv,
          [itemKey]: {
            ...target,
            stock: newStock,
            costPerUnit: Math.round(newUnitCost * 100) / 100,
          },
        };
      });
    }

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

  /* ======== INVENTORY MANAGEMENT ======== */
  const updateInventoryItem = useCallback((key, updates) => {
    setInventory((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { key, name: key, stock: 0, unit: "g", costPerUnit: 0 }),
        ...updates,
      },
    }));
  }, []);

  const value = {
    sales,
    expenses,
    wastage,
    closures,
    vendors,
    skus,
    inventory,
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
    updateInventoryItem,
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
