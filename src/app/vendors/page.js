"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";

export default function VendorsPage() {
  const { vendors, addVendor, updateVendor, deleteVendor } = useData();

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("Dairy & Milk");
  const [pendingAmount, setPendingAmount] = useState("");
  const [notes, setNotes] = useState("");

  const formatCurrency = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return alert("Please enter vendor name.");

    addVendor({
      name,
      phone,
      category,
      pendingAmount: parseFloat(pendingAmount) || 0,
      notes,
    });

    setName("");
    setPhone("");
    setPendingAmount("");
    setNotes("");
    alert("✅ Vendor Contact Added!");
  };

  const handlePayVendor = (id, currentDues) => {
    const payStr = prompt(`Enter amount paid to settle dues (Current Pending Dues: ₹${currentDues}):`);
    if (!payStr) return;
    const payAmt = parseFloat(payStr);
    if (isNaN(payAmt) || payAmt <= 0) return alert("Invalid amount.");

    const newDues = Math.max(0, currentDues - payAmt);
    updateVendor(id, { pendingAmount: newDues });
    alert(`Payment recorded! Remaining Dues: ₹${newDues}`);
  };

  const totalDues = useMemo(() => {
    return vendors.reduce((sum, v) => sum + (v.pendingAmount || 0), 0);
  }, [vendors]);

  return (
    <>
      <Header
        title="Vendors & Supplier Dues"
        subtitle="Manage supplier contacts & pending credit accounts payable"
        onMenuClick={() => {
          const event = new CustomEvent("toggle-sidebar");
          window.dispatchEvent(event);
        }}
      />

      <div className="responsive-container" style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
        {/* Total Dues Banner */}
        <div className="card" style={{ padding: "20px 24px", borderRadius: "16px", marginBottom: "24px", background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))", border: "1px solid rgba(59,130,246,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Total Pending Vendor Dues</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>Accounts Payable to suppliers</span>
          </div>
          <span style={{ fontSize: "1.8rem", fontWeight: "800", color: "#3b82f6" }}>
            {formatCurrency(totalDues)}
          </span>
        </div>

        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px" }}>
          {/* ADD VENDOR FORM */}
          <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.15rem" }}>Add Supplier Contact</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Supplier / Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Laxmi Milk Depot, Star Bakery"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Supplies Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                >
                  <option value="Dairy & Milk">🥛 Dairy & Milk</option>
                  <option value="Vegetables & Grocery">🥦 Vegetables & Groceries</option>
                  <option value="Bakery & Buns">🍞 Bakery & Buns</option>
                  <option value="Packaging & Disposable">📦 Packaging & Cups</option>
                  <option value="Beverages & Syrups">🥤 Beverages & Syrups</option>
                  <option value="Gas & Utilities">⚡ Gas & Power</option>
                  <option value="General">🌀 General Supplies</option>
                </select>
              </div>

              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Initial Pending Balance (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={pendingAmount}
                  onChange={(e) => setPendingAmount(e.target.value)}
                  min="0"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Notes</label>
                <input
                  type="text"
                  placeholder="Payment terms, UPI ID..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: "12px", borderRadius: "10px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer", marginTop: "6px" }}>
                Add Supplier
              </button>
            </form>
          </div>

          {/* VENDORS LIST */}
          <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.15rem" }}>Suppliers Directory ({vendors.length})</h3>
            {vendors.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "550px", overflowY: "auto" }}>
                {vendors.map((v) => (
                  <div
                    key={v.id}
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
                        🏢
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>{v.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                          {v.category} {v.phone && `· 📞 ${v.phone}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Pending Dues</div>
                        <div style={{ fontWeight: "700", fontSize: "1.05rem", color: v.pendingAmount > 0 ? "#ef4444" : "#10b981" }}>
                          {formatCurrency(v.pendingAmount || 0)}
                        </div>
                      </div>
                      {v.pendingAmount > 0 && (
                        <button
                          onClick={() => handlePayVendor(v.id, v.pendingAmount)}
                          style={{
                            background: "var(--color-primary)",
                            color: "#fff",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          Pay Dues
                        </button>
                      )}
                      <button
                        onClick={() => deleteVendor(v.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.1rem" }}
                        title="Delete supplier"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>
                No vendor contacts added yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
