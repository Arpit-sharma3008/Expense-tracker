"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import AppShell from "@/components/AppShell/AppShell";
import LoginPage from "./login/page";

function AuthGate({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "12px",
        color: "var(--text-tertiary)",
        fontSize: "var(--font-size-sm)",
      }}>
        <span className="spinner" />
        Loading SpendWise...
      </div>
    );
  }

  // Not logged in → show login page
  if (!user) {
    return <LoginPage />;
  }

  // Logged in → show app
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
