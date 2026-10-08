"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header/Header";
import { useData, STALL_EXPENSE_CATEGORIES } from "@/context/DataContext";

export default function ExpensesPage() {
  const { expenses, addExpense, deleteExpense, getCategoryById, inventory } = useData();

  // Form State
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(STALL_EXPENSE_CATEGORIES[0].id);
  const [inventoryKey, setInventoryKey] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [vendorName, setVendorName] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptImage, setReceiptImage] = useState(null);

  // Filters
  const [filterCat, setFilterCat] = useState("all");
  const [activeModalImage, setActiveModalImage] = useState(null);

  const formatCurrency = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

  // Image Upload Reader
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount) return alert("Please provide title and amount.");

    await addExpense({
      title,
      amount: parseFloat(amount),
      categoryId,
      inventoryKey: inventoryKey || null,
      itemQty: itemQty ? parseFloat(itemQty) : null,
      date,
      paymentMethod,
      vendorName,
      receiptImage,
      notes,
    });

    setTitle("");
    setAmount("");
    setInventoryKey("");
    setItemQty("");
    setVendorName("");
    setNotes("");
    setReceiptImage(null);
    alert("✅ Expense & Bill Record Saved!");
  };

  const filteredExpenses = useMemo(() => {
    if (filterCat === "all") return expenses;
    return expenses.filter(e => e.categoryId === filterCat);
  }, [expenses, filterCat]);

  return (
    <>
      <Header
        title="Expenses & Bill Receipts"
        subtitle="Track stock, packaging, rent, utilities & attached bills"
        onMenuClick={() => {
          const event = new CustomEvent("toggle-sidebar");
          window.dispatchEvent(event);
        }}
      />

      <div className="responsive-container">
        <div className="responsive-grid">
          {/* LEFT: EXPENSE ENTRY FORM */}
          <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.15rem" }}>Log New Expense</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Item / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Milk 10 Litres, 5kg Oats"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 600"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
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
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                >
                  {STALL_EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Link to Raw Material Stock */}
              {(categoryId === "cat-ingredients" || categoryId === "cat-packaging") && (
                <div style={{ background: "rgba(16,185,129,0.08)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <label style={{ fontWeight: "700", fontSize: "0.85rem", display: "block", marginBottom: "6px", color: "#10b981" }}>
                    📦 Credit Raw Material Inventory Stock (Optional)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px" }}>
                    <select
                      value={inventoryKey}
                      onChange={(e) => setInventoryKey(e.target.value)}
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                    >
                      <option value="">-- Select Inventory Item --</option>
                      {Object.values(inventory || {}).map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.name} ({item.unit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder={inventoryKey ? `Qty in ${inventory[inventoryKey]?.unit}` : "Purchased Qty"}
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="UPI">📱 UPI / QR</option>
                    <option value="Card">💳 Card</option>
                    <option value="Vendor Credit">⏳ Pending Credit</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Vendor / Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Milk Depot"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              {/* Bill Photo Attachment */}
              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Attach Bill / Receipt Photo 📷</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                />
                {receiptImage && (
                  <div style={{ marginTop: "10px", position: "relative" }}>
                    <img src={receiptImage} alt="Receipt preview" style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "8px" }} />
                    <button type="button" onClick={() => setReceiptImage(null)} style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer" }}>✕</button>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Notes</label>
                <input
                  type="text"
                  placeholder="Optional details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: "12px", borderRadius: "10px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer", marginTop: "6px" }}>
                Save Expense & Bill
              </button>
            </form>
          </div>

          {/* RIGHT: EXPENSES LIST & BILL PREVIEWS */}
          <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem" }}>Expense Ledger ({filteredExpenses.length})</h3>
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.85rem" }}
              >
                <option value="all">All Categories</option>
                {STALL_EXPENSE_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            {filteredExpenses.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "580px", overflowY: "auto" }}>
                {filteredExpenses.map((exp) => {
                  const cat = getCategoryById(exp.categoryId);
                  return (
                    <div
                      key={exp.id}
                      style={{
                        display: "flex",
                        justify: "space-between",
                        alignItems: "center",
                        padding: "14px",
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "1.6rem", background: cat.color + "20", padding: "10px", borderRadius: "12px" }}>
                          {cat.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>{exp.title}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                            {cat.name} · {exp.date} · <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{exp.paymentMethod}</span>
                            {exp.vendorName && ` · Vendor: ${exp.vendorName}`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {exp.receiptImage && (
                          <button
                            onClick={() => setActiveModalImage(exp.receiptImage)}
                            style={{
                              background: "none",
                              border: "1px solid var(--color-primary)",
                              color: "var(--color-primary)",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            📷 View Bill
                          </button>
                        )}
                        <span style={{ fontWeight: "700", fontSize: "1.05rem", color: "#ef4444" }}>
                          {formatCurrency(exp.amount)}
                        </span>
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.1rem" }}
                          title="Delete expense"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>
                No expenses logged for this category.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULLSCREEN BILL PREVIEW MODAL */}
      {activeModalImage && (
        <div
          onClick={() => setActiveModalImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img src={activeModalImage} alt="Full bill receipt" style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "12px", objectFit: "contain" }} />
            <button
              onClick={() => setActiveModalImage(null)}
              style={{
                position: "absolute",
                top: "-15px",
                right: "-15px",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                fontSize: "1.2rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
