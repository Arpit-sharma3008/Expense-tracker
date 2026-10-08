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
  oats: { key: "oats", name: "Oats", stock: 1000, unit: "g", costPerUnit: 0.12, category: "Grains" },
  muesli: { key: "muesli", name: "Muesli", stock: 1000, unit: "g", costPerUnit: 0.18, category: "Grains" },
  chocolate_powder: { key: "chocolate_powder", name: "Chocolate Powder", stock: 500, unit: "g", costPerUnit: 0.35, category: "Flavoring" },
  milk: { key: "milk", name: "Milk", stock: 5000, unit: "g", costPerUnit: 0.06, category: "Dairy" },
  apple: { key: "apple", name: "Apple", stock: 2000, unit: "g", costPerUnit: 0.10, category: "Fruits" },
  banana: { key: "banana", name: "Banana", stock: 50, unit: "pcs", costPerUnit: 4.00, category: "Fruits" },
  pomegranate: { key: "pomegranate", name: "Pomegranate", stock: 1000, unit: "g", costPerUnit: 0.22, category: "Fruits" },
  pumpkin_seeds: { key: "pumpkin_seeds", name: "Pumpkin Seeds", stock: 500, unit: "g", costPerUnit: 0.60, category: "Seeds & Nuts" },
  chia_seeds: { key: "chia_seeds", name: "Chia Seeds", stock: 500, unit: "g", costPerUnit: 0.50, category: "Seeds & Nuts" },
  sunflower_seeds: { key: "sunflower_seeds", name: "Sunflower Seeds", stock: 500, unit: "g", costPerUnit: 0.40, category: "Seeds & Nuts" },
  alsi: { key: "alsi", name: "Alsi (Flaxseeds)", stock: 500, unit: "g", costPerUnit: 0.25, category: "Seeds & Nuts" },
  almond_flakes: { key: "almond_flakes", name: "Almond Flakes", stock: 500, unit: "g", costPerUnit: 1.10, category: "Seeds & Nuts" },
  walnut_raw: { key: "walnut_raw", name: "Raw Walnut (Yield 49%)", stock: 500, unit: "g", costPerUnit: 0.95, category: "Seeds & Nuts" },
  honey: { key: "honey", name: "Honey", stock: 1000, unit: "g", costPerUnit: 0.40, category: "Sweeteners" },
  peanut_butter: { key: "peanut_butter", name: "Peanut Butter", stock: 1000, unit: "g", costPerUnit: 0.35, category: "Add-ons" },
  paper_bowl: { key: "paper_bowl", name: "Paper Bowl", stock: 200, unit: "pcs", costPerUnit: 3.50, category: "Packaging" },
  spoon: { key: "spoon", name: "Spoon", stock: 200, unit: "pcs", costPerUnit: 0.60, category: "Packaging" },
  packaging_box: { key: "packaging_box", name: "Packaging Box", stock: 100, unit: "pcs", costPerUnit: 5.00, category: "Packaging" },
  carry_bag: { key: "carry_bag", name: "Carry Bag", stock: 100, unit: "pcs", costPerUnit: 1.30, category: "Packaging" },
};

