"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";

export default function WastagePage() {
  const { wastage, addWastage, deleteWastage } = useData();

  // Form State
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [reason, setReason] = useState("Spoiled/Expired");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const formatCurrency = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName || !quantity || !estimatedCost) return alert("Please fill in item name, quantity, and cost.");

    await addWastage({
      itemName,
      quantity: parseFloat(quantity),
      unit,
      estimatedCost: parseFloat(estimatedCost),
      reason,
      date,
      notes,
    });

    setItemName("");
    setQuantity("");
    setEstimatedCost("");
    setNotes("");
    alert("✅ Wastage / Spoilage Loss Recorded!");
  };

  const totalWastageCost = useMemo(() => {
    return wastage.reduce((sum, item) => sum + item.estimatedCost, 0);
  }, [wastage]);

  return (
    <>
      <Header
        title="Wastage & Spoilage Tracker"
        subtitle="Log spoiled ingredients, burnt food, or unsold night items"
        onMenuClick={() => {
          const event = new CustomEvent("toggle-sidebar");
          window.dispatchEvent(event);
        }}
      />

      <div className="responsive-container">
        {/* Total Wastage Loss Banner */}
        <div className="card" style={{ padding: "20px 24px", borderRadius: "16px", marginBottom: "24px", background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.1))", border: "1px solid rgba(239,68,68,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Total Spoilage Monetary Loss</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>Keep food wastage under 3-5% of total sales revenue!</span>
          </div>
          <span style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ef4444" }}>
            {formatCurrency(totalWastageCost)}
          </span>
        </div>

        <div className="responsive-grid">
          {/* FORM */}
          <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.15rem" }}>Log Wastage Event</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Wasted Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ruined Milk, Unsold Burgers, Burnt Fries"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Quantity</label>
                  <input
                    type="number"
                    placeholder="e.g. 3"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    min="0.1"
                    step="any"
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
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="litres">Litres (L)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="packets">Packets</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Estimated Loss Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 180"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    required
                    min="1"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontWeight: "bold" }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Reason for Wastage</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                >
                  <option value="Spoiled/Expired">🥛 Spoiled / Expired</option>
                  <option value="Burnt/Prep Error">🔥 Burnt / Prep Failure</option>
                  <option value="Unsold Night End">🌙 Unsold End-of-Day Food</option>
                  <option value="Damaged Packaging">📦 Damaged / Dropped</option>
                </select>
              </div>

              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Notes / Preventive Measures</label>
                <input
                  type="text"
                  placeholder="e.g. Fridge temperature was low"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: "12px", borderRadius: "10px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer", marginTop: "6px" }}>
                Record Wastage Loss
              </button>
            </form>
          </div>

          {/* LEDGER */}
          <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.15rem" }}>Wastage Log History ({wastage.length})</h3>
            {wastage.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "540px", overflowY: "auto" }}>
                {wastage.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ fontSize: "1.5rem", background: "#f59e0b20", padding: "8px 10px", borderRadius: "10px" }}>
                        🗑️
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                          {w.itemName} <span style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>({w.quantity} {w.unit})</span>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                          {w.reason} · {w.date} {w.notes && `· ${w.notes}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontWeight: "700", fontSize: "1rem", color: "#f59e0b" }}>
                        {formatCurrency(w.estimatedCost)}
                      </span>
                      <button
                        onClick={() => deleteWastage(w.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.1rem" }}
                        title="Delete log"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>
                No wastage items recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
