"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import AppShell from "@/components/AppShell/AppShell";
import LoginPage from "./login/page";

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
    const handleUnlock = () => {
      const pin = prompt("Enter Manager Master PIN to access this page (Default: 1234):");
      if (!pin) return;
      const res = loginAsManager(pin);
      if (res.success) {
        alert("✅ Manager Access Granted!");
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
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>{children}</AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
