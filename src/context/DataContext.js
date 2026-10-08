"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
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

/* Helper to merge items by id without duplicates */
const mergeById = (existing = [], incoming = []) => {
  const map = new Map();
  existing.forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  incoming.forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  return Array.from(map.values()).sort((a, b) => {
    const da = a.createdAt || a.date || "";
    const db = b.createdAt || b.date || "";
    return db.localeCompare(da);
  });
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

  // Keep ref of latest state to push full payload easily
  const latestStateRef = useRef({ sales, expenses, wastage, closures });
  useEffect(() => {
    latestStateRef.current = { sales, expenses, wastage, closures };
  }, [sales, expenses, wastage, closures]);

  // Sync state changes to LocalStorage
  useEffect(() => saveLocal("sales", sales), [sales]);
  useEffect(() => saveLocal("expenses", expenses), [expenses]);
  useEffect(() => saveLocal("wastage", wastage), [wastage]);
  useEffect(() => saveLocal("closures", closures), [closures]);
  useEffect(() => saveLocal("vendors", vendors), [vendors]);
  useEffect(() => saveLocal("skus", skus), [skus]);
  useEffect(() => saveLocal("inventory", inventory), [inventory]);

  /* Push full data payload to stall_config.staff_list in Supabase Cloud */
  const pushToCloudConfig = useCallback(async (customPayload) => {
    try {
      const stateToPush = customPayload || latestStateRef.current;
      await supabase.from("stall_config").upsert({
        id: "default_stall",
        staff_list: {
          sales: stateToPush.sales || [],
          expenses: stateToPush.expenses || [],
          wastage: stateToPush.wastage || [],
          closures: stateToPush.closures || [],
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.warn("Cloud push warning:", err);
    }
  }, []);

  // Real-time Supabase Data Fetching & Polling across all devices
  const fetchFromSupabase = useCallback(async () => {
    try {
      // 1. Fetch primary stall_config JSON cloud payload
      const configRes = await supabase.from("stall_config").select("*").eq("id", "default_stall");
      if (configRes.data && configRes.data.length > 0) {
        const cloudData = configRes.data[0].staff_list;
        if (cloudData && typeof cloudData === "object" && !Array.isArray(cloudData)) {
          if (Array.isArray(cloudData.sales)) {
            setSales((prev) => mergeById(prev, cloudData.sales));
          }
          if (Array.isArray(cloudData.expenses)) {
            setExpenses((prev) => mergeById(prev, cloudData.expenses));
          }
          if (Array.isArray(cloudData.wastage)) {
            setWastage((prev) => mergeById(prev, cloudData.wastage));
          }
          if (Array.isArray(cloudData.closures)) {
            setClosures((prev) => mergeById(prev, cloudData.closures));
          }
        }
      }

      // 2. Also query individual tables if they exist
      const [expRes, saleRes, wasteRes, closureRes] = await Promise.allSettled([
        supabase.from("expenses").select("*").order("date", { ascending: false }),
        supabase.from("sales").select("*").order("date", { ascending: false }),
        supabase.from("wastage").select("*").order("date", { ascending: false }),
        supabase.from("closures").select("*").order("date", { ascending: false }),
      ]);

      if (expRes.status === "fulfilled" && expRes.value?.data?.length > 0) {
        const mappedExps = expRes.value.data.map(r => ({
          id: r.id,
          categoryId: r.category_id || "cat-miscellaneous",
          title: r.description || r.title || "Expense",
          amount: parseFloat(r.amount || 0),
          date: r.date,
          receiptImage: r.receipt_url || r.receipt_image,
          paymentMethod: r.payment_method || "Cash",
          vendorName: r.vendor_name || "",
          inventoryKey: r.inventory_key || null,
          itemQty: r.item_qty ? parseFloat(r.item_qty) : null,
          notes: r.notes || "",
          createdAt: r.created_at,
        }));
        setExpenses((prev) => mergeById(prev, mappedExps));
      }

      if (saleRes.status === "fulfilled" && saleRes.value?.data?.length > 0) {
        const mappedSales = saleRes.value.data.map(r => ({
          id: r.id,
          date: r.date,
          time: r.time || "12:00",
          totalAmount: parseFloat(r.total_amount || r.amount || 0),
          cashAmount: parseFloat(r.cash_amount || 0),
          upiAmount: parseFloat(r.upi_amount || 0),
          cardAmount: parseFloat(r.card_amount || 0),
          customerCount: r.customer_count || 0,
          packagingType: r.packaging_type || "dine_in",
          packagingCost: parseFloat(r.packaging_cost || 0),
          cogs: parseFloat(r.cogs || 0),
          items: r.items || [],
          notes: r.notes || "",
          createdAt: r.created_at,
        }));
        setSales((prev) => mergeById(prev, mappedSales));
      }

      if (wasteRes.status === "fulfilled" && wasteRes.value?.data?.length > 0) {
        const mappedWastage = wasteRes.value.data.map(r => ({
          id: r.id,
          date: r.date,
          itemName: r.item_name,
          quantity: parseFloat(r.quantity || 1),
          unit: r.unit || "pcs",
          estimatedCost: parseFloat(r.estimated_cost || 0),
          reason: r.reason || "Spoiled",
          notes: r.notes || "",
          createdAt: r.created_at,
        }));
        setWastage((prev) => mergeById(prev, mappedWastage));
      }

      if (closureRes.status === "fulfilled" && closureRes.value?.data?.length > 0) {
        const mappedClosures = closureRes.value.data.map(r => ({
          id: r.id,
          date: r.date,
          openingCash: parseFloat(r.opening_cash || 0),
          totalCashSales: parseFloat(r.total_cash_sales || 0),
          totalCashExpenses: parseFloat(r.total_cash_expenses || 0),
          expectedCash: parseFloat(r.expected_cash || 0),
          actualCash: parseFloat(r.actual_cash || 0),
          difference: parseFloat(r.difference || 0),
          staffName: r.staff_name || "",
          notes: r.notes || "",
          createdAt: r.created_at,
        }));
        setClosures((prev) => mergeById(prev, mappedClosures));
      }
    } catch (err) {
      console.warn("Supabase fetch warning:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFromSupabase();
    // 3-second interval polling for real-time Phone <-> PC sync
    const interval = setInterval(() => {
      fetchFromSupabase();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchFromSupabase]);

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
    const stockDeductions = {};

    items.forEach((item) => {
      const qty = item.qty || 1;
      const recipeKey = item.id || item.code || item.name;
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

    const packRate = PACKAGING_RATES[packagingType] || PACKAGING_RATES.dine_in;
    if (totalBowls > 0) {
      packRate.items.forEach((pItem) => {
        const needed = pItem.qty * totalBowls;
        stockDeductions[pItem.key] = (stockDeductions[pItem.key] || 0) + needed;
      });
    }

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

    setSales((prev) => {
      const updated = mergeById(prev, [newSale]);
      pushToCloudConfig({
        ...latestStateRef.current,
        sales: updated,
      });
      return updated;
    });

    // Also attempt individual table insert
    try {
      await supabase.from("sales").insert({
        date: newSale.date,
        time: newSale.time,
        total_amount: newSale.totalAmount,
        cash_amount: newSale.cashAmount,
        upi_amount: newSale.upiAmount,
        card_amount: newSale.cardAmount,
        customer_count: newSale.customerCount,
        packaging_type: newSale.packagingType,
        packaging_cost: newSale.packagingCost,
        cogs: newSale.cogs,
        items: newSale.items,
        notes: newSale.notes,
      });
    } catch (err) {
      console.warn("Supabase sale insert warning:", err);
    }

    return newSale;
  }, [pushToCloudConfig]);

  const deleteSale = useCallback(async (id) => {
    setSales((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      pushToCloudConfig({
        ...latestStateRef.current,
        sales: updated,
      });
      return updated;
    });
    try { await supabase.from("sales").delete().eq("id", id); } catch (e) {}
  }, [pushToCloudConfig]);

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

    setExpenses((prev) => {
      const updated = mergeById(prev, [newExpense]);
      pushToCloudConfig({
        ...latestStateRef.current,
        expenses: updated,
      });
      return updated;
    });

    try {
      await supabase.from("expenses").insert({
        description: newExpense.title,
        amount: newExpense.amount,
        category_id: newExpense.categoryId,
        date: newExpense.date,
        receipt_url: newExpense.receiptImage,
        inventory_key: newExpense.inventoryKey,
        item_qty: newExpense.itemQty,
        notes: newExpense.notes,
      });
    } catch (err) {
      console.warn("Supabase expense insert warning:", err);
    }

    return newExpense;
  }, [pushToCloudConfig]);

  const deleteExpense = useCallback(async (id) => {
    setExpenses((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      pushToCloudConfig({
        ...latestStateRef.current,
        expenses: updated,
      });
      return updated;
    });
    try { await supabase.from("expenses").delete().eq("id", id); } catch (e) {}
  }, [pushToCloudConfig]);

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

  /* ======== WASTAGE MANAGEMENT ======== */
  const addWastage = useCallback(async (wasteData) => {
    const newWaste = {
      id: wasteData.id || `waste-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: wasteData.date || new Date().toISOString().split("T")[0],
      itemName: wasteData.itemName || "Wastage",
      quantity: parseFloat(wasteData.quantity || 1),
      unit: wasteData.unit || "pcs",
      estimatedCost: parseFloat(wasteData.estimatedCost || 0),
      reason: wasteData.reason || "Spoiled",
      notes: wasteData.notes || "",
      createdAt: new Date().toISOString(),
    };

    setWastage((prev) => {
      const updated = mergeById(prev, [newWaste]);
      pushToCloudConfig({
        ...latestStateRef.current,
        wastage: updated,
      });
      return updated;
    });

    try {
      await supabase.from("wastage").insert({
        date: newWaste.date,
        item_name: newWaste.itemName,
        quantity: newWaste.quantity,
        unit: newWaste.unit,
        estimated_cost: newWaste.estimatedCost,
        reason: newWaste.reason,
        notes: newWaste.notes,
      });
    } catch (e) {}
    return newWaste;
  }, [pushToCloudConfig]);

  const deleteWastage = useCallback(async (id) => {
    setWastage((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      pushToCloudConfig({
        ...latestStateRef.current,
        wastage: updated,
      });
      return updated;
    });
    try { await supabase.from("wastage").delete().eq("id", id); } catch (e) {}
  }, [pushToCloudConfig]);

  /* ======== CASH CLOSURES ======== */
  const addClosure = useCallback(async (closureData) => {
    const newClosure = {
      id: closureData.id || `closure-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: closureData.date || new Date().toISOString().split("T")[0],
      openingCash: parseFloat(closureData.openingCash || 0),
      totalCashSales: parseFloat(closureData.totalCashSales || 0),
      totalCashExpenses: parseFloat(closureData.totalCashExpenses || 0),
      expectedCash: parseFloat(closureData.expectedCash || 0),
      actualCash: parseFloat(closureData.actualCash || 0),
      difference: parseFloat(closureData.difference || 0),
      staffName: closureData.staffName || "",
      notes: closureData.notes || "",
      createdAt: new Date().toISOString(),
    };

    setClosures((prev) => {
      const updated = mergeById(prev, [newClosure]);
      pushToCloudConfig({
        ...latestStateRef.current,
        closures: updated,
      });
      return updated;
    });

    try {
      await supabase.from("closures").insert({
        date: newClosure.date,
        opening_cash: newClosure.openingCash,
        total_cash_sales: newClosure.totalCashSales,
        total_cash_expenses: newClosure.totalCashExpenses,
        expected_cash: newClosure.expectedCash,
        actual_cash: newClosure.actualCash,
        difference: newClosure.difference,
        staff_name: newClosure.staffName,
        notes: newClosure.notes,
      });
    } catch (e) {}
    return newClosure;
  }, [pushToCloudConfig]);

  /* ======== VENDOR MANAGEMENT ======== */
  const addVendor = useCallback((vendorData) => {
    const newVendor = {
      id: vendorData.id || `vendor-${Date.now()}`,
      name: vendorData.name || "Vendor",
      category: vendorData.category || "Supplier",
      phone: vendorData.phone || "",
      balanceDue: parseFloat(vendorData.balanceDue || 0),
      notes: vendorData.notes || "",
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
      name: skuData.name || "New Item",
      category: skuData.category || "Bowls",
      price: parseFloat(skuData.price || 0),
      costPrice: parseFloat(skuData.costPrice || 0),
      stock: parseInt(skuData.stock || 100),
      unit: skuData.unit || "bowl",
    };
    setSkus((prev) => [...prev, newSku]);
    return newSku;
  }, []);

  const updateSku = useCallback((id, updates) => {
    setSkus((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteSku = useCallback((id) => {
    setSkus((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /* ======== HELPERS & DATA RESET ======== */
  const getCategoryById = useCallback((id) => {
    const found = categories.find((c) => c.id === id);
    return found || { id, name: id || "Miscellaneous", icon: "🧾", color: "#64748b" };
  }, [categories]);

  const resetStallData = useCallback(async () => {
    setSales([]);
    setExpenses([]);
    setWastage([]);
    setClosures([]);
    setVendors([]);
    setSkus(DEFAULT_SKUS);
    setInventory(DEFAULT_INVENTORY);
    if (typeof window !== "undefined") {
      localStorage.removeItem("stall_app_sales");
      localStorage.removeItem("stall_app_expenses");
      localStorage.removeItem("stall_app_wastage");
      localStorage.removeItem("stall_app_closures");
      localStorage.removeItem("stall_app_vendors");
      localStorage.removeItem("stall_app_skus");
      localStorage.removeItem("stall_app_inventory");
    }
    await pushToCloudConfig({ sales: [], expenses: [], wastage: [], closures: [] });
  }, [pushToCloudConfig]);

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
    syncCloudData: fetchFromSupabase,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
