"use client";

import { useState } from "react";
import Header from "@/components/Header/Header";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function StaffPage() {
  const {
    role,
    managerPin,
    staffList,
    addStaff,
    deleteStaff,
    updateManagerPin,
    setRole,
    syncFromCloud,
    exportConfigCode,
    importConfigCode,
    getSyncLink,
  } = useAuth();
  const router = useRouter();

  // New Staff Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");

  // Change Manager PIN State
  const [newMasterPin, setNewMasterPin] = useState("");

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!name) return alert("Please enter employee name.");

    const created = addStaff({
      name,
      code: code || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      pin: pin || `${Math.floor(1000 + Math.random() * 9000)}`,
    });

    setName("");
    setCode("");
    setPin("");
    alert(`✅ Employee "${created.name}" added!\nReference Code: ${created.code}\nStaff PIN: ${created.pin}`);
  };

  const handleUpdateMasterPin = (e) => {
    e.preventDefault();
    const res = updateManagerPin(newMasterPin);
    if (res.success) {
      alert("✅ Manager Master PIN updated successfully!");
      setNewMasterPin("");
    } else {
      alert(res.error);
    }
  };

  const handleSwitchToEmployeeView = () => {
    setRole("employee");
    router.push("/sales");
  };

  if (role !== "manager") {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>🔒 Manager Access Required</h2>
        <p style={{ color: "var(--text-tertiary)" }}>This page is restricted to Stall Managers only.</p>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Staff & Access Control"
        subtitle="Manage employee reference codes, staff PINs & manager security"
        onMenuClick={() => {
          const event = new CustomEvent("toggle-sidebar");
          window.dispatchEvent(event);
        }}
      />

      <div className="responsive-container" style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
        {/* INFO BANNER */}
        <div className="card" style={{ padding: "20px 24px", borderRadius: "16px", marginBottom: "24px", background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))", border: "1px solid rgba(16,185,129,0.3)" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>💡 Free Local Staff Management</h3>
          <p style={{ margin: "6px 0 0 0", fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
            Employees only get access to **Daily Sales POS** and **Cash Logging**. They are strictly blocked from seeing your Accounts, Vendor Dues, Wastage Logs, SKUs, and Reports!
          </p>
        </div>

        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px" }}>
          {/* LEFT: ADD STAFF & CHANGE MASTER PIN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* ADD STAFF FORM */}
            <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.15rem" }}>Add Employee / Cashier</h3>
              <form onSubmit={handleAddStaff} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Staff Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rohan (Evening Shift)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Staff Code</label>
                    <input
                      type="text"
                      placeholder="e.g. EMP-103"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Staff PIN (4 digits)</label>
                    <input
                      type="text"
                      placeholder="e.g. 5555"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      maxLength={4}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontWeight: "bold" }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: "12px", borderRadius: "10px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer", marginTop: "4px" }}>
                  Create Staff Account
                </button>
              </form>
            </div>

            {/* CHANGE MASTER PIN */}
            <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "8px", fontSize: "1.1rem" }}>Manager Master PIN</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: 0, marginBottom: "14px" }}>
                Current Manager PIN: <strong style={{ color: "#10b981" }}>{managerPin}</strong>
              </p>
              <form onSubmit={handleUpdateMasterPin} style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="New PIN (min 4 digits)"
                  value={newMasterPin}
                  onChange={(e) => setNewMasterPin(e.target.value)}
                  maxLength={6}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontWeight: "bold" }}
                />
                <button type="submit" style={{ background: "var(--color-primary)", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                  Update
                </button>
              </form>
            </div>

            {/* SYNC ACCOUNTS & PINS (PC <-> PHONE) */}
            <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "6px", fontSize: "1.1rem" }}>📱 Sync PC & Phone Accounts</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: 0, marginBottom: "14px" }}>
                Sync staff accounts & Manager PIN across all devices via Supabase Cloud or a 1-click sync code.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    const link = getSyncLink();
                    navigator.clipboard.writeText(link);
                    alert("🔗 1-Click Sync Link copied! Send this link to your phone via WhatsApp/SMS to sync accounts in 1 tap.");
                  }}
                  style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}
                >
                  🔗 Copy 1-Click Sync Link (Send to Phone)
                </button>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={async () => {
                      await syncFromCloud();
                      alert("✅ Cloud Sync Complete! Fetched latest staff accounts and PINs.");
                    }}
                    style={{ flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    ☁️ Pull Cloud
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const code = exportConfigCode();
                      navigator.clipboard.writeText(code);
                      alert("📋 Sync Code copied to clipboard!");
                    }}
                    style={{ flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    📋 Copy Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const code = prompt("Paste the Sync Code copied from your PC:");
                      if (!code) return;
                      const res = importConfigCode(code);
                      if (res.success) {
                        alert("✅ Staff accounts and Manager PIN synced successfully on this device!");
                      } else {
                        alert(res.error);
                      }
                    }}
                    style={{ flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    📥 Import Code
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: ACTIVE STAFF LIST */}
          <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem" }}>Active Staff Members ({staffList.length})</h3>
              <button
                onClick={handleSwitchToEmployeeView}
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "6px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }}
              >
                🔒 Preview Cashier View
              </button>
            </div>

            {staffList.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {staffList.map((s) => (
                  <div
                    key={s.id}
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
                      <div style={{ fontSize: "1.5rem", background: "rgba(59,130,246,0.15)", padding: "10px", borderRadius: "12px" }}>
                        👨‍🍳
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>{s.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                          Ref Code: <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{s.code}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Staff PIN</div>
                        <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "#10b981" }}>{s.pin}</div>
                      </div>
                      <button
                        onClick={() => deleteStaff(s.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.1rem" }}
                        title="Remove Staff Access"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>
                No employees added yet. Create staff access on the left!
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