/* Helper for Local Storage Persistence */
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
  
  // Data State initialized with local storage fallbacks
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
  const latestStateRef = useRef({ sales, expenses, wastage, closures, skus, inventory, vendors });
  useEffect(() => {
    latestStateRef.current = { sales, expenses, wastage, closures, skus, inventory, vendors };
  }, [sales, expenses, wastage, closures, skus, inventory, vendors]);

  // Sync state changes to LocalStorage
  useEffect(() => saveLocal("sales", sales), [sales]);
  useEffect(() => saveLocal("expenses", expenses), [expenses]);
  useEffect(() => saveLocal("wastage", wastage), [wastage]);
  useEffect(() => saveLocal("closures", closures), [closures]);
  useEffect(() => saveLocal("vendors", vendors), [vendors]);
  useEffect(() => saveLocal("skus", skus), [skus]);
  useEffect(() => saveLocal("inventory", inventory), [inventory]);

  /* Push full store dataset to Supabase Cloud */
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
          skus: stateToPush.skus || DEFAULT_SKUS,
          inventory: stateToPush.inventory || DEFAULT_INVENTORY,
          vendors: stateToPush.vendors || [],
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.warn("Cloud push warning:", err);
    }
  }, []);

  /* Fetch directly from Supabase Cloud - CLOUD IS SINGLE SOURCE OF TRUTH */
  const fetchFromSupabase = useCallback(async (opts = {}) => {
    try {
      const configRes = await supabase.from("stall_config").select("*").eq("id", "default_stall");
      
      if (configRes.data && configRes.data.length > 0) {
        const cloudData = configRes.data[0].staff_list;
        
        if (cloudData && typeof cloudData === "object" && !Array.isArray(cloudData)) {
          // Cloud Data is present - Overwrite local state directly to eliminate stale entries
          if (Array.isArray(cloudData.sales)) {
            setSales(cloudData.sales);
          }
          if (Array.isArray(cloudData.expenses)) {
            setExpenses(cloudData.expenses);
          }
          if (Array.isArray(cloudData.wastage)) {
            setWastage(cloudData.wastage);
          }
          if (Array.isArray(cloudData.closures)) {
            setClosures(cloudData.closures);
          }
          if (Array.isArray(cloudData.skus) && cloudData.skus.length > 0) {
            setSkus(cloudData.skus);
          }
          if (cloudData.inventory && Object.keys(cloudData.inventory).length > 0) {
            setInventory(cloudData.inventory);
          }
          if (Array.isArray(cloudData.vendors)) {
            setVendors(cloudData.vendors);
          }
          return;
        }
      }

      // If Cloud has no payload yet, seed default store data to cloud
      pushToCloudConfig({
        sales: latestStateRef.current.sales,
        expenses: latestStateRef.current.expenses,
        wastage: latestStateRef.current.wastage,
        closures: latestStateRef.current.closures,
        skus: DEFAULT_SKUS,
        inventory: DEFAULT_INVENTORY,
        vendors: latestStateRef.current.vendors,
      });

    } catch (err) {
      console.warn("Supabase fetch warning:", err);
    } finally {
      setDataLoading(false);
    }
  }, [pushToCloudConfig]);

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
    
    let totalBowls = 0;
    items.forEach(i => {
      if (i.category === "Bowls" || i.id?.startsWith("sku-") || i.name?.toLowerCase().includes("bowl")) {
        totalBowls += (i.qty || 1);
      }
    });

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

    let nextInv = { ...latestStateRef.current.inventory };
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
    setInventory(nextInv);

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

    const nextSales = [newSale, ...latestStateRef.current.sales];
    setSales(nextSales);

    // Push immediately to Supabase Cloud
    await pushToCloudConfig({
      ...latestStateRef.current,
      sales: nextSales,
      inventory: nextInv,
    });

    return newSale;
  }, [pushToCloudConfig]);

  const deleteSale = useCallback(async (id) => {
    const nextSales = latestStateRef.current.sales.filter((s) => s.id !== id);
    setSales(nextSales);
    await pushToCloudConfig({
      ...latestStateRef.current,
      sales: nextSales,
    });
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

    let nextInv = { ...latestStateRef.current.inventory };
    if (itemKey && itemQty > 0) {
      const target = nextInv[itemKey] || { name: itemKey, stock: 0, unit: "g", costPerUnit: 0 };
      const newStock = (target.stock || 0) + itemQty;
      const newUnitCost = amount / itemQty;
      nextInv[itemKey] = {
        ...target,
        stock: newStock,
        costPerUnit: Math.round(newUnitCost * 100) / 100,
      };
      setInventory(nextInv);
    }

    const nextExpenses = [newExpense, ...latestStateRef.current.expenses];
    setExpenses(nextExpenses);

    await pushToCloudConfig({
      ...latestStateRef.current,
      expenses: nextExpenses,
      inventory: nextInv,
    });

    return newExpense;
  }, [pushToCloudConfig]);

  const deleteExpense = useCallback(async (id) => {
    const nextExpenses = latestStateRef.current.expenses.filter((e) => e.id !== id);
    setExpenses(nextExpenses);
    await pushToCloudConfig({
      ...latestStateRef.current,
      expenses: nextExpenses,
    });
  }, [pushToCloudConfig]);

  /* ======== INVENTORY MANAGEMENT ======== */
  const updateInventoryItem = useCallback((key, updates) => {
    const nextInv = {
      ...latestStateRef.current.inventory,
      [key]: {
        ...(latestStateRef.current.inventory[key] || { key, name: key, stock: 0, unit: "g", costPerUnit: 0 }),
        ...updates,
      },
    };
    setInventory(nextInv);
    pushToCloudConfig({
      ...latestStateRef.current,
      inventory: nextInv,
    });
  }, [pushToCloudConfig]);

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

    const nextWastage = [newWaste, ...latestStateRef.current.wastage];
    setWastage(nextWastage);

    await pushToCloudConfig({
      ...latestStateRef.current,
      wastage: nextWastage,
    });
    return newWaste;
  }, [pushToCloudConfig]);

  const deleteWastage = useCallback(async (id) => {
    const nextWastage = latestStateRef.current.wastage.filter((w) => w.id !== id);
    setWastage(nextWastage);
    await pushToCloudConfig({
      ...latestStateRef.current,
      wastage: nextWastage,
    });
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

    const nextClosures = [newClosure, ...latestStateRef.current.closures];
    setClosures(nextClosures);

    await pushToCloudConfig({
      ...latestStateRef.current,
      closures: nextClosures,
    });
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
    const nextVendors = [newVendor, ...latestStateRef.current.vendors];
    setVendors(nextVendors);

    pushToCloudConfig({
      ...latestStateRef.current,
      vendors: nextVendors,
    });
    return newVendor;
  }, [pushToCloudConfig]);

  const updateVendor = useCallback((id, updates) => {
    const nextVendors = latestStateRef.current.vendors.map((v) => (v.id === id ? { ...v, ...updates } : v));
    setVendors(nextVendors);
    pushToCloudConfig({
      ...latestStateRef.current,
      vendors: nextVendors,
    });
  }, [pushToCloudConfig]);

  const deleteVendor = useCallback((id) => {
    const nextVendors = latestStateRef.current.vendors.filter((v) => v.id !== id);
    setVendors(nextVendors);
    pushToCloudConfig({
      ...latestStateRef.current,
      vendors: nextVendors,
    });
  }, [pushToCloudConfig]);

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
    const nextSkus = [...latestStateRef.current.skus, newSku];
    setSkus(nextSkus);

    pushToCloudConfig({
      ...latestStateRef.current,
      skus: nextSkus,
    });
    return newSku;
  }, [pushToCloudConfig]);

  const updateSku = useCallback((id, updates) => {
    const nextSkus = latestStateRef.current.skus.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setSkus(nextSkus);
    pushToCloudConfig({
      ...latestStateRef.current,
      skus: nextSkus,
    });
  }, [pushToCloudConfig]);

  const deleteSku = useCallback((id) => {
    const nextSkus = latestStateRef.current.skus.filter((s) => s.id !== id);
    setSkus(nextSkus);
    pushToCloudConfig({
      ...latestStateRef.current,
      skus: nextSkus,
    });
  }, [pushToCloudConfig]);

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
    await pushToCloudConfig({ sales: [], expenses: [], wastage: [], closures: [], skus: DEFAULT_SKUS, inventory: DEFAULT_INVENTORY, vendors: [] });
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
