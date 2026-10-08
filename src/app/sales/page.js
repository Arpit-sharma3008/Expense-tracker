"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header/Header";
import { useData } from "@/context/DataContext";
import styles from "./sales.module.css";

export default function SalesPage() {
  const { sales, skus, addSale, deleteSale } = useData();

  // Mode: "pos" or "summary"
  const [entryMode, setEntryMode] = useState("pos");

  /* ---- POS Cart State ---- */
  const [cart, setCart] = useState([]);
  const [packagingType, setPackagingType] = useState("dine_in"); // "dine_in" | "parcel"
  const [posPayMethod, setPosPayMethod] = useState("UPI"); // "UPI", "Cash", "Card"
  const [posCustomerCount, setPosCustomerCount] = useState(1);
  const [posNotes, setPosNotes] = useState("");

  /* ---- Summary Entry State ---- */
  const [summaryTotal, setSummaryTotal] = useState("");
  const [summaryCash, setSummaryCash] = useState("");
  const [summaryUpi, setSummaryUpi] = useState("");
  const [summaryCard, setSummaryCard] = useState("");
  const [summaryCustomers, setSummaryCustomers] = useState("1");
  const [summaryDate, setSummaryDate] = useState(new Date().toISOString().split("T")[0]);
  const [summaryNotes, setSummaryNotes] = useState("");

  const formatCurrency = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

  /* ---- POS Helpers ---- */
  const addToCart = (sku) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.skuId === sku.id);
      if (existing) {
        return prev.map((item) =>
          item.skuId === sku.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { skuId: sku.id, name: sku.name, price: sku.price, qty: 1 }];
    });
  };

  const removeFromCart = (skuId) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.skuId === skuId);
      if (!existing) return prev;
      if (existing.qty === 1) {
        return prev.filter((item) => item.skuId !== skuId);
      }
      return prev.map((item) =>
        item.skuId === skuId ? { ...item, qty: item.qty - 1 } : item
      );
    });
  };

  const clearCart = () => setCart([]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const totalCartQty = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const handlePOSSubmit = async () => {
    if (cart.length === 0) return alert("Please select at least 1 item to record a sale.");

    const total = cartTotal;
    let cash = 0, upi = 0, card = 0;
    if (posPayMethod === "Cash") cash = total;
    else if (posPayMethod === "UPI") upi = total;
    else if (posPayMethod === "Card") card = total;

    await addSale({
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      totalAmount: total,
      cashAmount: cash,
      upiAmount: upi,
      cardAmount: card,
      customerCount: posCustomerCount,
      packagingType,
      items: cart,
      notes: posNotes,
    });

    clearCart();
    setPosNotes("");
    alert("✅ Sales Order Recorded!");
  };

  /* ---- Summary Entry Submit ---- */
  const handleSummarySubmit = async (e) => {
    e.preventDefault();
    const total = parseFloat(summaryTotal) || 0;
    const cash = parseFloat(summaryCash) || 0;
    const upi = parseFloat(summaryUpi) || 0;
    const card = parseFloat(summaryCard) || 0;

    if (total <= 0) return alert("Please enter a valid total sales amount.");

    let finalCash = cash, finalUpi = upi, finalCard = card;
    if (cash === 0 && upi === 0 && card === 0) {
      finalUpi = total;
    }

    await addSale({
      date: summaryDate,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      totalAmount: total,
      cashAmount: finalCash,
      upiAmount: finalUpi,
      cardAmount: finalCard,
      customerCount: parseInt(summaryCustomers) || 1,
      items: [],
      notes: summaryNotes,
    });

    setSummaryTotal("");
    setSummaryCash("");
    setSummaryUpi("");
    setSummaryCard("");
    setSummaryNotes("");
    alert("✅ Daily Summary Sale Recorded!");
  };

  const scrollToCart = () => {
    const el = document.getElementById("cartDrawerSection");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Header
        title="Daily Sales & POS"
        subtitle="Quick order tapping & daily sales logging"
        onMenuClick={() => {
          const event = new CustomEvent("toggle-sidebar");
          window.dispatchEvent(event);
        }}
      />

      <div className={styles.salesContainer}>
        {/* Mode Selector Tabs */}
        <div className={styles.modeTabs}>
          <button
            onClick={() => setEntryMode("pos")}
            className={`${styles.tabBtn} ${entryMode === "pos" ? styles.tabActive : styles.tabInactive}`}
          >
            ⚡ Quick POS Grid
          </button>
          <button
            onClick={() => setEntryMode("summary")}
            className={`${styles.tabBtn} ${entryMode === "summary" ? styles.tabActive : styles.tabInactive}`}
          >
            📝 Bulk Sales Entry
          </button>
        </div>

        {/* MODE A: INTERACTIVE POS GRID */}
        {entryMode === "pos" && (
          <div className={styles.posLayout}>
            {/* Left: Menu Items Tap Grid */}
            <div className="card" style={{ padding: "16px", borderRadius: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>Tap Menu Items to Sell</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>{skus.length} SKUs</span>
              </div>

              {skus.length > 0 ? (
                <div className={styles.skuGrid}>
                  {skus.map((sku) => {
                    const cartItem = cart.find((i) => i.skuId === sku.id);
                    return (
                      <button
                        key={sku.id}
                        onClick={() => addToCart(sku)}
                        className={`${styles.skuCard} ${cartItem ? styles.skuCardActive : ""}`}
                      >
                        {cartItem && (
                          <span className={styles.skuBadge}>
                            {cartItem.qty}
                          </span>
                        )}
                        <span style={{ fontSize: "1.6rem", marginBottom: "4px" }}>🍱</span>
                        <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "4px", lineHeight: "1.2" }}>
                          {sku.name}
                        </span>
                        <span style={{ fontSize: "0.9rem", color: "#10b981", fontWeight: "700" }}>
                          {formatCurrency(sku.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-tertiary)", fontSize: "0.9rem" }}>
                  No SKUs configured. Go to Menu & SKUs tab to add items!
                </div>
              )}
            </div>

            {/* Right: Live Cart & Payment Section */}
            <div id="cartDrawerSection" className={`card ${styles.cartDrawer}`}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>Current Order</h3>
                  {cart.length > 0 && (
                    <button onClick={clearCart} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.85rem", cursor: "pointer", fontWeight: "600" }}>
                      Clear
                    </button>
                  )}
                </div>

                {cart.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto", marginBottom: "14px" }}>
                    {cart.map((item) => (
                      <div key={item.skuId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-elevated)", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "0.85rem" }}>{item.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{formatCurrency(item.price)} each</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button onClick={() => removeFromCart(item.skuId)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}>-</button>
                          <span style={{ fontWeight: "700", fontSize: "0.9rem", minWidth: "16px", textAlign: "center" }}>{item.qty}</span>
                          <button onClick={() => addToCart({ id: item.skuId, name: item.name, price: item.price })} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "24px 10px", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
                    Tap items above to build customer order.
                  </div>
                )}

                {/* Packaging Option Selector */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>Order Packaging</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setPackagingType("dine_in")}
                      style={{
                        flex: 1,
                        padding: "8px 6px",
                        borderRadius: "8px",
                        border: packagingType === "dine_in" ? "2px solid #10b981" : "1px solid var(--border-color)",
                        background: packagingType === "dine_in" ? "rgba(16,185,129,0.15)" : "var(--bg-elevated)",
                        color: "var(--text-primary)",
                        fontWeight: "700",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      🍽️ Dine-In (Paper Bowl)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPackagingType("parcel")}
                      style={{
                        flex: 1,
                        padding: "8px 6px",
                        borderRadius: "8px",
                        border: packagingType === "parcel" ? "2px solid #3b82f6" : "1px solid var(--border-color)",
                        background: packagingType === "parcel" ? "rgba(59,130,246,0.15)" : "var(--bg-elevated)",
                        color: "var(--text-primary)",
                        fontWeight: "700",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      🛍️ Parcel (+₹6.90 Pack)
                    </button>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>Payment Method</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {["UPI", "Cash", "Card"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPosPayMethod(m)}
                        style={{
                          flex: 1,
                          padding: "10px 6px",
                          borderRadius: "8px",
                          border: posPayMethod === m ? "2px solid var(--color-primary)" : "1px solid var(--border-color)",
                          background: posPayMethod === m ? "var(--color-primary-subtle)" : "var(--bg-elevated)",
                          color: "var(--text-primary)",
                          fontWeight: "700",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        {m === "UPI" ? "📱 UPI/QR" : m === "Cash" ? "💵 Cash" : "💳 Card"}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>Order Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Parcel, Extra spicy"
                    value={posNotes}
                    onChange={(e) => setPosNotes(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px dashed var(--border-color)", marginBottom: "12px" }}>
                  <span style={{ fontSize: "1rem", fontWeight: "600" }}>Total Amount</span>
                  <span style={{ fontSize: "1.4rem", fontWeight: "800", color: "#10b981" }}>{formatCurrency(cartTotal)}</span>
                </div>
                <button
                  onClick={handlePOSSubmit}
                  disabled={cart.length === 0}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "1rem", fontWeight: "700", cursor: cart.length === 0 ? "not-allowed" : "pointer" }}
                >
                  Confirm & Complete Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MOBILE BOTTOM FLOATING CART SUMMARY (Shows when cart has items on phone) */}
        {entryMode === "pos" && cart.length > 0 && (
          <div className={styles.mobileStickyCart}>
            <div>
              <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>{totalCartQty} Items Selected</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#10b981" }}>{formatCurrency(cartTotal)}</div>
            </div>
            <button
              onClick={scrollToCart}
              style={{
                background: "var(--color-primary)",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Checkout Now ↓
            </button>
          </div>
        )}

        {/* MODE B: BULK SUMMARY ENTRY */}
        {entryMode === "summary" && (
          <div className="card" style={{ padding: "20px", borderRadius: "16px", maxWidth: "600px", margin: "0 auto" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.1rem" }}>Record Daily Total Sales</h3>
            <form onSubmit={handleSummarySubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Date</label>
                <input
                  type="date"
                  value={summaryDate}
                  onChange={(e) => setSummaryDate(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Total Daily Sales Revenue (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 4500"
                  value={summaryTotal}
                  onChange={(e) => setSummaryTotal(e.target.value)}
                  required
                  min="1"
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "1.1rem", fontWeight: "bold" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>Cash Sales (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={summaryCash}
                    onChange={(e) => setSummaryCash(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>UPI / QR (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={summaryUpi}
                    onChange={(e) => setSummaryUpi(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>Card (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={summaryCard}
                    onChange={(e) => setSummaryCard(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Customer Count</label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={summaryCustomers}
                  onChange={(e) => setSummaryCustomers(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Notes / Remarks</label>
                <textarea
                  placeholder="e.g. Rush hour evening"
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  rows="2"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: "12px", borderRadius: "10px", fontSize: "0.95rem", fontWeight: "bold", cursor: "pointer" }}>
                Save Daily Summary
              </button>
            </form>
          </div>
        )}

        {/* SALES HISTORY TABLE */}
        <div className="card" style={{ marginTop: "24px", padding: "16px", borderRadius: "16px" }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: "1.05rem" }}>Sales History Ledger</h3>
          {sales.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-tertiary)" }}>
                    <th style={{ padding: "8px" }}>Date & Time</th>
                    <th style={{ padding: "8px" }}>Items / Notes</th>
                    <th style={{ padding: "8px" }}>Payment</th>
                    <th style={{ padding: "8px" }}>Total</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "10px 8px", fontWeight: "600", whiteSpace: "nowrap" }}>
                        {s.date} <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{s.time}</div>
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        {s.items && s.items.length > 0 ? (
                          <span>{s.items.map(i => `${i.name} x${i.qty}`).join(", ")}</span>
                        ) : (
                          <span style={{ color: "var(--text-tertiary)" }}>Bulk Entry</span>
                        )}
                        {s.notes && <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Note: {s.notes}</div>}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {s.upiAmount > 0 && <span style={{ background: "#10b98120", color: "#10b981", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>UPI ₹{s.upiAmount}</span>}
                          {s.cashAmount > 0 && <span style={{ background: "#f59e0b20", color: "#f59e0b", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>Cash ₹{s.cashAmount}</span>}
                          {s.cardAmount > 0 && <span style={{ background: "#3b82f620", color: "#3b82f6", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>Card ₹{s.cardAmount}</span>}
                        </div>
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: "700", color: "#10b981", fontSize: "0.95rem", whiteSpace: "nowrap" }}>
                        {formatCurrency(s.totalAmount)}
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>
                        <button
                          onClick={() => deleteSale(s.id)}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1rem" }}
                          title="Delete record"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
              No sales recorded yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
