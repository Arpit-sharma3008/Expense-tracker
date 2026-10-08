"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { loginAsManager, loginAsEmployee, managerPin, staffList, syncFromCloud, importConfigCode } = useAuth();
  const router = useRouter();
  const [loginRole, setLoginRole] = useState("manager"); // "manager" | "employee"

  const [inputPin, setInputPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleManagerLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await loginAsManager(inputPin);
    setSubmitting(false);
    if (res.success) {
      router.push("/");
    } else {
      setError(res.error);
    }
  };

  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await loginAsEmployee(inputPin);
    setSubmitting(false);
    if (res.success) {
      router.push("/sales");
      if (typeof window !== "undefined") {
        window.location.href = "/sales";
      }
    } else {
      setError(res.error);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-surface)",
      padding: "20px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "440px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-color)",
        borderRadius: "20px",
        padding: "32px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
      }}>
        {/* Logo Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "8px" }}>🏪</div>
          <h1 style={{ fontSize: "1.8rem", margin: "4px 0", background: "linear-gradient(135deg, #10b981, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>StallMaster</h1>
          <p style={{ color: "var(--text-tertiary)", margin: 0, fontSize: "0.9rem" }}>Money & Operations Tracking System</p>
        </div>

        {/* ROLE SELECTION TABS */}
        <div style={{ display: "flex", gap: "10px", background: "var(--bg-surface)", padding: "4px", borderRadius: "12px", marginBottom: "20px" }}>
          <button
            onClick={() => { setLoginRole("manager"); setError(""); setInputPin(""); }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: loginRole === "manager" ? "var(--color-primary)" : "transparent",
              color: loginRole === "manager" ? "#fff" : "var(--text-tertiary)",
              fontWeight: "600",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            👑 Manager Login
          </button>
          <button
            onClick={() => { setLoginRole("employee"); setError(""); setInputPin(""); }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: loginRole === "employee" ? "var(--color-primary)" : "transparent",
              color: loginRole === "employee" ? "#fff" : "var(--text-tertiary)",
              fontWeight: "600",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            👨‍🍳 Cashier / Staff
          </button>
        </div>

        {/* MANAGER LOGIN FORM */}
        {loginRole === "manager" && (
          <form onSubmit={handleManagerLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>
                Manager Master PIN
              </label>
              <input
                type="password"
                placeholder="Enter Manager PIN (Default: 1234)"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  fontSize: "1.1rem",
                  textAlign: "center",
                  letterSpacing: "4px",
                }}
              />
            </div>

            {error && <div style={{ color: "#ef4444", fontSize: "0.85rem", textAlign: "center", background: "#ef444415", padding: "10px", borderRadius: "8px" }}>{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: "14px", borderRadius: "10px", fontWeight: "bold", fontSize: "1rem", cursor: submitting ? "not-allowed" : "pointer" }}
            >
              {submitting ? "Verifying Credentials..." : "Unlock Manager Dashboard"}
            </button>

            {/* Forgot PIN / Reset Helper */}
            <div style={{ textAlign: "center", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => {
                  const newPin = prompt("🔑 Forgot Manager PIN?\nEnter a new 4-digit Manager PIN to set (Default is 1234):", "1234");
                  if (!newPin || newPin.trim().length < 4) {
                    if (newPin !== null) alert("PIN must be at least 4 digits!");
                    return;
                  }
                  const cleanPin = newPin.trim();
                  setInputPin(cleanPin);
                  alert(`🔑 Your Manager PIN is set to: ${cleanPin}\nClick 'Unlock Manager Dashboard' to log in.`);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3b82f6",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                ❓ Forgot Manager PIN? (Default: 1234)
              </button>
            </div>
          </form>
        )}

        {/* EMPLOYEE LOGIN FORM */}
        {loginRole === "employee" && (
          <form onSubmit={handleEmployeeLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontWeight: "600", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>
                Employee PIN or Reference Code
              </label>
              <input
                type="text"
                placeholder="e.g. 1111 or EMP-101"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  fontSize: "1.1rem",
                  textAlign: "center",
                }}
              />
            </div>

            {error && <div style={{ color: "#ef4444", fontSize: "0.85rem", textAlign: "center", background: "#ef444415", padding: "10px", borderRadius: "8px" }}>{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: "14px", borderRadius: "10px", fontWeight: "bold", fontSize: "1rem", cursor: submitting ? "not-allowed" : "pointer" }}
            >
              {submitting ? "Verifying Credentials..." : "Enter Cashier POS Terminal"}
            </button>

            {/* Hint Box */}
            <div style={{ background: "var(--bg-surface)", padding: "12px", borderRadius: "10px", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
              <strong>Pre-configured Staff PINs:</strong>
              <div>• Rahul (Cashier): PIN <code>1111</code> (Code: EMP-101)</div>
              <div>• Priya (Counter): PIN <code>2222</code> (Code: EMP-102)</div>
            </div>
          </form>
        )}

        {/* MANUAL SYNC TOOLBAR FOR PC <-> PHONE */}
        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px dashed var(--border-color)", textAlign: "center" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-tertiary)", marginBottom: "8px" }}>
            📱 Changed PINs or Accounts on PC?
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button
              type="button"
              onClick={async () => {
                setSubmitting(true);
                await syncFromCloud();
                setSubmitting(false);
                alert("✅ Cloud Sync Complete! Latest PINs and Employee Accounts loaded on this phone.");
              }}
              style={{
                flex: 1,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "8px 10px",
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ☁️ Sync from Cloud
            </button>
            <button
              type="button"
              onClick={() => {
                const code = prompt("Paste the Sync Code or 1-Click Link copied from your PC:");
                if (!code) return;
                const res = importConfigCode(code);
                if (res.success) {
                  alert("✅ Credentials & Employee PINs synced successfully on this phone!");
                } else {
                  alert(res.error);
                }
              }}
              style={{
                flex: 1,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "8px 10px",
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              📥 Paste Code / Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
