"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header/Header";
import { useData, RECIPES, PACKAGING_RATES } from "@/context/DataContext";

export default function InventoryPage() {
  const { inventory, updateInventoryItem, sales } = useData();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingKey, setEditingKey] = useState(null);
  const [editStock, setEditStock] = useState("");
  const [editCost, setEditCost] = useState("");

  const formatCurrency = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

  // Calculated Consumption metrics from total sales history
  const totalConsumption = useMemo(() => {
    const map = {};
    sales.forEach((s) => {
      const items = s.items || [];
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
            map[ing.key] = (map[ing.key] || 0) + (ing.qty * qty);
          });
        }
      });

      // Packaging
      const packType = s.packagingType || "dine_in";
      const packRate = PACKAGING_RATES[packType] || PACKAGING_RATES.dine_in;
      let bowlCount = 0;
      items.forEach((i) => {
        if (i.category === "Bowls" || i.id?.startsWith("sku-") || i.name?.toLowerCase().includes("bowl")) {
          bowlCount += (i.qty || 1);
        }
      });
      if (bowlCount > 0) {
        packRate.items.forEach((p) => {
          map[p.key] = (map[p.key] || 0) + (p.qty * bowlCount);
        });
      }
    });
    return map;
  }, [sales]);

  // Inventory list array
  const inventoryList = useMemo(() => {
    return Object.values(inventory || {}).map((item) => {
      const totalConsumed = totalConsumption[item.key] || 0;
      const totalValue = (item.stock || 0) * (item.costPerUnit || 0);
      return {
        ...item,
        totalConsumed: Math.round(totalConsumed * 100) / 100,
        totalValue,
      };
    });
  }, [inventory, totalConsumption]);

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventoryList.filter((item) => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesQuery = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [inventoryList, selectedCategory, searchQuery]);

  // Total Inventory Value
  const totalValuation = useMemo(() => {
    return inventoryList.reduce((sum, item) => sum + item.totalValue, 0);
  }, [inventoryList]);

  // Low Stock Items (Stock < threshold)
  const lowStockCount = useMemo(() => {
    return inventoryList.filter((item) => item.stock <= (item.unit === "pcs" ? 20 : 200)).length;
  }, [inventoryList]);

  const handleQuickAddStock = (key, currentStock) => {
    const addStr = prompt(`Enter quantity to add to current stock (${currentStock}):`);
    if (!addStr) return;
    const addQty = parseFloat(addStr);
    if (isNaN(addQty) || addQty <= 0) return alert("Invalid quantity.");

    updateInventoryItem(key, { stock: currentStock + addQty });
    alert(`✅ Added ${addQty} to stock!`);
  };

  const handleEditSave = (key) => {
    const s = parseFloat(editStock);
    const c = parseFloat(editCost);
    if (isNaN(s) || isNaN(c)) return alert("Invalid values.");
    updateInventoryItem(key, { stock: s, costPerUnit: c });
    setEditingKey(null);
  };

  return (
    <>
      <Header
        title="Raw Material & Inventory Tracking"
        subtitle="Recipe BOM consumption, live stock levels & cost management"
        onMenuClick={() => {
          const event = new CustomEvent("toggle-sidebar");
          window.dispatchEvent(event);
        }}
      />

      <div className="responsive-container" style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
        {/* STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div className="card" style={{ padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>Total Stock Valuation</div>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#10b981", margin: "4px 0" }}>{formatCurrency(totalValuation)}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Across {inventoryList.length} ingredient items</div>
          </div>

          <div className="card" style={{ padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.1))", border: "1px solid rgba(245,158,11,0.3)" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>Low Stock Alerts</div>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: lowStockCount > 0 ? "#ef4444" : "#10b981", margin: "4px 0" }}>{lowStockCount} Items</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{lowStockCount > 0 ? "Requires reordering soon" : "Stock healthy"}</div>
          </div>

          <div className="card" style={{ padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))", border: "1px solid rgba(139,92,246,0.3)" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>Recipe Tracking Status</div>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#8b5cf6", margin: "4px 0" }}>Automated</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Auto-deducts per bowl sold</div>
          </div>
        </div>

        {/* CONTROLS BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["All", "Grains", "Dairy", "Fruits", "Seeds & Nuts", "Sweeteners", "Add-ons", "Packaging"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: selectedCategory === cat ? "var(--color-primary)" : "var(--bg-elevated)",
                  color: selectedCategory === cat ? "#fff" : "var(--text-primary)",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="🔍 Search ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              minWidth: "200px",
            }}
          />
        </div>

        {/* INVENTORY TABLE CARD */}
        <div className="card" style={{ padding: "20px", borderRadius: "16px" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-tertiary)" }}>
                  <th style={{ padding: "12px" }}>Raw Material Item</th>
                  <th style={{ padding: "12px" }}>Category</th>
                  <th style={{ padding: "12px" }}>Current Stock</th>
                  <th style={{ padding: "12px" }}>Total Consumed</th>
                  <th style={{ padding: "12px" }}>Unit Cost (₹)</th>
                  <th style={{ padding: "12px" }}>Valuation (₹)</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const isLow = item.stock <= (item.unit === "pcs" ? 20 : 200);
                  const isEditing = editingKey === item.key;

                  return (
                    <tr key={item.key} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "12px", fontWeight: "600" }}>
                        {item.name} {isLow && <span style={{ fontSize: "0.75rem", background: "#ef444420", color: "#ef4444", padding: "2px 6px", borderRadius: "4px", marginLeft: "6px" }}>Low Stock</span>}
                      </td>
                      <td style={{ padding: "12px", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>{item.category}</td>
                      <td style={{ padding: "12px" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            style={{ width: "80px", padding: "4px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                          />
                        ) : (
                          <strong style={{ color: isLow ? "#ef4444" : "#10b981" }}>
                            {item.stock} {item.unit}
                          </strong>
                        )}
                      </td>
                      <td style={{ padding: "12px", color: "var(--text-tertiary)" }}>
                        {item.totalConsumed} {item.unit}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editCost}
                            onChange={(e) => setEditCost(e.target.value)}
                            style={{ width: "80px", padding: "4px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                          />
                        ) : (
                          <span>₹{item.costPerUnit}/{item.unit}</span>
                        )}
                      </td>
                      <td style={{ padding: "12px", fontWeight: "700" }}>{formatCurrency(item.totalValue)}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {isEditing ? (
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button onClick={() => handleEditSave(item.key)} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "0.8rem" }}>Save</button>
                            <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              onClick={() => handleQuickAddStock(item.key, item.stock)}
                              style={{ background: "var(--color-primary-subtle)", color: "var(--color-primary)", border: "1px solid var(--color-primary)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }}
                            >
                              + Add Stock
                            </button>
                            <button
                              onClick={() => {
                                setEditingKey(item.key);
                                setEditStock(item.stock);
                                setEditCost(item.costPerUnit);
                              }}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
                              title="Edit item stock & cost"
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
