"use client";

import { useState } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";

export default function MenuPage() {
  const { skus, addSku, updateSku, deleteSku } = useData();

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Beverages");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [unit, setUnit] = useState("pc");

  // Editing modal / inline state
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  const formatCurrency = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !price) return alert("Please fill in item name and selling price.");

    addSku({
      code: code || `SKU-${Math.floor(100 + Math.random() * 900)}`,
      name,
      category,
      price: parseFloat(price),
      costPrice: parseFloat(costPrice) || 0,
      unit,
    });

    setCode("");
    setName("");
    setPrice("");
    setCostPrice("");
    alert("✅ New Menu SKU Item Added!");
  };

  const handleEditPriceSave = (id) => {
    const p = parseFloat(editPrice);
    if (isNaN(p) || p < 0) return alert("Invalid price.");
    updateSku(id, { price: p });
    setEditingId(null);
  };

  return (
    <>
      <Header
        title="Menu & SKU Price Catalog"
        subtitle="Configure stall menu items, selling prices & cost prices"
        onMenuClick={() => {
          const event = new CustomEvent("toggle-sidebar");
          window.dispatchEvent(event);
        }}
      />

      <div className="responsive-container" style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px" }}>
          {/* ADD SKU FORM */}
          <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.15rem" }}>Add New Menu SKU Item</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Special Cutting Chai, Paneer Roll"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>SKU Code</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                  >
                    <option value="Beverages">☕ Beverages</option>
                    <option value="Snacks">🍿 Snacks</option>
                    <option value="Meals">🍱 Meals / Combos</option>
                    <option value="Desserts">🍨 Desserts & Ice Cream</option>
                    <option value="Packaged">🥤 Packaged Drinks</option>
                  </select>
                </div>
              </div>

              <div className="responsive-grid-equal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "10px" }}>
                <div>
                  <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Selling Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="1"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontWeight: "bold" }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Cost Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 18"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    min="0"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                  >
                    <option value="pc">Piece (pc)</option>
                    <option value="cup">Cup</option>
                    <option value="plate">Plate</option>
                    <option value="bottle">Bottle</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: "12px", borderRadius: "10px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer", marginTop: "8px" }}>
                Add SKU Item
              </button>
            </form>
          </div>

          {/* MENU CATALOG LIST */}
          <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.15rem" }}>Stall Menu Catalog ({skus.length} SKUs)</h3>
            {skus.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "550px", overflowY: "auto" }}>
                {skus.map((sku) => {
                  const profitMargin = sku.price > 0 && sku.costPrice > 0 ? Math.round(((sku.price - sku.costPrice) / sku.price) * 100) : null;
                  return (
                    <div
                      key={sku.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "12px",
                        padding: "14px",
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "1.5rem", background: "var(--color-primary-subtle)", padding: "10px", borderRadius: "12px" }}>
                          🍱
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                            {sku.name} <span style={{ fontSize: "0.75rem", background: "var(--border-color)", padding: "2px 6px", borderRadius: "4px" }}>{sku.code}</span>
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                            Category: {sku.category} · Unit: {sku.unit}
                            {profitMargin !== null && <span style={{ color: "#10b981", marginLeft: "6px" }}>({profitMargin}% Margin)</span>}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {editingId === sku.id ? (
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              style={{ width: "70px", padding: "6px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "#fff", color: "#000" }}
                            />
                            <button onClick={() => handleEditPriceSave(sku.id)} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 10px", cursor: "pointer" }}>Save</button>
                            <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}>Cancel</button>
                          </div>
                        ) : (
                          <>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: "700", fontSize: "1.1rem", color: "#10b981" }}>
                                {formatCurrency(sku.price)}
                              </div>
                              {sku.costPrice > 0 && <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Cost: {formatCurrency(sku.costPrice)}</div>}
                            </div>
                            <button
                              onClick={() => { setEditingId(sku.id); setEditPrice(sku.price); }}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                              title="Edit price"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteSku(sku.id)}
                              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.1rem" }}
                              title="Delete SKU"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>
                No SKUs configured yet. Add your menu items above!
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
