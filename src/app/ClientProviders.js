"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import AppShell from "@/components/AppShell/AppShell";
import LoginPage from "./login/page";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("StallMaster Exception Captured:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#090d16",
          color: "#fff",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🏪</div>
          <h2 style={{ margin: "0 0 10px 0", fontSize: "1.6rem" }}>StallMaster Temporary Load Issue</h2>
          <p style={{ color: "#94a3b8", maxWidth: "480px", fontSize: "0.95rem", marginBottom: "24px", lineHeight: "1.5" }}>
            {this.state.error?.message || "A client component error occurred while rendering the page."}
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => {
                if (typeof window !== "undefined") window.location.reload();
              }}
              style={{
                background: "linear-gradient(135deg, #10b981, #3b82f6)",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              🔄 Reload App
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.clear();
                  window.location.href = "/login";
                }
              }}
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "12px 24px",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              🧹 Clear Saved Cache & Reset
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthGate({ children }) {
  const { loading, role, loginAsManager } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Auto-redirect employee to POS Terminal (/sales) if trying to access manager route
  useEffect(() => {
    if (!loading && role === "employee" && pathname !== "/sales") {
      router.push("/sales");
    }
  }, [role, pathname, loading, router]);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "12px",
        color: "var(--text-tertiary)",
        fontSize: "14px",
      }}>
        <span className="spinner" />
        Loading StallMaster...
      </div>
    );
  }

  // Not logged in → render Login Screen
  if (!role) {
    return <LoginPage />;
  }

  // RESTRICTED EMPLOYEE ROUTE GUARD
  const isManagerRoute = pathname !== "/sales";
  if (role === "employee" && isManagerRoute) {
    const handleUnlock = async () => {
      const pin = prompt("Enter Manager Master PIN to access this page (Default: 1234):");
      if (!pin) return;
      const res = await loginAsManager(pin);
      if (res.success) {
        alert("✅ Manager Access Granted!");
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } else {
        alert(res.error);
      }
    };

    const handleGoToPOS = () => {
      router.push("/sales");
      if (typeof window !== "undefined") {
        window.location.href = "/sales";
      }
    };

    return (
      <DataProvider>
        <AppShell>
          <div style={{ padding: "40px", maxWidth: "500px", margin: "60px auto", textAlign: "center" }} className="card">
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🔒</div>
            <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Restricted Section</h2>
            <p style={{ color: "var(--text-tertiary)", fontSize: "0.9rem", margin: "10px 0 20px 0" }}>
              Employees do not have permission to view accounts, expenses, vendors, wastage logs, or reports.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/sales"
                onClick={handleGoToPOS}
                className="btn btn-primary"
                style={{ padding: "10px 20px", borderRadius: "10px", fontWeight: "bold", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
              >
                Go to POS Terminal
              </Link>
              <button
                onClick={handleUnlock}
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px 20px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}
              >
                Unlock with Manager PIN
              </button>
            </div>
          </div>
        </AppShell>
      </DataProvider>
    );
  }

  return (
    <DataProvider>
      <AppShell>{children}</AppShell>
    </DataProvider>
  );
}

export default function ClientProviders({ children }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
